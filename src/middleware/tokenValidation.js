const crypto = require("crypto");
const AdminToken = require("../models/AdminToken");

const validateRatingAuthToken = async (req, res, next) => {
  try {
    const { ratingAuthToken, token } = req.body;
    const submittedToken = ratingAuthToken || token;

    if (!submittedToken) {
      return res.status(400).json({ error: "Rating auth token is required" });
    }

    const tokenHash = crypto
      .createHash("sha256")
      .update(submittedToken)
      .digest("hex");
    const adminToken = await AdminToken.findOne({
      tokenHash,
      isUsed: { $ne: true },
      deactivated: { $ne: true },
      expiresAt: { $gt: new Date() },
    });

    if (!adminToken) {
      return res.status(401).json({
        error: "Invalid, expired, or already used token",
      });
    }

    req.ratingAuthToken = adminToken;
    next();
  } catch (error) {
    res.status(500).json({ error: "Token validation failed" });
  }
};

module.exports = validateRatingAuthToken;
