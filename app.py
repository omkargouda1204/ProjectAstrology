from flask import Flask, render_template, request, jsonify, session
from flask_cors import CORS
from datetime import datetime
import os
import json
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from werkzeug.security import generate_password_hash, check_password_hash
from dotenv import load_dotenv
from supabase import create_client, Client
import openai

# Load environment variables
load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv('FLASK_SECRET_KEY', 'your-secret-key-change-this-in-production')
CORS(app)

# Initialize Supabase client
supabase_url = os.getenv('SUPABASE_URL')
supabase_key = os.getenv('SUPABASE_KEY')
supabase: Client = create_client(supabase_url, supabase_key)

# Initialize OpenAI (optional - for advanced chatbot)
# openai.api_key = os.getenv('OPENAI_API_KEY', '')

# ==================== ROUTES ====================

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/admin.html')
def admin():
    return render_template('admin.html')

@app.route('/contact.html')
def contact():
    return render_template('contact.html')

@app.route('/privacy.html')
def privacy():
    return render_template('privacy.html')

# ==================== API ENDPOINTS ====================

# Hero Slides
@app.route('/api/hero-slides', methods=['GET'])
def get_hero_slides():
    try:
        # Try with filters first, fallback to simple select if columns don't exist
        try:
            response = supabase.table('hero_slides')\
                .select('*')\
                .eq('active', True)\
                .order('display_order')\
                .execute()
        except:
            # Fallback: simple select if active or display_order columns don't exist
            response = supabase.table('hero_slides')\
                .select('*')\
                .execute()
        
        # Fix image paths: convert ../assets/images/ to /static/assets/images/
        slides = response.data if response.data else []
        for slide in slides:
            if slide.get('image') and slide['image'].startswith('../assets/'):
                slide['image'] = slide['image'].replace('../assets/', '/static/assets/')
        
        print(f'Hero slides count: {len(slides)}')
        return jsonify(slides)
    except Exception as e:
        print(f'Hero slides error: {str(e)}')
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e), 'success': False}), 500

@app.route('/api/hero-slides', methods=['POST'])
def create_hero_slide():
    try:
        data = request.json
        response = supabase.table('hero_slides').insert(data).execute()
        return jsonify(response.data[0]), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/hero-slides/<int:slide_id>', methods=['PUT'])
def update_hero_slide(slide_id):
    try:
        data = request.json
        response = supabase.table('hero_slides')\
            .update(data)\
            .eq('id', slide_id)\
            .execute()
        return jsonify(response.data[0])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/hero-slides/<int:slide_id>', methods=['DELETE'])
def delete_hero_slide(slide_id):
    try:
        supabase.table('hero_slides').delete().eq('id', slide_id).execute()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Gallery Slides
@app.route('/api/gallery-slides', methods=['GET'])
def get_gallery_slides():
    try:
        # Try with filters first, fallback to simple select if columns don't exist
        try:
            response = supabase.table('gallery_slides')\
                .select('*')\
                .eq('active', True)\
                .order('display_order')\
                .execute()
        except:
            # Fallback: simple select if active or display_order columns don't exist
            response = supabase.table('gallery_slides')\
                .select('*')\
                .execute()
        
        # Fix image paths: convert ../assets/images/ to /static/assets/images/
        slides = response.data if response.data else []
        for slide in slides:
            if slide.get('image') and slide['image'].startswith('../assets/'):
                slide['image'] = slide['image'].replace('../assets/', '/static/assets/')
        
        print(f'Gallery slides count: {len(slides)}')
        return jsonify(slides)
    except Exception as e:
        print(f'Gallery slides error: {str(e)}')
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e), 'success': False}), 500

@app.route('/api/gallery-slides', methods=['POST'])
def create_gallery_slide():
    try:
        data = request.json
        response = supabase.table('gallery_slides').insert(data).execute()
        return jsonify(response.data[0]), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/gallery-slides/<int:slide_id>', methods=['DELETE'])
