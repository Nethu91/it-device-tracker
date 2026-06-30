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

    // ✅ Attachments — Admin only upload (CVs, ID copies, certificates, etc.)
    Attachments: {
      type: [
        {
          fileName:   { type: String, default: "" },
          fileUrl:    { type: String, default: "" },
          publicId:   { type: String, default: "" }, // Cloudinary public_id — needed for delete
          fileType:   { type: String, default: "" }, // pdf, jpg, png, etc.
          uploadedAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Employee", employeeSchema);