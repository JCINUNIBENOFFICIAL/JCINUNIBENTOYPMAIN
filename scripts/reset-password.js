import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const config = window.APP_CONFIG;
const message = document.getElementById('message');
const requestForm = document.getElementById('request-form');
const updateForm = document.getElementById('update-form');
const requestButton = document.getElementById('request-button');
const updateButton = document.getElementById('update-button');
const supabase = config?.SUPABASE_URL && config?.SUPABASE_ANON_KEY
  ? createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY)
  : null;

function notify(text, type = 'error') {
  message.textContent = text;
  message.className = 'message show ' + type;
}
function showUpdateForm() {
  requestForm.classList.add('hidden');
  updateForm.classList.remove('hidden');
  document.getElementById('page-title').textContent = 'Choose a new password';
  document.getElementById('page-description').textContent = 'Enter and confirm your new password below.';
}

if (!supabase) {
  notify('The password reset service is not configured. Please contact the TOYP team.');
  requestForm.classList.add('hidden');
} else {
  const { data: { session } } = await supabase.auth.getSession();
  const isRecoveryLink = new URLSearchParams(window.location.search).get('mode') === 'update';
  if (session && isRecoveryLink) showUpdateForm();

  supabase.auth.onAuthStateChange((event, sessionNow) => {
    if (event === 'PASSWORD_RECOVERY' && sessionNow) showUpdateForm();
  });
}

requestForm?.addEventListener('submit', async event => {
  event.preventDefault();
  if (!supabase) return;
  requestButton.disabled = true;
  requestButton.textContent = 'Sending…';
  const email = document.getElementById('email').value.trim();
  try {
    const redirectTo = window.location.origin + window.location.pathname + '?mode=update';
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) throw error;
    notify('If an account exists for that email, a password reset link has been sent. Please check your inbox.', 'success');
  } catch (error) {
    notify(error.message || 'Unable to send the reset link. Please try again.');
  } finally {
    requestButton.disabled = false;
    requestButton.textContent = 'Send reset link';
  }
});

updateForm?.addEventListener('submit', async event => {
  event.preventDefault();
  if (!supabase) return;
  const password = document.getElementById('new-password').value;
  const confirm = document.getElementById('confirm-password').value;
  if (password.length < 8) return notify('Use a password with at least 8 characters.');
  if (password !== confirm) return notify('The passwords do not match.');
  updateButton.disabled = true;
  updateButton.textContent = 'Updating…';
  try {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
    notify('Your password has been updated. You can now sign in to the nominee portal.', 'success');
    updateForm.reset();
  } catch (error) {
    notify(error.message || 'Unable to update your password. Request a new reset link and try again.');
  } finally {
    updateButton.disabled = false;
    updateButton.textContent = 'Update password';
  }
});
