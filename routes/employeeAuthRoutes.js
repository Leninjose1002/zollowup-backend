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
const sendSMS = require("../utils/sendSMS"); 

const router = express.Router();

console.log("✅ employeeAuthRoutes.js loaded");

// =============== SIGNUP ===============

// 📝 Employee Signup
// POST /api/employees/register
router.post("/register", async (req, res) => {
  const { email, password, businessName, phone, name, sourcing_person_name, skill_category, diet_type } = req.body;

  // Validation
  if (!email || !password || !businessName || !phone || !skill_category) {
    return res.status(400).json({ 
      msg: "Email, password, business name, phone, and skill category are required" 
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

    // Generate email verification token
const emailVerificationToken = crypto.randomBytes(32).toString("hex");
const shortVerificationToken = emailVerificationToken.substring(0, 9).toUpperCase(); // 🆕 ADD THIS
const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    // const emailVerificationToken = crypto.randomBytes(32).toString("hex");
    // const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create new employee
    employee = new Employee({
      email,
      password: hashedPassword,
      name: name || businessName,
      businessName,
      phone,
      sourcing_person_name: sourcing_person_name || null,  // 🆕 NEW
      skill_category: skill_category,                      // 🆕 NEW
      diet_type: skill_category === 'Cook/Chef' ? diet_type : null,  // 🆕 NEW
      emailVerificationToken,
      shortVerificationToken,
      emailVerificationExpires,
    });

    await employee.save();

    // Send verification email
    // const verificationLink = `${process.env.FRONTEND_URL}/vendor/verify-email?token=${emailVerificationToken}&email=${email}`;

    const verificationLink = `${process.env.FRONTEND_URL}?page=verify-email&token=${emailVerificationToken}&email=${email}`;

    const emailHtml = `
  <h2>Welcome to Zollowup! 🎉</h2>
  <p>Hi ${businessName},</p>
  <p>Thank you for signing up as a vendor. Please verify your email to complete your registration.</p>
  
  <h3>✅ Option 1: Click Button (Easiest)</h3>
  <a href="${verificationLink}" style="padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
    ✓ Verify Email
  </a>
  
  <h3>✅ Option 2: Manual Entry (if button doesn't work)</h3>
  <p>Go to: <a href="${process.env.FRONTEND_URL}">${process.env.FRONTEND_URL}</a></p>
  <p>Paste this token: <strong style="font-size: 18px; color: #007bff;">${shortVerificationToken}</strong></p>
  
  <p style="color: #888; font-size: 12px;">This link expires in 24 hours.</p>
  <p>Best regards,<br/>Zollowup Team</p>
`;

    // const emailHtml = `
    //   <h2>Welcome to Zollowup! 🎉</h2>
    //   <p>Hi ${businessName},</p>
    //   <p>Thank you for signing up as a vendor. Please verify your email to complete your registration.</p>
    //   <a href="${verificationLink}" style="padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; display: inline-block;">
    //     Verify Email
    //   </a>
    //   <p>Or copy this link: <a href="${verificationLink}">${verificationLink}</a></p>
    //   <p>This link expires in 24 hours.</p>
    //   <p>Best regards,<br/>Zollowup Team</p>
    // `;

    await sendEmail(email, "Verify your Zollowup Vendor Account", emailHtml);

    res.status(201).json({
      message: "Signup successful! Please check your email to verify your account.",
      employee: {
        id: employee._id,
        email: employee.email,
        businessName: employee.businessName,
        skill_category: employee.skill_category,  // 🆕 NEW
        sourcing_person_name: employee.sourcing_person_name,  // 🆕 NEW
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
  $or: [
    { emailVerificationToken: token },    // Full token
    { shortVerificationToken: token.toUpperCase() }  // Short token
  ],
  emailVerificationExpires: { $gt: new Date() },
});
    // const employee = await Employee.findOne({
    //   email,
    //   emailVerificationToken: token,
    //   emailVerificationExpires: { $gt: new Date() },
    // });

    if (!employee) {
      return res.status(400).json({ msg: "Invalid or expired verification token" });
    }

    // Mark as verified
    employee.isVerified = true;
    employee.verificationMethod = "email"; 
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
    const shortVerificationToken = emailVerificationToken.substring(0, 9).toUpperCase();
    const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    employee.emailVerificationToken = emailVerificationToken;
    employee.shortVerificationToken = shortVerificationToken;
    employee.emailVerificationExpires = emailVerificationExpires;
    await employee.save();

    // Send verification email
    const verificationLink = `${process.env.FRONTEND_URL}?page=verify-email&token=${emailVerificationToken}&email=${email}`;

    // const emailHtml = `
    //   <h2>Verify Your Email - Zollowup Vendor</h2>
    //   <p>Hi ${employee.businessName},</p>
    //   <p>Here's your new verification link:</p>
    //   <a href="${verificationLink}" style="padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; display: inline-block;">
    //     Verify Email
    //   </a>
    //   <p>This link expires in 24 hours.</p>
    // `;

    const emailHtml = `
  <h2>Verify Your Email - Zollowup Vendor</h2>
  <p>Hi ${employee.businessName},</p>
  
  <h3>✅ Option 1: Click Button (Easiest)</h3>
  <a href="${verificationLink}" style="padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
    ✓ Verify Email
  </a>
  
  <h3>✅ Option 2: Manual Entry (if button doesn't work)</h3>
  <p>Go to: <a href="${process.env.FRONTEND_URL}">${process.env.FRONTEND_URL}</a></p>
  <p>Paste this token: <strong style="font-size: 18px; color: #007bff;">${shortVerificationToken}</strong></p>
  
  <p style="color: #888; font-size: 12px;">This link expires in 24 hours.</p>
`;

    await sendEmail(email, "Verify your Zollowup Vendor Account", emailHtml);

    res.json({ message: "Verification email sent successfully!" });
  } catch (error) {
    console.error("❌ Resend verification error:", error);
    res.status(500).json({ msg: "Internal Server Error" });
  }
});

// =============== PHONE OTP VERIFICATION ===============

// ✅ Send OTP to Phone
// POST /api/employees/send-phone-otp
router.post("/send-phone-otp", async (req, res) => {
  const { phone, email } = req.body;

  if (!phone || !email) {
    return res.status(400).json({ msg: "Phone and email are required" });
  }

  try {
    const employee = await Employee.findOne({ email });

    if (!employee) {
      return res.status(404).json({ msg: "Employee not found" });
    }

    if (employee.isVerified) {
      return res.status(400).json({ msg: "Account already verified" });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save OTP to database
    employee.phoneOTP = otp;
    employee.phoneOTPExpires = otpExpires;
    await employee.save();

    // Send SMS with OTP (using MSG91)
    const message = `Your Zollowup verification code is: ${otp}. This code expires in 10 minutes.`;
    await sendSMS(phone, message);

    res.json({
      message: "OTP sent successfully to your phone!",
    });
  } catch (error) {
    console.error("❌ Send OTP error:", error);
    res.status(500).json({ msg: "Failed to send OTP. Please try again." });
  }
});

// ✅ Verify Phone OTP
// POST /api/employees/verify-phone-otp
router.post("/verify-phone-otp", async (req, res) => {
  const { phone, email, otp } = req.body;

  if (!phone || !email || !otp) {
    return res.status(400).json({ msg: "Phone, email, and OTP are required" });
  }

  try {
    const employee = await Employee.findOne({
      email,
      phone,
      phoneOTP: otp,
      phoneOTPExpires: { $gt: new Date() },
    });

    if (!employee) {
      return res.status(400).json({ msg: "Invalid or expired OTP" });
    }

    // Mark as verified
    employee.isVerified = true;
    employee.verificationMethod = "phone";
    employee.phoneOTP = null;
    employee.phoneOTPExpires = null;
    await employee.save();

    res.json({
      message: "Phone verified successfully! You can now log in.",
      employee: {
        id: employee._id,
        email: employee.email,
        phone: employee.phone,
        isVerified: employee.isVerified,
      },
    });
  } catch (error) {
    console.error("❌ Phone OTP verification error:", error);
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
    const { name, businessName, phone, profileImage, bankDetails, upiId, preferredPaymentMethod, sourcing_person_name, skill_category, diet_type } = req.body;

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
    
    // 🆕 NEW FIELDS - Allow updating
    if (sourcing_person_name !== undefined) employee.sourcing_person_name = sourcing_person_name;
    if (skill_category) employee.skill_category = skill_category;
    if (skill_category === 'Cook/Chef' && diet_type) {
      employee.diet_type = diet_type;
    } else if (skill_category !== 'Cook/Chef') {
      employee.diet_type = null;  // Clear diet_type for non-chefs
    }

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
        skill_category: employee.skill_category,  // 🆕 NEW
        sourcing_person_name: employee.sourcing_person_name,  // 🆕 NEW
        diet_type: employee.diet_type,  // 🆕 NEW
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

// 📊 GET vendor dashboard
router.get("/dashboard", authMiddleware, async (req, res) => {
  try {
    const employee = await Employee.findById(req.user.userId).select("-password");
    
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    res.json({
      vendor: {
        id: employee._id,
        businessName: employee.businessName,
        name: employee.name,
        email: employee.email,
        phone: employee.phone,
        profileImage: employee.profileImage,
        skill_category: employee.skill_category,  // 🆕 NEW
        sourcing_person_name: employee.sourcing_person_name,  // 🆕 NEW
        diet_type: employee.diet_type,  // 🆕 NEW
      },
      stats: {
        totalEarnings: employee.totalEarnings || 0,
        availableBalance: employee.availableBalance || 0,
        totalBookings: employee.totalBookings || 0,
        averageRating: employee.averageRating || 0,
      },
      paymentMethods: {
        hasRazorpay: !!employee.razorpayId,
        hasBankDetails: !!employee.bankDetails,
        hasUpi: !!employee.upiId,
      },
    });
  } catch (err) {
    console.error("Error fetching dashboard:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// =============== PASSWORD RESET ===============

// 📧 Forgot Password - Send Reset Link
// POST /api/employees/forgot-password
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ msg: "Email is required" });
  }

  try {
    const employee = await Employee.findOne({ email });

    if (!employee) {
      return res.status(404).json({ msg: "Email not found" });
    }

    // Generate reset token
    const passwordResetToken = crypto.randomBytes(32).toString("hex");
    const passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    employee.passwordResetToken = passwordResetToken;
    employee.passwordResetExpires = passwordResetExpires;
    await employee.save();

    // Create reset link
    const resetLink = `${process.env.FRONTEND_URL}?page=reset-password&token=${passwordResetToken}&email=${email}`;

    // Send email
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Segoe UI', sans-serif; background-color: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background: white; padding: 0; }
    .header { background: linear-gradient(135deg, #007bff 0%, #0056b3 100%); padding: 20px; text-align: center; color: white; }
    .content { padding: 30px; }
    .button { display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; }
    .warning { background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0; }
    .footer { background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #ddd; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2 style="margin: 0;">Reset Your Password</h2>
    </div>
    
    <div class="content">
      <p>Hi ${employee.businessName || employee.name},</p>
      <p>You requested to reset your password. Click the button below to set a new password:</p>
      
      <center style="margin: 30px 0;">
        <a href="${resetLink}" class="button">Reset Password</a>
      </center>
      
      <p>Or copy this link: <a href="${resetLink}">${resetLink}</a></p>
      
      <div class="warning">
        <strong>⚠️ Security Notice:</strong><br/>
        This link expires in 1 hour. If you didn't request this, ignore this email.
      </div>
      
      <p>Best regards,<br/>Zollowup Team</p>
    </div>
    
    <div class="footer">
      <p>© 2026 Zollowup. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `;

    await sendEmail(email, "Reset your Zollowup Password", emailHtml);

    res.json({ 
      message: "Password reset link sent to your email. Check your inbox!" 
    });
  } catch (error) {
    console.error("❌ Forgot password error:", error);
    res.status(500).json({ msg: "Internal Server Error" });
  }
});

// 🔑 Reset Password - Verify Token & Update Password
// POST /api/employees/reset-password
router.post("/reset-password", async (req, res) => {
  const { token, email, newPassword, confirmPassword } = req.body;

  if (!token || !email || !newPassword || !confirmPassword) {
    return res.status(400).json({ 
      msg: "Token, email, new password, and confirm password are required" 
    });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ msg: "Passwords do not match" });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ msg: "Password must be at least 6 characters" });
  }

  try {
    const employee = await Employee.findOne({
      email,
      passwordResetToken: token,
      passwordResetExpires: { $gt: new Date() },
    });

    if (!employee) {
      return res.status(400).json({ msg: "Invalid or expired reset token" });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password and clear reset token
    employee.password = hashedPassword;
    employee.passwordResetToken = null;
    employee.passwordResetExpires = null;
    await employee.save();

    res.json({ 
      message: "Password reset successfully! You can now log in with your new password." 
    });
  } catch (error) {
    console.error("❌ Reset password error:", error);
    res.status(500).json({ msg: "Internal Server Error" });
  }
});

module.exports = router;
