const express = require("express");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const Payment = require("../models/Payment");
const Booking = require("../models/Booking");
const router = express.Router();

// Initialize Razorpay instance with credentials
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ✅ Route to create a Razorpay order
router.post("/create-order", async (req, res) => {
  const { amount } = req.body; // amount should be in paise

  console.log("📩 Incoming create-order request. Amount:", amount);
  console.log("🔑 Razorpay Key ID:", process.env.RAZORPAY_KEY_ID);

  if (!amount || isNaN(amount)) {
    return res.status(400).json({ message: "Amount is required and must be a number" });
  }

  try {
    const order = await razorpay.orders.create({
      amount, // Amount should already be in paise (frontend sends amount * 100)
      currency: "INR",
      receipt: "receipt_order_" + Date.now(),
    });

    console.log("✅ Razorpay order created:", order);

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error("❌ Razorpay Error:", err);
    res.status(500).json({ message: "Failed to create order" });
  }
});

// ✅ Route to verify Razorpay payment and store booking
// ✅ Route to verify Razorpay payment and store booking
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
    // ✅ Validate userId
    if (!userId) {
      console.error("❌ userId is missing from request.");
      return res.status(400).json({ message: "userId is required for saving payment." });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.error("❌ Invalid userId format:", userId);
      return res.status(400).json({ message: "Invalid userId format." });
    }

    // ✅ Generate expected signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    const verified = expectedSignature === razorpay_signature;

    // ✅ Log for debugging
    console.log("🔍 Payment Verification Debug:");
    console.log("Order ID:", razorpay_order_id);
    console.log("Payment ID:", razorpay_payment_id);
    console.log("Signature:", razorpay_signature);
    console.log("Expected Signature:", expectedSignature);
    console.log("Signature Verified:", verified);

    // ✅ Save payment record
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

    if (verified) {
      // ✅ Save booking only if payment is verified
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
        message: "Payment verified & booking saved",
        verified: true,
      });
    } else {
      return res.status(400).json({
        message: "Payment verification failed",
        verified: false,
      });
    }
  } catch (error) {
    console.error("❌ Verification or DB error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});


module.exports = router;
