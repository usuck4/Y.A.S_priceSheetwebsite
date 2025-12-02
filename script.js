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

// Configuration
const CONFIG = {
    github: {
        username: 'YOUR_GITHUB_USERNAME', // ← Change this!
        repo: 'YOUR_REPO_NAME', // ← Change this!
        branch: 'main'
    },
    imagePaths: [
        'prices/today.jpg',
        'prices/latest.jpg',
        'prices/current.jpg'
    ],
    autoRefresh: 5 * 60 * 1000, // 5 minutes in milliseconds
    cacheBusting: true
};

// GitHub API URL helper
function getGitHubUrl(path) {
    return `https://raw.githubusercontent.com/${CONFIG.github.username}/${CONFIG.github.repo}/${CONFIG.github.branch}/${path}`;
}

// Utility Functions
function formatDate(date) {
    return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function formatTime(date) {
    return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

function getTodayFileName() {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}.jpg`;
}

// Image Loading
async function loadImageWithFallback() {
    loadingEl.classList.remove('hidden');
    errorEl.classList.add('hidden');
    priceImage.classList.add('hidden');
    
    // Try multiple image paths
    for (const path of CONFIG.imagePaths) {
        const url = getGitHubUrl(path) + (CONFIG.cacheBusting ? `?t=${Date.now()}` : '');
        
        try {
            const response = await fetch(url, { method: 'HEAD' });
            
            if (response.ok) {
                // Add cache busting to image URL
                const imageUrl = url + (url.includes('?') ? '&' : '?') + `cache=${Date.now()}`;
                priceImage.src = imageUrl;
                modalImage.src = imageUrl;
                
                priceImage.onload = () => {
                    loadingEl.classList.add('hidden');
                    priceImage.classList.remove('hidden');
                    updateLastUpdated();
                };
                
                priceImage.onerror = () => {
                    continue; // Try next path
                };
                
                return; // Success, exit function
            }
        } catch (error) {
            console.warn(`Failed to load ${path}:`, error);
            continue; // Try next path
        }
    }
    
    // If all paths fail
    loadingEl.classList.add('hidden');
    errorEl.classList.remove('hidden');
}

// Check if image exists
async function checkImageExists(url) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = url;
    });
}

// Update Last Updated time
function updateLastUpdated() {
    const now = new Date();
    lastUpdatedEl.textContent = `Today at ${formatTime(now)}`;
    lastUpdatedEl.innerHTML += ` <i class="fas fa-check-circle" style="color: var(--success-color); margin-left: 5px;"></i>`;
}

// Refresh functionality
function refreshPage() {
    loadImageWithFallback();
    currentDateEl.textContent = formatDate(new Date());
    
    // Show refresh animation
    refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Refreshing...';
    refreshBtn.disabled = true;
    
    setTimeout(() => {
        refreshBtn.innerHTML = '<i class="fas fa-redo"></i> Refresh Now';
        refreshBtn.disabled = false;
        
        // Show success message
        const successMsg = document.createElement('div');
        successMsg.className = 'success-message';
        successMsg.innerHTML = '<i class="fas fa-check-circle"></i> Price sheet refreshed!';
        successMsg.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--success-color);
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            z-index: 3000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(successMsg);
        
        setTimeout(() => {
            successMsg.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => successMsg.remove(), 300);
        }, 3000);
    }, 1000);
}

// Modal functionality
function openModal() {
    zoomModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeModalFunc() {
    zoomModal.classList.add('hidden');
    document.body.style.overflow = 'auto';
}

// Download functionality
function downloadImage() {
    const link = document.createElement('a');
    link.href = priceImage.src;
    link.download = `price-sheet-${new Date().toISOString().split('T')[0]}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Load previous price sheets (simulated - you can enhance this)
async function loadPreviousSheets() {
    // In a real implementation, you would fetch a list of files from GitHub API
    // For now, we'll show a static list or a message
    
    const today = new Date();
    const previousDays = [];
    
    // Generate last 7 days
    for (let i = 1; i <= 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        previousDays.push(date);
    }
    
    const html = previousDays.map(date => {
        const dateStr = date.toISOString().split('T')[0];
        const displayStr = date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });
        
        return `
            <div class="previous-item" onclick="loadSpecificDate('${dateStr}')">
                <strong>${displayStr}</strong>
                <small style="color: #666; display: block; margin-top: 5px;">
                    <i class="far fa-calendar"></i> View price sheet
                </small>
            </div>
        `;
    }).join('');
    
    previousList.innerHTML = html;
}

function loadSpecificDate(dateStr) {
    const url = getGitHubUrl(`prices/${dateStr}.jpg`);
    priceImage.src = url + `?t=${Date.now()}`;
    
    // Update UI to show we're viewing a past date
    const date = new Date(dateStr);
    currentDateEl.textContent = formatDate(date);
    currentDateEl.innerHTML += ` <span style="background: var(--warning-color); color: white; padding: 2px 8px; border-radius: 12px; font-size: 0.8rem; margin-left: 10px;">PAST DATE</span>`;
    
    // Scroll to image
    priceImage.scrollIntoView({ behavior: 'smooth' });
}

// Initialize
function init() {
    // Set current date
    const now = new Date();
    currentDateEl.textContent = formatDate(now);
    loadTimeEl.textContent = `${formatTime(now)}`;
    
    // Load image
    loadImageWithFallback();
    
    // Load previous sheets
    loadPreviousSheets();
    
    // Set up auto-refresh
    setInterval(loadImageWithFallback, CONFIG.autoRefresh);
    
    // Set up event listeners
    refreshBtn.addEventListener('click', refreshPage);
    zoomBtn.addEventListener('click', openModal);
    downloadBtn.addEventListener('click', downloadImage);
    closeModal.addEventListener('click', closeModalFunc);
    downloadModalBtn.addEventListener('click', downloadImage);
    
    // Close modal on background click
    zoomModal.addEventListener('click', (e) => {
        if (e.target === zoomModal) {
            closeModalFunc();
        }
    });
    
    // Close modal with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !zoomModal.classList.contains('hidden')) {
            closeModalFunc();
        }
    });
    
    // Add CSS for animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
        .success-message {
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
    `;
    document.head.appendChild(style);
}

// Start the application
document.addEventListener('DOMContentLoaded', init);
