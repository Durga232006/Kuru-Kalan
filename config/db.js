const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const MONGO_URI = process.env.MONGO_URI;

        if (!MONGO_URI) {
            console.log("⚠️ No MongoDB URI provided");
            return;
        }

        await mongoose.connect(MONGO_URI);

        console.log("✅ MongoDB Connected Successfully");

    } catch (error) {
        console.error("❌ MongoDB Connection Failed:", error.message);
    }
};

module.exports = connectDB;