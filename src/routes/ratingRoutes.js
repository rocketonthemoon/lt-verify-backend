const express = require("express");
const { addRating, getStats } = require("../controllers/ratingController");
const tokenValidation = require("../middleware/tokenValidation");

const router = express.Router();

router.post("/add", tokenValidation, addRating);
router.get("/stats", getStats);

module.exports = router;
