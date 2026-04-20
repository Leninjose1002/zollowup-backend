// // 📁 routes/employeeAuthRoutes.js
// const express = require("express");
// const bcrypt = require("bcrypt");
// const jwt = require("jsonwebtoken");
// const passport = require("passport");
// const Employee = require("../models/Employee");
// const authMiddleware = require("../middleware/authMiddleware");

// const router = express.Router();

// console.log("✅ employeeAuthRoutes.js loaded");


// // 🔐 Employee Login
// // POST /api/employees/login
// router.post("/login", async (req, res) => {
//   const { email, password } = req.body;

//   if (!email || !password) {
//     return res.status(400).json({ msg: "Email and password are required" });
//   }

//   try {
//     const employee = await Employee.findOne({ email });
//     if (!employee) {
//       return res.status(401).json({ msg: "Invalid credentials" });
//     }

//     const isMatch = await bcrypt.compare(password, employee.password);
//     if (!isMatch) {
//       return res.status(401).json({ msg: "Invalid credentials" });
//     }

//     const token = jwt.sign(
//       { userId: employee._id, userType: "employee" },
//       process.env.JWT_SECRET,
//       { expiresIn: "1h" }
//     );

//     // ✅ Set the token in a cookie
//     res.cookie("token", token, {
//       httpOnly: true,
//       secure: true, // use false if testing only on localhost
//       sameSite: "None", // Required for cross-domain (e.g., Vercel frontend)
//       maxAge: 3600000, // 1 hour
//     });

//     // ✅ Return employee info in response
//     res.json({
//       message: "Login successful",
//       employee: {
//         id: employee._id,
//         name: employee.name,
//         email: employee.email,
//         position: employee.position,
//       },
//     });
//   } catch (error) {
//     console.error("❌ Employee login error:", error);
//     res.status(500).json({ msg: "Internal Server Error" });
//   }
// });


// // 🔵 GET current employee profile (if authenticated)
// router.get("/me", authMiddleware, async (req, res) => {
//   try {
//     const employee = await Employee.findById(req.user.userId).select("-password");
//     if (!employee) return res.status(404).json({ message: "Employee not found" });
//     res.json(employee);
//   } catch (err) {
//     console.error("❌ Error fetching employee:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// });



// // CRUD: GET all employees (Admin only)
// router.get("/", authMiddleware, async (req, res) => {
//   try {
//     const employees = await Employee.find({});
//     res.json(employees);
//   } catch (error) {
//     res.status(500).json({ message: "Error fetching employees", error });
//   }
// });

// // CRUD: UPDATE employee
// router.put("/:id", authMiddleware, async (req, res) => {
//   try {
//     const updatedEmployee = await Employee.findOneAndUpdate(
//       { _id: req.params.id },
//       req.body,
//       { new: true }
//     );

//     if (!updatedEmployee) {
//       return res.status(404).json({ message: "Employee not found" });
//     }

//     res.json(updatedEmployee);
//   } catch (error) {
//     res.status(500).json({ message: "Error updating employee", error });
//   }
// });

// // CRUD: DELETE employee
// router.delete("/:id", authMiddleware, async (req, res) => {
//   try {
//     const deletedEmployee = await Employee.findOneAndDelete({ _id: req.params.id });
//     if (!deletedEmployee) {
//       return res.status(404).json({ message: "Employee not found" });
//     }

//     res.json({ message: "Employee deleted successfully" });
//   } catch (error) {
//     res.status(500).json({ message: "Error deleting employee", error });
//   }
// });

// module.exports = router;

const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const Employee = require("../models/Employee");
const authMiddleware = require("../middleware/authMiddleware");
const sendEmail = require("../utils/sendEmail");

const router = express.Router();

console.log("✅ employeeAuthRoutes.js loaded");

// =============== SIGNUP ===============

