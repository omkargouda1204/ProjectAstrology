const express = require('express');
const router = express.Router();
const { supabase } = require('../config/database');

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
            const { data, error } = await supabase.from(tableName).update({ ...req.body, updated_at: new Date().toISOString() }).eq('id', req.params.id).select();
            if (error) throw error;
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
        const { data, error } = await supabase.from('business_info').select('*').limit(1).single();
        if (error && error.code !== 'PGRST116') throw error;
        res.json(data || {});
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Brand & Navigation Settings route
router.get('/navbar-settings', async (req, res) => {
    try {
        const { data, error } = await supabase.from('navbar_settings').select('*').limit(1).single();
        if (error && error.code !== 'PGRST116') throw error;
        res.json(data || {});
    } catch (error) {
        res.status(500).json({ error: error.message });
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
        const { data, error } = await supabase.from('about_section').select('*').limit(1).single();
        if (error && error.code !== 'PGRST116') throw error;
        res.json(data || {});
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/announcements', async (req, res) => {
    try {
        const { data, error } = await supabase.from('announcement_bar').select('*').eq('active', true).order('display_order');
        if (error) throw error;
        res.json(data || []);
    } catch (error) {
        res.status(500).json({ error: error.message });
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
        const { data, error } = await supabase.from('expert_solutions').select('*').eq('active', true).order('display_order');
        if (error) throw error;
        res.json(data || []);
    } catch (error) {
        res.status(500).json({ error: error.message });
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

router.put('/hero-slides/:id', async (req, res) => {
    try {
        const { data, error } = await supabase.from('hero_slides').update({ ...req.body, updated_at: new Date().toISOString() }).eq('id', req.params.id).select();
        if (error) throw error;
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

router.put('/gallery-slides/:id', async (req, res) => {
    try {
        const { data, error } = await supabase.from('gallery_slides').update({ ...req.body, updated_at: new Date().toISOString() }).eq('id', req.params.id).select();
        if (error) throw error;
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
        const { data: existing } = await supabase.from('about_section').select('id').limit(1);
        let result;
        if (existing && existing.length > 0) {
            result = await supabase.from('about_section').update({ ...req.body, updated_at: new Date().toISOString() }).eq('id', existing[0].id).select();
        } else {
            result = await supabase.from('about_section').insert([req.body]).select();
        }
        if (result.error) throw result.error;
        res.json({ success: true, data: result.data[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
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
        const activeOnly = req.query.active === 'true';
        let query = supabase.from('custom_reviews').select('*');
        
        if (activeOnly) {
            query = query.eq('active', true);
        }
        
        const { data, error } = await query.order('display_order');
        if (error) throw error;
        res.json(data || []);
    } catch (error) {
        console.error('Reviews API error:', error);
        res.status(500).json({ error: error.message });
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
        const { data, error } = await supabase
            .from('custom_reviews')
            .insert([{ ...req.body, active: true }])
            .select();
        if (error) throw error;
        res.json({ success: true, data: data[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/reviews/:id', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('custom_reviews')
            .update({ ...req.body, updated_at: new Date().toISOString() })
            .eq('id', req.params.id)
            .select();
        if (error) throw error;
        res.json({ success: true, data: data[0] });
    } catch (error) {
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
