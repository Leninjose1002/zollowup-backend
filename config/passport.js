const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const Employee = require("../models/Employee");
const User = require("../models/User");
require("dotenv").config();

// ==========================================
// 🔍 VALIDATE ENVIRONMENT VARIABLES
// ==========================================
console.log("\n========== ENVIRONMENT VARIABLES CHECK ==========");
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("GOOGLE_CLIENT_ID:", process.env.GOOGLE_CLIENT_ID ? "✅ SET" : "❌ MISSING");
console.log("GOOGLE_CLIENT_SECRET:", process.env.GOOGLE_CLIENT_SECRET ? "✅ SET" : "❌ MISSING");
console.log("GOOGLE_CALLBACK_URL_USER:", process.env.GOOGLE_CALLBACK_URL_USER ? "✅ SET" : "❌ MISSING");
console.log("GOOGLE_CALLBACK_URL_EMPLOYEE:", process.env.GOOGLE_CALLBACK_URL_EMPLOYEE ? "✅ SET" : "❌ MISSING");
console.log("RAZORPAY_KEY_ID:", process.env.RAZORPAY_KEY_ID ? "✅ SET" : "❌ MISSING");
console.log("RAZORPAY_KEY_SECRET:", process.env.RAZORPAY_KEY_SECRET ? "✅ SET" : "❌ MISSING");
console.log("MONGODB_URI:", process.env.MONGODB_URI ? "✅ SET" : "❌ MISSING");
console.log("================================================\n");

// ==========================================
// Check if all required variables are set
// ==========================================
const hasGoogleCredentials = 
  process.env.GOOGLE_CLIENT_ID && 
  process.env.GOOGLE_CLIENT_SECRET &&
  process.env.GOOGLE_CALLBACK_URL_USER &&
  process.env.GOOGLE_CALLBACK_URL_EMPLOYEE;

if (!hasGoogleCredentials) {
  console.error("\n❌ CRITICAL ERROR: Missing Google OAuth credentials!");
  console.error("Required environment variables in Vercel Settings:");
  console.error("  - GOOGLE_CLIENT_ID");
  console.error("  - GOOGLE_CLIENT_SECRET");
  console.error("  - GOOGLE_CALLBACK_URL_USER");
  console.error("  - GOOGLE_CALLBACK_URL_EMPLOYEE");
  console.error("\nMake sure these are set to 'All Environments' or 'Production'\n");
}

// ==========================================
// 📌 Register Google Strategies (Only if credentials exist)
// ==========================================
if (hasGoogleCredentials) {
  console.log("✅ Initializing Google OAuth Strategies...\n");

  // === User Google Strategy ===
  passport.use(
    "google-user",
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL_USER,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          console.log("👤 Google User Email:", profile.emails[0].value);

          let user = await User.findOne({ googleId: profile.id });

          if (!user) {
            user = await User.findOne({ email: profile.emails[0].value });

            if (user) {
              user.googleId = profile.id;
              user.emailVerified = true;
              user.passwordNotSet = true;
              await user.save();
              console.log("✅ User linked to existing account");
              return done(null, user);
            }

            user = await User.create({
              name: profile.displayName,
              email: profile.emails[0].value,
              googleId: profile.id,
              emailVerified: true,
              passwordNotSet: true,
            });
            console.log("✅ New user created");
          }

          return done(null, user);
        } catch (err) {
          console.error("❌ Google User Strategy Error:", err.message);
          return done(err, null);
        }
      }
    )
  );

  // === Employee Google Strategy ===
  passport.use(
    "google-employee",
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL_EMPLOYEE,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          console.log("👤 Google Employee Email:", profile.emails[0].value);

          let employee = await Employee.findOne({ googleId: profile.id });

          if (!employee) {
            employee = await Employee.findOne({ email: profile.emails[0].value });

            if (employee) {
              employee.googleId = profile.id;
              employee.emailVerified = true;
              employee.passwordNotSet = true;
              await employee.save();
              console.log("✅ Employee linked to existing account");
              return done(null, employee);
            }

            employee = await Employee.create({
              name: profile.displayName,
              email: profile.emails[0].value,
              googleId: profile.id,
              emailVerified: true,
              passwordNotSet: true,
            });
            console.log("✅ New employee created");
          }

          return done(null, employee);
        } catch (err) {
          console.error("❌ Google Employee Strategy Error:", err.message);
          return done(err, null);
        }
      }
    )
  );

  console.log("✅ Passport Google Strategies successfully initialized!\n");
} else {
  console.warn("⚠️  Google OAuth strategies NOT initialized - waiting for credentials\n");
}

