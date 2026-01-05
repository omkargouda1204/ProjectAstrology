const express = require('express');
const router = express.Router();
const { supabase } = require('../config/database');
const nodemailer = require('nodemailer');

// Email transporter configuration
const createTransporter = () => {
    return nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: process.env.EMAIL_PORT || 587,
        secure: false,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
        }
    });
};

// ========================================
// BOOKINGS
// ========================================

// Get all bookings
router.get('/bookings', async (req, res) => {
    try {
        if (!supabase) {
            console.warn('⚠️ Supabase not configured for bookings');
            return res.json([]);
        }
        const { data, error } = await supabase
            .from('bookings')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        res.json(data || []);
    } catch (error) {
        console.error('Error fetching bookings:', error);
        res.status(500).json({ error: error.message });
    }
});

// Create new booking
router.post('/bookings', async (req, res) => {
    try {
        const { name, email, phone, service, message, booking_date, dob, birth_time, birth_place } = req.body;

        // Validate required fields
        if (!name || !phone || !service) {
            return res.status(400).json({ error: 'Missing required fields: name, phone, and service are required' });
        }

        // Insert booking into database
        const insertData = { 
            name, 
            email: email || null,
            phone, 
            service, 
            message: message || null,
            booking_date: booking_date || null,
            dob: dob || null,
            booking_time: birth_time || null,
            notes: birth_place ? `Birth Place: ${birth_place}` : null,
            status: 'pending' 
        };
        
        const { data, error } = await supabase
            .from('bookings')
            .insert([insertData])
            .select();
        
        if (error) {
            console.error('Error creating booking:', error);
            throw error;
        }
        const booking = data[0];

        // Send confirmation email to customer
        try {
            const transporter = createTransporter();
            
            await transporter.sendMail({
                from: process.env.EMAIL_FROM || 'noreply@astrology.com',
                to: email,
                subject: 'Booking Confirmation - Astrology Services',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                            <h1 style="color: white; margin: 0;">🌙 Booking Confirmed</h1>
                        </div>
                        <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
                            <p style="font-size: 16px; color: #374151;">Dear <strong>${name}</strong>,</p>
                            <p style="font-size: 16px; color: #374151;">Thank you for booking with us. We have received your booking request and will contact you shortly.</p>
                            
                            <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
                                <h3 style="margin-top: 0; color: #667eea;">📋 Booking Details</h3>
                                <p style="margin: 10px 0; color: #4b5563;"><strong>Service:</strong> ${service}</p>
                                <p style="margin: 10px 0; color: #4b5563;"><strong>Phone:</strong> ${phone}</p>
                                ${booking_date ? `<p style="margin: 10px 0; color: #4b5563;"><strong>Preferred Date:</strong> ${new Date(booking_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>` : ''}
                                ${dob ? `<p style="margin: 10px 0; color: #4b5563;"><strong>Date of Birth:</strong> ${new Date(dob).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>` : ''}
                                ${birth_time ? `<p style="margin: 10px 0; color: #4b5563;"><strong>Time of Birth:</strong> ${birth_time}</p>` : ''}
                                ${birth_place ? `<p style="margin: 10px 0; color: #4b5563;"><strong>Place of Birth:</strong> ${birth_place}</p>` : ''}
                                ${message ? `<p style="margin: 10px 0; color: #4b5563;"><strong>Message:</strong> ${message}</p>` : ''}
                            </div>
                            
                            <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">We will contact you shortly to confirm your appointment details.</p>
                            <p style="font-size: 14px; color: #6b7280;">If you have any questions, please don't hesitate to contact us.</p>
                            
                            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                                <p style="font-size: 14px; color: #9ca3af; margin: 0;">Best regards,</p>
                                <p style="font-size: 14px; color: #667eea; font-weight: bold; margin: 5px 0 0 0;">Astrology Services Team</p>
                            </div>
                        </div>
                    </div>
                `
            });

            // Send notification to admin
            if (process.env.BOOKING_NOTIFICATION_EMAIL) {
                await transporter.sendMail({
                    from: process.env.EMAIL_FROM || 'noreply@astrology.com',
                    to: process.env.BOOKING_NOTIFICATION_EMAIL,
                    subject: `📥 New Booking: ${service}`,
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                            <div style="background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                                <h1 style="color: white; margin: 0;">🔔 New Booking Alert</h1>
                            </div>
                            <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
                                <p style="font-size: 16px; color: #374151; font-weight: bold;">You have received a new booking request!</p>
                                
                                <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
                                    <h3 style="margin-top: 0; color: #f59e0b;">👤 Customer Details</h3>
                                    <p style="margin: 10px 0; color: #4b5563;"><strong>Name:</strong> ${name}</p>
                                    <p style="margin: 10px 0; color: #4b5563;"><strong>Phone:</strong> <a href="tel:${phone}" style="color: #667eea;">${phone}</a></p>
                                    ${email ? `<p style="margin: 10px 0; color: #4b5563;"><strong>Email:</strong> <a href="mailto:${email}" style="color: #667eea;">${email}</a></p>` : ''}
                                </div>
                                
                                <div style="background: #e0e7ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
                                    <h3 style="margin-top: 0; color: #667eea;">📋 Booking Information</h3>
                                    <p style="margin: 10px 0; color: #4b5563;"><strong>Service:</strong> ${service}</p>
                                    ${booking_date ? `<p style="margin: 10px 0; color: #4b5563;"><strong>Preferred Date:</strong> ${new Date(booking_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>` : ''}
                                    ${dob ? `<p style="margin: 10px 0; color: #4b5563;"><strong>Date of Birth:</strong> ${new Date(dob).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>` : ''}
                                    ${birth_time ? `<p style="margin: 10px 0; color: #4b5563;"><strong>Time of Birth:</strong> ${birth_time}</p>` : ''}
                                    ${birth_place ? `<p style="margin: 10px 0; color: #4b5563;"><strong>Place of Birth:</strong> ${birth_place}</p>` : ''}
                                    ${message ? `<p style="margin: 10px 0; color: #4b5563;"><strong>Message:</strong> ${message}</p>` : '<p style="margin: 10px 0; color: #9ca3af; font-style: italic;">No message provided</p>'}
                                    <p style="margin: 10px 0; color: #4b5563;"><strong>Booking ID:</strong> #${booking.id}</p>
                                </div>
                                
                                <div style="margin-top: 30px; padding: 20px; background: #dcfce7; border-radius: 8px;">
                                    <p style="font-size: 14px; color: #166534; margin: 0; text-align: center;">
                                        <strong>👉 Action Required:</strong> Please contact the customer to confirm their appointment.
                                    </p>
                                </div>
                                
                                <div style="margin-top: 20px; text-align: center;">
                                    <a href="http://localhost:3000/admin" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block; font-weight: bold;">
                                        View in Admin Dashboard
                                    </a>
                                </div>
                            </div>
                        </div>
                    `
                });
            }
        } catch (emailError) {
            console.error('Error sending email:', emailError);
            // Don't fail the booking if email fails
        }

        res.json({
            success: true,
            message: 'Booking created successfully',
            data: booking
        });
    } catch (error) {
        console.error('Error creating booking:', error);
        res.status(500).json({ error: 'Failed to create booking' });
    }
});

// Update booking status
router.put('/bookings/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const { data, error } = await supabase
            .from('bookings')
            .update({ status, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select();
        
        if (error) throw error;
        res.json({ success: true, data: data[0] });
    } catch (error) {
        console.error('Error updating booking:', error);
        res.status(500).json({ error: 'Failed to update booking' });
    }
});

// Delete booking
router.delete('/bookings/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { error } = await supabase.from('bookings').delete().eq('id', id);
        if (error) throw error;
        res.json({ success: true, message: 'Booking deleted' });
    } catch (error) {
        console.error('Error deleting booking:', error);
        res.status(500).json({ error: 'Failed to delete booking' });
    }
});

