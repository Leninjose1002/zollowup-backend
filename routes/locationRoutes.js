const express = require("express");
const axios = require("axios");
const router = express.Router();

router.get("/", async (req, res) => {
  const { lat, lng } = req.query;

  if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
    return res.status(400).json({ error: "Latitude and longitude are required in valid format." });
  }

  try {
    const apiUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${process.env.GOOGLE_API_KEY}`;
    const response = await axios.get(apiUrl);
    const results = response.data.results;

    if (!results || results.length === 0) {
      return res.status(404).json({ error: "No location found" });
    }

    const components = results[0].address_components;
    const formattedAddress = results[0].formatted_address;

    // Debugging: log all address components
    console.log("🔍 Address Components:");
    components.forEach(c => {
      console.log(`${c.types.join(", ")} => ${c.long_name}`);
    });

    // Initialize fields
    let locationDetails = {
      formatted_address: formattedAddress,
      locality: "",
      state: "",
      postal_code: "",
      sublocality: "",
      neighborhood: ""
    };

    // Extract data
    for (const component of components) {
      const types = component.types;

      if (types.includes("locality")) locationDetails.locality = component.long_name;
      if (types.includes("administrative_area_level_1")) locationDetails.state = component.long_name;
      if (types.includes("postal_code")) locationDetails.postal_code = component.long_name;
      if (types.includes("sublocality") || types.includes("sublocality_level_1")) locationDetails.sublocality = component.long_name;
      if (types.includes("neighborhood")) locationDetails.neighborhood = component.long_name;
    }

    res.json({ address: locationDetails });
  } catch (error) {
    console.error("❌ Geolocation error:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to fetch location" });
  }
});

module.exports = router;
