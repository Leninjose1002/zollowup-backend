const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false, // Optional if booking is made without login
  },

  // 🧠 Type of service: "maid", "nurse", "electrician", etc.
  serviceType: {
    type: String,
    required: true,
  },

  // ✅ MAID Booking Fields
  maidId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Maid",
    required: false,
  },
  name: {
    type: String,
    required: false,
  },

  // ✅ NURSE Booking Fields
  nurseType: String,
  shift: String,
  notes: String,

  // ✅ CHEF Booking Fields
  chefCategory: String,             // Veg / Non-Veg / Both
  noOfGuests: Number,               // Total number of guests
  occasion: String,                 // e.g., Birthday, Puja
  cuisine: String,                  // e.g., North Indian
  bringUtensils: Boolean,           // true/false
  chefServiceType: String,          // Cooking Only / Full Service
  // ✅ Common Fields
  date: String,
  address: String,
  phone: String,

  // ✅ Booking Status
status: {
  type: String,
  enum: ["pending", "confirmed", "cancelled"],
  default: "pending",
}
,

  // ✅ Payment Info
  payment: {
    orderId: String,
    paymentId: String,
    amount: Number,
    currency: String,
    verified: Boolean,
  },

  // ✅ Staff Availability Status
  staffStatus: {
    type: String,
    enum: ["Available", "Booked", "Offline"],
    default: "Available",
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Booking", bookingSchema);
