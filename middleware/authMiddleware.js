require("dotenv").config();
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const authMiddleware = async (req, res, next) => {
  // 🧪 TEST MODE: Skip real auth
 if (process.env.TEST_MODE === "true") {
    const testUser = await User.findOne(); // 🛑 Always returns the first user (Pragati)

  console.log("🟢 TEST MODE ENABLED: Skipping authentication.");
  try {
    const testUser = await User.findOne();
    if (!testUser) {
      return res.status(404).json({ message: "No test user found in DB." });
    }

    req.user = {
      userId: testUser._id,
      userType: "user", 
      isAdmin: true, // ✅ force true for testing
    };

    return next();
  } catch (err) {
    console.error("❌ Test mode user fetch failed:", err);
    return res.status(500).json({ message: "Test mode error" });
  }
}


  // 🛡️ Check for token in cookies or headers
  const token = req.cookies?.token || req.header("Authorization")?.replace("Bearer ", "");
  if (!token) {
    return res.status(401).json({ message: "Access denied. No token provided." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = {
      userId: decoded.userId,
      userType: decoded.userType || "user",
      isAdmin: decoded.isAdmin || false,
    };

    next(); // ✅ Auth success
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired. Please log in again." });
    }
    return res.status(401).json({ message: "Invalid token." });
  }
};

module.exports = authMiddleware; 
