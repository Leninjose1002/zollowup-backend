const mongoose = require("mongoose");

const MaidSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    age: { type: Number, required: true },
    experience: { type: String, required: true },
    religion: { type: String, required: true },
    image: { type: String, required: true },
    availableHours: { type: [String], required: true },
    pricePerHour: { type: Number, required: true },

    // ✅ Newly added fields
    language: { type: String, required: false },
    speciality: { type: String, required: false }, // e.g., "Veg", "Non-Veg"
    state: { type: String, required: false },
    maritalStatus: { type: String, required: false },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
      video: String, 

  },
  { timestamps: true }
);

module.exports = mongoose.model("Maid", MaidSchema);
