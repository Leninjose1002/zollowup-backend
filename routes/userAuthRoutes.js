// 📁 routes/userAuthRoutes.js
const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const User = require("../models/User");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");

// Nodemailer setup
const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendVerificationEmail = async (email, token) => {
  const url = `https://zollowupdemo.vercel.app/verify-email/${token}`; // ✅ production URL
  const html = `<p>Click <a href="${url}">here</a> to verify your email.</p>`;

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Email Verification',
    html,
  });
};

// POST /api/users/register
router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ msg: "All fields required" });

  const existing = await User.findOne({ email });
  if (existing) return res.status(400).json({ msg: "User already exists" });

  const hashedPassword = await bcrypt.hash(password, 10);
  const token = crypto.randomBytes(20).toString("hex");

  const user = new User({ name, email, password: hashedPassword, verificationToken: token, isVerified: false });
  await user.save();

  try {
    await sendVerificationEmail(email, token);
    res.status(201).json({ msg: "Registered! Check your email to verify." });
  } catch (err) {
    res.status(500).json({ msg: "Failed to send verification email" });
  }
});

// POST /api/users/resend-verification
router.post("/resend-verification", async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ msg: "User not found." });
    }

    if (user.emailVerified) {
      return res.status(400).json({ msg: "Email already verified." });
    }

    // Generate a new token
    const newToken = crypto.randomBytes(32).toString("hex");
    user.verificationToken = newToken;
    await user.save();

    // Build verification URL
    const verificationUrl = `https://zollowupdemo.vercel.app/verify-email/${newToken}`;

    // Send email
    await sendEmail({
      to: user.email,
      subject: "Resend: Verify your ZollowUp account",
      html: `<p>Please click the link below to verify your email:</p><a href="${verificationUrl}">${verificationUrl}</a>`,
    });

    res.status(200).json({ msg: "Verification email resent!" });
  } catch (err) {
    console.error("❌ Resend error:", err);
    res.status(500).json({ msg: "Server error. Try again later." });
  }
});



// POST /api/users/login

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user) return res.status(400).json({ message: "User not found" });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(401).json({ message: "Invalid password" });
  if (!user.emailVerified) return res.status(403).json({ message: "Please verify your email first." });

  const token = jwt.sign(
    {
      userId: user._id,
      userType: user.userType || "user", // optional fallback
      isAdmin: user.isAdmin || false,
    },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );

  // ✅ Send token as cookie
 res.cookie("token", token, {
  httpOnly: true,
  secure: true, // ✅ force true even in dev (needed for cross-origin cookies)
  sameSite: "None", // ✅ very important for Vercel <-> Render communication
  maxAge: 60 * 60 * 1000, // 1 hour
});


  res.status(200).json({
  message: "Login successful",
  user: {
    id: user._id,
    name: user.name,
    email: user.email,
    isAdmin: user.isAdmin || false,
  },
});

});

// POST /api/users/logout
router.post("/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  res.status(200).json({ message: "Logged out successfully" });
});

// Set password after Google Sign-In
// POST /api/users/set-password
router.post("/set-password", authMiddleware, async (req, res) => {
  console.log("📥 Received set-password request");

  const { password } = req.body;

  if (!password || password.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters." });
  }

  const user = await User.findById(req.user.userId); // ✅ fixed here
  if (!user) return res.status(404).json({ message: "User not found" });

  user.password = await bcrypt.hash(password, 10);
  await user.save();

  res.json({
    _id: user._id,
    name: user.name,
    email: user.email,
    passwordNotSet: false, // ✅ frontend uses this
  });
});


module.exports = router;