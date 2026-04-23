// 📁 utils/sendSMS.js
// Utility to send SMS/OTP messages

const axios = require("axios");

// Option 3: Using OTP provider like MSG91, Nexmo, etc.
const sendSMS = async (phoneNumber, message) => {
  try {

    // Format phone number (remove + if present)
    const formattedPhone = phoneNumber.replace("+", "");

    // MSG91 API endpoint
    const url = "https://api.msg91.com/api/sendhttp.php";

    // Parameters for MSG91 API
    const params = {
      authkey: process.env.MSG91_AUTH_KEY,
      mobiles: formattedPhone,
      message: message,
      route: "4",  // ✅ "4" for OTP (NOT "otp")
      sender: process.env.MSG91_SENDER,  // ✅ Add sender ID
    };

    // ✅ USE GET REQUEST
    const response = await axios.get(url, { params });

    console.log(`✅ OTP sent successfully via MSG91:`, response.data);
    return response.data;
  } catch (error) {
    console.error("❌ MSG91 error:", error.message);
    throw new Error("Failed to send SMS");
  }
};

module.exports = sendSMS;
