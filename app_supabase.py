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
        response = supabase.table('hero_slides')\
            .select('*')\
            .eq('is_active', True)\
            .order('display_order')\
            .execute()
        return jsonify(response.data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

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
        response = supabase.table('gallery_slides')\
            .select('*')\
            .eq('is_active', True)\
            .order('display_order')\
            .execute()
        return jsonify(response.data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

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
        
        # Validation
        if not data.get('name') or not data.get('phone'):
            return jsonify({'error': 'Name and phone are required'}), 400
        
        # Validate DOB (not in future)
        if data.get('dob'):
            dob = datetime.strptime(data['dob'], '%Y-%m-%d')
            if dob > datetime.now():
                return jsonify({'error': 'Date of birth cannot be in the future'}), 400
        
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
        
        # Simple rule-based responses
        responses = {
            'services': {
                'keywords': ['service', 'services', 'offer', 'what do you do'],
                'response': '''🌟 **Our Services:**

• 🎴 **Kundali Reading** - Detailed birth chart analysis
• 🃏 **Tarot Reading** - Mystical card readings
• 💼 **Career Guidance** - Professional path guidance
• 💕 **Love & Relationships** - Romantic harmony
• 🏥 **Health Astrology** - Wellness guidance
• 💰 **Financial Forecast** - Money matters
• 🏠 **Vastu Consultation** - Space harmonization
• 💎 **Gemstone Therapy** - Crystal power

Would you like to book a consultation?'''
            },
            'hours': {
                'keywords': ['hours', 'timing', 'time', 'when open', 'schedule'],
                'response': f'''⏰ **Business Hours:**

**Monday - Saturday:** {os.getenv('HOURS_WEEKDAY', '9:00 AM - 8:00 PM')}
**Sunday:** {os.getenv('HOURS_SUNDAY', '10:00 AM - 6:00 PM')}

Walk-ins welcome, but appointments recommended!'''
            },
            'location': {
                'keywords': ['location', 'address', 'where', 'direction', 'reach'],
                'response': f'''📍 **Visit Us:**

{os.getenv('BUSINESS_ADDRESS', '3rd Cross Rd, Austin Town, Neelasandra, Bengaluru, Karnataka 560047')}

[Get Directions]({os.getenv('GOOGLE_MAPS_URL', '#')})'''
            },
            'contact': {
                'keywords': ['contact', 'phone', 'call', 'whatsapp'],
                'response': f'''📞 **Contact Us:**

**Phone/WhatsApp:** {os.getenv('WHATSAPP_NUMBER', '+91 8431729319')}
**Email:** {os.getenv('EMAIL_ADDRESS', 'info@cosmicastrology.com')}

Best time to call: {os.getenv('HOURS_WEEKDAY', '9 AM - 8 PM')} (Mon-Sat)'''
            },
            'pricing': {
                'keywords': ['price', 'cost', 'fee', 'charge', 'payment', 'how much'],
                'response': '''💰 **Consultation Fees:**

• Kundali Reading: ₹500-800
• Tarot Reading: ₹300-600
• Career Guidance: ₹1000-1500
• Vastu Consultation: ₹2000-3000
• Gemstone Recommendation: ₹500
• Comprehensive Analysis: ₹1500-3000

Book now for exact pricing!'''
            },
            'booking': {
                'keywords': ['book', 'appointment', 'schedule', 'consultation'],
                'response': '''📅 **Book a Consultation:**

I can help you book an appointment! Please provide:
1. Your Name
2. Phone Number
3. Preferred Service
4. Date of Birth (for accurate reading)

Or click the "Book Now" button to fill the form!'''
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
        bucket = request.form.get('bucket', 'astrology')
        
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
