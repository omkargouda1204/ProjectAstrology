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
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 // Default 10MB
    },
    fileFilter: fileFilter
});

// ========================================
// FILE UPLOAD ENDPOINT
// ========================================

// Single file upload with background removal (Supabase Storage)
router.post('/upload', upload.single('file'), async (req, res) => {
    try {
        console.log('Upload request received');
        console.log('File:', req.file ? req.file.originalname : 'No file');
        console.log('Body:', req.body);
        
        if (!req.file) {
            console.error('No file provided in request');
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Upload to Supabase Storage if available
        if (supabase) {
            const bucketName = process.env.SUPABASE_STORAGE_BUCKET || 'astrology';
            
            // Get folder and background removal option from form data
            const folder = req.body.folder || 'others';
            const removeBackground = req.body.removeBackground === 'true';
            
            console.log('Upload request - Folder:', folder, ', RemoveBackground:', removeBackground);
            
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
                    console.log(`Applying background removal for ${req.file.originalname}`);
                    processedBuffer = await backgroundRemovalService.removeBackgroundFromBuffer(
                        req.file.buffer, 
                        req.file.originalname
                    );
                    
                    // Update filename and content type for PNG
                    const ext = path.extname(req.file.originalname);
                    const name = path.basename(req.file.originalname, ext);
                    processedFilename = `${name}_transparent.png`;
                    contentType = 'image/png';
                    
                    console.log(`Background removal completed for ${req.file.originalname}`);
                } catch (bgError) {
                    console.error('Background removal failed, using original:', bgError);
                    // Continue with original file if background removal fails
                }
            }
            
            // Generate unique filename
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const outExt = path.extname(processedFilename);
            const filename = path.basename(processedFilename, outExt) + '-' + uniqueSuffix + outExt;
            const storagePath = `${targetFolder}/${filename}`;
            
            // CRITICAL: Save to local upload folder FIRST (primary storage)
            const localPath = path.join(uploadDir, filename);
            const localUrl = `/static/uploads/${filename}`;
            
            console.log('📁 Attempting to save to:', localPath);
            console.log('📂 Upload directory:', uploadDir);
            console.log('📂 Directory exists:', fs.existsSync(uploadDir));
            
            try {
                // Ensure directory exists
                if (!fs.existsSync(uploadDir)) {
                    console.log('Creating upload directory...');
                    fs.mkdirSync(uploadDir, { recursive: true });
                }
                
                // Write file synchronously to ensure it completes
                fs.writeFileSync(localPath, processedBuffer, { encoding: null, flag: 'w' });
                console.log(`✅ SUCCESS: Image saved to local folder: ${localPath}`);
                console.log(`📊 File size: ${fs.statSync(localPath).size} bytes`);
            } catch (localError) {
                console.error('❌ CRITICAL ERROR saving to local folder:', localError);
                console.error('Error stack:', localError.stack);
                return res.status(500).json({ 
                    error: 'Failed to save image to server',
                    details: localError.message,
                    path: localPath
                });
            }
            
            // Try to save to Supabase Storage (backup, optional)
            let publicUrl = null;
            
            try {
                const { data, error } = await supabase.storage
                    .from(bucketName)
                    .upload(storagePath, processedBuffer, {
                        contentType: contentType,
                        upsert: false
                    });

                if (error) {
                    console.warn('⚠️ Supabase upload failed (local save succeeded):', error.message);
                } else {
                    const { data: urlData } = supabase.storage
                        .from(bucketName)
                        .getPublicUrl(storagePath);
                    publicUrl = urlData.publicUrl;
                    console.log('✅ Also saved to Supabase:', storagePath);
                }
            } catch (supabaseError) {
                console.warn('⚠️ Supabase connection issue (local save succeeded):', supabaseError.message);
            }
            
            // Return success with local URL as primary
            return res.json({
                success: true,
                message: shouldRemoveBackground ? 
                    'File uploaded successfully with background removal' : 
                    'File uploaded successfully',
                url: localUrl,  // Use local URL as primary
                supabaseUrl: publicUrl,  // Keep Supabase URL as backup (may be null)
                localUrl: localUrl,
                filename: filename,
                originalName: req.file.originalname,
                backgroundRemoved: shouldRemoveBackground,
                size: req.file.size,
                storage: publicUrl ? 'local+supabase' : 'local'
            });
        } else {
            // Fallback to local storage
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const ext = path.extname(req.file.originalname);
            const filename = path.basename(req.file.originalname, ext) + '-' + uniqueSuffix + ext;
            const filepath = path.join(uploadDir, filename);
            
            console.log('📁 Saving to local folder:', filepath);
            console.log('📂 Upload directory exists:', fs.existsSync(uploadDir));
            
            try {
                // Ensure directory exists
                if (!fs.existsSync(uploadDir)) {
                    console.log('Creating upload directory...');
                    fs.mkdirSync(uploadDir, { recursive: true });
                }
                
                // Write file
                fs.writeFileSync(filepath, req.file.buffer);
                console.log('✅ File saved successfully:', filepath);
                console.log('📊 File size:', fs.statSync(filepath).size, 'bytes');
            } catch (err) {
                console.error('❌ Error saving file:', err);
                return res.status(500).json({ error: 'Failed to save file: ' + err.message });
            }
            
            return res.json({
                success: true,
                message: 'File uploaded successfully',
                url: `/static/uploads/${filename}`,
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

// Helper function to delete old images
async function deleteOldImage(imageUrl) {
    if (!imageUrl) return;
    
    try {
        // Delete from Supabase if it's a Supabase URL
        if (imageUrl.includes('supabase') && supabase) {
            const bucketName = process.env.SUPABASE_STORAGE_BUCKET || 'astrology';
            // Extract file path from URL
            const urlParts = imageUrl.split('/storage/v1/object/public/');
            if (urlParts.length > 1) {
                const filePath = urlParts[1].split('/').slice(1).join('/'); // Remove bucket name
                const { error } = await supabase.storage.from(bucketName).remove([filePath]);
                if (error) console.error('Supabase delete error:', error);
                else console.log('Deleted from Supabase:', filePath);
            }
        }
        
        // Delete from local folder
        const filename = path.basename(imageUrl);
        const localPath = path.join(uploadDir, filename);
        if (fs.existsSync(localPath)) {
            fs.unlinkSync(localPath);
            console.log('Deleted from local folder:', localPath);
        }
    } catch (error) {
        console.error('Error deleting old image:', error);
    }
}

// Export for use in other routes
router.deleteOldImage = deleteOldImage;

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
