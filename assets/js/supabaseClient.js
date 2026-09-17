// Initialize Supabase client when library is ready
function initializeSupabaseClient() {
    const SUPABASE_URL = 'https://nuuhgjhounzgyvcvreis.supabase.co';
    const SUPABASE_ANON_KEY = 'sb_publishable_byO5tm6nLoEmUc1dtgYyew_qaDw_C4d';

    // Check if Supabase library is available
    if (typeof window.supabase === 'undefined') {
        console.error('Supabase library not loaded');
        return;
    }

    // Initialize Supabase client
    const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Export the supabase client for use in other modules
    window.supabaseClient = supabaseClient;

    // Storage bucket names
    const STORAGE_BUCKETS = {
        DOWNLOADS: 'downloads',
        ICONS: 'downloads/icons'
    };

    // Make storage buckets available globally
    window.STORAGE_BUCKETS = STORAGE_BUCKETS;

    console.log('Supabase client initialized successfully');
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeSupabaseClient);
