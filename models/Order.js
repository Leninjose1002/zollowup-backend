// models/Order.js
const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  serviceType: { type: String, required: true }, // e.g. "maid", "electrician"
  items: [
    {
      title: String,
      image: String,
      quantity: Number,
      price: String,
    },
  ],
  totalAmount: { type: Number, required: true },
  status: { type: String, default: "Placed" },
}, { timestamps: true });

module.exports = mongoose.model("Order", orderSchema);
