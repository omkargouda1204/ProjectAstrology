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
        const { name, email, phone, date_of_birth, service, message } = req.body;

        // Validate required fields
        if (!name || !email || !service) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Insert booking into database (date_of_birth is optional)
        const insertData = { name, email, phone, service, message, status: 'pending' };
        if (date_of_birth) insertData.date_of_birth = date_of_birth;
        
        const { data, error } = await supabase
            .from('bookings')
            .insert([insertData])
            .select();
        
        if (error) throw error;
        const booking = data[0];

        // Send confirmation email to customer
        try {
            const transporter = createTransporter();
            
            await transporter.sendMail({
                from: process.env.EMAIL_FROM,
                to: email,
                subject: 'Booking Confirmation - Cosmic Astrology',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #7C3AED;">Booking Confirmation</h2>
                        <p>Dear ${name},</p>
                        <p>Thank you for booking with Cosmic Astrology. We have received your booking request.</p>
                        
                        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <h3 style="margin-top: 0;">Booking Details:</h3>
                            <p><strong>Service:</strong> ${service}</p>
                            ${date_of_birth ? `<p><strong>Date of Birth:</strong> ${date_of_birth}</p>` : ''}
                            <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
                            ${message ? `<p><strong>Message:</strong> ${message}</p>` : ''}
                        </div>
                        
                        <p>We will contact you shortly to confirm your appointment.</p>
                        <p>If you have any questions, please don't hesitate to contact us.</p>
                        
                        <p>Best regards,<br>Cosmic Astrology Team</p>
                    </div>
                `
            });

            // Send notification to admin
            if (process.env.BOOKING_NOTIFICATION_EMAIL) {
                await transporter.sendMail({
                    from: process.env.EMAIL_FROM,
                    to: process.env.BOOKING_NOTIFICATION_EMAIL,
                    subject: 'New Booking Received',
                    html: `
                        <div style="font-family: Arial, sans-serif;">
                            <h2>New Booking Received</h2>
                            <p><strong>Name:</strong> ${name}</p>
                            <p><strong>Email:</strong> ${email}</p>
                            <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
                            <p><strong>Service:</strong> ${service}</p>
                            ${date_of_birth ? `<p><strong>Date of Birth:</strong> ${date_of_birth}</p>` : ''}
                            ${message ? `<p><strong>Message:</strong> ${message}</p>` : ''}
                            <p><strong>Booking ID:</strong> ${booking.id}</p>
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
