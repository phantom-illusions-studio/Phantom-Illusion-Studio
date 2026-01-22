/**
 * Main Application Script
 * Handles homepage functionality including featured items
 */
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the application
    initHomePage();

    // Add smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });
});

/**
 * Initialize homepage functionality
 */
async function initHomePage() {
    try {
        // Load featured items
        await loadFeaturedItems();

        // Add animations
        addPageAnimations();
    } catch (error) {
        console.error('Error initializing homepage:', error);
        showErrorMessage('Failed to load homepage content. Please refresh the page.');
    }
}

/**
 * Load featured items from Supabase
 */
async function loadFeaturedItems() {
    const featuredItemsContainer = document.getElementById('featured-items');
    if (!featuredItemsContainer) return;

    try {
        // Show loading state
        featuredItemsContainer.innerHTML = '<div class="loading">Loading featured items...</div>';

        // Fetch featured items
        const items = await window.dataService.getFeaturedItems();

        if (items.length === 0) {
            featuredItemsContainer.innerHTML = '<div class="loading">No featured items available.</div>';
            return;
        }

        // Render items
        renderItemsGrid(items, featuredItemsContainer);

    } catch (error) {
        console.error('Error loading featured items:', error);
        featuredItemsContainer.innerHTML = '<div class="loading">Failed to load featured items. Please try again later.</div>';
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

    // Add fade-in animation
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
    // Animate hero content
    const heroContent = document.querySelector('.hero-content');
    if (heroContent) {
        heroContent.classList.add('fade-in');
    }

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
