const mongoose = require("mongoose");

const VendorSchema = new mongoose.Schema({
  // Basic Info
  name: String,
  email: String,
  businessName: String,
  phone: String,
  
  // 🆕 NEW FIELDS - Add these 3 fields
  sourcing_person_name: {
    type: String,
    default: null,
    trim: true
  },
  
  skill_category: {
    type: String,
    enum: ['Labor', 'Beautician', 'Tailor', 'Mason', 'Maid', 'Cook/Chef', 'Plumber', 'Electrician', 'Other'],
    required: true
  },
  
  diet_type: {
    type: String,
    enum: ['Vegetarian', 'Non-Vegetarian', 'Both'],
    default: null,
    required: function() {
    return this.skill_category === 'Cook/Chef'; // Only required for chefs
  }
  },
  
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