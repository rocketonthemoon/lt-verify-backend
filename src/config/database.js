const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

const connectDB = async () => {
  try {
    console.log("Attempting MongoDB connection...");
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI environment variable is not set");
    }
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✓ MongoDB connected successfully");
  } catch (error) {
    console.error("✗ MongoDB connection failed:", error.message);
    console.error("Environment variables:", {
      MONGODB_URI: process.env.MONGODB_URI ? "set" : "NOT SET",
      NODE_ENV: process.env.NODE_ENV || "not set",
    });
    if (process.env.VERCEL !== "1") {
      process.exit(1);
    }
  }
};

module.exports = connectDB;
