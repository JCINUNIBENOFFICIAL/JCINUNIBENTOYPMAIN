/**
 * accept-invitation.js
 * Handles invitation verification and account creation for TOYP UNIBEN finalists.
 * Uses a secure Edge Function to create the user server-side.
 */

// ============================================================
// CONFIGURATION – loaded from window.APP_CONFIG (config.js)
// ============================================================

// Ensure config is loaded
if (!window.APP_CONFIG) {
    console.error('Config not loaded. Please ensure config.js is included before this script.');
    // Fallback: you could hardcode here if necessary, but using config.js is recommended.
}

const CONFIG = window.APP_CONFIG || {
    SUPABASE_URL: 'https://xbrndlhzaluksjhdbnur.supabase.co',
    SUPABASE_ANON_KEY: 'sb_publishable_0kunmksX8TRkAMaVZeEcRg_BVe2B9Yv',
    INVITATION_EDGE_FUNCTION: 'https://xbrndlhzaluksjhdbnur.supabase.co/functions/v1/accept-invitation'
};

// ============================================================
// IMPORTS
// ============================================================

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// ============================================================
// DOM REFS
// ============================================================

const $ = (id) => document.getElementById(id);

const loadingState = $('loadingState');
const errorState = $('errorState');
const expiredState = $('expiredState');
const acceptedState = $('acceptedState');
const registeredState = $('registeredState');
const acceptState = $('acceptState');
const successState = $('successState');

const errorMessage = $('errorMessage');
const successMessage = $('successMessage');
const nomineeName = $('nomineeName');
const nomineeCategory = $('nomineeCategory');
const acceptEmail = $('acceptEmail');
const acceptForm = $('acceptForm');
const acceptPassword = $('acceptPassword');
const acceptPasswordConfirm = $('acceptPasswordConfirm');

// ============================================================
// STATE
// ============================================================

let supabaseClient;
let invitationData = null;

// ============================================================
// INIT
// ============================================================

async function init() {
    try {
        // Initialize Supabase client with anon key (safe for client)
        supabaseClient = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);

        // Get token from URL
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');

        if (!token) {
            showError('No invitation token provided. Please check your invitation link.');
            return;
        }

        // Verify the invitation
        await verifyInvitation(token);

    } catch (err) {
        console.error('Init error:', err);
        showError('Failed to initialize. Please try again or contact support.');
    }
}

// ============================================================
// INVITATION VERIFICATION
// ============================================================

async function verifyInvitation(token) {
    try {
        // 1. Verify token against nominations table
        const { data: nominee, error } = await supabaseClient
            .from('nominations')
            .select('*, categories!inner(name)')
            .eq('invitation_token', token)
            .single();

        if (error || !nominee) {
            showError('Invalid invitation token. Please contact support.');
            return;
        }

        // 2. Check if already accepted
        if (nominee.invitation_status === 'accepted' || nominee.user_id) {
            showAccepted(nominee);
            return;
        }

        // 3. Check if token is expired
        if (nominee.invitation_expires_at) {
            const expiresAt = new Date(nominee.invitation_expires_at);
            const now = new Date();
            if (expiresAt < now) {
                showExpired(nominee);
                return;
            }
        } else if (nominee.invitation_sent_at) {
            // Fallback: expire after 7 days
            const sentDate = new Date(nominee.invitation_sent_at);
            const now = new Date();
            const daysDiff = (now - sentDate) / (1000 * 60 * 60 * 24);
            if (daysDiff > 7) {
                showExpired(nominee);
                return;
            }
        }

        // 4. Check if email already has an auth account – we'll rely on the edge function for this,
        //    but we can do a quick check here as well for UX.
        //    Using the anon key, we cannot list users, so skip this check.
        //    The edge function will handle it.

        // 5. Show accept form
        invitationData = nominee;
        showAccept(nominee);

    } catch (err) {
        console.error('Verification error:', err);
        showError('An error occurred while verifying your invitation.');
    }
}

// ============================================================
// UI STATE FUNCTIONS
// ============================================================

function hideAllStates() {
    [loadingState, errorState, expiredState, acceptedState, registeredState, acceptState, successState]
        .forEach(el => el?.classList.add('hidden'));
}

function showError(message) {
    hideAllStates();
    errorState.classList.remove('hidden');
    errorMessage.textContent = message;
}

function showExpired(nominee) {
    hideAllStates();
    expiredState.classList.remove('hidden');
}

function showAccepted(nominee) {
    hideAllStates();
    acceptedState.classList.remove('hidden');
}

function showRegistered(nominee) {
    hideAllStates();
    registeredState.classList.remove('hidden');
}

function showAccept(nominee) {
    hideAllStates();
    acceptState.classList.remove('hidden');
    nomineeName.textContent = nominee.nominee_name;
    nomineeCategory.textContent = nominee.category || 'your category';
    acceptEmail.value = nominee.primary_email || nominee.nominee_email;
    acceptForm.dataset.nomineeId = nominee.id;
    acceptForm.dataset.nomineeEmail = nominee.primary_email || nominee.nominee_email;
    acceptForm.dataset.category = nominee.category;
    acceptForm.dataset.nomineeName = nominee.nominee_name;
    acceptForm.dataset.invitationToken = nominee.invitation_token;
}

