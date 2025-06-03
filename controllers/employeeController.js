const Employee = require("../models/Employee");
const bcrypt = require("bcryptjs"); // For password comparison if required
const jwt = require("jsonwebtoken");

// @desc    Employee login
// @route   POST /api/employees/login
const loginEmployee = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if employee exists
    const employee = await Employee.findOne({ email });
    if (!employee) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Compare password (hashed if using bcrypt)
    const isMatch = await bcrypt.compare(password, employee.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: employee._id, userType: "employee" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Send response with token and employee data
    res.json({
      token,
      employee: {
        id: employee._id,
        email: employee.email,
      },
    });
  } catch (error) {
    console.error("❌ Login error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
};

// @desc    Get all employees (only if needed, adjust based on your use case)
// @route   GET /api/employees
const getAllEmployees = async (req, res) => {
  try {
    const employees = await Employee.find(); // No need to filter by userId unless it's required for access control
    res.status(200).json(employees);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// @desc    Update employee details
// @route   PUT /api/employees/:id
const updateEmployee = async (req, res) => {
  try {
    const updatedEmployee = await Employee.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json(updatedEmployee);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// @desc    Delete employee
// @route   DELETE /api/employees/:id
const deleteEmployee = async (req, res) => {
  try {
    await Employee.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Employee deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Export only the necessary functions
module.exports = { loginEmployee, getAllEmployees, updateEmployee, deleteEmployee };
