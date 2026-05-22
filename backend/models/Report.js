const mongoose = require("mongoose");

const reporSchema = new mongoose.Schema(
  {
    sellerID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Seller",
      required: true,
    },
    reportedBy: {
      types: String,
      required: true,
    },
    reason: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    appealStatus: {
      type: String,
      enum: ["none", "pending", "approved", "rejected"],
      default: "none",
    },
    reviewed: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

const Report = mongoose.model("Report", reporSchema);

module.exports = Report;