const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: false },
    isAdmin: { type: Boolean, default: false },

  verificationToken: { type: String },
  googleId: {
    type: String,
  },
  photo: { type: String, default: "" }, // URL of profile image

  emailVerified: {
    type: Boolean,
    default: false, // Only true after email verification
  },
  passwordNotSet: { type: Boolean, default: false },


});

module.exports = mongoose.model("User", userSchema);
