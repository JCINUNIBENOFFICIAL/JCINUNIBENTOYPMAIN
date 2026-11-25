import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const config = window.APP_CONFIG;
const message = document.getElementById('message');
const form = document.getElementById('login-form');
const panel = document.getElementById('profile-panel');
const loginButton = document.getElementById('login-button');
const supabase = config?.SUPABASE_URL && config?.SUPABASE_ANON_KEY
  ? createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY)
  : null;

function notify(text, type = 'error') {
  message.textContent = text;
  message.className = 'message show ' + type;
}
function put(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value == null || value === '' ? 'Not provided' : String(value);
}

async function showProfile(user) {
  form.classList.add('hidden');
  panel.classList.remove('hidden');
  put('profile-email', user.email);
  put('profile-name', user.user_metadata?.full_name || user.user_metadata?.name);

  const { data, error } = await supabase
    .from('nominations')
    .select('nominee_name, category, faculty, department, level, status')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Could not load linked nominee information:', error);
    notify('You are signed in, but your nominee record could not be loaded. Please contact the TOYP team for assistance.', 'error');
    return;
  }
  if (!data) {
    notify('Your account is active, but no nominee record is linked yet. Please contact the TOYP team to complete account linking.', 'error');
    return;
  }
  put('profile-name', data.nominee_name);
  put('profile-category', data.category);
  put('profile-faculty', data.faculty);
  put('profile-department', data.department);
  put('profile-level', data.level);
  put('profile-status', data.status);
  notify('You are signed in. Your finalist information is shown below.', 'success');
}

if (!supabase) {
  notify('The portal is not configured. Please contact the TOYP team.', 'error');
  form.classList.add('hidden');
} else {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user) await showProfile(session.user);
}

form?.addEventListener('submit', async event => {
  event.preventDefault();
  if (!supabase) return;
  loginButton.disabled = true;
  loginButton.textContent = 'Signing in…';
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    await showProfile(data.user);
  } catch (error) {
    notify(error.message || 'Unable to sign in. Check your details and try again.', 'error');
  } finally {
    loginButton.disabled = false;
    loginButton.textContent = 'Sign in';
  }
});

document.getElementById('signout-button')?.addEventListener('click', async () => {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) {
    notify(error.message, 'error');
    return;
  }
  panel.classList.add('hidden');
  form.classList.remove('hidden');
  form.reset();
  notify('You have signed out.', 'success');
});
