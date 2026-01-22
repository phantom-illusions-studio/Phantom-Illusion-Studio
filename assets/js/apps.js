/**
 * Apps Page Script
 * Handles apps listing functionality
 */
document.addEventListener('DOMContentLoaded', function() {
    initAppsPage();
});

/**
 * Initialize apps page
 */
async function initAppsPage() {
    try {
        await loadApps();
        addPageAnimations();
    } catch (error) {
        console.error('Error initializing apps page:', error);
        showErrorMessage('Failed to load apps. Please refresh the page.');
    }
}

/**
 * Load apps from Supabase
 */
async function loadApps() {
    const appsContainer = document.getElementById('apps-grid');
    if (!appsContainer) return;

    try {
        // Show loading state
        appsContainer.innerHTML = '<div class="loading">Loading applications...</div>';

        // Fetch apps
        const items = await window.dataService.getItemsByType('app');

        if (items.length === 0) {
            appsContainer.innerHTML = '<div class="loading">No applications available.</div>';
            return;
        }

        // Render items
        await renderItemsGrid(items, appsContainer);

    } catch (error) {
        console.error('Error loading apps:', error);
        appsContainer.innerHTML = '<div class="loading">Failed to load applications. Please try again later.</div>';
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
