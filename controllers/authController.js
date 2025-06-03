const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Employee = require("../models/Employee");

const loginEmployee = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if employee exists
    const employee = await Employee.findOne({ email });
    if (!employee) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Compare password with hashed password
    const isMatch = await bcrypt.compare(password, employee.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Generate JWT token
    // const token = jwt.sign(
    //   { userId: employee._id },
    //   process.env.JWT_SECRET,
    //   { expiresIn: "7d" }
    // );
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
  expiresIn: "7d",
});


    res.json({ message: "Login successful", token });
  } catch (error) {
    res.status(500).json({ message: "Error logging in", error });
  }
};

module.exports = { loginEmployee };
