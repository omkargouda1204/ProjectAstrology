class AstrologyChatbot {
    constructor() {
        this.currentStep = 0;
        this.mode = 'initial'; // 'initial', 'consultation', 'qna', 'info'
        this.reviewSuggested = false;
        this.inactivityTimer = null;
        this.lastActivityTime = Date.now();
        this.userData = {
            name: '',
            dob: '',
            phone: '',
            topic: '',
            question: ''
        };
        this.container = null;
        this.businessInfo = {
            phone: '+918431729319',
            address: '3rd Cross Rd, Austin Town, Neelasandra, Bengaluru, Karnataka 560047',
            googleMapsUrl: 'https://maps.app.goo.gl/rPo3UXPy65DBbsVz8',
            googleReviewUrl: 'https://maps.app.goo.gl/rPo3UXPy65DBbsVz8',
            workingDays: 'Monday - Saturday',
            workingHours: '9:00 AM - 6:00 PM',
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
                facebook: 'https://facebook.com/cosmicastrology',
                instagram: 'https://instagram.com/cosmicastrology',
                twitter: 'https://twitter.com/cosmicastrology',
                youtube: 'https://youtube.com/@cosmicastrology',
                linkedin: 'https://linkedin.com/company/cosmicastrology'
            }
        };
        this.userLanguage = 'en'; // Default language
        this.confirmationMessages = {
            en: '✅ Perfect! Your booking has been confirmed. We will contact you shortly to schedule your consultation. Thank you! 🙏',
            hi: '✅ बढ़िया! आपकी बुकिंग की पुष्टि हो गई है। हम जल्द ही आपसे संपर्क करेंगे। धन्यवाद! 🙏',
            kn: '✅ ಪರಿಪೂರ್ಣ! ನಿಮ್ಮ ಬುಕಿಂಗ್ ಅನ್ನು ದೃಢೀಕರಿಸಲಾಗಿದೆ. ನಿಮ್ಮ ಸಮಾಲೋಚನೆಯನ್ನು ನಿಗದಿಪಡಿಸಲು ನಾವು ಶೀಘ್ರದಲ್ಲೇ ನಿಮ್ಮನ್ನು ಸಂಪರ್ಕಿಸುತ್ತೇವೆ. ಧನ್ಯವಾದಗಳು! 🙏',
            mr: '✅ उत्तम! तुमची बुकिंग पूर्ण झाली आहे। आम्ही लवकरच तुमच्याशी संपर्क साधू. धन्यवाद! 🙏',
            ta: '✅ சிறப்பு! உங்கள் முன்பதிவு உறுதி செய்யப்பட்டது. உங்கள் ஆலோசனையை திட்டமிட விரைவில் உங்களைத் தொடர்புகொள்வோம். நன்றி! 🙏',
            te: '✅ పర్ఫెక్ట్! మీ బుకింగ్ నిర్ధారించబడింది. మేము త్వరలో మిమ్మల్ని సంప్రదిస్తాము. ధన్యవాదాలు! 🙏'
        };
        this.greetings = {
            hello: ['Hi! 👋 Welcome to Cosmic Astrology! How can I help you today?', 'नमस्ते! स्वागत है! मैं आपकी कैसे मदद कर सकता हूं?', 'ನಮಸ್ಕಾರ! ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಬಹುದು?'],
            thanks: ['You\'re welcome! 😊 Anything else I can help with?', 'आपका स्वागत है! और कुछ?', 'ಸ್ವಾಗತ! ಇನ್ನೇನಾದರೂ?'],
            bye: ['Goodbye! Come back anytime. 🙏 We\'re here to help!', 'अलविदा! कभी भी वापस आएं!', 'ವಿದಾಯ! ಯಾವಾಗ ಬೇಕಾದರೂ ಬನ್ನಿ!']
        };
        this.faqs = [
            { q: "What is astrology?", a: "Astrology is the study of celestial bodies and their influence on human life. It helps understand personality, relationships, and future possibilities based on planetary positions at birth." },
            { q: "How accurate is astrology?", a: "Astrology accuracy depends on precise birth details and the astrologer's expertise. Many find it insightful for self-awareness and decision-making." },
            { q: "What is a Kundali?", a: "Kundali (birth chart) is a cosmic snapshot of planetary positions at your birth time. It reveals your personality traits, life path, and future predictions." },
            { q: "Consultation duration?", a: "Consultations typically range from 30-60 minutes depending on the depth of analysis required." },
            { q: "Online consultations?", a: "Yes! We offer consultations via WhatsApp video call, phone, and chat. Book through our website or contact us directly." },
            { q: "What information needed?", a: "For accurate readings, please provide: Full name, Date of birth, Exact time of birth, Place of birth." },
            { q: "Can astrology predict future?", a: "Astrology indicates tendencies and possibilities. It provides guidance to help you make informed decisions." },
            { q: "What are remedies?", a: "Astrological remedies are practices (mantras, gemstones, rituals) suggested to balance planetary influences." },
            { q: "Which gemstone for me?", a: "Gemstone recommendations are based on your birth chart analysis. Each person's chart is unique, so we suggest after reading your Kundali." },
            { q: "Marriage compatibility?", a: "We analyze both partners' birth charts (Kundali Milan) to check compatibility across multiple parameters like Guna Milan, Manglik Dosha, etc." },
            { q: "Career counseling?", a: "We provide career guidance based on planetary positions in your 10th house, Navamsa chart, and current planetary transits." },
            { q: "Vastu consultation?", a: "Yes, we offer Vastu consultation for homes and offices to ensure positive energy flow and prosperity." },
            { q: "Lucky numbers & colors?", a: "We can provide your lucky numbers, colors, days, and directions based on your birth chart and current planetary periods." },
            { q: "Muhurat for events?", a: "We provide auspicious dates and times (Muhurat) for important life events like marriage, business opening, property purchase, etc." },
            { q: "Health issues?", a: "We can analyze health-related planetary positions and suggest remedies, but always consult medical professionals for treatment." },
            { q: "Financial problems?", a: "We analyze planetary positions affecting your finances and suggest remedies to improve your financial situation." },
            { q: "Love & Relationships?", a: "We provide detailed analysis of your 7th house, Venus position, and relationship compatibility to guide you in love matters." },
            { q: "Business consultation?", a: "We analyze your 10th house, Jupiter position, and auspicious timing for business ventures, partnerships, and investments." },
            { q: "Education guidance?", a: "We study your 4th and 5th house positions to guide you in educational choices, exam success, and academic career paths." },
            { q: "Property & Real Estate?", a: "We provide Vastu consultation and astrological guidance for property purchase, construction, and real estate investments." },
            { q: "Travel & Foreign?", a: "We analyze your 9th and 12th house to guide foreign travel, settlement abroad, and international opportunities." },
            { q: "Child & Family?", a: "We provide guidance on child birth timing, naming, education, and family harmony through astrological analysis." },
            { q: "Spiritual guidance?", a: "We offer spiritual counseling, meditation guidance, and karmic healing through Vedic astrology and ancient wisdom." }
        ];
        
        // Common question responses for free chat
        this.commonResponses = {
            'price': 'Consultation fees vary based on the service. Please call us at +918431729319 for detailed pricing. 💰',
            'cost': 'Our pricing is very reasonable and varies by service type. Contact us at +918431729319 for details. 💵',
            'fee': 'Fees depend on the consultation type. Please WhatsApp us at +918431729319 for pricing details. 💳',
            'available': 'We are available Monday to Saturday, 9:00 AM - 6:00 PM. Book your slot today! 📅',
            'timing': 'Our working hours are 9:00 AM to 6:00 PM, Monday to Saturday. Sunday closed. ⏰',
            'address': 'We are located at: 3rd Cross Rd, Austin Town, Neelasandra, Bengaluru, Karnataka 560047. 📍',
            'urgent': 'For urgent consultations, please call/WhatsApp us directly at +918431729319. We will try to accommodate you! 🚨',
            'experience': 'Our astrologers have over 15+ years of experience in Vedic astrology, Tarot, and Vastu. We have helped thousands of clients! 🌟',
            'language': 'We provide consultations in English, Hindi, Kannada, Telugu, Tamil, and Bengali. Choose your comfort language! 🗣️',
            'payment': 'We accept Cash, UPI, Google Pay, PhonePe, Paytm, and Bank Transfer. Convenient payment options! 💸'
        };
    }

    async loadConfig() {
        try {
            // Load both business info and chatbot config
            const [businessInfo, chatbotConfig] = await Promise.all([
                typeof SupabaseAPI !== 'undefined' ? SupabaseAPI.getBusinessInfo() : {},
                typeof SupabaseAPI !== 'undefined' ? SupabaseAPI.getChatbotConfig() : {}
            ]);
            
            // Update from business info
            if (businessInfo.whatsappNumber) this.businessInfo.phone = businessInfo.whatsappNumber;
            if (businessInfo.emailAddress) this.businessInfo.email = businessInfo.emailAddress;
            
            // Update from chatbot config
            const config = chatbotConfig.success ? chatbotConfig : chatbotConfig;
            
            if (config.google_maps_url) this.businessInfo.googleMapsUrl = config.google_maps_url;
            if (config.google_review_url) this.businessInfo.googleReviewUrl = config.google_review_url;
            if (config.hours_weekday) this.businessInfo.workingHours = config.hours_weekday;
            if (config.hours_sunday) this.businessInfo.sundayHours = config.hours_sunday;
            
            // Parse services from config
            if (config.services) {
                const servicesStr = typeof config.services === 'string' ? config.services : JSON.stringify(config.services);
                try {
                    // Try parsing as JSON first
                    this.businessInfo.services = JSON.parse(servicesStr);
                } catch {
                    // If not JSON, split by comma
                    this.businessInfo.services = servicesStr.split(',').map(s => s.trim()).filter(s => s);
                }
            }
            
            // Update social media
            if (config.facebook_url || config.instagram_url || config.twitter_url) {
                this.businessInfo.socialMedia = {
                    facebook: config.facebook_url || this.businessInfo.socialMedia.facebook,
                    instagram: config.instagram_url || this.businessInfo.socialMedia.instagram,
                    twitter: config.twitter_url || this.businessInfo.socialMedia.twitter,
                    youtube: config.youtube_url || this.businessInfo.socialMedia.youtube,
                    linkedin: config.linkedin_url || this.businessInfo.socialMedia.linkedin
                };
            }
            
            console.log('✅ Chatbot config loaded:', this.businessInfo);
            console.log('✅ Chatbot config loaded from Supabase:', config);
        } catch (error) {
            console.error('❌ Failed to load chatbot config:', error);
            // Use default values if config fails to load
        }
    }

    async init() {
        this.container = document.getElementById('chatbot-container');
        if (!this.container) {
            console.error('Chatbot container not found');
            return;
        }

        // Load config from backend
        await this.loadConfig();

        this.createChatbotUI();
        
        const toggleBtn = document.getElementById('chatbot-toggle');
        const closeBtn = document.getElementById('chatbot-close');
        
        toggleBtn?.addEventListener('click', () => this.toggleChat());
        closeBtn?.addEventListener('click', () => this.toggleChat());
        
        // Start conversation
        setTimeout(() => {
            this.addMessage('bot', '👋 Namaste! Welcome to Cosmic Astrology. How can I help you today?');
            setTimeout(() => {
                this.showMainMenu();
            }, 800);
        }, 500);
        
        // Start inactivity timer
        this.resetInactivityTimer();
    }

    createChatbotUI() {
        this.container.innerHTML = `
            <button id="chatbot-toggle" class="chatbot-button group">
                <div class="relative">
                    <i class="fas fa-comments text-2xl transition-transform group-hover:scale-110"></i>
                    <span class="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></span>
                </div>
            </button>
            <div id="chatbot-window" class="chatbot-window hidden">
                <div class="chatbot-header bg-gradient-to-r from-purple-600 via-pink-600 to-purple-700">
                    <div class="flex items-center space-x-3">
                        <div class="relative">
                            <div class="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center backdrop-blur-sm">
                                <i class="fas fa-moon text-2xl text-white"></i>
                            </div>
                            <span class="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></span>
                        </div>
                        <div>
                            <h3 class="font-bold text-lg">Cosmic Astrology</h3>
                            <p class="text-xs opacity-90 flex items-center">
                                <span class="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
                                Online • Ask me anything!
                            </p>
                        </div>
                    </div>
                    <button id="chatbot-close" class="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition">
                        <i class="fas fa-times text-xl"></i>
                    </button>
                </div>
                <div id="chatbot-messages" class="chatbot-messages bg-gradient-to-b from-purple-50 to-pink-50"></div>
                <div id="chatbot-input-container" class="chatbot-input-area border-t-2 border-purple-200">
                    <input type="text" id="chatbot-input" class="chatbot-input" placeholder="Type your message...">
                    <button id="chatbot-send" class="chatbot-submit bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                        <i class="fas fa-paper-plane"></i>
                    </button>
                </div>
            </div>
        `;
    }

    showMainMenu() {
        const inputContainer = document.getElementById('chatbot-input-container');
        if (!inputContainer) return;

        inputContainer.innerHTML = `
            <div class="flex overflow-x-auto space-x-2 p-3 scrollbar-hide">
                <button class="menu-btn bg-purple-600 text-white py-3 px-5 rounded-full hover:bg-purple-700 transition whitespace-nowrap flex-shrink-0 text-sm font-medium shadow-lg" data-action="consultation">
                    <i class="fas fa-calendar-check mr-2"></i>Book
                </button>
                <button class="menu-btn bg-pink-600 text-white py-3 px-5 rounded-full hover:bg-pink-700 transition whitespace-nowrap flex-shrink-0 text-sm font-medium shadow-lg" data-action="faq">
                    <i class="fas fa-question-circle mr-2"></i>FAQs
                </button>
                <button class="menu-btn bg-blue-600 text-white py-3 px-5 rounded-full hover:bg-blue-700 transition whitespace-nowrap flex-shrink-0 text-sm font-medium shadow-lg" data-action="services">
                    <i class="fas fa-star mr-2"></i>Services
                </button>
                <button class="menu-btn bg-green-600 text-white py-3 px-5 rounded-full hover:bg-green-700 transition whitespace-nowrap flex-shrink-0 text-sm font-medium shadow-lg" data-action="hours">
                    <i class="fas fa-clock mr-2"></i>Hours
                </button>
                <button class="menu-btn bg-orange-600 text-white py-3 px-5 rounded-full hover:bg-orange-700 transition whitespace-nowrap flex-shrink-0 text-sm font-medium shadow-lg" data-action="location">
                    <i class="fas fa-map-marker-alt mr-2"></i>Location
                </button>
                <button class="menu-btn bg-yellow-600 text-white py-3 px-5 rounded-full hover:bg-yellow-700 transition whitespace-nowrap flex-shrink-0 text-sm font-medium shadow-lg" data-action="review">
                    <i class="fas fa-star mr-2"></i>Review
                </button>
                <button class="menu-btn bg-cyan-600 text-white py-3 px-5 rounded-full hover:bg-cyan-700 transition whitespace-nowrap flex-shrink-0 text-sm font-medium shadow-lg" data-action="social">
                    <i class="fas fa-share-alt mr-2"></i>Social
                </button>
                <button class="menu-btn bg-teal-600 text-white py-3 px-5 rounded-full hover:bg-teal-700 transition whitespace-nowrap flex-shrink-0 text-sm font-medium shadow-lg" data-action="share">
                    <i class="fas fa-share-nodes mr-2"></i>Share
                </button>
                <button class="menu-btn bg-indigo-600 text-white py-3 px-5 rounded-full hover:bg-indigo-700 transition whitespace-nowrap flex-shrink-0 text-sm font-medium shadow-lg" data-action="chat">
                    <i class="fas fa-comment mr-2"></i>Chat
                </button>
            </div>
        `;

        document.querySelectorAll('.menu-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.currentTarget.getAttribute('data-action');
                this.handleMenuAction(action);
            });
        });
    }

    handleMenuAction(action) {
        switch(action) {
            case 'consultation':
                this.addMessage('user', 'Book Consultation');
                this.mode = 'consultation';
                this.addMessage('bot', 'Great! Let me collect some details. ✨');
                setTimeout(() => this.askNextQuestion(), 500);
                break;
            case 'faq':
                this.addMessage('user', 'FAQs');
                this.showFAQs();
                break;
            case 'services':
                this.addMessage('user', 'Services');
                this.showServices();
                break;
            case 'hours':
                this.addMessage('user', 'Working Hours');
                this.showWorkingHours();
                break;
            case 'location':
                this.addMessage('user', 'Location');
                this.showLocation();
                break;
            case 'review':
                this.addMessage('user', 'Leave Review');
                this.showReviewOption();
                break;
            case 'social':
                this.addMessage('user', 'Social Media');
                this.showSocialMedia();
                break;
            case 'share':
                this.addMessage('user', 'Share Location');
                this.shareLocation();
                break;
            case 'chat':
                this.enableFreeChat();
                break;
        }
    }

    showFAQs() {
        const inputContainer = document.getElementById('chatbot-input-container');
        if (!inputContainer) return;

        this.addMessage('bot', 'Here are common questions. Scroll to see all:');

        let faqHTML = '<div class="flex overflow-x-auto space-x-3 p-3 scrollbar-hide">';
        this.faqs.forEach((faq, index) => {
            faqHTML += `
                <button class="faq-btn bg-purple-50 hover:bg-purple-100 text-purple-900 py-3 px-5 rounded-full transition text-sm font-medium whitespace-nowrap flex-shrink-0 shadow-md" data-index="${index}">
                    ${faq.q}
                </button>
            `;
        });
        faqHTML += '</div>';
        faqHTML += '<div class="p-3"><button id="back-menu" class="w-full bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 transition font-medium"><i class="fas fa-arrow-left mr-2"></i>Back to Menu</button></div>';

        inputContainer.innerHTML = faqHTML;

        document.querySelectorAll('.faq-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.currentTarget.getAttribute('data-index'));
                const faq = this.faqs[index];
                this.addMessage('user', faq.q);
                this.addMessage('bot', faq.a);
            });
        });

        document.getElementById('back-menu')?.addEventListener('click', () => {
            this.addMessage('user', 'Back to Menu');
            this.showMainMenu();
        });
    }

    showServices() {
        let servicesText = '🌟 Our Services:\n\n';
        this.businessInfo.services.forEach((service, index) => {
            servicesText += `${index + 1}. ${service}\n`;
        });
        servicesText += '\nWould you like to book a consultation?';
        
        this.addMessage('bot', servicesText);
        
        setTimeout(() => {
            const inputContainer = document.getElementById('chatbot-input-container');
            inputContainer.innerHTML = `
                <div class="p-2 space-y-2">
                    <button id="book-now" class="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition">
                        <i class="fas fa-calendar-check mr-2"></i>Book Now
                    </button>
                    <button id="back-menu" class="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition">
                        <i class="fas fa-arrow-left mr-2"></i>Back to Menu
                    </button>
                </div>
            `;
            
            document.getElementById('book-now')?.addEventListener('click', () => {
                this.handleMenuAction('consultation');
            });
            
            document.getElementById('back-menu')?.addEventListener('click', () => {
                this.addMessage('user', 'Back to Menu');
                this.showMainMenu();
            });
        }, 500);
    }

    showWorkingHours() {
        const hoursText = `📅 Working Days: ${this.businessInfo.workingDays}\n⏰ Working Hours: ${this.businessInfo.workingHours}\n\nBook your appointment today!`;
        this.addMessage('bot', hoursText);
        
        setTimeout(() => {
            const inputContainer = document.getElementById('chatbot-input-container');
            inputContainer.innerHTML = `
                <div class="p-2 space-y-2">
                    <button id="book-now" class="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition">
                        <i class="fas fa-calendar-check mr-2"></i>Book Consultation
                    </button>
                    <button id="back-menu" class="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition">
                        <i class="fas fa-arrow-left mr-2"></i>Back to Menu
                    </button>
                </div>
            `;
            
            document.getElementById('book-now')?.addEventListener('click', () => {
                this.handleMenuAction('consultation');
            });
            
            document.getElementById('back-menu')?.addEventListener('click', () => {
                this.addMessage('user', 'Back to Menu');
                this.showMainMenu();
            });
        }, 500);
    }

    showLocation() {
        const locationText = `📍 Address: ${this.businessInfo.address}\n\nClick below to view on Google Maps:`;
        this.addMessage('bot', locationText);
        
        setTimeout(() => {
            const inputContainer = document.getElementById('chatbot-input-container');
            inputContainer.innerHTML = `
                <div class="p-2 space-y-2">
                    <a href="${this.businessInfo.googleMapsUrl}" target="_blank" class="block w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition text-center">
                        <i class="fas fa-map-marked-alt mr-2"></i>Open Google Maps
                    </a>
                    <button class="back-to-menu w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition">
                        <i class="fas fa-arrow-left mr-2"></i>Back to Menu
                    </button>
                </div>
            `;
            
            // Add event listener to back button
            document.querySelector('.back-to-menu')?.addEventListener('click', () => {
                this.addMessage('user', 'Back to Menu');
                this.showMainMenu();
            });
        }, 500);
    }

    showReviewOption() {
        const reviewText = `⭐ We'd love your feedback!\n\nYour reviews help us serve you better. Click below to leave a review on Google:`;
        this.addMessage('bot', reviewText);
        
        setTimeout(() => {
            const inputContainer = document.getElementById('chatbot-input-container');
            inputContainer.innerHTML = `
                <div class="p-2 space-y-2">
                    <a href="${this.businessInfo.googleReviewUrl}" target="_blank" class="block w-full bg-yellow-600 text-white py-3 px-4 rounded-lg hover:bg-yellow-700 transition text-center">
                        <i class="fas fa-star mr-2"></i>Leave Google Review
                    </a>
                    <button id="back-menu" class="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition">
                        <i class="fas fa-arrow-left mr-2"></i>Back to Menu
                    </button>
                </div>
            `;
            
            document.getElementById('back-menu')?.addEventListener('click', () => {
                this.addMessage('user', 'Back to Menu');
                this.showMainMenu();
            });
        }, 500);
    }

    showSocialMedia() {
        const socialText = `📱 Connect with us on social media!\n\nStay updated with daily horoscopes, astrology tips, and special offers:`;
        this.addMessage('bot', socialText);
        
        setTimeout(() => {
            const inputContainer = document.getElementById('chatbot-input-container');
            inputContainer.innerHTML = `
                <div class="p-2 space-y-2">
                    <a href="${this.businessInfo.socialMedia.facebook}" target="_blank" class="flex items-center w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition">
                        <i class="fab fa-facebook mr-3 text-xl"></i>
                        <span>Facebook</span>
                    </a>
                    <a href="${this.businessInfo.socialMedia.instagram}" target="_blank" class="flex items-center w-full bg-pink-600 text-white py-2 px-4 rounded-lg hover:bg-pink-700 transition">
                        <i class="fab fa-instagram mr-3 text-xl"></i>
                        <span>Instagram</span>
                    </a>
                    <a href="${this.businessInfo.socialMedia.youtube}" target="_blank" class="flex items-center w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition">
                        <i class="fab fa-youtube mr-3 text-xl"></i>
                        <span>YouTube</span>
                    </a>
                    <a href="${this.businessInfo.socialMedia.twitter}" target="_blank" class="flex items-center w-full bg-sky-500 text-white py-2 px-4 rounded-lg hover:bg-sky-600 transition">
                        <i class="fab fa-twitter mr-3 text-xl"></i>
                        <span>Twitter</span>
                    </a>
                    <a href="${this.businessInfo.socialMedia.linkedin}" target="_blank" class="flex items-center w-full bg-blue-700 text-white py-2 px-4 rounded-lg hover:bg-blue-800 transition">
                        <i class="fab fa-linkedin mr-3 text-xl"></i>
                        <span>LinkedIn</span>
                    </a>
                    <button id="back-menu" class="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition mt-2">
                        <i class="fas fa-arrow-left mr-2"></i>Back to Menu
                    </button>
                </div>
            `;
            
            document.getElementById('back-menu')?.addEventListener('click', () => {
                this.addMessage('user', 'Back to Menu');
                this.showMainMenu();
            });
        }, 500);
    }

    shareLocation() {
        const shareText = `📍 Share our location with someone!\n\nClick below to share:`;
        this.addMessage('bot', shareText);
        
        setTimeout(() => {
            const inputContainer = document.getElementById('chatbot-input-container');
            const locationUrl = this.businessInfo.googleMapsUrl;
            const shareMessage = `Check out Cosmic Astrology at: ${this.businessInfo.address}\nGoogle Maps: ${locationUrl}`;
            
            inputContainer.innerHTML = `
                <div class="p-2 space-y-2">
                    <a href="https://wa.me/?text=${encodeURIComponent(shareMessage)}" target="_blank" class="flex items-center w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition">
                        <i class="fab fa-whatsapp mr-3 text-xl"></i>
                        <span>Share on WhatsApp</span>
                    </a>
                    <button id="copy-location" class="flex items-center w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition">
                        <i class="fas fa-copy mr-3"></i>
                        <span>Copy Location Link</span>
                    </button>
                    <button id="back-menu" class="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition">
                        <i class="fas fa-arrow-left mr-2"></i>Back to Menu
                    </button>
                </div>
            `;
            
            document.getElementById('copy-location')?.addEventListener('click', () => {
                navigator.clipboard.writeText(locationUrl).then(() => {
                    this.addMessage('bot', '✅ Location link copied to clipboard!');
                });
            });
            
            document.getElementById('back-menu')?.addEventListener('click', () => {
                this.addMessage('user', 'Back to Menu');
                this.showMainMenu();
            });
        }, 500);
    }

    enableFreeChat() {
        this.addMessage('user', 'Free Chat');
        this.addMessage('bot', 'Sure! Type your message below. I\'m here to help! 💬');
        
        const inputContainer = document.getElementById('chatbot-input-container');
        inputContainer.innerHTML = `
            <div class="flex gap-2 p-2 w-full">
                <input type="text" id="free-chat-input" class="chatbot-input flex-1" placeholder="Type your message...">
                <button id="send-chat" class="chatbot-submit">
                    <i class="fas fa-paper-plane"></i>
                </button>
            </div>
            <div class="px-2 pb-2">
                <button id="back-menu" class="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition text-sm">
                    <i class="fas fa-arrow-left mr-2"></i>Back to Menu
                </button>
            </div>
        `;
        
        const input = document.getElementById('free-chat-input');
        const sendBtn = document.getElementById('send-chat');
        
        const sendMessage = () => {
            const message = input.value.trim();
            if (message) {
                this.addMessage('user', message);
                this.handleFreeChat(message);
                input.value = '';
            }
        };
        
        sendBtn?.addEventListener('click', sendMessage);
        input?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
        });
        
        document.getElementById('back-menu')?.addEventListener('click', () => {
            this.addMessage('user', 'Back to Menu');
            this.showMainMenu();
        });
    }

    handleFreeChat(message) {
        const lowerMsg = message.toLowerCase();
        
        // Detect language from message
        if (message.match(/[ぁ-ん]|[ァ-ヴ]/)) this.userLanguage = 'ja';
        else if (message.match(/[\u0900-\u097F]/)) this.userLanguage = 'hi';
        else if (message.match(/[\u0C80-\u0CFF]/)) this.userLanguage = 'kn';
        else if (message.match(/[\u0900-\u097F]/)) this.userLanguage = 'mr';
        else if (message.match(/[\u0B80-\u0BFF]/)) this.userLanguage = 'ta';
        else if (message.match(/[\u0C00-\u0C7F]/)) this.userLanguage = 'te';
        
        // Enhanced greetings
        if (lowerMsg.match(/(^|\s)(hi|hello|hey|namaste|namaskar|namaskara|vanakkam|sat sri akal|salaam|good\s*(morning|afternoon|evening|night))(\s|$|!|\.)/i)) {
            const greetingResponses = [
                '👋 Hello! Welcome to Cosmic Astrology. I\'m here to help you with all your astrological needs. How can I assist you today? 🌟',
                '🙏 Namaste! I\'m your Cosmic Astrology assistant. Whether you want to book a consultation, learn about our services, or ask questions, I\'m here to help!',
                '✨ Hi there! Welcome! I can help you with consultations, answer questions about astrology, or provide information about our services. What would you like to know?'
            ];
            this.addMessage('bot', greetingResponses[Math.floor(Math.random() * greetingResponses.length)]);
            setTimeout(() => this.showMainMenu(), 1500);
            return;
        }
        
        // Thank you responses
        if (lowerMsg.match(/(thank|thanks|thx|dhanyavad|dhanyavaad|nandri|shukriya)/i)) {
            const thankResponses = [
                '😊 You\'re very welcome! Feel free to ask anything else!',
                '🙏 My pleasure! Is there anything else I can help you with?',
                '✨ Happy to help! Let me know if you need anything more.'
            ];
            this.addMessage('bot', thankResponses[Math.floor(Math.random() * thankResponses.length)]);
            return;
        }
        
        // Goodbye responses
        if (lowerMsg.match(/(bye|goodbye|see you|good night|alvida|bye bye)/i)) {
            const byeResponses = [
                '👋 Goodbye! Come back anytime. We\'re here to help! 🙏',
                '🌟 Take care! Looking forward to serving you again soon!',
                '✨ Bye! May the stars guide you. Visit us anytime! 🙏'
            ];
            this.addMessage('bot', byeResponses[Math.floor(Math.random() * byeResponses.length)]);
            return;
        }
        
        // Check for common keywords and respond
        let responded = false;
        for (const [keyword, response] of Object.entries(this.commonResponses)) {
            if (lowerMsg.includes(keyword)) {
                this.addMessage('bot', response);
                responded = true;
                break;
            }
        }
        
        if (!responded) {
            if (lowerMsg.includes('book') || lowerMsg.includes('appointment') || lowerMsg.includes('consultation')) {
                this.addMessage('bot', 'Would you like to book a consultation? I can help with that!');
                setTimeout(() => this.handleMenuAction('consultation'), 1000);
                responded = true;
            } else if (lowerMsg.includes('service')) {
                this.handleMenuAction('services');
                responded = true;
            } else if (lowerMsg.includes('time') || lowerMsg.includes('hour') || lowerMsg.includes('when')) {
                this.handleMenuAction('hours');
                responded = true;
            } else if (lowerMsg.includes('location') || lowerMsg.includes('address') || lowerMsg.includes('where')) {
                this.handleMenuAction('location');
                responded = true;
            } else {
                this.addMessage('bot', 'Thank you for your message! For specific queries, please use the menu options or call us at ' + this.businessInfo.phone + '. 🙏');
                responded = true;
            }
        }
        
        // After 3 messages, suggest leaving a review (only once)
        const messages = document.querySelectorAll('.chatbot-message-user').length;
        if (messages >= 3 && !this.reviewSuggested) {
            this.reviewSuggested = true;
            setTimeout(() => {
                this.addMessage('bot', '⭐ If you\'re satisfied with our service, we\'d love if you could leave us a Google review! It helps us serve you better. 😊');
                setTimeout(() => {
                    const inputContainer = document.getElementById('chatbot-input-container');
                    // Add review button above existing input
                    const reviewBtn = document.createElement('div');
                    reviewBtn.className = 'px-2 pb-2';
                    reviewBtn.innerHTML = `
                        <a href="${this.businessInfo.googleReviewUrl}" target="_blank" class="block w-full bg-yellow-600 text-white py-2 px-4 rounded-lg hover:bg-yellow-700 transition text-center text-sm">
                            <i class="fas fa-star mr-2"></i>Leave Google Review
                        </a>
                    `;
                    inputContainer.insertBefore(reviewBtn, inputContainer.firstChild);
                }, 1000);
            }, 2000);
        }
    }

    toggleChat() {
        const window = document.getElementById('chatbot-window');
        window?.classList.toggle('hidden');
    }

    addMessage(sender, text) {
        const messagesContainer = document.getElementById('chatbot-messages');
        if (!messagesContainer) return;

        const messageDiv = document.createElement('div');
        messageDiv.className = `chatbot-message-${sender}`;
        messageDiv.textContent = text;
        messageDiv.style.whiteSpace = 'pre-line';
        
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
        // Reset inactivity timer on any message
        this.resetInactivityTimer();
    }
    
    resetInactivityTimer() {
        // Clear existing timer
        if (this.inactivityTimer) {
            clearTimeout(this.inactivityTimer);
        }
        
        this.lastActivityTime = Date.now();
        
        // Set new timer for 40 seconds
        if (!this.reviewSuggested) {
            this.inactivityTimer = setTimeout(() => {
                this.showReviewSuggestion();
            }, 40000); // 40 seconds
        }
    }
    
    showReviewSuggestion() {
        // Only show once per session
        if (this.reviewSuggested) return;
        
        this.reviewSuggested = true;
        
        // Add review suggestion message
        this.addMessage('bot', '⭐ We hope you\'re enjoying our service! Would you like to leave us a review on Google? Your feedback helps us serve you better! 🙏');
        
        setTimeout(() => {
            const inputContainer = document.getElementById('chatbot-input-container');
            if (!inputContainer) return;
            
            inputContainer.innerHTML = `
                <div class="flex space-x-2 p-2">
                    <button id="review-yes-btn" class="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-3 rounded-lg hover:shadow-lg transition font-semibold">
                        <i class="fas fa-star mr-2"></i>Yes, Leave Review
                    </button>
                    <button id="review-no-btn" class="flex-1 bg-gray-300 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-400 transition font-semibold">
                        <i class="fas fa-times mr-2"></i>Maybe Later
                    </button>
                </div>
            `;
            
            document.getElementById('review-yes-btn')?.addEventListener('click', () => {
                this.addMessage('user', 'Yes, Leave Review');
                window.open(this.businessInfo.googleReviewUrl, '_blank');
                setTimeout(() => {
                    this.addMessage('bot', 'Thank you so much! 🙏 Your feedback means the world to us. ⭐✨');
                    setTimeout(() => {
                        this.showMainMenu();
                    }, 1500);
                }, 500);
            });
            
            document.getElementById('review-no-btn')?.addEventListener('click', () => {
                this.addMessage('user', 'Maybe Later');
                setTimeout(() => {
                    this.addMessage('bot', 'No worries! Feel free to reach out anytime. 😊');
                    setTimeout(() => {
                        this.showMainMenu();
                    }, 1000);
                }, 500);
            });
        }, 800);
    }

    askNextQuestion() {
        if (this.mode !== 'consultation') return;

        const questions = [
            { text: 'What is your name?', field: 'name', type: 'text', placeholder: 'Enter your name' },
            { text: 'What is your date of birth?', field: 'dob', type: 'date', placeholder: 'Select date' },
            { text: 'What is your phone number?', field: 'phone', type: 'tel', placeholder: '+91 XXXXX XXXXX' },
            { text: 'What is your email address? (Optional)', field: 'email', type: 'email', placeholder: 'your.email@example.com' },
            { text: 'Select consultation topic:', field: 'topic', type: 'select', options: this.businessInfo.services }
        ];

        if (this.currentStep >= questions.length) {
            this.completeBooking();
            return;
        }

        const question = questions[this.currentStep];
        this.addMessage('bot', question.text);

        setTimeout(() => {
            const inputContainer = document.getElementById('chatbot-input-container');
            
            if (question.type === 'select') {
                let selectHTML = '<div class="p-4">';
                selectHTML += '<select id="topic-select" class="w-full px-4 py-3 border-2 border-purple-300 rounded-lg focus:border-purple-600 focus:ring-2 focus:ring-purple-200 focus:outline-none text-gray-700 font-medium" required>';
                selectHTML += '<option value="">-- Select a Topic --</option>';
                question.options.forEach(option => {
                    selectHTML += `<option value="${option}">${option}</option>`;
                });
                selectHTML += '</select>';
                selectHTML += '<button id="topic-submit-btn" class="w-full mt-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition"><i class="fas fa-check mr-2"></i>Continue</button>';
                selectHTML += '</div>';
                inputContainer.innerHTML = selectHTML;
                
                const topicSubmitBtn = document.getElementById('topic-submit-btn');
                topicSubmitBtn?.addEventListener('click', () => {
                    const selectElement = document.getElementById('topic-select');
                    const value = selectElement.value;
                    if (value) {
                        this.handleAnswer(question.field, value);
                    } else {
                        alert('Please select a consultation topic to continue');
                    }
                });
            } else {
                // Set max date for DOB field (today's date)
                const maxDateAttr = question.field === 'dob' ? `max="${new Date().toISOString().split('T')[0]}"` : '';
                
                inputContainer.innerHTML = `
                    <div class="flex gap-2 p-2 w-full">
                        <input type="${question.type}" id="user-input" class="chatbot-input flex-1" placeholder="${question.placeholder}" ${maxDateAttr}>
                        <button id="submit-answer" class="chatbot-submit">
                            <i class="fas fa-paper-plane"></i>
                        </button>
                    </div>
                `;
                
                const input = document.getElementById('user-input');
                const submitBtn = document.getElementById('submit-answer');
                
                const submit = () => {
                    const value = input.value.trim();
                    
                    // Validate name (only letters and spaces)
                    if (question.field === 'name') {
                        const nameRegex = /^[a-zA-Z\s]+$/;
                        if (!nameRegex.test(value)) {
                            this.addMessage('bot', '❌ Please enter a valid name (letters and spaces only, no numbers or special characters)');
                            return;
                        }
                        if (value.length < 2) {
                            this.addMessage('bot', '❌ Name must be at least 2 characters long');
                            return;
                        }
                        if (value.length > 50) {
                            this.addMessage('bot', '❌ Name is too long (maximum 50 characters)');
                            return;
                        }
                    }
                    
                    // Validate phone number (10 digits)
                    if (question.field === 'phone') {
                        const phoneRegex = /^[6-9]\d{9}$/;
                        const cleanPhone = value.replace(/[^0-9]/g, '');
                        if (!phoneRegex.test(cleanPhone)) {
                            this.addMessage('bot', '❌ Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9');
                            return;
                        }
                    }
                    
                    // Validate date of birth (not future date)
                    if (question.field === 'dob') {
                        const selectedDate = new Date(value);
                        const today = new Date();
                        today.setHours(0, 0, 0, 0); // Reset time to start of day
                        
                        if (selectedDate > today) {
                            this.addMessage('bot', '❌ Date of birth cannot be in the future. Please select a valid date.');
                            return;
                        }
                        
                        // Check if date is too old (more than 120 years)
                        const minDate = new Date();
                        minDate.setFullYear(minDate.getFullYear() - 120);
                        if (selectedDate < minDate) {
                            this.addMessage('bot', '❌ Please select a valid date of birth.');
                            return;
                        }
                    }
                    
                    // Skip validation for optional email field if empty
                    if (value || question.field !== 'email') {
                        this.handleAnswer(question.field, value);
                    }
                };
                
                submitBtn?.addEventListener('click', submit);
                input?.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') submit();
                });
            }
        }, 500);
    }

    handleAnswer(field, value) {
        this.userData[field] = value;
        this.addMessage('user', value);
        this.currentStep++;
        setTimeout(() => this.askNextQuestion(), 500);
    }

    completeBooking() {
        // Enhanced booking data with complete information
        const bookingData = {
            name: this.userData.name,
            phone: this.userData.phone,
            email: this.userData.email || '',
            dob: this.userData.dob,
            topic: this.userData.topic,
            message: `Consultation request via Chatbot for ${this.userData.topic}`,
            type: 'booking',
            source: 'Chatbot',
            timestamp: new Date().toISOString(),
            status: 'pending',
            created_at: new Date().toISOString()
        };
        
        console.log('Submitting booking:', bookingData);
        
        // Submit to Supabase backend
        if (typeof SupabaseAPI !== 'undefined') {
            SupabaseAPI.submitLead(bookingData)
            .then(data => {
                if (data.success) {
                    console.log('Booking submitted successfully');
                    
                    // Show success message in user's language
                    const confirmMsg = this.confirmationMessages[this.userLanguage] || this.confirmationMessages.en;
                    this.addMessage('bot', confirmMsg);
                
                // Add WhatsApp contact button
                setTimeout(() => {
                    const inputContainer = document.getElementById('chatbot-input-container');
                    inputContainer.innerHTML = `
                        <div class="p-2 space-y-2">
                            <a href="https://wa.me/${this.businessInfo.phone.replace(/[^0-9]/g, '')}?text=Hi%2C%20I%20just%20booked%20a%20consultation%20for%20${encodeURIComponent(this.userData.topic)}%20through%20your%20website.%20My%20name%20is%20${encodeURIComponent(this.userData.name)}." 
                               target="_blank" 
                               class="block w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition text-center font-medium">
                                <i class="fab fa-whatsapp mr-2"></i>Continue on WhatsApp
                            </a>
                            <button id="back-menu" class="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition font-medium">
                                <i class="fas fa-arrow-left mr-2"></i>Back to Main Menu
                            </button>
                        </div>
                    `;
                    
                    document.getElementById('back-menu')?.addEventListener('click', () => {
                        this.resetBookingForm();
                        this.addMessage('user', 'Back to Menu');
                        this.showMainMenu();
                    });
                }, 1000);
                } else {
                    this.addMessage('bot', '❌ Sorry, there was an error submitting your booking. Please try again or contact us directly at ' + this.businessInfo.phone);
                    setTimeout(() => {
                        this.showMainMenu();
                    }, 2000);
                }
            }).catch(error => {
                console.error('Booking submission error:', error);
                this.addMessage('bot', '❌ Sorry, there was a connection error. Please contact us at ' + this.businessInfo.phone + ' or try again.');
                setTimeout(() => {
                    this.showMainMenu();
                }, 2000);
            });
        } else {
            console.error('SupabaseAPI not available');
            this.addMessage('bot', '❌ Backend not available. Please contact us at ' + this.businessInfo.phone);
        }
    }

    resetBookingForm() {
        this.currentStep = 0;
        this.mode = 'initial';
        this.userData = { name: '', dob: '', phone: '', topic: '', question: '', email: '' };
    }
}

// Initialize chatbot when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const chatbot = new AstrologyChatbot();
    chatbot.init();
});
