const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { supabase } = require('../config/database');
const backgroundRemovalService = require('../services/backgroundRemoval');

// Ensure upload directory exists (fallback for local storage)
const uploadDir = path.join(__dirname, '..', 'static', 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for memory storage (for Supabase upload)
const storage = multer.memoryStorage();

// File filter
const fileFilter = (req, file, cb) => {
    // Accept images only
    const allowedTypes = /jpeg|jpg|png|gif|webp|avif|svg/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp, avif, svg)'));
    }
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 // Default 5MB
    },
    fileFilter: fileFilter
});

// ========================================
// FILE UPLOAD ENDPOINT
// ========================================

// Single file upload with background removal (Supabase Storage)
router.post('/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Upload to Supabase Storage if available
        if (supabase) {
            const bucketName = process.env.SUPABASE_STORAGE_BUCKET || 'astrology';
            
            // Get folder and background removal option from form data
            const folder = req.body.folder || 'others';
            const removeBackground = req.body.removeBackground === 'true';
            
            console.log('\n📁 FILE UPLOAD REQUEST');
            console.log(`📂 Folder: ${folder}`);
            console.log(`📄 Filename: ${req.file.originalname}`);
            console.log(`💾 Size: ${(req.file.size / 1024).toFixed(2)} KB`);
            
            // Validate and organize folders properly
            const allowedFolders = {
                'services': 'services',
                'astrological-services': 'services',
                'pooja-services': 'pooja-services',
                'others': 'others',
                'about': 'about',
                'gallery-slides': 'gallery-slides',
                'hero-slides': 'hero-slides',
                'gallery': 'gallery-slides',
                'hero': 'hero-slides',
                'branding': 'others',
                'services-backgrounds': 'others'
            };
            
            const targetFolder = allowedFolders[folder] || 'others';
            
            // Determine if we should apply background removal
            // branding folder always gets background removal for logos
            const shouldRemoveBackground = removeBackground || folder === 'branding' || ['services', 'astrological-services', 'pooja-services'].includes(folder);
            
            let processedBuffer = req.file.buffer;
            let processedFilename = req.file.originalname;
            let contentType = req.file.mimetype;
            
            // Apply background removal for service images
            if (shouldRemoveBackground) {
                try {
                    console.log(`\n🎨 BACKGROUND REMOVAL PROCESS STARTED`);
                    console.log(`📸 Processing: ${req.file.originalname}`);
                    processedBuffer = await backgroundRemovalService.removeBackgroundFromBuffer(
                        req.file.buffer, 
                        req.file.originalname
                    );
                    
                    // Update filename and content type for PNG
                    const ext = path.extname(req.file.originalname);
                    const name = path.basename(req.file.originalname, ext);
                    processedFilename = `${name}_transparent.png`;
                    contentType = 'image/png';
                    
                    console.log(`✅ Background removal completed successfully\n`);
                } catch (bgError) {
                    console.error(`⚠️  Background removal failed: ${bgError.message}`);
                    console.log(`⚠️  Continuing with original image\n`);
                    // Continue with original file if background removal fails
                }
            }
            
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const ext = path.extname(processedFilename);
            const filename = path.basename(processedFilename, ext) + '-' + uniqueSuffix + ext;
            const storagePath = `${targetFolder}/${filename}`;
            
            console.log(`⬆️  Uploading to Supabase: ${storagePath}`);
            const { data, error } = await supabase.storage
                .from(bucketName)
                .upload(storagePath, processedBuffer, {
                    contentType: contentType,
                    upsert: false
                });

            if (error) {
                console.error('❌ Supabase upload error:', error);
                return res.status(500).json({ error: 'Upload to storage failed: ' + error.message });
            }

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from(bucketName)
                .getPublicUrl(storagePath);
            
            console.log(`✅ Upload successful!`);
            console.log(`📍 Public URL: ${publicUrl}`);
            console.log(`💾 File size: ${(processedBuffer.length / 1024).toFixed(2)} KB`);
            console.log(`🎨 Background removed: ${shouldRemoveBackground ? 'YES ✅' : 'NO'}\n`);
            
            return res.json({
                success: true,
                message: shouldRemoveBackground ? 
                    'File uploaded successfully with background removal' : 
                    'File uploaded successfully',
                url: publicUrl,
                filename: filename,
                originalName: req.file.originalname,
                backgroundRemoved: shouldRemoveBackground,
                size: req.file.size,
                storage: 'supabase'
            });
        } else {
            // Fallback to local storage
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const ext = path.extname(req.file.originalname);
            const filename = path.basename(req.file.originalname, ext) + '-' + uniqueSuffix + ext;
            const filepath = path.join(uploadDir, filename);
            
            fs.writeFileSync(filepath, req.file.buffer);
            
            return res.json({
                success: true,
                message: 'File uploaded successfully',
                url: `/uploads/${filename}`,
                filename: filename,
                originalName: req.file.originalname,
                size: req.file.size,
                storage: 'local'
            });
        }
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'File upload failed: ' + error.message });
    }
});

