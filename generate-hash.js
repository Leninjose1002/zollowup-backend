const bcrypt = require("bcrypt");

const plainPassword = "test1234"; // 👈 change this if you want another password

bcrypt.hash(plainPassword, 10).then((hash) => {
  console.log("🔐 Hashed password:", hash);
  process.exit(); // ✅ Exit after logging
});
