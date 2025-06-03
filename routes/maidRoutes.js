const express = require("express");
const router = express.Router();
const {
  getAllMaids,
  getMaidById,
  createMaid,
  updateMaid,
  deleteMaid,
} = require("../controllers/maidController");
const upload = require("../middleware/uploadMiddleware");

// Use upload.fields() to handle image & video together
router.post("/", upload.fields([
  { name: "image", maxCount: 1 },
  { name: "video", maxCount: 1 }
]), createMaid);

router.get("/", getAllMaids); // Get all maids
router.get("/:id", getMaidById); // Get maid by ID
router.put("/:id", updateMaid); // Update maid
router.delete("/:id", deleteMaid); // Delete maid

module.exports = router;
