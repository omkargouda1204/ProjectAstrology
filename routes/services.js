const express = require('express');
const router = express.Router();
const { supabase } = require('../config/database');
const path = require('path');
const fs = require('fs');

// Helper function to delete old image from storage
async function deleteOldImage(imageUrl) {
    if (!imageUrl) return;
    
    try {
        // Delete from local folder
        if (imageUrl.includes('/static/uploads/')) {
            const filename = imageUrl.split('/').pop();
            const localPath = path.join(__dirname, '..', 'static', 'uploads', filename);
            if (fs.existsSync(localPath)) {
                fs.unlinkSync(localPath);
                console.log('Deleted local file:', filename);
            }
        }
        
        // Delete from Supabase if it's a Supabase URL
        if (supabase && imageUrl.includes('supabase')) {
            try {
                const url = new URL(imageUrl);
                const pathParts = url.pathname.split('/');
                const bucketIndex = pathParts.findIndex(part => part === 'storage');
                if (bucketIndex !== -1) {
                    const bucketName = pathParts[bucketIndex + 2];
                    const filePath = pathParts.slice(bucketIndex + 4).join('/');
                    
                    if (bucketName && filePath) {
                        const { error } = await supabase.storage
                            .from(bucketName)
                            .remove([filePath]);
                        
                        if (!error) {
                            console.log('Deleted from Supabase:', filePath);
                        }
                    }
                }
            } catch (err) {
                console.warn('Could not delete from Supabase:', err.message);
            }
        }
    } catch (error) {
        console.error('Error deleting old image:', error);
    }
}

// ========================================
// ASTROLOGICAL SERVICES CRUD
// ========================================

// Get all astrological services (latest first)
router.get('/astrological-services', async (req, res) => {
    try {
        if (!supabase) {
            console.warn('⚠️ Supabase not configured for astrological-services');
            return res.json([]);
        }
        const { data, error} = await supabase
            .from('astrological_services')
            .select('*')
            .eq('active', true)
            .order('updated_at', { ascending: false })
            .order('display_order', { ascending: true });
            
        if (error) {
            console.error('Error fetching astrological-services:', error.message);
            return res.json([]);
        }
        res.json(data || []);
    } catch (error) {
        console.error('Error in astrological-services:', error.message);
        res.json([]);
    }
});

