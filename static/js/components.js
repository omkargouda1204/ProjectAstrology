/**
 * Shared Components for Om Sri Mahakali Bhairavi Astrology Center
 * This file contains reusable components like header, navbar, and footer
 * Include this in every HTML page to avoid code duplication
 */

// Configuration
const SITE_CONFIG = {
    name: 'Om Sri Mahakali Bhairavi Astrology Center',
    nameKannada: 'ಓಂ ಶ್ರೀ ಮಹಾಕಾಳಿ ಭೈರವಿ ಜ್ಯೋತಿಷ್ಯ ಶಾಸ್ತ್ರಂ',
    logoUrl: '/static/assets/images/logo.png',
    logoAlt: 'Om Sri Mahakali Bhairavi Astrology Center Logo'
};

/**
 * Initialize Shared Components
 * Call this function on page load
 */
async function initializeSharedComponents() {
    try {
        console.log('🔄 Initializing shared components...');
        
        // Render components
        renderAnnouncementBar(); // Home page only
        renderNavbar();
        renderFooter();
        console.log('✅ Components rendered');
        
        // Set current year immediately
        setCurrentYear();
        
        // Initialize components after DOM is ready
        setTimeout(async () => {
            try {
                // Load announcement bar (home page only)
                await loadAnnouncementBar();
                
                // Initialize navbar settings
                await initializeNavbar();
                console.log('✅ Navbar settings loaded');
                
                // Setup mobile menu
                setupMobileMenu();
                console.log('✅ Mobile menu setup complete');
                
                // Load footer contact information
                await loadFooterContactInfo();
                console.log('✅ Footer contact info loaded');
                
                console.log('✅ All shared components initialized successfully');
            } catch (error) {
                console.error('❌ Error in component initialization:', error);
            }
        }, 150);
        
    } catch (error) {
        console.error('❌ Error initializing shared components:', error);
    }
}

/**
 * Render Announcement Bar (Home Page Only)
 */
function renderAnnouncementBar() {
    const announcementPlaceholder = document.getElementById('announcement-placeholder');
    if (!announcementPlaceholder) return; // Not on home page
    
    announcementPlaceholder.innerHTML = `
        <!-- Announcement Bar (Auto-Scrolling) -->
        <div id="announcement-bar" class="bg-gradient-to-r from-red-500 to-orange-500 text-white overflow-hidden" style="display: none;">
            <div class="announcement-ticker py-2">
                <div id="announcement-content" class="flex items-center space-x-8 whitespace-nowrap">
                    <!-- Announcements will be dynamically loaded -->
                </div>
            </div>
        </div>
    `;
}

/**
 * Render Navigation Bar - Matches Previous Structure Exactly
 */
