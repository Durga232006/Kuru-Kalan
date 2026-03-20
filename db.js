const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const MONGO_URI = process.env.MONGO_URI;

        if (!MONGO_URI) {
            throw new Error("MONGO_URI not defined");
        }

        await mongoose.connect(MONGO_URI);

        console.log("✅ MongoDB Connected Successfully");

    } catch (error) {
        console.error("❌ MongoDB Connection Failed:", error.message);

        // ✅ IMPORTANT: DO NOT STOP SERVER
        console.log("⚠️ Server is running without database");
    }
};

module.exports = connectDB;