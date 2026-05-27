const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");

// Import config
const connectDB = require("./config/database");

// Import routes
const phoneRoutes = require("./routes/phoneRoutes");
const ratingRoutes = require("./routes/ratingRoutes");
const adminRoutes = require("./routes/adminRoutes");

dotenv.config();

const app = express();

// Trust Vercel proxy headers
app.set('trust proxy', 1);

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "http://localhost:5173").split(",");

// Middleware
app.use(helmet());
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    cb(new Error("Not allowed by CORS"));
  },
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static("public"));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
app.use("/api/", limiter);

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "Too many login attempts. Try again in 15 minutes." },
});
app.use("/api/admin/login", loginLimiter);

// Routes
app.use("/api/phone", phoneRoutes);
app.use("/api/rating", ratingRoutes);
app.use("/api/admin", adminRoutes);

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK" });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// Start server (only if not on Vercel)
if (process.env.VERCEL !== "1") {
  const PORT = process.env.PORT || 4000;

  const startServer = async () => {
    try {
      await connectDB();
      app.listen(PORT, () => {
        console.log(`✓ Server running on port ${PORT}`);
        console.log(`✓ Environment: ${process.env.NODE_ENV}`);
      });
    } catch (error) {
      console.error("✗ Failed to start server:", error.message);
      process.exit(1);
    }
  };

  startServer();

  process.on("SIGINT", async () => {
    console.log("\n✓ Shutting down gracefully...");
    process.exit(0);
  });
}

module.exports = app;
