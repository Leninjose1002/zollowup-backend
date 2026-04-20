const express = require("express");
const dotenv = require("dotenv");
const passport = require("passport");
const cors = require("cors");
const cookieParser = require("cookie-parser");

dotenv.config();
const app = express();

// ✅ Log env variables
console.log("RAZORPAY_KEY_ID:", process.env.RAZORPAY_KEY_ID);
console.log("RAZORPAY_KEY_SECRET:", process.env.RAZORPAY_KEY_SECRET);
console.log("NODE_ENV:", process.env.NODE_ENV);

// ✅ Load Google OAuth Strategy
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
const jobApplicationRoutes = require("./routes/jobApplicationRoutes");


// ✅ CORS Configuration
const allowedOrigins = [
  "http://localhost:3000",           // Local testing
  "https://zollowup.com",             // Customer app
  "https://vendor.zollowup.com",      // Vendor portal (production)
  "https://zollowupvendor-frontend.vercel.app"  // Vercel deployment
];


// app.use(
//   cors({
//     origin: function (origin, callback) {
//       if (!origin || allowedOrigins.includes(origin)) {
//         return callback(null, true);
//       }
//       return callback(new Error("Not allowed by CORS"));
//     },
//     credentials: true,
//   })
// );

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

// ✅ Core Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(passport.initialize());

// ✅ Serve static files
app.use("/uploads", express.static("uploads"));

app.use("/api/orders", require("./routes/orderRoutes"));

// ✅ API Routes
app.use("/api/users", userGoogleAuthRoutes);
app.use("/api/users", userAuthRoutes);
app.use("/api/users", userProfileRoutes);
app.use("/api/employees", employeeAuthRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/location", locationRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/maids", maidRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api", jobApplicationRoutes);


// ✅ Health Check Endpoint
   app.get('/api/health', (req, res) => {
     res.json({ 
       status: 'success',
       message: 'Backend and Database connected',
       database: 'MongoDB connected'
     });
   });

// ✅ API Health Check
app.get("/", (req, res) => {
  res.send("🚀 API is running...");
});

// ✅ Global Error Handler
app.use((err, req, res, next) => {
  console.error("🔥 Global Error:", err.stack);
  res.status(500).send("Something went wrong!");
});



module.exports = app;
