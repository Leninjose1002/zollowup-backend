// 📁 utils/sendSMS.js
// Utility to send SMS/OTP messages

// Option 1: Using Twilio (recommended)
const twilio = require("twilio");

const sendSMSTwilio = async (phoneNumber, message) => {
  try {
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    const result = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER, // Your Twilio phone number
      to: phoneNumber, // Recipient's phone number
    });

    console.log(`✅ SMS sent successfully. SID: ${result.sid}`);
    return result;
  } catch (error) {
    console.error("❌ Twilio SMS error:", error);
    throw new Error("Failed to send SMS");
  }
};

// Option 2: Using AWS SNS
const AWS = require("aws-sdk");

const sendSMSAWS = async (phoneNumber, message) => {
  try {
    const sns = new AWS.SNS({
      region: process.env.AWS_REGION,
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    });

    const params = {
      Message: message,
      PhoneNumber: phoneNumber,
      MessageAttributes: {
        "AWS.SNS.SMS.SenderID": {
          DataType: "String",
          StringValue: "Zollowup",
        },
        "AWS.SNS.SMS.SMSType": {
          DataType: "String",
          StringValue: "Transactional",
        },
      },
    };

    const result = await sns.publish(params).promise();
    console.log(`✅ SMS sent successfully via AWS SNS. MessageId: ${result.MessageId}`);
    return result;
  } catch (error) {
    console.error("❌ AWS SNS SMS error:", error);
    throw new Error("Failed to send SMS");
  }
};

// Option 3: Using OTP provider like MSG91, Nexmo, etc.
const sendSMSViaProvider = async (phoneNumber, message) => {
  try {
    const axios = require("axios");

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

// Main sendSMS function - choose your provider
const sendSMS = async (phoneNumber, message) => {
  const provider = process.env.SMS_PROVIDER || "twilio"; // default to twilio

  try {
    let result;
    
    if (provider === "twilio") {
      result = await sendSMSTwilio(phoneNumber, message);
    } else if (provider === "aws-sns") {
      result = await sendSMSAWS(phoneNumber, message);
    } else if (provider === "msg91" || provider === "custom") {
      result = await sendSMSViaProvider(phoneNumber, message);
    } else {
      throw new Error(`Unknown SMS provider: ${provider}`);
    }

    return result;
  } catch (error) {
    console.error("❌ Error sending SMS:", error.message);
    throw error;
  }
};

module.exports = sendSMS;
