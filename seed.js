const mongoose = require("mongoose");
const Service = require("../models/Service"); 

mongoose.connect("mongodb://127.0.0.1:27017/yourDatabase", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const services = [
  { name: "Maid Services", description: "Professional home cleaning", category: "Maid", price: 1500 },
  { name: "Nursing Care", description: "24/7 patient care service", category: "Health", price: 2500 },
  { name: "Drivers", description: "Professional car drivers available", category: "Transport", price: 2000 },
  { name: "Cooks", description: "Expert home chefs", category: "Maid", price: 1800 },
  { name: "Electrician", description: "Electrical repair services", category: "Home Repair", price: 1200 },
  { name: "Plumber", description: "Expert plumbing services", category: "Home Repair", price: 1300 },
  { name: "Housekeeping", description: "Complete housekeeping services", category: "Maid", price: 1600 },
];

const seedDB = async () => {
  await Service.deleteMany({}); // Clear existing services
  await Service.insertMany(services);
  console.log("✅ Database Seeded with Services");
  mongoose.connection.close();
};

seedDB();
