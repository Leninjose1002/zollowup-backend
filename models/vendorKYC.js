// models/VendorKYC.js
const mongoose = require('mongoose');

const vendorKYCSchema = new mongoose.Schema({
  vendor_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true,
    unique: true
  },
  
  // Aadhar Details
  aadhar: {
    number: {
      type: String,
      default: null,
      // Store masked: XXXX-XXXX-1234
    },

    document: {
      filename: String,
      filepath: String,
      uploadedAt: Date,
      verified: { type: Boolean, default: false }
    }
  },
  
  // Selfie
  selfie: {
    filename: String,
    filepath: String,
    uploadedAt: Date,
    verified: { type: Boolean, default: false }
  },
  
  // Police Verification Certificate
  policeVerification: {
    filename: String,
    filepath: String,
    uploadedAt: Date,
    verified: { type: Boolean, default: false }
  },
  
  // Overall KYC Status
  kycStatus: {
    type: String,
    enum: ['not_started', 'pending_review', 'verified', 'kyc_rejected'],
    default: 'not_started'
  },
  
  // Admin Review
  adminReview: {
    reviewedBy: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Admin',
  default: null
},
    reviewedAt: Date,
    comments: String,
    rejectionReason: String
  },
  
  submittedAt: Date,
  verifiedAt: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('VendorKYC', vendorKYCSchema);