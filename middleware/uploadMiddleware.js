const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure the uploads directory exists
const uploadsDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  },
});

// ✅ FIXED file filter
const fileFilter = (req, file, cb) => {
  const allowedExt = /jpeg|jpg|png|mp4|mov|avi/;
  const extname = allowedExt.test(path.extname(file.originalname).toLowerCase());
  const mimetype = file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/");

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error("Only image/video files are allowed"));
  }
};

const upload = multer({ storage, fileFilter });
module.exports = upload;