// Get single astrological service
router.get('/astrological-services/:id', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('astrological_services')
            .select('*')
            .eq('id', req.params.id)
            .single();
            
        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create new astrological service (simplified - title + image only)
router.post('/astrological-services', async (req, res) => {
    try {
        const serviceData = {
            title: req.body.title,
            image_url: req.body.image_url || '',
            display_order: req.body.display_order || 0,
            active: req.body.active !== undefined ? req.body.active : true,
            created_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('astrological_services')
            .insert([serviceData])
            .select();
            
        if (error) throw error;
        res.json({ success: true, data: data[0] });
    } catch (error) {
        console.error('Error creating astrological service:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update astrological service (simplified - title + image only)
router.put('/astrological-services/:id', async (req, res) => {
    try {
        // Get old image URL before update
        const { data: oldData } = await supabase.from('astrological_services').select('image_url, icon_url').eq('id', req.params.id).single();
        
        const updateData = {
            title: req.body.title,
            image_url: req.body.image_url,
            icon_url: req.body.icon_url,
            active: req.body.active,
            display_order: req.body.display_order,
            updated_at: new Date().toISOString()
        };

        // Remove undefined values
        Object.keys(updateData).forEach(key => 
            updateData[key] === undefined && delete updateData[key]
        );

        const { data, error } = await supabase
            .from('astrological_services')
            .update(updateData)
            .eq('id', req.params.id)
            .select();
            
        if (error) throw error;
        
        // Delete old images if new images are provided and different
        if (oldData) {
            try {
                if (oldData.image_url && req.body.image_url && oldData.image_url !== req.body.image_url) {
                    await deleteOldImage(oldData.image_url);
                    console.log('✅ Deleted old image_url:', oldData.image_url);
                }
                if (oldData.icon_url && req.body.icon_url && oldData.icon_url !== req.body.icon_url) {
                    await deleteOldImage(oldData.icon_url);
                    console.log('✅ Deleted old icon_url:', oldData.icon_url);
                }
            } catch (deleteError) {
                console.warn('⚠️ Warning deleting old images:', deleteError.message);
                // Don't fail the request if image deletion fails
            }
        }
        
        res.json({ success: true, data: data[0] });
    } catch (error) {
        console.error('Error updating astrological service:', error);
        res.status(500).json({ error: error.message });
    }
});

// Delete astrological service (soft delete)
router.delete('/astrological-services/:id', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('astrological_services')
            .update({ 
                active: false, 
                updated_at: new Date().toISOString() 
            })
            .eq('id', req.params.id)
            .select();
            
        if (error) throw error;
        res.json({ success: true, message: 'Service deleted successfully' });
    } catch (error) {
        console.error('Error deleting astrological service:', error);
        res.status(500).json({ error: error.message });
    }
});

// ========================================
// POOJA SERVICES CRUD
// ========================================

// Get all pooja services
router.get('/pooja-services', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('pooja_services')
            .select('*')
            .eq('active', true)
            .order('display_order');
            
        if (error) throw error;
        res.json(data || []);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create new pooja service
router.post('/pooja-services', async (req, res) => {
    try {
        const serviceData = {
            title: req.body.title,
            description: req.body.description || '',
            image_url: req.body.image_url || '',
            icon_url: req.body.icon_url || '',
            price: req.body.price || null,
            duration: req.body.duration || '',
            benefits: req.body.benefits || [],
            items_included: req.body.items_included || [],
            is_featured: req.body.is_featured || false,
            display_order: req.body.display_order || 0,
            active: true,
            created_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('pooja_services')
            .insert([serviceData])
            .select();
            
        if (error) throw error;
        res.json({ success: true, data: data[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update pooja service
router.put('/pooja-services/:id', async (req, res) => {
    try {
        const updateData = {
            title: req.body.title,
            description: req.body.description,
            image_url: req.body.image_url,
            icon_url: req.body.icon_url,
            price: req.body.price,
            duration: req.body.duration,
            benefits: req.body.benefits,
            items_included: req.body.items_included,
            is_featured: req.body.is_featured,
            display_order: req.body.display_order,
            updated_at: new Date().toISOString()
        };

        Object.keys(updateData).forEach(key => 
            updateData[key] === undefined && delete updateData[key]
        );

        const { data, error } = await supabase
            .from('pooja_services')
            .update(updateData)
            .eq('id', req.params.id)
            .select();
            
        if (error) throw error;
        res.json({ success: true, data: data[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete pooja service
router.delete('/pooja-services/:id', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('pooja_services')
            .update({ 
                active: false, 
                updated_at: new Date().toISOString() 
            })
            .eq('id', req.params.id)
            .select();
            
        if (error) throw error;
        res.json({ success: true, message: 'Service deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ========================================
// BULK OPERATIONS
// ========================================

// Update display order for multiple services
router.put('/astrological-services/bulk/reorder', async (req, res) => {
    try {
        const { services } = req.body; // Array of {id, display_order}
        
        const updates = services.map(service => 
            supabase
                .from('astrological_services')
                .update({ 
                    display_order: service.display_order,
                    updated_at: new Date().toISOString()
                })
                .eq('id', service.id)
        );

        await Promise.all(updates);
        res.json({ success: true, message: 'Display order updated' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/pooja-services/bulk/reorder', async (req, res) => {
    try {
        const { services } = req.body;
        
        const updates = services.map(service => 
            supabase
                .from('pooja_services')
                .update({ 
                    display_order: service.display_order,
                    updated_at: new Date().toISOString()
                })
                .eq('id', service.id)
        );

        await Promise.all(updates);
        res.json({ success: true, message: 'Display order updated' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
