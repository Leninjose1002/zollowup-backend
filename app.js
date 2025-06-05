const express = require("express");
const dotenv = require("dotenv");
const passport = require("passport");
const session = require("express-session");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { handleContactForm } = require("./controllers/contactController");

dotenv.config();
const app = express();

// ✅ CORS Configuration + Preflight Handling (MUST BE BEFORE ROUTES)
app.use(cors({
  origin: [
    "http://localhost:3000",
    "https://zollowupdemo.vercel.app"
  ],
  credentials: true,
}));
app.options("*", cors()); // ✅ Preflight requests

// ✅ Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(passport.initialize());

// ✅ Routes
app.post("/contact", handleContactForm);

// ✅ Import routes
const userAuthRoutes = require("./routes/userAuthRoutes");
const userProfileRoutes = require("./routes/userProfileRoutes");
const employeeAuthRoutes = require("./routes/employeeAuthRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const serviceRoutes = require("./routes/serviceRoutes");
const locationRoutes = require("./routes/locationRoutes");
const contactRoutes = require("./routes/contactRoutes");
const maidRoutes = require("./routes/maidRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const userGoogleAuthRoutes = require("./routes/userGoogleAuthRoutes");
const chatRoutes = require("./routes/chatRoutes");
const paymentRoutes = require("./routes/paymentRoutes");

require('./config/passport');

// ✅ Register all API routes
app.use("/api/users", userAuthRoutes);           // register, login, verify
app.use("/api/users", userProfileRoutes);        // profile, update
app.use("/api/users", userGoogleAuthRoutes);     // Google OAuth
app.use("/api/employees", employeeAuthRoutes);   // employee login
app.use("/api/bookings", bookingRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/location", locationRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/maids", maidRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/payment", paymentRoutes);

// ✅ Static file serving for uploads
app.use("/uploads", express.static("uploads"));

// ✅ Root route
app.get("/", (req, res) => {
  res.send("🚀 API is running...");
});

// ✅ Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something went wrong!");
});

module.exports = app;