module.exports = passport;
// const passport = require("passport");
// const GoogleStrategy = require("passport-google-oauth20").Strategy;
// const Employee = require("../models/Employee");
// const User = require("../models/User");
// require("dotenv").config();

// // 👇 Dynamically choose the callback URLs based on environment
// const GOOGLE_CALLBACK_URL_USER = process.env.GOOGLE_CALLBACK_URL_USER;
// const GOOGLE_CALLBACK_URL_EMPLOYEE = process.env.GOOGLE_CALLBACK_URL_EMPLOYEE;

// // === User Google Strategy ===
// console.log("📌 Registering google-user strategy...");
// console.log("NODE_ENV:", process.env.NODE_ENV);
// console.log("GOOGLE_CLIENT_ID:", process.env.GOOGLE_CLIENT_ID);
// console.log("GOOGLE_CALLBACK_URL_USER:", GOOGLE_CALLBACK_URL_USER);

// passport.use(
//   "google-user",
//   new GoogleStrategy(
//     {
//       clientID: process.env.GOOGLE_CLIENT_ID,
//       clientSecret: process.env.GOOGLE_CLIENT_SECRET,
//       callbackURL: process.env.GOOGLE_CALLBACK_URL_USER
//     },
//     async (accessToken, refreshToken, profile, done) => {
//       try {
//         console.log("👤 Google Profile Email:", profile.emails[0].value);

//         let user = await User.findOne({ googleId: profile.id });

//         if (!user) {
//           user = await User.findOne({ email: profile.emails[0].value });

//           if (user) {
//             user.googleId = profile.id;
//             user.emailVerified = true;
//             user.passwordNotSet = true;
//             await user.save();
//             return done(null, user);
//           }

//           user = await User.create({
//             name: profile.displayName,
//             email: profile.emails[0].value,
//             googleId: profile.id,
//             emailVerified: true,
//             passwordNotSet: true,
//           });
//         }

//         return done(null, user);
//       } catch (err) {
//         console.error("❌ Google User Strategy Error:", err);
//         return done(err, null);
//       }
//     }
//   )
// );

// // === Employee Google Strategy ===
// passport.use(
//   "google-employee",
//   new GoogleStrategy(
//     {
//       clientID: process.env.GOOGLE_CLIENT_ID,
//       clientSecret: process.env.GOOGLE_CLIENT_SECRET,
//       callbackURL: GOOGLE_CALLBACK_URL_EMPLOYEE,
//     },
//     async (accessToken, refreshToken, profile, done) => {
//       try {
//         console.log("👤 Google Employee Email:", profile.emails[0].value);

//         let employee = await Employee.findOne({ googleId: profile.id });

//         if (!employee) {
//           employee = await Employee.findOne({ email: profile.emails[0].value });

//           if (employee) {
//             employee.googleId = profile.id;
//             employee.emailVerified = true;
//             employee.passwordNotSet = true;
//             await employee.save();
//             return done(null, employee);
//           }

//           employee = await Employee.create({
//             name: profile.displayName,
//             email: profile.emails[0].value,
//             googleId: profile.id,
//             emailVerified: true,
//             passwordNotSet: true,
//           });
//         }

//         return done(null, employee);
//       } catch (err) {
//         console.error("❌ Google Employee Strategy Error:", err);
//         return done(err, null);
//       }
//     }
//   )
// );
