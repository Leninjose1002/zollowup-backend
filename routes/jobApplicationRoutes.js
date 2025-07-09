// 📁 routes/jobApplicationRoutes.js
const express = require("express");
const router = express.Router();
const upload = require("../middleware/uploadMiddleware");
const { submitJobApplication } = require("../controllers/jobApplicationController");
const JobApplication = require("../models/JobApplication");

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


// GET all job applications (for admin)
router.get("/job-applications", async (req, res) => {
  try {
    const applications = await JobApplication.find().sort({ createdAt: -1 });
    res.status(200).json(applications);
  } catch (error) {
    console.error("Error fetching job applications:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
