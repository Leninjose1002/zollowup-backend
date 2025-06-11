const bcrypt = require("bcrypt");

const testPassword = "test1234";
const storedHash = "$2a$10$YwmxBHEa0ojkUKNDZXYiieyGp7S84qk6SRW/3F2yF/CyIovFhJb5C";

async function runTest() {
  try {
    const result = await bcrypt.compare(testPassword, storedHash);
    console.log("✅ Password match result:", result);
  } catch (err) {
    console.error("❌ Error during bcrypt comparison:", err);
  }
}

runTest();
