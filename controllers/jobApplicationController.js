const JobApplication = require("../models/JobApplication");
const nodemailer = require("nodemailer");
require("dotenv").config();

const submitJobApplication = async (req, res) => {
  try {
    const {
      name,
      phone,
      address,
      gender,
      maritalStatus,
      religion,
      category,
      experience,
      age,
      education,
      city,
      additionalInfo,
      otherIdType,
    } = req.body;

    const newApp = new JobApplication({
      name,
      phone,
      address,
      gender,
      maritalStatus,
      religion,
      category,
      experience,
      age,
      education,
      city,
      additionalInfo,
      otherIdType,
      aadharFile: req.files?.aadhar?.[0]?.filename,
      photoFile: req.files?.photo?.[0]?.filename,
      resumeFile: req.files?.resume?.[0]?.filename,
      otherIdFile: req.files?.otherId?.[0]?.filename,
    });

    await newApp.save();

    // ✅ Set up nodemailer transporter
    const transporter = nodemailer.createTransport({
      service: "gmail", // or "GoDaddy", or use smtp settings
      auth: {
        user: process.env.EMAIL_USER, // e.g. sales@zollowup.com
        pass: process.env.EMAIL_PASS, // App password or GoDaddy SMTP password
      },
    });

    // ✅ Define mail options
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: "zollowup@gmail.com", // 💡 Replace with your email
      subject: "📩 New Job Application Received",
      html: `
        <h2>New Job Application Details</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Address:</strong> ${address}</p>
        <p><strong>Gender:</strong> ${gender}</p>
        <p><strong>Marital Status:</strong> ${maritalStatus}</p>
        <p><strong>Religion:</strong> ${religion}</p>
        <p><strong>Category:</strong> ${category}</p>
        <p><strong>Experience:</strong> ${experience} years</p>
        <p><strong>Age:</strong> ${age}</p>
        <p><strong>Education:</strong> ${education}</p>
        <p><strong>Nearby City:</strong> ${city}</p>
        <p><strong>Other ID Type:</strong> ${otherIdType}</p>
        <p><strong>Additional Info:</strong> ${additionalInfo || "N/A"}</p>
        <p><strong>📎 Uploaded Files:</strong></p>
        <ul>
          <li>Aadhar: ${req.files?.aadhar?.[0]?.filename || "Not uploaded"}</li>
          <li>Photo: ${req.files?.photo?.[0]?.filename || "Not uploaded"}</li>
          <li>Resume: ${req.files?.resume?.[0]?.filename || "Not uploaded"}</li>
          <li>Other ID: ${req.files?.otherId?.[0]?.filename || "Not uploaded"}</li>
        </ul>
      `,
    };

    // ✅ Send email
    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.error("❌ Email sending failed:", err);
      } else {
        console.log("📧 Email sent successfully:", info.response);
      }
    });

    // ✅ Send response to frontend
    res.status(200).json({ message: "Application submitted successfully" });
  } catch (error) {
    console.error("❌ Error in job form submission:", error);
    res.status(500).json({ message: "Failed to submit application" });
  }
};

module.exports = { submitJobApplication };
