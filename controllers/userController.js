const bcrypt = require("bcrypt");
const crypto = require("crypto");
const User = require("../models/User");
const sendEmail = require("../utils/sendEmail");

exports.createUser = async (req, res) => {
  console.log("📨 Received signup request:", req.body);

  const { name, email, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString("hex");

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      verificationToken,
      emailVerified: false,
    });

    try {
      await newUser.save();
      console.log("✅ User saved to DB:", newUser.email);
    } catch (err) {
      console.error("❌ Error saving user to DB:", err.message);
      return res.status(500).json({ message: "Failed to save user to database" });
    }

    const verificationUrl = `http://localhost:3000/verify-email/${verificationToken}`;
    const html = `
      <h2>Verify your ZollowUp account</h2>
      <p>Click the link below to verify your email:</p>
      <a href="${verificationUrl}">${verificationUrl}</a>
    `;

    try {
      await sendEmail(email, "Verify your email", html);
      console.log("📧 Verification email sent to:", email);
    } catch (err) {
      console.error("❌ Error sending email:", err.message);
      return res.status(500).json({ message: "Failed to send verification email" });
    }

    res.status(201).json({
      message: "Signup successful! Please check your email to verify your account.",
    });
  } catch (error) {
    console.error("❌ Server error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

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
    console.error("Update profile error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
