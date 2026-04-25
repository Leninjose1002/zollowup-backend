// // 📁 utils/sendSMS.js
// // Utility to send SMS/OTP messages

// const axios = require("axios");

// // Option 3: Using OTP provider like MSG91, Nexmo, etc.
// const sendSMS = async (phoneNumber, message) => {
//   try {

//     // Format phone number (remove + if present)
//     const formattedPhone = phoneNumber.replace("+", "");

//     // MSG91 API endpoint
//     const url = "https://api.msg91.com/api/sendhttp.php";

//     // Parameters for MSG91 API
//     const params = {
//       authkey: process.env.MSG91_AUTH_KEY,
//       mobiles: formattedPhone,
//       message: message,
//       route: "4",  // ✅ "4" for OTP (NOT "otp")
//       sender: process.env.MSG91_SENDER,  // ✅ Add sender ID
//     };

//     // ✅ USE GET REQUEST
//     const response = await axios.get(url, { params });

//     console.log(`✅ OTP sent successfully via MSG91:`, response.data);
//     return response.data;
//   } catch (error) {
//     console.error("❌ MSG91 error:", error.message);
//     throw new Error("Failed to send SMS");
//   }
// };

// module.exports = sendSMS;

// 📁 backend/utils/sendSMS.js
// Utility to send SMS/OTP messages via MSG91

const axios = require("axios");

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
      route: "4",  // OTP route
      sender: process.env.MSG91_SENDER,
    };

    // 🔍 DEBUG LOGGING
    console.log("🔍 === MSG91 REQUEST ===");
    console.log("🔑 Auth Key:", process.env.MSG91_AUTH_KEY ? "✅ SET" : "❌ NOT SET");
    console.log("📤 Sender:", process.env.MSG91_SENDER);
    console.log("📱 Phone:", formattedPhone);
    console.log("📨 Message:", message);
    console.log("📊 Params:", params);

    // Send GET request to MSG91
    const response = await axios.get(url, { params });

    console.log("✅ === MSG91 SUCCESS ===");
    console.log("✅ Response:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ === MSG91 ERROR ===");
    console.error("❌ Error:", error.message);
    console.error("❌ Response Data:", error.response?.data);
    throw new Error("Failed to send SMS");
  }
};

module.exports = sendSMS;