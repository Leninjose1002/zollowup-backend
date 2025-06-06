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

  // ✅ Common Fields
  date: String,
  address: String,
  phone: String,
  status: {
  type: String,
  enum: ["confirmed", "cancelled"], // ✅ Only two statuses now
  // default: "confirmed",
},

   payment: {
    orderId: String,
    paymentId: String,
    amount: Number,
    currency: String,
    verified: Boolean,
  },

status: {
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
