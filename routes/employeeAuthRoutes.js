// 📁 routes/employeeAuthRoutes.js
const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const passport = require("passport");
const Employee = require("../models/Employee");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

console.log("✅ employeeAuthRoutes.js loaded");


// 🔐 Employee Login
// POST /api/employees/login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ msg: "Email and password are required" });
  }

  try {
    const employee = await Employee.findOne({ email });
    if (!employee) {
      return res.status(401).json({ msg: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, employee.password);
    if (!isMatch) {
      return res.status(401).json({ msg: "Invalid credentials" });
    }

    const token = jwt.sign(
      { userId: employee._id, userType: "employee" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // ✅ Set the token in a cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: true, // use false if testing only on localhost
      sameSite: "None", // Required for cross-domain (e.g., Vercel frontend)
      maxAge: 3600000, // 1 hour
    });

    // ✅ Return employee info in response
    res.json({
      message: "Login successful",
      employee: {
        id: employee._id,
        name: employee.name,
        email: employee.email,
        position: employee.position,
      },
    });
  } catch (error) {
    console.error("❌ Employee login error:", error);
    res.status(500).json({ msg: "Internal Server Error" });
  }
});


// 🔵 GET current employee profile (if authenticated)
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const employee = await Employee.findById(req.user.userId).select("-password");
    if (!employee) return res.status(404).json({ message: "Employee not found" });
    res.json(employee);
  } catch (err) {
    console.error("❌ Error fetching employee:", err);
    res.status(500).json({ message: "Server error" });
  }
});



// CRUD: GET all employees (Admin only)
router.get("/", authMiddleware, async (req, res) => {
  try {
    const employees = await Employee.find({});
    res.json(employees);
  } catch (error) {
    res.status(500).json({ message: "Error fetching employees", error });
  }
});

// CRUD: UPDATE employee
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const updatedEmployee = await Employee.findOneAndUpdate(
      { _id: req.params.id },
      req.body,
      { new: true }
    );

    if (!updatedEmployee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    res.json(updatedEmployee);
  } catch (error) {
    res.status(500).json({ message: "Error updating employee", error });
  }
});

// CRUD: DELETE employee
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const deletedEmployee = await Employee.findOneAndDelete({ _id: req.params.id });
    if (!deletedEmployee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    res.json({ message: "Employee deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting employee", error });
  }
});

module.exports = router;
