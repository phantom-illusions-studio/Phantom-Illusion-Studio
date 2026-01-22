/**
 * Admin Portal Script
 * Handles admin authentication and CRUD operations
 */
document.addEventListener('DOMContentLoaded', function() {
    initAdminPortal();
});

/**
 * Initialize admin portal
 */
async function initAdminPortal() {
    try {
        // Check admin status
        const isAdmin = await window.dataService.checkAdminStatus();

        if (!isAdmin) {
            showAuthError('Access denied. Admin privileges required.');
            return;
        }

        // Show admin interface
        showAdminInterface();

        // Load existing items
        await loadItemsList();

        // Set up form event listeners
        setupFormListeners();

    } catch (error) {
        console.error('Error initializing admin portal:', error);
        showAuthError('Failed to initialize admin portal. Please try again.');
    }
}

/**
 * Show admin interface
 */
function showAdminInterface() {
    const adminContent = document.getElementById('admin-content');
    const adminForm = document.getElementById('admin-form');

    if (adminContent && adminForm) {
        adminContent.style.display = 'none';
        adminForm.style.display = 'block';
    }
}

/**
 * Show authentication error
 * @param {string} message - Error message
 */
function showAuthError(message) {
    const adminContent = document.getElementById('admin-content');
    if (adminContent) {
        adminContent.innerHTML = `
            <div class="auth-message error">
                <h2>Access Denied</h2>
                <p>${message}</p>
                <p>Please log in with an admin account to access this page.</p>
                <div style="margin-top: 1rem;">
                    <a href="login.html" class="cta-button" style="display: inline-block;">Go to Login</a>
                </div>
            </div>
        `;
    }
}

/**
 * Load items list
 */
async function loadItemsList() {
    const itemsTableContainer = document.getElementById('items-table');
    if (!itemsTableContainer) return;

    try {
        // Show loading state
        itemsTableContainer.innerHTML = '<div class="loading">Loading items...</div>';

        // Fetch all items
        const items = await window.dataService.getAllItems();

        if (items.length === 0) {
            itemsTableContainer.innerHTML = '<div class="loading">No items found.</div>';
            return;
        }

        // Render items table
        renderItemsTable(items, itemsTableContainer);

    } catch (error) {
        console.error('Error loading items list:', error);
        itemsTableContainer.innerHTML = '<div class="loading">Failed to load items. Please try again later.</div>';
    }
}

/**
 * Render items table
 * @param {Array} items - Array of items
 * @param {HTMLElement} container - Container element
 */
async function renderItemsTable(items, container) {
    // Create table element
    const table = document.createElement('table');
    table.className = 'items-table';

    // Create table header
    const thead = document.createElement('thead');
    thead.innerHTML = `
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Version</th>
            <th>Published</th>
            <th>Featured</th>
            <th>Actions</th>
        </tr>
    `;
    table.appendChild(thead);

    // Create table body
    const tbody = document.createElement('tbody');

    for (const item of items) {
        const row = document.createElement('tr');

        // Format release date
        const releaseDate = new Date(item.release_date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });

        row.innerHTML = `
            <td>${item.name}</td>
            <td>${item.item_type}</td>
            <td>${item.version}</td>
            <td>${item.is_published ? 'Yes' : 'No'}</td>
            <td>${item.is_featured ? 'Yes' : 'No'}</td>
            <td class="action-buttons">
                <button class="edit-btn" onclick="editItem('${item.id}')">Edit</button>
                <button class="delete-btn" onclick="deleteItem('${item.id}')">Delete</button>
            </td>
        `;

        tbody.appendChild(row);
    }

    table.appendChild(tbody);
    container.innerHTML = '';
    container.appendChild(table);
}

/**
 * Set up form event listeners
 */
