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

    Status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Employee", employeeSchema);