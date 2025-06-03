const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const User = require("../models/User");
const {
  updateUserProfile,
  updateProfile,
} = require("../controllers/userController");

const router = express.Router();

// ✅ Add this: Get logged-in user's profile (used in AuthContext)
router.get("/me", authMiddleware, async (req, res) => {
  console.log("🔐 req.user =", req.user); // ✅ for debug
  try {
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      _id: user._id,
      name: user.name || "User", // ✅ fallback name
      email: user.email || "-",
      address: user.address || "-", // ✅ include if available
      phone: user.phone || "-",     // ✅ include if available
      isAdmin: user.isAdmin || false,
      passwordNotSet: !user.password,
    });
  } catch (err) {
    console.error("Error in /me route:", err);
    res.status(500).json({ message: "Server error" });
  }
});





// ✅ Get all users (Protected)
router.get("/", authMiddleware, async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
});

// ✅ Get user by ID
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
});

// ✅ Update account details
router.put("/account-details/:email", authMiddleware, async (req, res) => {
  const { email } = req.params;
  const { name, altMobile, altHint } = req.body;

  try {
    const updatedUser = await User.findOneAndUpdate(
      { email },
      { $set: { name, altMobile, altHint } },
      { new: true }
    );
    if (!updatedUser) return res.status(404).json({ message: "User not found" });

    res.status(200).json({ message: "Account details updated", user: updatedUser });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});
// ✅ Secure update by token (used in dashboard Edit Profile)
router.put("/update-profile", authMiddleware, updateProfile, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const { name, photo, newPassword } = req.body;

    if (name) user.name = name;
    if (photo) user.photo = photo;

    if (newPassword) {
      const bcrypt = require("bcryptjs");
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
    }

    await user.save();

    res.status(200).json({
      message: "Profile updated successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        photo: user.photo || "",
      },
    });
  } catch (err) {
    console.error("Profile update error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


module.exports = router;
