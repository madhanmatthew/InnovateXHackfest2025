require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDatabase } = require('./database');

// Initialize database
initDatabase();

// Import routes
const authRoutes = require('./routes/auth');
const scenarioRoutes = require('./routes/scenarios');
const responseRoutes = require('./routes/responses');
const analyticsRoutes = require('./routes/analytics');

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/scenarios', scenarioRoutes);
app.use('/api/responses', responseRoutes);
app.use('/api/analytics', analyticsRoutes);

// Serve static files (frontend)
app.use(express.static(path.join(__dirname, '..')));

// Serve index.html for all non-API routes (SPA routing)
app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(__dirname, '..', 'index.html'));
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: err.message
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║  🚀 Recruitment Simulation System                         ║
║                                                           ║
║  Server running at: http://localhost:${PORT}                ║
║  API endpoint: http://localhost:${PORT}/api                 ║
║                                                           ║
║  Ready to accept connections!                             ║
╚═══════════════════════════════════════════════════════════╝
  `);
});
