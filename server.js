require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');

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
app.use('/uploads', express.static(path.join(__dirname, 'static/uploads')));

// Serve HTML templates
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
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
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

app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   🌙 Cosmic Astrology Backend Server                 ║
║                                                       ║
║   Status: Running                                     ║
║   Port: ${PORT}                                       ║
║   Environment: ${process.env.NODE_ENV || 'development'}                           ║
║                                                       ║
║   API Endpoints:                                      ║
║   • http://localhost:${PORT}/                         ║
║   • http://localhost:${PORT}/admin                    ║
║   • http://localhost:${PORT}/api/...                  ║
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
