// 📁 routes/userAuthRoutes.js

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
  host: 'smtp.hostinger.com',  // Hostinger SMTP
  port: 465,                    // or 587
  secure: true, 
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

console.log("🔍 FRONTEND_BASE_URL loaded as:", process.env.FRONTEND_BASE_URL);

// 🔁 Use dynamic frontend base URL (for local/dev/prod)
const FRONTEND_BASE_URL = process.env.FRONTEND_BASE_URL || "http://localhost:3000";

// Send email verification link
const sendVerificationEmail = async (email, token) => {
  const url = `${FRONTEND_BASE_URL}/verify-email/${token}`;
  const html = `<p>Click <a href="${url}">here</a> to verify your email.</p>`;

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Verify Your Zollowup Account',
    html,
  });
};

// ✅ Register User
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, referredBy } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ msg: "All fields required" });
    }

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ msg: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ Dynamic import for nanoid (fixes ES Module issue on Vercel)
    const { nanoid } = await import('nanoid');
    const referralCode = nanoid(8);

    const user = new User({
      name,
      email,
      password: hashedPassword,
      emailVerified: false,
      referralCode,
      referredBy: referredBy || null,
    });

    await user.save();

    try {

      // 🔍 ADD THIS DEBUG LOG HERE
      console.log("📧 Email config:", {
        emailUser: process.env.EMAIL_USER,
        emailPass: process.env.EMAIL_PASS ? "***SET***" : "EMPTY",
        frontendUrl: FRONTEND_BASE_URL
      });

      // ✅ Generate email verification token using JWT
      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

      // ✅ Send the verification email with this JWT token
      await sendVerificationEmail(email, token);

      res.status(201).json({ msg: "Registered! Check your email to verify." });
    } catch (err) {
      console.error("Email error:", err.message); 
      res.status(500).json({ msg: "Failed to send verification email" });
    }
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ msg: "Server error during registration" });
  }
});


// ✅ Resend Verification Email
router.post("/resend-verification", async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ msg: "User not found." });
    if (user.emailVerified) return res.status(400).json({ msg: "Email already verified." });

    const newToken = crypto.randomBytes(32).toString("hex");
    user.verificationToken = newToken;
    await user.save();

    console.log("🔍 DEBUG - FRONTEND_BASE_URL:", process.env.FRONTEND_BASE_URL);

    const verificationUrl = `${FRONTEND_BASE_URL}/verify-email/${newToken}`;

    console.log("🔍 DEBUG - Final verification URL:", verificationUrl);

    const html = `<p>Please click the link below to verify your email:</p><a href="${verificationUrl}">${verificationUrl}</a>`;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "Resend: Verify your ZollowUp account",
      html,
    });

    res.status(200).json({ msg: "Verification email resent!" });
  } catch (err) {
    console.error("❌ Resend error:", err);
    res.status(500).json({ msg: "Server error. Try again later." });
  }
});

// ✅ Verify Email
router.get("/verify-email/:token", async (req, res) => {
  const { token } = req.params;
  console.log("🔍 Verifying token:", token);

  try {
    // Decode token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch user by ID
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    if (user.emailVerified) {
      console.log("ℹ️ Email already verified for:", user.email);
      return res.status(200).json({ msg: "Email already verified." });
    }

    // Update status
    user.emailVerified = true;
    await user.save();

    console.log("✅ Email verified for:", user.email);
    return res.status(200).json({ msg: "Email verified successfully!" });

  } catch (err) {
    console.error("❌ Verification error:", err);
    return res.status(400).json({ msg: "Invalid or expired verification link." });
  }
});




// ✅ Login User
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
      userType: user.userType || "user",
      isAdmin: user.isAdmin || false,
    },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );

  res.cookie("token", token, {
    httpOnly: true,
    secure: true,
    sameSite: "None",
    maxAge: 60 * 60 * 1000,
  });

  res.status(200).json({
    message: "Login successful",
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone || "",
      address: user.address || "",
      isAdmin: user.isAdmin || false,
    },
  });
});

// ✅ Logout User
router.post("/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  res.status(200).json({ message: "Logged out successfully" });
});

// ✅ Set Password (after Google Sign-In)
router.post("/set-password", authMiddleware, async (req, res) => {
  const { password } = req.body;
  if (!password || password.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters." });
  }

  const user = await User.findById(req.user.userId);
  if (!user) return res.status(404).json({ message: "User not found" });

  user.password = await bcrypt.hash(password, 10);
  await user.save();

  res.json({
    _id: user._id,
    name: user.name,
    email: user.email,
    passwordNotSet: false,
  });
});

// ✅ Forgot Password - Send reset link
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ msg: "User not found" });

    // Generate reset token
    const resetToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "15m" });

    // Send reset email
    const resetUrl = `${FRONTEND_BASE_URL}/reset-password/${resetToken}`;
    const html = `
      <p>Click the link below to reset your password (expires in 15 minutes):</p>
      <a href="${resetUrl}">Reset Password</a>
    `;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Reset Your ZollowUp Password",
      html,
    });

    res.status(200).json({ msg: "Reset email sent" });
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

// ✅ Reset Password
router.post("/reset-password/:token", async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) return res.status(404).json({ msg: "User not found" });

    user.password = await bcrypt.hash(password, 10);
    await user.save();

    res.status(200).json({ msg: "Password reset successfully" });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(400).json({ msg: "Invalid or expired reset link" });
  }
});

module.exports = router;


// const express = require("express");
// const bcrypt = require("bcrypt");
// const jwt = require("jsonwebtoken");
// const crypto = require("crypto");
// const nodemailer = require("nodemailer");
// const User = require("../models/User");
// const router = express.Router();
// const authMiddleware = require("../middleware/authMiddleware");
// const { nanoid } = require("nanoid");