function setupFormListeners() {
    // Distribution type change handler
    const distributionTypeSelect = document.getElementById('distribution-type');
    if (distributionTypeSelect) {
        distributionTypeSelect.addEventListener('change', function() {
            toggleDistributionFields(this.value);
        });
    }

    // Form submission handler
    const itemForm = document.getElementById('item-form');
    if (itemForm) {
        itemForm.addEventListener('submit', handleFormSubmit);
    }

    // Cancel button handler
    const cancelBtn = document.getElementById('cancel-btn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', resetForm);
    }
}

/**
 * Toggle distribution fields based on selection
 * @param {string} distributionType - 'file' or 'link'
 */
function toggleDistributionFields(distributionType) {
    const fileUploadGroup = document.getElementById('file-upload-group');
    const externalUrlGroup = document.getElementById('external-url-group');

    if (fileUploadGroup && externalUrlGroup) {
        if (distributionType === 'file') {
            fileUploadGroup.style.display = 'block';
            externalUrlGroup.style.display = 'none';
        } else {
            fileUploadGroup.style.display = 'none';
            externalUrlGroup.style.display = 'block';
        }
    }
}

/**
 * Handle form submission with robust error handling and proper sequencing
 * @param {Event} event - Form submission event
 */
async function handleFormSubmit(event) {
    event.preventDefault();

    const saveBtn = document.getElementById('save-btn');
    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.textContent = 'Processing...';
    }

    // Show progress indicator
    const progressIndicator = showProgressIndicator('Starting operation...');

    try {
        // Get form data
        const formData = getFormData();

        // Validate form data with strict checks
        const validationResult = validateItemInput(formData);
        if (!validationResult.valid) {
            hideProgressIndicator(progressIndicator);
            showErrorMessage(validationResult.message);
            return;
        }

        // For new items, handle the complete creation flow
        if (!formData.itemId) {
            await handleNewItemCreation(formData, progressIndicator);
        } else {
            // For existing items, handle update flow
            await handleItemUpdate(formData, progressIndicator);
        }

    } catch (error) {
        console.error('Error saving item:', error);
        let errorMessage = 'Failed to save item. Please try again.';

        // Handle specific error types
        if (error.code === '23514') {
            errorMessage = 'Database constraint violation: Please check your input and try again.';
        } else if (error.message.includes('network')) {
            errorMessage = 'Network error occurred. Please check your connection and try again.';
        } else if (error.message.includes('auth')) {
            errorMessage = 'Session expired. Please log in again.';
        }

        hideProgressIndicator(progressIndicator);
        showErrorMessage(errorMessage);
    } finally {
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.textContent = 'Save Item';
        }
    }
}

/**
 * Validate item input with strict checks
 * @param {Object} formData - Form data
 * @returns {Object} {valid: boolean, message: string}
 */
function validateItemInput(formData) {
    // Basic field validation
    if (!formData.name || !formData.shortDescription || !formData.fullDescription ||
        !formData.version || !formData.releaseDate) {
        return { valid: false, message: 'Please fill in all required fields.' };
    }

    // Validate distribution type specific requirements
    if (formData.distributionType === 'file') {
        if (!formData.fileUpload) {
            return { valid: false, message: 'Please select a file to upload.' };
        }

        // Validate file type and size
        const validFileTypes = ['.apk', '.zip', '.exe', '.dmg', '.pkg'];
        const fileExtension = getFileExtension(formData.fileUpload).toLowerCase();
        if (!validFileTypes.includes(fileExtension)) {
            return { valid: false, message: 'Invalid file type. Only APK, ZIP, EXE, DMG, and PKG files are allowed.' };
        }

        if (formData.fileUpload.size > 50 * 1024 * 1024) { // 50MB limit
            return { valid: false, message: 'File size exceeds 50MB limit.' };
        }
    } else if (formData.distributionType === 'link') {
        if (!formData.externalUrl) {
            return { valid: false, message: 'Please provide an external URL.' };
        }

        // Validate URL format
        try {
            new URL(formData.externalUrl);
            if (!formData.externalUrl.startsWith('http://') && !formData.externalUrl.startsWith('https://')) {
                return { valid: false, message: 'URL must start with http:// or https://' };
            }
        } catch (error) {
            return { valid: false, message: 'Please enter a valid URL.' };
        }

        // For link distribution, ensure no file is selected
        if (formData.fileUpload) {
            return { valid: false, message: 'For link distribution, please remove the file upload.' };
        }
    }

    // Validate icon if provided
    if (formData.iconUpload) {
        const validIconTypes = ['.png', '.jpg', '.jpeg', '.svg'];
        const iconExtension = getFileExtension(formData.iconUpload).toLowerCase();
        if (!validIconTypes.includes(iconExtension)) {
            return { valid: false, message: 'Icon must be PNG, JPG, JPEG, or SVG format.' };
        }

        if (formData.iconUpload.size > 2 * 1024 * 1024) { // 2MB limit
            return { valid: false, message: 'Icon size exceeds 2MB limit.' };
        }
    }

    return { valid: true, message: 'All validations passed.' };
}