// ========================================
// CONTACT MESSAGES
// ========================================

// Get all contact messages
router.get('/contact-messages', async (req, res) => {
    try {
        if (!supabase) {
            console.warn('⚠️ Supabase not configured for contact-messages');
            return res.json([]);
        }
        const { data, error } = await supabase
            .from('contact_messages')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        res.json(data || []);
    } catch (error) {
        console.error('Error fetching contact messages:', error);
        res.status(500).json({ error: 'Failed to fetch contact messages' });
    }
});

// Create new contact message
router.post('/contact-messages', async (req, res) => {
    try {
        const { name, email, phone, subject, message } = req.body;

        // Validate required fields
        if (!name || !email || !message) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Insert message into database (subject is optional, so we handle it dynamically)
        const insertData = { name, email, phone, message };
        if (subject) insertData.subject = subject;
        
        const { data, error } = await supabase
            .from('contact_messages')
            .insert([insertData])
            .select();
        
        if (error) throw error;
        const contactMessage = data[0];

        // Send emails
        try {
            const transporter = createTransporter();
            
            // Send confirmation to customer
            await transporter.sendMail({
                from: process.env.EMAIL_FROM,
                to: email,
                subject: 'Message Received - Cosmic Astrology',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #7C3AED;">Thank You for Contacting Us</h2>
                        <p>Dear ${name},</p>
                        <p>We have received your message and will get back to you as soon as possible.</p>
                        
                        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <h3 style="margin-top: 0;">Your Message:</h3>
                            ${subject ? `<p><strong>Subject:</strong> ${subject}</p>` : ''}
                            <p>${message}</p>
                        </div>
                        
                        <p>Best regards,<br>Cosmic Astrology Team</p>
                    </div>
                `
            });

            // Send notification to admin
            if (process.env.CONTACT_NOTIFICATION_EMAIL) {
                await transporter.sendMail({
                    from: process.env.EMAIL_FROM,
                    to: process.env.CONTACT_NOTIFICATION_EMAIL,
                    subject: `New Contact Message: ${subject || 'No Subject'}`,
                    html: `
                        <div style="font-family: Arial, sans-serif;">
                            <h2>New Contact Message</h2>
                            <p><strong>Name:</strong> ${name}</p>
                            <p><strong>Email:</strong> ${email}</p>
                            <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
                            ${subject ? `<p><strong>Subject:</strong> ${subject}</p>` : ''}
                            <p><strong>Message:</strong></p>
                            <p>${message}</p>
                            <p><strong>Message ID:</strong> ${contactMessage.id}</p>
                        </div>
                    `
                });
            }
        } catch (emailError) {
            console.error('Error sending email:', emailError);
            // Don't fail the message submission if email fails
        }

        res.json({
            success: true,
            message: 'Message sent successfully',
            data: contactMessage
        });
    } catch (error) {
        console.error('Error creating contact message:', error);
        res.status(500).json({ error: 'Failed to send message' });
    }
});

// Mark message as read
router.put('/contact-messages/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { is_read } = req.body;

        const { data, error } = await supabase
            .from('contact_messages')
            .update({ is_read, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select();
        
        if (error) throw error;
        res.json({ success: true, data: data[0] });
    } catch (error) {
        console.error('Error updating contact message:', error);
        res.status(500).json({ error: 'Failed to update contact message' });
    }
});

// Delete contact message
router.delete('/contact-messages/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { error } = await supabase.from('contact_messages').delete().eq('id', id);
        if (error) throw error;
        res.json({ success: true, message: 'Contact message deleted' });
    } catch (error) {
        console.error('Error deleting contact message:', error);
        res.status(500).json({ error: 'Failed to delete contact message' });
    }
});

module.exports = router;
