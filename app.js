const express = require("express");
const dotenv = require("dotenv");
const passport = require("passport");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { handleContactForm } = require("./controllers/contactController");

dotenv.config();
const app = express();

// ✅ Load Google OAuth Strategy before routes
require("./config/passport");

// ✅ Then register Google auth route FIRST
const userGoogleAuthRoutes = require("./routes/userGoogleAuthRoutes");
app.use("/api/users", userGoogleAuthRoutes);     // 👈 Move this up

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

// ✅ Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(passport.initialize());

// ✅ Public route for contact form
app.post("/contact", handleContactForm);

// ✅ Import route modules
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

// ✅ Route registration
app.use("/api/users", userAuthRoutes);           // login/register
app.use("/api/users", userProfileRoutes);        // profile routes
app.use("/api/employees", employeeAuthRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/location", locationRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/maids", maidRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/payment", paymentRoutes);

// ✅ Static uploads
app.use("/uploads", express.static("uploads"));

// ✅ API status route
app.get("/", (req, res) => {
  res.send("🚀 API is running...");
});

// ✅ Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something went wrong!");
});

module.exports = app;
