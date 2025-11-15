/**
 * ============================================
 * SUPABASE BACKEND - Complete JavaScript Backend
 * Replaces Flask app.py with client-side Supabase integration
 * ============================================
 */

// ============================================
// CONFIGURATION (Loaded from .env file)
// ============================================
const SUPABASE_CONFIG = {
    url: 'https://lpcviiavefxepvtcedxs.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxwY3ZpaWF2ZWZ4ZXB2dGNlZHhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyMzEyMjcsImV4cCI6MjA3NzgwNzIyN30.UbWtdEjZ8booAruThvUzt7kJoa9iCcXj-bzQf4lhZCU'
};

// Business Configuration (From .env)
const BUSINESS_CONFIG = {
    whatsappNumber: '+918431729319',
    emailAddress: 'bhojanaxpress@gmail.com',
    businessAddress: '3rd Cross Rd, Austin Town, Neelasandra, Bengaluru, Karnataka 560047',
    websiteUrl: 'https://cosmicastrology.com',
    hoursWeekday: '9:00 AM - 8:00 PM',
    hoursSunday: '9:00 AM - 2:00 PM',
    googleMapsUrl: '',
    googleReviewUrl: '',
    adminPassword: 'Admin@12',
    services: [
        'Kundali Reading',
        'Tarot Reading',
        'Career Guidance',
        'Love & Relationships',
        'Health & Wellness',
        'Finance & Business',
        'Vastu Consultation',
        'Gemstone Recommendation'
    ],
    socialMedia: {
        facebook: 'https://internshala.com/i/RC2-ISP53OMKA8431',
        instagram: 'https://internshala.com/i/RC2-ISP53OMKA8431',
        twitter: 'https://internshala.com/i/RC2-ISP53OMKA8431',
        youtube: 'https://internshala.com/i/RC2-ISP53OMKA8431',
        linkedin: ''
    }
};

// Email notification configuration (using EmailJS or similar service)
const EMAIL_CONFIG = {
    enabled: false,  // Set to true if you configure EmailJS
    serviceId: 'YOUR_EMAILJS_SERVICE_ID',
    templateId: 'YOUR_EMAILJS_TEMPLATE_ID',
    publicKey: 'YOUR_EMAILJS_PUBLIC_KEY'
};

// ============================================
// SUPABASE CLIENT INITIALIZATION
// ============================================
let supabaseClient = null;

