const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads in memory (to support Vercel serverless)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Mock Centers Data (moved from frontend logic for server-side serving)
const centersData = [
    { district: "Thanjavur", center_name: "Thanjavur Paddy Storage", available_containers: 120, latitude: 10.7867, longitude: 79.1378, mobile: "9876543210", address: "Thanjavur Main Rd" },
    { district: "Thanjavur", center_name: "Kumbakonam Storage Center", available_containers: 90, latitude: 10.9629, longitude: 79.3845, mobile: "9876543211", address: "Kumbakonam Bypass" },
    { district: "Trichy", center_name: "Trichy Central Storage", available_containers: 100, latitude: 10.7905, longitude: 78.7047, mobile: "9876543212", address: "Trichy Central" },
    { district: "Trichy", center_name: "Srirangam Paddy Storage", available_containers: 70, latitude: 10.862, longitude: 78.693, mobile: "9876543213", address: "Srirangam Temple View" },
    { district: "Madurai", center_name: "Madurai Farmer Storage", available_containers: 110, latitude: 9.9252, longitude: 78.1198, mobile: "9876543214", address: "Madurai North" },
    { district: "Coimbatore", center_name: "Coimbatore Paddy Hub", available_containers: 130, latitude: 11.0168, longitude: 76.9558, mobile: "9876543215", address: "Coimbatore East" },
    { district: "Salem", center_name: "Salem Grain Storage", available_containers: 95, latitude: 11.6643, longitude: 78.146, mobile: "9876543216", address: "Salem Central" },
    { district: "Erode", center_name: "Erode Storage Yard", available_containers: 80, latitude: 11.341, longitude: 77.7172, mobile: "9876543217", address: "Erode South" }
];

// Add a new booking with file upload support
const handleBooking = async (req, res) => {
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

        const name = farmerName || req.body.name;
        const contact = mobileNumber || req.body.contact;
        const land = landArea || req.body.land;
        const paddy = estimatedPaddy || req.body.paddy;
        const cSize = containerSize || req.body.container_size;
        const qty = quantity || req.body.containers_required;

        // Validate required fields
        if (!name || !contact) {
            return res.status(400).json({ message: 'Name and contact are required.' });
        }

        let photoUrl = '';
        if (req.file) {
            const base64Image = req.file.buffer.toString('base64');
            photoUrl = `data:${req.file.mimetype};base64,${base64Image}`;
        }

        const newBooking = new Booking({
            farmerName: name,
            mobileNumber: contact,
            quantity: parseInt(qty) || 0,
            bookingDate: bookingDate ? new Date(bookingDate) : new Date(),
            address: address || '',
            landArea: parseFloat(land) || 0,
            landUnit: landUnit || '',
            containerSize: cSize || '',
            estimatedPaddy: parseInt(paddy) || 0,
            photoUrl: photoUrl,
            status: 'Pending'
        });

        await newBooking.save();
        console.log(`[SMS] To: ${contact} - Dear ${name}, your booking request has been received. ID: ${newBooking._id}`);
        res.status(201).json({ message: 'Booking Submitted Successfully.', booking: newBooking });
    } catch (error) {
        console.error('Error creating booking:', error);
        res.status(500).json({ message: 'Failed to create booking', error: error.message });
    }
};

router.post('/book', upload.single('photo'), handleBooking);
router.post('/bookings', upload.single('photo'), handleBooking); // Alias for script.js

// Get all centers
router.get('/centers', (req, res) => {
    res.status(200).json(centersData);
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