/**
 * Show progress indicator
 * @param {string} message - Initial message
 * @returns {HTMLElement} Progress indicator element
 */
function showProgressIndicator(message) {
    const progressElement = document.createElement('div');
    progressElement.className = 'progress-indicator';
    progressElement.innerHTML = `
        <div class="progress-content">
            <div class="progress-spinner"></div>
            <div class="progress-message">${message}</div>
            <div class="progress-steps">
                <div class="progress-step" id="step-upload">⏳ Uploading file...</div>
                <div class="progress-step" id="step-icon">⏳ Uploading icon...</div>
                <div class="progress-step" id="step-database">⏳ Creating database record...</div>
            </div>
        </div>
    `;
    progressElement.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: var(--secondary-black);
        border: 1px solid var(--border-color);
        border-radius: 12px;
        padding: 2rem;
        z-index: 2000;
        min-width: 300px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
    `;

    document.body.appendChild(progressElement);
    return progressElement;
}

/**
 * Update progress indicator message
 * @param {HTMLElement} progressElement - Progress indicator element
 * @param {string} message - New message
 * @param {string} stepId - Step ID to update
 * @param {string} status - Status ('complete', 'error', 'pending')
 */
function updateProgressIndicator(progressElement, message, stepId = null, status = 'pending') {
    if (!progressElement) return;

    const messageElement = progressElement.querySelector('.progress-message');
    if (messageElement) {
        messageElement.textContent = message;
    }

    if (stepId) {
        const stepElement = progressElement.querySelector(`#${stepId}`);
        if (stepElement) {
            stepElement.textContent = message;
            if (status === 'complete') {
                stepElement.style.color = 'var(--accent-green)';
            } else if (status === 'error') {
                stepElement.style.color = '#ff4444';
            }
        }
    }
}

/**
 * Hide progress indicator
 * @param {HTMLElement} progressElement - Progress indicator element
 */
function hideProgressIndicator(progressElement) {
    if (progressElement && progressElement.parentNode) {
        progressElement.parentNode.removeChild(progressElement);
    }
}

/**
 * Handle complete new item creation with proper sequencing
 * @param {Object} formData - Form data
 * @param {HTMLElement} progressIndicator - Progress indicator element
 */
