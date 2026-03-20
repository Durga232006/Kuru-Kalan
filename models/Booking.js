const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    farmerName: {
        type: String,
        required: true,
        trim: true
    },
    mobileNumber: {
        type: String,
        required: true,
        trim: true
    },
    quantity: {
        type: Number,
        required: true,
        default: 0
    },
    bookingDate: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        default: 'Pending' // Pending, Approved, Allocated
    },
    allocatedContainer: {
        type: String,
        default: ''
    },
    containerLocation: {
        type: String,
        default: ''
    },
    address: {
        type: String,
        default: ''
    },
    landArea: {
        type: Number,
        default: 0
    },
    landUnit: {
        type: String,
        default: ''
    },
    containerSize: {
        type: String,
        default: ''
    },
    estimatedPaddy: {
        type: Number,
        default: 0
    },
    approvedAt: {
        type: Date,
        default: null
    },
    photoUrl: {
        type: String,
        default: ''
    }
}, {
    timestamps: true // adds createdAt & updatedAt automatically
});

module.exports = mongoose.model('Booking', bookingSchema);