// 📝 Employee Signup
// POST /api/employees/register
router.post("/register", async (req, res) => {
  const { email, password, businessName, phone, name } = req.body;

  // Validation
  if (!email || !password || !businessName || !phone) {
    return res.status(400).json({ 
      msg: "Email, password, business name, and phone are required" 
    });
  }

  try {
    // Check if employee already exists
    let employee = await Employee.findOne({ email });
    if (employee) {
      return res.status(400).json({ msg: "Employee already exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate email verification token
    const emailVerificationToken = crypto.randomBytes(32).toString("hex");
    const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create new employee
    employee = new Employee({
      email,
      password: hashedPassword,
      name: name || businessName,
      businessName,
      phone,
      emailVerificationToken,
      emailVerificationExpires,
    });

    await employee.save();

    // Send verification email
    const verificationLink = `${process.env.FRONTEND_URL}/vendor/verify-email?token=${emailVerificationToken}&email=${email}`;

    const emailHtml = `
      <h2>Welcome to Zollowup! 🎉</h2>
      <p>Hi ${businessName},</p>
      <p>Thank you for signing up as a vendor. Please verify your email to complete your registration.</p>
      <a href="${verificationLink}" style="padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; display: inline-block;">
        Verify Email
      </a>
      <p>Or copy this link: <a href="${verificationLink}">${verificationLink}</a></p>
      <p>This link expires in 24 hours.</p>
      <p>Best regards,<br/>Zollowup Team</p>
    `;

    await sendEmail(email, "Verify your Zollowup Vendor Account", emailHtml);

    res.status(201).json({
      message: "Signup successful! Please check your email to verify your account.",
      employee: {
        id: employee._id,
        email: employee.email,
        businessName: employee.businessName,
      },
    });
  } catch (error) {
    console.error("❌ Employee signup error:", error);
    res.status(500).json({ msg: "Internal Server Error" });
  }
});

// =============== EMAIL VERIFICATION ===============

// ✅ Verify Email
// POST /api/employees/verify-email
router.post("/verify-email", async (req, res) => {
  const { token, email } = req.body;

  if (!token || !email) {
    return res.status(400).json({ msg: "Token and email are required" });
  }

  try {
    const employee = await Employee.findOne({
      email,
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: new Date() },
    });

    if (!employee) {
      return res.status(400).json({ msg: "Invalid or expired verification token" });
    }

    // Mark as verified
    employee.isVerified = true;
    employee.emailVerificationToken = null;
    employee.emailVerificationExpires = null;
    await employee.save();

    res.json({
      message: "Email verified successfully! You can now log in.",
      employee: {
        id: employee._id,
        email: employee.email,
        isVerified: employee.isVerified,
      },
    });
  } catch (error) {
    console.error("❌ Email verification error:", error);
    res.status(500).json({ msg: "Internal Server Error" });
  }
});

// 🔄 Resend Verification Email
// POST /api/employees/resend-verification
router.post("/resend-verification", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ msg: "Email is required" });
  }

  try {
    const employee = await Employee.findOne({ email });

    if (!employee) {
      return res.status(404).json({ msg: "Employee not found" });
    }

    if (employee.isVerified) {
      return res.status(400).json({ msg: "Email already verified" });
    }

    // Generate new verification token
    const emailVerificationToken = crypto.randomBytes(32).toString("hex");
    const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    employee.emailVerificationToken = emailVerificationToken;
    employee.emailVerificationExpires = emailVerificationExpires;
    await employee.save();

    // Send verification email
    const verificationLink = `${process.env.FRONTEND_URL}/vendor/verify-email?token=${emailVerificationToken}&email=${email}`;

    const emailHtml = `
      <h2>Verify Your Email - Zollowup Vendor</h2>
      <p>Hi ${employee.businessName},</p>
      <p>Here's your new verification link:</p>
      <a href="${verificationLink}" style="padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; display: inline-block;">
        Verify Email
      </a>
      <p>This link expires in 24 hours.</p>
    `;

    await sendEmail(email, "Verify your Zollowup Vendor Account", emailHtml);

    res.json({ message: "Verification email sent successfully!" });
  } catch (error) {
    console.error("❌ Resend verification error:", error);
    res.status(500).json({ msg: "Internal Server Error" });
  }
});

// =============== LOGIN ===============

// 🔐 Employee Login
// POST /api/employees/login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ msg: "Email and password are required" });
  }

  try {
    const employee = await Employee.findOne({ email });
    if (!employee) {
      return res.status(401).json({ msg: "Invalid credentials" });
    }

    // Check if email is verified
    if (!employee.isVerified) {
      return res.status(403).json({ 
        msg: "Please verify your email first",
        requiresVerification: true,
        email: employee.email
      });
    }

    const isMatch = await bcrypt.compare(password, employee.password);
    if (!isMatch) {
      return res.status(401).json({ msg: "Invalid credentials" });
    }

    const token = jwt.sign(
      { userId: employee._id, userType: "employee" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Set the token in a cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      message: "Login successful",
      token,
      employee: {
        id: employee._id,
        name: employee.name,
        email: employee.email,
        businessName: employee.businessName,
        phone: employee.phone,
        averageRating: employee.averageRating,
        totalBookings: employee.totalBookings,
      },
    });
  } catch (error) {
    console.error("❌ Employee login error:", error);
    res.status(500).json({ msg: "Internal Server Error" });
  }
});

// =============== PROFILE ===============

// 🔵 GET current employee profile (if authenticated)
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const employee = await Employee.findById(req.user.userId).select("-password -emailVerificationToken");
    if (!employee) return res.status(404).json({ message: "Employee not found" });
    res.json(employee);
  } catch (err) {
    console.error("❌ Error fetching employee:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// 📝 UPDATE employee profile
router.put("/me", authMiddleware, async (req, res) => {
  try {
    const { name, businessName, phone, profileImage, bankDetails, upiId, preferredPaymentMethod } = req.body;

    const employee = await Employee.findById(req.user.userId);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    // Update fields
    if (name) employee.name = name;
    if (businessName) employee.businessName = businessName;
    if (phone) employee.phone = phone;
    if (profileImage) employee.profileImage = profileImage;
    if (bankDetails) employee.bankDetails = { ...employee.bankDetails, ...bankDetails };
    if (upiId) employee.upiId = upiId;
    if (preferredPaymentMethod) employee.preferredPaymentMethod = preferredPaymentMethod;

    await employee.save();

    res.json({
      message: "Profile updated successfully",
      employee: {
        id: employee._id,
        name: employee.name,
        businessName: employee.businessName,
        email: employee.email,
        phone: employee.phone,
        profileImage: employee.profileImage,
      },
    });
  } catch (error) {
    console.error("❌ Error updating profile:", error);
    res.status(500).json({ message: "Error updating profile", error });
  }
});

// =============== ADMIN OPERATIONS ===============

// GET all employees (Admin only)
router.get("/", authMiddleware, async (req, res) => {
  try {
    const employees = await Employee.find({}).select("-password -emailVerificationToken");
    res.json(employees);
  } catch (error) {
    res.status(500).json({ message: "Error fetching employees", error });
  }
});

// DELETE employee
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const deletedEmployee = await Employee.findOneAndDelete({ _id: req.params.id });
    if (!deletedEmployee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    res.json({ message: "Employee deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting employee", error });
  }
});

module.exports = router;
