const mongoose = require("mongoose");

const locationSchema = new mongoose.Schema(
  {
    Name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Location", locationSchema);