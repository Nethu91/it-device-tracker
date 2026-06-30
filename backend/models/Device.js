const mongoose = require("mongoose");

const deviceSchema = new mongoose.Schema(
  {
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

    SIMNumber: { type: String, default: "", trim: true },
    SIMType: { type: String, default: "", trim: true },

    PONumber: { type: String, default: "", trim: true },
    Vendor: { type: String, default: "", trim: true },
    InvoiceNumber: { type: String, default: "", trim: true },

    RentOrNot: {
      type: String,
      enum: ["", "Rent", "Not Rent"],
      default: "",
    },

    OSVersion: { type: String, default: "", trim: true },
    Processor: { type: String, default: "", trim: true },
    Gen: { type: String, default: "", trim: true },
    RAMGB: { type: String, default: "", trim: true },
    HDDGB: { type: String, default: "", trim: true },
    SSDGB: { type: String, default: "", trim: true },
    PenStorage: { type: String, default: "", trim: true },
    MouseType: { type: String, default: "", trim: true },
    KeyboardType: { type: String, default: "", trim: true },

    PreviousUsers: {
      type: [String],
      default: [],
    },

    WarrantyPeriod: { type: String, default: "", trim: true },

    // Printer
    TonerModel: { type: String, default: "", trim: true },
    CurrentUser: { type: String, default: "", trim: true },

    // Switch / Wireless AP
    ExactLocation: { type: String, default: "", trim: true },
    ITReferenceNumber: { type: String, default: "", trim: true },

    // Server
    ServerModel: { type: String, default: "", trim: true },
    ServerProcessor: { type: String, default: "", trim: true },
    ServerRAM: { type: String, default: "", trim: true },
    ServerHDD: { type: String, default: "", trim: true },
    ServerOS: { type: String, default: "", trim: true },
    ServerVendor: { type: String, default: "", trim: true },
    ServerPurpose: { type: String, default: "", trim: true },

    // Projector / Smart Board
    CurrentLocation: { type: String, default: "", trim: true },
    ProjectorVendor: { type: String, default: "", trim: true },

    // Wireless AP
    AccessPointBrand: { type: String, default: "", trim: true },
    AccessPointModel: { type: String, default: "", trim: true },
    WirelessVendor: { type: String, default: "", trim: true },
    WirelessUsername: { type: String, default: "", trim: true },
    WirelessPassword: { type: String, default: "", trim: true },

    // UPS
    UPSBrand: { type: String, default: "", trim: true },
    UPSITReferenceNumber: { type: String, default: "", trim: true },
    UPSVendor: { type: String, default: "", trim: true },

    // Smart Board & TV & Monitor
    Description: { type: String, default: "", trim: true },
    Warranty: { type: String, default: "", trim: true },

    // Portable Tracker
    Designation: { type: String, default: "", trim: true },
    PortableTracking: { type: String, default: "", trim: true },
    PortableTrackingNumber: { type: String, default: "", trim: true },
    PortableTrackingSIMNumber: { type: String, default: "", trim: true },
    PortableVendor: { type: String, default: "", trim: true },
    PortableInvoiceNo: { type: String, default: "", trim: true },

    // Fingerprint Machine
    PowerAppSID: { type: String, default: "", trim: true },
    NewIPAfterVLAN: { type: String, default: "", trim: true },

    Status: {
      type: String,
      enum: ["Available", "Assigned", "In Repair", "Retired", "Missing"],
      default: "Available",
    },

    PurchaseDate: { type: Date, default: null },
    HandoverDate: { type: Date, default: null },

    Notes: { type: String, default: "", trim: true },

    // Dispose / Lifecycle management fields
    isDisposed: { type: Boolean, default: false },
    disposedAt: { type: Date, default: null },
    disposalReason: { type: String, default: "", trim: true },
    expiryStatus: { type: String, default: "ACTIVE", trim: true },

    // ✅ Vacant tracking — employee inactive වුණාම auto-release වුණ විට
    releasedAt: { type: Date, default: null },
    releasedFromEmployee: { type: String, default: "", trim: true }, // employee name who left
    releasedFromEPF: { type: Number, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Device", deviceSchema, "devices");