// Multiple files upload
router.post('/upload-multiple', upload.array('files', 10), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'No files uploaded' });
        }

        if (supabase) {
            const bucketName = process.env.SUPABASE_STORAGE_BUCKET || 'astrology';
            const uploadPromises = req.files.map(async (file) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                const ext = path.extname(file.originalname);
                const filename = path.basename(file.originalname, ext) + '-' + uniqueSuffix + ext;

                const { error } = await supabase.storage
                    .from(bucketName)
                    .upload(filename, file.buffer, {
                        contentType: file.mimetype,
                        upsert: false
                    });

                if (error) throw error;

                const { data: { publicUrl } } = supabase.storage
                    .from(bucketName)
                    .getPublicUrl(filename);

                return {
                    url: publicUrl,
                    filename: filename,
                    originalName: file.originalname,
                    size: file.size
                };
            });

            const uploadedFiles = await Promise.all(uploadPromises);

            return res.json({
                success: true,
                message: 'Files uploaded successfully to Supabase',
                files: uploadedFiles,
                storage: 'supabase'
            });
        } else {
            // Fallback to local storage
            const uploadedFiles = req.files.map(file => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                const ext = path.extname(file.originalname);
                const filename = path.basename(file.originalname, ext) + '-' + uniqueSuffix + ext;
                const filepath = path.join(uploadDir, filename);
                
                fs.writeFileSync(filepath, file.buffer);

                return {
                    url: `/uploads/${filename}`,
                    filename: filename,
                    originalName: file.originalname,
                    size: file.size
                };
            });

            return res.json({
                success: true,
                message: 'Files uploaded successfully',
                files: uploadedFiles,
                storage: 'local'
            });
        }
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'File upload failed: ' + error.message });
    }
});

// Delete uploaded file
router.delete('/upload/:filename', async (req, res) => {
    try {
        const { filename } = req.params;

        if (supabase) {
            const bucketName = process.env.SUPABASE_STORAGE_BUCKET || 'astrology';
            
            const { error } = await supabase.storage
                .from(bucketName)
                .remove([filename]);

            if (error) {
                console.error('Supabase delete error:', error);
                return res.status(500).json({ error: 'File deletion failed: ' + error.message });
            }

            return res.json({
                success: true,
                message: 'File deleted successfully from Supabase'
            });
        } else {
            const filePath = path.join(uploadDir, filename);

            if (!fs.existsSync(filePath)) {
                return res.status(404).json({ error: 'File not found' });
            }

            fs.unlinkSync(filePath);

            return res.json({
                success: true,
                message: 'File deleted successfully'
            });
        }
    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({ error: 'File deletion failed: ' + error.message });
    }
});

// List uploaded files
router.get('/uploads', async (req, res) => {
    try {
        if (supabase) {
            const bucketName = process.env.SUPABASE_STORAGE_BUCKET || 'astrology';
            
            const { data, error } = await supabase.storage
                .from(bucketName)
                .list();

            if (error) {
                console.error('Supabase list error:', error);
                return res.status(500).json({ error: 'Failed to list files: ' + error.message });
            }

            const fileList = data.map(file => {
                const { data: { publicUrl } } = supabase.storage
                    .from(bucketName)
                    .getPublicUrl(file.name);

                return {
                    filename: file.name,
                    url: publicUrl,
                    size: file.metadata?.size || 0,
                    created: file.created_at,
                    modified: file.updated_at
                };
            });

            return res.json({
                success: true,
                files: fileList,
                storage: 'supabase'
            });
        } else {
            const files = fs.readdirSync(uploadDir);
            
            const fileList = files.map(filename => {
                const filePath = path.join(uploadDir, filename);
                const stats = fs.statSync(filePath);
                
                return {
                    filename,
                    url: `/uploads/${filename}`,
                    size: stats.size,
                    created: stats.birthtime,
                    modified: stats.mtime
                };
            });

            return res.json({
                success: true,
                files: fileList,
                storage: 'local'
            });
        }
    } catch (error) {
        console.error('List files error:', error);
        res.status(500).json({ error: 'Failed to list files: ' + error.message });
    }
});

// Error handling middleware for multer
router.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                error: 'File is too large. Maximum size is ' + 
                       (parseInt(process.env.MAX_FILE_SIZE) || 5242880) / (1024 * 1024) + 'MB'
            });
        }
        return res.status(400).json({ error: error.message });
    }
    next(error);
});

module.exports = router;