def delete_gallery_slide(slide_id):
    try:
        supabase.table('gallery_slides').delete().eq('id', slide_id).execute()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Bookings
@app.route('/api/bookings', methods=['GET'])
def get_bookings():
    try:
        response = supabase.table('bookings')\
            .select('*')\
            .order('created_at', desc=True)\
            .execute()
        return jsonify(response.data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/bookings', methods=['POST'])
def create_booking():
    try:
        data = request.json
        
        # Validate name (min 2 chars, only letters and spaces)
        name = data.get('name', '').strip()
        if not name or len(name) < 2:
            return jsonify({'error': 'Name must be at least 2 characters'}), 400
        if not all(c.isalpha() or c.isspace() for c in name):
            return jsonify({'error': 'Name can only contain letters'}), 400
        
        # Validate phone (10 digits, Indian format)
        phone = data.get('phone', '').strip()
        if not phone:
            return jsonify({'error': 'Phone number is required'}), 400
        phone_digits = ''.join(filter(str.isdigit, phone))
        if len(phone_digits) != 10:
            return jsonify({'error': 'Phone number must be 10 digits'}), 400
        if phone_digits[0] not in ['6', '7', '8', '9']:
            return jsonify({'error': 'Invalid Indian phone number'}), 400
        
        # Validate DOB (not in future, not more than 120 years old, minimum 5 years old)
        if data.get('dob'):
            try:
                dob = datetime.strptime(data['dob'], '%Y-%m-%d')
                today = datetime.now()
                
                if dob > today:
                    return jsonify({'error': 'Date of birth cannot be in the future'}), 400
                
                age = (today - dob).days / 365.25
                if age < 5:
                    return jsonify({'error': 'Minimum age is 5 years'}), 400
                if age > 120:
                    return jsonify({'error': 'Please enter a valid date of birth'}), 400
                    
            except ValueError:
                return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
        
        # Update data with validated values
        data['name'] = name
        data['phone'] = phone_digits
        
        # Insert booking
        response = supabase.table('bookings').insert(data).execute()
        
        # Send email notification
        if response.data:
            send_booking_email(response.data[0])
        
        return jsonify(response.data[0]), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/bookings/<int:booking_id>', methods=['PUT'])
def update_booking(booking_id):
    try:
        data = request.json
        response = supabase.table('bookings')\
            .update(data)\
            .eq('id', booking_id)\
            .execute()
        return jsonify(response.data[0])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/bookings/<int:booking_id>', methods=['DELETE'])
def delete_booking(booking_id):
    try:
        supabase.table('bookings').delete().eq('id', booking_id).execute()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Contact Messages
@app.route('/api/contact-messages', methods=['GET'])
def get_contact_messages():
    try:
        response = supabase.table('contact_messages')\
            .select('*')\
            .order('created_at', desc=True)\
            .execute()
        return jsonify(response.data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/contact-messages', methods=['POST'])
def create_contact_message():
    try:
        data = request.json
        response = supabase.table('contact_messages').insert(data).execute()
        return jsonify(response.data[0]), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Business Info
@app.route('/api/business-info', methods=['GET'])
def get_business_info():
    try:
        response = supabase.table('business_info')\
            .select('*')\
            .eq('id', 1)\
            .execute()
        if response.data:
            return jsonify(response.data[0])
        return jsonify({})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/business-info', methods=['POST', 'PUT'])
def update_business_info():
    try:
        data = request.json
        # Upsert (update or insert)
        response = supabase.table('business_info')\
            .upsert({'id': 1, **data})\
            .execute()
        return jsonify(response.data[0])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Admin Login
@app.route('/api/admin/login', methods=['POST'])
def admin_login():
    try:
        data = request.json
        password = data.get('password')
        admin_password = os.getenv('ADMIN_PASSWORD', 'Admin@12')
        
        if password == admin_password:
            session['admin_logged_in'] = True
            return jsonify({'success': True, 'message': 'Login successful'})
        else:
            return jsonify({'success': False, 'message': 'Invalid password'}), 401
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/logout', methods=['POST'])
def admin_logout():
    session.pop('admin_logged_in', None)
    return jsonify({'success': True})

# Chatbot Endpoint
@app.route('/api/chatbot', methods=['POST'])
def chatbot():
    try:
        data = request.json
        user_message = data.get('message', '').lower()
        booking_data = data.get('booking')  # For booking submissions
        
        # Get business details
        whatsapp = os.getenv('WHATSAPP_NUMBER', '+918431729319')
        whatsapp_clean = whatsapp.replace('+', '').replace(' ', '')
        address = os.getenv('BUSINESS_ADDRESS', '3rd Cross Rd, Austin Town, Neelasandra, Bengaluru, Karnataka 560047')
        maps_url = os.getenv('GOOGLE_MAPS_URL', 'https://maps.google.com/?q=3rd+Cross+Rd+Austin+Town+Neelasandra+Bengaluru+560047')
        review_url = os.getenv('GOOGLE_REVIEW_URL', 'https://maps.app.goo.gl/rPo3UXPy65DBbsVz8')
        hours_weekday = os.getenv('HOURS_WEEKDAY', '9:00 AM - 8:00 PM')
        hours_sunday = os.getenv('HOURS_SUNDAY', '9:00 AM - 2:00 PM')
        facebook = os.getenv('FACEBOOK_URL', '')
        instagram = os.getenv('INSTAGRAM_URL', '')
        twitter = os.getenv('TWITTER_URL', '')
        youtube = os.getenv('YOUTUBE_URL', '')
        
        # Handle booking submission
        if booking_data:
            try:
                # Validate booking data
                name = booking_data.get('name', '').strip()
                phone = booking_data.get('phone', '').strip()
                service = booking_data.get('service', '').strip()
                message = booking_data.get('message', '').strip()
                
                if not name or not phone or not service:
                    return jsonify({
                        'response': '❌ <strong>Please fill all required fields:</strong><br>Name, Phone, and Service',
                        'success': False
                    })
                
                # Save to database
                booking_entry = {
                    'name': name,
                    'phone': phone,
                    'service': service,
                    'message': message,
                    'source': 'chatbot',
                    'status': 'pending',
                    'created_at': datetime.now().isoformat()
                }
                
                response = supabase.table('bookings').insert(booking_entry).execute()
                
                # Send notification email
                send_booking_email(response.data[0])
                
                return jsonify({
                    'response': f'''✅ <strong>Booking Received Successfully!</strong><br><br>
Thank you <strong>{name}</strong> for booking <strong>{service}</strong>!<br><br>
📱 We'll contact you at <strong>{phone}</strong> within 2 hours<br><br>
<em>Booking ID: #{response.data[0]['id']}</em><br><br>
🙏 <strong>What's next?</strong><br>
• Check your phone for our call/WhatsApp<br>
• Prepare your birth details (if needed)<br><br>
<a href="{review_url}" target="_blank" style="color: #7C3AED;">⭐ Already had a session? Leave a review!</a>''',
                    'success': True
                })
                
            except Exception as e:
                return jsonify({
                    'response': '❌ <strong>Booking failed. Please try again or contact us directly.</strong>',
                    'success': False,
                    'error': str(e)
                })
        
        # Get business details
        whatsapp = os.getenv('WHATSAPP_NUMBER', '+918431729319')
        whatsapp_clean = whatsapp.replace('+', '').replace(' ', '')
        address = os.getenv('BUSINESS_ADDRESS', '3rd Cross Rd, Austin Town, Neelasandra, Bengaluru, Karnataka 560047')
        maps_url = os.getenv('GOOGLE_MAPS_URL', 'https://maps.google.com/?q=3rd+Cross+Rd+Austin+Town+Neelasandra+Bengaluru+560047')
        review_url = os.getenv('GOOGLE_REVIEW_URL', 'https://maps.app.goo.gl/rPo3UXPy65DBbsVz8')
        hours_weekday = os.getenv('HOURS_WEEKDAY', '9:00 AM - 8:00 PM')
        hours_sunday = os.getenv('HOURS_SUNDAY', '9:00 AM - 2:00 PM')
        
        # Enhanced conversational responses
        responses = {
            'services': {
                'keywords': ['service', 'services', 'offer', 'what do you', 'provide', 'help with'],
                'response': f'''🌟 <strong>Our Astrology Services:</strong><br><br>
We offer comprehensive astrology consultations:<br><br>
• 📜 <strong>Kundali Analysis</strong> - Complete birth chart reading<br>
• 🎴 <strong>Tarot Card Reading</strong> - Mystical insights<br>
• 💼 <strong>Career Guidance</strong> - Professional path clarity<br>
• 💑 <strong>Love & Relationships</strong> - Compatibility analysis<br>
• 💰 <strong>Financial Consultation</strong> - Wealth prospects<br>
• 🏠 <strong>Vastu Consultation</strong> - Space harmonization<br>
• 💎 <strong>Gemstone Recommendation</strong> - Crystal healing<br>
• 📅 <strong>Muhurat Selection</strong> - Auspicious timing<br><br>
<a href="https://wa.me/{whatsapp_clean}" target="_blank" style="background: linear-gradient(to right, #7C3AED, #EC4899); color: white; padding: 8px 16px; border-radius: 20px; text-decoration: none; display: inline-block; font-weight: bold;">
📞 Book via WhatsApp
</a>'''
            },
            'hours': {
                'keywords': ['hours', 'timing', 'time', 'when open', 'schedule', 'available', 'working'],
                'response': f'''⏰ <strong>Business Hours:</strong><br><br>
📅 <strong>Monday - Saturday:</strong> {hours_weekday}<br>
☀️ <strong>Sunday:</strong> {hours_sunday}<br><br>
<em>💡 Tip: Book in advance for guaranteed slots!</em><br><br>
<a href="https://wa.me/{whatsapp_clean}" target="_blank" style="color: #7C3AED; font-weight: bold;">💬 Contact us on WhatsApp</a>'''
            },
            'location': {
                'keywords': ['location', 'address', 'where', 'find you', 'office', 'visit', 'direction'],
                'response': f'''📍 <strong>Visit Us:</strong><br><br>
{address}<br><br>
<a href="{maps_url}" target="_blank" style="background: linear-gradient(to right, #7C3AED, #EC4899); color: white; padding: 8px 16px; border-radius: 20px; text-decoration: none; display: inline-block; font-weight: bold;">
🗺️ Open in Google Maps
</a><br><br>
<strong>🚗 Parking:</strong> Available nearby<br>
<strong>♿ Accessibility:</strong> Wheelchair accessible'''
            },
            'contact': {
                'keywords': ['contact', 'phone', 'call', 'email', 'reach', 'connect', 'message'],
                'response': f'''📞 <strong>Get In Touch:</strong><br><br>
<strong>📱 Phone:</strong> {whatsapp}<br>
<strong>💬 WhatsApp:</strong> <a href="https://wa.me/{whatsapp_clean}" target="_blank" style="color: #7C3AED; font-weight: bold;">{whatsapp}</a><br>
<strong>📧 Email:</strong> {os.getenv('EMAIL_ADDRESS', 'info@astrology.com')}<br><br>
<strong>⏰ Best time to call:</strong> {hours_weekday}<br><br>
<em>We respond fastest on WhatsApp! 💚</em>'''
            },
            'booking': {
                'keywords': ['book', 'appointment', 'schedule', 'reserve', 'consultation', 'session'],
                'response': f'''📅 <strong>Book Your Consultation:</strong><br><br>
<strong>Choose your preferred method:</strong><br><br>
1️⃣ <a href="https://wa.me/{whatsapp_clean}" target="_blank" style="color: #7C3AED; font-weight: bold;"><strong>WhatsApp Booking</strong></a> <span style="color: #10B981;">(Instant Response ⚡)</span><br>
2️⃣ <strong>Fill our booking form</strong> on the website<br>
3️⃣ <strong>Call us</strong> at {whatsapp}<br><br>
<em>📝 Please have ready: Name, DOB, and preferred service</em>'''
            },
            'review': {
                'keywords': ['review', 'feedback', 'rating', 'testimonial', 'google review', 'experience'],
                'response': f'''⭐ <strong>We'd Love Your Feedback!</strong><br><br>
Your experience matters to us. Share your thoughts and help others find their cosmic path!<br><br>
<a href="{review_url}" target="_blank" style="background: linear-gradient(to right, #7C3AED, #EC4899); color: white; padding: 12px 24px; border-radius: 25px; text-decoration: none; display: inline-block; font-weight: bold; font-size: 16px;">
⭐⭐⭐⭐⭐ Write a Google Review
</a><br><br>
<em>Your feedback helps us serve you better! 🙏✨</em>'''
            },
            'social': {
                'keywords': ['social', 'facebook', 'instagram', 'twitter', 'youtube', 'follow', 'connect online'],
                'response': f'''📱 <strong>Follow Us on Social Media!</strong><br><br>
Stay connected for daily horoscopes, tips, and updates:<br><br>
{f'📘 <a href="{facebook}" target="_blank" style="color: #1877F2; font-weight: bold;">Facebook</a><br>' if facebook else ''}
{f'📸 <a href="{instagram}" target="_blank" style="color: #E4405F; font-weight: bold;">Instagram</a><br>' if instagram else ''}
{f'🐦 <a href="{twitter}" target="_blank" style="color: #1DA1F2; font-weight: bold;">Twitter</a><br>' if twitter else ''}
{f'🎥 <a href="{youtube}" target="_blank" style="color: #FF0000; font-weight: bold;">YouTube</a><br>' if youtube else ''}
<br><em>💫 Join our community of 10,000+ followers!</em>'''
            },
            'qa': {
                'keywords': ['what is astrology', 'how does', 'why should', 'benefits', 'accurate', 'works', 'question', 'faq'],
                'response': '''❓ <strong>Common Questions & Answers:</strong><br><br>
<strong>Q: Is astrology accurate?</strong><br>
A: Astrology provides guidance based on cosmic patterns. Accuracy depends on precise birth details and expert interpretation.<br><br>
<strong>Q: What do I need for a reading?</strong><br>
A: Birth date, time, and place are essential for accurate predictions.<br><br>
<strong>Q: How long is a consultation?</strong><br>
A: Sessions typically last 30-60 minutes depending on the service.<br><br>
<strong>Q: Can astrology predict the future?</strong><br>
A: Astrology reveals tendencies and possibilities, helping you make informed decisions.<br><br>
<em>Have more questions? Just ask me! 💬</em>'''
            },
            'help': {
                'keywords': ['help', 'hi', 'hello', 'hey', 'start', 'menu', 'options'],
                'response': f'''👋 <strong>Namaste! I'm your Astrology Assistant</strong><br><br>
I'm here to help you with:<br><br>
🌟 <strong>Services</strong> - Explore our offerings<br>
⏰ <strong>Hours</strong> - Check our availability<br>
📍 <strong>Location</strong> - Find our office<br>
📞 <strong>Contact</strong> - Get in touch<br>
📅 <strong>Booking</strong> - Schedule your consultation<br>
📱 <strong>Social</strong> - Follow us online<br>
❓ <strong>FAQ</strong> - Common questions<br>
⭐ <strong>Review</strong> - Share your experience<br><br>
<em>Just type what you need, or ask me anything! 😊</em>'''
            },
            'thank': {
                'keywords': ['thank', 'thanks', 'appreciate', 'grateful'],
                'response': '''🙏 <strong>You're very welcome!</strong><br><br>
It's our pleasure to assist you on your spiritual journey. Feel free to ask anything else!<br><br>
<em>May the stars guide you! ✨</em>'''
            },
            'bye': {
                'keywords': ['bye', 'goodbye', 'see you', 'later'],
                'response': '''👋 <strong>Goodbye & Blessings!</strong><br><br>
Thank you for chatting with us. We look forward to serving you soon!<br><br>
<em>May your path be filled with light! 🌟</em>'''
            }
        }
        
        # Find matching response
        for category, config in responses.items():
            if any(keyword in user_message for keyword in config['keywords']):
                return jsonify({'response': config['response']})
        
        # Default response
        return jsonify({
            'response': '''👋 Hello! I'm here to help you with:

• 📋 Our Services & Pricing
• ⏰ Business Hours
• 📍 Location & Directions
• 📞 Contact Information
• 📅 Booking Appointments

What would you like to know about?'''
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# File Upload (for Supabase Storage)
@app.route('/api/upload', methods=['POST'])
def upload_file():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        bucket = os.getenv('SUPABASE_STORAGE_BUCKET', 'astrology')
        
        # Upload to Supabase Storage
        file_bytes = file.read()
        file_path = f"{datetime.now().strftime('%Y%m%d_%H%M%S')}_{file.filename}"
        
        response = supabase.storage.from_(bucket).upload(
            file_path,
            file_bytes,
            file_options={'content-type': file.content_type}
        )
        
        # Get public URL
        public_url = supabase.storage.from_(bucket).get_public_url(file_path)
        
        return jsonify({
            'success': True,
            'url': public_url,
            'path': file_path
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Helper Functions
def send_booking_email(booking_data):
    """Send email notification for new booking"""
    try:
        email_address = os.getenv('EMAIL_ADDRESS')
        email_password = os.getenv('EMAIL_PASSWORD')
        
        if not email_address or not email_password:
            print("Email credentials not configured")
            return False
        
        msg = MIMEMultipart('alternative')
        msg['Subject'] = f"New Booking: {booking_data.get('service', 'Service')}"
        msg['From'] = email_address
        msg['To'] = email_address
        
        html = f"""
        <html>
        <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
            <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; border: 2px solid #667eea;">
                <h2 style="color: #667eea; text-align: center;">🔮 New Booking Request</h2>
                <div style="margin: 20px 0; padding: 20px; background: #f8f9ff; border-radius: 8px;">
                    <p><strong>Name:</strong> {booking_data.get('name')}</p>
                    <p><strong>Phone:</strong> {booking_data.get('phone')}</p>
                    <p><strong>Email:</strong> {booking_data.get('email', 'N/A')}</p>
                    <p><strong>Date of Birth:</strong> {booking_data.get('dob', 'N/A')}</p>
                    <p><strong>Service:</strong> {booking_data.get('service', 'N/A')}</p>
                    <p><strong>Preferred Date:</strong> {booking_data.get('booking_date', 'N/A')}</p>
                    <p><strong>Preferred Time:</strong> {booking_data.get('booking_time', 'N/A')}</p>
                    <p><strong>Message:</strong> {booking_data.get('message', 'N/A')}</p>
                    <p><strong>Booking Time:</strong> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
                </div>
                <p style="color: #666; font-size: 12px; text-align: center; margin-top: 20px;">
                    This booking was submitted through your website
                </p>
            </div>
        </body>
        </html>
        """
        
        part = MIMEText(html, 'html')
        msg.attach(part)
        
        with smtplib.SMTP(os.getenv('SMTP_SERVER', 'smtp.gmail.com'), int(os.getenv('SMTP_PORT', 587))) as server:
            server.starttls()
            server.login(email_address, email_password)
            server.send_message(msg)
        
        print(f"Booking email sent successfully for {booking_data.get('name')}")
        return True
        
    except Exception as e:
        print(f"Error sending booking email: {str(e)}")
        return False

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
