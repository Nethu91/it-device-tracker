const mongoose = require("mongoose");

const customDeviceSchema = new mongoose.Schema(
  {
    templateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DeviceTemplate",
      required: true,
    },

    templateName: {
      type: String,
      required: true,
    },

    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    status: {
      type: String,
      enum: ["Available", "Assigned", "In Repair", "Retired", "Missing"],
      default: "Available",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // ✅ Dispose fields — anith Device model eke pattern ekම
    isDisposed: {
      type: Boolean,
      default: false,
    },
    disposedAt: {
      type: Date,
      default: null,
    },
    disposalReason: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CustomDevice", customDeviceSchema);