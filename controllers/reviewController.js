const Review = require("../models/Review");

// @desc    Submit a new review
// @route   POST /api/reviews/submit
// @access  Protected
exports.submitReview = async (req, res) => {
  try {
    const { bookingId, rating, review } = req.body;

    if (!bookingId || !rating || !review) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const newReview = new Review({
      bookingId,
      rating,
      review,
      userId: req.user.userId, // ✅ Fixed here
    });

    await newReview.save();

    res.status(201).json({ message: "Review submitted successfully." });
  } catch (error) {
    console.error("Submit review error:", error);
    res.status(500).json({ message: "Something went wrong." });
  }
};

// @desc    Get all reviews for the logged-in user
// @route   GET /api/reviews/my-reviews
// @access  Protected
exports.getUserReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ userId: req.user.userId }).populate({
      path: "bookingId",
      populate: { path: "service" },
    });

    res.json(reviews);
  } catch (err) {
    console.error("Get user reviews error:", err);
    res.status(500).json({ message: "Failed to fetch reviews" });
  }
};

// @desc    Update a review
// @route   PUT /api/reviews/:id
// @access  Protected
exports.updateReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review || review.userId.toString() !== req.user.userId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    review.review = req.body.review || review.review;
    review.rating = req.body.rating || review.rating;

    await review.save();

    res.json({ message: "Review updated", review });
  } catch (err) {
    console.error("Update review error:", err);
    res.status(500).json({ message: "Update failed" });
  }
};

// @desc    Delete a review
// @route   DELETE /api/reviews/:id
// @access  Protected
exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review || review.userId.toString() !== req.user.userId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    await review.deleteOne();
    res.json({ message: "Review deleted" });
  } catch (err) {
    console.error("Delete review error:", err);
    res.status(500).json({ message: "Delete failed" });
  }
};
