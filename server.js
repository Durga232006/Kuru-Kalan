require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const connectDB = require('./config/db');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ Connect MongoDB
connectDB();

// ✅ Security Middleware
app.use(helmet({
    contentSecurityPolicy: false
}));

// ✅ Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 mins
    max: 100
});
app.use('/api', limiter);

// ✅ CORS (IMPORTANT for Vercel frontend)
app.use(cors({
    origin: '*', // you can restrict to your Vercel URL later
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type']
}));

// ✅ Body Parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Ensure uploads folder exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

// ✅ Static Files (Frontend)
app.use(express.static(path.join(__dirname, 'public')));

// ✅ Serve uploaded files
app.use('/uploads', express.static(uploadsDir));

// ✅ API Routes
app.use('/api', apiRoutes);

// ✅ Health Check (test backend)
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        message: 'Server is running',
        uptime: process.uptime()
    });
});

// ✅ Fallback route (for frontend pages)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ✅ Start Server
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});

module.exports = app;