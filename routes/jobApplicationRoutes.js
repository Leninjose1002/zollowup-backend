// 📁 routes/jobApplicationRoutes.js
const express = require("express");
const router = express.Router();
const upload = require("../middleware/uploadMiddleware");
const { submitJobApplication } = require("../controllers/jobApplicationController");

router.post(
  "/job-application",
  upload.fields([
    { name: "photo", maxCount: 1 },
    { name: "aadhar", maxCount: 1 },
    { name: "resume", maxCount: 1 },
    { name: "otherId", maxCount: 1 },
  ]),
  submitJobApplication
);

module.exports = router;
