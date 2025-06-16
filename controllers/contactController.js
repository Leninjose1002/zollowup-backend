const Contact = require("../models/Contact");
const nodemailer = require("nodemailer");

const handleContactForm = async (req, res) => {
  try {
    const { fullName, email, phone, message } = req.body;

    if (!fullName || !email || !phone || !message) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const contact = new Contact({ fullName, email, phone, message });
    await contact.save();

    // ✅ Use same config as nurse booking
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.ADMIN_EMAIL, // Or any receiver
      subject: `📩 New Contact Form Submission from ${fullName}`,
      html: `
        <h3>Contact Details:</h3>
        <ul>
          <li><strong>Name:</strong> ${fullName}</li>
          <li><strong>Email:</strong> ${email}</li>
          <li><strong>Phone:</strong> ${phone}</li>
          <li><strong>Message:</strong><br/>${message}</li>
        </ul>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: "Message sent successfully!" });
  } catch (error) {
    console.error("❌ Error in contact controller:", error);
    res.status(500).json({ message: "Failed to send message" });
  }
};

module.exports = { handleContactForm };
