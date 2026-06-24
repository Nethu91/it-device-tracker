const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    /* =========================
       BASIC INFO
    ========================= */
    username: {
      type: String,
      required: [true, "Username is required"],
      trim: true,
      index: true,
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    /* =========================
       AUTH
    ========================= */
    password: {
      type: String,
      default: "",
      required: function () {
        return this.authProvider === "local";
      },
    },

    role: {
      type: String,
      enum: ["admin", "user"],
      default: "user",
      index: true,
    },

    authProvider: {
      type: String,
      enum: ["local", "microsoft"],
      default: "local",
    },

    /* =========================
       USER DETAILS
    ========================= */
    phone: {
      type: String,
      default: "",
      trim: true,
    },

    department: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },

    position: {
      type: String,
      default: "",
      trim: true,
    },

    profilePicture: {
      type: String,
      default: "",
    },

    /* =========================
       SYSTEM FLAGS (ENTERPRISE UPGRADE)
    ========================= */

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    lastLogin: {
      type: Date,
      default: null,
    },

    loginCount: {
      type: Number,
      default: 0,
    },

    /* =========================
       MICROSOFT LOGIN SUPPORT
    ========================= */
    microsoftId: {
      type: String,
      default: "",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

/* =========================
   PERFORMANCE INDEXES
========================= */
userSchema.index({ email: 1, role: 1 });
userSchema.index({ department: 1, isActive: 1 });

module.exports = mongoose.model("User", userSchema);