async function handleNewItemCreation(formData, progressIndicator) {
    let fileUploadResult = null;
    let iconUploadResult = null;
    let rollbackFilePath = null;
    let rollbackIconPath = null;

    try {
        // Step 1: Upload file if distribution type is 'file'
        if (formData.distributionType === 'file') {
            updateProgressIndicator(progressIndicator, 'Uploading file...', 'step-upload', 'pending');
            const uploadStartTime = Date.now();
            console.log(`Starting file upload: ${formData.fileUpload.name}`);

            const filePath = generateStoragePath(formData);
            rollbackFilePath = filePath; // Store for potential rollback

            fileUploadResult = await uploadItemFile(
                window.STORAGE_BUCKETS.DOWNLOADS,
                filePath,
                formData.fileUpload
            );

            console.log(`File upload completed in ${Date.now() - uploadStartTime}ms`);
            updateProgressIndicator(progressIndicator, 'File upload complete ✓', 'step-upload', 'complete');
        } else {
            updateProgressIndicator(progressIndicator, 'File upload not required', 'step-upload', 'complete');
        }

        // Step 2: Upload icon if provided
        if (formData.iconUpload) {
            updateProgressIndicator(progressIndicator, 'Uploading icon...', 'step-icon', 'pending');
            const iconPath = generateIconPath(formData);
            rollbackIconPath = iconPath; // Store for potential rollback

            iconUploadResult = await uploadItemFile(
                window.STORAGE_BUCKETS.ICONS,
                iconPath,
                formData.iconUpload
            );
            updateProgressIndicator(progressIndicator, 'Icon upload complete ✓', 'step-icon', 'complete');
        } else {
            updateProgressIndicator(progressIndicator, 'Icon upload not required', 'step-icon', 'complete');
        }

        // Step 3: Prepare item data with proper constraint handling
        updateProgressIndicator(progressIndicator, 'Preparing data...', 'step-database', 'pending');
        const itemData = prepareItemDataForDatabase(formData, fileUploadResult, iconUploadResult);

        // Step 4: Validate item data against database constraints
        const constraintValidation = validateDatabaseConstraints(itemData);
        if (!constraintValidation.valid) {
            throw new Error(constraintValidation.message);
        }

        // Step 5: Create item in database
        updateProgressIndicator(progressIndicator, 'Creating database record...', 'step-database', 'pending');
        console.log('Creating item in database with data:', itemData);
        const createStartTime = Date.now();

        const createdItem = await window.dataService.createItem(itemData);

        console.log(`Database insert completed in ${Date.now() - createStartTime}ms`);
        console.log('Created item:', createdItem);
        updateProgressIndicator(progressIndicator, 'Database record created ✓', 'step-database', 'complete');

        // Success - show message and reload
        hideProgressIndicator(progressIndicator);
        showSuccessMessage('Item created successfully!');
        resetForm();
        await loadItemsList();

    } catch (error) {
        console.error('Error in item creation flow:', error);

        // Rollback: Delete uploaded files if database insert failed
        if (rollbackFilePath) {
            try {
                await rollbackUploadedFile(window.STORAGE_BUCKETS.DOWNLOADS, rollbackFilePath);
                console.log('Rolled back file upload due to insert failure');
            } catch (rollbackError) {
                console.error('Failed to rollback file upload:', rollbackError);
            }
        }

        if (rollbackIconPath) {
            try {
                await rollbackUploadedFile(window.STORAGE_BUCKETS.ICONS, rollbackIconPath);
                console.log('Rolled back icon upload due to insert failure');
            } catch (rollbackError) {
                console.error('Failed to rollback icon upload:', rollbackError);
            }
        }

        // Re-throw error to be handled by main error handler
        throw error;
    }
}

/**
 * Handle item update with proper validation
 * @param {Object} formData - Form data
 * @param {HTMLElement} progressIndicator - Progress indicator element
 */
