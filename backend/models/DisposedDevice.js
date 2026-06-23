const mongoose = require("mongoose");

const disposedDeviceSchema = new mongoose.Schema(
  {
    /* =========================================
       ORIGINAL DEVICE REFERENCE
    ========================================= */

    originalDeviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Device",
      required: true,
    },

    /* =========================================
       BASIC DEVICE INFO SNAPSHOT
    ========================================= */

    DeviceType: { type: String, default: "" },

    DeviceName: { type: String, default: "" },
    Model: { type: String, default: "" },
    SerialNumber: { type: String, default: "" },
    AssetCode: { type: String, default: "" },

    EmployeeName: { type: String, default: "" },
    EPFNumber: { type: Number, default: null },
    Department: { type: String, default: "" },
    Location: { type: String, default: "" },

    /* =========================================
       IMPORTANT DATES
    ========================================= */

    PurchaseDate: { type: Date, default: null },
    disposedAt: { type: Date, default: Date.now },

    /* =========================================
       DISPOSAL DETAILS
    ========================================= */

    disposalReason: {
      type: String,
      default: "5 Year Lifecycle Completed",
    },

    disposedBy: {
      type: String,
      default: "", // admin email or username
    },

    /* =========================================
       LIFECYCLE INFO
    ========================================= */

    ageAtDisposalYears: {
      type: Number,
      default: 0,
    },

    lifecycleStatus: {
      type: String,
      enum: ["EXPIRED_5Y", "EARLY_DISPOSAL", "DAMAGED", "OTHER"],
      default: "EXPIRED_5Y",
    },

    /* =========================================
       NOTES / AUDIT
    ========================================= */

    notes: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "DisposedDevice",
  disposedDeviceSchema,
  "disposed_devices"
);