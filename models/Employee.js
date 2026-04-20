// const mongoose = require("mongoose");

// const employeeSchema = new mongoose.Schema({
//   email: { type: String, unique: true, required: true },  
//   password: { type: String, required: false },             
//   createdAt: { type: Date, default: Date.now },           
// });

// module.exports = mongoose.model("Employee", employeeSchema);

const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema({
  // Basic Info
  email: { type: String, unique: true, required: true, lowercase: true },  
  password: { type: String, required: false },
  
  // Vendor Profile
  name: { type: String, required: false },
  businessName: { type: String, required: false },
  phone: { type: String, required: false },
  profileImage: { type: String, default: null },
  
  // Email Verification
  isVerified: { type: Boolean, default: false },
  emailVerificationToken: { type: String, default: null },
  emailVerificationExpires: { type: Date, default: null },
  
  // Payment Methods
  razorpayCustomerId: { type: String, default: null },
  bankDetails: {
    accountHolderName: { type: String, default: null },
    accountNumber: { type: String, default: null },
    ifscCode: { type: String, default: null },
    bankName: { type: String, default: null },
  },
  upiId: { type: String, default: null },
  preferredPaymentMethod: { 
    type: String, 
    enum: ['bank', 'upi', 'razorpay'], 
    default: null 
  },
  
  // Earnings & Payouts
  totalEarnings: { type: Number, default: 0 },
  availableBalance: { type: Number, default: 0 },
  pendingBalance: { type: Number, default: 0 },
  
  // Vendor Stats
  totalBookings: { type: Number, default: 0 },
  completedBookings: { type: Number, default: 0 },
  totalRating: { type: Number, default: 0 },
  averageRating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
  
  // Account Status
  isActive: { type: Boolean, default: true },
  isApproved: { type: Boolean, default: false },
  approvedAt: { type: Date, default: null },
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Update updatedAt before saving
employeeSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("Employee", employeeSchema);
