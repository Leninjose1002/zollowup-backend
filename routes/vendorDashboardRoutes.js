const express = require("express");
const Razorpay = require("razorpay");
const Employee = require("../models/Employee");
const Booking = require("../models/Booking");
const Payment = require("../models/Payment");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

console.log("✅ vendorDashboardRoutes.js loaded");

// =============== DASHBOARD OVERVIEW ===============

// 📊 GET vendor dashboard overview
// GET /api/vendor/dashboard
router.get("/dashboard", authMiddleware, async (req, res) => {
  try {
    const employee = await Employee.findById(req.user.userId);

    if (!employee) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    const dashboardData = {
      vendor: {
        id: employee._id,
        name: employee.name,
        businessName: employee.businessName,
        email: employee.email,
        profileImage: employee.profileImage,
        averageRating: employee.averageRating,
      },
      stats: {
        totalEarnings: employee.totalEarnings,
        availableBalance: employee.availableBalance,
        pendingBalance: employee.pendingBalance,
        totalBookings: employee.totalBookings,
        completedBookings: employee.completedBookings,
        averageRating: employee.averageRating,
        totalReviews: employee.reviewCount,
      },
      paymentMethods: {
        hasRazorpay: !!employee.razorpayCustomerId,
        hasBankDetails: !!(employee.bankDetails?.accountNumber),
        hasUpi: !!employee.upiId,
        preferredMethod: employee.preferredPaymentMethod,
      },
    };

    res.json(dashboardData);
  } catch (error) {
    console.error("❌ Error fetching dashboard:", error);
    res.status(500).json({ message: "Error fetching dashboard data" });
  }
});

// =============== EARNINGS & BALANCE ===============

// 💰 GET vendor earnings summary
// GET /api/vendor/earnings
router.get("/earnings", authMiddleware, async (req, res) => {
  try {
    const employee = await Employee.findById(req.user.userId);

    if (!employee) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    const earningsSummary = {
      totalEarnings: employee.totalEarnings,
      availableBalance: employee.availableBalance,
      pendingBalance: employee.pendingBalance,
      lastPayout: null, // Will be fetched from Payment model
      nextPayoutDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Example: Next week
    };

    res.json(earningsSummary);
  } catch (error) {
    console.error("❌ Error fetching earnings:", error);
    res.status(500).json({ message: "Error fetching earnings" });
  }
});

// 📈 GET earnings breakdown (by month/year)
// GET /api/vendor/earnings-breakdown?period=monthly
router.get("/earnings-breakdown", authMiddleware, async (req, res) => {
  try {
    const { period = "monthly" } = req.query;
    const employee = await Employee.findById(req.user.userId);

    if (!employee) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    // Fetch bookings for this vendor and calculate earnings by period
    const bookings = await Booking.find({ vendorId: employee._id, status: "completed" });

    // Group earnings by period
    const breakdown = {};

    bookings.forEach((booking) => {
      const date = new Date(booking.completedAt || booking.createdAt);
      let key;

      if (period === "monthly") {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      } else if (period === "yearly") {
        key = date.getFullYear().toString();
      } else {
        key = date.toISOString().split("T")[0]; // daily
      }

      if (!breakdown[key]) {
        breakdown[key] = 0;
      }
      breakdown[key] += booking.vendorEarnings || 0;
    });

    res.json({
      period,
      breakdown,
      total: employee.totalEarnings,
    });
  } catch (error) {
    console.error("❌ Error fetching earnings breakdown:", error);
    res.status(500).json({ message: "Error fetching earnings breakdown" });
  }
});

// =============== RAZORPAY INTEGRATION ===============

// 🔵 Create Razorpay Customer (if not exists)
// POST /api/vendor/setup-razorpay
router.post("/setup-razorpay", authMiddleware, async (req, res) => {
  try {
    const employee = await Employee.findById(req.user.userId);

    if (!employee) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    // If already has Razorpay customer, return it
    if (employee.razorpayCustomerId) {
      return res.json({
        message: "Razorpay already configured",
        razorpayCustomerId: employee.razorpayCustomerId,
      });
    }

    // Create new Razorpay customer
    const customer = await razorpay.customers.create({
      name: employee.businessName,
      email: employee.email,
      contact: employee.phone,
    });

    employee.razorpayCustomerId = customer.id;
    employee.preferredPaymentMethod = "razorpay";
    await employee.save();

    res.json({
      message: "Razorpay customer created successfully",
      razorpayCustomerId: customer.id,
    });
  } catch (error) {
    console.error("❌ Error setting up Razorpay:", error);
    res.status(500).json({ message: "Error setting up Razorpay" });
  }
});

