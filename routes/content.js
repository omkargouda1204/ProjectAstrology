const express = require('express');
const router = express.Router();
const { supabase } = require('../config/database');

// Middleware to check Supabase connection
const checkSupabase = (req, res, next) => {
    if (!supabase) {
        console.warn('⚠️ Supabase not configured - returning empty data');
        return res.json([]);
    }
    next();
};

// Helper function to delete old image from storage (handles local + supabase URLs)
async function deleteOldImage(imageUrl) {
    if (!imageUrl) return;

    try {
        // Handle local uploads
        if (imageUrl.startsWith('/uploads/') || imageUrl.startsWith('/static/uploads/')) {
            const path = require('path');
            const fs = require('fs');
            const filename = imageUrl.split('/').pop();
            const localPath = path.join(__dirname, '..', 'static', 'uploads', filename);
            if (fs.existsSync(localPath)) {
                fs.unlinkSync(localPath);
                console.log('Deleted local file:', filename);
            }
            return;
        }
        // Only attempt Supabase deletion for absolute URLs
        if (supabase && (imageUrl.startsWith('http://') || imageUrl.startsWith('https://'))) {
            const url = new URL(imageUrl);
            const pathParts = url.pathname.split('/');
            const bucketIndex = pathParts.findIndex(part => part === 'storage');
            if (bucketIndex === -1) return;
            const bucketName = pathParts[bucketIndex + 2];
            const filePath = pathParts.slice(bucketIndex + 4).join('/');
            if (bucketName && filePath) {
                const { error } = await supabase.storage.from(bucketName).remove([filePath]);
                if (error) console.error('Error deleting old image:', error);
                else console.log('Old image deleted successfully:', filePath);
            }
        }
    } catch (error) {
        console.error('Error parsing image URL for deletion:', error);
    }
}

