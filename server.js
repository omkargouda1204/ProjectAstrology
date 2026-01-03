const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
const fs = require('fs');
const https = require('https');
const { supabase } = require('./config/database');

// Import routes
const adminRoutes = require('./routes/admin');
const contentRoutes = require('./routes/content');
const bookingRoutes = require('./routes/booking');
const uploadRoutes = require('./routes/upload');
const chatbotRoutes = require('./routes/chatbot');
const servicesRoutes = require('./routes/services');

const app = express();
const PORT = process.env.PORT || 3000;

// ========================================
// VIEW ENGINE SETUP (EJS)
// ========================================

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'templates'));
app.use(expressLayouts);
app.set('layout', 'base');
app.set('layout extractScripts', true);
app.set('layout extractStyles', true);

// ========================================
// MIDDLEWARE
// ========================================

// Security headers
app.use(helmet({
    contentSecurityPolicy: false, // Disable for development, configure properly for production
    crossOriginEmbedderPolicy: false
}));

// Compression
app.use(compression());

// CORS configuration
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use('/static', express.static(path.join(__dirname, 'static')));

// Custom uploads handler with Supabase fallback
app.get('/uploads/:filename', async (req, res) => {
    try {
        const filename = decodeURIComponent(req.params.filename);
        const localPath = path.join(__dirname, 'static', 'uploads', filename);
        
        console.log(`📥 Image request: ${filename}`);
        
        // First, try to serve from local uploads folder
        if (fs.existsSync(localPath)) {
            console.log(`✅ Serving from local: ${filename}`);
            return res.sendFile(localPath);
        }
        
        console.log(`⚠️ Not in local uploads, checking Supabase...`);
        
        // If not found locally, try to fetch from Supabase bucket
        if (!supabase) {
            console.log(`❌ Supabase not configured`);
            return res.status(404).send('Image not found');
        }
        
        const bucketName = process.env.SUPABASE_STORAGE_BUCKET || 'astrology';
        const folders = ['services', 'pooja-services', 'others', 'about', 'gallery-slides', 'hero-slides'];
        
        // Try each folder
        for (const folder of folders) {
            const storagePath = `${folder}/${filename}`;
            
            try {
                // Get public URL from Supabase
                const { data: urlData } = supabase.storage
                    .from(bucketName)
                    .getPublicUrl(storagePath);
                
                if (!urlData || !urlData.publicUrl) {
                    continue;
                }
                
                console.log(`🔍 Trying: ${storagePath}`);
                
                // Fetch from Supabase with timeout
                const imageResponse = await new Promise((resolve, reject) => {
                    const timeout = setTimeout(() => {
                        reject(new Error('Request timeout'));
                    }, 5000);
                    
                    https.get(urlData.publicUrl, (response) => {
                        clearTimeout(timeout);
                        if (response.statusCode === 200) {
                            resolve(response);
                        } else {
                            reject(new Error(`HTTP ${response.statusCode}`));
                        }
                    }).on('error', (err) => {
                        clearTimeout(timeout);
                        reject(err);
                    });
                });
                
                // Set content type based on file extension
                const ext = path.extname(filename).toLowerCase();
                const contentTypes = {
                    '.jpg': 'image/jpeg',
                    '.jpeg': 'image/jpeg',
                    '.png': 'image/png',
                    '.gif': 'image/gif',
                    '.webp': 'image/webp',
                    '.avif': 'image/avif',
                    '.svg': 'image/svg+xml'
                };
                
                const contentType = contentTypes[ext] || 'image/jpeg';
                res.setHeader('Content-Type', contentType);
                res.setHeader('Cache-Control', 'public, max-age=31536000');
                
                console.log(`✅ Serving from Supabase: ${storagePath}`);
                
                // Stream the image to client
                imageResponse.pipe(res);
                return;
                
            } catch (err) {
                console.log(`⏭️ ${folder}: ${err.message}`);
                continue;
            }
        }
        
        // Image not found in any location
        console.log(`❌ Image not found: ${filename}`);
        res.status(404).send('Image not found');
        
    } catch (error) {
        console.error(`❌ Error serving image:`, error);
        res.status(500).send('Server error');
    }
});

// Serve HTML files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'templates', 'index.html'));
});

app.get('/admin-simple', (req, res) => {
    res.sendFile(path.join(__dirname, 'templates', 'admin-simple.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'templates', 'admin.html'));
});

app.get('/contact', (req, res) => {
    res.sendFile(path.join(__dirname, 'templates', 'contact.html'));
});

// Redirect /contact.html to /contact
app.get('/contact.html', (req, res) => {
    res.redirect(301, '/contact');
});

app.get('/privacy', (req, res) => {
    res.sendFile(path.join(__dirname, 'templates', 'privacy.html'));
});

app.get('/setup', (req, res) => {
    res.sendFile(path.join(__dirname, 'setup.html'));
});

// ========================================
// API ROUTES
// ========================================

app.use('/api', adminRoutes);
app.use('/api', contentRoutes);
app.use('/api', bookingRoutes);
app.use('/api', uploadRoutes);
app.use('/api', chatbotRoutes);
app.use('/api', servicesRoutes);

// Health check endpoint
app.get('/health', async (req, res) => {
    const health = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        supabase: supabase ? 'connected' : 'not configured'
    };
    
    // Test Supabase connection if available
    if (supabase) {
        try {
            const { data, error } = await supabase.from('navbar_settings').select('count').limit(1);
            health.database = error ? 'error' : 'connected';
            if (error) {
                health.dbError = error.message;
            }
        } catch (err) {
            health.database = 'error';
            health.dbError = err.message;
        }
    }
    
    res.json(health);
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        error: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// ========================================
// START SERVER
// ========================================

app.listen(PORT, '0.0.0.0', () => {
    console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   🌙 Cosmic Astrology Backend Server                 ║
║                                                       ║
║   Status: Running                                     ║
║   Port: ${PORT}                                       ║
║   Environment: ${process.env.NODE_ENV || 'development'}║
║                                                       ║
║   API Endpoints:                                      ║
║   • http://localhost:${PORT}/                         ║
║   • http://localhost:${PORT}/admin                    ║
║   • http://localhost:${PORT}/api/.                    ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
    `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT received. Shutting down gracefully...');
    process.exit(0);
});

module.exports = app;
