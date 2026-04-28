const bcrypt = require("bcrypt");
const crypto = require("crypto");
const User = require("../models/User");
const sendEmail = require("../utils/sendEmail");

// ✅ Create New User (Signup)
exports.createUser = async (req, res) => {
  console.log("📨 Received signup request:", req.body);

  const { name, password } = req.body;
  const email = req.body.email?.trim().toLowerCase();

  try {
    // 🔒 Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered." });
    }

    // 🔐 Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 🔑 Generate verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");

    // 📦 Create new user
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      verificationToken,
      emailVerified: false,
    });

    // 💾 Save to DB
    await newUser.save();
    console.log("✅ User saved to DB:", newUser.email);

    // 🌐 Verification URL
    
const verificationUrl = `${process.env.FRONTEND_BASE_URL}/verify-email/${verificationToken}`;

    // 📧 Email content
    const html = `
      <h2>Verify your ZollowUp account</h2>
      <p>Click the link below to verify your email:</p>
      <a href="${verificationUrl}">${verificationUrl}</a>
      <p>This link will expire after it's used.</p>
    `;

    // ✉️ Send email
    await sendEmail(email, "Verify your email", html);
    console.log("📧 Verification email sent to:", email);

    res.status(201).json({
      message: "Signup successful! Please check your email to verify your account.",
    });
  } catch (error) {
    console.error("❌ Server error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ Get All Users (Admin or Debug)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    console.error("❌ Error fetching users:", error.message);
    res.status(500).json({ message: "Server Error" });
  }
};

// ✅ Update Profile (User)
exports.updateProfile = async (req, res) => {
  const userId = req.user?.userId;
  const { name, phone, address } = req.body;

  try {
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { name, phone, address },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ user: updatedUser });
  } catch (err) {
    console.error("❌ Update profile error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};
