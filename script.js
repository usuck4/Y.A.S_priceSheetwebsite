// DOM Elements
const priceImage = document.getElementById('price-image');
const currentDateEl = document.getElementById('current-date');
const lastUpdatedEl = document.getElementById('last-updated');
const refreshBtn = document.getElementById('refresh-btn');
const zoomBtn = document.getElementById('zoom-btn');
const downloadBtn = document.getElementById('download-btn');
const loadingEl = document.getElementById('loading');
const errorEl = document.getElementById('error-message');
const zoomModal = document.getElementById('zoom-modal');
const closeModal = document.getElementById('close-modal');
const modalImage = document.getElementById('modal-image');
const downloadModalBtn = document.getElementById('download-modal-btn');
const previousList = document.getElementById('previous-list');
const loadTimeEl = document.getElementById('load-time');

// Configuration - YOU MUST CHANGE THESE!
const CONFIG = {
    github: {
        username: 'usuck4',      // ← CHANGE THIS to your GitHub username
        repo: 'Y.A.S_priceSheetwebsite',         // ← CHANGE THIS to your repository name
        branch: 'main'
    },
    imagePaths: [
        'prices/today.jpg',
        'prices/latest.jpg'
    ],
    autoRefresh: 5 * 60 * 1000, // 5 minutes
    cacheBusting: true
};

// ========== UTILITY FUNCTIONS ==========
function formatDate(date) {
    const options = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    };
    return date.toLocaleDateString('en-US', options);
}

function formatTime(date) {
    const options = {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    };
    return date.toLocaleTimeString('en-US', options);
}

function getTodayFileName() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}.jpg`;
}

function getGitHubUrl(path) {
    return `https://raw.githubusercontent.com/${CONFIG.github.username}/${CONFIG.github.repo}/${CONFIG.github.branch}/${path}`;
}

// ========== IMAGE LOADING ==========
async function loadImageWithFallback() {
    console.log('Loading image...');
    
    // Show loading, hide image and error
    loadingEl.classList.remove('hidden');
    priceImage.classList.add('hidden');
    errorEl.classList.add('hidden');
    
    let imageLoaded = false;
    
    // Try each image path
    for (const path of CONFIG.imagePaths) {
        const timestamp = CONFIG.cacheBusting ? `?t=${Date.now()}` : '';
        const imageUrl = getGitHubUrl(path) + timestamp;
        
        console.log(`Trying: ${imageUrl}`);
        
        try {
            // First check if image exists
            const response = await fetch(imageUrl, { method: 'HEAD' });
            
            if (response.ok) {
                // Set image source
                priceImage.src = imageUrl;
                modalImage.src = imageUrl;
                
                // Wait for image to load
                await new Promise((resolve, reject) => {
                    priceImage.onload = resolve;
                    priceImage.onerror = reject;
                    
                    // Set timeout for image loading
                    setTimeout(() => {
                        if (!priceImage.complete) {
                            reject(new Error('Image loading timeout'));
                        }
                    }, 10000);
                });
                
                // Success!
                loadingEl.classList.add('hidden');
                priceImage.classList.remove('hidden');
                imageLoaded = true;
                updateLastUpdated();
                console.log('Image loaded successfully');
                break; // Exit loop
            }
        } catch (error) {
            console.warn(`Failed to load ${path}:`, error);
            continue; // Try next path
        }
    }
    
    // If no image loaded, show error
    if (!imageLoaded) {
        loadingEl.classList.add('hidden');
        errorEl.classList.remove('hidden');
        console.error('All image loading attempts failed');
    }
}

// ========== UPDATE FUNCTIONS ==========
function updateDateTime() {
    const now = new Date();
    
    // Update current date
    currentDateEl.textContent = formatDate(now);
    
    // Update load time in footer
    if (loadTimeEl) {
        loadTimeEl.textContent = formatTime(now);
    }
    
    console.log('Date/time updated:', formatDate(now), formatTime(now));
}

function updateLastUpdated() {
    const now = new Date();
    if (lastUpdatedEl) {
        lastUpdatedEl.innerHTML = `
            ${formatTime(now)}
            <i class="fas fa-check-circle" style="color: #10b981; margin-left: 5px;"></i>
        `;
    }
}

// ========== REFRESH FUNCTIONALITY ==========
function refreshPage() {
    console.log('Manual refresh triggered');
    
    // Update date/time
    updateDateTime();
    
    // Show refreshing state
    refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Refreshing...';
    refreshBtn.disabled = true;
    
    // Reload image
    loadImageWithFallback();
    
    // Reset button after 2 seconds
    setTimeout(() => {
        refreshBtn.innerHTML = '<i class="fas fa-redo"></i> Refresh Now';
        refreshBtn.disabled = false;
        
        // Show success notification
        showNotification('Price sheet refreshed successfully!', 'success');
    }, 2000);
}

