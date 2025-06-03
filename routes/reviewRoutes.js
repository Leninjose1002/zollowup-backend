const express = require("express");
const router = express.Router();
const Review = require('../models/Review');

const {
  submitReview,
  getUserReviews,
  updateReview,
  deleteReview,
} = require("../controllers/reviewController");
const protect = require("../middleware/authMiddleware");

// @route   POST /api/reviews/submit
// @desc    Submit a new review
// @access  Protected
router.post("/submit", protect, submitReview);

// @route   GET /api/reviews/my-reviews
// @desc    Get all reviews by the logged-in user
// @access  Protected
router.get("/my-reviews", protect, getUserReviews);

// @route   PUT /api/reviews/:id
// @desc    Update a review by ID
// @access  Protected
router.put("/:id", protect, updateReview);

// @route   DELETE /api/reviews/:id
// @desc    Delete a review by ID
// @access  Protected
router.delete("/:id", protect, deleteReview);
// @route   GET /api/reviews/public
// @desc    Get latest public reviews for homepage
// @access  Public
router.get("/public", async (req, res) => {
  try {
    const reviews = await Review.find()
      .populate("userId", "name photo") // ✅ get name + optional photo
      .populate({
        path: "bookingId",
        populate: { path: "service", select: "name" },
      })
      .sort({ createdAt: -1 })
      .limit(5);

    res.json(reviews);
  } catch (err) {
    console.error("Public reviews fetch error:", err);
    res.status(500).json({ message: "Failed to fetch reviews" });
  }
});


module.exports = router;
