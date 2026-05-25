const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema({
  userName: {
    type: String,
    required: true,
  },
  epfNumber: {
    type: String,
    required: true,
    unique: true,
  },
  designation: String,
  department: String,
  location: String,
  contactNumber: String,
  email: String,
  status: {
    type: String,
    default: "Active",
  },
  createdAt: {
    type: String,
  },
  updatedAt: {
    type: String,
  },
});

module.exports = mongoose.model("Employee", employeeSchema);