// ========== MODAL FUNCTIONALITY ==========
function openModal() {
    console.log('Opening modal');
    zoomModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeModalFunc() {
    console.log('Closing modal');
    zoomModal.classList.add('hidden');
    document.body.style.overflow = 'auto';
}

// ========== DOWNLOAD FUNCTIONALITY ==========
function downloadImage() {
    const link = document.createElement('a');
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    
    link.href = priceImage.src;
    link.download = `price-sheet-${dateStr}.jpg`;
    link.target = '_blank';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification('Download started!', 'info');
}

// ========== PREVIOUS SHEETS (EXAMPLE) ==========
function loadPreviousSheets() {
    const today = new Date();
    const previousDays = [];
    
    // Generate last 7 days (excluding today)
    for (let i = 1; i <= 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        previousDays.push(date);
    }
    
    if (previousList) {
        const html = previousDays.map(date => {
            const dateStr = date.toISOString().split('T')[0];
            const displayStr = date.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric'
            });
            
            return `
                <div class="previous-item" onclick="loadSpecificDate('${dateStr}')">
                    <strong><i class="far fa-calendar"></i> ${displayStr}</strong>
                    <small style="color: #666; display: block; margin-top: 5px;">
                        Click to view
                    </small>
                </div>
            `;
        }).join('');
        
        previousList.innerHTML = html;
    }
}

// This function needs to be globally accessible
window.loadSpecificDate = function(dateStr) {
    console.log('Loading specific date:', dateStr);
    
    const url = getGitHubUrl(`prices/${dateStr}.jpg`) + `?t=${Date.now()}`;
    const date = new Date(dateStr);
    
    // Update image source
    priceImage.src = url;
    
    // Update date display
    currentDateEl.innerHTML = `
        ${formatDate(date)}
        <span style="background: #f59e0b; color: white; padding: 2px 8px; border-radius: 12px; font-size: 0.8rem; margin-left: 10px;">
            <i class="fas fa-history"></i> PAST DATE
        </span>
    `;
    
    // Show loading
    loadingEl.classList.remove('hidden');
    priceImage.classList.add('hidden');
    
    // Check if image exists
    priceImage.onload = () => {
        loadingEl.classList.add('hidden');
        priceImage.classList.remove('hidden');
        showNotification(`Loaded price sheet for ${dateStr}`, 'info');
    };
    
    priceImage.onerror = () => {
        loadingEl.classList.add('hidden');
        errorEl.classList.remove('hidden');
        showNotification(`No price sheet found for ${dateStr}`, 'error');
    };
    
    // Scroll to image
    setTimeout(() => {
        priceImage.scrollIntoView({ behavior: 'smooth' });
    }, 500);
};

// ========== NOTIFICATION SYSTEM ==========
function showNotification(message, type = 'info') {
    // Remove any existing notification
    const existing = document.querySelector('.notification-toast');
    if (existing) existing.remove();
    
    // Create notification
    const notification = document.createElement('div');
    notification.className = `notification-toast notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
        <button class="notification-close">&times;</button>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        animation: slideInRight 0.3s ease;
        max-width: 400px;
    `;
    
    // Add close button functionality
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.style.cssText = `
        background: none;
        border: none;
        color: white;
        font-size: 1.5rem;
        cursor: pointer;
        line-height: 1;
        padding: 0;
        margin-left: 10px;
    `;
    
    closeBtn.onclick = () => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    };
    
    // Add to page
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

// ========== ADD CSS ANIMATIONS ==========
function addNotificationStyles() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOutRight {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
        .notification-content {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .notification-content i {
            font-size: 1.2rem;
        }
    `;
    document.head.appendChild(style);
}

// ========== INITIALIZATION ==========
function init() {
    console.log('Initializing price sheet website...');
    
    // Add notification styles
    addNotificationStyles();
    
    // 1. Set up initial date and time
    updateDateTime();
    console.log('Date/time initialized');
    
    // 2. Load the price sheet image
    loadImageWithFallback();
    
    // 3. Load previous sheets list
    loadPreviousSheets();
    
    // 4. Set up auto-refresh (every 5 minutes)
    setInterval(() => {
        console.log('Auto-refresh triggered');
        loadImageWithFallback();
    }, CONFIG.autoRefresh);
    
    // 5. Set up event listeners
    if (refreshBtn) {
        refreshBtn.addEventListener('click', refreshPage);
        console.log('Refresh button listener added');
    }
    
    if (zoomBtn) {
        zoomBtn.addEventListener('click', openModal);
    }
    
    if (downloadBtn) {
        downloadBtn.addEventListener('click', downloadImage);
    }
    
    if (closeModal) {
        closeModal.addEventListener('click', closeModalFunc);
    }
    
    if (downloadModalBtn) {
        downloadModalBtn.addEventListener('click', downloadImage);
    }
    
    // Close modal on background click
    if (zoomModal) {
        zoomModal.addEventListener('click', (e) => {
            if (e.target === zoomModal) {
                closeModalFunc();
            }
        });
    }
    
    // Close modal with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && zoomModal && !zoomModal.classList.contains('hidden')) {
            closeModalFunc();
        }
    });
    
    // 6. Update time every minute
    setInterval(updateDateTime, 60000);
    
    console.log('Initialization complete');
}

// ========== START APPLICATION ==========
// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', init);

// Also run init if DOM is already loaded
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(init, 100);
}

// Make init globally available for debugging
window.initApp = init;