function showSuccess(message) {
    hideAllStates();
    successState.classList.remove('hidden');
    successMessage.textContent = message || 'Your account has been created successfully.';
}

// ============================================================
// PASSWORD VALIDATION
// ============================================================

function validatePassword(password) {
    const checks = {
        length: password.length >= 8,
        upper: /[A-Z]/.test(password),
        number: /[0-9]/.test(password),
    };
    
    const allValid = checks.length && checks.upper && checks.number;
    const results = {
        ...checks,
        allValid
    };
    
    // Update UI
    const lengthEl = document.getElementById('pwLength');
    const upperEl = document.getElementById('pwUpper');
    const numberEl = document.getElementById('pwNumber');
    
    if (lengthEl) {
        lengthEl.textContent = (checks.length ? '✓' : '✗') + ' At least 8 characters';
        lengthEl.className = checks.length ? 'valid' : 'invalid';
    }
    if (upperEl) {
        upperEl.textContent = (checks.upper ? '✓' : '✗') + ' At least one uppercase letter';
        upperEl.className = checks.upper ? 'valid' : 'invalid';
    }
    if (numberEl) {
        numberEl.textContent = (checks.number ? '✓' : '✗') + ' At least one number';
        numberEl.className = checks.number ? 'valid' : 'invalid';
    }
    
    return results;
}

// ============================================================
// FORM HANDLING
// ============================================================

acceptPassword?.addEventListener('input', (e) => {
    validatePassword(e.target.value);
});

acceptForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const password = acceptPassword.value;
    const passwordConfirm = acceptPasswordConfirm.value;
    const email = acceptForm.dataset.nomineeEmail;
    const nomineeId = acceptForm.dataset.nomineeId;
    const nomineeNameVal = acceptForm.dataset.nomineeName;
    const category = acceptForm.dataset.category;
    const token = acceptForm.dataset.invitationToken;
    
    // Validate password
    const pwCheck = validatePassword(password);
    if (!pwCheck.allValid) {
        alert('Please meet all password requirements.');
        return;
    }
    
    // Validate password confirmation
    if (password !== passwordConfirm) {
        alert('Passwords do not match.');
        return;
    }
    
    const submitBtn = acceptForm.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="bx bx-loader-alt bx-spin"></i> Creating Account...';
    
    try {
        // ============================================================
        // USE THE EDGE FUNCTION (RECOMMENDED & SECURE)
        // ============================================================
        // This edge function should handle:
        // - Token validation
        // - User creation via admin.createUser()
        // - Updating nomination with user_id
        // - Assigning finalist role
        // - Audit logging
        // ============================================================
        
        const { data, error } = await supabaseClient.functions.invoke('accept-invitation', {
            body: {
                email,
                password,
                nomineeId,
                nomineeName: nomineeNameVal,
                category,
                token,
                // Include a timestamp to prevent replay attacks (optional)
                timestamp: new Date().toISOString()
            }
        });
        
        if (error) {
            // The edge function returned an error response (non-2xx)
            console.error('Edge function error:', error);
            throw new Error(error.message || 'Account creation failed.');
        }
        
        // Check the response from the edge function
        if (data?.success) {
            showSuccess('Account created successfully! Please check your email to verify your account.');
            // Redirect after 3 seconds
            setTimeout(() => {
                window.location.href = '/profile.html?welcome=true';
            }, 3000);
            return;
        } else if (data?.existingUser) {
            // The edge function detected an existing user
            alert('An account already exists for this email. Please log in.');
            window.location.href = '/profile.html';
            return;
        } else {
            throw new Error(data?.error || 'Account creation failed.');
        }
        
    } catch (err) {
        console.error('Submission error:', err);
        
        let errorMsg = err.message;
        
        // Handle specific error cases
        if (errorMsg.includes('already registered') || errorMsg.includes('already exists')) {
            errorMsg = 'This email is already registered. Please log in instead.';
            setTimeout(() => {
                window.location.href = '/profile.html';
            }, 2000);
        } else if (errorMsg.includes('expired')) {
            errorMsg = 'This invitation has expired. Please request a new one.';
            showExpired(invitationData);
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="bx bx-user-plus"></i> Create Account & Continue';
            return;
        }
        
        alert('Error: ' + errorMsg);
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="bx bx-user-plus"></i> Create Account & Continue';
    }
});

// ============================================================
// START
// ============================================================

// Load supabase-js if needed (if not already loaded via module import)
// The import statement above should handle it, but we keep a fallback for older browsers.
if (typeof createClient === 'undefined') {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js';
    script.onload = () => {
        // The global `supabase` object is now available; re-run init
        init();
    };
    script.onerror = () => {
        showError('Failed to load required libraries. Please check your internet connection.');
    };
    document.head.appendChild(script);
} else {
    init();
}