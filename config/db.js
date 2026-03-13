const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/kurukalan';
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');
        
        // Drop stale unique index from old schema version to prevent duplicate key errors
        try {
            await mongoose.connection.collection('bookings').dropIndex('booking_id_1');
            console.log('Dropped stale booking_id_1 index.');
        } catch (e) {
            // Index doesn't exist or already dropped — safe to ignore
        }
    } catch (error) {
        console.error('Database connection failed:', error.message);
        console.log('Notice: MongoDB is not running locally. Database features will be unavailable.');
    }
};

module.exports = connectDB;