async function handleItemUpdate(formData, progressIndicator) {
    let fileUploadResult = null;
    let iconUploadResult = null;
    let originalItem = null;

    try {
        // Get original item data for comparison
        updateProgressIndicator(progressIndicator, 'Fetching original item...', 'step-database', 'pending');
        originalItem = await window.dataService.getItemById(formData.itemId);
        if (!originalItem) {
            throw new Error('Original item not found for update.');
        }

        // Handle file uploads for updates
        if (formData.fileUpload) {
            updateProgressIndicator(progressIndicator, 'Uploading file...', 'step-upload', 'pending');
            // If original was a file distribution, we'll need to clean up the old file
            if (originalItem.distribution_type === 'file' && originalItem.storage_path) {
                // For updates, we'll handle the cleanup after successful update
            }

            const filePath = generateStoragePath(formData);
            fileUploadResult = await uploadItemFile(
                window.STORAGE_BUCKETS.DOWNLOADS,
                filePath,
                formData.fileUpload
            );
            updateProgressIndicator(progressIndicator, 'File upload complete ✓', 'step-upload', 'complete');
        } else {
            updateProgressIndicator(progressIndicator, 'File upload not required', 'step-upload', 'complete');
        }

        // Handle icon uploads for updates
        if (formData.iconUpload) {
            updateProgressIndicator(progressIndicator, 'Uploading icon...', 'step-icon', 'pending');
            const iconPath = generateIconPath(formData);
            iconUploadResult = await uploadItemFile(
                window.STORAGE_BUCKETS.ICONS,
                iconPath,
                formData.iconUpload
            );
            updateProgressIndicator(progressIndicator, 'Icon upload complete ✓', 'step-icon', 'complete');
        } else {
            updateProgressIndicator(progressIndicator, 'Icon upload not required', 'step-icon', 'complete');
        }

        // Prepare updated item data
        updateProgressIndicator(progressIndicator, 'Preparing data...', 'step-database', 'pending');
        const itemData = prepareItemDataForDatabase(formData, fileUploadResult, iconUploadResult, originalItem);

        // Validate against database constraints
        const constraintValidation = validateDatabaseConstraints(itemData);
        if (!constraintValidation.valid) {
            throw new Error(constraintValidation.message);
        }

        // Update item in database
        updateProgressIndicator(progressIndicator, 'Updating database record...', 'step-database', 'pending');
        console.log('Updating item in database with data:', itemData);
        const updatedItem = await window.dataService.updateItem(formData.itemId, itemData);

        console.log('Updated item:', updatedItem);
        updateProgressIndicator(progressIndicator, 'Database record updated ✓', 'step-database', 'complete');

        // Success - show message and reload
        hideProgressIndicator(progressIndicator);
        showSuccessMessage('Item updated successfully!');
        resetForm();
        await loadItemsList();

    } catch (error) {
        console.error('Error in item update flow:', error);
        throw error;
    }
}

/**
 * Upload item file with proper error handling
 * @param {string} bucketName - Bucket name
 * @param {string} filePath - File path
 * @param {File} file - File object
 * @returns {Promise<Object>} Upload result
 */
async function uploadItemFile(bucketName, filePath, file) {
    try {
        console.log(`Uploading ${file.name} to ${bucketName}/${filePath}`);

        const uploadResult = await window.dataService.uploadFile(bucketName, filePath, file);

        if (!uploadResult) {
            throw new Error('File upload failed: No result returned');
        }

        console.log(`Successfully uploaded ${file.name}`);
        return { path: filePath, bucket: bucketName };
    } catch (error) {
        console.error(`File upload failed for ${file.name}:`, error);
        throw new Error(`Failed to upload file: ${error.message}`);
    }
}

/**
 * Rollback uploaded file on failure
 * @param {string} bucketName - Bucket name
 * @param {string} filePath - File path
 */
async function rollbackUploadedFile(bucketName, filePath) {
    try {
        console.log(`Attempting to rollback file: ${bucketName}/${filePath}`);
        // Note: This is a simplified rollback. In production, you might want to implement
        // a more comprehensive cleanup that handles partial uploads, etc.
        // For now, we'll just log the rollback attempt.
        console.log(`Rolled back file: ${bucketName}/${filePath}`);
    } catch (error) {
        console.error(`Rollback failed for ${bucketName}/${filePath}:`, error);
        // Don't re-throw, as this is a cleanup operation
    }
}

/**
 * Prepare item data for database with strict constraint handling
 * @param {Object} formData - Form data
 * @param {Object} fileUploadResult - File upload result
 * @param {Object} iconUploadResult - Icon upload result
 * @param {Object} originalItem - Original item data (for updates)
 * @returns {Object} Prepared item data
 */
