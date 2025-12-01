const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { supabase } = require('../config/database');

// Admin login endpoint
router.post('/admin/login', async (req, res) => {
    try {
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({ error: 'Password is required' });
        }

        // Get password from admin_credentials table or fallback to env variable
        let { data: adminData, error: fetchError } = await supabase
            .from('admin_credentials')
            .select('password')
            .single();

        let adminPassword = adminData?.password || process.env.ADMIN_PASSWORD;

        // If ADMIN_PASSWORD not set, fall back to a default for local development
        if (!adminPassword) {
            adminPassword = 'admin123';
            console.warn('Warning: ADMIN_PASSWORD not set. Falling back to default password for local development.');
        }

        // Simple password comparison (you can use bcrypt for hashed passwords)
        if (password === adminPassword) {
            return res.json({
                success: true,
                message: 'Login successful'
            });
        } else {
            return res.status(401).json({
                success: false,
                error: 'Invalid password'
            });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Admin password change endpoint
router.post('/admin/change-password', async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ 
                success: false, 
                message: 'Current password and new password are required' 
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ 
                success: false, 
                message: 'New password must be at least 6 characters long' 
            });
        }

        // Get current password from admin_credentials table or fallback to env variable
        let { data: adminData, error: fetchError } = await supabase
            .from('admin_credentials')
            .select('password')
            .single();

        let storedPassword = adminData?.password || process.env.ADMIN_PASSWORD || 'admin123';

        // Verify current password
        if (currentPassword !== storedPassword) {
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        // Update password in database
        const { data: existingAdmin } = await supabase
            .from('admin_credentials')
            .select('id')
            .limit(1);

        if (existingAdmin && existingAdmin.length > 0) {
            // Update existing record
            const { error: updateError } = await supabase
                .from('admin_credentials')
                .update({ 
                    password: newPassword, 
                    updated_at: new Date().toISOString() 
                })
                .eq('id', existingAdmin[0].id);

            if (updateError) throw updateError;
        } else {
            // Insert new record
            const { error: insertError } = await supabase
                .from('admin_credentials')
                .insert([{ password: newPassword }]);

            if (insertError) throw insertError;
        }

        console.log('Password changed successfully');

        return res.json({
            success: true,
            message: 'Password updated successfully'
        });

    } catch (error) {
        console.error('Password change error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to change password: ' + error.message 
        });
    }
});

module.exports = router;
