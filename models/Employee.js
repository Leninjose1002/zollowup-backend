// // const mongoose = require("mongoose");

// // const employeeSchema = new mongoose.Schema({
// //   email: { type: String, unique: true, required: true },  
// //   password: { type: String, required: false },             
// //   createdAt: { type: Date, default: Date.now },           
// // });

// // module.exports = mongoose.model("Employee", employeeSchema);

// const mongoose = require("mongoose");

// const employeeSchema = new mongoose.Schema({
//   // Basic Info
//   email: { type: String, unique: true, required: true, lowercase: true },  
//   password: { type: String, required: false },
  
//   // Vendor Profile
//   name: { type: String, required: false },
//   businessName: { type: String, required: false },
//   phone: { type: String, required: false },
//   profileImage: { type: String, default: null },
  
//   // Email Verification
//   isVerified: { type: Boolean, default: false },
//   emailVerificationToken: { type: String, default: null },
//   emailVerificationExpires: { type: Date, default: null },
  
//   // Payment Methods
//   razorpayCustomerId: { type: String, default: null },
//   bankDetails: {
//     accountHolderName: { type: String, default: null },
//     accountNumber: { type: String, default: null },
//     ifscCode: { type: String, default: null },
//     bankName: { type: String, default: null },
//   },
//   upiId: { type: String, default: null },
//   preferredPaymentMethod: { 
//     type: String, 
//     enum: ['bank', 'upi', 'razorpay'], 
//     default: null 
//   },
  
//   // Earnings & Payouts
//   totalEarnings: { type: Number, default: 0 },
//   availableBalance: { type: Number, default: 0 },
//   pendingBalance: { type: Number, default: 0 },
  
//   // Vendor Stats
//   totalBookings: { type: Number, default: 0 },
//   completedBookings: { type: Number, default: 0 },
//   totalRating: { type: Number, default: 0 },
//   averageRating: { type: Number, default: 0 },
//   reviewCount: { type: Number, default: 0 },
  
//   // Account Status
//   isActive: { type: Boolean, default: true },
//   isApproved: { type: Boolean, default: false },
//   approvedAt: { type: Date, default: null },
  
//   // Timestamps
//   createdAt: { type: Date, default: Date.now },
//   updatedAt: { type: Date, default: Date.now },
// });

// // Update updatedAt before saving
// employeeSchema.pre('save', function(next) {
//   this.updatedAt = Date.now();
//   next();
// });

// module.exports = mongoose.model("Employee", employeeSchema);


// 📁 models/Employee.js
// Updated Employee Schema with Phone OTP support

const mongoose = require("mongoose");

const EmployeeSchema = new mongoose.Schema(
  {
    // Basic Info
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    businessName: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },

    // ✅ NEW: Verification fields
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationMethod: {
      type: String,
      enum: ["email", "phone"],
      default: null,
    },

    // Email Verification
    emailVerificationToken: {
      type: String,
      default: null,
    },
    emailVerificationExpires: {
      type: Date,
      default: null,
    },

    // ✅ NEW: Phone OTP Verification
    phoneOTP: {
      type: String,
      default: null,
    },
    phoneOTPExpires: {
      type: Date,
      default: null,
    },
    phoneOTPAttempts: {
      type: Number,
      default: 0,
    },
    phoneOTPLockedUntil: {
      type: Date,
      default: null,
    },

    // Profile Info
    profileImage: {
      type: String,
      default: null,
    },

    // Payment Methods
    bankDetails: {
      accountHolderName: String,
      accountNumber: String,
      ifscCode: String,
      bankName: String,
    },
    upiId: {
      type: String,
      default: null,
    },
    razorpayId: {
      type: String,
      default: null,
    },
    preferredPaymentMethod: {
      type: String,
      enum: ["bank", "upi", "razorpay"],
      default: null,
    },

    // Business Stats
    totalEarnings: {
      type: Number,
      default: 0,
    },
    availableBalance: {
      type: Number,
      default: 0,
    },
    totalBookings: {
      type: Number,
      default: 0,
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },

    // Status
    isActive: {
      type: Boolean,
      default: true,
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },

    // Metadata
    position: String,
    department: String,
    documents: [
      {
        type: String,
        url: String,
        verifiedAt: Date,
      },
    ],

    // Additional Info
    lastLogin: Date,
    loginAttempts: {
      type: Number,
      default: 0,
    },
    lockedUntil: Date,
  },
  {
    timestamps: true,
  }
);

// ✅ Index for faster queries
EmployeeSchema.index({ email: 1 });
EmployeeSchema.index({ phone: 1 });
EmployeeSchema.index({ isVerified: 1 });
EmployeeSchema.index({ verificationMethod: 1 });

// ✅ Pre-save middleware to prevent duplicate verification attempts
EmployeeSchema.pre("save", function (next) {
  // Reset OTP attempts if phoneOTPLockedUntil has passed
  if (this.phoneOTPLockedUntil && this.phoneOTPLockedUntil < new Date()) {
    this.phoneOTPAttempts = 0;
    this.phoneOTPLockedUntil = null;
  }

  next();
});

module.exports = mongoose.model("Employee", EmployeeSchema);
