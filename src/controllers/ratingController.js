const Rating = require("../models/Rating");
const PhoneNumber = require("../models/PhoneNumber");
const AdminToken = require("../models/AdminToken");

// Add rating to a phone number
const addRating = async (req, res) => {
  try {
    let {
      phoneNumber,
      reliabilityRating,
      timelinessRating,
      transactionAmount,
      currency,
      comment,
      ratedByPhoneNumber,
    } = req.body;

    phoneNumber = phoneNumber?.trim().replace(/\s+/g, '');

    // Validate phone number format (+370 or +91 prefix)
    if (!phoneNumber || !/^\+(?:370\d{8}|91\d{10})$/.test(phoneNumber)) {
      return res.status(400).json({ error: "Phone number must be a valid Lithuanian (+370) or Indian (+91) number" });
    }

    // Validate ratings are between 1-5
    if (
      reliabilityRating < 1 ||
      reliabilityRating > 5 ||
      timelinessRating < 1 ||
      timelinessRating > 5
    ) {
      return res.status(400).json({ error: "Ratings must be between 1 and 5" });
    }

    // Amount and currency must be provided together
    if (transactionAmount != null && !currency) {
      return res.status(400).json({ error: "Currency is required when a transaction amount is provided" });
    }
    if (currency && transactionAmount == null) {
      return res.status(400).json({ error: "Transaction amount is required when a currency is provided" });
    }

    let ratedPhone = await PhoneNumber.findOne({ phoneNumber });

    if (!ratedPhone) {
      // Auto-create anonymous placeholder so ratings can be stored
      ratedPhone = new PhoneNumber({
        phoneNumber,
        ownerName: "Anonymous",
        verified: false,
        status: "pending",
      });
      await ratedPhone.save();
    }

    let ratingPhone = null;
    if (ratedByPhoneNumber) {
      ratingPhone = await PhoneNumber.findOne({
        phoneNumber: ratedByPhoneNumber,
      });
    }

    // Check if admin token is used/valid
    const ratingAuthToken = req.ratingAuthToken;
    if (ratingAuthToken.isUsed) {
      return res.status(400).json({ error: "Token already used" });
    }

    // Create rating
    const rating = new Rating({
      phoneNumber: ratedPhone._id,
      ratedByPhoneId: ratingPhone?._id || null,
      reliabilityRating,
      timelinessRating,
      transactionAmount: transactionAmount != null ? Number(transactionAmount) : null,
      currency: currency || null,
      comment,
      ratingAuthToken: ratingAuthToken._id,
      isPositive: reliabilityRating >= 4 && timelinessRating >= 4,
    });

    await rating.save();

    // Update admin token as used
    ratingAuthToken.isUsed = true;
    ratingAuthToken.usedByPhoneNumber = ratingPhone?._id || null;
    ratingAuthToken.usedAt = new Date();
    await ratingAuthToken.save();

    // Update phone number averages
    const allRatings = await Rating.find({ phoneNumber: ratedPhone._id });
    const avgReliability =
      allRatings.reduce((sum, r) => sum + r.reliabilityRating, 0) /
      allRatings.length;
    const avgTimeliness =
      allRatings.reduce((sum, r) => sum + r.timelinessRating, 0) /
      allRatings.length;

    ratedPhone.averageReliability = Math.round(avgReliability * 10) / 10;
    ratedPhone.averageTimeliness = Math.round(avgTimeliness * 10) / 10;
    ratedPhone.totalRatings = allRatings.length;
    ratedPhone.totalTransactions = (ratedPhone.totalTransactions || 0) + 1;
    await ratedPhone.save();

    res.status(201).json({
      message: "Rating added successfully",
      rating: {
        reliabilityRating,
        timelinessRating,
        comment,
        timestamp: rating.createdAt,
      },
      phoneAverages: {
        reliability: ratedPhone.averageReliability,
        timeliness: ratedPhone.averageTimeliness,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Public stats
const getStats = async (req, res) => {
  try {
    console.log("Stats endpoint called");

    // Totals per currency
    const currencyTotals = await Rating.aggregate([
      { $match: { transactionAmount: { $ne: null }, currency: { $exists: true, $in: ["EUR", "INR"] } } },
      {
        $group: {
          _id: "$currency",
          total: { $sum: "$transactionAmount" },
          count: { $sum: 1 },
        },
      },
    ]);
    console.log("Currency totals:", currencyTotals);

    // Monthly breakdown for the last 12 months (per currency)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
    twelveMonthsAgo.setDate(1);
    twelveMonthsAgo.setHours(0, 0, 0, 0);

    const monthly = await Rating.aggregate([
      {
        $match: {
          transactionAmount: { $ne: null },
          currency: { $exists: true, $in: ["EUR", "INR"] },
          createdAt: { $gte: twelveMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            currency: "$currency",
          },
          total: { $sum: "$transactionAmount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);
    console.log("Monthly breakdown:", monthly);

    // Overall rating counts
    const totalRatings = await Rating.countDocuments();
    const totalTransactions = await Rating.countDocuments({ transactionAmount: { $ne: null } });

    res.status(200).json({ currencyTotals, monthly, totalRatings, totalTransactions });
  } catch (error) {
    console.error("Stats error:", error.stack || error.message);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  addRating,
  getStats,
};