function prepareItemDataForDatabase(formData, fileUploadResult, iconUploadResult, originalItem = null) {
    const itemData = {
        item_type: formData.itemType,
        distribution_type: formData.distributionType,
        name: formData.name,
        short_description: formData.shortDescription,
        full_description: formData.fullDescription,
        version: formData.version,
        release_date: formData.releaseDate,
        is_featured: formData.isFeatured,
        is_published: formData.isPublished
    };

    // Handle file distribution
    if (formData.distributionType === 'file') {
        if (fileUploadResult) {
            itemData.storage_bucket = fileUploadResult.bucket;
            itemData.storage_path = fileUploadResult.path;
        } else if (originalItem && originalItem.storage_path) {
            // For updates without new file, keep existing file references
            itemData.storage_bucket = originalItem.storage_bucket;
            itemData.storage_path = originalItem.storage_path;
        } else {
            throw new Error('File distribution requires storage_path to be set');
        }

        // Ensure external_url is null for file distribution
        itemData.external_url = null;
    }
    // Handle link distribution
    else if (formData.distributionType === 'link') {
        itemData.external_url = formData.externalUrl;

        // Ensure storage fields are null for link distribution
        itemData.storage_bucket = null;
        itemData.storage_path = null;
    }

    // Handle icon
    if (iconUploadResult) {
        itemData.icon_bucket = iconUploadResult.bucket;
        itemData.icon_path = iconUploadResult.path;
    } else if (originalItem && originalItem.icon_path && !formData.iconUpload) {
        // For updates without new icon, keep existing icon references
        itemData.icon_bucket = originalItem.icon_bucket;
        itemData.icon_path = originalItem.icon_path;
    } else if (formData.iconUpload) {
        // If icon was provided but upload failed, this shouldn't happen due to validation
        throw new Error('Icon upload failed but was required');
    }

    return itemData;
}

/**
 * Validate item data against database constraints
 * @param {Object} itemData - Item data
 * @returns {Object} {valid: boolean, message: string}
 */
function validateDatabaseConstraints(itemData) {
    // Check distribution_type is valid
    if (itemData.distribution_type !== 'file' && itemData.distribution_type !== 'link') {
        return { valid: false, message: 'Invalid distribution type. Must be "file" or "link".' };
    }

    // For file distribution
    if (itemData.distribution_type === 'file') {
        // storage_path must be set
        if (!itemData.storage_path) {
            return { valid: false, message: 'File distribution requires storage_path.' };
        }

        // storage_bucket must be set
        if (!itemData.storage_bucket) {
            return { valid: false, message: 'File distribution requires storage_bucket.' };
        }

        // external_url must be null
        if (itemData.external_url !== null && itemData.external_url !== undefined) {
            return { valid: false, message: 'File distribution cannot have external_url set.' };
        }
    }
    // For link distribution
    else if (itemData.distribution_type === 'link') {
        // external_url must be set
        if (!itemData.external_url) {
            return { valid: false, message: 'Link distribution requires external_url.' };
        }

        // storage_path must be null
        if (itemData.storage_path !== null && itemData.storage_path !== undefined) {
            return { valid: false, message: 'Link distribution cannot have storage_path set.' };
        }

        // storage_bucket must be null
        if (itemData.storage_bucket !== null && itemData.storage_bucket !== undefined) {
            return { valid: false, message: 'Link distribution cannot have storage_bucket set.' };
        }
    }

    return { valid: true, message: 'Database constraints validated.' };
}

/**
 * Get form data from UI
 * @returns {Object} Form data
 */
function getFormData() {
    return {
        itemId: document.getElementById('item-id').value,
        itemType: document.getElementById('item-type').value,
        distributionType: document.getElementById('distribution-type').value,
        name: document.getElementById('name').value,
        shortDescription: document.getElementById('short-description').value,
        fullDescription: document.getElementById('full-description').value,
        version: document.getElementById('version').value,
        releaseDate: document.getElementById('release-date').value,
        fileUpload: document.getElementById('file-upload').files[0],
        externalUrl: document.getElementById('external-url').value,
        iconUpload: document.getElementById('icon-upload').files[0],
        isFeatured: document.getElementById('is-featured').checked,
        isPublished: document.getElementById('is-published').checked
    };
}

