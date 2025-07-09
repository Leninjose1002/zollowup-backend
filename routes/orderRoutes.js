// routes/orderRoutes.js
const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const authMiddleware = require("../middleware/authMiddleware");

// Place order
router.post("/", authMiddleware, async (req, res) => {
  const { items, serviceType, totalAmount } = req.body;
  const userId = req.user.userId;

  try {
    const newOrder = new Order({
      userId,
      items,
      serviceType,
      totalAmount,
    });

    await newOrder.save();
    res.status(201).json({ message: "Order placed successfully", order: newOrder });
  } catch (err) {
    console.error("❌ Order save error:", err);
    res.status(500).json({ message: "Failed to save order" });
  }
});


// Get user orders
router.get("/my-orders", authMiddleware, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.userId }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch orders" });
  }
});

module.exports = router;
