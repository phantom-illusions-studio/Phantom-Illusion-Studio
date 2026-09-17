/**
 * Data Service Module
 * Centralized data fetching and storage operations
 */
class DataService {
    constructor() {
        this.supabase = window.supabaseClient;
        this.buckets = window.STORAGE_BUCKETS;
    }

    /**
     * Get featured items
     * @returns {Promise<Array>} Array of featured items
     */
    async getFeaturedItems() {
        try {
            // Wait for Supabase client to be initialized
            if (typeof window.supabaseClient === 'undefined') {
                console.error('Supabase client not initialized');
                return [];
            }

            const { data, error } = await window.supabaseClient
                .from('items')
                .select('*')
                .eq('is_featured', true)
                .eq('is_published', true)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching featured items:', error);
            return [];
        }
    }

    /**
     * Get items by type
     * @param {string} itemType - 'app', 'game', or 'software'
     * @returns {Promise<Array>} Array of items
     */
    async getItemsByType(itemType) {
        try {
            // Wait for Supabase client to be initialized
            if (typeof window.supabaseClient === 'undefined') {
                console.error('Supabase client not initialized');
                return [];
            }

            const { data, error } = await window.supabaseClient
                .from('items')
                .select('*')
                .eq('item_type', itemType)
                .eq('is_published', true)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error(`Error fetching ${itemType} items:`, error);
            return [];
        }
    }

    /**
     * Get item by ID
     * @param {string} itemId - Item ID
     * @returns {Promise<Object|null>} Item object or null
     */
    async getItemById(itemId) {
        try {
            // Wait for Supabase client to be initialized
            if (typeof window.supabaseClient === 'undefined') {
                console.error('Supabase client not initialized');
                return null;
            }

            const { data, error } = await window.supabaseClient
                .from('items')
                .select('*')
                .eq('id', itemId)
                .eq('is_published', true)
                .single();

            if (error) throw error;
            return data || null;
        } catch (error) {
            console.error('Error fetching item by ID:', error);
            return null;
        }
    }

    /**
     * Get public URL for storage file
     * @param {string} bucketName - Bucket name
     * @param {string} filePath - File path
     * @returns {Promise<string|null>} Public URL or null
     */
    async getPublicUrl(bucketName, filePath) {
        try {
            // Wait for Supabase client to be initialized
            if (typeof window.supabaseClient === 'undefined') {
                console.error('Supabase client not initialized');
                return null;
            }

            // Validate inputs
            if (!bucketName || !filePath) {
                console.error('Invalid parameters for getPublicUrl:', { bucketName, filePath });
                return null;
            }

            const { data, error } = window.supabaseClient
                .storage
                .from(bucketName)
                .getPublicUrl(filePath);

            if (error) {
                console.error('Supabase error getting public URL:', {
                    bucketName,
                    filePath,
                    error: error.message,
                    code: error.code,
                    details: error.details
                });
                return null;
            }

            const publicUrl = data.publicUrl;
            
            // Fallback check: Validate the public URL format
            if (!publicUrl || typeof publicUrl !== 'string') {
                console.error('Invalid public URL returned:', {
                    bucketName,
                    filePath,
                    publicUrl
                });
                return null;
            }

            // Additional validation: Check if URL is properly formatted
            try {
                new URL(publicUrl);
            } catch (urlError) {
                console.error('Public URL is not a valid URL:', {
                    bucketName,
                    filePath,
                    publicUrl,
                    urlError
                });
                return null;
            }

            // Fallback check: Ensure URL contains expected Supabase domain
            if (!publicUrl.includes('supabase') && !publicUrl.includes('storage')) {
                console.warn('Public URL may not be from Supabase storage:', publicUrl);
            }

            return publicUrl;
        } catch (error) {
            console.error('Unexpected error getting public URL:', {
                bucketName,
                filePath,
                error: error.message,
                stack: error.stack
            });
            return null;
        }
    }

    /**
     * Upload file to storage
     * @param {string} bucketName - Bucket name
     * @param {string} filePath - File path
     * @param {File} file - File object
     * @returns {Promise<Object|null>} Upload result or null
     */
    async uploadFile(bucketName, filePath, file) {
        try {
            // Wait for Supabase client to be initialized
            if (typeof window.supabaseClient === 'undefined') {
                console.error('Supabase client not initialized');
                return null;
            }

            const { data, error } = await window.supabaseClient
                .storage
                .from(bucketName)
                .upload(filePath, file, {
                    cacheControl: 'public, max-age=31536000'
                });

            if (error) throw error;
            return data || null;
        } catch (error) {
            console.error('Error uploading file:', error);
            return null;
        }
    }

