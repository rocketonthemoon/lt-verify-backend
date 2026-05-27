const mongoose = require("mongoose");

const ratingSchema = new mongoose.Schema(
  {
    phoneNumber: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PhoneNumber",
      required: true,
    },
    ratedByPhoneId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PhoneNumber",
      default: null,
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
    transactionAmount: {
      type: Number,
      default: null,
    },
    currency: {
      type: String,
      enum: ["EUR", "INR"],
      default: null,
    },
    comment: {
      type: String,
      default: "",
      maxlength: 500,
    },
    ratingAuthToken: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdminToken",
      required: true,
    },
    isPositive: {
      type: Boolean,
      default: true,
    },
    flagged: {
      type: Boolean,
      default: false,
    },
    flagReason: {
      type: String,
      default: null,
    },
  },
  { timestamps: true },
);

// Index for efficient queries
ratingSchema.index({ phoneNumber: 1, createdAt: -1 });
ratingSchema.index({ ratingAuthToken: 1 });

module.exports = mongoose.model("Rating", ratingSchema);
