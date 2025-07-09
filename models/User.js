const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: false },
  isAdmin: { type: Boolean, default: false },

  phone: { type: String, required: false },     // ✅ Add this
  address: { type: String, required: false },   // ✅ And this

  verificationToken: { type: String },
  googleId: { type: String },
  photo: { type: String, default: "" },
  emailVerified: { type: Boolean, default: false },
  passwordNotSet: { type: Boolean, default: false },

  referralCode: { type: String, unique: true, sparse: true },
  referredBy: { type: String, default: null },
});


module.exports = mongoose.model("User", userSchema);