    /**
     * Delete file from storage
     * @param {string} bucketName - Bucket name
     * @param {string} filePath - File path
     * @returns {Promise<boolean>} Success status
     */
    async deleteFile(bucketName, filePath) {
        try {
            // Wait for Supabase client to be initialized
            if (typeof window.supabaseClient === 'undefined') {
                console.error('Supabase client not initialized');
                return false;
            }

            const { error } = await window.supabaseClient
                .storage
                .from(bucketName)
                .remove([filePath]);

            return !error;
        } catch (error) {
            console.error('Error deleting file:', error);
            return false;
        }
    }

    /**
     * Create new item
     * @param {Object} itemData - Item data
     * @returns {Promise<Object|null>} Created item or null
     */
    async createItem(itemData) {
        try {
            // Wait for Supabase client to be initialized
            if (typeof window.supabaseClient === 'undefined') {
                console.error('Supabase client not initialized');
                return null;
            }

            const { data, error } = await window.supabaseClient
                .from('items')
                .insert([itemData])
                .select()
                .single();

            if (error) throw error;
            return data || null;
        } catch (error) {
            console.error('Error creating item:', error);
            return null;
        }
    }

    /**
     * Update existing item
     * @param {string} itemId - Item ID
     * @param {Object} itemData - Item data
     * @returns {Promise<Object|null>} Updated item or null
     */
    async updateItem(itemId, itemData) {
        try {
            // Wait for Supabase client to be initialized
            if (typeof window.supabaseClient === 'undefined') {
                console.error('Supabase client not initialized');
                return null;
            }

            const { data, error } = await window.supabaseClient
                .from('items')
                .update(itemData)
                .eq('id', itemId)
                .select()
                .single();

            if (error) throw error;
            return data || null;
        } catch (error) {
            console.error('Error updating item:', error);
            return null;
        }
    }

    /**
     * Delete item
     * @param {string} itemId - Item ID
     * @returns {Promise<boolean>} Success status
     */
    async deleteItem(itemId) {
        try {
            // Wait for Supabase client to be initialized
            if (typeof window.supabaseClient === 'undefined') {
                console.error('Supabase client not initialized');
                return false;
            }

            const { error } = await window.supabaseClient
                .from('items')
                .delete()
                .eq('id', itemId);

            return !error;
        } catch (error) {
            console.error('Error deleting item:', error);
            return false;
        }
    }

    /**
     * Get all items (admin only)
     * @returns {Promise<Array>} Array of all items
     */
    async getAllItems() {
        try {
            // Wait for Supabase client to be initialized
            if (typeof window.supabaseClient === 'undefined') {
                console.error('Supabase client not initialized');
                return [];
            }

            const { data, error } = await window.supabaseClient
                .from('items')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching all items:', error);
            return [];
        }
    }

    /**
     * Check if user is admin
     * @returns {Promise<boolean>} Admin status
     */
    async checkAdminStatus() {
        try {
            // Wait for Supabase client to be initialized
            if (typeof window.supabaseClient === 'undefined') {
                console.error('Supabase client not initialized');
                return false;
            }

            const session = await window.supabaseClient.auth.getSession();
            if (!session.data.session) {
                console.log('No active session found');
                return false;
            }

            console.log('Checking admin status for user:', session.data.session.user.id);

            const { data, error } = await window.supabaseClient
                .from('profiles')
                .select('role')
                .eq('id', session.data.session.user.id)
                .single();

            if (error) {
                console.error('Supabase error details:', {
                    code: error.code,
                    message: error.message,
                    details: error.details,
                    hint: error.hint
                });
                throw error;
            }

            console.log('Admin check successful, role:', data?.role);
            return data?.role === 'admin';
        } catch (error) {
            console.error('Error checking admin status:', error);
            // Check for specific RLS or policy errors
            if (error.code === '42501' || error.code === '42P17') {
                console.warn('RLS Policy Error - User may not have permission or policy has infinite recursion');
            }
            return false;
        }
    }

    /**
     * Get current user session
     * @returns {Promise<Object|null>} Session object or null
     */
    async getCurrentSession() {
        try {
            // Wait for Supabase client to be initialized
            if (typeof window.supabaseClient === 'undefined') {
                console.error('Supabase client not initialized');
                return null;
            }

            const { data, error } = await window.supabaseClient.auth.getSession();
            if (error) throw error;
            return data.session || null;
        } catch (error) {
            console.error('Error getting session:', error);
            return null;
        }
    }
}

// Initialize and export the data service
window.dataService = new DataService();
