const bcrypt = require("bcryptjs");

bcrypt.hash("admin123", 10).then((hashedPassword) => {
  console.log("✅ Hashed password:", hashedPassword);
});
