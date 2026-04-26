// routes/vendorKYC.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Employee = require('../models/Employee');
const VendorKYC = require('../models/vendorKYC'); 
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// File upload config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/kyc');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const userId = req.user?.userId || 'UNKNOWN';  // ✅ Add fallback
    cb(null, `${userId}-${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPG, PNG, PDF allowed'));
    }
  }
});

// Get KYC Status
router.get('/kyc/:vendor_id', async (req, res) => {
  try {
    const kyc = await VendorKYC.findOne({ vendor_id: req.params.vendor_id });
    if (!kyc) {
      return res.status(404).json({ message: 'KYC not started' });
    }
    res.json(kyc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Submit KYC Documents
router.post('/kyc/submit', authMiddleware, upload.fields([
  { name: 'aadhar_document', maxCount: 1 },
  { name: 'selfie', maxCount: 1 },
  { name: 'police_certificate', maxCount: 1 }
]), async (req, res) => {
  try {
    const  employee_id = req.user.userId;
    const { aadhar_number } = req.body;

    // Validate Aadhar (12 digits)
    if (!/^\d{12}$/.test(aadhar_number.replace(/\D/g, ''))) {
      return res.status(400).json({ error: 'Invalid Aadhar format' });
    }

    // Check if employee exists
    const employee = await Employee.findById(employee_id);  // ✅ Changed
    if (!employee) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    // Find or create KYC record (in VendorKYC collection)
    let kyc = await VendorKYC.findOne({ vendor_id: employee_id });
    
    if (!kyc) {
      kyc = new VendorKYC({ vendor_id: employee_id });
    }

    // Update Aadhar
    if (req.files['aadhar_document']) {
      const maskedAadhar = '**** **** ' + aadhar_number.slice(-4);
      kyc.aadhar.number = maskedAadhar;
      kyc.aadhar.document = {
        filename: req.files['aadhar_document'][0].filename,
        filepath: `/uploads/kyc/${req.files['aadhar_document'][0].filename}`,
        uploadedAt: new Date()
      };
    }

    // Update Selfie
    if (req.files['selfie']) {
      kyc.selfie = {
        filename: req.files['selfie'][0].filename,
        filepath: `/uploads/kyc/${req.files['selfie'][0].filename}`,
        uploadedAt: new Date()
      };
    }

    // Update Police Verification
    if (req.files['police_certificate']) {
      kyc.policeVerification = {
        filename: req.files['police_certificate'][0].filename,
        filepath: `/uploads/kyc/${req.files['police_certificate'][0].filename}`,
        uploadedAt: new Date()
      };
    }

    // Update status
    kyc.kycStatus = 'pending_review';
    kyc.submittedAt = new Date();
    await kyc.save();

    // Update EMPLOYEE with KYC status
    await Employee.findByIdAndUpdate(employee_id, {  // ✅ Changed
      kyc_status: 'pending_review',
      kyc_submitted_at: new Date(),
      vendor_status: 'pending'
    });

    res.json({ 
      message: 'KYC submitted successfully',
      kyc_status: 'pending_review'
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Get All Pending KYC Submissions
router.get('/admin/kyc/pending', async (req, res) => {
  try {
    const pendingKYC = await VendorKYC.find({ kycStatus: 'pending_review' })
      .populate('vendor_id', 'name email businessName phone')
      .sort({ submittedAt: -1 });
    
    res.json(pendingKYC);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Verify KYC
router.post('/admin/kyc/verify/:kyc_id', async (req, res) => {
  try {
    const { admin_id, action, rejection_reason } = req.body;
    // action: 'approve' or 'reject'

    const kyc = await VendorKYC.findByIdAndUpdate(
      req.params.kyc_id,
      {
        kycStatus: action === 'approve' ? 'verified' : 'kyc_rejected',
        verifiedAt: new Date(),
        'adminReview.reviewedBy': admin_id,
        'adminReview.reviewedAt': new Date(),
        'adminReview.rejectionReason': rejection_reason
      },
      { new: true }
    );

    // Update vendor status
    const newVendorStatus = action === 'approve' ? 'active' : 'suspended';
    await Employee.findByIdAndUpdate(kyc.vendor_id, {
       kyc_status: action === 'approve' ? 'verified' : 'kyc_rejected',  // ✅ Correct enum!
  vendor_status: newVendorStatus,  // ✅ Add this!
      kyc_verified_at: new Date(),
      kyc_rejection_reason: rejection_reason
    });

    res.json({ message: `KYC ${action}ed successfully`, kyc });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;