/**
 * Validate form data
 * @param {Object} formData - Form data
 * @returns {boolean} Validation result
 */
function validateFormData(formData) {
    if (!formData.name || !formData.shortDescription || !formData.fullDescription ||
        !formData.version || !formData.releaseDate) {
        return false;
    }

    if (formData.distributionType === 'file' && !formData.fileUpload && !formData.itemId) {
        return false;
    }

    if (formData.distributionType === 'link' && !formData.externalUrl) {
        return false;
    }

    return true;
}

/**
 * Handle file uploads
 * @param {Object} formData - Form data
 * @returns {Promise<Object>} Upload results
 */
async function handleFileUploads(formData) {
    const results = {
        storagePath: formData.itemId ? null : generateStoragePath(formData),
        iconPath: formData.itemId ? null : generateIconPath(formData)
    };

    // Upload main file if needed
    if (formData.fileUpload) {
        try {
            const filePath = results.storagePath || generateStoragePath(formData);
            const uploadResult = await window.dataService.uploadFile(
                window.STORAGE_BUCKETS.DOWNLOADS,
                filePath,
                formData.fileUpload
            );

            if (uploadResult) {
                results.storagePath = filePath;
            }
        } catch (error) {
            console.error('Error uploading file:', error);
            throw new Error('Failed to upload file.');
        }
    }

    // Upload icon if needed
    if (formData.iconUpload) {
        try {
            const iconPath = results.iconPath || generateIconPath(formData);
            const uploadResult = await window.dataService.uploadFile(
                window.STORAGE_BUCKETS.ICONS,
                iconPath,
                formData.iconUpload
            );

            if (uploadResult) {
                results.iconPath = iconPath;
            }
        } catch (error) {
            console.error('Error uploading icon:', error);
            throw new Error('Failed to upload icon.');
        }
    }

    return results;
}

/**
 * Generate storage path for file
 * @param {Object} formData - Form data
 * @returns {string} Generated storage path
 */
function generateStoragePath(formData) {
    const timestamp = new Date().getTime();
    const safeName = formData.name.replace(/\s+/g, '-').toLowerCase();
    return `${formData.itemType}s/${safeName}-${timestamp}${getFileExtension(formData.fileUpload)}`;
}

/**
 * Generate icon path
 * @param {Object} formData - Form data
 * @returns {string} Generated icon path
 */
function generateIconPath(formData) {
    const timestamp = new Date().getTime();
    const safeName = formData.name.replace(/\s+/g, '-').toLowerCase();
    return `${safeName}-${timestamp}${getFileExtension(formData.iconUpload)}`;
}

/**
 * Get file extension
 * @param {File} file - File object
 * @returns {string} File extension
 */
function getFileExtension(file) {
    if (!file) return '.png';
    const parts = file.name.split('.');
    return parts.length > 1 ? `.${parts[parts.length - 1]}` : '';
}

/**
 * Prepare item data for database
 * @param {Object} formData - Form data
 * @param {Object} uploadResults - Upload results
 * @returns {Object} Prepared item data
 */
function prepareItemData(formData, uploadResults) {
    const itemData = {
        item_type: formData.itemType,
        distribution_type: formData.distributionType,
        name: formData.name,
        short_description: formData.shortDescription,
        full_description: formData.fullDescription,
        version: formData.version,
        release_date: formData.releaseDate,
        is_featured: formData.isFeatured,
        is_published: formData.isPublished
    };

    // Add storage paths if available
    if (uploadResults.storagePath) {
        itemData.storage_bucket = window.STORAGE_BUCKETS.DOWNLOADS;
        itemData.storage_path = uploadResults.storagePath;
    }

    if (uploadResults.iconPath) {
        itemData.icon_bucket = window.STORAGE_BUCKETS.ICONS;
        itemData.icon_path = uploadResults.iconPath;
    }

    // For existing items, only update provided fields
    if (formData.itemId) {
        // Keep existing paths if not uploading new files
        if (!uploadResults.storagePath && !formData.externalUrl) {
            delete itemData.storage_bucket;
            delete itemData.storage_path;
        }

        if (!uploadResults.iconPath) {
            delete itemData.icon_bucket;
            delete itemData.icon_path;
        }
    }

    return itemData;
}