function renderNavbar() {
    const navbarPlaceholder = document.getElementById('navbar-placeholder');
    if (!navbarPlaceholder) return;
    
    navbarPlaceholder.innerHTML = `
        <!-- Clean Header Section (Yenepoya Style) -->
        <header class="bg-white border-b-2 border-gray-200 shadow-md">
            <div class="container mx-auto px-4 py-5 md:py-6">
                <div class="flex items-center justify-between md:justify-start md:space-x-8">
                    <!-- Logo - Direct Display (No Round Shape, No Fallback Icon) -->
                    <div class="flex-shrink-0 logo-container">
                        <img id="navbar-logo" src="" alt="Om Sri Mahakali Bhairavi Astrology Center Logo" class="h-24 w-auto sm:h-28 md:h-32 lg:h-40 xl:h-48 object-contain transition-transform duration-300 hover:scale-105" style="max-width: 350px;">
                    </div>
                    
                    <!-- Website Name & Tagline - Fully Responsive -->
                    <div class="flex-1 min-w-0 px-2 sm:px-4 website-name-container">
                        <h1 id="website-name" class="text-lg sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-gray-800 tracking-wide leading-tight break-words animate-fade-in">
                            Om Sri Mahakali Bhairavi Jyotishya Shastram
                        </h1>
                        <p id="website-subtitle" class="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl text-gray-600 mt-1 md:mt-2 font-medium break-words animate-fade-in-delay">
                            Specialized Astrology & Pooja Services
                        </p>
                    </div>
                    
                    <!-- Mobile Menu Toggle -->
                    <button id="mobile-menu-btn" class="lg:hidden p-3 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors">
                        <i class="fas fa-bars text-3xl"></i>
                    </button>
                </div>
            </div>
        </header>

        <!-- Main Navigation Bar (Blue/Purple Theme) - Increased Height -->
        <nav id="main-navbar" class="bg-gradient-to-r from-purple-700 via-purple-600 to-indigo-700 text-white sticky top-0 z-50 shadow-2xl">
            <div class="container mx-auto px-4">
                <div class="flex items-center justify-between h-16 md:h-20 lg:h-24">
                    
                    <!-- Desktop Menu -->
                    <div id="desktop-menu" class="hidden lg:flex items-center space-x-4 flex-1">
                        <!-- Menu items will be dynamically loaded -->
                    </div>
                    
                    <!-- Language Selector -->
                    <div class="hidden lg:block relative">
                        <button id="lang-dropdown-btn" class="flex items-center space-x-2 px-4 py-3 rounded-lg hover:bg-white hover:bg-opacity-20 transition-all duration-300 text-base md:text-lg font-medium">
                            <i class="fas fa-globe text-xl"></i>
                            <span>EN</span>
                            <i class="fas fa-chevron-down text-sm"></i>
                        </button>
                        <div id="lang-dropdown" class="hidden absolute right-4 mt-2 w-48 bg-white rounded-lg shadow-xl border overflow-hidden">
                            <div id="google_translate_element" class="p-2"></div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Mobile Navigation Menu -->
            <div id="mobile-menu" class="lg:hidden hidden bg-purple-800">
                <div class="container mx-auto px-4 py-3">
                    <!-- Website name in mobile menu -->
                    <div class="border-b border-purple-600 pb-3 mb-3">
                        <h2 class="text-lg font-bold">OM SRI MAHAKALI BHAIRAVI ASTROLOGY CENTER</h2>
                        <p class="text-sm mt-1">ಓಂ ಶ್ರೀ ಮಹಾಕಾಳಿ ಭೈರವಿ ಜ್ಯೋತಿಷ್ಯ ಶಾಸ್ತ್ರಂ</p>
                        <p class="text-xs text-purple-200">Specialized Astrology & Pooja Services</p>
                    </div>
                    
                    <!-- Mobile menu items will be dynamically loaded -->
                    <div id="mobile-menu-items" class="space-y-1"></div>
                    
                    <!-- Language in mobile -->
                    <div class="mt-3 pt-3 border-t border-purple-600">
                        <button onclick="document.getElementById('lang-dropdown').classList.toggle('hidden')" class="w-full text-left px-3 py-2 rounded hover:bg-purple-700">
                            <i class="fas fa-globe mr-2"></i>Language: EN
                        </button>
                    </div>
                </div>
            </div>
        </nav>

        <!-- Announcement Bar (Clean style like Yenepoya) -->
        <div id="announcement-bar" class="bg-gradient-to-r from-red-500 to-orange-500 text-white overflow-hidden" style="display: none;">
            <div class="announcement-ticker py-2">
                <div id="announcement-content" class="flex items-center space-x-8 whitespace-nowrap animate-scroll">
                    <!-- Announcements will be dynamically loaded -->
                </div>
            </div>
        </div>
    `;
}

/**
 * Render Footer
 */
function renderFooter() {
    const footerPlaceholder = document.getElementById('footer-placeholder');
    if (!footerPlaceholder) return;
    
    footerPlaceholder.innerHTML = `
        <footer class="bg-black text-white py-12">
            <div class="container mx-auto px-4">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div>
                        <h3 class="text-2xl font-bold mb-4 font-serif">${SITE_CONFIG.name}</h3>
                        <p class="text-sm text-gray-300 mb-3">${SITE_CONFIG.nameKannada}</p>
                        <p class="text-gray-300">Your trusted guide to cosmic wisdom and spiritual enlightenment.</p>
                    </div>
                    <div>
                        <h4 class="text-xl font-bold mb-4">Quick Links</h4>
                        <ul class="space-y-2">
                            <li><a href="/" class="hover:text-yellow-300 transition">Home</a></li>
                            <li><a href="/#services" class="hover:text-yellow-300 transition">Services</a></li>
                            <li><a href="/contact" class="hover:text-yellow-300 transition">Contact</a></li>
                            <li><a href="/#reviews" class="hover:text-yellow-300 transition">Reviews</a></li>
                            <li><a href="/privacy" class="hover:text-yellow-300 transition">Privacy Policy</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 class="text-xl font-bold mb-4">Contact Us</h4>
                        <div id="footer-contact-info" class="space-y-2">
                            <p><i class="fas fa-phone mr-2"></i><span id="footer-phone">Loading...</span></p>
                            <p><i class="fas fa-envelope mr-2"></i><span id="footer-email">Loading...</span></p>
                            <div id="footer-socials" class="flex space-x-4 mt-4">
                                <!-- Social links loaded from API -->
                            </div>
                        </div>
                    </div>
                </div>
                <div class="border-t border-purple-600 mt-8 pt-8 text-center text-purple-200">
                    <p>&copy; <span id="current-year"></span> ${SITE_CONFIG.name} (${SITE_CONFIG.nameKannada}). All rights reserved.</p>
                    <p class="text-sm mt-2">Astrologer: Venkatanatha Kulakarni | Mysuru, Karnataka</p>
                    <p class="mt-2 text-sm">
                        Developed by <a href="https://omkargouda.netlify.app/" target="_blank" class="text-yellow-300 hover:text-yellow-400 transition inline-flex items-center gap-1">
                            <i class="fas fa-briefcase"></i>
                            Omkar Gouda
                        </a>
                    </p>
                </div>
            </div>
        </footer>
    `;
}

