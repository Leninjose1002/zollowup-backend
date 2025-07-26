const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true },  
  password: { type: String, required: false },             
  createdAt: { type: Date, default: Date.now },           
});

module.exports = mongoose.model("Employee", employeeSchema);