// Helper function for CRUD operations
const crudRoutes = (tableName, routePath) => {
    // GET all
    router.get(`/content/${routePath}`, async (req, res) => {
        try {
            const { data, error } = await supabase.from(tableName).select('*').eq('active', true).order('display_order');
            if (error) throw error;
            res.json(data || []);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // POST create
    router.post(`/content/${routePath}`, async (req, res) => {
        try {
            const { data, error } = await supabase.from(tableName).insert([{ ...req.body, active: true }]).select();
            if (error) throw error;
            res.json({ success: true, data: data[0] });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // PUT update
    router.put(`/content/${routePath}/:id`, async (req, res) => {
        try {
            // Get old image URLs before update (for tables with image fields)
            let oldData = null;
            const imageFields = ['image', 'image_url', 'icon_url', 'video_url'];
            if (['astrological_services', 'pooja_services', 'expert_solutions'].includes(tableName)) {
                const fieldsToSelect = imageFields.filter(field => {
                    // Check which fields exist in the table schema
                    return true; // Select all potential image fields
                }).join(', ');
                const { data: old } = await supabase.from(tableName).select('image_url, icon_url, image').eq('id', req.params.id).single();
                oldData = old;
            }
            
            const { data, error } = await supabase.from(tableName).update({ ...req.body, updated_at: new Date().toISOString() }).eq('id', req.params.id).select();
            if (error) throw error;
            
            // Delete old images if new images are provided and different
            if (oldData) {
                for (const field of imageFields) {
                    if (oldData[field] && req.body[field] && oldData[field] !== req.body[field]) {
                        await deleteOldImage(oldData[field]);
                    }
                }
            }
            
            res.json({ success: true, data: data[0] });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // DELETE
    router.delete(`/content/${routePath}/:id`, async (req, res) => {
        try {
            const { error } = await supabase.from(tableName).delete().eq('id', req.params.id);
            if (error) throw error;
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
};

// Apply CRUD routes for all tables
crudRoutes('hero_slides', 'hero-slides');
crudRoutes('gallery_slides', 'gallery-slides');
crudRoutes('astrological_services', 'astrological-services');
crudRoutes('pooja_services', 'pooja-services');
crudRoutes('expert_solutions', 'expert-solutions');
crudRoutes('menu_items', 'menu-items');
crudRoutes('announcement_bar', 'announcements');
crudRoutes('custom_reviews', 'reviews');

// Single record tables
const singleRecordGet = (tableName, routePath) => {
    router.get(`/content/${routePath}`, async (req, res) => {
        try {
            const { data, error } = await supabase.from(tableName).select('*').limit(1).single();
            if (error && error.code !== 'PGRST116') throw error;
            res.json(data || {});
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    router.post(`/content/${routePath}`, async (req, res) => {
        try {
            const { data: existing } = await supabase.from(tableName).select('id').limit(1);
            let result;
            if (existing && existing.length > 0) {
                result = await supabase.from(tableName).update({ ...req.body, updated_at: new Date().toISOString() }).eq('id', existing[0].id).select();
            } else {
                result = await supabase.from(tableName).insert([req.body]).select();
            }
            if (result.error) throw result.error;
            res.json({ success: true, data: result.data[0] });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
};

singleRecordGet('business_info', 'business-info');
singleRecordGet('about_section', 'about-section');
singleRecordGet('chatbot_config', 'chatbot-config');
singleRecordGet('navbar_settings', 'navbar-settings');

// Additional endpoint aliases (for backward compatibility)
router.get('/hero-slides', async (req, res) => {
    try {
        const { data, error } = await supabase.from('hero_slides').select('*').eq('active', true).order('display_order');
        if (error) throw error;
        res.json(data || []);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/gallery-slides', async (req, res) => {
    try {
        const { data, error } = await supabase.from('gallery_slides').select('*').eq('active', true).order('display_order');
        if (error) throw error;
        res.json(data || []);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/business-info', async (req, res) => {
    try {
        if (!supabase) {
            console.warn('⚠️ Supabase not configured for business-info');
            return res.json({});
        }
        const { data, error } = await supabase.from('business_info').select('*').limit(1).single();
        if (error && error.code !== 'PGRST116') {
            console.error('❌ business-info error:', error.message);
            return res.json({});
        }
        res.json(data || {});
    } catch (error) {
        console.error('❌ business-info exception:', error);
        res.json({});
    }
});

// Brand & Navigation Settings route
router.get('/navbar-settings', async (req, res) => {
    try {
        if (!supabase) {
            console.warn('⚠️ Supabase not configured for navbar-settings');
            return res.json({
                name: 'Astrology Services',
                subtitle1: 'Divine Guidance for Life',
            });
        }
        const { data, error } = await supabase.from('navbar_settings').select('*').limit(1).single();
        let name = data?.business_name || data?.website_name || data?.name || 'Astrology Services';
        let subtitle1 = data?.subtitle1 || data?.website_subtitle || 'Divine Guidance for Life';
        const response = { ...data, name, subtitle1 };
        if (error && error.code !== 'PGRST116') {
            console.error('❌ navbar-settings error:', error.message);
            return res.json(response);
        }
        console.log('✅ navbar-settings loaded:', response);
        res.json(response);
    } catch (error) {
        console.error('❌ navbar-settings exception:', error);
        res.json({
            name: 'Astrology Services',
            subtitle1: 'Divine Guidance for Life',
        });
    }
});

router.get('/chatbot-config', async (req, res) => {
    try {
        const { data, error } = await supabase.from('chatbot_config').select('*').limit(1).single();
        if (error && error.code !== 'PGRST116') throw error;
        res.json(data || {});
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/about-section', async (req, res) => {
    try {
        if (!supabase) {
            console.warn('⚠️ Supabase not configured for about-section');
            return res.json({});
        }
        const { data, error } = await supabase.from('about_section').select('*').limit(1).single();
        if (error && error.code !== 'PGRST116') {
            console.error('❌ about-section error:', error.message);
            return res.json({});
        }
        console.log('✅ about-section loaded:', data);
        res.json(data || {});
    } catch (error) {
        console.error('❌ about-section exception:', error);
        res.json({});
    }
});

router.get('/announcements', async (req, res) => {
    try {
        // For admin, return all announcements (active and inactive)
        // For public, only return active ones
        const activeOnly = req.query.active === 'true';
        let query = supabase.from('announcement_bar').select('*');
        
        if (activeOnly) {
            query = query.eq('active', true);
        }
        
        const { data, error } = await query.order('display_order');
        if (error) throw error;
        res.json(data || []);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/announcements/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ error: 'Invalid announcement ID' });
        }
        
        const { data, error } = await supabase
            .from('announcement_bar')
            .select('*')
            .eq('id', id)
            .single();
            
        if (error) {
            if (error.code === 'PGRST116') {
                return res.status(404).json({ error: 'Announcement not found' });
            }
            throw error;
        }
        
        if (!data) {
            return res.status(404).json({ error: 'Announcement not found' });
        }
        
        res.json(data);
    } catch (error) {
        console.error('Error fetching announcement:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch announcement' });
    }
});

// Add missing service routes
router.get('/astrological-services', async (req, res) => {
    try {
        const { data, error } = await supabase.from('astrological_services').select('*').eq('active', true).order('display_order');
        if (error) throw error;
        res.json(data || []);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/pooja-services', async (req, res) => {
    try {
        const { data, error } = await supabase.from('pooja_services').select('*').eq('active', true).order('display_order');
        if (error) throw error;
        res.json(data || []);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/expert-solutions', async (req, res) => {
    try {
        if (!supabase) {
            console.warn('⚠️ Supabase not configured for expert-solutions');
            return res.json([]);
        }
        const { data, error } = await supabase.from('expert_solutions').select('*').eq('active', true).order('display_order');
        if (error) {
            console.error('❌ expert-solutions error:', error.message);
            return res.json([]);
        }
        res.json(data || []);
    } catch (error) {
        console.error('❌ expert-solutions exception:', error);
        res.json([]);
    }
});

// Add menu-items route (missing alias)
router.get('/menu-items', async (req, res) => {
    try {
        if (!supabase) {
            console.warn('⚠️ Supabase not configured for menu-items');
            return res.json([]);
        }
        const { data, error } = await supabase.from('menu_items').select('*').eq('active', true).order('display_order');
        if (error) {
            console.error('❌ menu-items error:', error.message);
            return res.json([]);
        }
        res.json(data || []);
    } catch (error) {
        console.error('❌ menu-items exception:', error);
        res.json([]);
    }
});

// Add POST, PUT, DELETE for all alias routes
router.post('/hero-slides', async (req, res) => {
    try {
        const { data, error } = await supabase.from('hero_slides').insert([{ ...req.body, active: true }]).select();
        if (error) throw error;
        res.json({ success: true, data: data[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/hero-slides/:id', async (req, res) => {
    try {
        const { data, error } = await supabase.from('hero_slides').select('*').eq('id', req.params.id).single();
        if (error) throw error;
        res.json(data || {});
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/hero-slides/:id', async (req, res) => {
    try {
        // Get old image URL before update
        const { data: oldData } = await supabase.from('hero_slides').select('image').eq('id', req.params.id).single();
        
        const { data, error } = await supabase.from('hero_slides').update({ ...req.body, updated_at: new Date().toISOString() }).eq('id', req.params.id).select();
        if (error) throw error;
        
        // Delete old image if new image is provided and different
        if (oldData && oldData.image && req.body.image && oldData.image !== req.body.image) {
            await deleteOldImage(oldData.image);
        }
        
        res.json({ success: true, data: data[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/hero-slides/:id', async (req, res) => {
    try {
        const { error } = await supabase.from('hero_slides').delete().eq('id', req.params.id);
        if (error) throw error;
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/gallery-slides', async (req, res) => {
    try {
        const { data, error } = await supabase.from('gallery_slides').insert([{ ...req.body, active: true }]).select();
        if (error) throw error;
        res.json({ success: true, data: data[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/gallery-slides/:id', async (req, res) => {
    try {
        const { data, error } = await supabase.from('gallery_slides').select('*').eq('id', req.params.id).single();
        if (error) throw error;
        res.json(data || {});
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/gallery-slides/:id', async (req, res) => {
    try {
        // Get old image URL before update
        const { data: oldData } = await supabase.from('gallery_slides').select('image').eq('id', req.params.id).single();
        
        const { data, error } = await supabase.from('gallery_slides').update({ ...req.body, updated_at: new Date().toISOString() }).eq('id', req.params.id).select();
        if (error) throw error;
        
        // Delete old image if new image is provided and different
        if (oldData && oldData.image && req.body.image && oldData.image !== req.body.image) {
            await deleteOldImage(oldData.image);
        }
        
        res.json({ success: true, data: data[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/gallery-slides/:id', async (req, res) => {
    try {
        const { error } = await supabase.from('gallery_slides').delete().eq('id', req.params.id);
        if (error) throw error;
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/business-info', async (req, res) => {
    try {
        console.log('Saving business info:', req.body);
        const { data: existing } = await supabase.from('business_info').select('id').limit(1);
        let result;
        if (existing && existing.length > 0) {
            console.log('Updating existing business info with ID:', existing[0].id);
            result = await supabase.from('business_info').update({ ...req.body, updated_at: new Date().toISOString() }).eq('id', existing[0].id).select();
        } else {
            console.log('Creating new business info record');
            result = await supabase.from('business_info').insert([{ ...req.body, created_at: new Date().toISOString() }]).select();
        }
        if (result.error) {
            console.error('Supabase error:', result.error);
            throw result.error;
        }
        console.log('Business info saved successfully:', result.data[0]);
        res.json({ success: true, data: result.data[0] });
    } catch (error) {
        console.error('Business info save error:', error);
        res.status(500).json({ error: error.message, details: error });
    }
});

// Brand & Navigation Settings POST route
router.post('/navbar-settings', async (req, res) => {
    try {
        console.log('Saving navbar settings:', req.body);
        const { data: existing } = await supabase.from('navbar_settings').select('id').limit(1);
        let result;
        if (existing && existing.length > 0) {
            console.log('Updating existing navbar settings with ID:', existing[0].id);
            result = await supabase.from('navbar_settings').update({ ...req.body, updated_at: new Date().toISOString() }).eq('id', existing[0].id).select();
        } else {
            console.log('Creating new navbar settings record');
            result = await supabase.from('navbar_settings').insert([{ ...req.body, created_at: new Date().toISOString() }]).select();
        }
        if (result.error) {
            console.error('Supabase error:', result.error);
            throw result.error;
        }
        console.log('Navbar settings saved successfully:', result.data[0]);
        res.json({ success: true, data: result.data[0] });
    } catch (error) {
        console.error('Navbar settings save error:', error);
        res.status(500).json({ error: error.message, details: error });
    }
});

router.post('/chatbot-config', async (req, res) => {
    try {
        const { data: existing } = await supabase.from('chatbot_config').select('id').limit(1);
        let result;
        if (existing && existing.length > 0) {
            result = await supabase.from('chatbot_config').update({ ...req.body, updated_at: new Date().toISOString() }).eq('id', existing[0].id).select();
        } else {
            result = await supabase.from('chatbot_config').insert([req.body]).select();
        }
        if (result.error) throw result.error;
        res.json({ success: true, data: result.data[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/about-section', async (req, res) => {
    try {
        console.log('About section request body:', req.body);
        
        const { data: existing, error: selectError } = await supabase.from('about_section').select('id, img').limit(1);
        
        if (selectError) {
            console.error('Error selecting existing about section:', selectError);
            throw selectError;
        }
        
        let result;
        
        // Get old image URL before update
        let oldImageUrl = null;
        if (existing && existing.length > 0) {
            oldImageUrl = existing[0].img;
            console.log('Updating existing about section:', existing[0].id);
            const { data, error } = await supabase
                .from('about_section')
                .update({ ...req.body, updated_at: new Date().toISOString() })
                .eq('id', existing[0].id)
                .select();
            
            if (error) {
                console.error('Error updating about section:', error);
                throw error;
            }
            result = { data };
        } else {
            console.log('Inserting new about section');
            const { data, error } = await supabase
                .from('about_section')
                .insert([{ ...req.body, created_at: new Date().toISOString() }])
                .select();
            
            if (error) {
                console.error('Error inserting about section:', error);
                throw error;
            }
            result = { data };
        }
        
        // Delete old image if new image is provided and different
        if (oldImageUrl && req.body.img && oldImageUrl !== req.body.img) {
            await deleteOldImage(oldImageUrl);
        }
        
        console.log('About section saved successfully');
        res.json({ success: true, data: result.data[0] });
    } catch (error) {
        console.error('About section error:', error);
        res.status(500).json({ error: error.message || 'Failed to save about section' });
    }
});

router.post('/announcements', async (req, res) => {
    try {
        const { data, error } = await supabase.from('announcement_bar').insert([{ ...req.body, active: true }]).select();
        if (error) throw error;
        res.json({ success: true, data: data[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/announcements/:id', async (req, res) => {
    try {
        const { data, error } = await supabase.from('announcement_bar').update({ ...req.body, updated_at: new Date().toISOString() }).eq('id', req.params.id).select();
        if (error) throw error;
        res.json({ success: true, data: data[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/announcements/:id', async (req, res) => {
    try {
        const { error } = await supabase.from('announcement_bar').delete().eq('id', req.params.id);
        if (error) throw error;
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Custom Reviews API Endpoints
router.get('/reviews', async (req, res) => {
    try {
        const active = req.query.active === 'true';
        let query = supabase.from('custom_reviews').select('*');
        if (active) query = query.eq('active', true).order('display_order');

        const { data, error } = await query;
        if (error) throw error;

        const normalized = (data || []).map(r => {
            const userImage = r.user_image || '';
            let filename = '';
            try {
                const u = new URL(userImage, 'http://localhost');
                const parts = u.pathname.split('/');
                filename = parts[parts.length - 1];
            } catch (_) {
                const parts = userImage.split('/');
                filename = parts[parts.length - 1];
            }
            filename = (filename || '').split('?')[0];
            const user_image_local = filename ? `/static/uploads/${filename}` : '';
            return { ...r, user_image_local };
        });

        res.json(normalized);
    } catch (err) {
        console.error('Error fetching reviews:', err);
        res.status(500).json({ error: 'Failed to fetch reviews' });
    }
});

router.get('/reviews/:id', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('custom_reviews')
            .select('*')
            .eq('id', req.params.id)
            .single();
        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/reviews', async (req, res) => {
    try {
        console.log('Received review data:', req.body);
        
        // Validate required fields
        const { name, review_text, rating } = req.body;
        
        if (!name || typeof name !== 'string' || name.trim() === '') {
            return res.status(400).json({ error: 'Name is required and must be a valid string' });
        }
        if (!review_text || typeof review_text !== 'string' || review_text.trim() === '') {
            return res.status(400).json({ error: 'Review text is required and must be a valid string' });
        }
        
        const ratingNum = parseInt(rating);
        if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
            return res.status(400).json({ error: 'Rating must be a number between 1 and 5' });
        }

        const reviewData = {
            name: name.trim(),
            review_text: review_text.trim(),
            rating: ratingNum,
            active: req.body.active === true || req.body.active === 'true',
            display_order: parseInt(req.body.display_order) || 0,
            user_image: req.body.user_image || null
        };

        console.log('Inserting review data:', reviewData);

        const { data, error } = await supabase
            .from('custom_reviews')
            .insert([reviewData])
            .select();
        
        if (error) {
            console.error('Database error:', error);
            throw error;
        }
        
        console.log('Review created successfully:', data);
        res.json({ success: true, data: data[0] });
    } catch (error) {
        console.error('Error creating review:', error);
        res.status(500).json({ error: error.message || 'Failed to create review' });
    }
});

router.put('/reviews/:id', async (req, res) => {
    try {
        // Validate required fields
        if (req.body.name !== undefined && (!req.body.name || req.body.name.trim() === '')) {
            return res.status(400).json({ error: 'Name cannot be empty' });
        }
        if (req.body.rating !== undefined && (req.body.rating < 1 || req.body.rating > 5)) {
            return res.status(400).json({ error: 'Rating must be between 1 and 5' });
        }

        // Fetch old record to compare and delete old image if replaced
        const { data: oldReview, error: oldErr } = await supabase
            .from('custom_reviews')
            .select('user_image')
            .eq('id', req.params.id)
            .single();
        if (oldErr) throw oldErr;

        const updateData = { updated_at: new Date().toISOString() };
        if (req.body.name) updateData.name = req.body.name.trim();
        if (req.body.review_text) updateData.review_text = req.body.review_text.trim();
        if (req.body.rating) updateData.rating = parseInt(req.body.rating);
        if (req.body.active !== undefined) updateData.active = req.body.active === 'true' || req.body.active === true;
        if (req.body.display_order !== undefined) updateData.display_order = parseInt(req.body.display_order) || 0;

        // Choose user_image from provided fields
        const newImage = req.body.user_image || req.body.existing_image || null;
        if (newImage !== null) updateData.user_image = newImage;

        const { data, error } = await supabase
            .from('custom_reviews')
            .update(updateData)
            .eq('id', req.params.id)
            .select();
        if (error) throw error;

        // Delete old local image if it was replaced
        const oldImage = oldReview?.user_image || null;
        if (oldImage && newImage && oldImage !== newImage) {
            await deleteOldImage(oldImage);
        }

        res.json({ success: true, data: data[0] });
    } catch (error) {
        console.error('Error updating review:', error);
        res.status(500).json({ error: error.message });
    }
});

router.delete('/reviews/:id', async (req, res) => {
    try {
        const { error } = await supabase
            .from('custom_reviews')
            .delete()
            .eq('id', req.params.id);
        if (error) throw error;
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Chatbot Config API
router.get('/chatbot-config', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('chatbot_config')
            .select('*')
            .single();
        if (error) throw error;
        res.json(data || {});
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
