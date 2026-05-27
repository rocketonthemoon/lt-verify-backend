const mongoose = require("mongoose");

const phoneNumberSchema = new mongoose.Schema(
  {
    phoneNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    ownerName: {
      type: String,
      required: true,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    verifiedByAdmin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },
    vouchedByAdminName: {
      type: String,
      default: null,
    },
    verificationDate: {
      type: Date,
      default: null,
    },
    averageReliability: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    averageTimeliness: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalRatings: {
      type: Number,
      default: 0,
    },
    totalTransactions: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["pending", "verified", "rejected", "suspended"],
      default: "pending",
    },
    rejectionReason: {
      type: String,
      default: null,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("PhoneNumber", phoneNumberSchema);
