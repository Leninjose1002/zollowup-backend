const Review = require("../models/Review");

// @desc    Submit a new review
// @route   POST /api/reviews/submit
// @access  Protected
const submitReview = async (req, res) => {
  try {
    const { serviceName, rating, review, bookingId } = req.body;

    const newReview = new Review({
      userId: req.user.userId, // ✅ Use userId from authMiddleware
      serviceName,
      rating,
      review,
      bookingId: bookingId || undefined,
    });

    const saved = await newReview.save();
    res.status(201).json({ review: saved });
  } catch (err) {
    console.error("Submit Review Error:", err);
    res.status(500).json({ message: "Failed to submit review" });
  }
};


// @desc    Get all reviews for the logged-in user
// @route   GET /api/reviews/my-reviews
// @access  Protected
const getUserReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ userId: req.user._id })
      .populate({
        path: "bookingId",
        populate: { path: "service" },
      })
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (err) {
    console.error("Get user reviews error:", err);
    res.status(500).json({ message: "Failed to fetch reviews" });
  }
};

// @desc    Update a review
// @route   PUT /api/reviews/:id
// @access  Protected
const updateReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review || review.userId.toString() !== req.user._id.toString()) {
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
const deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review || review.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    await review.deleteOne();
    res.json({ message: "Review deleted" });
  } catch (err) {
    console.error("Delete review error:", err);
    res.status(500).json({ message: "Delete failed" });
  }
};

module.exports = {
  submitReview,
  getUserReviews,
  updateReview,
  deleteReview,
};
