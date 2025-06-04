// === 📁 routes/userGoogleAuthRoutes.js ===
const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');

const router = express.Router();

// ✅ Start Google Sign-In for users
router.get(
  '/google',
  passport.authenticate('google-user', {
    scope: ['profile', 'email'],
    prompt: 'select_account',
  })
);

// ✅ Google OAuth Callback
router.get(
  '/google/callback',
  passport.authenticate('google-user', {
    session: false,
    failureRedirect: '/user-login',
  }),
  (req, res) => {
    try {
      console.log('✅ Google callback hit');
      console.log('👤 req.user =', req.user);

      if (!req.user) {
        console.error('❌ No user returned from Google strategy');
        return res.redirect('/user-login');
      }

      const needsPassword = !req.user.password;

      const token = jwt.sign(
        {
          userId: req.user._id,
          userType: 'user',
          isAdmin: req.user.isAdmin || false,
        },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
      
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

const redirectURL = `${FRONTEND_URL}/user/google-redirect?token=${token}&needsPassword=${needsPassword}`;
      console.log('🔁 Redirecting to:', redirectURL);
      return res.redirect(redirectURL);
    } catch (err) {
      console.error('❌ Google callback error:', err);
      return res.status(500).send('Something went wrong!');
    }
  }
);

module.exports = router;
