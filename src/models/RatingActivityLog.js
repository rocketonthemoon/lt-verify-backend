const mongoose = require("mongoose");

const ratingActivityLogSchema = new mongoose.Schema(
  {
    phoneNumberRated: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PhoneNumber",
      required: true,
    },
    phoneNumberRatedNumber: {
      type: String,
      required: true,
    },
    ratedByPhoneNumber: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PhoneNumber",
      default: null,
    },
    ratedByPhoneNumberDigits: {
      type: String,
      default: null,
    },
    ratingAuthToken: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdminToken",
      required: true,
    },
    reliabilityRating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    timelinessRating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      default: null,
    },
    transactionAmount: {
      type: Number,
      default: null,
    },
    currency: {
      type: String,
      default: null,
    },
    ipAddress: {
      type: String,
      default: null,
    },
    userAgent: {
      type: String,
      default: null,
    },
  },
  { timestamps: true },
);

ratingActivityLogSchema.index({ phoneNumberRated: 1, createdAt: -1 });
ratingActivityLogSchema.index({ ratingAuthToken: 1 });
ratingActivityLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model("RatingActivityLog", ratingActivityLogSchema);
