const mongoose = require("mongoose");

const deviceSchema = new mongoose.Schema(
  {
    /* =========================
       BASIC DEVICE INFO
    ========================= */
    DeviceType: { type: String, required: true, trim: true },

    EmployeeName: { type: String, default: "", trim: true },
    EPFNumber: { type: Number, default: null },
    Department: { type: String, default: "", trim: true },

    DeviceName: { type: String, default: "", trim: true },
    Model: { type: String, default: "", trim: true },
    SerialNumber: { type: String, default: "", trim: true },
    AssetCode: { type: String, default: "", trim: true },
    Location: { type: String, default: "", trim: true },
    IPAddress: { type: String, default: "", trim: true },

    /* =========================
       SIM / NETWORK
    ========================= */
    SIMNumber: { type: String, default: "", trim: true },
    SIMType: { type: String, default: "", trim: true },

    /* =========================
       PROCUREMENT
    ========================= */
    PONumber: { type: String, default: "", trim: true },
    Vendor: { type: String, default: "", trim: true },
    InvoiceNumber: { type: String, default: "", trim: true },

    RentOrNot: {
      type: String,
      enum: ["", "Rent", "Not Rent"],
      default: "",
    },

    /* =========================
       SYSTEM SPECS
    ========================= */
    OSVersion: { type: String, default: "", trim: true },
    Processor: { type: String, default: "", trim: true },
    Gen: { type: String, default: "", trim: true },
    RAMGB: { type: String, default: "", trim: true },
    HDDGB: { type: String, default: "", trim: true },
    SSDGB: { type: String, default: "", trim: true },

    /* =========================
       ACCESSORIES
    ========================= */
    MouseType: { type: String, default: "", trim: true },
    KeyboardType: { type: String, default: "", trim: true },
    PenStorage: { type: String, default: "", trim: true },

    /* =========================
       HISTORY
    ========================= */
    PreviousUsers: { type: [String], default: [] },
    CurrentUser: { type: String, default: "", trim: true },

    /* =========================
       WARRANTY / DATES
    ========================= */
    WarrantyPeriod: { type: String, default: "", trim: true },
    PurchaseDate: { type: Date, default: null },
    HandoverDate: { type: Date, default: null },

    /* =========================
       EXTRA DEVICE TYPES
    ========================= */
    TonerModel: { type: String, default: "", trim: true },

    ExactLocation: { type: String, default: "", trim: true },
    ITReferenceNumber: { type: String, default: "", trim: true },

    ServerModel: { type: String, default: "", trim: true },
    ServerProcessor: { type: String, default: "", trim: true },
    ServerRAM: { type: String, default: "", trim: true },
    ServerHDD: { type: String, default: "", trim: true },
    ServerOS: { type: String, default: "", trim: true },
    ServerVendor: { type: String, default: "", trim: true },
    ServerPurpose: { type: String, default: "", trim: true },

    CurrentLocation: { type: String, default: "", trim: true },
    ProjectorVendor: { type: String, default: "", trim: true },

    AccessPointBrand: { type: String, default: "", trim: true },
    AccessPointModel: { type: String, default: "", trim: true },
    WirelessVendor: { type: String, default: "", trim: true },
    WirelessUsername: { type: String, default: "", trim: true },
    WirelessPassword: { type: String, default: "", trim: true },

    UPSBrand: { type: String, default: "", trim: true },
    UPSITReferenceNumber: { type: String, default: "", trim: true },
    UPSVendor: { type: String, default: "", trim: true },

    Description: { type: String, default: "", trim: true },
    Warranty: { type: String, default: "", trim: true },

    Designation: { type: String, default: "", trim: true },
    PortableTracking: { type: String, default: "", trim: true },
    PortableTrackingNumber: { type: String, default: "", trim: true },
    PortableTrackingSIMNumber: { type: String, default: "", trim: true },
    PortableVendor: { type: String, default: "", trim: true },
    PortableInvoiceNo: { type: String, default: "", trim: true },

    PowerAppSID: { type: String, default: "", trim: true },
    NewIPAfterVLAN: { type: String, default: "", trim: true },

    /* =========================
       STATUS
    ========================= */
    Status: {
      type: String,
      enum: ["Available", "Assigned", "In Repair", "Retired", "Missing"],
      default: "Available",
    },

    Notes: { type: String, default: "", trim: true },

    /* =========================
       🚨 DISPOSAL SYSTEM
    ========================= */
    isDisposed: { type: Boolean, default: false },
    disposedAt: { type: Date, default: null },
    disposalReason: { type: String, default: "", trim: true },

    /* =========================
       📅 LIFECYCLE TRACKING (5 YEARS)
    ========================= */
    expiryStatus: {
      type: String,
      enum: ["ACTIVE", "NEAR_EXPIRY", "EXPIRED_5Y"],
      default: "ACTIVE",
    },

    expiryNotified6m: { type: Boolean, default: false },
    expiryNotified3m: { type: Boolean, default: false },
    expiryNotified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Device", deviceSchema, "devices");