const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const MONGO_URI = process.env.MONGO_URI;

        if (!MONGO_URI) {
            throw new Error("❌ MONGO_URI is not defined in .env");
        }

        await mongoose.connect(MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        console.log("✅ MongoDB Connected Successfully");

    } catch (error) {
        console.error("❌ MongoDB Connection Failed:", error.message);
        process.exit(1); // stop server if DB fails
    }
};

module.exports = connectDB;