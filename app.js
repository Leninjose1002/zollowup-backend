const express = require("express");
const dotenv = require("dotenv");
const passport = require("passport");
const cors = require("cors");
const cookieParser = require("cookie-parser");

dotenv.config();
const app = express();

console.log("RAZORPAY_KEY_ID:", process.env.RAZORPAY_KEY_ID);
console.log("RAZORPAY_KEY_SECRET:", process.env.RAZORPAY_KEY_SECRET);


// ✅ Load Google OAuth Strategy before routes
require("./config/passport");

// ✅ Import route modules
const userGoogleAuthRoutes = require("./routes/userGoogleAuthRoutes");
const userAuthRoutes = require("./routes/userAuthRoutes");
const userProfileRoutes = require("./routes/userProfileRoutes");
const employeeAuthRoutes = require("./routes/employeeAuthRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const serviceRoutes = require("./routes/serviceRoutes");
const locationRoutes = require("./routes/locationRoutes");
const contactRoutes = require("./routes/contactRoutes");
const maidRoutes = require("./routes/maidRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const chatRoutes = require("./routes/chatRoutes");
const paymentRoutes = require("./routes/paymentRoutes");

// ✅ CORS Configuration (allow frontend domains)
const allowedOrigins = [
  "http://localhost:3000",
  "https://zollowupdemo.vercel.app"
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
}));

// ✅ Core Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(passport.initialize());

// ✅ Route registration
app.use("/api/users", userGoogleAuthRoutes);     // Google login
app.use("/api/users", userAuthRoutes);           // Email login/register
app.use("/api/users", userProfileRoutes);        // Profile APIs
app.use("/api/employees", employeeAuthRoutes);   // Employee login
app.use("/api/bookings", bookingRoutes);         // Booking logic
app.use("/api/services", serviceRoutes);         // Services
app.use("/api/location", locationRoutes);        // Cities & locations
app.use("/api/contact", contactRoutes);          // Contact form
app.use("/api/maids", maidRoutes);               // Maid management
app.use("/api/reviews", reviewRoutes);           // Reviews
app.use("/api/chat", chatRoutes);                // Chat feature
app.use("/api/payment", paymentRoutes);          // Razorpay etc.

// ✅ Serve uploads
app.use("/uploads", express.static("uploads"));

// ✅ API Health Check
app.get("/", (req, res) => {
  res.send("🚀 API is running...");
});

// ✅ Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something went wrong!");
});

module.exports = app;
