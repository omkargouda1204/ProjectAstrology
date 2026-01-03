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

        // Always use fallback responses first for better Q&A matching
        // Check fallback responses first (faster and more accurate for Q&A)
        const fallbackResponse = await getFallbackResponse(message.toLowerCase().trim());
        
        // If fallback found a specific answer, use it
        if (fallbackResponse && !fallbackResponse.includes('Thank you for your message!') && 
            !fallbackResponse.includes('Here\'s how I can assist you')) {
            return res.json({
                success: true,
                response: fallbackResponse
            });
        }
        
        // Check if OpenAI API key is configured - if not, use fallback responses only
        if (!process.env.OPENAI_API_KEY) {
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
        const response = await client.createChatCompletion({
            model: 'gpt-4',
            messages
        });

        const chatbotResponse = response.choices[0].message.content;

        return res.json({
            success: true,
            response: chatbotResponse
        });
    } catch (error) {
        console.error('Error in chatbot route:', error);
        return res.status(500).json({
            success: false,
            error: 'An error occurred while processing your request.'
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
        const tw = businessInfo.twitter || '';
        
        let response = `📱 <strong>Follow Us On Social Media</strong><br><br>`;
        if (fb) response += `📘 <strong>Facebook:</strong> <a href="${fb}" target="_blank" style="color: #9333EA; font-weight: bold;">Visit</a><br>`;
        if (ig) response += `📸 <strong>Instagram:</strong> <a href="${ig}" target="_blank" style="color: #9333EA; font-weight: bold;">Visit</a><br>`;
        if (tw) response += `🐦 <strong>Twitter:</strong> <a href="${tw}" target="_blank" style="color: #9333EA; font-weight: bold;">Visit</a><br>`;
        
        if (!fb && !ig && !tw) {
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
    
    // ========================================
    // 30 KEYWORD-BASED Q&A SYSTEM
    // ========================================
    
    // 1. Zodiac Signs - Enhanced keyword matching with more variations
    if (msg.includes('zodiac') || msg.includes('rashi') || msg.includes('rashis') || 
        msg.includes('sun sign') || msg.includes('sunsign') ||
        (msg.includes('what') && (msg.includes('zodiac') || msg.includes('sign'))) ||
        msg.includes('aries') || msg.includes('taurus') || msg.includes('gemini') || 
        msg.includes('cancer') || msg.includes('leo') || msg.includes('virgo') ||
        msg.includes('libra') || msg.includes('scorpio') || msg.includes('sagittarius') ||
        msg.includes('capricorn') || msg.includes('aquarius') || msg.includes('pisces')) {
        return `♈ <strong>Zodiac Signs</strong><br><br>
        Zodiac signs are 12 divisions of the zodiac based on the position of the Sun at the time of birth.<br><br>
        The 12 signs are: Aries, Taurus, Gemini, Cancer, Leo, Virgo, Libra, Scorpio, Sagittarius, Capricorn, Aquarius, and Pisces.<br><br>
        🌟 <em>Each sign has unique characteristics and influences on personality!</em>`;
    }
    
    // 2. Astrology Meaning - Enhanced keyword matching with more variations
    // Check for single keyword "astrology" first
    if (msg === 'astrology' || msg === 'what is astrology' || msg === 'astrology meaning' ||
        (msg.includes('astrology') && (msg.includes('what') || msg.includes('meaning') || msg.includes('define') || msg.includes('is'))) ||
        msg.includes('what is astrology') || msg.includes('what\'s astrology') || msg.includes('what astrology')) {
        return `✨ <strong>What is Astrology?</strong><br><br>
        Astrology is the study of planetary positions and their influence on human life and events.<br><br>
        It helps us understand personality, relationships, career, and future predictions based on cosmic alignments.<br><br>
        🔮 <em>Unlock the wisdom of the stars!</em>`;
    }
    
    // 3. Birth Chart - Enhanced keyword matching
    if (msg.includes('birth chart') || msg.includes('birthchart') || msg.includes('what is a birth chart') ||
        msg.includes('birth') && msg.includes('chart') || msg.includes('janam kundli') || msg.includes('janam kundali')) {
        return `📊 <strong>Birth Chart</strong><br><br>
        A birth chart is a map of planetary positions at the exact time and place of birth.<br><br>
        It shows the positions of Sun, Moon, and planets in different houses and zodiac signs.<br><br>
        🌟 <em>Your birth chart is your unique cosmic fingerprint!</em>`;
    }
    
    // 4. Sun Sign - Enhanced keyword matching
    if (msg.includes('sun sign') || msg.includes('sunsign') || (msg.includes('what') && msg.includes('sun') && msg.includes('sign')) ||
        msg.includes('sun') && (msg.includes('sign') || msg.includes('rashi'))) {
        return `☀️ <strong>Sun Sign</strong><br><br>
        The Sun sign represents personality, ego, and core identity.<br><br>
        It shows your basic nature, how you express yourself, and your life purpose.<br><br>
        ✨ <em>Your Sun sign is determined by your date of birth!</em>`;
    }
    
    // 5. Moon Sign - Enhanced keyword matching
    if (msg.includes('moon sign') || msg.includes('moonsign') || (msg.includes('what') && msg.includes('moon') && msg.includes('sign')) ||
        msg.includes('moon') && (msg.includes('sign') || msg.includes('rashi'))) {
        return `🌙 <strong>Moon Sign</strong><br><br>
        The Moon sign represents emotions, mind, and inner feelings.<br><br>
        It governs your emotional responses, instincts, and subconscious mind.<br><br>
        💫 <em>Your Moon sign reveals your emotional nature!</em>`;
    }
    
    // 6. Ascendant - Enhanced keyword matching
    if (msg.includes('ascendant') || msg.includes('rising sign') || msg.includes('rising') || 
        msg.includes('lagna') || (msg.includes('what') && msg.includes('lagna')) ||
        msg.includes('asc') || msg.includes('rising sign')) {
        return `⬆️ <strong>Ascendant (Rising Sign)</strong><br><br>
        Ascendant is the zodiac sign rising on the eastern horizon at birth and shows outward behavior.<br><br>
        It represents your physical appearance, first impressions, and how others see you.<br><br>
        🌅 <em>Your Ascendant shapes your outer personality!</em>`;
    }
    
    // 7. Planets in Astrology - Enhanced keyword matching
    if (msg.includes('planets astrology') || msg.includes('planets in astrology') || 
        (msg.includes('how many planets') && msg.includes('astrology')) ||
        msg.includes('navagraha') || msg.includes('nine planets') || 
        (msg.includes('planets') && (msg.includes('astrology') || msg.includes('how many')))) {
        return `🪐 <strong>Planets in Astrology</strong><br><br>
        Astrology mainly uses 9 planets including Sun and Moon.<br><br>
        The nine planets (Navagraha) are: Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn, Rahu, and Ketu.<br><br>
        ✨ <em>Each planet has unique energies and influences!</em>`;
    }
    
    // 8. Mercury - Enhanced keyword matching
    if ((msg.includes('mercury') || msg.includes('budh') || msg.includes('budha')) && !msg.includes('retrograde') ||
        (msg.includes('what') && msg.includes('mercury')) || (msg.includes('mercury') && msg.includes('represent'))) {
        return `☿ <strong>Mercury (Budh)</strong><br><br>
        Mercury represents communication, intelligence, and learning.<br><br>
        It governs speech, writing, business skills, and logical thinking.<br><br>
        📚 <em>Strong Mercury brings sharp intellect and communication skills!</em>`;
    }
    
    // 9. Venus - Enhanced keyword matching
    if (msg.includes('venus') || msg.includes('shukra') || msg.includes('shukracharya') ||
        (msg.includes('what') && msg.includes('venus')) || (msg.includes('venus') && msg.includes('represent'))) {
        return `♀ <strong>Venus (Shukra)</strong><br><br>
        Venus represents love, beauty, marriage, and luxury.<br><br>
        It governs relationships, arts, creativity, and material comforts.<br><br>
        💖 <em>Venus brings harmony, romance, and prosperity!</em>`;
    }
    
    // 10. Mars - Enhanced keyword matching
    if ((msg.includes('mars') || msg.includes('mangal') || msg.includes('mangala')) && !msg.includes('dosha') ||
        (msg.includes('what') && msg.includes('mars') && !msg.includes('dosha')) ||
        (msg.includes('mars') && msg.includes('represent') && !msg.includes('dosha'))) {
        return `♂ <strong>Mars (Mangal)</strong><br><br>
        Mars represents energy, courage, anger, and action.<br><br>
        It governs physical strength, aggression, determination, and sports abilities.<br><br>
        🔥 <em>Strong Mars gives courage and leadership qualities!</em>`;
    }
    
    // 11. Jupiter - Enhanced keyword matching
    if (msg.includes('jupiter') || msg.includes('guru') || msg.includes('brihaspati') || msg.includes('brihaspathi') ||
        (msg.includes('what') && (msg.includes('jupiter') || msg.includes('guru'))) ||
        (msg.includes('jupiter') && msg.includes('represent'))) {
        return `♃ <strong>Jupiter (Guru/Brihaspati)</strong><br><br>
        Jupiter represents wisdom, growth, wealth, and luck.<br><br>
        It governs knowledge, spirituality, expansion, and good fortune.<br><br>
        🌟 <em>Jupiter is the planet of blessings and prosperity!</em>`;
    }
    
    // 12. Saturn - Enhanced keyword matching
    if (msg.includes('saturn') || msg.includes('shani') || msg.includes('shanidev') ||
        (msg.includes('what') && (msg.includes('saturn') || msg.includes('shani'))) ||
        (msg.includes('saturn') && msg.includes('represent'))) {
        return `♄ <strong>Saturn (Shani)</strong><br><br>
        Saturn represents discipline, karma, delays, and hard work.<br><br>
        It teaches life lessons through challenges and brings results through patience.<br><br>
        ⏳ <em>Saturn rewards hard work and punishes laziness!</em>`;
    }
    
    // 13. Rahu - Enhanced keyword matching
    if ((msg.includes('rahu') && !msg.includes('ketu')) || msg.includes('rahu ketu') ||
        (msg.includes('what') && msg.includes('rahu') && !msg.includes('ketu')) ||
        (msg.includes('rahu') && msg.includes('represent'))) {
        return `🐉 <strong>Rahu (North Node)</strong><br><br>
        Rahu represents desires, illusions, and sudden events.<br><br>
        It brings worldly ambitions, foreign connections, and unconventional thinking.<br><br>
        🌪️ <em>Rahu creates sudden changes and material desires!</em>`;
    }
    
    // 14. Ketu - Enhanced keyword matching
    if ((msg.includes('ketu') && !msg.includes('rahu')) || (msg.includes('what') && msg.includes('ketu')) ||
        (msg.includes('ketu') && msg.includes('represent'))) {
        return `🐉 <strong>Ketu (South Node)</strong><br><br>
        Ketu represents spirituality, detachment, and past-life karma.<br><br>
        It brings moksha (liberation), intuition, and spiritual wisdom.<br><br>
        🕉️ <em>Ketu encourages detachment from material world!</em>`;
    }
    
    // 15. Houses - Enhanced keyword matching
    if ((msg.includes('houses') && msg.includes('astrology')) || msg.includes('houses in astrology') ||
        msg.includes('bhava') || msg.includes('bhavas') || (msg.includes('what') && msg.includes('houses'))) {
        return `🏠 <strong>Houses in Astrology</strong><br><br>
        Houses represent different life areas like career, marriage, wealth, and health.<br><br>
        There are 12 houses in a birth chart, each governing specific aspects of life.<br><br>
        📋 <em>Each house reveals important life domains!</em>`;
    }
    
    // 16. Dosha - Enhanced keyword matching
    if ((msg.includes('dosha') && (msg.includes('what is') || msg.includes('what\'s'))) && !msg.includes('mangal') ||
        (msg.includes('what') && msg.includes('dosha') && !msg.includes('mangal')) ||
        msg.includes('dosha') && msg.includes('meaning')) {
        return `⚠️ <strong>Dosha in Astrology</strong><br><br>
        Dosha is an imbalance in planetary positions that may cause challenges.<br><br>
        Common doshas include Mangal Dosha, Kaal Sarp Dosha, and Pitra Dosha.<br><br>
        🔮 <em>Doshas can be remedied through mantras, poojas, and gemstones!</em>`;
    }
    
    // 17. Mangal Dosha - Enhanced keyword matching
    if (msg.includes('mangal dosha') || msg.includes('manglik') || msg.includes('manglik dosha') ||
        msg.includes('mangal dosh') || msg.includes('mangalik') || msg.includes('mangal dosha') ||
        (msg.includes('mangal') && msg.includes('dosha')) || (msg.includes('what') && msg.includes('mangal dosha'))) {
        return `🔴 <strong>Mangal Dosha (Manglik)</strong><br><br>
        Mangal Dosha occurs when Mars is placed unfavorably and may affect marriage.<br><br>
        It can cause delays in marriage or marital discord if not remedied.<br><br>
        💍 <em>Proper remedies can nullify Mangal Dosha effects!</em>`;
    }
    
    // 18. Horoscope - Enhanced keyword matching
    if (msg.includes('horoscope') || msg.includes('kundali') || msg.includes('kundli') || 
        msg.includes('birth chart') || msg.includes('rashi phal') || msg.includes('rashifal') ||
        (msg.includes('what') && (msg.includes('horoscope') || msg.includes('kundali')))) {
        return `🌟 <strong>Horoscope</strong><br><br>
        A horoscope predicts future events based on planetary movements.<br><br>
        We provide daily, weekly, monthly, and yearly horoscope readings.<br><br>
        📅 <em>Book a consultation to get your detailed horoscope reading!</em>`;
    }
    
    // 19. Kundali Matching - Enhanced keyword matching
    if (msg.includes('kundali matching') || msg.includes('kundli matching') || msg.includes('gun milan') ||
        msg.includes('kundali match') || msg.includes('kundli match') || msg.includes('guna milan') ||
        msg.includes('marriage matching') || msg.includes('compatibility matching') ||
        (msg.includes('kundali') && msg.includes('match')) || (msg.includes('what') && msg.includes('kundali matching'))) {
        return `💑 <strong>Kundali Matching</strong><br><br>
        Kundali matching checks compatibility for marriage.<br><br>
        It analyzes 36 gunas (qualities) to determine marital harmony and success.<br><br>
        💕 <em>Get your kundali matched before marriage!</em>`;
    }
    
    // 20. Nakshatra - Enhanced keyword matching
    if (msg.includes('nakshatra') || msg.includes('nakshtara') || msg.includes('nakshatram') ||
        msg.includes('nakshatras') || (msg.includes('what') && msg.includes('nakshatra'))) {
        return `⭐ <strong>Nakshatra</strong><br><br>
        Nakshatra is a lunar mansion that influences personality and destiny.<br><br>
        There are 27 nakshatras, each with unique characteristics and ruling deities.<br><br>
        🌙 <em>Your nakshatra reveals your inner nature!</em>`;
    }
    
    // 21. Gemstone - Enhanced keyword matching
    if ((msg.includes('gemstone') || msg.includes('gemstones') || msg.includes('ratna') || msg.includes('ratnas')) &&
        (msg.includes('astrology') || msg.includes('why') || msg.includes('why are') || msg.includes('used') || msg.includes('use')) ||
        msg.includes('which gemstone') || msg.includes('gemstone recommendation') ||
        (msg.includes('what') && msg.includes('gemstone'))) {
        return `💎 <strong>Gemstones in Astrology</strong><br><br>
        Gemstones strengthen weak planets and reduce negative effects.<br><br>
        Each planet has a specific gemstone that enhances its positive energies.<br><br>
        ✨ <em>Wear the right gemstone for planetary benefits!</em>`;
    }
    
    // 22. Remedies - Enhanced keyword matching
    if (msg.includes('remedies') || msg.includes('remedy') || msg.includes('parihara') ||
        (msg.includes('what are') && (msg.includes('astrological') || msg.includes('remedies'))) ||
        msg.includes('astrology remedies') || msg.includes('astrological remedies') ||
        (msg.includes('what') && msg.includes('remedies'))) {
        return `🙏 <strong>Astrological Remedies</strong><br><br>
        Remedies include mantras, donations, fasting, and gemstones.<br><br>
        These help reduce negative planetary effects and enhance positive influences.<br><br>
        🕉️ <em>Regular practice of remedies brings positive results!</em>`;
    }
    
    // 23. Career Astrology - Enhanced keyword matching
    if (msg.includes('career astrology') || msg.includes('career prediction') ||
        (msg.includes('can astrology predict') && msg.includes('career')) ||
        (msg.includes('astrology') && msg.includes('career')) ||
        msg.includes('job prediction') || msg.includes('career guidance') ||
        (msg.includes('can') && msg.includes('astrology') && msg.includes('career'))) {
        return `💼 <strong>Career Astrology</strong><br><br>
        Yes, astrology analyzes planets and houses related to profession.<br><br>
        The 10th house, Saturn, and Jupiter play key roles in career success.<br><br>
        📈 <em>Book a consultation for detailed career guidance!</em>`;
    }
    
    // 24. Marriage Astrology - Enhanced keyword matching
    if (msg.includes('marriage astrology') || msg.includes('marriage prediction') ||
        (msg.includes('can astrology predict') && msg.includes('marriage')) ||
        (msg.includes('astrology') && msg.includes('marriage')) ||
        msg.includes('marriage timing') || msg.includes('marriage delay') ||
        (msg.includes('can') && msg.includes('astrology') && msg.includes('marriage'))) {
        return `💒 <strong>Marriage Astrology</strong><br><br>
        Yes, marriage timing and compatibility can be analyzed through astrology.<br><br>
        The 7th house, Venus, and Jupiter indicate marriage prospects.<br><br>
        💍 <em>Get your marriage predictions and kundali matching!</em>`;
    }
    
    // 25. Health Astrology - Enhanced keyword matching
    if (msg.includes('health astrology') || msg.includes('health prediction') ||
        (msg.includes('can astrology') && msg.includes('health')) ||
        (msg.includes('astrology') && msg.includes('health')) ||
        msg.includes('medical astrology') || (msg.includes('can') && msg.includes('astrology') && msg.includes('health'))) {
        return `🏥 <strong>Health & Medical Astrology</strong><br><br>
        Astrology can indicate health tendencies, not medical diagnosis.<br><br>
        The 6th house, Moon, and Sun influence health and vitality.<br><br>
        🌿 <em>Astrological remedies support overall wellness!</em>`;
    }
    
    // 26. Retrograde - Enhanced keyword matching
    if (msg.includes('retrograde') || msg.includes('vakri') || msg.includes('vakra') ||
        msg.includes('retrograde planet') || msg.includes('retrograde planets') ||
        (msg.includes('what') && msg.includes('retrograde'))) {
        return `↩️ <strong>Retrograde Planet</strong><br><br>
        Retrograde means a planet appears to move backward, affecting its results.<br><br>
        Retrograde planets bring introspection, delays, and revisiting past matters.<br><br>
        🔄 <em>Retrograde periods require patience and reflection!</em>`;
    }
    
    // 27. Transit - Enhanced keyword matching
    if (msg.includes('transit') || msg.includes('gochar') || msg.includes('gochara') ||
        msg.includes('planetary transit') || msg.includes('transits') ||
        (msg.includes('what') && msg.includes('transit'))) {
        return `🌍 <strong>Planetary Transit</strong><br><br>
        Transit is the movement of planets affecting current life events.<br><br>
        Transits trigger the promises shown in birth chart.<br><br>
        📅 <em>Transit analysis helps predict upcoming events!</em>`;
    }
    
    // 28. Daily Horoscope - Enhanced keyword matching
    if (msg.includes('daily horoscope') || msg.includes('daily horoscopes') ||
        msg.includes('today horoscope') || msg.includes('today\'s horoscope') ||
        (msg.includes('what') && msg.includes('daily horoscope'))) {
        return `📆 <strong>Daily Horoscope</strong><br><br>
        Daily horoscope predicts events for a single day.<br><br>
        It's based on Moon's position and planetary transits for each zodiac sign.<br><br>
        🌟 <em>Check your daily horoscope for guidance!</em>`;
    }
    
    // 29. Lucky Number - Enhanced keyword matching
    if (msg.includes('lucky number') || msg.includes('lucky numbers') ||
        (msg.includes('lucky') && msg.includes('number')) ||
        msg.includes('lucky number astrology') || msg.includes('lucky number in astrology') ||
        (msg.includes('what') && msg.includes('lucky number'))) {
        return `🔢 <strong>Lucky Numbers</strong><br><br>
        Lucky numbers are derived from birth date and planets.<br><br>
        Numerology and planetary positions determine your fortunate numbers.<br><br>
        ✨ <em>Use your lucky numbers for important decisions!</em>`;
    }
    
    // 30. Astrology Belief/Scientific - Enhanced keyword matching
    if (msg.includes('astrology belief') || msg.includes('astrology scientific') ||
        (msg.includes('is astrology') && (msg.includes('scientific') || msg.includes('science') || msg.includes('real'))) ||
        msg.includes('is astrology accurate') || msg.includes('is astrology true') ||
        msg.includes('how astrology works') || (msg.includes('can') && msg.includes('astrology') && msg.includes('predict'))) {
        return `🔬 <strong>Is Astrology Scientific?</strong><br><br>
        Astrology is a traditional belief system, not a proven science.<br><br>
        It's based on thousands of years of observation and correlation studies.<br><br>
        🌟 <em>Many find value in astrological guidance for life decisions!</em>`;
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
    
    // Additional questions for better coverage
    if (msg.includes('predict') || msg.includes('future') || msg.includes('fortune')) {
        return `🔮 <strong>Future Predictions & Fortune Telling</strong><br><br>
        Our expert astrologers provide:<br>
        • Accurate future predictions based on planetary positions<br>
        • Life event forecasting<br>
        • Career and financial predictions<br>
        • Relationship and marriage timing<br>
        • Health and wellness predictions<br><br>
        ✨ <em>Book a consultation to know what the stars have in store for you!</em>`;
    }
    
    if (msg.includes('rashi') || msg.includes('zodiac') || msg.includes('sign')) {
        return `♈ <strong>Rashi & Zodiac Sign Analysis</strong><br><br>
        We provide detailed analysis for all 12 zodiac signs:<br>
        • Aries to Pisces - complete personality analysis<br>
        • Daily, weekly, monthly horoscopes<br>
        • Zodiac compatibility for relationships<br>
        • Lucky numbers, colors, and gemstones<br>
        • Career guidance based on your sign<br><br>
        🌟 <em>Discover your cosmic blueprint!</em>`;
    }
    
    if (msg.includes('lucky') || msg.includes('auspicious') || msg.includes('muhurat')) {
        return `🍀 <strong>Lucky Times & Auspicious Muhurat</strong><br><br>
        We help you choose the perfect timing for:<br>
        • Marriage and engagement ceremonies<br>
        • Business inauguration<br>
        • House warming (Griha Pravesh)<br>
        • Starting new ventures<br>
        • Buying property or vehicles<br><br>
        📅 <em>Get personalized muhurat based on your birth chart!</em>`;
    }
    
    if (msg.includes('child') || msg.includes('baby') || msg.includes('pregnancy')) {
        return `👶 <strong>Child Birth & Baby Name Astrology</strong><br><br>
        Our specialized services include:<br>
        • Baby name suggestions based on nakshatra<br>
        • Auspicious time for conception<br>
        • Child birth predictions<br>
        • Newborn horoscope preparation<br>
        • Child's future prospects analysis<br><br>
        💕 <em>Ensure a bright future for your little one!</em>`;
    }
    
    if (msg.includes('money') || msg.includes('wealth') || msg.includes('finance')) {
        return `💰 <strong>Wealth & Financial Astrology</strong><br><br>
        Get insights on:<br>
        • Financial prosperity periods<br>
        • Investment timing and opportunities<br>
        • Debt solutions and remedies<br>
        • Wealth accumulation potential<br>
        • Business profit predictions<br><br>
        💎 <em>Unlock your financial potential with astrology!</em>`;
    }
    
    if (msg.includes('health') || msg.includes('disease') || msg.includes('medical')) {
        return `🏥 <strong>Health & Medical Astrology</strong><br><br>
        We provide guidance on:<br>
        • Health predictions from birth chart<br>
        • Disease prevention and timing<br>
        • Healing remedies and gemstones<br>
        • Critical health periods<br>
        • Ayurvedic recommendations<br><br>
        🌿 <em>Take preventive measures with astrological insights!</em>`;
    }
    
    if (msg.includes('education') || msg.includes('study') || msg.includes('exam')) {
        return `📚 <strong>Education & Study Astrology</strong><br><br>
        Get guidance for academic success:<br>
        • Best education stream based on birth chart<br>
        • Exam success predictions<br>
        • Study abroad opportunities<br>
        • Concentration and memory remedies<br>
        • Scholarship and competition success<br><br>
        🎓 <em>Excel in your educational journey!</em>`;
    }
    
    if (msg.includes('foreign') || msg.includes('abroad') || msg.includes('travel')) {
        return `✈️ <strong>Foreign Travel & Settlement</strong><br><br>
        Analysis includes:<br>
        • Foreign travel opportunities in chart<br>
        • Permanent settlement abroad prospects<br>
        • Best countries for you based on planets<br>
        • Visa and immigration success timing<br>
        • Travel safety and auspicious times<br><br>
        🌍 <em>Explore your global opportunities!</em>`;
    }
    
    if (msg.includes('legal') || msg.includes('court') || msg.includes('litigation')) {
        return `⚖️ <strong>Legal & Court Case Astrology</strong><br><br>
        We help with:<br>
        • Court case predictions and outcomes<br>
        • Legal dispute resolution timing<br>
        • Favorable court hearing dates<br>
        • Litigation remedies<br>
        • Property dispute solutions<br><br>
        📜 <em>Get astrological support for legal matters!</em>`;
    }
    
    if (msg.includes('name') || msg.includes('change name')) {
        return `📝 <strong>Name Correction & Analysis</strong><br><br>
        Our name services:<br>
        • Name numerology analysis<br>
        • Lucky name suggestions<br>
        • Name change recommendations<br>
        • Business name selection<br>
        • Signature analysis and correction<br><br>
        ✍️ <em>Your name affects your destiny - choose wisely!</em>`;
    }
    
    if (msg.includes('when') || msg.includes('timing') || msg.includes('time')) {
        return `⏰ <strong>Timing & Dasha Predictions</strong><br><br>
        Know the right timing for:<br>
        • Marriage and relationships<br>
        • Career changes and job switches<br>
        • Business ventures<br>
        • Major purchases<br>
        • Important life decisions<br><br>
        🎯 <em>Timing is everything - let the stars guide you!</em>`;
    }
    
    // Additional pre-questional questions
    if (msg.includes('how much') || msg.includes('price') || msg.includes('cost') || msg.includes('fee') || msg.includes('charge')) {
        return `💰 <strong>Consultation Pricing</strong><br><br>
        Our consultation fees vary by service type and duration:<br>
        • Basic Horoscope Reading: Starting from ₹500<br>
        • Detailed Kundali Analysis: ₹1000 - ₹3000<br>
        • Kundali Matching: ₹1500 - ₹2500<br>
        • Pooja Services: ₹2000 - ₹10000+<br>
        • Vastu Consultation: ₹2000 - ₹5000<br>
        • Gemstone Consultation: ₹1000 - ₹2000<br><br>
        📞 <strong>For exact pricing:</strong><br>
        • Call us: ${phone}<br>
        • WhatsApp us for instant quotes<br>
        • Book a consultation to discuss<br><br>
        ✨ <em>First-time clients may receive special offers!</em>`;
    }
    
    if (msg.includes('how long') || msg.includes('duration') || msg.includes('time taken')) {
        return `⏱️ <strong>Consultation Duration</strong><br><br>
        Consultation times vary by service:<br>
        • Basic Reading: 30-45 minutes<br>
        • Detailed Analysis: 60-90 minutes<br>
        • Kundali Matching: 45-60 minutes<br>
        • Pooja Services: 1-3 hours<br>
        • Vastu Consultation: 1-2 hours<br><br>
        📅 <em>We ensure thorough analysis for accurate guidance!</em>`;
    }
    
    if (msg.includes('what information') || msg.includes('what details') || msg.includes('what do i need')) {
        return `📋 <strong>Information Required for Consultation</strong><br><br>
        For accurate readings, please provide:<br>
        • <strong>Full Name</strong> (as per birth certificate)<br>
        • <strong>Date of Birth</strong> (DD/MM/YYYY)<br>
        • <strong>Time of Birth</strong> (HH:MM AM/PM)<br>
        • <strong>Place of Birth</strong> (City, State, Country)<br>
        • <strong>Gender</strong><br><br>
        📝 <em>More accurate birth details = More precise predictions!</em>`;
    }
    
    if (msg.includes('online') || msg.includes('video call') || msg.includes('zoom') || msg.includes('skype')) {
        return `💻 <strong>Online Consultation Available</strong><br><br>
        Yes! We offer online consultations through:<br>
        • Phone calls<br>
        • WhatsApp video/voice calls<br>
        • Video conferencing (Zoom, Google Meet)<br>
        • Email consultations<br><br>
        📱 <em>Get expert guidance from anywhere in the world!</em>`;
    }
    
    // Default response for unrecognized messages - Always provide helpful answer
    // Check if it's an astrology-related question but not matched
    const astrologyKeywords = ['astrology', 'horoscope', 'kundali', 'kundli', 'zodiac', 'planet', 'dosha', 
                              'marriage', 'career', 'health', 'gemstone', 'remedy', 'pooja', 'vastu', 
                              'nakshatra', 'rashi', 'dasha', 'transit', 'birth', 'chart', 'matching',
                              'sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn', 'rahu', 'ketu'];
    const isAstrologyQuestion = astrologyKeywords.some(keyword => msg.includes(keyword));
    
    if (isAstrologyQuestion) {
        return `✨ <strong>Thank you for your astrology question!</strong><br><br>
        I understand you're asking about astrology. Let me help you better!<br><br>
        💡 <strong>You can ask me about:</strong><br>
        • Zodiac signs, Sun sign, Moon sign, Ascendant<br>
        • Planets (Mercury, Venus, Mars, Jupiter, Saturn, Rahu, Ketu)<br>
        • Birth chart, Horoscope, Kundali matching<br>
        • Doshas (Mangal Dosha, Shani Dosha, etc.)<br>
        • Remedies, Gemstones, Pooja services<br>
        • Career, Marriage, Health astrology<br>
        • Nakshatra, Houses, Transit, Retrograde<br>
        • Daily horoscope, Lucky numbers<br><br>
        📝 <strong>Try asking:</strong><br>
        • "What is astrology?"<br>
        • "What is Mangal Dosha?"<br>
        • "Can astrology predict career?"<br>
        • "What are zodiac signs?"<br>
        • Or click any menu option above!<br><br>
        💫 <em>I'm here to answer all your astrology questions!</em>`;
    }
    
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
    • Dosha remedies<br>
    • Ask any astrology question (zodiac signs, planets, doshas, etc.)<br><br>
    📞 <strong>For immediate assistance:</strong><br>
    • Call: ${phone}<br>
    • WhatsApp: ${whatsapp || 'Click the WhatsApp button'}<br><br>
    💫 <em>Feel free to ask me anything about our astrology services! Click menu options above or type "menu" to see all options.</em>`;
}

module.exports = router;