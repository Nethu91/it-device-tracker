const mongoose = require("mongoose");

const disposalLogSchema = new mongoose.Schema(
  {
    deviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Device",
    },

    action: {
      type: String,
      enum: ["DISPOSED", "RESTORED"],
    },

    performedBy: {
      type: String, // admin email
    },

    reason: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("DisposalLog", disposalLogSchema);