function initSupabase() {
    if (typeof supabase === 'undefined') {
        console.error('❌ Supabase library not loaded. Include it in your HTML:');
        console.error('<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>');
        return null;
    }

    if (!supabaseClient) {
        supabaseClient = supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
        console.log('✅ Supabase client initialized');
    }
    return supabaseClient;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Send email notification (using EmailJS or console log as fallback)
 */
async function sendEmailNotification(subject, data) {
    if (!EMAIL_CONFIG.enabled) {
        console.log('📧 Email Notification (would be sent):', subject);
        console.log('📧 Data:', data);
        return { success: true, method: 'console' };
    }

    try {
        // Using EmailJS for client-side email sending
        if (typeof emailjs !== 'undefined') {
            const templateParams = {
                subject: subject,
                name: data.name,
                phone: data.phone,
                email: data.email || 'N/A',
                message: data.message || 'N/A',
                dob: data.dob || 'N/A',
                topic: data.topic || 'N/A',
                source: data.source || 'Unknown',
                timestamp: new Date().toISOString()
            };

            await emailjs.send(
                EMAIL_CONFIG.serviceId,
                EMAIL_CONFIG.templateId,
                templateParams,
                EMAIL_CONFIG.publicKey
            );
            console.log('✅ Email sent via EmailJS');
            return { success: true, method: 'emailjs' };
        }
    } catch (error) {
        console.error('❌ Email error:', error);
    }

    return { success: false, error: 'Email service not configured' };
}

/**
 * Format date to ISO format
 */
function formatDate(date) {
    if (!date) return new Date().toISOString().split('T')[0];
    return new Date(date).toISOString().split('T')[0];
}

/**
 * Format time to HH:MM:SS format
 */
function formatTime(time) {
    if (!time) return '10:00:00';
    return time;
}

// ============================================
// API FUNCTIONS - LEADS & SUBMISSIONS
// ============================================

/**
 * Submit lead from contact form or chatbot
 */
async function submitLead(data) {
    const client = initSupabase();
    if (!client) {
        return { success: false, error: 'Supabase not initialized' };
    }

    try {
        const source = data.source || 'Contact Form';
        const timestamp = new Date().toISOString();

        let result;

        if (source === 'Chatbot') {
            // Insert to bookings table (no email column)
            // If date/time not provided, set to next business day at 10 AM
            const bookingDate = data.date || data.booking_date || new Date(Date.now() + 86400000).toISOString().split('T')[0];
            const bookingTime = data.time || data.booking_time || '10:00:00';
            
            const insertData = {
                name: data.name,
                phone: data.phone,
                service: data.topic || data.service || 'General Consultation',
                booking_date: formatDate(bookingDate),
                booking_time: formatTime(bookingTime),
                status: 'pending',
                notes: `Email: ${data.email || 'N/A'} | DOB: ${data.dob || 'N/A'} | ${data.message || 'Consultation request via Chatbot'}`
            };

            console.log('Inserting chatbot booking to bookings table:', insertData);

            result = await client
                .from('bookings')
                .insert(insertData)
                .select();

            if (result.error) {
                console.error('❌ Error submitting lead:', result.error);
                throw result.error;
            }

            console.log('✅ Chatbot booking stored:', insertData);
        } else {
            // Insert to contact_messages table (has email column)
            const insertData = {
                name: data.name,
                phone: data.phone || '',
                email: data.email || '',
                message: data.message || 'No message provided',
                status: 'new'
            };

            result = await client
                .from('contact_messages')
                .insert(insertData)
                .select();

            console.log('✅ Contact message stored:', insertData);
        }

        if (result.error) {
            throw result.error;
        }

        // Send email notification
        await sendEmailNotification(`🌟 New ${source} - ${data.name}`, data);

        return {
            success: true,
            message: 'Lead submitted successfully',
            data: result.data
        };

    } catch (error) {
        console.error('❌ Error submitting lead:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Get all leads (contacts and bookings)
 */
async function getLeads() {
    const client = initSupabase();
    if (!client) {
        return { success: false, error: 'Supabase not initialized' };
    }

    try {
        // Get contact messages
        const contactsResult = await client
            .from('contact_messages')
            .select('*')
            .order('created_at', { ascending: false });

        // Get bookings
        const bookingsResult = await client
            .from('bookings')
            .select('*')
            .order('created_at', { ascending: false });

        const contacts = contactsResult.data || [];
        const bookings = bookingsResult.data || [];

        return {
            success: true,
            contacts: contacts,
            bookings: bookings,
            total_count: contacts.length + bookings.length
        };

    } catch (error) {
        console.error('❌ Error fetching leads:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Delete contact message
 */
async function deleteContact(contactId) {
    const client = initSupabase();
    if (!client) {
        return { success: false, error: 'Supabase not initialized' };
    }

    try {
        const result = await client
            .from('contact_messages')
            .delete()
            .eq('id', contactId);

        if (result.error) throw result.error;

        return {
            success: true,
            message: 'Contact message deleted successfully'
        };

    } catch (error) {
        console.error('❌ Error deleting contact:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Delete booking
 */
async function deleteBooking(bookingId) {
    const client = initSupabase();
    if (!client) {
        return { success: false, error: 'Supabase not initialized' };
    }

    try {
        const result = await client
            .from('bookings')
            .delete()
            .eq('id', bookingId);

        if (result.error) throw result.error;

        return {
            success: true,
            message: 'Booking deleted successfully'
        };

    } catch (error) {
        console.error('❌ Error deleting booking:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// ============================================
// API FUNCTIONS - HERO SLIDES
// ============================================

/**
 * Get all hero slides
 */
async function getHeroSlides() {
    const client = initSupabase();
    if (!client) {
        return { success: false, slides: [] };
    }

    try {
        const result = await client
            .from('hero_slides')
            .select('*')
            .order('display_order', { ascending: true });

        return {
            success: true,
            slides: result.data || []
        };

    } catch (error) {
        console.error('❌ Error fetching hero slides:', error);
        return {
            success: true,
            slides: []  // Return empty array on error
        };
    }
}

/**
 * Add hero slide
 */
async function addHeroSlide(slideData) {
    const client = initSupabase();
    if (!client) {
        return { success: false, error: 'Supabase not initialized' };
    }

    try {
        const result = await client
            .from('hero_slides')
            .insert(slideData)
            .select();

        if (result.error) throw result.error;

        return {
            success: true,
            slide: result.data[0]
        };

    } catch (error) {
        console.error('❌ Error adding hero slide:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Update hero slide
 */
async function updateHeroSlide(slideId, slideData) {
    const client = initSupabase();
    if (!client) {
        return { success: false, error: 'Supabase not initialized' };
    }

    try {
        const result = await client
            .from('hero_slides')
            .update(slideData)
            .eq('id', slideId)
            .select();

        if (result.error) throw result.error;

        return {
            success: true,
            slide: result.data[0]
        };

    } catch (error) {
        console.error('❌ Error updating hero slide:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Delete hero slide
 */
async function deleteHeroSlide(slideId) {
    const client = initSupabase();
    if (!client) {
        return { success: false, error: 'Supabase not initialized' };
    }

    try {
        const result = await client
            .from('hero_slides')
            .delete()
            .eq('id', slideId);

        if (result.error) throw result.error;

        return {
            success: true,
            message: 'Slide deleted'
        };

    } catch (error) {
        console.error('❌ Error deleting hero slide:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// ============================================
// API FUNCTIONS - GALLERY SLIDES
// ============================================

/**
 * Get all gallery slides
 */
async function getGallerySlides() {
    const client = initSupabase();
    if (!client) {
        return { success: false, slides: [] };
    }

    try {
        const result = await client
            .from('gallery_slides')
            .select('*')
            .order('display_order', { ascending: true });

        return {
            success: true,
            slides: result.data || []
        };

    } catch (error) {
        console.error('❌ Error fetching gallery slides:', error);
        return {
            success: true,
            slides: []  // Return empty array on error
        };
    }
}

/**
 * Add gallery slide
 */
async function addGallerySlide(slideData) {
    const client = initSupabase();
    if (!client) {
        return { success: false, error: 'Supabase not initialized' };
    }

    try {
        const result = await client
            .from('gallery_slides')
            .insert(slideData)
            .select();

        if (result.error) throw result.error;

        return {
            success: true,
            slide: result.data[0]
        };

    } catch (error) {
        console.error('❌ Error adding gallery slide:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Update gallery slide
 */
async function updateGallerySlide(slideId, slideData) {
    const client = initSupabase();
    if (!client) {
        return { success: false, error: 'Supabase not initialized' };
    }

    try {
        const result = await client
            .from('gallery_slides')
            .update(slideData)
            .eq('id', slideId)
            .select();

        if (result.error) throw result.error;

        return {
            success: true,
            slide: result.data[0]
        };

    } catch (error) {
        console.error('❌ Error updating gallery slide:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Delete gallery slide
 */
async function deleteGallerySlide(slideId) {
    const client = initSupabase();
    if (!client) {
        return { success: false, error: 'Supabase not initialized' };
    }

    try {
        const result = await client
            .from('gallery_slides')
            .delete()
            .eq('id', slideId);

        if (result.error) throw result.error;

        return {
            success: true,
            message: 'Slide deleted'
        };

    } catch (error) {
        console.error('❌ Error deleting gallery slide:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// ============================================
// API FUNCTIONS - BUSINESS INFO & CONFIG
// ============================================

/**
 * Get public configuration
 */
function getConfig() {
    return {
        success: true,
        phone: BUSINESS_CONFIG.whatsappNumber,
        whatsappNumber: BUSINESS_CONFIG.whatsappNumber,
        address: BUSINESS_CONFIG.businessAddress,
        businessAddress: BUSINESS_CONFIG.businessAddress,
        websiteUrl: BUSINESS_CONFIG.websiteUrl,
        emailAddress: BUSINESS_CONFIG.emailAddress,
        workingHours: BUSINESS_CONFIG.hoursWeekday,
        hoursWeekday: BUSINESS_CONFIG.hoursWeekday,
        sundayHours: BUSINESS_CONFIG.hoursSunday,
        hoursSunday: BUSINESS_CONFIG.hoursSunday,
        googleMapsUrl: BUSINESS_CONFIG.googleMapsUrl,
        googleReviewUrl: BUSINESS_CONFIG.googleReviewUrl,
        services: BUSINESS_CONFIG.services,
        socialMedia: BUSINESS_CONFIG.socialMedia
    };
}

/**
 * Get business info from business_info table
 */
async function getBusinessInfo() {
    const client = initSupabase();
    if (!client) {
        // Return default config if Supabase not available
        return getConfig();
    }

    try {
        const result = await client
            .from('business_info')
            .select('*');

        if (result.data && result.data.length > 0) {
            // Convert key-value pairs to object
            const info = {};
            result.data.forEach(item => {
                info[item.key] = item.value;
            });
            
            // Merge with default config
            return {
                ...getConfig(),
                ...info
            };
        }

        return getConfig();

    } catch (error) {
        console.error('❌ Error fetching business info:', error);
        return getConfig();
    }
}

/**
 * Update business info in business_info table
 */
async function updateBusinessInfo(updates) {
    const client = initSupabase();
    if (!client) {
        return { success: false, error: 'Supabase not initialized' };
    }

    try {
        const promises = [];

        for (const [key, value] of Object.entries(updates)) {
            // Upsert each key-value pair
            const promise = client
                .from('business_info')
                .upsert({ key: key, value: value })
                .select();

            promises.push(promise);
        }

        await Promise.all(promises);

        // Update local config
        Object.assign(BUSINESS_CONFIG, updates);

        return {
            success: true,
            message: 'Business information updated successfully'
        };

    } catch (error) {
        console.error('❌ Error updating business info:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// ============================================
// API FUNCTIONS - ADMIN
// ============================================

/**
 * Verify admin password
 */
function verifyAdmin(password) {
    // Check against stored password (in production, use proper authentication)
    const isValid = password === BUSINESS_CONFIG.adminPassword;

    if (isValid) {
        // Store in sessionStorage for session persistence
        sessionStorage.setItem('adminAuthenticated', 'true');
        return {
            success: true,
            message: 'Authentication successful'
        };
    } else {
        return {
            success: false,
            error: 'Invalid password'
        };
    }
}

/**
 * Check if admin is authenticated
 */
function isAdminAuthenticated() {
    return sessionStorage.getItem('adminAuthenticated') === 'true';
}

/**
 * Logout admin
 */
function logoutAdmin() {
    sessionStorage.removeItem('adminAuthenticated');
    return { success: true, message: 'Logged out successfully' };
}

/**
 * Change admin password
 */
function changeAdminPassword(currentPassword, newPassword) {
    if (currentPassword !== BUSINESS_CONFIG.adminPassword) {
        return {
            success: false,
            error: 'Current password is incorrect'
        };
    }

    if (!newPassword || newPassword.length < 6) {
        return {
            success: false,
            error: 'New password must be at least 6 characters long'
        };
    }

    // Update password (in production, this should be stored securely)
    BUSINESS_CONFIG.adminPassword = newPassword;
    
    // Note: In production, you'd want to store this securely
    localStorage.setItem('adminPassword', newPassword);

    return {
        success: true,
        message: 'Password changed successfully. Please note down your new password.'
    };
}

// ============================================
// IMAGE UPLOAD FUNCTIONS
// ============================================

/**
 * Upload image to Supabase Storage
 */
async function uploadImage(file, type = 'general') {
    const client = initSupabase();
    if (!client) {
        return { success: false, error: 'Supabase not initialized' };
    }

    try {
        // Generate unique filename
        const timestamp = Date.now();
        const filename = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

        // Determine storage path
        let storagePath;
        if (type === 'hero') {
            storagePath = `hero-slides/${filename}`;
        } else if (type === 'gallery') {
            storagePath = `gallery/${filename}`;
        } else {
            storagePath = filename;
        }

        // Upload to Supabase Storage
        const { data, error } = await client.storage
            .from('Astrology')
            .upload(storagePath, file, {
                cacheControl: '3600',
                upsert: true
            });

        if (error) throw error;

        // Get public URL
        const { data: urlData } = client.storage
            .from('Astrology')
            .getPublicUrl(storagePath);

        console.log('✅ Image uploaded to Supabase Storage:', storagePath);

        return {
            success: true,
            image_url: urlData.publicUrl,
            filename: filename,
            storage_path: storagePath
        };

    } catch (error) {
        console.error('❌ Error uploading image:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// ============================================
// API FUNCTIONS - TESTIMONIALS
// ============================================

/**
 * Get all testimonials
 */
async function getTestimonials() {
    const client = initSupabase();
    if (!client) {
        return { success: false, testimonials: [] };
    }

    try {
        const result = await client
            .from('testimonials')
            .select('*')
            .eq('is_active', true)
            .order('display_order', { ascending: true });

        return {
            success: true,
            testimonials: result.data || []
        };

    } catch (error) {
        console.error('❌ Error fetching testimonials:', error);
        return {
            success: true,
            testimonials: []
        };
    }
}

/**
 * Add testimonial
 */
async function addTestimonial(testimonialData) {
    const client = initSupabase();
    if (!client) {
        return { success: false, error: 'Supabase not initialized' };
    }

    try {
        const result = await client
            .from('testimonials')
            .insert(testimonialData)
            .select();

        if (result.error) throw result.error;

        return {
            success: true,
            testimonial: result.data[0]
        };

    } catch (error) {
        console.error('❌ Error adding testimonial:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Update testimonial
 */
async function updateTestimonial(testimonialId, testimonialData) {
    const client = initSupabase();
    if (!client) {
        return { success: false, error: 'Supabase not initialized' };
    }

    try {
        const result = await client
            .from('testimonials')
            .update(testimonialData)
            .eq('id', testimonialId)
            .select();

        if (result.error) throw result.error;

        return {
            success: true,
            testimonial: result.data[0]
        };

    } catch (error) {
        console.error('❌ Error updating testimonial:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Delete testimonial
 */
async function deleteTestimonial(testimonialId) {
    const client = initSupabase();
    if (!client) {
        return { success: false, error: 'Supabase not initialized' };
    }

    try {
        const result = await client
            .from('testimonials')
            .delete()
            .eq('id', testimonialId);

        if (result.error) throw result.error;

        return {
            success: true,
            message: 'Testimonial deleted'
        };

    } catch (error) {
        console.error('❌ Error deleting testimonial:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// ============================================
// API FUNCTIONS - CHATBOT CONFIG
// ============================================

/**
 * Get chatbot configuration
 */
async function getChatbotConfig() {
    const client = initSupabase();
    if (!client) {
        return { success: false, error: 'Supabase not initialized' };
    }

    try {
        const result = await client
            .from('chatbot_config')
            .select('*')
            .eq('id', 1)
            .single();

        if (result.data) {
            // Parse services if it's a JSON string
            let services = result.data.services;
            if (typeof services === 'string') {
                try {
                    services = JSON.parse(services);
                } catch (e) {
                    services = services.split(',').map(s => s.trim());
                }
            }
            
            return { 
                success: true, 
                config: {
                    ...result.data,
                    services: services
                }
            };
        }

        return { success: false, error: 'Config not found' };

    } catch (error) {
        console.error('❌ Error fetching chatbot config:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Update chatbot configuration
 */
async function updateChatbotConfig(configData) {
    const client = initSupabase();
    if (!client) {
        return { success: false, error: 'Supabase not initialized' };
    }

    try {
        // Prepare update data
        const updateData = {
            updated_at: new Date().toISOString()
        };
        
        // Map the config data properly
        if (configData.google_maps_url !== undefined) updateData.google_maps_url = configData.google_maps_url;
        if (configData.google_review_url !== undefined) updateData.google_review_url = configData.google_review_url;
        if (configData.hours_weekday !== undefined) updateData.hours_weekday = configData.hours_weekday;
        if (configData.hours_sunday !== undefined) updateData.hours_sunday = configData.hours_sunday;
        if (configData.facebook_url !== undefined) updateData.facebook_url = configData.facebook_url;
        if (configData.instagram_url !== undefined) updateData.instagram_url = configData.instagram_url;
        if (configData.twitter_url !== undefined) updateData.twitter_url = configData.twitter_url;
        if (configData.youtube_url !== undefined) updateData.youtube_url = configData.youtube_url;
        if (configData.linkedin_url !== undefined) updateData.linkedin_url = configData.linkedin_url;
        
        // Handle services - convert array to JSON string
        if (configData.services !== undefined) {
            updateData.services = Array.isArray(configData.services) ? 
                JSON.stringify(configData.services) : 
                configData.services;
        }

        const result = await client
            .from('chatbot_config')
            .update(updateData)
            .eq('id', 1);

        if (result.error) {
            throw result.error;
        }

        return {
            success: true,
            message: 'Chatbot configuration updated successfully'
        };

    } catch (error) {
        console.error('❌ Error updating chatbot config:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// ============================================
// INITIALIZATION
// ============================================

/**
 * Initialize backend on page load
 */
function initBackend() {
    console.log('🌟 Supabase Backend Initialized');
    console.log('📦 Configuration loaded');
    
    // Initialize Supabase client
    const client = initSupabase();
    
    if (client) {
        console.log('✅ Connected to Supabase');
    } else {
        console.warn('⚠️ Supabase not connected. Add Supabase library to your HTML.');
    }

    // Load admin password from localStorage if exists
    const savedPassword = localStorage.getItem('adminPassword');
    if (savedPassword) {
        BUSINESS_CONFIG.adminPassword = savedPassword;
    }

    return client;
}

// ============================================
// EXPORT API OBJECT (for easy access)
// ============================================

const SupabaseAPI = {
    // Initialization
    init: initBackend,
    initSupabase: initSupabase,

    // Configuration
    getConfig: getConfig,
    getBusinessInfo: getBusinessInfo,
    updateBusinessInfo: updateBusinessInfo,

    // Leads & Submissions
    submitLead: submitLead,
    getLeads: getLeads,
    deleteContact: deleteContact,
    deleteBooking: deleteBooking,

    // Hero Slides
    getHeroSlides: getHeroSlides,
    addHeroSlide: addHeroSlide,
    updateHeroSlide: updateHeroSlide,
    deleteHeroSlide: deleteHeroSlide,

    // Gallery Slides
    getGallerySlides: getGallerySlides,
    addGallerySlide: addGallerySlide,
    updateGallerySlide: updateGallerySlide,
    deleteGallerySlide: deleteGallerySlide,

    // Testimonials
    getTestimonials: getTestimonials,
    addTestimonial: addTestimonial,
    updateTestimonial: updateTestimonial,
    deleteTestimonial: deleteTestimonial,

    // Chatbot Config
    getChatbotConfig: getChatbotConfig,
    updateChatbotConfig: updateChatbotConfig,

    // Admin
    verifyAdmin: verifyAdmin,
    isAdminAuthenticated: isAdminAuthenticated,
    logoutAdmin: logoutAdmin,
    changeAdminPassword: changeAdminPassword,

    // Image Upload
    uploadImage: uploadImage,

    // Direct access to config
    config: BUSINESS_CONFIG
};

// Make API available globally
if (typeof window !== 'undefined') {
    window.SupabaseAPI = SupabaseAPI;
}

// Auto-initialize on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBackend);
} else {
    initBackend();
}

console.log('✅ Supabase Backend Module Loaded');