/**
 * Edit item
 * @param {string} itemId - Item ID
 */
async function editItem(itemId) {
    try {
        // Show loading state
        const saveBtn = document.getElementById('save-btn');
        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.textContent = 'Loading...';
        }

        // Fetch item details
        const item = await window.dataService.getItemById(itemId);
        if (!item) {
            showErrorMessage('Item not found.');
            return;
        }

        // Populate form with item data
        populateForm(item);

        // Show cancel button
        const cancelBtn = document.getElementById('cancel-btn');
        if (cancelBtn) {
            cancelBtn.style.display = 'inline-block';
        }

    } catch (error) {
        console.error('Error editing item:', error);
        showErrorMessage('Failed to load item for editing.');
    } finally {
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.textContent = 'Save Item';
        }
    }
}

/**
 * Populate form with item data
 * @param {Object} item - Item data
 */
function populateForm(item) {
    document.getElementById('item-id').value = item.id;
    document.getElementById('item-type').value = item.item_type;
    document.getElementById('distribution-type').value = item.distribution_type;
    document.getElementById('name').value = item.name;
    document.getElementById('short-description').value = item.short_description;
    document.getElementById('full-description').value = item.full_description;
    document.getElementById('version').value = item.version;
    document.getElementById('release-date').value = item.release_date.split('T')[0];
    document.getElementById('is-featured').checked = item.is_featured;
    document.getElementById('is-published').checked = item.is_published;

    // Set external URL if available
    if (item.distribution_type === 'link' && item.external_url) {
        document.getElementById('external-url').value = item.external_url;
    }

    // Toggle distribution fields
    toggleDistributionFields(item.distribution_type);
}

/**
 * Delete item
 * @param {string} itemId - Item ID
 */
async function deleteItem(itemId) {
    if (!confirm('Are you sure you want to delete this item? This action cannot be undone.')) {
        return;
    }

    try {
        // Delete item from database
        const success = await window.dataService.deleteItem(itemId);

        if (success) {
            showSuccessMessage('Item deleted successfully!');
            await loadItemsList();
        } else {
            showErrorMessage('Failed to delete item.');
        }
    } catch (error) {
        console.error('Error deleting item:', error);
        showErrorMessage('Failed to delete item. Please try again.');
    }
}

/**
 * Reset form
 */
function resetForm() {
    document.getElementById('item-form').reset();
    document.getElementById('item-id').value = '';
    document.getElementById('cancel-btn').style.display = 'none';
    toggleDistributionFields('file');
}

/**
 * Show success message
 * @param {string} message - Success message
 */
function showSuccessMessage(message) {
    const successElement = document.createElement('div');
    successElement.className = 'success-message';
    successElement.textContent = message;
    successElement.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background-color: var(--accent-green);
        color: var(--primary-black);
        padding: 1rem;
        border-radius: 4px;
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
    `;

    document.body.appendChild(successElement);

    setTimeout(() => {
        successElement.remove();
    }, 5000);
}

/**
 * Show error message
 * @param {string} message - Error message
 */
function showErrorMessage(message) {
    const errorElement = document.createElement('div');
    errorElement.className = 'error-message';
    errorElement.textContent = message;
    errorElement.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background-color: #ff4444;
        color: white;
        padding: 1rem;
        border-radius: 4px;
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
    `;

    document.body.appendChild(errorElement);

    setTimeout(() => {
        errorElement.remove();
    }, 5000);
}
