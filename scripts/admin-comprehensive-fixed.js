// Global variables for data management
let heroSlides = [];
let galleryImages = [];
let messages = [];
let bookings = [];

// Global API configuration
const API_BASE = '/api';

// Supabase Storage Configuration
const SUPABASE_URL = 'https://lpcviiavefxepvtcedxs.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxwY3ZpaWF2ZWZ4ZXB2dGNlZHhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyMzEyMjcsImV4cCI6MjA3NzgwNzIyN30.UbWtdEjZ8booAruThvUzt7kJoa9iCcXj-bzQf4lhZCU';
const STORAGE_BUCKET = 'astrology';

// Upload image to Supabase Storage with folder organization
async function uploadImageToSupabase(file, folder = 'general') {
    try {
        if (!file) return null;
        
        // Create filename with folder structure: folder/timestamp-filename
        const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const fileName = `${folder}/${Date.now()}-${cleanFileName}`;
        
        const response = await fetch(`${SUPABASE_URL}/storage/v1/object/${STORAGE_BUCKET}/${fileName}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': file.type
            },
            body: file
        });
        
        if (!response.ok) {
            const error = await response.text();
            console.error('Upload error:', error);
            throw new Error('Upload failed: ' + error);
        }
        
        // Return public URL
        return `${SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/${fileName}`;
    } catch (error) {
        console.error('Image upload error:', error);
        showMessage('Failed to upload image: ' + error.message, 'error');
        return null;
    }
}

// Global utility function for API calls
async function apiCall(endpoint, options = {}) {
    try {
        const response = await fetch(API_BASE + endpoint, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('API call failed:', error);
        showMessage('API call failed: ' + error.message, 'error');
        throw error;
    }
}

// Global show message function
function showMessage(message, type = 'success') {
    const messageDiv = document.createElement('div');
    messageDiv.className = `fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 ${
        type === 'success' ? 'bg-green-500' : 'bg-red-500'
    } text-white`;
    messageDiv.textContent = message;
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        messageDiv.style.opacity = '0';
        setTimeout(() => messageDiv.remove(), 300);
    }, 3000);
}

// Global utility function to format dates
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const adminDashboard = document.getElementById('admin-dashboard');
    const loginScreen = document.getElementById('login-screen');
    const loginError = document.getElementById('login-error');

    // Secure login handler - validates with backend (no sensitive data in frontend)
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const password = document.getElementById('admin-password').value;
        
        try {
            // Use SupabaseAPI instead of old API call
            const response = await SupabaseAPI.verifyAdmin(password);
            
            if (response.success) {
                loginScreen.classList.add('hidden');
                adminDashboard.classList.remove('hidden');
                loginError.classList.add('hidden');
                // Initialize admin dashboard with all data
                initializeAdminDashboard();
                // Load initial overview data
                loadTabData('stats');
            } else {
                loginError.classList.remove('hidden');
                loginError.textContent = 'Invalid password. Please try again.';
            }
        } catch (error) {
            loginError.classList.remove('hidden');
            loginError.textContent = 'Login failed. Please check your connection and try again.';
            console.error('Login error:', error);
        }
    });

    // Tab switching
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Deactivate all buttons and hide all content
            tabButtons.forEach(btn => {
                btn.classList.remove('active');
                btn.classList.add('text-gray-600', 'hover:bg-gray-100');
            });
            tabContents.forEach(content => {
                content.classList.add('hidden');
            });

            // Activate the clicked button and show its content
            button.classList.add('active');
            button.classList.remove('text-gray-600', 'hover:bg-gray-100');
            const tab = button.getAttribute('data-tab');
            document.getElementById(`${tab}-section`).classList.remove('hidden');
            
            // Load data for the specific tab
            loadTabData(tab);
        });
    });

    // Load data for different tabs
    function loadTabData(tab) {
        switch(tab) {
            case 'overview':
            case 'stats':
                loadOverviewData();
                break;
            case 'hero':
                loadHeroSlidesData();
                break;
            case 'gallery':
                loadGalleryData();
                break;
            case 'messages':
                loadMessagesData();
                break;
            case 'bookings':
                loadBookingsData();
                break;
            case 'business':
                loadBusinessInfo();
                break;
            case 'testimonials':
                loadTestimonials();
                break;
            case 'chatbot':
                loadChatbotConfig();
                break;
            case 'settings':
                loadSettings();
                break;
            default:
                console.log('Unknown tab:', tab);
        }
    }

    // Hero Slide Form Handlers
    const addHeroSlideBtn = document.getElementById('add-hero-slide-btn');
    const heroSlideForm = document.getElementById('hero-slide-form');
    const cancelHeroSlideEdit = document.getElementById('cancel-hero-slide-edit');
    
    if (addHeroSlideBtn) {
        addHeroSlideBtn.addEventListener('click', showAddHeroSlideForm);
    }
    
    if (cancelHeroSlideEdit) {
        cancelHeroSlideEdit.addEventListener('click', () => {
            document.getElementById('hero-slide-form-container').classList.add('hidden');
            heroSlideForm.reset();
        });
    }
    
    if (heroSlideForm) {
        heroSlideForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const slideIdEl = document.getElementById('hero-slide-id');
            const titleEl = document.getElementById('hero-slide-title');
            const descriptionEl = document.getElementById('hero-slide-description');
            
            if (!titleEl || !descriptionEl) {
                showMessage('Form elements not found!', 'error');
                return;
            }
            
            const slideId = slideIdEl ? slideIdEl.value : '';
            const title = titleEl.value.trim();
            const description = descriptionEl.value.trim();
            const imageFile = document.getElementById('hero-slide-image')?.files[0];
            
            if (!title || !description) {
                showMessage('Please fill in all required fields!', 'error');
                return;
            }
            
            // Upload image if provided
            let imageUrl = `${SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/hero-slides/default-hero.jpg`;
            if (imageFile) {
                showMessage('Uploading image to Supabase...', 'info');
                imageUrl = await uploadImageToSupabase(imageFile, 'hero-slides');
                if (!imageUrl) {
                    showMessage('Failed to upload image. Please try again.', 'error');
                    return;
                }
            }
            
            const slideData = { 
                title, 
                description, 
                image: imageUrl,
                active: true 
            };
            
            try {
                if (slideId) {
                    await apiCall(`/hero-slides/${slideId}`, {
                        method: 'PUT',
                        body: JSON.stringify(slideData)
                    });
                    showMessage('Hero slide updated successfully!');
                } else {
                    await apiCall('/hero-slides', {
                        method: 'POST',
                        body: JSON.stringify(slideData)
                    });
                    showMessage('Hero slide created successfully!');
                }
                
                const formContainer = document.getElementById('hero-slide-form-container');
                if (formContainer) formContainer.classList.add('hidden');
                heroSlideForm.reset();
                await loadHeroSlidesData();
            } catch (error) {
                showMessage('Failed to save: ' + error.message, 'error');
            }
        });
    }

    // Gallery Form Handlers  
    const addGalleryImageBtn = document.getElementById('add-gallery-image-btn');
    const galleryImageForm = document.getElementById('gallery-image-form');
    const cancelGalleryImageEdit = document.getElementById('cancel-gallery-image-edit');
    
    if (addGalleryImageBtn) {
        addGalleryImageBtn.addEventListener('click', showAddGalleryImageForm);
    }
    
    if (cancelGalleryImageEdit) {
        cancelGalleryImageEdit.addEventListener('click', () => {
            document.getElementById('gallery-image-form-container').classList.add('hidden');
            galleryImageForm.reset();
        });
    }
    
    if (galleryImageForm) {
        galleryImageForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const imageIdEl = document.getElementById('gallery-image-id');
            const titleEl = document.getElementById('gallery-image-title');
            const descriptionEl = document.getElementById('gallery-image-description');
            
            if (!titleEl || !descriptionEl) {
                showMessage('Form elements not found!', 'error');
                return;
            }
            
            const imageId = imageIdEl ? imageIdEl.value : '';
            const title = titleEl.value.trim();
            const description = descriptionEl.value.trim();
            const imageFile = document.getElementById('gallery-image-file')?.files[0];
            
            if (!title || !description) {
                showMessage('Please fill in all required fields!', 'error');
                return;
            }
            
            // Upload image if provided
            let imageUrl = `${SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/gallery/default-gallery.jpg`;
            if (imageFile) {
                showMessage('Uploading image to Supabase...', 'info');
                imageUrl = await uploadImageToSupabase(imageFile, 'gallery');
                if (!imageUrl) {
                    showMessage('Failed to upload image. Please try again.', 'error');
                    return;
                }
            }
            
            const imageData = { 
                title, 
                description, 
                image: imageUrl,
                active: true 
            };
            
            try {
                if (imageId) {
                    await apiCall(`/gallery-slides/${imageId}`, {
                        method: 'PUT',
                        body: JSON.stringify(imageData)
                    });
                    showMessage('Gallery image updated successfully!');
                } else {
                    await apiCall('/gallery-slides', {
                        method: 'POST',
                        body: JSON.stringify(imageData)
                    });
                    showMessage('Gallery image created successfully!');
                }
                
                const formContainer = document.getElementById('gallery-image-form-container');
                if (formContainer) formContainer.classList.add('hidden');
                galleryImageForm.reset();
                await loadGalleryData();
            } catch (error) {
                showMessage('Failed to save: ' + error.message, 'error');
            }
        });
    }

    // Business Info Form Handler
    const businessInfoForm = document.getElementById('business-info-form');
    const editBusinessBtn = document.getElementById('edit-business-btn');
    const saveBusinessBtn = document.getElementById('save-business-btn');
    const cancelBusinessBtn = document.getElementById('cancel-business-btn');
    
    // Disable form initially
    function setBusinessFormEditable(editable) {
        const inputs = businessInfoForm.querySelectorAll('input, textarea');
        inputs.forEach(input => input.disabled = !editable);
        
        if (editable) {
            editBusinessBtn.classList.add('hidden');
            saveBusinessBtn.classList.remove('hidden');
            cancelBusinessBtn.classList.remove('hidden');
        } else {
            editBusinessBtn.classList.remove('hidden');
            saveBusinessBtn.classList.add('hidden');
            cancelBusinessBtn.classList.add('hidden');
        }
    }
    
    if (editBusinessBtn) {
        editBusinessBtn.addEventListener('click', () => {
            setBusinessFormEditable(true);
        });
    }
    
    if (cancelBusinessBtn) {
        cancelBusinessBtn.addEventListener('click', () => {
            setBusinessFormEditable(false);
            loadBusinessInfo(); // Reload original data
        });
    }
    
    if (businessInfoForm) {
        // Initialize as read-only
        setBusinessFormEditable(false);
        
        businessInfoForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const businessData = {
                address: document.getElementById('business-address').value.trim(),
                email: document.getElementById('business-email').value.trim(),
                phone: document.getElementById('business-phone').value.trim(),
                website: document.getElementById('business-website').value.trim(),
                hoursWeekday: document.getElementById('business-hours-weekday')?.value.trim() || '',
                hoursSunday: document.getElementById('business-hours-sunday')?.value.trim() || '',
                socialMedia: {
                    facebook: document.getElementById('facebook-url')?.value.trim() || '',
                    instagram: document.getElementById('instagram-url')?.value.trim() || '',
                    youtube: document.getElementById('youtube-url')?.value.trim() || '',
                    twitter: document.getElementById('twitter-url')?.value.trim() || '',
                    linkedin: document.getElementById('linkedin-url')?.value.trim() || ''
                }
            };
            
            try {
                await apiCall('/admin/business-info', {
                    method: 'PUT',
                    body: JSON.stringify(businessData)
                });
                showMessage('Business information updated successfully!');
                setBusinessFormEditable(false);
            } catch (error) {
                showMessage('Failed to update: ' + error.message, 'error');
            }
        });
    }

    // Password Change Form Handler
    const changePasswordForm = document.getElementById('change-password-form');
    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const currentPassword = document.getElementById('current-password').value;
            const newPassword = document.getElementById('new-password').value;
            const confirmPassword = document.getElementById('confirm-password').value;
            
            if (newPassword.length < 6) {
                showMessage('Password must be at least 6 characters long!', 'error');
                return;
            }
            
            if (newPassword !== confirmPassword) {
                showMessage('New passwords do not match!', 'error');
                return;
            }
            
            try {
                await apiCall('/admin/change-password', {
                    method: 'POST',
                    body: JSON.stringify({ 
                        current_password: currentPassword, 
                        new_password: newPassword 
                    })
                });
                showMessage('Password changed successfully!');
                changePasswordForm.reset();
            } catch (error) {
                showMessage('Failed to change password: ' + error.message, 'error');
            }
        });
    }

    // API Base URL
    // API functions now global

    // Overview data - Load real statistics from database
    async function loadOverviewData() {
        try {
            // Load statistics from Supabase
            const [heroSlidesData, gallerySlidesData, leadsData] = await Promise.all([
                SupabaseAPI.getHeroSlides(),
                SupabaseAPI.getGallerySlides(),
                SupabaseAPI.getLeads()
            ]);

            // Extract data properly
            const heroSlides = heroSlidesData.slides || heroSlidesData || [];
            const galleryImages = gallerySlidesData.slides || gallerySlidesData || [];
            const allLeads = leadsData || {};
            const contacts = allLeads.contacts || [];
            const bookings = allLeads.bookings || [];

            // Update stats cards if they exist
            const statHero = document.getElementById('stat-hero');
            const statGallery = document.getElementById('stat-gallery');
            const statContacts = document.getElementById('stat-contacts');
            const statMessages = document.getElementById('stat-messages') || document.getElementById('total-messages');
            const statBookings = document.getElementById('stat-bookings') || document.getElementById('total-bookings');

            if (statHero) statHero.textContent = heroSlides.length || 0;
            if (statGallery) statGallery.textContent = galleryImages.length || 0;
            if (statContacts) statContacts.textContent = contacts.length || 0;
            if (statMessages) statMessages.textContent = contacts.length || 0;
            if (statBookings) statBookings.textContent = bookings.length || 0;

            // Update other stats if elements exist
            const totalVisitors = document.getElementById('total-visitors');
            const conversionRate = document.getElementById('conversion-rate');
            
            if (totalVisitors) totalVisitors.textContent = '1,234'; // Placeholder
            if (conversionRate) conversionRate.textContent = '4.2%'; // Placeholder

        } catch (error) {
            console.error('Failed to load overview data:', error);
        }
    }

    // Data arrays now managed globally

    // Data loading functions are now defined globally
    
    // Business Info management
    async function loadBusinessInfo() {
        try {
            const response = await SupabaseAPI.getBusinessInfo();
            const businessData = response.success ? response : response;
            if (businessData) {
                document.getElementById('business-address').value = businessData.address || '';
                document.getElementById('business-email').value = businessData.email || '';
                document.getElementById('business-phone').value = businessData.phone || '';
                document.getElementById('business-website').value = businessData.website || '';
                
                // Load business hours
                if (document.getElementById('business-hours-weekday')) {
                    document.getElementById('business-hours-weekday').value = businessData.hoursWeekday || '';
                }
                if (document.getElementById('business-hours-sunday')) {
                    document.getElementById('business-hours-sunday').value = businessData.hoursSunday || '';
                }
                
                // Load social media URLs if they exist
                if (document.getElementById('facebook-url')) {
                    const social = businessData.socialMedia || {};
                    document.getElementById('facebook-url').value = social.facebook || '';
                    document.getElementById('instagram-url').value = social.instagram || '';
                    document.getElementById('youtube-url').value = social.youtube || '';
                    document.getElementById('twitter-url').value = social.twitter || '';
                    document.getElementById('linkedin-url').value = social.linkedin || '';
                }
            }
        } catch (error) {
            console.error('Failed to load business info:', error);
        }
    }

    // Settings management
    async function loadSettings() {
        try {
            const lastLoginTime = document.getElementById('last-login-time');
            if (lastLoginTime) {
                lastLoginTime.textContent = new Date().toLocaleString();
            }
        } catch (error) {
            console.error('Failed to load settings:', error);
        }
    }

    // Global functions for hero slides management
    window.addNewHeroSlide = async function() {
        try {
            const newSlide = await apiCall('/hero-slides', {
                method: 'POST',
                body: JSON.stringify({
                    title: 'New Hero Slide',
                    description: 'Enter description here...',
                    image_url: '',
                    is_active: true
                })
            });
            
            showMessage('New hero slide added successfully!');
            await loadHeroData();
        } catch (error) {
            console.error('Failed to add hero slide:', error);
        }
    };

    window.saveHeroSlide = async function(id) {
        try {
            const title = document.getElementById(`hero-title-${id}`).value;
            const description = document.getElementById(`hero-description-${id}`).value;
            const image_url = document.getElementById(`hero-image-${id}`).value;
            const is_active = document.getElementById(`hero-active-${id}`).checked;

            await apiCall(`/hero-slides/${id}`, {
                method: 'PUT',
                body: JSON.stringify({
                    title,
                    description,
                    image_url,
                    is_active
                })
            });

            showMessage('Hero slide updated successfully!');
            await loadHeroData();
        } catch (error) {
            console.error('Failed to update hero slide:', error);
        }
    };

    window.deleteHeroSlide = async function(id) {
        if (confirm('Are you sure you want to delete this slide? This action cannot be undone.')) {
            try {
                await apiCall(`/hero-slides/${id}`, {
                    method: 'DELETE'
                });
                
                showMessage('Hero slide deleted successfully!');
                await loadHeroData();
            } catch (error) {
                console.error('Failed to delete hero slide:', error);
            }
        }
    };

    // Hero slide management functions
    window.addNewHeroSlide = async function() {
        try {
            const newSlide = await apiCall('/hero-slides', {
                method: 'POST',
                body: JSON.stringify({
                    title: 'New Hero Slide',
                    description: 'Enter slide description here',
                    image_url: '',
                    is_active: true
                })
            });
            
            showMessage('New hero slide added successfully!');
            await loadHeroSlidesData();
        } catch (error) {
            console.error('Failed to add hero slide:', error);
            showMessage('Failed to add hero slide. Please try again.', 'error');
        }
    };

    window.saveHeroSlide = async function(id) {
        try {
            const title = document.getElementById(`hero-title-${id}`).value;
            const description = document.getElementById(`hero-description-${id}`).value;
            const image_url = document.getElementById(`hero-image-${id}`).value;
            const is_active = document.getElementById(`hero-active-${id}`).checked;

            await apiCall(`/hero-slides/${id}`, {
                method: 'PUT',
                body: JSON.stringify({
                    title,
                    description,
                    image_url,
                    is_active
                })
            });

            showMessage('Hero slide updated successfully!');
            await loadHeroSlidesData();
        } catch (error) {
            console.error('Failed to update hero slide:', error);
            showMessage('Failed to update hero slide. Please try again.', 'error');
        }
    };

    window.deleteHeroSlide = async function(id) {
        if (confirm('Are you sure you want to delete this hero slide? This action cannot be undone.')) {
            try {
                await apiCall(`/hero-slides/${id}`, {
                    method: 'DELETE'
                });
                
                showMessage('Hero slide deleted successfully!');
                await loadHeroSlidesData();
            } catch (error) {
                console.error('Failed to delete hero slide:', error);
                showMessage('Failed to delete hero slide. Please try again.', 'error');
            }
        }
    };

    // Gallery management functions
    window.addNewGalleryImage = async function() {
        try {
            const newImage = await apiCall('/gallery-slides', {
                method: 'POST',
                body: JSON.stringify({
                    title: 'New Gallery Image',
                    image_url: '',
                    category: 'general',
                    is_active: true
                })
            });
            
            showMessage('New gallery image added successfully!');
            await loadGalleryData();
        } catch (error) {
            console.error('Failed to add gallery image:', error);
            showMessage('Failed to add gallery image. Please try again.', 'error');
        }
    };

    window.saveGalleryImage = async function(id) {
        try {
            const title = document.getElementById(`gallery-title-${id}`).value;
            const image_url = document.getElementById(`gallery-image-${id}`).value;
            const category = document.getElementById(`gallery-category-${id}`).value;
            const is_active = document.getElementById(`gallery-active-${id}`).checked;

            await apiCall(`/gallery-slides/${id}`, {
                method: 'PUT',
                body: JSON.stringify({
                    title,
                    image_url,
                    category,
                    is_active
                })
            });

            showMessage('Gallery image updated successfully!');
            await loadGalleryData();
        } catch (error) {
            console.error('Failed to update gallery image:', error);
        }
    };

    window.deleteGalleryImage = async function(id) {
        if (confirm('Are you sure you want to delete this image? This action cannot be undone.')) {
            try {
                await apiCall(`/gallery-slides/${id}`, {
                    method: 'DELETE'
                });
                
                showMessage('Gallery image deleted successfully!');
                await loadGalleryData();
            } catch (error) {
                console.error('Failed to delete gallery image:', error);
            }
        }
    };

    // Messages management functions
    window.replyToMessage = function(id) {
        const message = messages.find(msg => msg.id === id);
        if (message) {
            const emailSubject = `Re: Your inquiry about astrology services`;
            const emailBody = `Hi ${message.name},\n\nThank you for contacting Cosmic Astrology.\n\n[Your response here]\n\nBest regards,\nCosmic Astrology Team`;
            const mailtoLink = `mailto:${message.email}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
            window.open(mailtoLink);
        }
    };

    window.deleteMessage = async function(id) {
        if (confirm('Are you sure you want to delete this message? This action cannot be undone.')) {
            try {
                await apiCall(`/contacts/${id}`, {
                    method: 'DELETE'
                });
                
                showMessage('Message deleted successfully!');
                await loadMessagesData();
            } catch (error) {
                console.error('Failed to delete message:', error);
            }
        }
    };

    // Bookings management functions
    window.updateBookingStatus = function(id) {
        const booking = bookings.find(b => b.id === id);
        if (booking) {
            const newStatus = prompt('Enter new status (pending, confirmed, cancelled):', booking.status);
            if (newStatus && ['pending', 'confirmed', 'cancelled'].includes(newStatus.toLowerCase())) {
                // Update booking status via API
                apiCall(`/bookings/${id}`, {
                    method: 'PUT',
                    body: JSON.stringify({ status: newStatus.toLowerCase() })
                }).then(() => {
                    showMessage('Booking status updated successfully!');
                    loadBookingsData();
                }).catch(error => {
                    console.error('Failed to update booking status:', error);
                });
            }
        }
    };

    window.deleteBooking = async function(id) {
        if (confirm('Are you sure you want to delete this booking? This action cannot be undone.')) {
            try {
                await apiCall(`/bookings/${id}`, {
                    method: 'DELETE'
                });
                
                showMessage('Booking deleted successfully!');
                await loadBookingsData();
            } catch (error) {
                console.error('Failed to delete booking:', error);
            }
        }
    };

    // Business info functions
    window.saveBusinessInfo = function() {
        showMessage('Business information saved successfully!');
    };

    // Initial render
    renderMessages();
    renderBookings();
});

// Global data loading functions (moved outside DOMContentLoaded scope)
async function loadHeroSlidesData() {
    try {
        const data = await SupabaseAPI.getHeroSlides();
        // Handle both {slides: [...]} and direct array responses
        heroSlides = data.slides || data || [];
        renderHeroSlides();
    } catch (error) {
        console.error('Failed to load hero slides:', error);
        heroSlides = [];
        renderHeroSlides();
    }
}

// Alias for compatibility
const loadHeroData = loadHeroSlidesData;

function renderHeroSlides() {
    const container = document.getElementById('hero-slides-list');
    if (!container) {
        console.warn('Hero slides container not found');
        return;
    }
    
    if (heroSlides.length === 0) {
        container.innerHTML = `
            <div class="admin-form text-center py-8">
                <p class="text-gray-500 mb-4">No hero slides found</p>
                <button onclick="showAddHeroSlideForm()" class="btn btn-primary">
                    <i class="fas fa-plus mr-2"></i>Add Your First Hero Slide
                </button>
            </div>
        `;
        return;
    }

    container.innerHTML = '<div class="grid grid-cols-1 lg:grid-cols-2 gap-8">' + heroSlides.map(slide => `
        <div class="admin-form p-6 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            <div class="flex flex-col gap-4">
                <div class="w-full h-72 flex-shrink-0 rounded-xl overflow-hidden shadow-lg bg-gray-100">
                    <img src="${slide.image || '../assets/images/placeholder.svg'}" 
                         alt="${slide.title}" 
                         class="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                         onerror="this.src='../assets/images/placeholder.svg'">
                </div>
                <div class="flex-1">
                    <div class="flex items-start justify-between mb-3">
                        <h3 class="text-xl font-bold text-gray-800 line-clamp-2">${slide.title}</h3>
                    </div>
                    <p class="text-gray-600 mb-4 leading-relaxed line-clamp-3">${slide.description}</p>
                    <div class="flex flex-wrap gap-2 mb-4 text-sm">
                        <span class="bg-purple-50 px-3 py-1 rounded-full text-purple-700">
                            <i class="fas fa-calendar mr-1"></i>${formatDate(slide.created_at)}
                        </span>
                        ${slide.display_order ? `<span class="bg-blue-50 px-3 py-1 rounded-full text-blue-700"><i class="fas fa-sort mr-1"></i>Order: ${slide.display_order}</span>` : ''}
                        <span class="bg-green-50 px-3 py-1 rounded-full text-green-700">
                            <i class="fas fa-check-circle mr-1"></i>Active
                        </span>
                    </div>
                    <div class="flex gap-2">
                        <button onclick="editHeroSlide(${slide.id})" class="btn btn-sm btn-secondary flex-1">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button onclick="deleteHeroSlide(${slide.id})" class="btn btn-sm btn-danger flex-1">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('') + '</div>';
}

async function loadGalleryData() {
    try {
        const data = await SupabaseAPI.getGallerySlides();
        // Handle both {slides: [...]} and direct array responses
        galleryImages = data.slides || data || [];
        renderGalleryImages();
    } catch (error) {
        console.error('Failed to load gallery images:', error);
        galleryImages = [];
        renderGalleryImages();
    }
}

function renderGalleryImages() {
    const container = document.getElementById('gallery-images-list');
    if (!container) {
        console.warn('Gallery images container not found');
        return;
    }
    
    if (galleryImages.length === 0) {
        container.innerHTML = `
            <div class="admin-form text-center py-8">
                <p class="text-gray-500 mb-4">No gallery images found</p>
                <button onclick="showAddGalleryImageForm()" class="btn btn-primary">
                    <i class="fas fa-plus mr-2"></i>Add Your First Gallery Image
                </button>
            </div>
        `;
        return;
    }

    container.innerHTML = '<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">' + galleryImages.map(image => `
        <div class="admin-form p-6 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            <div class="flex flex-col gap-4">
                <div class="w-full h-72 flex-shrink-0 rounded-xl overflow-hidden shadow-lg bg-gray-100">
                    <img src="${image.image || '../assets/images/placeholder.svg'}" 
                         alt="${image.title || 'Gallery Image'}" 
                         class="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                         onerror="this.src='../assets/images/placeholder.svg'">
                </div>
                <div class="flex-1">
                    <h3 class="text-lg font-bold text-gray-800 mb-2 line-clamp-1">${image.title || 'Untitled'}</h3>
                    <p class="text-gray-600 text-sm mb-3 line-clamp-2">${image.description || 'No description'}</p>
                    <div class="flex flex-wrap gap-2 mb-3 text-xs">
                        <span class="bg-blue-50 px-2 py-1 rounded-full text-blue-700">
                            <i class="fas fa-calendar mr-1"></i>${formatDate(image.created_at)}
                        </span>
                        <span class="bg-green-50 px-2 py-1 rounded-full text-green-700">
                            <i class="fas fa-check-circle mr-1"></i>Active
                        </span>
                    </div>
                    <div class="flex gap-2">
                        <button onclick="editGalleryImage(${image.id})" class="btn btn-sm btn-secondary flex-1 text-xs">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button onclick="deleteGalleryImage(${image.id})" class="btn btn-sm btn-danger flex-1 text-xs">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('') + '</div>';
}

async function loadMessagesData() {
    try {
        const data = await SupabaseAPI.getLeads();
        messages = data.contacts || [];
        renderMessages();
    } catch (error) {
        console.error('Failed to load messages:', error);
        messages = [];
        renderMessages();
    }
}

async function loadBookingsData() {
    try {
        const data = await SupabaseAPI.getLeads();
        bookings = data.bookings || [];
        renderBookings();
    } catch (error) {
        console.error('Failed to load bookings:', error);
        bookings = [];
        renderBookings();
    }
}

function renderMessages() {
    const container = document.getElementById('messages-list');
    if (!container) {
        console.warn('Messages container not found');
        return;
    }
    
    if (messages.length === 0) {
        container.innerHTML = `
            <div class="admin-form text-center py-8">
                <p class="text-gray-500">No contact messages found</p>
            </div>
        `;
        return;
    }

    container.innerHTML = messages.map(message => `
        <div class="admin-form p-6 mb-4 hover:shadow-lg transition-shadow">
            <div class="flex justify-between items-start mb-4">
                <div class="flex-1">
                    <div class="flex items-center gap-3 mb-2">
                        <div class="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-bold text-lg">
                            ${message.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h3 class="text-lg font-bold text-gray-800">${message.name}</h3>
                            <div class="flex items-center gap-2 text-sm text-gray-500">
                                <i class="fas fa-envelope"></i>
                                <span>${message.email || 'No email'}</span>
                                <span class="mx-2">•</span>
                                <i class="fas fa-phone"></i>
                                <span>${message.phone}</span>
                            </div>
                        </div>
                    </div>
                    <div class="bg-gray-50 rounded-lg p-4 mb-3">
                        <p class="text-gray-700 leading-relaxed">${message.message}</p>
                    </div>
                    <div class="flex items-center space-x-4 text-sm text-gray-500">
                        <span class="bg-green-50 px-3 py-1 rounded-full">
                            <i class="fas fa-calendar mr-1"></i>${formatDate(message.created_at)}
                        </span>
                        <span class="bg-blue-50 px-3 py-1 rounded-full">
                            <i class="fas fa-tag mr-1"></i>${message.topic || 'General'}
                        </span>
                        <span class="bg-purple-50 px-3 py-1 rounded-full">
                            <i class="fas fa-globe mr-1"></i>${message.source || 'Website'}
                        </span>
                    </div>
                </div>
            </div>
            <div class="flex flex-wrap gap-2 pt-4 border-t border-gray-200">
                <a href="mailto:${message.email}?subject=Re: ${encodeURIComponent(message.topic || 'Your Inquiry')}&body=Hi ${encodeURIComponent(message.name)},%0D%0A%0D%0A" 
                   class="btn btn-sm btn-primary">
                    <i class="fas fa-reply mr-1"></i> Reply via Email
                </a>
                <a href="tel:${message.phone}" class="btn btn-sm btn-secondary">
                    <i class="fas fa-phone mr-1"></i> Call
                </a>
                <a href="https://wa.me/${message.phone.replace(/[^0-9]/g, '')}?text=Hi%20${encodeURIComponent(message.name)}" 
                   class="btn btn-sm btn-success" target="_blank">
                    <i class="fab fa-whatsapp mr-1"></i> WhatsApp
                </a>
                <button onclick="deleteMessage(${message.id})" class="btn btn-sm btn-danger">
                    <i class="fas fa-trash mr-1"></i> Delete
                </button>
            </div>
        </div>
    `).join('');
}

function renderBookings() {
    const container = document.getElementById('bookings-list');
    if (!container) {
        console.warn('Bookings container not found');
        return;
    }
    
    if (bookings.length === 0) {
        container.innerHTML = `
            <div class="admin-form text-center py-8">
                <p class="text-gray-500">No bookings found</p>
            </div>
        `;
        return;
    }

    container.innerHTML = bookings.map(booking => `
        <div class="admin-form p-6 mb-4 hover:shadow-lg transition-shadow">
            <div class="flex justify-between items-start mb-4">
                <div class="flex-1">
                    <div class="flex items-center gap-3 mb-2">
                        <div class="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-lg">
                            ${booking.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h3 class="text-lg font-bold text-gray-800">${booking.name}</h3>
                            <div class="flex items-center gap-2 text-sm text-gray-500">
                                ${booking.email ? `<i class="fas fa-envelope"></i><span>${booking.email}</span><span class="mx-2">•</span>` : ''}
                                <i class="fas fa-phone"></i>
                                <span>${booking.phone}</span>
                            </div>
                        </div>
                    </div>
                    ${booking.message ? `
                    <div class="bg-gray-50 rounded-lg p-4 mb-3">
                        <p class="text-gray-700 leading-relaxed">${booking.message}</p>
                    </div>
                    ` : ''}
                    <div class="flex items-center space-x-4 text-sm text-gray-500">
                        ${booking.dob ? `<span class="bg-pink-50 px-3 py-1 rounded-full"><i class="fas fa-birthday-cake mr-1"></i>DOB: ${booking.dob}</span>` : ''}
                        <span class="bg-orange-50 px-3 py-1 rounded-full">
                            <i class="fas fa-calendar mr-1"></i>${formatDate(booking.created_at)}
                        </span>
                        <span class="bg-blue-50 px-3 py-1 rounded-full">
                            <i class="fas fa-tag mr-1"></i>${booking.topic || 'Booking'}
                        </span>
                    </div>
                </div>
            </div>
            <div class="flex flex-wrap gap-2 pt-4 border-t border-gray-200">
                ${booking.email ? `
                <a href="mailto:${booking.email}?subject=Re: ${encodeURIComponent(booking.topic || 'Your Booking')}&body=Hi ${encodeURIComponent(booking.name)},%0D%0A%0D%0A" 
                   class="btn btn-sm btn-primary">
                    <i class="fas fa-reply mr-1"></i> Reply via Email
                </a>
                ` : ''}
                <a href="tel:${booking.phone}" class="btn btn-sm btn-secondary">
                    <i class="fas fa-phone mr-1"></i> Call
                </a>
                <a href="https://wa.me/${booking.phone.replace(/[^0-9]/g, '')}?text=Hi%20${encodeURIComponent(booking.name)},%20thank%20you%20for%20your%20booking!" 
                   class="btn btn-sm btn-success" target="_blank">
                    <i class="fab fa-whatsapp mr-1"></i> WhatsApp
                </a>
                <button onclick="deleteBooking(${booking.id})" class="btn btn-sm btn-danger">
                    <i class="fas fa-trash mr-1"></i> Delete
                </button>
                    </a>
                </div>
            </div>
        </div>
    `).join('');
}

// Action Functions for UI interactions

// Hero Slides CRUD Operations
function showAddHeroSlideForm() {
    const formContainer = document.getElementById('hero-slide-form-container');
    const form = document.getElementById('hero-slide-form');
    if (formContainer && form) {
        // Clear form for new entry
        form.reset();
        document.getElementById('hero-slide-id').value = '';
        formContainer.classList.remove('hidden');
        formContainer.scrollIntoView({ behavior: 'smooth' });
    }
}

function addNewHeroSlide() {
    showAddHeroSlideForm();
}

function editHeroSlide(slideId) {
    const slide = heroSlides.find(s => s.id === slideId);
    if (!slide) {
        showMessage('Slide not found!', 'error');
        return;
    }
    
    // Populate form with slide data
    document.getElementById('hero-slide-id').value = slide.id;
    document.getElementById('hero-slide-title').value = slide.title || '';
    document.getElementById('hero-slide-description').value = slide.description || '';
    
    // Show form
    const formContainer = document.getElementById('hero-slide-form-container');
    if (formContainer) {
        formContainer.classList.remove('hidden');
        formContainer.scrollIntoView({ behavior: 'smooth' });
    }
}

async function saveHeroSlide(slideId) {
    try {
        const title = document.getElementById(`hero-title-${slideId}`).value;
        const description = document.getElementById(`hero-description-${slideId}`).value;
        
        const slideData = {
            title: title,
            description: description,
            active: true
        };
        
        await apiCall(`/hero-slides/${slideId}`, {
            method: 'PUT',
            body: JSON.stringify(slideData)
        });
        
        showMessage('Hero slide updated successfully!');
        await loadHeroSlidesData();
    } catch (error) {
        showMessage('Failed to save hero slide: ' + error.message, 'error');
    }
}

async function deleteHeroSlide(slideId) {
    if (!confirm('Are you sure you want to delete this hero slide?')) {
        return;
    }
    
    try {
        await apiCall(`/hero-slides/${slideId}`, {
            method: 'DELETE'
        });
        showMessage('Hero slide deleted successfully!');
        await loadHeroSlidesData();
    } catch (error) {
        showMessage('Failed to delete hero slide: ' + error.message, 'error');
    }
}

// Gallery CRUD Operations
function showAddGalleryImageForm() {
    const formContainer = document.getElementById('gallery-image-form-container');
    const form = document.getElementById('gallery-image-form');
    if (formContainer && form) {
        form.reset();
        document.getElementById('gallery-image-id').value = '';
        formContainer.classList.remove('hidden');
        formContainer.scrollIntoView({ behavior: 'smooth' });
    }
}

function addNewGalleryImage() {
    showAddGalleryImageForm();
}

function editGalleryImage(imageId) {
    const image = galleryImages.find(img => img.id === imageId);
    if (!image) {
        showMessage('Image not found!', 'error');
        return;
    }
    
    document.getElementById('gallery-image-id').value = image.id;
    document.getElementById('gallery-image-title').value = image.title || '';
    document.getElementById('gallery-image-description').value = image.description || '';
    
    const formContainer = document.getElementById('gallery-image-form-container');
    if (formContainer) {
        formContainer.classList.remove('hidden');
        formContainer.scrollIntoView({ behavior: 'smooth' });
    }
}

async function saveGalleryImage(imageId) {
    try {
        const title = document.getElementById(`gallery-title-${imageId}`).value;
        const description = document.getElementById(`gallery-description-${imageId}`).value;
        
        const imageData = { title, description, active: true };
        
        await apiCall(`/gallery-slides/${imageId}`, {
            method: 'PUT',
            body: JSON.stringify(imageData)
        });
        
        showMessage('Gallery image updated successfully!');
        await loadGalleryData();
    } catch (error) {
        showMessage('Failed to save: ' + error.message, 'error');
    }
}

async function deleteGalleryImage(imageId) {
    if (!confirm('Are you sure you want to delete this gallery image?')) {
        return;
    }
    
    try {
        await apiCall(`/gallery-slides/${imageId}`, {
            method: 'DELETE'
        });
        showMessage('Gallery image deleted successfully!');
        await loadGalleryData();
    } catch (error) {
        showMessage('Failed to delete: ' + error.message, 'error');
    }
}

// Message and Booking Delete Functions
async function deleteMessage(messageId) {
    if (!confirm('Are you sure you want to delete this message?')) {
        return;
    }
    
    try {
        await apiCall(`/contacts/${messageId}`, {
            method: 'DELETE'
        });
        showMessage('Message deleted successfully!');
        await loadMessagesData();
    } catch (error) {
        showMessage('Failed to delete message: ' + error.message, 'error');
    }
}

async function deleteBooking(bookingId) {
    if (!confirm('Are you sure you want to delete this booking?')) {
        return;
    }
    
    try {
        await apiCall(`/bookings/${bookingId}`, {
            method: 'DELETE'
        });
        showMessage('Booking deleted successfully!');
        await loadBookingsData();
    } catch (error) {
        showMessage('Failed to delete booking: ' + error.message, 'error');
    }
}

// Logout function
function logout() {
    document.getElementById('admin-dashboard').classList.add('hidden');
    document.getElementById('login-screen').classList.remove('hidden');
    document.getElementById('login-error').classList.add('hidden');
    document.getElementById('admin-password').value = '';
}

// Load all admin data
async function loadAllAdminData() {
    try {
        console.log('Loading admin data...');
        
        // Load all data in parallel
        await Promise.all([
            loadHeroSlidesData(),
            loadGalleryData(),
            loadMessagesData(),
            loadBookingsData()
        ]);
        
        console.log('All admin data loaded successfully');
    } catch (error) {
        console.error('Failed to load admin data:', error);
        showMessage('Failed to load some admin data. Please refresh the page.', 'error');
    }
}

// Utility functions now global - removed duplicates

// Initialize admin dashboard when login is successful
function initializeAdminDashboard() {
    console.log('Initializing admin dashboard...');
    loadAllAdminData();
    loadChatbotConfig();
    initTestimonialForm();
    
    // Refresh data every 30 seconds for real-time updates
    setInterval(() => {
        loadAllAdminData();
    }, 30000);
}

// Chatbot Configuration Functions
let chatbotConfigBackup = null;

function setChatbotFormDisabled(disabled) {
    const form = document.getElementById('chatbot-config-form');
    const inputs = form.querySelectorAll('input, textarea');
    inputs.forEach(input => {
        input.disabled = disabled;
    });
}

function toggleChatbotEdit() {
    const editBtn = document.getElementById('edit-chatbot-btn');
    const actions = document.getElementById('chatbot-form-actions');
    
    // Backup current values
    chatbotConfigBackup = {
        maps: document.getElementById('chatbot-google-maps').value,
        review: document.getElementById('chatbot-google-review').value,
        services: document.getElementById('chatbot-services').value,
        facebook: document.getElementById('chatbot-facebook').value,
        instagram: document.getElementById('chatbot-instagram').value,
        twitter: document.getElementById('chatbot-twitter').value,
        youtube: document.getElementById('chatbot-youtube').value,
        linkedin: document.getElementById('chatbot-linkedin').value,
        weekday: document.getElementById('chatbot-hours-weekday').value,
        sunday: document.getElementById('chatbot-hours-sunday').value
    };
    
    // Enable form and show actions
    setChatbotFormDisabled(false);
    editBtn.style.display = 'none';
    actions.style.display = 'flex';
}

function cancelChatbotEdit() {
    const editBtn = document.getElementById('edit-chatbot-btn');
    const actions = document.getElementById('chatbot-form-actions');
    
    // Restore backup values
    if (chatbotConfigBackup) {
        document.getElementById('chatbot-google-maps').value = chatbotConfigBackup.maps;
        document.getElementById('chatbot-google-review').value = chatbotConfigBackup.review;
        document.getElementById('chatbot-services').value = chatbotConfigBackup.services;
        document.getElementById('chatbot-facebook').value = chatbotConfigBackup.facebook;
        document.getElementById('chatbot-instagram').value = chatbotConfigBackup.instagram;
        document.getElementById('chatbot-twitter').value = chatbotConfigBackup.twitter;
        document.getElementById('chatbot-youtube').value = chatbotConfigBackup.youtube;
        document.getElementById('chatbot-linkedin').value = chatbotConfigBackup.linkedin;
        document.getElementById('chatbot-hours-weekday').value = chatbotConfigBackup.weekday;
        document.getElementById('chatbot-hours-sunday').value = chatbotConfigBackup.sunday;
    }
    
    // Disable form and hide actions
    setChatbotFormDisabled(true);
    editBtn.style.display = 'inline-flex';
    actions.style.display = 'none';
}

async function loadChatbotConfig() {
    try {
        const data = await SupabaseAPI.getChatbotConfig();
        
        if (data.success && data.config) {
            const config = data.config;
            // Populate form fields
            document.getElementById('chatbot-google-maps').value = config.google_maps_url || '';
            document.getElementById('chatbot-google-review').value = config.google_review_url || '';
            document.getElementById('chatbot-facebook').value = config.facebook_url || '';
            document.getElementById('chatbot-instagram').value = config.instagram_url || '';
            document.getElementById('chatbot-twitter').value = config.twitter_url || '';
            document.getElementById('chatbot-youtube').value = config.youtube_url || '';
            document.getElementById('chatbot-linkedin').value = config.linkedin_url || '';
            document.getElementById('chatbot-hours-weekday').value = config.hours_weekday || '';
            document.getElementById('chatbot-hours-sunday').value = config.hours_sunday || '';
            
            // Services list (if available)
            if (config.services) {
                const services = typeof config.services === 'string' ? 
                    config.services.split(',').map(s => s.trim()) : 
                    config.services;
                document.getElementById('chatbot-services').value = services.join('\n');
            }
            
            // Set form to disabled state after loading
            setChatbotFormDisabled(true);
        }
    } catch (error) {
        console.error('Failed to load chatbot config:', error);
        showMessage('Failed to load chatbot config: ' + error.message, 'error');
    }
}

// Handle chatbot configuration form submission
const chatbotConfigForm = document.getElementById('chatbot-config-form');
if (chatbotConfigForm) {
    chatbotConfigForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const services = document.getElementById('chatbot-services').value
            .split('\n')
            .map(s => s.trim())
            .filter(s => s.length > 0);
        
        const configData = {
            google_maps_url: document.getElementById('chatbot-google-maps').value,
            google_review_url: document.getElementById('chatbot-google-review').value,
            facebook_url: document.getElementById('chatbot-facebook').value,
            instagram_url: document.getElementById('chatbot-instagram').value,
            twitter_url: document.getElementById('chatbot-twitter').value,
            youtube_url: document.getElementById('chatbot-youtube').value,
            linkedin_url: document.getElementById('chatbot-linkedin').value,
            hours_weekday: document.getElementById('chatbot-hours-weekday').value,
            hours_sunday: document.getElementById('chatbot-hours-sunday').value,
            services: services.join(',')
        };
        
        try {
            const data = await SupabaseAPI.updateChatbotConfig(configData);
            
            if (data.success) {
                showMessage('Chatbot configuration updated successfully!', 'success');
                await loadChatbotConfig();
                
                // Reset edit mode
                const editBtn = document.getElementById('edit-chatbot-btn');
                const actions = document.getElementById('chatbot-form-actions');
                editBtn.style.display = 'inline-flex';
                actions.style.display = 'none';
            } else {
                throw new Error(data.error || 'Update failed');
            }
        } catch (error) {
            console.error('Failed to update chatbot config:', error);
            showMessage('Failed to update configuration: ' + error.message, 'error');
        }
    });
}

// ========================================
// TESTIMONIALS MANAGEMENT
// ========================================

async function loadTestimonials() {
    try {
        const data = await SupabaseAPI.getTestimonials();
        const testimonialsList = document.getElementById('testimonials-list');
        
        if (!data.success || !data.testimonials || data.testimonials.length === 0) {
            testimonialsList.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <i class="fas fa-star text-6xl mb-4 opacity-50"></i>
                    <p class="text-lg">No testimonials yet. Click "Add Testimonial" to create one.</p>
                </div>
            `;
            return;
        }
        
        testimonialsList.innerHTML = data.testimonials.map(testimonial => {
            const stars = '⭐'.repeat(testimonial.rating);
            return `
                <div class="bg-gray-50 rounded-xl p-6 hover:shadow-lg transition">
                    <div class="flex items-start gap-4">
                        ${testimonial.client_image_url ? 
                            `<img src="${testimonial.client_image_url}" alt="${testimonial.client_name}" class="w-16 h-16 rounded-full object-cover">` :
                            `<div class="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-2xl font-bold">
                                ${testimonial.client_name.charAt(0).toUpperCase()}
                            </div>`
                        }
                        <div class="flex-1">
                            <div class="flex justify-between items-start mb-2">
                                <div>
                                    <h4 class="font-bold text-lg text-gray-800">${testimonial.client_name}</h4>
                                    <div class="text-yellow-500 text-xl">${stars}</div>
                                </div>
                                <div class="flex gap-2">
                                    ${testimonial.google_review_url ? 
                                        `<a href="${testimonial.google_review_url}" target="_blank" class="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm">
                                            <i class="fab fa-google mr-1"></i>View
                                        </a>` : ''
                                    }
                                    <button onclick="editTestimonial(${testimonial.id})" class="px-3 py-1 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition text-sm">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button onclick="deleteTestimonial(${testimonial.id})" class="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition text-sm">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                            <p class="text-gray-600 italic">"${testimonial.review_text}"</p>
                            <div class="mt-2 text-sm text-gray-500">
                                <i class="fas fa-calendar mr-1"></i>
                                ${new Date(testimonial.created_at).toLocaleDateString()}
                                ${testimonial.is_active ? 
                                    '<span class="ml-3 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs"><i class="fas fa-check-circle mr-1"></i>Active</span>' :
                                    '<span class="ml-3 px-2 py-1 bg-gray-200 text-gray-600 rounded-full text-xs"><i class="fas fa-times-circle mr-1"></i>Inactive</span>'
                                }
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Failed to load testimonials:', error);
        showMessage('Failed to load testimonials: ' + error.message, 'error');
    }
}

function showAddTestimonialModal() {
    document.getElementById('testimonial-modal-title').innerHTML = '<i class="fas fa-star mr-2"></i>Add Testimonial';
    document.getElementById('testimonial-form').reset();
    document.getElementById('testimonial-id').value = '';
    document.getElementById('testimonial-modal').classList.remove('hidden');
}

function closeTestimonialModal() {
    document.getElementById('testimonial-modal').classList.add('hidden');
}

async function editTestimonial(id) {
    try {
        const data = await SupabaseAPI.getTestimonials();
        const testimonial = data.testimonials.find(t => t.id === id);
        
        if (testimonial) {
            document.getElementById('testimonial-modal-title').innerHTML = '<i class="fas fa-edit mr-2"></i>Edit Testimonial';
            document.getElementById('testimonial-id').value = testimonial.id;
            document.getElementById('testimonial-client-name').value = testimonial.client_name;
            document.getElementById('testimonial-rating').value = testimonial.rating;
            document.getElementById('testimonial-review').value = testimonial.review_text;
            document.getElementById('testimonial-google-url').value = testimonial.google_review_url || '';
            document.getElementById('testimonial-image-url').value = testimonial.client_image_url || '';
            document.getElementById('testimonial-modal').classList.remove('hidden');
        }
    } catch (error) {
        console.error('Failed to load testimonial:', error);
        showMessage('Failed to load testimonial: ' + error.message, 'error');
    }
}

async function deleteTestimonial(id) {
    if (!confirm('Are you sure you want to delete this testimonial?')) {
        return;
    }
    
    try {
        const data = await SupabaseAPI.deleteTestimonial(id);
        
        if (data.success) {
            showMessage('Testimonial deleted successfully!', 'success');
            loadTestimonials();
        } else {
            throw new Error(data.error || 'Delete failed');
        }
    } catch (error) {
        console.error('Failed to delete testimonial:', error);
        showMessage('Failed to delete testimonial: ' + error.message, 'error');
    }
}

// Handle testimonial form submission
function initTestimonialForm() {
    document.getElementById('testimonial-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const id = document.getElementById('testimonial-id').value;
        const testimonialData = {
            client_name: document.getElementById('testimonial-client-name').value,
            rating: parseInt(document.getElementById('testimonial-rating').value),
            review_text: document.getElementById('testimonial-review').value,
            google_review_url: document.getElementById('testimonial-google-url').value || null,
            client_image_url: document.getElementById('testimonial-image-url').value || null
        };
        
        try {
            let data;
            if (id) {
                // Update existing testimonial
                data = await SupabaseAPI.updateTestimonial(parseInt(id), testimonialData);
            } else {
                // Add new testimonial
                data = await SupabaseAPI.addTestimonial(testimonialData);
            }
            
            if (data.success) {
                showMessage(`Testimonial ${id ? 'updated' : 'added'} successfully!`, 'success');
                closeTestimonialModal();
                loadTestimonials();
            } else {
                throw new Error(data.error || 'Operation failed');
            }
        } catch (error) {
            console.error('Failed to save testimonial:', error);
            showMessage('Failed to save testimonial: ' + error.message, 'error');
        }
    });
}