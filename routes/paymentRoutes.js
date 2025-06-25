const express = require("express");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const mongoose = require("mongoose"); // ✅ Added this
const Payment = require("../models/Payment");
const Booking = require("../models/Booking");

const router = express.Router();

// ✅ Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ✅ Create Razorpay Order
router.post("/create-order", async (req, res) => {
  const { amount } = req.body;

  console.log("📩 Incoming create-order request. Amount:", amount);

  if (!amount || isNaN(amount)) {
    return res.status(400).json({ message: "Amount is required and must be a number" });
  }

  try {
    const order = await razorpay.orders.create({
      amount, // Amount in paise
      currency: "INR",
      receipt: `receipt_order_${Date.now()}`,
    });

    console.log("✅ Razorpay order created:", order);

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error("❌ Razorpay Order Creation Error:", err);
    res.status(500).json({ message: "Failed to create order" });
  }
});

// ✅ Verify Razorpay Payment & Save Booking
router.post("/verify-payment", async (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    amount,
    currency,
    userId,
    bookingPayload,
  } = req.body;

  try {
    // ✅ Validate user ID
    if (!userId) {
      return res.status(400).json({ message: "User ID is required for payment verification." });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID format." });
    }

    // ✅ Signature Verification
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    const verified = expectedSignature === razorpay_signature;

    // ✅ Debug logs
    console.log("🔍 Payment Verification Debug:");
    console.log("Order ID:", razorpay_order_id);
    console.log("Payment ID:", razorpay_payment_id);
    console.log("Signature:", razorpay_signature);
    console.log("Expected Signature:", expectedSignature);
    console.log("Signature Verified:", verified);

    // ✅ Save Payment Record
    const payment = new Payment({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
      verified,
      amount,
      currency,
      userId,
    });

    await payment.save();

    if (!verified) {
      return res.status(400).json({
        message: "Payment verification failed",
        verified: false,
      });
    }

    // ✅ Save Booking
    const booking = new Booking({
      ...bookingPayload,
      user: userId,
      status: "confirmed",
      payment: {
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        amount,
        currency,
        verified: true,
      },
    });

    await booking.save();

    return res.status(200).json({
      message: "✅ Payment verified and booking saved.",
      verified: true,
    });
  } catch (error) {
    console.error("❌ Error in payment verification route:", error);
    return res.status(500).json({ message: "Internal server error during payment verification." });
  }
});

module.exports = router;
