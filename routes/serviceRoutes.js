const express = require("express");
const { getAllServices, createService } = require("../controllers/serviceController"); // ✅ Ensure createService is imported
const authMiddleware = require("../middleware/authMiddleware"); // ✅ Ensure authMiddleware is imported

const router = express.Router();

// ✅ Public route
router.get("/", getAllServices);

// ✅ Protected route (Ensure authMiddleware is a function)
router.post("/", authMiddleware, createService);

module.exports = router;
