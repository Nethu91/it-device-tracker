const mongoose = require("mongoose");

const disposalLogSchema = new mongoose.Schema(
  {
    /* =========================================
       DEVICE REFERENCE
    ========================================= */
    deviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Device",
      index: true,
    },

    assetCode: {
      type: String,
      trim: true,
      index: true,
    },

    /* =========================================
       ACTION TYPE
    ========================================= */
    action: {
      type: String,
      enum: ["DISPOSED", "RESTORED"],
      required: true,
      index: true,
    },

    /* =========================================
       ADMIN INFO
    ========================================= */
    performedBy: {
      type: String, // admin email
      trim: true,
      index: true,
    },

    /* =========================================
       REASON / NOTES
    ========================================= */
    reason: {
      type: String,
      default: "",
      trim: true,
    },

    /* =========================================
       EXTRA AUDIT DATA (ENTERPRISE UPGRADE)
    ========================================= */
    metadata: {
      type: Object,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

/* =========================================
   🔥 INDEX OPTIMIZATION
========================================= */
disposalLogSchema.index({ deviceId: 1, createdAt: -1 });
disposalLogSchema.index({ assetCode: 1 });
disposalLogSchema.index({ action: 1 });

module.exports = mongoose.model(
  "DisposalLog",
  disposalLogSchema,
  "disposal_logs"
);