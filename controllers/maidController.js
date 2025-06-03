const Maid = require("../models/Maid");

// ✅ Get all maids
const getAllMaids = async (req, res) => {
  try {
    const { selectedHours } = req.query;
    console.log("Selected Hours received:", selectedHours);

    let filter = {};
    if (selectedHours) {
      filter.availableHours = { $elemMatch: { $regex: selectedHours, $options: "i" } };
    }

    const maids = await Maid.find(filter);
    res.json(maids);
  } catch (error) {
    console.error("❌ Error getting maids from DB:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Get maid by ID
const getMaidById = async (req, res) => {
  try {
    const maid = await Maid.findById(req.params.id);
    if (!maid) {
      return res.status(404).json({ message: "Maid not found" });
    }
    res.status(200).json(maid);
  } catch (err) {
    res.status(500).json({ message: "Error fetching maid" });
  }
};

// ✅ Create a new maid
const createMaid = async (req, res) => {
  try {
    const {
      name,
      age,
      experience,
      religion,
      availableHours,
      pricePerHour,
      language,
      speciality,
      state,
      maritalStatus,
      userId
    } = req.body;

    const image = req.files?.image?.[0]?.filename;
    const video = req.files?.video?.[0]?.filename;

    // ✅ Log what you're about to save
    console.log("📸 Image filename:", image);
    console.log("🎥 Video filename:", video);
    console.log("🧾 Maid body data:", req.body);

    const newMaid = new Maid({
      name,
      age,
      experience,
      religion,
      availableHours,
      pricePerHour,
      language,
      speciality,
      state,
      maritalStatus,
      userId,
      image: image ? `http://localhost:5000/uploads/${image}` : null,
      video: video ? video : null
    });

    // ✅ Log full maid object before saving
    console.log("🚀 Saving maid to DB:", newMaid);

    const savedMaid = await newMaid.save();

    // ✅ Log after saving
    console.log("✅ Maid saved successfully:", savedMaid);

    res.status(201).json(savedMaid);
  } catch (err) {
    console.error("❌ Error creating maid:", err.message);
    res.status(500).json({ message: err.message || "Server error" });
  }
};



// ✅ Update maid
const updateMaid = async (req, res) => {
  try {
    const updatedMaid = await Maid.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedMaid) {
      return res.status(404).json({ message: "Maid not found" });
    }
    res.status(200).json(updatedMaid);
  } catch (err) {
    res.status(500).json({ message: "Error updating maid" });
  }
};

// ✅ Delete maid
const deleteMaid = async (req, res) => {
  try {
    const deletedMaid = await Maid.findByIdAndDelete(req.params.id);
    if (!deletedMaid) {
      return res.status(404).json({ message: "Maid not found" });
    }
    res.status(200).json({ message: "Maid deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting maid" });
  }
};

// ✅ Proper export
module.exports = {
  getAllMaids,
  getMaidById,
  createMaid,
  updateMaid,
  deleteMaid,
};