// // Nodemailer setup
// const transporter = nodemailer.createTransport({
//   service: 'Gmail',
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS,
//   },
// });

// // 🔁 Use dynamic frontend base URL (for local/dev/prod)
// const FRONTEND_BASE_URL = process.env.FRONTEND_BASE_URL || "http://localhost:3000";

// // Send email verification link
// const sendVerificationEmail = async (email, token) => {
//   const url = `${FRONTEND_BASE_URL}/verify-email/${token}`;
//   const html = `<p>Click <a href="${url}">here</a> to verify your email.</p>`;

//   await transporter.sendMail({
//     from: process.env.EMAIL_USER,
//     to: email,
//     subject: 'Email Verification',
//     html,
//   });
// };

// // ✅ Register User
// router.post("/register", async (req, res) => {
//   const { name, email, password, referredBy } = req.body;

//   if (!name || !email || !password) {
//     return res.status(400).json({ msg: "All fields required" });
//   }

//   const existing = await User.findOne({ email });
//   if (existing) return res.status(400).json({ msg: "User already exists" });

//   const hashedPassword = await bcrypt.hash(password, 10);

//   const referralCode = nanoid(8);
//   const user = new User({
//     name,
//     email,
//     password: hashedPassword,
//     isVerified: false,
//     referralCode,
//     referredBy: referredBy || null,
//   });

//   await user.save();

//   try {
//     // ✅ Generate email verification token using JWT
//     const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

//     // ✅ Send the verification email with this JWT token
//     await sendVerificationEmail(email, token);

//     res.status(201).json({ msg: "Registered! Check your email to verify." });
//   } catch (err) {
//     res.status(500).json({ msg: "Failed to send verification email" });
//   }
// });


// // ✅ Resend Verification Email
// router.post("/resend-verification", async (req, res) => {
//   const { email } = req.body;

//   try {
//     const user = await User.findOne({ email });
//     if (!user) return res.status(404).json({ msg: "User not found." });
//     if (user.emailVerified) return res.status(400).json({ msg: "Email already verified." });

//     const newToken = crypto.randomBytes(32).toString("hex");
//     user.verificationToken = newToken;
//     await user.save();

//     const verificationUrl = `${FRONTEND_BASE_URL}/verify-email/${newToken}`;
//     const html = `<p>Please click the link below to verify your email:</p><a href="${verificationUrl}">${verificationUrl}</a>`;

//     await transporter.sendMail({
//       from: process.env.EMAIL_USER,
//       to: user.email,
//       subject: "Resend: Verify your ZollowUp account",
//       html,
//     });

//     res.status(200).json({ msg: "Verification email resent!" });
//   } catch (err) {
//     console.error("❌ Resend error:", err);
//     res.status(500).json({ msg: "Server error. Try again later." });
//   }
// });

// // ✅ Verify Email
// router.get("/verify-email/:token", async (req, res) => {
//   const { token } = req.params;
//   console.log("🔍 Verifying token:", token);

//   try {
//     // Decode token
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);

//     // Fetch user by ID
//     const user = await User.findById(decoded.userId);
//     if (!user) {
//       return res.status(404).json({ msg: "User not found" });
//     }

//     if (user.emailVerified) {
//       console.log("ℹ️ Email already verified for:", user.email);
//       return res.status(200).json({ msg: "Email already verified." });
//     }

//     // Update status
//     user.emailVerified = true;
//     await user.save();

//     console.log("✅ Email verified for:", user.email);
//     return res.status(200).json({ msg: "Email verified successfully!" });

//   } catch (err) {
//     console.error("❌ Verification error:", err);
//     return res.status(400).json({ msg: "Invalid or expired verification link." });
//   }
// });




// // ✅ Login User
// router.post("/login", async (req, res) => {
//   const { email, password } = req.body;
//   const user = await User.findOne({ email });

//   if (!user) return res.status(400).json({ message: "User not found" });

//   const isMatch = await bcrypt.compare(password, user.password);
//   if (!isMatch) return res.status(401).json({ message: "Invalid password" });
//   if (!user.emailVerified) return res.status(403).json({ message: "Please verify your email first." });

//   const token = jwt.sign(
//     {
//       userId: user._id,
//       userType: user.userType || "user",
//       isAdmin: user.isAdmin || false,
//     },
//     process.env.JWT_SECRET,
//     { expiresIn: "1h" }
//   );

//   res.cookie("token", token, {
//     httpOnly: true,
//     secure: true,
//     sameSite: "None",
//     maxAge: 60 * 60 * 1000,
//   });

//   res.status(200).json({
//     message: "Login successful",
//     token,
//     user: {
//       id: user._id,
//       name: user.name,
//       email: user.email,
//        phone: user.phone || "",       // ✅ add phone
//     address: user.address || "",   // ✅ add address
//       isAdmin: user.isAdmin || false,
//     },
//   });
// });

// // ✅ Logout User
// router.post("/logout", (req, res) => {
//   res.clearCookie("token", {
//     httpOnly: true,
//     sameSite: "lax",
//     secure: process.env.NODE_ENV === "production",
//   });
//   res.status(200).json({ message: "Logged out successfully" });
// });

// // ✅ Set Password (after Google Sign-In)
// router.post("/set-password", authMiddleware, async (req, res) => {
//   const { password } = req.body;
//   if (!password || password.length < 6) {
//     return res.status(400).json({ message: "Password must be at least 6 characters." });
//   }

//   const user = await User.findById(req.user.userId);
//   if (!user) return res.status(404).json({ message: "User not found" });

//   user.password = await bcrypt.hash(password, 10);
//   await user.save();

//   res.json({
//     _id: user._id,
//     name: user.name,
//     email: user.email,
//     passwordNotSet: false,
//   });
// });

// module.exports = router;
