const express = require("express");
const router = express.Router();
const { handleContactForm } = require("../controllers/contactController");

// ✅ POST /api/contact
router.post("/", handleContactForm);

module.exports = router;
