const Booking = require("../models/Booking");

// ✅ Get all bookings (admin view)
exports.getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate("user", "name email")       // Populate user info
      .populate("maidId", "name")           // For maid bookings
      .sort({ createdAt: -1 });             // Most recent first

    res.status(200).json(bookings);
  } catch (error) {
    console.error("❌ Failed to fetch bookings:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// ✅ Update booking status
exports.updateBookingStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ["pending", "confirmed", "cancelled"];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: "Invalid booking status" });
  }

  try {
    const updated = await Booking.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Booking not found" });
    }

    res.status(200).json(updated);
  } catch (error) {
    console.error("❌ Failed to update booking status:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