// =============== BANK DETAILS & PAYMENT METHODS ===============

// 🏦 UPDATE bank details
// PUT /api/vendor/bank-details
router.put("/bank-details", authMiddleware, async (req, res) => {
  try {
    const { accountHolderName, accountNumber, ifscCode, bankName } = req.body;

    if (!accountHolderName || !accountNumber || !ifscCode || !bankName) {
      return res.status(400).json({ msg: "All bank details are required" });
    }

    const employee = await Employee.findById(req.user.userId);

    if (!employee) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    employee.bankDetails = {
      accountHolderName,
      accountNumber,
      ifscCode,
      bankName,
    };
    employee.preferredPaymentMethod = "bank";

    await employee.save();

    res.json({
      message: "Bank details updated successfully",
      bankDetails: employee.bankDetails,
    });
  } catch (error) {
    console.error("❌ Error updating bank details:", error);
    res.status(500).json({ message: "Error updating bank details" });
  }
});

// 💳 UPDATE UPI details
// PUT /api/vendor/upi
router.put("/upi", authMiddleware, async (req, res) => {
  try {
    const { upiId } = req.body;

    if (!upiId) {
      return res.status(400).json({ msg: "UPI ID is required" });
    }

    const employee = await Employee.findById(req.user.userId);

    if (!employee) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    employee.upiId = upiId;
    employee.preferredPaymentMethod = "upi";

    await employee.save();

    res.json({
      message: "UPI details updated successfully",
      upiId: employee.upiId,
    });
  } catch (error) {
    console.error("❌ Error updating UPI details:", error);
    res.status(500).json({ message: "Error updating UPI details" });
  }
});

// =============== PAYOUTS ===============

// 💸 Request payout
// POST /api/vendor/request-payout
router.post("/request-payout", authMiddleware, async (req, res) => {
  try {
    const { amount, paymentMethod } = req.body;

    const employee = await Employee.findById(req.user.userId);

    if (!employee) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    if (!paymentMethod || !employee[paymentMethod === "razorpay" ? "razorpayCustomerId" : paymentMethod === "bank" ? "bankDetails" : "upiId"]) {
      return res.status(400).json({ msg: "Payment method not configured" });
    }

    if (amount > employee.availableBalance) {
      return res.status(400).json({ msg: "Insufficient balance" });
    }

    // Create payout record
    const payment = new Payment({
      vendorId: employee._id,
      amount,
      type: "payout",
      method: paymentMethod,
      status: "pending",
      razorpayPayoutId: null,
    });

    await payment.save();

    // Update vendor balance
    employee.availableBalance -= amount;
    employee.pendingBalance += amount;
    await employee.save();

    // TODO: Integrate with Razorpay payout API if using Razorpay

    res.json({
      message: "Payout request submitted successfully",
      payoutId: payment._id,
      status: "pending",
    });
  } catch (error) {
    console.error("❌ Error requesting payout:", error);
    res.status(500).json({ message: "Error requesting payout" });
  }
});

// 📋 GET payout history
// GET /api/vendor/payouts
router.get("/payouts", authMiddleware, async (req, res) => {
  try {
    const payouts = await Payment.find({
      vendorId: req.user.userId,
      type: "payout",
    }).sort({ createdAt: -1 });

    res.json(payouts);
  } catch (error) {
    console.error("❌ Error fetching payouts:", error);
    res.status(500).json({ message: "Error fetching payouts" });
  }
});

// =============== BOOKINGS ===============

// 📅 GET vendor bookings
// GET /api/vendor/bookings?status=pending
router.get("/bookings", authMiddleware, async (req, res) => {
  try {
    const { status, limit = 20, page = 1 } = req.query;
    const skip = (page - 1) * limit;

    let query = { vendorId: req.user.userId };
    if (status) query.status = status;

    const bookings = await Booking.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Booking.countDocuments(query);

    res.json({
      bookings,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("❌ Error fetching bookings:", error);
    res.status(500).json({ message: "Error fetching bookings" });
  }
});

// =============== REVIEWS & RATINGS ===============

// ⭐ GET vendor reviews
// GET /api/vendor/reviews
router.get("/reviews", authMiddleware, async (req, res) => {
  try {
    const employee = await Employee.findById(req.user.userId);

    if (!employee) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    const Review = require("../models/Review");
    const reviews = await Review.find({ vendorId: employee._id })
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({
      averageRating: employee.averageRating,
      totalReviews: employee.reviewCount,
      reviews,
    });
  } catch (error) {
    console.error("❌ Error fetching reviews:", error);
    res.status(500).json({ message: "Error fetching reviews" });
  }
});

module.exports = router;
