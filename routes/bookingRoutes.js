const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");
const { getAllBookings, updateBookingStatus } = require("../controllers/bookingController");
const authMiddleware = require("../middleware/authMiddleware");
const Booking = require("../models/Booking");

// 🆕 Public route: Nurse booking form (no login required)
router.post("/nurse", async (req, res) => {
  try {
    const {
      nurseType,
      shift,
      email,
      phone,
      street,
      city,
      state,
      zip,
      date,
      notes,
    } = req.body;

    const fullAddress = `${street}, ${city}, ${state} - ${zip}`;

    const booking = new Booking({
      serviceType: "nurse",
      nurseType,
      shift,
      email,
      phone,
      address: fullAddress,
      date,
      notes,
      status: "pending",
    });

    await booking.save();

    // Send email
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      bcc: process.env.ADMIN_EMAIL,
      subject: "Your Nurse Booking Confirmation",
      html: `
        <h2>Thanks for booking with ZollowUp</h2>
        <p>Your nurse service request has been received successfully. Here are the details:</p>
        <ul>
          <li><strong>Nurse Type:</strong> ${nurseType}</li>
          <li><strong>Preferred Shift:</strong> ${shift}</li>
          <li><strong>Date & Time:</strong> ${new Date(date).toLocaleString()}</li>
          <li><strong>Phone:</strong> ${phone}</li>
          <li><strong>Email:</strong> ${email}</li>
          <li><strong>Address:</strong> ${fullAddress}</li>
          <li><strong>Additional Notes:</strong> ${notes || "N/A"}</li>
        </ul>
        <p style="margin-top:1rem">✅ Our team will contact you shortly. Thank you for trusting ZollowUp.</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.status(201).json({
      success: true,
      message: "Nurse booking submitted and email sent",
      data: booking,
    });
  } catch (error) {
    console.error("Error submitting nurse booking:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// 🛡️ Admin route: view all nurse bookings
router.get("/nurse/admin", authMiddleware, async (req, res) => {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ message: "Access denied" });
  }

  const nurseBookings = await Booking.find({ serviceType: "nurse" }).sort({ createdAt: -1 });
  res.json(nurseBookings);
});

// ✅ Get all bookings (admin)
router.get("/", authMiddleware, getAllBookings);

// ✅ Create a new booking (real-time broadcast)
router.post("/", authMiddleware, async (req, res) => {
  try {
    const newBooking = new Booking(req.body);
    await newBooking.save();

    const io = req.app.get("io");
    io.emit("booking_update", newBooking);

    res.status(201).json({ success: true, data: newBooking });
  } catch (error) {
    console.error("❌ Booking Save Failed:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✅ Update booking status
router.patch("/bookings/:id/status", updateBookingStatus);

module.exports = router;
