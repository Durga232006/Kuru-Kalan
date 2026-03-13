const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    farmerName: { type: String, required: true },
    mobileNumber: { type: String, required: true },
    quantity: { type: Number, required: true },
    bookingDate: { type: Date, default: Date.now },
    status: { type: String, default: 'Pending' }, // Pending, Allocated
    allocatedContainer: { type: String, default: '' },
    containerLocation: { type: String, default: '' },
    address: { type: String },
    landArea: { type: Number },
    landUnit: { type: String },
    containerSize: { type: String },
    estimatedPaddy: { type: Number, default: 0 },
    approvedAt: { type: Date, default: null },
    photoUrl: { type: String, default: '' }
});

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
