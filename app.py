from flask import Flask, render_template, request, jsonify, session, send_from_directory
from flask_cors import CORS
from datetime import datetime
import os
import json
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from dotenv import load_dotenv
from supabase import create_client, Client
import openai
import mimetypes

# Load environment variables
load_dotenv()

# Ensure proper MIME types for CSS and JS files
mimetypes.add_type('text/css', '.css')
mimetypes.add_type('application/javascript', '.js')
mimetypes.add_type('image/avif', '.avif')
mimetypes.add_type('image/webp', '.webp')

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

@app.route('/favicon.ico')
def favicon():
    return send_from_directory(os.path.join(app.root_path, 'static'),
                               'favicon.ico', mimetype='image/vnd.microsoft.icon')

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

@app.route('/api/hero-slides/<int:slide_id>', methods=['GET'])
def get_hero_slide(slide_id):
    try:
        response = supabase.table('hero_slides')\
            .select('*')\
            .eq('id', slide_id)\
            .execute()
        if response.data and len(response.data) > 0:
            return jsonify(response.data[0])
        return jsonify({'error': 'Slide not found'}), 404
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
        print(f"Creating gallery slide with data: {data}")
        
        # Ensure required fields
        if not data.get('image'):
            return jsonify({'error': 'Image URL is required'}), 400
        
        response = supabase.table('gallery_slides').insert(data).execute()
        print(f"Gallery slide created: {response.data}")
        return jsonify(response.data[0]), 201
    except Exception as e:
        print(f"Error creating gallery slide: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/api/gallery-slides/<int:slide_id>', methods=['GET'])
def get_gallery_slide(slide_id):
    try:
        response = supabase.table('gallery_slides')\
            .select('*')\
            .eq('id', slide_id)\
            .execute()
        if response.data and len(response.data) > 0:
            return jsonify(response.data[0])
        return jsonify({'error': 'Slide not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/gallery-slides/<int:slide_id>', methods=['PUT'])
def update_gallery_slide(slide_id):
    try:
        data = request.json
        print(f"Updating gallery slide {slide_id} with data: {data}")
        
        response = supabase.table('gallery_slides')\
            .update(data)\
            .eq('id', slide_id)\
            .execute()
        
        print(f"Gallery slide updated: {response.data}")
        return jsonify(response.data[0])
    except Exception as e:
        print(f"Error updating gallery slide: {str(e)}")
        import traceback
        traceback.print_exc()
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
        print(f"Received contact message: {data}")
        
        response = supabase.table('contact_messages').insert(data).execute()
        print(f"Saved to database: {response.data}")
        
        # Send email notification
        email_sent = send_contact_email(data)
        print(f"Email sent: {email_sent}")
        
        return jsonify(response.data[0]), 201
    except Exception as e:
        print(f"Error in create_contact_message: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/api/contact-messages/<int:message_id>', methods=['DELETE'])
def delete_contact_message(message_id):
    try:
        supabase.table('contact_messages').delete().eq('id', message_id).execute()
        return jsonify({'success': True})
    except Exception as e:
        print(f"Error deleting contact message: {str(e)}")
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
        print(f"Updating business_info with data: {data}")
        
        # Update each field individually using update instead of upsert
        updates = {}
        for key, value in data.items():
            if value is not None:  # Only update non-null values
                updates[key] = value
        
        if updates:
            response = supabase.table('business_info')\
                .update(updates)\
                .eq('id', 1)\
                .execute()
            print(f"Business info updated: {response.data}")
            
            # Return the updated data
            return jsonify(response.data[0] if response.data else updates)
        else:
            return jsonify({'error': 'No data to update'}), 400
            
    except Exception as e:
        print(f"Error updating business_info: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

# Chatbot Config endpoints
@app.route('/api/chatbot-config', methods=['GET'])
def get_chatbot_config():
    try:
        response = supabase.table('chatbot_config')\
            .select('*')\
            .eq('id', 1)\
            .execute()
        if response.data:
            return jsonify(response.data[0])
        return jsonify({})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/chatbot-config', methods=['POST', 'PUT'])
def update_chatbot_config():
    try:
        data = request.json
        print(f"Updating chatbot_config with data: {data}")
        # Upsert (update or insert)
        response = supabase.table('chatbot_config')\
            .upsert({'id': 1, **data})\
            .execute()
        print(f"Chatbot config updated: {response.data}")
        return jsonify(response.data[0])
    except Exception as e:
        print(f"Error updating chatbot_config: {str(e)}")
        import traceback
        traceback.print_exc()
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
        
        # Get business info from database (dynamically updated by admin)
        try:
            business_info_response = supabase.table('business_info').select('*').eq('id', 1).execute()
            business_info = business_info_response.data[0] if business_info_response.data else {}
        except:
            business_info = {}
        
        # Get chatbot config from database
        try:
            chatbot_config_response = supabase.table('chatbot_config').select('*').eq('id', 1).execute()
            chatbot_config = chatbot_config_response.data[0] if chatbot_config_response.data else {}
        except:
            chatbot_config = {}
        
        # Get business details (database first, fallback to env)
        whatsapp = business_info.get('whatsapp') or business_info.get('phone') or os.getenv('WHATSAPP_NUMBER', '+918431729319')
        whatsapp_clean = whatsapp.replace('+', '').replace(' ', '').replace('-', '')
        address = business_info.get('address') or os.getenv('BUSINESS_ADDRESS', '3rd Cross Rd, Austin Town, Neelasandra, Bengaluru, Karnataka 560047')
        email = business_info.get('email') or os.getenv('EMAIL_ADDRESS', 'info@astrology.com')
        website = business_info.get('website') or os.getenv('WEBSITE_URL', '')
        maps_url = chatbot_config.get('google_maps_url') or os.getenv('GOOGLE_MAPS_URL', 'https://maps.google.com/?q=3rd+Cross+Rd+Austin+Town+Neelasandra+Bengaluru+560047')
        review_url = chatbot_config.get('google_review_url') or os.getenv('GOOGLE_REVIEW_URL', 'https://maps.app.goo.gl/rPo3UXPy65DBbsVz8')
        hours_weekday = business_info.get('hours_weekday') or chatbot_config.get('hours_weekday') or os.getenv('HOURS_WEEKDAY', '9:00 AM - 8:00 PM')
        hours_sunday = business_info.get('hours_sunday') or chatbot_config.get('hours_sunday') or os.getenv('HOURS_SUNDAY', '9:00 AM - 2:00 PM')
        facebook = business_info.get('facebook') or chatbot_config.get('facebook') or os.getenv('FACEBOOK_URL', '')
        instagram = business_info.get('instagram') or chatbot_config.get('instagram') or os.getenv('INSTAGRAM_URL', '')
        twitter = business_info.get('twitter') or chatbot_config.get('twitter') or os.getenv('TWITTER_URL', '')
        youtube = business_info.get('youtube') or chatbot_config.get('youtube') or os.getenv('YOUTUBE_URL', '')
        linkedin = chatbot_config.get('linkedin') or os.getenv('LINKEDIN_URL', '')
        services_list = chatbot_config.get('services') or 'Kundali Analysis, Tarot Reading, Career Guidance, Love & Relationships'
        
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
                
                # Get DOB if provided
                dob = booking_data.get('dob', '').strip()
                
                # Save to database
                booking_entry = {
                    'name': name,
                    'phone': phone,
                    'service': service,
                    'message': message,
                    'dob': dob if dob else None,
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
<strong>📧 Email:</strong> {email}<br>
{f'<strong>🌐 Website:</strong> <a href="{website}" target="_blank" style="color: #7C3AED;">{website}</a><br>' if website else ''}
<br><strong>⏰ Best time to call:</strong> {hours_weekday}<br><br>
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
                'keywords': ['social', 'facebook', 'instagram', 'twitter', 'youtube', 'linkedin', 'follow', 'connect online'],
                'response': f'''📱 <strong>Follow Us on Social Media!</strong><br><br>
Stay connected for daily horoscopes, tips, and updates:<br><br>
{f'📘 <a href="{facebook}" target="_blank" style="color: #1877F2; font-weight: bold;">Facebook</a><br>' if facebook else ''}
{f'📸 <a href="{instagram}" target="_blank" style="color: #E4405F; font-weight: bold;">Instagram</a><br>' if instagram else ''}
{f'🐦 <a href="{twitter}" target="_blank" style="color: #1DA1F2; font-weight: bold;">Twitter</a><br>' if twitter else ''}
{f'🎥 <a href="{youtube}" target="_blank" style="color: #FF0000; font-weight: bold;">YouTube</a><br>' if youtube else ''}
{f'💼 <a href="{linkedin}" target="_blank" style="color: #0A66C2; font-weight: bold;">LinkedIn</a><br>' if linkedin else ''}
<br><em>💫 Join our community of 10,000+ followers!</em>'''
            },
            'chat': {
                'keywords': ['chat', 'talk', 'conversation', 'speak', 'discuss'],
                'response': '''💬 <strong>Let's Chat!</strong><br><br>
I'm here to answer any questions about astrology and our services.<br><br>
<strong>You can ask me about:</strong><br>
• What services we offer<br>
• Our pricing and packages<br>
• How astrology works<br>
• Birth chart readings<br>
• Compatibility analysis<br>
• Career or relationship guidance<br>
• Or anything else! 😊<br><br>
<em>Type your question and I'll do my best to help! ✨</em>'''
            },
            'qa': {
                'keywords': ['what is astrology', 'how does', 'why should', 'benefits', 'accurate', 'works', 'question', 'faq', 'qa', 'zodiac', 'horoscope', 'birth chart', 'rashi', 'nakshatra', 'dosha', 'mangal', 'kundali', 'dasha', 'moon sign', 'sun sign', 'saturn', 'jupiter', 'venus', 'mercury', 'rahu', 'ketu'],
                'response': f'''❓ <strong>Frequently Asked Questions (English & ಕನ್ನಡ):</strong><br><br>

<strong>📚 GENERAL QUESTIONS:</strong><br><br>

<strong>Q: What is astrology? / ಜ್ಯೋತಿಷ್ಯ ಎಂದರೆ ಏನು?</strong><br>
A: Astrology is the study of how planetary positions influence human personality and events. / ಗ್ರಹ–ನಕ್ಷತ್ರಗಳ ಸ್ಥಾನವು ಜೀವನದ ಮೇಲೆ ಹೇಗೆ ಪರಿಣಾಮ ಬೀರುತ್ತದೆ ಎಂದು ಅಧ್ಯಯನ ಮಾಡುವ ವಿಜ್ಞಾನ.<br><br>

<strong>Q: How do I know my zodiac sign? / ನನ್ನ ರಾಶಿ ಹೇಗೆ ಗೊತ್ತಾಗುತ್ತದೆ?</strong><br>
A: Your zodiac sign is based on your date of birth. / ನಿಮ್ಮ ಜನ್ಮದಿನದ ಮೇಲೆ ಆಧಾರಿತವಾಗಿ ರಾಶಿ ನಿರ್ಧರಿಸಲಾಗುತ್ತದೆ.<br><br>

<strong>Q: What are the 12 zodiac signs? / ರಾಶಿಚಕ್ರದಲ್ಲಿ ಎಷ್ಟು ರಾಶಿಗಳು ಇವೆ?</strong><br>
A: Aries, Taurus, Gemini, Cancer, Leo, Virgo, Libra, Scorpio, Sagittarius, Capricorn, Aquarius, Pisces. / ಮೇಷ, ವೃಷಭ, ಮಿಥುನ, ಕಟಕ, ಸಿಂಹ, ಕನ್ಯಾ, ತುಲಾ, ವೃಶ್ಚಿಕ, ಧನು, ಮಕರ, ಕುಂಭ, ಮೀನ.<br><br>

<strong>Q: What is a horoscope?</strong><br>
A: A horoscope is a prediction based on the position of stars and planets for a specific time.<br><br>

<strong>Q: Can astrology predict the future?</strong><br>
A: Astrology can give guidance and possibilities, not exact predictions.<br><br>

<strong>Q: What is a birth chart? / ಜಾತಕ ಎಂದರೆ ಏನು?</strong><br>
A: A birth chart is a map of the sky at the exact moment you were born. / ಜನನ ಸಮಯದ ಗ್ರಹ–ನಕ್ಷತ್ರಗಳ ನಕ್ಷೆ.<br><br>

<strong>Q: Why is the time of birth important? / ಜನನ ಸಮಯ ಏಕೆ ಮುಖ್ಯ?</strong><br>
A: Birth time helps determine your ascendant (lagna) and exact planetary positions. / ಜನನ ಸಮಯದಿಂದ ಲಗ್ನ ಮತ್ತು ನಕ್ಷತ್ರ ಬದಲಾಗುತ್ತದೆ.<br><br>

<strong>Q: What is a Lagna (Ascendant)? / ಲಗ್ನ ಎಂದರೆ ಏನು?</strong><br>
A: It is the zodiac rising on the eastern horizon when you were born. / ನಿಮ್ಮ ಜನನ ಕ್ಷಣದಲ್ಲಿ ಪೂರ್ವ ದಿಕ್ಕಿನಲ್ಲಿ ಉದಯಿಸಿದ್ದ ರಾಶಿ.<br><br>

<strong>Q: What is a Rashi?</strong><br>
A: Rashi is your moon sign—based on where the Moon was during your birth.<br><br>

<strong>Q: Which is more important, sun sign or moon sign?</strong><br>
A: Moon sign shows your mind and emotions; sun sign shows basic personality.<br><br>

<strong>📜 SPECIFIC TOPICS:</strong><br><br>

<strong>Q: Can astrology tell about marriage? / ವಿವಾಹ ಬಗ್ಗೆ ತಿಳಿಯಬಹುದಾ?</strong><br>
A: Yes, planetary positions like Venus, Jupiter, and 7th house indicate marriage life.<br><br>

<strong>Q: Can astrology help with career choices?</strong><br>
A: Yes, the 10th house and planets like Saturn, Jupiter, and Sun give career insights.<br><br>

<strong>Q: What is a Nakshatra? / ನಕ್ಷತ್ರ ಎಂದರೇನು?</strong><br>
A: Nakshatra is a lunar mansion—there are 27 nakshatras based on moon's position.<br><br>

<strong>Q: What is a Dosha?</strong><br>
A: Dosha means imbalance or planetary defect in the horoscope (e.g., Mangal Dosha).<br><br>

<strong>Q: What is Mangal Dosha? / ಮಂಗಳ ದೋಷ ಎಂದರೆ ಏನು?</strong><br>
A: When Mars is placed in certain houses, it may affect marriage compatibility. / ಮಂಗಳ ಗ್ರಹದ ವಿಶೇಷ ಸ್ಥಾನದಿಂದ ಉಂಟಾಗುವ ವಿವಾಹ ಸಂಬಂಧಿ ದೋಷ.<br><br>

<strong>Q: Can astrology tell about health? / ಆರೋಗ್ಯ ತಿಳಿಯಬಹುದಾ?</strong><br>
A: Yes, the 1st, 6th, and 8th houses give health-related indications. / ಹೌದು, 1, 6 ಮತ್ತು 8ನೇ ಭಾವಗಳು ಆರೋಗ್ಯ ಸೂಚಿಸುತ್ತವೆ.<br><br>

<strong>Q: What is gemstone recommendation? / ರತ್ನ ಧಾರಣೆ ಏಕೆ?</strong><br>
A: Certain gemstones are suggested to strengthen weak planets. / ದುರ್ಬಲ ಗ್ರಹವನ್ನು ಬಲಪಡಿಸಲು.<br><br>

<strong>Q: What is a Dasha? / ದಶಾ ಎಂದರೆ ಏನು?</strong><br>
A: Dasha is a planetary period that influences your life for a certain duration. / ಪ್ರತಿ ಗ್ರಹ ನೀಡುವ ಕಾಲಪರಿಣಾಮ.<br><br>

<strong>Q: Does astrology match kundli for marriage? / ಕುಂಡಲಿ ಮ್ಯಾಚಿಂಗ್ ಮುಖ್ಯವಾ?</strong><br>
A: Yes, kundli matching checks compatibility of partners based on planetary positions. / ಹೌದು, ವಿವಾಹ ಹೊಂದಾಣಿಕೆಗಾಗಿ ಅತ್ಯಂತ ಮುಖ್ಯ.<br><br>

<strong>Q: Can astrology change my destiny?</strong><br>
A: Astrology guides you; remedies can help reduce negative effects, but actions matter most.<br><br>

<strong>🌟 PLANETS & HOUSES:</strong><br><br>

<strong>Q: What is the Moon sign?</strong><br>
A: It shows your emotions, mind, and inner nature.<br><br>

<strong>Q: What is the Sun sign?</strong><br>
A: It represents your core personality and ego.<br><br>

<strong>Q: What are houses in astrology?</strong><br>
A: The birth chart is divided into 12 houses representing life areas like health, career, marriage, etc.<br><br>

<strong>Q: What is retrograde?</strong><br>
A: When a planet appears to move backward, affecting its energy.<br><br>

<strong>Q: Does Mercury retrograde cause problems?</strong><br>
A: It can affect communication, travel, and decision-making.<br><br>

<strong>Q: What is Rahu and Ketu?</strong><br>
A: They are shadow planets that influence karma and past-life effects.<br><br>

<strong>Q: What does Saturn represent?</strong><br>
A: Discipline, hard work, patience, and karmic lessons.<br><br>

<strong>Q: What is Shani Sade Sati?</strong><br>
A: A 7.5-year period when Saturn moves around your moon sign.<br><br>

<strong>Q: Which planet affects education?</strong><br>
A: Mercury and Jupiter play key roles.<br><br>

<strong>Q: Which planet is responsible for love? / ಪ್ರೀತಿಗೆ ಯಾವ ಗ್ರಹ?</strong><br>
A: Venus represents love and attraction. / ಶುಕ್ರ ಗ್ರಹ – ಪ್ರೀತಿ, ಸೌಂದರ್ಯ, ವಿವಾಹ, ಐಶ್ವರ್ಯ.<br><br>

<strong>Q: What is Jupiter's importance? / ಗುರುಗ್ರಹದ ಮಹತ್ವ ಏನು?</strong><br>
A: Knowledge, fortune, marriage, and wealth. / ಜ್ಞಾನ, ಭಾಗ್ಯ, ವಿವಾಹ ಮತ್ತು ಹಣದ ಗ್ರಹ.<br><br>

<strong>💼 PRACTICAL QUESTIONS:</strong><br><br>

<strong>Q: Can astrology help with financial problems?</strong><br>
A: Yes, planets like Jupiter and Mercury show financial strength.<br><br>

<strong>Q: Can gemstones remove all doshas?</strong><br>
A: Not all, but they reduce negative effects.<br><br>

<strong>Q: What is vastu in astrology? / ವಾಸ್ತು ದೋಷ ಎಂದರೆ?</strong><br>
A: A system that guides home direction and energy flow. / ಮನೆಯ ದಿಕ್ಕು ಹಾಗೂ ನಿರ್ಮಾಣದಿಂದ ಉಂಟಾಗುವ ನಕಾರಾತ್ಮಕ ಪರಿಣಾಮ.<br><br>

<strong>Q: Can astrology tell about children?</strong><br>
A: Yes, the 5th house and Jupiter indicate childbirth.<br><br>

<strong>Q: How accurate is Kundli matching?</strong><br>
A: Very accurate when done properly with all factors.<br><br>

<strong>Q: What is KP astrology?</strong><br>
A: A modern prediction system based on stellar positions.<br><br>

<strong>Q: Is astrology 100% accurate? / ಜ್ಯೋತಿಷ್ಯ ಪಕ್ಕಾ ಸರಿ ಆಗುತ್ತದೆಯಾ?</strong><br>
A: Not 100%, but provides guidance. / 100% ಅಲ್ಲ, ಆದರೆ ಮಾರ್ಗದರ್ಶನ ನೀಡುತ್ತದೆ.<br><br>

<strong>📋 OUR SERVICES:</strong><br><br>

<strong>Q: What do I need for a reading?</strong><br>
A: Birth date, exact time, and place of birth are essential for accurate predictions.<br><br>

<strong>Q: How long is a consultation?</strong><br>
A: Sessions typically last 30-60 minutes depending on the service selected.<br><br>

<strong>Q: Do you offer online consultations?</strong><br>
A: Yes! We offer both in-person and online consultations via video call.<br><br>

<strong>Q: What's the cost of a consultation?</strong><br>
A: Prices vary by service type. <a href="https://wa.me/{whatsapp_clean}" target="_blank" style="color: #7C3AED;">Contact us</a> for detailed pricing.<br><br>

<strong>Q: How do I book an appointment?</strong><br>
A: You can book via WhatsApp, our website form, or by calling us directly.<br><br>

<strong>Q: Is my information confidential?</strong><br>
A: Absolutely! All consultations and personal information are strictly confidential.<br><br>

<em>💬 Have more questions? Just ask me in English or ಕನ್ನಡ! ✨</em>'''
            },
            'help': {
                'keywords': ['help', 'hi', 'hello', 'hey', 'start', 'menu', 'options', 'namaste', 'namaskar', 'good morning', 'good afternoon', 'good evening', 'greetings'],
                'response': f'''🙏 <strong>Namaste! Welcome to our Astrology Services</strong><br><br>
I'm your virtual assistant, here to guide you! 🌟<br><br>
<strong>How can I help you today?</strong><br><br>
💫 <strong>Services</strong> - Explore our astrology offerings<br>
⏰ <strong>Hours</strong> - Check our availability<br>
📍 <strong>Location</strong> - Find our office & directions<br>
📞 <strong>Contact</strong> - Get in touch with us<br>
📅 <strong>Booking</strong> - Schedule your consultation<br>
📱 <strong>Social</strong> - Follow us on social media<br>
❓ <strong>FAQ</strong> - Astrology questions answered<br>
⭐ <strong>Review</strong> - Share your experience<br><br>
<em>Just type your question in English or ಕನ್ನಡ! 😊</em>'''
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
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Save to local static folder as fallback
        import os
        from werkzeug.utils import secure_filename
        
        filename = secure_filename(file.filename)
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        unique_filename = f"{timestamp}_{filename}"
        
        # Create uploads directory if it doesn't exist
        upload_folder = os.path.join('static', 'uploads')
        os.makedirs(upload_folder, exist_ok=True)
        
        file_path = os.path.join(upload_folder, unique_filename)
        file.save(file_path)
        
        # Return URL relative to website root
        public_url = f"/static/uploads/{unique_filename}"
        
        print(f"File uploaded successfully: {public_url}")
        
        return jsonify({
            'success': True,
            'url': public_url,
            'path': file_path
        })
        
    except Exception as e:
        print(f"Upload error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

# Helper Functions
def send_booking_email(booking_data):
    """Send email notification for new booking"""
    try:
        email_address = os.getenv('EMAIL_ADDRESS')
        email_password = os.getenv('EMAIL_PASSWORD')
        admin_email = os.getenv('ADMIN_EMAIL', 'omkargouda1204@gmail.com')
        
        if not email_address or not email_password:
            print("Email credentials not configured")
            return False
        
        msg = MIMEMultipart('alternative')
        msg['Subject'] = f"New Booking: {booking_data.get('service', 'Service')}"
        msg['From'] = email_address
        msg['To'] = admin_email
        
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
        
        print(f"✅ Booking email sent successfully for {booking_data.get('name')}")
        print(f"📧 Email sent to: {admin_email}")
        return True
        
    except Exception as e:
        print(f"❌ Error sending booking email: {str(e)}")
        print(f"📧 Email config - ADDRESS: {email_address}, HAS_PASSWORD: {bool(email_password)}")
        import traceback
        traceback.print_exc()
        return False

def send_contact_email(contact_data):
    """Send email notification for new contact message"""
    try:
        email_address = os.getenv('EMAIL_ADDRESS')
        email_password = os.getenv('EMAIL_PASSWORD')
        admin_email = os.getenv('ADMIN_EMAIL', 'omkargouda1204@gmail.com')
        
        if not email_address or not email_password:
            print("Email credentials not configured")
            return False
        
        msg = MIMEMultipart('alternative')
        msg['Subject'] = f"New Contact Message from {contact_data.get('name', 'Unknown')}"
        msg['From'] = email_address
        msg['To'] = admin_email
        
        html = f"""
        <html>
        <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
            <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; border: 2px solid #667eea;">
                <h2 style="color: #667eea; text-align: center;">📧 New Contact Message</h2>
                <div style="margin: 20px 0; padding: 20px; background: #f8f9ff; border-radius: 8px;">
                    <p><strong>Name:</strong> {contact_data.get('name')}</p>
                    <p><strong>Phone:</strong> {contact_data.get('phone')}</p>
                    <p><strong>Email:</strong> {contact_data.get('email', 'N/A')}</p>
                    <p><strong>Message:</strong></p>
                    <p style="background: white; padding: 15px; border-radius: 5px; white-space: pre-wrap;">{contact_data.get('message', 'N/A')}</p>
                    <p><strong>Received:</strong> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
                </div>
                <p style="color: #666; font-size: 12px; text-align: center; margin-top: 20px;">
                    This message was submitted through your contact form
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
        
        print(f"✅ Contact email sent successfully from {contact_data.get('name')}")
        print(f"📧 Email sent to: {admin_email}")
        return True
        
    except Exception as e:
        print(f"❌ Error sending contact email: {str(e)}")
        print(f"📧 Email config - ADDRESS: {email_address}, HAS_PASSWORD: {bool(email_password)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
