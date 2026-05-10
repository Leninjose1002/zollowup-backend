const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");
const { getAllBookings, updateBookingStatus } = require("../controllers/bookingController");
const authMiddleware = require("../middleware/authMiddleware");
const Booking = require("../models/Booking");

// 🆕 Public route: Nurse booking form (no login required)
router.post("/nurse", async (req, res) => {
  try {
    console.log("📥 Incoming nurse booking:", req.body);

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

    if (!email || !phone || !nurseType || !shift) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

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
<h2>Thank You for Booking with ZollowUp</h2>
       <p>Your nurse service request has been received successfully.</p>
<p>Our team will contact you shortly with the price quotes.</p>

        <ul>
          <li><strong>Nurse Type:</strong> ${nurseType}</li>
          <li><strong>Shift:</strong> ${shift}</li>
          <li><strong>Date:</strong> ${new Date(date).toLocaleString()}</li>
          <li><strong>Phone:</strong> ${phone}</li>
          <li><strong>Email:</strong> ${email}</li>
          <li><strong>Address:</strong> ${fullAddress}</li>
          <li><strong>Notes:</strong> ${notes || "N/A"}</li>
        </ul>
      `,
    };

    console.log("📤 Sending mail to:", email);

    await transporter.sendMail(mailOptions);

    res.status(201).json({
      success: true,
      message: "Nurse booking submitted successfully",
      data: booking,
    });
  } catch (error) {
    console.error("❌ Nurse booking failed:", error);
    res.status(500).json({
      success: false,
      message: "Server error during nurse booking",
      error: error.message,
    });
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

    // ✅ If booking is for a maid, update maid status
    if (newBooking.serviceType === "maid" && newBooking.maidId) {
      await Maid.findByIdAndUpdate(newBooking.maidId, { status: "Booked" });
    }

    const io = req.app.get("io");
    io.emit("booking_update", newBooking);

    res.status(201).json({ success: true, data: newBooking });
  } catch (error) {
    console.error("❌ Booking Save Failed:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✅ Update booking status
// router.patch("/bookings/:id/status", updateBookingStatus);
// ✅ Update booking status
router.patch("/:id/status", async (req, res) => {
  const { status } = req.body;
  try {
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    res.json({ message: "Status updated", booking });
  } catch (error) {
    res.status(500).json({ message: "Error updating status", error });
  }
});

// 🆕 Public route: Chef booking form (no login required)
router.post("/chef", async (req, res) => {
  try {
    const {
      name,
      phone,
      email,
      street,
      city,
      state,
      zip,
      date,
      time,
      guests,
      category,
      occasion,
      cuisine,
      utensils,
      serviceType,
      notes,
    } = req.body;

    const fullAddress = `${street}, ${city}, ${state} - ${zip}`;

    const booking = new Booking({
      serviceType: "chef",
      name,
      phone,
      email,
      address: fullAddress,
      date: `${date} ${time}`,
      notes,
      // Custom fields can be saved under notes or extended model if needed
      notes: `Occasion: ${occasion || "N/A"}, Guests: ${guests}, Category: ${category}, Cuisine: ${cuisine}, Utensils: ${utensils ? "Yes" : "No"}, Service Type: ${serviceType}. Notes: ${notes || "N/A"}`
    });

    await booking.save();

    // 📧 Send email confirmation
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
      subject: "Your Chef Booking Confirmation",
      html: `
<h2>Thank You for Booking with ZollowUp</h2>
        <p>Your chef service request has been received successfully. Here are the details:</p>
        <ul>
          <li><strong>Name:</strong> ${name}</li>
          <li><strong>Date & Time:</strong> ${new Date(`${date}T${time}`).toLocaleString()}</li>
          <li><strong>Phone:</strong> ${phone}</li>
          <li><strong>Email:</strong> ${email}</li>
          <li><strong>Address:</strong> ${fullAddress}</li>
          <li><strong>No. of Guests:</strong> ${guests}</li>
          <li><strong>Category:</strong> ${category}</li>
          <li><strong>Occasion:</strong> ${occasion}</li>
          <li><strong>Cuisine:</strong> ${cuisine}</li>
          <li><strong>Need Utensils:</strong> ${utensils ? "Yes" : "No"}</li>
          <li><strong>Service Type:</strong> ${serviceType}</li>
          <li><strong>Additional Notes:</strong> ${notes || "N/A"}</li>
        </ul>
        <p style="margin-top:1rem">✅ Our team will contact you shortly. Thank you for trusting ZollowUp.</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.status(201).json({
      success: true,
      message: "Chef booking submitted and email sent",
      data: booking,
    });
  } catch (error) {
    console.error("Error submitting chef booking:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// 🆕 Generic Booking for Other Services
router.post("/:serviceType", async (req, res) => {
  const { serviceType } = req.params;
  const {
    name,
    email,
    phone,
    address,
    date,
    time,
    notes,
  } = req.body;

  const fullAddress = address || "Not provided";
  const fullDateTime = time ? `${date} ${time}` : date;

  if (!email || !phone || !date || !serviceType) {
    return res.status(400).json({ success: false, message: "Missing required fields" });
  }

  try {
    const booking = new Booking({
      serviceType,
      name,
      email,
      phone,
      address: fullAddress,
      date: fullDateTime,
      notes,
      status: "pending",
    });

    await booking.save();

    // ✅ Email confirmation setup
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
      subject: `Your ${serviceType} Booking Confirmation`,
      html: `
        <h2>Thank You for Booking with ZollowUp</h2>
        <p>Your <strong>${serviceType}</strong> service request has been received successfully.</p>
        <ul>
          <li><strong>Name:</strong> ${name}</li>
          <li><strong>Phone:</strong> ${phone}</li>
          <li><strong>Email:</strong> ${email}</li>
          <li><strong>Date & Time:</strong> ${new Date(fullDateTime).toLocaleString()}</li>
          <li><strong>Address:</strong> ${fullAddress}</li>
          <li><strong>Service Type:</strong> ${serviceType}</li>
          <li><strong>Notes:</strong> ${notes || "N/A"}</li>
        </ul>
        <p>✅ Our team will contact you shortly with price quotes.</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.status(201).json({
      success: true,
      message: `${serviceType} booking submitted and email sent`,
      data: booking,
    });
  } catch (error) {
    console.error(`❌ Error creating ${serviceType} booking:`, error);
    res.status(500).json({
      success: false,
      message: `Server error while booking ${serviceType}`,
    });
  }
});

module.exports = router;
