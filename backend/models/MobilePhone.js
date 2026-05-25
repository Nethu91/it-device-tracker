const mongoose = require("mongoose");

const mobilePhoneSchema = new mongoose.Schema({
  userName: String,
  epfNumber: String,
  deviceName: String,
  designation: String,
  assetCode: String,
  model: String,
  serialNumber: String,
  simNumber: String,
  poNumber: String,
  vendor: String,
  purchaseDate: String,
  handoverDate: String,
  location: String,
  warrantyPeriod: String,
  previousUser1: String,
  previousUser2: String,
  note: String,
  status: {
    type: String,
    default: "Active",
  },
  createdAt: String,
  updatedAt: String,
});

module.exports = mongoose.model("MobilePhone", mobilePhoneSchema);