const express = require("express");
const { addRating, getStats, getRatingLogs } = require("../controllers/ratingController");
const tokenValidation = require("../middleware/tokenValidation");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

router.post("/add", tokenValidation, addRating);
router.get("/stats", getStats);
router.get("/logs", authMiddleware, getRatingLogs);

module.exports = router;
