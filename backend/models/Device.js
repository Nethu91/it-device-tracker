const mongoose = require("mongoose");

const deviceSchema = new mongoose.Schema(
  {
    DeviceType: String,
    EmployeeName: String,
    EPFNumber: Number,
    DeviceName: String,
    Model: String,
    SerialNumber: String,
    AssetCode: String,
    Location: String,
    IPAddress: String,
    SIMNumber: String,
    Status: {
      type: String,
      default: "Available",
    },
    PurchaseDate: Date,
    HandoverDate: Date,
    Notes: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Device", deviceSchema, "devices");