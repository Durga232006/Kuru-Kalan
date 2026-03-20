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
    windowMs: 15 * 60 * 1000,
    max: 100
});
app.use('/api', limiter);

// ✅ CORS
app.use(cors({
    origin: '*',
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

// ✅ Static Files
app.use(express.static(path.join(__dirname, 'public')));

// ✅ Serve uploads
app.use('/uploads', express.static(uploadsDir));

// ✅ API Routes
app.use('/api', apiRoutes);

// ✅ Health Check
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        message: 'Server is running',
        uptime: process.uptime()
    });
});

// ✅ FIXED fallback (NO app.get('*'))
app.use((req, res, next) => {
    if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    } else {
        next();
    }
});

// ✅ Start Server
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});

module.exports = app;