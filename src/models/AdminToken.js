const mongoose = require("mongoose");
const crypto = require("crypto");

const adminTokenSchema = new mongoose.Schema(
  {
    token: {
      type: String,
      required: true,
      unique: true,
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true,
    },
    issuedByAdmin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },
    usedByPhoneNumber: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PhoneNumber",
      default: null,
    },
    usedAt: {
      type: Date,
      default: null,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    isUsed: {
      type: Boolean,
      default: false,
    },
    purpose: {
      type: String,
      default: "rating",
    },
    deactivated: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

// Auto-expire tokens
adminTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Hash token before validation so required checks can see tokenHash
adminTokenSchema.pre("validate", function (next) {
  if (!this.isModified("token")) {
    next();
    return;
  }

  this.tokenHash = crypto.createHash("sha256").update(this.token).digest("hex");
  next();
});

module.exports = mongoose.model("AdminToken", adminTokenSchema);
