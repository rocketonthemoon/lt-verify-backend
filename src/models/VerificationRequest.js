const mongoose = require("mongoose");

const verificationRequestSchema = new mongoose.Schema(
  {
    phoneNumber: {
      type: String,
      required: true,
      trim: true,
    },
    ownerName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      maxlength: 1000,
    },
    proofDocuments: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    reviewedByAdmin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },
    adminComment: {
      type: String,
      default: null,
    },
    rejectionReason: {
      type: String,
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    tokenGenerated: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

verificationRequestSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model(
  "VerificationRequest",
  verificationRequestSchema,
);
