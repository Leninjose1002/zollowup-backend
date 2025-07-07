// 📁 models/JobApplication.js
const mongoose = require("mongoose");

const jobApplicationSchema = new mongoose.Schema({
  name: String,
  phone: String,
  address: String,
  gender: String,
  maritalStatus: String,
  religion: String,
  category: String,
  experience: String,
  age: String,
  education: String,
  nearbyCity: String,
  additionalInfo: String,

  photoFile: String,
  aadharFile: String,
  resumeFile: String,
  otherIdFile: String,
  otherIdType: String,

  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("JobApplication", jobApplicationSchema);
