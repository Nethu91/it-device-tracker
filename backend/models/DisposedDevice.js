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
      index: true,
    },

    /* =========================================
       SNAPSHOT DATA (IMMUTABLE RECORD)
    ========================================= */
    DeviceType: { type: String, default: "", trim: true },

    DeviceName: { type: String, default: "", trim: true },
    Model: { type: String, default: "", trim: true },
    SerialNumber: { type: String, default: "", trim: true },

    /* 🔥 IMPORTANT BUSINESS KEY */
    AssetCode: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },

    EmployeeName: { type: String, default: "", trim: true },
    EPFNumber: { type: Number, default: null, index: true },
    Department: { type: String, default: "", trim: true },
    Location: { type: String, default: "", trim: true },

    /* =========================================
       IMPORTANT DATES
    ========================================= */
    PurchaseDate: { type: Date, default: null },
    disposedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },

    /* =========================================
       DISPOSAL DETAILS
    ========================================= */
    disposalReason: {
      type: String,
      default: "5 Year Lifecycle Completed",
      trim: true,
    },

    disposedBy: {
      type: String,
      default: "",
      trim: true, // admin email / username
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
      index: true,
    },

    /* =========================================
       AUDIT / NOTES
    ========================================= */
    notes: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

/* =========================================
   🔥 INDEX OPTIMIZATION (IMPORTANT)
========================================= */
disposedDeviceSchema.index({ AssetCode: 1 });
disposedDeviceSchema.index({ EPFNumber: 1, disposedAt: -1 });
disposedDeviceSchema.index({ lifecycleStatus: 1 });

module.exports = mongoose.model(
  "DisposedDevice",
  disposedDeviceSchema,
  "disposed_devices"
);