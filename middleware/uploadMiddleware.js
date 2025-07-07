// 📁 middleware/uploadMiddleware.js
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Base uploads directory
const baseDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(baseDir)) fs.mkdirSync(baseDir);

// Ensure subfolder exists
const ensureSubfolder = (folder) => {
  const fullPath = path.join(baseDir, folder);
  if (!fs.existsSync(fullPath)) fs.mkdirSync(fullPath);
  return fullPath;
};

// Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = "other";
    switch (file.fieldname) {
      case "photo":
        folder = "photos";
        break;
      case "aadhar":
        folder = "aadhar";
        break;
      case "resume":
        folder = "resume";
        break;
      case "otherId":
      case "pan":
        folder = "pan";
        break;
      default:
        folder = "other";
    }
    cb(null, ensureSubfolder(folder));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  },
});

// Allowed types
const allowedMimeTypes = [
  "image/jpeg",
  "image/png",
  "image/jpg",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const fileFilter = (req, file, cb) => {
  const isAllowed = allowedMimeTypes.includes(file.mimetype);
  if (isAllowed) cb(null, true);
  else cb(new Error("Only images and document files are allowed."));
};

const upload = multer({ storage, fileFilter });

module.exports = upload;
