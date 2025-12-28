const express = require('express');
const router = express.Router();
const OpenAI = require('openai');
const { supabase } = require('../config/database');

// Initialize OpenAI client
let openai = null;

const getOpenAIClient = () => {
    if (!openai && process.env.OPENAI_API_KEY) {
        openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });
    }
    return openai;
};

// ========================================
// CHATBOT ENDPOINT
// ========================================

router.post('/chatbot', async (req, res) => {
    try {
        const { message, conversation_history } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        // Check if OpenAI API key is configured - if not, use fallback responses
        if (!process.env.OPENAI_API_KEY) {
            // Use rule-based fallback responses (now async to fetch from DB)
            const fallbackResponse = await getFallbackResponse(message.toLowerCase().trim());
            return res.json({
                success: true,
                response: fallbackResponse
            });
        }

        // Get chatbot configuration
        const { data: configData } = await supabase.from('chatbot_config').select('*').limit(1).single();
        const config = configData || {};

        // Check if chatbot is enabled
        if (config.is_enabled === false) {
            return res.json({
                success: false,
                message: 'Chatbot is currently disabled. Please contact us directly.'
            });
        }

        // Check if OpenAI is configured
        const client = getOpenAIClient();
        if (!client) {
            return res.status(500).json({
                error: 'Chatbot is not configured. Please contact administrator.',
                success: false
            });
        }

        // Get business info for context
        const { data: businessInfo } = await supabase.from('business_info').select('*').limit(1).single();
        const business = businessInfo || {};

        // Get services for context
        const { data: servicesData } = await supabase.from('astrological_services').select('title, description').eq('active', true);
        const { data: poojaData } = await supabase.from('pooja_services').select('title, description').eq('active', true);
        
        const services = (servicesData || []).map(s => `${s.title}: ${s.description}`).join('\n');
        const poojaServices = (poojaData || []).map(s => `${s.title}: ${s.description}`).join('\n');

        // Build system prompt with context
        const systemPrompt = config.system_prompt || 
            'You are a helpful assistant for Cosmic Astrology. Provide information about astrology services, pooja services, and answer questions professionally.';

        const contextualPrompt = `${systemPrompt}

Business Information:
- Name: ${businessInfo.business_name || 'Cosmic Astrology'}
- Email: ${businessInfo.email || ''}
- Phone: ${businessInfo.phone || ''}
- Address: ${businessInfo.address || ''}
- WhatsApp: ${businessInfo.whatsapp || ''}

Available Astrological Services:
${services || 'Various astrology services available'}

Available Pooja Services:
${poojaServices || 'Various pooja services available'}

Guidelines:
- Be helpful, professional, and friendly
- Provide accurate information about our services
- If you don't know something, suggest contacting us directly
- Keep responses concise and relevant
- Encourage bookings for interested customers`;

        // Build conversation messages
        const messages = [
            { role: 'system', content: contextualPrompt }
        ];

        // Add conversation history if provided
        if (Array.isArray(conversation_history) && conversation_history.length > 0) {
            // Limit history to last 10 messages to avoid token limits
            const recentHistory = conversation_history.slice(-10);
            messages.push(...recentHistory);
        }

        // Add current user message
        messages.push({ role: 'user', content: message });

        // Call OpenAI API
        const completion = await client.chat.completions.create({
            model: process.env.OPENAI_MODEL || 'gpt-4',
            messages: messages,
            temperature: parseFloat(config.temperature) || 0.7,
            max_tokens: parseInt(config.max_tokens) || parseInt(process.env.OPENAI_MAX_TOKENS) || 500,
        });

        const response = completion.choices[0].message.content;

        res.json({
            success: true,
            response: response,
            usage: completion.usage
        });

    } catch (error) {
        console.error('Chatbot error:', error);
        
        // Handle specific OpenAI errors
        if (error.status === 401) {
            return res.status(500).json({
                error: 'Invalid OpenAI API key',
                success: false
            });
        }
        
        if (error.status === 429) {
            return res.status(429).json({
                error: 'Rate limit exceeded. Please try again later.',
                success: false
            });
        }

        res.status(500).json({
            error: 'Failed to process your message. Please try again.',
            success: false,
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Test chatbot configuration
router.get('/chatbot/test', async (req, res) => {
    try {
        const client = getOpenAIClient();
        
        if (!client) {
            return res.json({
                configured: false,
                message: 'OpenAI API key not configured'
            });
        }

        const { data: configData } = await supabase.from('chatbot_config').select('*').limit(1).single();
        const config = configData || {};

        res.json({
            configured: true,
            enabled: config.is_enabled !== false,
            model: process.env.OPENAI_MODEL || 'gpt-4',
            message: 'Chatbot is ready'
        });
    } catch (error) {
        console.error('Chatbot test error:', error);
        res.status(500).json({
            configured: false,
            error: error.message
        });
    }
});

// Fallback response system for when OpenAI is not configured
// Now uses async to fetch from database
async function getFallbackResponse(message) {
    // Convert message to lowercase for matching
    const msg = message.toLowerCase();
    
    // Fetch business info from database for dynamic responses
    let businessInfo = {};
    let chatbotConfig = {};
    try {
        const { data: bizData } = await supabase.from('business_info').select('*').single();
        businessInfo = bizData || {};
        
        const { data: configData } = await supabase.from('chatbot_config').select('*').single();
        chatbotConfig = configData || {};
    } catch (err) {
        console.warn('Could not fetch business info for chatbot:', err.message);
    }
    
    // Menu option responses
    if (msg === 'services') {
        return `🌟 <strong>Our Astrological Services</strong><br><br>
        • <strong>Palmistry</strong> - Ancient art of palm reading<br>
        • <strong>Face Reading</strong> - Discover personality through facial features<br>
        • <strong>Horoscope Analysis</strong> - Complete birth chart reading<br>
        • <strong>Vastu Consultation</strong> - Home & office energy alignment<br>
        • <strong>Numerology</strong> - Numbers that shape your destiny<br>
        • <strong>Gemstone Consultation</strong> - Healing crystals for positive energy<br><br>
        💫 <em>Each service provides deep insights into your life path!</em><br><br>
        Would you like to book a consultation?`;
    }
    
    if (msg === 'book') {
        return 'SHOW_BOOKING_FORM';
    }
    
    if (msg === 'hours') {
        const hours = businessInfo.business_hours || 'Monday - Saturday: 9:00 AM - 8:00 PM, Sunday: 10:00 AM - 6:00 PM';
        return `⏰ <strong>Our Business Hours</strong><br><br>
        📅 ${hours}<br><br>
        📞 <em>Available for consultations during these hours</em><br>
        💬 <em>WhatsApp us anytime for quick queries!</em>`;
    }
    
    if (msg === 'location') {
        const address = businessInfo.address || 'Contact us for our location';
        const phone = businessInfo.phone || '';
        const locationUrl = businessInfo.google_location_url || '';
        
        let response = `📍 <strong>Visit Our Location</strong><br><br>
        🏢 <strong>Address:</strong><br>
        ${address}<br><br>
        🚗 <em>Convenient parking available</em><br>
        🚇 <em>Near major transport hubs</em>`;
        
        if (phone) {
            response += `<br><br>📱 Call us for directions: <strong>${phone}</strong>`;
        }
        
        if (locationUrl) {
            response += `<br><br><a href="${locationUrl}" target="_blank" style="background: linear-gradient(to right, #7C3AED, #EC4899); color: white; padding: 8px 16px; border-radius: 20px; text-decoration: none; display: inline-block; font-weight: bold;">📍 View on Google Maps</a>`;
        }
        
        return response;
    }
    
    if (msg === 'contact') {
        const phone = businessInfo.phone || 'Not available';
        const email = businessInfo.email || 'Not available';
        const whatsapp = businessInfo.whatsapp_number || businessInfo.phone || '';
        
        return `📞 <strong>Get In Touch</strong><br><br>
        📱 <strong>Phone:</strong> ${phone}<br>
        📧 <strong>Email:</strong> ${email}<br>
        💬 <strong>WhatsApp:</strong> ${whatsapp ? 'Click the WhatsApp button below' : 'Not available'}<br><br>
        💫 <em>We're here to guide your cosmic journey!</em>`;
    }
    
    if (msg === 'social') {
        const fb = businessInfo.facebook || '';
        const ig = businessInfo.instagram || '';
        const yt = businessInfo.youtube || '';
        const tw = businessInfo.twitter || '';
        
        let response = `📱 <strong>Follow Us On Social Media</strong><br><br>`;
        if (fb) response += `📘 <strong>Facebook:</strong> <a href="${fb}" target="_blank">Visit</a><br>`;
        if (ig) response += `📸 <strong>Instagram:</strong> <a href="${ig}" target="_blank">Visit</a><br>`;
        if (yt) response += `🎥 <strong>YouTube:</strong> <a href="${yt}" target="_blank">Visit</a><br>`;
        if (tw) response += `🐦 <strong>Twitter:</strong> <a href="${tw}" target="_blank">Visit</a><br>`;
        
        if (!fb && !ig && !yt && !tw) {
            response += `Contact us for our social media links!`;
        }
        
        response += `<br>⭐ <em>Stay updated with daily horoscopes and cosmic insights!</em>`;
        return response;
    }
    
    if (msg === 'qa' || msg === 'faq') {
        return `❓ <strong>Frequently Asked Questions</strong><br><br>
        <strong>Q: How accurate is astrology?</strong><br>
        A: Astrology provides insights based on cosmic positions and ancient wisdom. Results vary by individual.<br><br>
        <strong>Q: What do I need for a reading?</strong><br>
        A: Your birth date, time, and place for accurate calculations.<br><br>
        <strong>Q: How long is a consultation?</strong><br>
        A: Sessions typically last 45-60 minutes.<br><br>
        💫 <em>Have more questions? Feel free to ask!</em>`;
    }
    
    // General greetings and common phrases
    const businessName = businessInfo.business_name || 'Cosmic Astrology';
    const phone = businessInfo.phone || 'Contact us';
    
    if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey') || msg.includes('namaste')) {
        return `🙏 <strong>Namaste! Welcome to ${businessName}</strong><br><br>
        I'm here to help you explore the mysteries of the universe! ✨<br><br>
        How can I assist you today?<br>
        • Learn about our services 🌟<br>
        • Book a consultation 📅<br>
        • Get our contact info 📞<br><br>
        <em>Type "menu" to see all options!</em>`;
    }
    
    if (msg.includes('menu') || msg.includes('help') || msg.includes('options')) {
        return `📋 <strong>How Can I Help You?</strong><br><br>
        Choose from these options:<br>
        🌟 <strong>Services</strong> - View our astrological services<br>
        📅 <strong>Book</strong> - Schedule a consultation<br>
        ⏰ <strong>Hours</strong> - Our business hours<br>
        📍 <strong>Location</strong> - Visit us<br>
        📞 <strong>Contact</strong> - Get in touch<br>
        📱 <strong>Social</strong> - Follow us online<br>
        ❓ <strong>FAQ</strong> - Common questions<br><br>
        💫 <em>Click any button above or type your question! I'm here to help answer any questions you have.</em>`;
    }
    
    if (msg.includes('price') || msg.includes('cost') || msg.includes('fee')) {
        return `💰 <strong>Consultation Pricing</strong><br><br>
        Our consultation fees vary by service type and duration.<br><br>
        📞 <strong>For detailed pricing information:</strong><br>
        • Call us: ${phone}<br>
        • WhatsApp us for instant quotes<br>
        • Book a consultation to discuss<br><br>
        ✨ <em>First-time clients may receive special offers!</em>`;
    }
    
    if (msg.includes('thank') || msg.includes('thanks')) {
        return `🙏 <strong>You're Most Welcome!</strong><br><br>
        It's my pleasure to help you on your cosmic journey! ✨<br><br>
        Is there anything else you'd like to know?<br><br>
        💫 <em>May the stars guide you!</em>`;
    }
    
    // Additional Q&A responses for common astrology questions
    if (msg.includes('horoscope') || msg.includes('kundali') || msg.includes('birth chart')) {
        return `🌟 <strong>Horoscope & Kundali Reading</strong><br><br>
        We provide comprehensive horoscope and kundali analysis including:<br>
        • Complete birth chart analysis<br>
        • Planetary positions and their effects<br>
        • Dasha predictions (planetary periods)<br>
        • Career, health, and relationship insights<br>
        • Remedies for planetary doshas<br><br>
        📅 <em>Book a consultation to get your detailed horoscope reading!</em>`;
    }
    
    if (msg.includes('love') || msg.includes('marriage') || msg.includes('relationship')) {
        return `💕 <strong>Love & Marriage Astrology</strong><br><br>
        Our love and marriage services include:<br>
        • Kundali matching for marriage compatibility<br>
        • Love problem solutions<br>
        • Relationship counseling through astrology<br>
        • Manglik dosha remedies<br>
        • Marriage delay solutions<br><br>
        💫 <em>Get guidance for your love life and relationships!</em>`;
    }
    
    if (msg.includes('career') || msg.includes('job') || msg.includes('business')) {
        return `💼 <strong>Career & Business Astrology</strong><br><br>
        We offer specialized services for:<br>
        • Career guidance and job predictions<br>
        • Business astrology and financial planning<br>
        • Best career options based on your chart<br>
        • Business success remedies<br>
        • Timing for important business decisions<br><br>
        📈 <em>Unlock your professional potential with astrology!</em>`;
    }
    
    if (msg.includes('pooja') || msg.includes('puja') || msg.includes('ritual')) {
        return `🕉️ <strong>Pooja & Ritual Services</strong><br><br>
        We perform various poojas and rituals:<br>
        • Navagraha Shanti Pooja (Planetary peace)<br>
        • Graha Dosha Nivarana (Planetary remedy)<br>
        • Mahakali Pooja & Bhairavi Pooja<br>
        • Havan and Yagna services<br>
        • Special poojas for specific needs<br><br>
        🙏 <em>Connect with divine energy through our pooja services!</em>`;
    }
    
    if (msg.includes('dosha') || msg.includes('remedy') || msg.includes('problem')) {
        return `🔮 <strong>Dosha Remedies & Solutions</strong><br><br>
        We provide solutions for:<br>
        • Manglik Dosha remedies<br>
        • Rahu Ketu Dosha solutions<br>
        • Shani Dosha remedies<br>
        • Navagraha Dosha nivarana<br>
        • General life problem solutions<br><br>
        ✨ <em>Get effective remedies for all planetary doshas!</em>`;
    }
    
    if (msg.includes('vastu') || msg.includes('feng shui') || msg.includes('home')) {
        return `🏠 <strong>Vastu Consultation</strong><br><br>
        Our Vastu services include:<br>
        • Home and office Vastu analysis<br>
        • Energy alignment and corrections<br>
        • Direction-based recommendations<br>
        • Remedies for Vastu doshas<br>
        • Commercial property Vastu<br><br>
        🏡 <em>Create positive energy in your living space!</em>`;
    }
    
    if (msg.includes('gemstone') || msg.includes('stone') || msg.includes('ratna')) {
        return `💎 <strong>Gemstone Consultation</strong><br><br>
        We provide:<br>
        • Personalized gemstone recommendations<br>
        • Birthstone analysis based on your chart<br>
        • Gemstone quality verification<br>
        • Wearing methods and mantras<br>
        • Gemstone remedies for planetary issues<br><br>
        ✨ <em>Find the perfect gemstone for your needs!</em>`;
    }
    
    if (msg.includes('online') || msg.includes('phone') || msg.includes('consultation')) {
        return `📞 <strong>Online & Phone Consultation</strong><br><br>
        We offer consultations through:<br>
        • Phone consultations<br>
        • WhatsApp astrology reading<br>
        • Online video consultations<br>
        • Email consultations<br>
        • In-person visits (Mysuru)<br><br>
        📅 <em>Book your preferred consultation method!</em>`;
    }
    
    // Default response for unrecognized messages - Always provide helpful answer
    const whatsapp = businessInfo.whatsapp_number || businessInfo.phone || '';
    return `✨ <strong>Thank you for your message!</strong><br><br>
    I'm here to help you with astrology consultations, services, bookings, and more.<br><br>
    💡 <strong>Here's how I can assist you:</strong><br>
    • Ask about our services (horoscope reading, kundali matching, pooja services)<br>
    • Book a consultation appointment<br>
    • Get our business hours and location<br>
    • Contact information<br>
    • Pricing and packages<br>
    • Love & marriage solutions<br>
    • Career & business astrology<br>
    • Dosha remedies<br><br>
    📞 <strong>For immediate assistance:</strong><br>
    • Call: ${phone}<br>
    • WhatsApp: ${whatsapp || 'Click the WhatsApp button'}<br><br>
    💫 <em>Feel free to ask me anything about our astrology services! Type "menu" to see all options.</em>`;
}

module.exports = router;