const mongoose = require("mongoose");

const VendorSchema = new mongoose.Schema({
  // Basic Info
  name: String,
  email: String,
  businessName: String,
  phone: String,
  
  // ... other fields you already have ...
  
  // 🆕 KYC FIELDS
  kyc_status: { 
    type: String, 
    enum: ['not_started', 'pending_review', 'verified', 'kyc_rejected'], 
    default: 'not_started' 
  },
  kyc_submitted_at: Date,
  kyc_verified_at: Date,
  kyc_rejection_reason: String,

  vendor_status: {
    type: String,
    enum: ['pending', 'active', 'suspended'],
    default: 'pending'
  }
}, { timestamps: true });  // ✅ ADD THIS at the end

module.exports = mongoose.model("Vendor", VendorSchema);