// ✅ routes/paymentRoutes.js
const express = require("express");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const Payment = require("../models/Payment");
const Booking = require("../models/Booking");
const router = express.Router();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

router.post("/create-order", async (req, res) => {
  const { amount } = req.body;

  try {
    const order = await razorpay.orders.create({
      amount: amount * 100,
      currency: "INR",
      receipt: "receipt_order_" + Math.random(),
    });

    res.json({ orderId: order.id, amount: order.amount, currency: order.currency });
  } catch (err) {
    console.error("Razorpay Error:", err);
    res.status(500).json({ message: "Failed to create order" });
  }
});


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

  const body = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body.toString())
    .digest("hex");

  const verified = expectedSignature === razorpay_signature;

  const payment = new Payment({
    orderId: razorpay_order_id,
    paymentId: razorpay_payment_id,
    signature: razorpay_signature,
    verified,
    amount,
    currency,
    userId,
      key: process.env.RAZORPAY_KEY_ID // ✅ Add this

  });
  await payment.save();

  if (verified) {
    const booking = new Booking({
      ...bookingPayload,
      user: userId,
      status: "confirmed", // ✅ Automatically confirmed after successful payment
      payment: {
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        amount,
        currency,
        verified: true,
      },
    });
    await booking.save();
    return res.status(200).json({ message: "Payment verified & booking saved", verified: true });
  } else {
    return res.status(400).json({ message: "Payment verification failed", verified: false });
  }
});

module.exports = router;