/**
 * Setup Mobile Menu Toggle - Works with both old and new structures
 */
function setupMobileMenu() {
    try {
        // Try multiple possible element IDs for toggle button
        const toggleBtn = document.getElementById('mobile-menu-toggle') || 
                         document.getElementById('mobile-menu-btn') || 
                         document.querySelector('[data-mobile-menu="toggle"]');
        
        // Try multiple possible element IDs for mobile menu
        const mobileMenu = document.getElementById('mobile-menu') || 
                          document.getElementById('mobile-nav') ||
                          document.querySelector('[data-mobile-menu="menu"]');
        
        if (!toggleBtn) {
            console.warn('Mobile menu toggle button not found');
            return;
        }
        
        if (!mobileMenu) {
            console.warn('Mobile menu element not found');
            return;
        }
        
        // Remove any existing event listeners
        const newToggleBtn = toggleBtn.cloneNode(true);
        toggleBtn.parentNode.replaceChild(newToggleBtn, toggleBtn);
        
        // Add click event listener
        newToggleBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            const icon = this.querySelector('i');
            const isHidden = mobileMenu.classList.contains('hidden');
            
            // Toggle menu visibility
            mobileMenu.classList.toggle('hidden');
            
            // Update icon if present
            if (icon) {
                if (isHidden) {
                    // Menu was hidden, now showing
                    icon.classList.remove('fa-bars');
                    icon.classList.add('fa-times');
                } else {
                    // Menu was showing, now hidden
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-bars');
                }
            }
        });
        
        console.log('✅ Mobile menu event listener attached successfully');
    } catch (error) {
        console.error('❌ Error setting up mobile menu:', error);
    }
}

/**
 * Initialize Navbar with Previous Functionality
 */
async function initializeNavbar() {
    try {
        // Load navbar settings exactly like before
        const settingsResponse = await fetch('/api/navbar-settings');
        if (settingsResponse.ok) {
            const settings = await settingsResponse.json();
            console.log('Loading navbar from navbar_settings:', settings);
            
            // Update logo
            if (settings.logo_url) {
                console.log('Loading logo from:', settings.logo_url);
                const logoImg = document.getElementById('navbar-logo');
                if (logoImg) {
                    logoImg.src = settings.logo_url;
                    logoImg.onerror = function() {
                        console.warn('Logo failed to load:', settings.logo_url);
                        this.style.display = 'none';
                    };
                }
            }
            
            // Update website name and subtitle
            if (settings.name) {
                const nameEl = document.getElementById('website-name');
                if (nameEl) {
                    nameEl.textContent = settings.name;
                }
            }
            
            if (settings.subtitle1) {
                const subtitleEl = document.getElementById('website-subtitle');
                if (subtitleEl) {
                    subtitleEl.textContent = settings.subtitle1;
                }
            }
        }
    } catch (error) {
        console.error('Error loading navbar:', error);
    }
}

/**
 * Load Announcement Bar (Home Page Only)
 */
