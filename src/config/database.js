const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

// Cache connection for serverless environments (Vercel)
let cachedConnection = null;

const connectDB = async () => {
  if (cachedConnection) {
    console.log("✓ Using cached MongoDB connection");
    return cachedConnection;
  }

  try {
    console.log("Attempting MongoDB connection...");
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI environment variable is not set");
    }

    const connection = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    cachedConnection = connection;
    console.log("✓ MongoDB connected successfully");
    return connection;
  } catch (error) {
    console.error("✗ MongoDB connection failed:", error.message);
    console.error("Environment variables:", {
      MONGODB_URI: process.env.MONGODB_URI ? "set" : "NOT SET",
      NODE_ENV: process.env.NODE_ENV || "not set",
    });
    if (process.env.VERCEL !== "1") {
      process.exit(1);
    }
    throw error;
  }
};

module.exports = connectDB;
