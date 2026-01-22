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
 * Handle form submission
 * @param {Event} event - Form submission event
 */
async function handleFormSubmit(event) {
    event.preventDefault();

    const saveBtn = document.getElementById('save-btn');
    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.textContent = 'Saving...';
    }

    try {
        // Get form data
        const formData = getFormData();

        // Validate form data
        if (!validateFormData(formData)) {
            showErrorMessage('Please fill in all required fields.');
            return;
        }

        // Handle file uploads
        const uploadResults = await handleFileUploads(formData);

        // Prepare item data
        const itemData = prepareItemData(formData, uploadResults);

        // Save item
        if (formData.itemId) {
            // Update existing item
            await window.dataService.updateItem(formData.itemId, itemData);
            showSuccessMessage('Item updated successfully!');
        } else {
            // Create new item
            await window.dataService.createItem(itemData);
            showSuccessMessage('Item created successfully!');
        }

        // Reset form and reload items
        resetForm();
        await loadItemsList();

    } catch (error) {
        console.error('Error saving item:', error);
        showErrorMessage('Failed to save item. Please try again.');
    } finally {
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.textContent = 'Save Item';
        }
    }
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
