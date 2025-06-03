const mongoose = require("mongoose");
const dotenv = require("dotenv");
const bcrypt = require("bcrypt");
const Employee = require("./models/Employee");

dotenv.config();

const createEmployee = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("📦 Connected to MongoDB");

    const hashedPassword = await bcrypt.hash("employee123", 10);

    const employee = new Employee({
      name: "John Doe",
      email: "employee@example.com",
      password: hashedPassword,
      position: "Cleaner", // optional
    });

    await employee.save();
    console.log("✅ Employee created:", employee.email);

    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  } catch (err) {
    console.error("❌ Failed to seed employee:", err.message);
    process.exit(1);
  }
};

createEmployee();
