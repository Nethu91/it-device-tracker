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
    // Stored directly in MongoDB as Base64 (no Cloudinary) — max 5MB per file
    Attachments: {
      type: [
        {
          fileName:   { type: String, default: "" },
          fileData:   { type: String, default: "" }, // Base64 encoded file content
          fileType:   { type: String, default: "" }, // MIME type e.g. image/png, application/pdf
          fileSize:   { type: Number, default: 0 },   // size in bytes
          uploadedAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Employee", employeeSchema);