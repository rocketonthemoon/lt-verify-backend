const PhoneNumber = require("../models/PhoneNumber");
const Rating = require("../models/Rating");

// Query phone number reliability
const queryPhone = async (req, res) => {
  try {
    const { phoneNumber } = req.query;

    if (!phoneNumber || !/^\+(?:370\d{8}|91\d{10})$/.test(phoneNumber)) {
      return res.status(400).json({ error: "Phone number must be a valid Lithuanian (+370) or Indian (+91) number" });
    }

    const phone = await PhoneNumber.findOne({ phoneNumber }).populate(
      "verifiedByAdmin",
      "username email",
    );

    if (!phone) {
      return res.status(404).json({
        message: "Phone number not found in system",
        status: "unknown",
      });
    }

    const recentRatings = await Rating.find({ phoneNumber: phone._id })
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({
      phoneNumber: phone.phoneNumber,
      ownerName: phone.verified ? phone.ownerName : "Anonymous",
      verified: phone.verified,
      status: phone.status,
      averageReliability: phone.averageReliability,
      averageTimeliness: phone.averageTimeliness,
      totalRatings: phone.totalRatings,
      totalTransactions: phone.totalTransactions,
      verifiedByAdmin: phone.verified ? phone.verifiedByAdmin?.username : null,
      vouchedByAdminName: phone.vouchedByAdminName || null,
      verificationDate: phone.verified ? phone.verificationDate : null,
      recentRatings: recentRatings.map((r) => ({
        reliability: r.reliabilityRating,
        timeliness: r.timelinessRating,
        comment: r.comment,
        ratedAt: r.createdAt,
      })),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Request to add phone number (must be verified by admin)
const requestPhoneAddition = async (req, res) => {
  try {
    const { phoneNumber, ownerName, email, description } = req.body;

    if (!phoneNumber || !/^\+(?:370\d{8}|91\d{10})$/.test(phoneNumber)) {
      return res.status(400).json({ error: "Phone number must be a valid Lithuanian (+370) or Indian (+91) number" });
    }

    // Block if already verified — unverified placeholders (auto-created by ratings) can still be claimed
    const existingPhone = await PhoneNumber.findOne({ phoneNumber });
    if (existingPhone && existingPhone.verified) {
      return res.status(409).json({ error: "Phone number already registered" });
    }

    // Create verification request
    const VerificationRequest = require("../models/VerificationRequest");
    const request = new VerificationRequest({
      phoneNumber,
      ownerName,
      email,
      description,
    });

    await request.save();

    res.status(201).json({
      message: "Verification request submitted. Admin will review it.",
      requestId: request._id,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  queryPhone,
  requestPhoneAddition,
};
