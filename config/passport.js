const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const Employee = require("../models/Employee");
const User = require("../models/User");
require("dotenv").config();

// === User Strategy ===
console.log("📌 Registering google-user strategy...");
console.log("GOOGLE_CLIENT_ID:", process.env.GOOGLE_CLIENT_ID);
console.log("GOOGLE_CALLBACK_URL_USER:", process.env.GOOGLE_CALLBACK_URL_USER);

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
        console.log("👤 Google Profile Email:", profile.emails[0].value);

        // 🔍 First check by googleId
        let user = await User.findOne({ googleId: profile.id });

        // 🔁 If not found, check if a user already exists with same email
        if (!user) {
          user = await User.findOne({ email: profile.emails[0].value });

          if (user) {
            // ✅ Link Google account
            user.googleId = profile.id;
            user.emailVerified = true;
            user.passwordNotSet = true;
            await user.save();
            return done(null, user);
          }

          // 🆕 Create a new user only if none found
          user = await User.create({
            name: profile.displayName,
            email: profile.emails[0].value,
            googleId: profile.id,
            emailVerified: true,
            passwordNotSet: true,
          });
        }

        return done(null, user);
      } catch (err) {
        console.error("❌ Google Strategy error:", err);
        return done(err, null);
      }
    }
  )
);

