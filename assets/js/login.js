/**
 * Login Page Script
 * Handles user authentication and admin login
 */
document.addEventListener('DOMContentLoaded', function() {
    // Start checking for existing session and initialize when ready
    checkExistingSession();
});

/**
 * Initialize login page
 */
function initLoginPage() {
    // Set up form submission
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Add animations
    addLoginAnimations();
}

/**
 * Handle login form submission
 * @param {Event} event - Form submission event
 */
async function handleLogin(event) {
    event.preventDefault();

    const loginBtn = document.getElementById('login-btn');
    const loginText = document.getElementById('login-text');
    const loginSpinner = document.getElementById('login-spinner');
    const loginMessage = document.getElementById('login-message');

    // Show loading state
    if (loginBtn && loginText && loginSpinner) {
        loginBtn.disabled = true;
        loginText.style.display = 'none';
        loginSpinner.style.display = 'inline-block';
    }

    // Clear previous messages
    if (loginMessage) {
        loginMessage.className = 'login-message';
        loginMessage.textContent = '';
    }

    try {
        // Get form values
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;

        // Validate inputs
        if (!email || !password) {
            showLoginMessage('Please enter both email and password.', 'error');
            return;
        }

        // Validate email format
        if (!isValidEmail(email)) {
            showLoginMessage('Please enter a valid email address.', 'error');
            return;
        }

        // Sign in with Supabase
        const { data, error } = await window.supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) {
            throw error;
        }

        // Wait a moment for the session to fully establish, then check admin status
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Check if user is admin with proper session handling
        const isAdmin = await checkAdminStatus(data.user.id);

        if (!isAdmin) {
            // Sign out non-admin user
            await window.supabaseClient.auth.signOut();
            showLoginMessage('Access denied. Admin privileges required.', 'error');
            return;
        }

        // Login successful - redirect to admin panel
        showLoginMessage('Login successful! Redirecting...', 'success');

        setTimeout(() => {
            window.location.href = 'admin.html';
        }, 1500);

    } catch (error) {
        console.error('Login error:', error);
        showLoginMessage(getErrorMessage(error), 'error');
    } finally {
        // Reset button state
        if (loginBtn && loginText && loginSpinner) {
            loginBtn.disabled = false;
            loginText.style.display = 'inline';
            loginSpinner.style.display = 'none';
        }
    }
}

/**
 * Check if user is admin
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} Admin status
 */
async function checkAdminStatus(userId) {
    try {
        // First, get the current session to ensure we have proper auth
        const { data: { session }, error: sessionError } = await window.supabaseClient.auth.getSession();

        if (sessionError || !session) {
            console.error('No active session found');
            return false;
        }

        // Try to fetch profile with proper RLS compliance
        // Using RPC (Remote Procedure Call) to avoid RLS policy issues
        try {
            const { data, error } = await window.supabaseClient
                .rpc('get_user_role', { user_id: userId })
                .single();

            if (error) {
                console.error('Error fetching user role via RPC:', error);
                // Check for specific ambiguous column error
                if (error.code === '42702' && error.message.includes('ambiguous')) {
                    console.warn('RPC function has ambiguous column reference - needs backend fix');
                }
                return false;
            }

            return data?.role === 'admin';
        } catch (rpcError) {
            console.error('RPC call failed, trying direct query:', rpcError);

            // Fallback to direct query if RPC is not available
            const { data, error } = await window.supabaseClient
                .from('profiles')
                .select('role')
                .eq('id', userId)
                .single();

            if (error) {
                console.error('Error fetching profile (direct query):', error);
                return false;
            }

            return data?.role === 'admin';
        }
    } catch (error) {
        console.error('Error checking admin status:', error);
        return false;
    }
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} Validation result
 */
function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

/**
 * Show login message
 * @param {string} message - Message to show
 * @param {string} type - Message type ('success' or 'error')
 */
function showLoginMessage(message, type) {
    const loginMessage = document.getElementById('login-message');
    if (!loginMessage) return;

    loginMessage.textContent = message;
    loginMessage.className = `login-message ${type} show`;

    // Auto-hide message after delay
    setTimeout(() => {
        loginMessage.className = 'login-message';
    }, 5000);
}

/**
 * Get user-friendly error message
 * @param {Error} error - Error object
 * @returns {string} User-friendly message
 */
function getErrorMessage(error) {
    if (error.message.includes('Invalid login credentials')) {
        return 'Invalid email or password.';
    } else if (error.message.includes('Email not confirmed')) {
        return 'Please confirm your email address.';
    } else if (error.message.includes('network')) {
        return 'Network error. Please check your connection.';
    } else {
        return 'Login failed. Please try again.';
    }
}

/**
 * Add login page animations
 */
function addLoginAnimations() {
    // Animate login card
    const loginCard = document.querySelector('.login-card');
    if (loginCard) {
        loginCard.classList.add('fade-in');
    }

    // Animate form inputs
    const formInputs = document.querySelectorAll('.form-group input');
    formInputs.forEach((input, index) => {
        input.style.animationDelay = `${index * 0.1}s`;
        input.classList.add('slide-in');
    });
}

/**
 * Check if user is already logged in and redirect
 */
async function checkExistingSession() {
    // Wait for Supabase client to be initialized
    if (typeof window.supabaseClient === 'undefined') {
        console.log('Waiting for Supabase client initialization...');
        setTimeout(checkExistingSession, 500);
        return;
    }

    try {
        // Get current session
        const { data: { session } } = await window.supabaseClient.auth.getSession();

        if (session) {
            // Wait for session to be fully established (RLS needs this)
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Check if user is admin with proper error handling
            try {
                const isAdmin = await checkAdminStatus(session.user.id);

                if (isAdmin) {
                    // Redirect to admin panel
                    window.location.href = 'admin.html';
                    return;
                } else {
                    // Sign out non-admin user
                    await window.supabaseClient.auth.signOut();
                }
            } catch (adminCheckError) {
                console.error('Error checking admin status, session may not be ready:', adminCheckError);
                // If admin check fails due to RLS, the session isn't ready yet
                // Sign out and let user log in again
                await window.supabaseClient.auth.signOut();
            }
        }
    } catch (error) {
        console.error('Error checking existing session:', error);
    }

    // Initialize login page after checking session
    initLoginPage();
}

/**
 * Initialize login page when Supabase is ready
 */
function initLoginWhenReady() {
    if (typeof window.supabaseClient === 'undefined') {
        setTimeout(initLoginWhenReady, 500);
        return;
    }

    initLoginPage();
}

// Check for existing session on page load, then initialize
checkExistingSession();
