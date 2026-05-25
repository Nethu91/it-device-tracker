const mongoose = require("mongoose");

const fingerprintSchema =
  new mongoose.Schema(
    {
      deviceName: {
        type: String,
        required: true,
      },

      serialNumber: {
        type: String,
        required: true,
      },

      assetCode: {
        type: String,
        required: true,
      },

      location: {
        type: String,
        required: true,
      },

      ipAddress: {
        type: String,
      },

      status: {
        type: String,
        default: "Active",
      },
    },

    {
      timestamps: true,
    }
  );

module.exports =
  mongoose.models.FingerprintMachine ||
  mongoose.model(
    "FingerprintMachine",
    fingerprintSchema,
    "fingerprint_machines"
  );