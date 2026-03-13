const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads in memory (to support Vercel serverless)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Add a new booking with file upload support
router.post('/book', upload.single('photo'), async (req, res) => {
    try {
        const {
            farmerName,
            mobileNumber,
            quantity,
            bookingDate,
            address,
            landArea,
            landUnit,
            containerSize,
            estimatedPaddy
        } = req.body;

        // Validate required fields
        if (!farmerName || !mobileNumber) {
            return res.status(400).json({ message: 'Farmer name and mobile number are required.' });
        }

        let photoUrl = '';
        if (req.file) {
            const base64Image = req.file.buffer.toString('base64');
            photoUrl = `data:${req.file.mimetype};base64,${base64Image}`;
        }

        const newBooking = new Booking({
            farmerName: farmerName,
            mobileNumber: mobileNumber,
            quantity: parseInt(quantity) || 0,
            bookingDate: bookingDate ? new Date(bookingDate) : new Date(),
            address: address || '',
            landArea: parseFloat(landArea) || 0,
            landUnit: landUnit || '',
            containerSize: containerSize || '',
            estimatedPaddy: parseInt(estimatedPaddy) || 0,
            photoUrl: photoUrl,
            status: 'Pending'
        });

        await newBooking.save();

        // Simulate SMS Notification to Farmer (Submission)
        console.log(`[SMS] To: ${mobileNumber} - Dear ${farmerName}, your booking request for ${quantity} containers has been received. Booking ID: ${newBooking._id}`);

        res.status(201).json({ message: 'Booking Submitted Successfully.', booking: newBooking });
    } catch (error) {
        console.error('Error creating booking:', error);
        res.status(500).json({ message: 'Failed to create booking', error: error.message });
    }
});

// Get all bookings (for Admin Dashboard)
router.get('/bookings', async (req, res) => {
    try {
        const bookings = await Booking.find().sort({ bookingDate: -1 });
        res.status(200).json(bookings);
    } catch (error) {
        res.status(500).json({ message: 'Failed to retrieve bookings', error: error.message });
    }
});

// Admin allocate container and send SMS summary
router.post('/allocate', async (req, res) => {
    const { bookingId, allocatedContainer, containerLocation } = req.body;
    try {
        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        booking.status = 'Allocated';
        booking.allocatedContainer = allocatedContainer;
        booking.containerLocation = containerLocation;
        await booking.save();

        // MOCK SMS SENDING
        const smsMessage = `Kuru Kalan Confirmation:\nHello ${booking.farmerName}, your paddy storage container (${allocatedContainer}) has been successfully allocated at ${containerLocation}.\nThank you for choosing Smart Paddy Storage!`;
        console.log('----- SMS GATEWAY (MOCK) -----');
        console.log(`To: ${booking.mobileNumber}`);
        console.log(`Message:\n${smsMessage}`);
        console.log('------------------------------');

        res.status(200).json({ message: 'Container allocated successfully and SMS sent', booking });
    } catch (error) {
        res.status(500).json({ message: 'Failed to allocate container', error: error.message });
    }
});

// Update booking status (Approve/Reject)
router.patch('/bookings/:id/status', async (req, res) => {
    const { status } = req.body;
    if (!['Pending', 'Approved', 'Rejected'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
    }

    try {
        const updateData = { status };
        if (status === 'Approved') {
            updateData.approvedAt = new Date();
        }
        const booking = await Booking.findByIdAndUpdate(req.params.id, updateData, { returnDocument: 'after' });
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        if (status === 'Approved') {
            // Simulate Confirmation SMS to Farmer (Approval)
            console.log(`[SMS] To: ${booking.mobileNumber} - Dear ${booking.farmerName}, your booking (ID: ${booking._id}) has been APPROVED. Please visit the storage center for container allocation.`);
        }

        res.status(200).json({ message: `Booking ${status.toLowerCase()} successfully`, booking });
    } catch (error) {
        res.status(500).json({ message: 'Failed to update status', error: error.message });
    }
});

module.exports = router;