async function loadAnnouncementBar() {
    try {
        const response = await fetch('/api/content/announcements');
        if (!response.ok) return; // Silently fail if announcements not available
        
        const announcements = await response.json();
        if (announcements && announcements.length > 0) {
            const announcementBar = document.getElementById('announcement-bar');
            const announcementContent = document.getElementById('announcement-content');
            
            if (!announcementBar || !announcementContent) return;
            
            // Create announcement items (duplicate for seamless loop)
            const announcementHTML = announcements.map(a => `
                <div class="flex items-center space-x-2">
                    <i class="fas fa-star text-yellow-300"></i>
                    <span>${a.text}</span>
                </div>
            `).join('');
            
            // Duplicate content for seamless scrolling
            announcementContent.innerHTML = announcementHTML + announcementHTML;
            announcementBar.style.display = 'block';
            
            console.log('✅ Announcement bar loaded');
        }
    } catch (error) {
        console.warn('Announcements not loaded:', error.message);
    }
}

/**
 * Load Footer Contact Information
 */
async function loadFooterContactInfo() {
    try {
        const response = await fetch('/api/contact-info');
        if (!response.ok) throw new Error('Failed to load contact info');
        
        const data = await response.json();
        
        // Update phone
        const phoneEl = document.getElementById('footer-phone');
        if (phoneEl && data.phone) phoneEl.textContent = data.phone;
        
        // Update email
        const emailEl = document.getElementById('footer-email');
        if (emailEl && data.email) emailEl.textContent = data.email;
        
        // Update address
        const addressEl = document.getElementById('footer-address');
        if (addressEl && data.address) addressEl.textContent = data.address;
        
        // Update social media links - check both footer-social and footer-socials
        if (data.social_media) {
            const socialEl = document.getElementById('footer-social') || document.getElementById('footer-socials');
            if (socialEl) {
                const socialIcons = {
                    facebook: 'fab fa-facebook-f',
                    instagram: 'fab fa-instagram',
                    twitter: 'fab fa-twitter',
                    youtube: 'fab fa-youtube',
                    linkedin: 'fab fa-linkedin-in',
                    whatsapp: 'fab fa-whatsapp'
                };
                
                const socialHTML = Object.entries(data.social_media)
                    .filter(([key, value]) => value)
                    .map(([key, value]) => {
                        const icon = socialIcons[key] || 'fas fa-link';
                        return `<a href="${value}" target="_blank" rel="noopener noreferrer" 
                                   class="bg-purple-600 hover:bg-purple-700 p-3 rounded-full transition">
                                   <i class="${icon}"></i>
                                </a>`;
                    }).join('');
                
                socialEl.innerHTML = socialHTML;
            }
        }
    } catch (error) {
        console.error('Error loading footer contact info:', error);
        
        // Fallback values
        const phoneEl = document.getElementById('footer-phone');
        const emailEl = document.getElementById('footer-email');
        if (phoneEl) phoneEl.textContent = 'Contact us for details';
        if (emailEl) emailEl.textContent = 'info@astrology-center.com';
    }
}

/**
 * Set Current Year
 */
function setCurrentYear() {
    const yearEl = document.getElementById('current-year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();
}

/**
 * Open Booking Chatbot
 */
function openBookingChatbot() {
    const chatbotToggle = document.getElementById('chatbot-toggle');
    if (chatbotToggle) {
        chatbotToggle.click();
        setTimeout(() => {
            if (typeof sendMenuOption === 'function') {
                sendMenuOption('book');
            }
        }, 500);
    }
}

/**
 * Image Error Handler - Show placeholder on error
 */
function handleImageError(img, type = 'service') {
    const placeholders = {
        service: 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22%3E%3Crect fill=%22%237C3AED%22 width=%22200%22 height=%22200%22/%3E%3Ctext fill=%22white%22 font-size=%2220%22 x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22%3EService Image%3C/text%3E%3C/svg%3E',
        slider: 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22800%22 height=%22600%22%3E%3Crect fill=%22%23667eea%22 width=%22800%22 height=%22600%22/%3E%3Ctext fill=%22white%22 font-size=%2230%22 x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22%3EImage Not Available%3C/text%3E%3C/svg%3E',
        profile: 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22%3E%3Ccircle fill=%22%237C3AED%22 cx=%2250%22 cy=%2250%22 r=%2250%22/%3E%3Ctext fill=%22white%22 font-size=%2240%22 x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22%3E?%3C/text%3E%3C/svg%3E'
    };
    
    img.onerror = null; // Prevent infinite loop
    img.src = placeholders[type] || placeholders.service;
}

// Auto-initialize on DOM load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSharedComponents);
} else {
    initializeSharedComponents();
}
