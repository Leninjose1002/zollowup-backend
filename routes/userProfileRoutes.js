const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const User = require("../models/User");
const {
  updateUserProfile,
  updateProfile,
} = require("../controllers/userController");

const router = express.Router();

// ✅ Get logged-in user's profile (used in AuthContext + Referral Dashboard)
// ✅ GET /api/users/me
router.get("/me", authMiddleware, async (req, res) => {
  console.log("🔥 /me route HIT with userId:", req.user.userId);

  try {
    const user = await User.findById(req.user.userId);

    if (!user) {
      console.log("❌ User not found");
      return res.status(404).json({ message: "User not found" });
    }

    // Count how many people used this user's referral code
    const referralCount = await User.countDocuments({
      referredBy: user.referralCode,
    });

    // Debug full object
    console.log("📤 Sending user details:", {
      _id: user._id,
      name: user.name,
      referralCode: user.referralCode,
      referredBy: user.referredBy,
      referralCount,
    });

    res.json({
      _id: user._id,
      name: user.name || "User",
      email: user.email || "-",
      address: user.address || "-",
      phone: user.phone || "-",
      isAdmin: user.isAdmin || false,
      passwordNotSet: !user.password,

      referralCode: user.referralCode || "",
      referredBy: user.referredBy || "",
      referralCount: referralCount || 0,
    });
  } catch (err) {
    console.error("❌ Error in /me route:", err);
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

// ✅ Update account details (via email)
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

// ✅ Update profile via token
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
