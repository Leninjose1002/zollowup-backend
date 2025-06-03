const express = require("express");
const axios = require("axios");
const router = express.Router();
const Location = require("../models/Location");

router.get("/", async (req, res) => {
  const { lat, lng } = req.query;

  if (isNaN(lat) || isNaN(lng)) {
    return res.status(400).json({ error: "Invalid latitude or longitude format" });
  }

  if (!lat || !lng) {
    return res.status(400).json({ error: "Latitude and longitude required" });
  }

  try {
    const apiUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${process.env.GOOGLE_API_KEY}`;

    const response = await axios.get(apiUrl);
    const results = response.data.results;

    let sublocality = "";
    let locality = "";
    let city = "";

    if (results.length > 0) {
      const components = results[0].address_components;

      for (const component of components) {
        if (component.types.includes("sublocality_level_1")) {
          sublocality = component.long_name;
        } else if (component.types.includes("locality")) {
          locality = component.long_name;
        } else if (component.types.includes("administrative_area_level_2")) {
          city = component.long_name;
        }
      }
    }

    const fullLocation = `${sublocality || locality || ""}${(sublocality || locality) && city ? ", " : ""}${city || ""}`.trim();

    // Optionally save to MongoDB
    const location = new Location({ latitude: lat, longitude: lng });
    await location.save();

    res.json({ city: fullLocation || "Unknown Location" });
  } catch (error) {
    console.error("Geolocation error:", error.response ? error.response.data : error.message);
    res.status(500).json({ error: "Failed to fetch location" });
  }
});

module.exports = router;
