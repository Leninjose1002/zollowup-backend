const Contact = require("../models/Contact");
const nodemailer = require("nodemailer");

const handleContactForm = async (req, res) => {
  try {
    const { fullName, email, phone, message } = req.body;

    // Validate fields
    if (!fullName || !email || !phone || !message) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Save to DB
    const contact = new Contact({ fullName, email, phone, message });
    await contact.save();

    // Email setup
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "your-email@gmail.com",
        pass: "your-app-password", // use App Password if 2FA is on
      },
    });

    const mailOptions = {
      from: email,
      to: "your-email@gmail.com",
      subject: `New Contact from ${fullName}`,
      text: `Full Name: ${fullName}\nEmail: ${email}\nPhone: ${phone}\nMessage: ${message}`,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: "Message sent successfully!" });
  } catch (error) {
    console.error("Error in contact controller:", error);
    res.status(500).json({ message: error.message || "Something went wrong" });
  }
};



module.exports = { handleContactForm };
