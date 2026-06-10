const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema(
  {
    FirstName: {
      type: String,
      required: true,
      trim: true,
    },

    SecondName: {
      type: String,
      required: true,
      trim: true,
    },

    FullName: {
      type: String,
      trim: true,
      default: "",
    },

    EPFNumber: {
      type: Number,
      required: true,
      unique: true,
    },

    Department: {
      type: String,
      required: true,
      trim: true,
    },

    Location: {
      type: String,
      required: true,
      trim: true,
    },

    CompanyEmail: {
      type: String,
      lowercase: true,
      trim: true,
      default: "",
    },

    AccessRole: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    CanLogin: {
      type: Boolean,
      default: true,
    },

    Status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Employee", employeeSchema);