/**
 * Description Page Script
 * Handles item detail functionality
 */
document.addEventListener('DOMContentLoaded', function() {
    initDescriptionPage();
});

/**
 * Initialize description page
 */
async function initDescriptionPage() {
    try {
        // Get item ID from URL
        const urlParams = new URLSearchParams(window.location.search);
        const itemId = urlParams.get('id');

        if (!itemId) {
            showErrorMessage('No item ID provided.');
            return;
        }

        // Load item details
        await loadItemDetails(itemId);

        // Add animations
        addPageAnimations();

    } catch (error) {
        console.error('Error initializing description page:', error);
        showErrorMessage('Failed to load item details. Please try again.');
    }
}

/**
 * Load item details from Supabase
 * @param {string} itemId - Item ID
 */
async function loadItemDetails(itemId) {
    const detailContainer = document.getElementById('item-detail-content');
    if (!detailContainer) {
        console.error('Container element #item-detail-content not found');
        return;
    }

    try {
        // Show loading state
        detailContainer.innerHTML = '<div class="loading">Loading item details...</div>';

        // Fetch item details
        const item = await window.dataService.getItemById(itemId);

        if (!item) {
            detailContainer.innerHTML = '<div class="loading">Item not found.</div>';
            return;
        }

        // Render item details
        renderItemDetails(item, detailContainer);

    } catch (error) {
        console.error('Error loading item details:', error);
        detailContainer.innerHTML = '<div class="loading">Failed to load item details. Please try again later.</div>';
    }
}

/**
 * Render item details
 * @param {Object} item - Item data
 * @param {HTMLElement} container - Container element
 */
async function renderItemDetails(item, container) {
    // Get icon URL
    let iconUrl = 'assets/images/placeholder-icon.png';
    if (item.icon_path) {
        try {
            const publicUrl = await window.dataService.getPublicUrl(
                item.icon_bucket || window.STORAGE_BUCKETS.ICONS,
                item.icon_path
            );
            if (publicUrl) {
                iconUrl = publicUrl;
            }
        } catch (error) {
            console.error('Error getting icon URL:', error);
        }
    }

    // Format release date
    const releaseDate = new Date(item.release_date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    // Create detail HTML
    container.innerHTML = `
        <div class="detail-header fade-in">
            <img src="${iconUrl}" alt="${item.name} icon" class="detail-icon" onerror="this.src='assets/images/placeholder-icon.png'">
            <h1 class="detail-title">${item.name}</h1>
            <div class="detail-meta">
                <span><strong>Type:</strong> ${item.item_type}</span>
                <span><strong>Version:</strong> ${item.version}</span>
                <span><strong>Released:</strong> ${releaseDate}</span>
            </div>
        </div>

        <div class="detail-description fade-in">
            <h2>Description</h2>
            <p>${item.full_description}</p>
        </div>

        <div class="detail-actions fade-in">
            ${getActionButton(item)}
        </div>
    `;

    // Add animations with delay
    setTimeout(() => {
        container.querySelectorAll('.fade-in').forEach((element, index) => {
            element.style.animationDelay = `${index * 0.1}s`;
        });
    }, 100);
}

/**
 * Get action button based on distribution type
 * @param {Object} item - Item data
 * @returns {string} HTML for action button
 */
function getActionButton(item) {
    if (!item.is_published) return '<p>This item is not available for download.</p>';

    if (item.distribution_type === 'file') {
        return `<button class="download-btn" onclick="handleDownload('${item.id}', '${item.storage_path}')">Download</button>`;
    } else if (item.distribution_type === 'link') {
        return `<button class="view-btn" onclick="window.open('${item.external_url}', '_blank')">View</button>`;
    }

    return '';
}

/**
 * Handle download button click
 * @param {string} itemId - Item ID
 * @param {string} storagePath - Storage path
 */
async function handleDownload(itemId, storagePath) {
    try {
        const publicUrl = await window.dataService.getPublicUrl(
            window.STORAGE_BUCKETS.DOWNLOADS,
            storagePath
        );

        if (publicUrl) {
            window.open(publicUrl, '_blank');
        } else {
            showErrorMessage('Download URL not available.');
        }
    } catch (error) {
        console.error('Error handling download:', error);
        showErrorMessage('Failed to initiate download.');
    }
}

/**
 * Add page animations
 */
function addPageAnimations() {
    // Animate navigation
    const navLinks = document.querySelectorAll('.nav-links a');
    navLinks.forEach((link, index) => {
        link.style.animationDelay = `${index * 0.1}s`;
        link.classList.add('slide-in');
    });
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
