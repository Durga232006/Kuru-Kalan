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

// ✅ Security
app.use(helmet({
    contentSecurityPolicy: false
}));

// ✅ Rate Limit
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100
});
app.use('/api', limiter);

// ✅ CORS
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
}));

// ✅ Body Parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Ensure uploads folder exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

// ✅ Static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(uploadsDir));

// ✅ API routes
app.use('/api', apiRoutes);

// ✅ ROOT ROUTE (Fix "Not Found" in Render)
app.get('/', (req, res) => {
    res.send("✅ Backend is Running Successfully");
});

// ✅ Health Check
app.get('/health', (req, res) => {
    res.json({
        status: "OK",
        message: "Server is running",
        uptime: process.uptime()
    });
});

// ✅ Fallback (IMPORTANT FIX: avoid "*" error)
app.use((req, res) => {
    if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    } else {
        res.status(404).json({ message: "API route not found" });
    }
});

// ✅ Start Server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

module.exports = app;