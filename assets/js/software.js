/**
 * Software Page Script
 * Handles software listing functionality
 */
document.addEventListener('DOMContentLoaded', function() {
    initSoftwarePage();
});

/**
 * Initialize software page
 */
async function initSoftwarePage() {
    try {
        await loadSoftware();
        addPageAnimations();
    } catch (error) {
        console.error('Error initializing software page:', error);
        showErrorMessage('Failed to load software. Please refresh the page.');
    }
}

/**
 * Load software from Supabase
 */
async function loadSoftware() {
    const softwareContainer = document.getElementById('software-grid');
    if (!softwareContainer) return;

    try {
        // Show loading state
        softwareContainer.innerHTML = '<div class="loading">Loading software...</div>';

        // Fetch software
        const items = await window.dataService.getItemsByType('software');

        if (items.length === 0) {
            softwareContainer.innerHTML = '<div class="loading">No software available.</div>';
            return;
        }

        // Render items
        await renderItemsGrid(items, softwareContainer);

    } catch (error) {
        console.error('Error loading software:', error);
        softwareContainer.innerHTML = '<div class="loading">Failed to load software. Please try again later.</div>';
    }
}

/**
 * Render items grid
 * @param {Array} items - Array of items to render
 * @param {HTMLElement} container - Container element
 */
async function renderItemsGrid(items, container) {
    container.innerHTML = '';

    for (const item of items) {
        const itemCard = await createItemCard(item);
        container.appendChild(itemCard);
    }

    // Add animations
    setTimeout(() => {
        container.querySelectorAll('.item-card').forEach((card, index) => {
            card.style.animationDelay = `${index * 0.1}s`;
            card.classList.add('fade-in');
        });
    }, 100);
}

/**
 * Create item card element
 * @param {Object} item - Item data
 * @returns {Promise<HTMLElement>} Item card element
 */
async function createItemCard(item) {
    const card = document.createElement('div');
    card.className = 'item-card';
    card.dataset.itemId = item.id;

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

    // Create card content
    card.innerHTML = `
        <img src="${iconUrl}" alt="${item.name} icon" class="item-icon" onerror="this.src='assets/images/placeholder-icon.png'">
        <div class="item-content">
            <h3>${item.name}</h3>
            <p>${item.short_description}</p>
            <div class="item-meta">
                <span>${item.item_type}</span>
                <span>v${item.version}</span>
            </div>
            <div class="item-actions">
                ${getActionButton(item)}
            </div>
        </div>
    `;

    // Add click handler to navigate to description page
    card.addEventListener('click', function(e) {
        // Don't navigate if button was clicked
        if (e.target.closest('.download-btn, .view-btn')) return;

        window.location.href = `description.html?id=${item.id}`;
    });

    return card;
}

/**
 * Get action button based on distribution type
 * @param {Object} item - Item data
 * @returns {string} HTML for action button
 */
function getActionButton(item) {
    if (!item.is_published) return '';

    if (item.distribution_type === 'file') {
        return `<a href="#" class="download-btn" onclick="handleDownload(event, '${item.id}', '${item.storage_path}')">Download</a>`;
    } else if (item.distribution_type === 'link') {
        return `<a href="${item.external_url}" class="view-btn" target="_blank" rel="noopener noreferrer">View</a>`;
    }

    return '';
}

/**
 * Handle download button click
 * @param {Event} event - Click event
 * @param {string} itemId - Item ID
 * @param {string} storagePath - Storage path
 */
async function handleDownload(event, itemId, storagePath) {
    event.preventDefault();
    event.stopPropagation();

    try {
        const publicUrl = await window.dataService.getPublicUrl(
            window.STORAGE_BUCKETS.DOWNLOADS,
            storagePath
        );

        if (publicUrl) {
            // Create a temporary anchor element with download attribute for direct CDN download
            const link = document.createElement('a');
            link.href = publicUrl;
            link.download = storagePath.split('/').pop() || 'download';
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else {
            console.error('Public URL is null for storagePath:', storagePath);
            showErrorMessage('Download URL not available. Please contact support.');
        }
    } catch (error) {
        console.error('Error handling download:', error);
        showErrorMessage('Failed to initiate download. Please try again.');
    }
}

/**
 * Add page animations
 */
function addPageAnimations() {
    // Animate page header
    const pageHeader = document.querySelector('.page-header');
    if (pageHeader) {
        pageHeader.classList.add('fade-in');
    }
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
