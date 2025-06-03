const express = require("express");
const router = express.Router();
const ChatMessage = require("../models/ChatMessage");

// 🧪 Test route to confirm saving works (can be removed)
router.get("/test-save", async (req, res) => {
  try {
    const saved = await ChatMessage.create({
      sender: "test",
      receiver: "admin",
      message: "hello from test route",
    });
    console.log("✅ Test message saved:", saved);
    res.json({ success: true, saved });
  } catch (err) {
    console.error("❌ Failed to save test message:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ✅ Real route: Get all messages for a user
router.get("/:username", async (req, res) => {
  try {
    const username = req.params.username;

    const messages = await ChatMessage.find({
      $or: [{ sender: username }, { receiver: username }],
    }).sort({ createdAt: 1 });

    res.json(messages); // ✅ returns an array
  } catch (err) {
    console.error("❌ Error fetching chat history:", err.message);
    res.status(500).json([]);
  }
});

// GET all chat messages (admin only)
router.get("/", async (req, res) => {
  try {
    const messages = await ChatMessage.find().sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
