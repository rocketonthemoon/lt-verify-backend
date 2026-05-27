const express = require("express");
const {
  queryPhone,
  requestPhoneAddition,
} = require("../controllers/phoneController");

const router = express.Router();

// Query phone number info
router.get("/query", queryPhone);

// Request to add phone number
router.post("/request-verification", requestPhoneAddition);

module.exports = router;
