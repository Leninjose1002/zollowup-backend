const mongoose = require("mongoose");

const MaidSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    age: { type: Number, required: true },
    experience: { type: String, required: true }, // e.g. "2 years"
    religion: { type: String, required: true },
    image: { type: String, required: true },
    availableHours: { type: [String], required: true },
    pricePerHour: { type: Number, required: true },

    // ✅ Optional details
    language: { type: String },
    speciality: { type: String }, // e.g., "Veg", "Non-Veg"
    state: { type: String },
    maritalStatus: { type: String },

    // ✅ Video introduction
    video: { type: String },

    // ✅ Owner of the maid profile (admin or user who added it)
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // ✅ Optional field to show availability status
    status: {
      type: String,
      enum: ["Available", "Booked", "Offline"],
      default: "Available",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Maid", MaidSchema);
