import React, { useEffect, useState } from "react";
import axios from "axios";
import * as XLSX from "xlsx";

const DEVICE_API = "https://it-device-tracker.onrender.com/api/devices";
const EMPLOYEE_API = "http://localhost:5000/api/employees";

function DevicePage({ title, deviceType }) {
  const isComputerDevice = deviceType === "Laptop" || deviceType === "Desktop";
  const isSIMDevice = deviceType === "SIM";
  const isTabletDevice = deviceType === "Tablet";
  const isPrinterDevice = deviceType === "Printer";
  const isSwitchDevice = deviceType === "Switch";
  const isServerDevice = deviceType === "Server";
  const isProjectorDevice = deviceType === "Projector";
  const isWirelessAPDevice = deviceType === "Wireless AP";
  const isUPSDevice = deviceType === "UPS";
  const isSmartBoardDevice = deviceType === "Smart Board";
  const isPortableTrackerDevice = deviceType === "Portable Tracker";
  const isFingerprintDevice = deviceType === "Fingerprint Machine";

  const noEmployeeDeviceTypes = [
    "Printer",
    "Switch",
    "Server",
    "Projector",
    "Wireless AP",
    "Smart Board",
    "Portable Tracker",
    "Fingerprint Machine",
  ];

  const needsEmployee = !noEmployeeDeviceTypes.includes(deviceType);

  const hideDepartment =
    isServerDevice ||
    isProjectorDevice ||
    isWirelessAPDevice ||
    isFingerprintDevice;

  const hideDeviceName =
    isServerDevice ||
    isProjectorDevice ||
    isWirelessAPDevice ||
    isUPSDevice;

  const hideModel =
    isWirelessAPDevice ||
    isPortableTrackerDevice ||
    isFingerprintDevice;

  const hideHandover =
    isServerDevice ||
    isProjectorDevice ||
    isWirelessAPDevice ||
    isFingerprintDevice ||
    isSwitchDevice ||
    isPortableTrackerDevice;

  const hideIP = isPortableTrackerDevice;

  const emptyForm = {
    DeviceType: deviceType,
    EmployeeName: "",
    EPFNumber: "",
    Department: "",
    DeviceName: "",
    Model: "",
    SerialNumber: "",
    AssetCode: "",
    Location: "",
    IPAddress: "",
    SIMNumber: "",
    SIMType: "",
    PONumber: "",
    Vendor: "",
    InvoiceNumber: "",
    RentOrNot: "",
    OSVersion: "",
    Processor: "",
    Gen: "",
    RAMGB: "",
    HDDGB: "",
    SSDGB: "",
    PenStorage: "",
    MouseType: "",
    KeyboardType: "",
    WarrantyPeriod: "",

    TonerModel: "",
    CurrentUser: "",

    ExactLocation: "",
    ITReferenceNumber: "",

    ServerModel: "",
    ServerProcessor: "",
    ServerRAM: "",
    ServerHDD: "",
    ServerOS: "",
    ServerVendor: "",
    ServerPurpose: "",

    CurrentLocation: "",
    ProjectorVendor: "",

    AccessPointBrand: "",
    AccessPointModel: "",
    WirelessVendor: "",
    WirelessUsername: "",
    WirelessPassword: "",

    UPSBrand: "",
    UPSITReferenceNumber: "",
    UPSVendor: "",

    Description: "",
    Warranty: "",

    Designation: "",
    PortableTracking: "",
    PortableTrackingNumber: "",
    PortableTrackingSIMNumber: "",
    PortableVendor: "",
    PortableInvoiceNo: "",

    PowerAppSID: "",
    NewIPAfterVLAN: "",

    Status: "Available",
    PurchaseDate: "",
    HandoverDate: "",
    PreviousUsers: [""],
    Notes: "",
  };
    const [devices, setDevices] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");

  const user = JSON.parse(localStorage.getItem("user"));
  const isAdmin = user?.role === "admin";

  const getHeaders = () => ({
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });

  const calculateAge = (purchaseDate) => {
    if (!purchaseDate) return "";

    const start = new Date(purchaseDate);
    const today = new Date();

    let years = today.getFullYear() - start.getFullYear();
    let months = today.getMonth() - start.getMonth();

    if (months < 0) {
      years--;
      months += 12;
    }

    return `${years} Years ${months} Months`;
  };

  const normalizePreviousUsers = (value) => {
    if (Array.isArray(value)) return value;
    if (typeof value === "string" && value.trim() !== "") return [value];
    return [""];
  };

  const loadDevices = async () => {
    try {
      const res = await axios.get(`${DEVICE_API}/type/${deviceType}`);
      setDevices(res.data);
    } catch (err) {
      console.error("Load error:", err);
    }
  };

  useEffect(() => {
    setForm({ ...emptyForm, DeviceType: deviceType });
    setEditId(null);
    loadDevices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceType]);

  const searchEmployee = async (keyword) => {
    if (!keyword || keyword.length < 2) return;

    try {
      const res = await axios.get(
        `${EMPLOYEE_API}/search/${keyword}`,
        getHeaders()
      );

      if (res.data.length > 0) {
        const emp = res.data[0];

        setForm((prev) => ({
          ...prev,
          EmployeeName: emp.FullName || `${emp.FirstName} ${emp.SecondName}`,
          EPFNumber: emp.EPFNumber || "",
          Department: emp.Department || "",
          Location: emp.Location || "",
        }));
      }
    } catch (err) {
      console.log("Employee auto-fill error:", err.response?.data || err.message);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm({ ...form, [name]: value });

    if (name === "EmployeeName" || name === "EPFNumber") {
      searchEmployee(value);
    }
  };

  const handlePreviousUserChange = (index, value) => {
    const updatedUsers = normalizePreviousUsers(form.PreviousUsers);
    updatedUsers[index] = value;

    setForm({
      ...form,
      PreviousUsers: updatedUsers,
    });
  };

  const addPreviousUserField = () => {
    setForm({
      ...form,
      PreviousUsers: [...normalizePreviousUsers(form.PreviousUsers), ""],
    });
  };

  const removePreviousUserField = (index) => {
    const updatedUsers = normalizePreviousUsers(form.PreviousUsers).filter(
      (_, i) => i !== index
    );

    setForm({
      ...form,
      PreviousUsers: updatedUsers.length > 0 ? updatedUsers : [""],
    });
  };
    const saveDevice = async (e) => {
    e.preventDefault();

    const payload = { ...form };

    if (!needsEmployee) {
      payload.EmployeeName = "";
      payload.EPFNumber = "";
    }

    payload.PreviousUsers = normalizePreviousUsers(form.PreviousUsers).filter(
      (u) => u.trim() !== ""
    );

    if (!isSIMDevice && !isTabletDevice) {
      payload.SIMNumber = "";
    }

    if (!isSIMDevice) {
      payload.SIMType = "";
    }

    if (isWirelessAPDevice) {
      payload.EmployeeName = "";
      payload.EPFNumber = "";
      payload.Department = "";
      payload.DeviceName = "";
      payload.Model = "";
      payload.HandoverDate = "";
    }

    if (isFingerprintDevice) {
      payload.EmployeeName = "";
      payload.EPFNumber = "";
      payload.Department = "";
      payload.Model = "";
      payload.HandoverDate = "";
    }

    if (isPortableTrackerDevice) {
      payload.Model = "";
      payload.HandoverDate = "";
      payload.IPAddress = "";
    }

    if (!isComputerDevice) {
      payload.InvoiceNumber = "";
      payload.RentOrNot = isPrinterDevice ? payload.RentOrNot : "";
      payload.OSVersion = "";
      payload.Processor = "";
      payload.Gen = "";
      payload.RAMGB = "";
      payload.HDDGB = "";
      payload.SSDGB = "";
      payload.PenStorage = "";
      payload.MouseType = "";
      payload.KeyboardType = "";
    }

    try {
      if (editId) {
        await axios.put(`${DEVICE_API}/${editId}`, payload);
      } else {
        await axios.post(DEVICE_API, payload);
      }

      setForm({ ...emptyForm, DeviceType: deviceType });
      setEditId(null);
      loadDevices();
    } catch (err) {
      console.error("Save error:", err.response?.data || err.message);
      alert(err.response?.data?.message || "Save failed");
    }
  };

  const editDevice = (d) => {
    setEditId(d._id);

    setForm({
      DeviceType: deviceType,
      EmployeeName: d.EmployeeName || "",
      EPFNumber: d.EPFNumber || "",
      Department: d.Department || "",
      DeviceName: d.DeviceName || "",
      Model: d.Model || "",
      SerialNumber: d.SerialNumber || "",
      AssetCode: d.AssetCode || "",
      Location: d.Location || "",
      IPAddress: d.IPAddress || "",
      SIMNumber: d.SIMNumber || "",
      SIMType: d.SIMType || "",
      PONumber: d.PONumber || "",
      Vendor: d.Vendor || "",
      InvoiceNumber: d.InvoiceNumber || "",
      RentOrNot: d.RentOrNot || "",
      OSVersion: d.OSVersion || "",
      Processor: d.Processor || "",
      Gen: d.Gen || "",
      RAMGB: d.RAMGB || "",
      HDDGB: d.HDDGB || "",
      SSDGB: d.SSDGB || "",
      PenStorage: d.PenStorage || "",
      MouseType: d.MouseType || "",
      KeyboardType: d.KeyboardType || "",
      WarrantyPeriod: d.WarrantyPeriod || "",

      TonerModel: d.TonerModel || "",
      CurrentUser: d.CurrentUser || "",

      ExactLocation: d.ExactLocation || "",
      ITReferenceNumber: d.ITReferenceNumber || "",

      ServerModel: d.ServerModel || "",
      ServerProcessor: d.ServerProcessor || "",
      ServerRAM: d.ServerRAM || "",
      ServerHDD: d.ServerHDD || "",
      ServerOS: d.ServerOS || "",
      ServerVendor: d.ServerVendor || "",
      ServerPurpose: d.ServerPurpose || "",

      CurrentLocation: d.CurrentLocation || "",
      ProjectorVendor: d.ProjectorVendor || "",

      AccessPointBrand: d.AccessPointBrand || "",
      AccessPointModel: d.AccessPointModel || "",
      WirelessVendor: d.WirelessVendor || "",
      WirelessUsername: d.WirelessUsername || "",
      WirelessPassword: d.WirelessPassword || "",

      UPSBrand: d.UPSBrand || "",
      UPSITReferenceNumber: d.UPSITReferenceNumber || "",
      UPSVendor: d.UPSVendor || "",

      Description: d.Description || "",
      Warranty: d.Warranty || "",

      Designation: d.Designation || "",
      PortableTracking: d.PortableTracking || "",
      PortableTrackingNumber: d.PortableTrackingNumber || "",
      PortableTrackingSIMNumber: d.PortableTrackingSIMNumber || "",
      PortableVendor: d.PortableVendor || "",
      PortableInvoiceNo: d.PortableInvoiceNo || "",

      PowerAppSID: d.PowerAppSID || "",
      NewIPAfterVLAN: d.NewIPAfterVLAN || "",

      Status: d.Status || "Available",
      PurchaseDate: d.PurchaseDate ? d.PurchaseDate.slice(0, 10) : "",
      HandoverDate: d.HandoverDate ? d.HandoverDate.slice(0, 10) : "",
      PreviousUsers:
        d.PreviousUsers && d.PreviousUsers.length > 0
          ? normalizePreviousUsers(d.PreviousUsers)
          : [""],
      Notes: d.Notes || "",
    });
  };

  const deleteDevice = async (id) => {
    if (!window.confirm("Are you sure you want to delete this device?")) return;

    try {
      await axios.delete(`${DEVICE_API}/${id}`);
      loadDevices();
    } catch (err) {
      console.error("Delete error:", err);
    }
  };
    const filteredDevices = devices.filter((d) => {
    const keyword = search.toLowerCase();

    const previousUsersText = d.PreviousUsers
      ? normalizePreviousUsers(d.PreviousUsers).join(" ").toLowerCase()
      : "";

    const matchSearch =
      d.EmployeeName?.toLowerCase().includes(keyword) ||
      previousUsersText.includes(keyword) ||
      String(d.EPFNumber || "").includes(keyword) ||
      d.SerialNumber?.toLowerCase().includes(keyword) ||
      d.AssetCode?.toLowerCase().includes(keyword) ||
      d.Department?.toLowerCase().includes(keyword) ||
      d.Location?.toLowerCase().includes(keyword) ||
      d.PONumber?.toLowerCase().includes(keyword) ||
      d.Vendor?.toLowerCase().includes(keyword) ||
      d.InvoiceNumber?.toLowerCase().includes(keyword) ||
      d.TonerModel?.toLowerCase().includes(keyword) ||
      d.CurrentUser?.toLowerCase().includes(keyword) ||
      d.ExactLocation?.toLowerCase().includes(keyword) ||
      d.ITReferenceNumber?.toLowerCase().includes(keyword) ||
      d.CurrentLocation?.toLowerCase().includes(keyword) ||
      d.AccessPointBrand?.toLowerCase().includes(keyword) ||
      d.AccessPointModel?.toLowerCase().includes(keyword) ||
      d.WirelessVendor?.toLowerCase().includes(keyword) ||
      d.WirelessUsername?.toLowerCase().includes(keyword) ||
      d.PowerAppSID?.toLowerCase().includes(keyword) ||
      d.NewIPAfterVLAN?.toLowerCase().includes(keyword) ||
      d.PortableTracking?.toLowerCase().includes(keyword) ||
      d.PortableTrackingNumber?.toLowerCase().includes(keyword) ||
      d.PortableTrackingSIMNumber?.toLowerCase().includes(keyword);

    const matchStatus = statusFilter ? d.Status === statusFilter : true;

    return matchSearch && matchStatus;
  });

  const exportExcel = () => {
    const exportData = filteredDevices.map((d, index) => {
      const row = {
        No: index + 1,
        PO_Number: d.PONumber,
      };

      if (needsEmployee) {
        row.Employee = d.EmployeeName;
        row.EPF = d.EPFNumber;
      }

      if (!hideDepartment) row.Department = d.Department;
      if (!hideDeviceName) row.Device = d.DeviceName;

      if (isPrinterDevice) {
        row.TonerModel = d.TonerModel;
        row.CurrentUser = d.CurrentUser;
        row.RentOrNot = d.RentOrNot;
      }

      if (isSwitchDevice) {
        row.ExactLocation = d.ExactLocation;
        row.ITReferenceNumber = d.ITReferenceNumber;
        row.Vendor = d.Vendor;
      }

      if (isProjectorDevice) {
        row.CurrentLocation = d.CurrentLocation;
        row.Vendor = d.ProjectorVendor;
      }

      if (isWirelessAPDevice) {
        row.AccessPointBrand = d.AccessPointBrand;
        row.AccessPointModel = d.AccessPointModel;
        row.ExactLocation = d.ExactLocation;
        row.Vendor = d.WirelessVendor;
        row.Username = d.WirelessUsername;
        row.Password = d.WirelessPassword;
      }

      if (isUPSDevice) {
        row.Brand = d.UPSBrand;
        row.ITReferenceNumber = d.UPSITReferenceNumber;
        row.Vendor = d.UPSVendor;
      }

      if (isSmartBoardDevice) {
        row.Model = d.Model;
        row.Description = d.Description;
        row.Vendor = d.Vendor;
        row.CurrentLocation = d.CurrentLocation;
        row.Warranty = d.Warranty;
      } else if (!hideModel) {
        row.Model = d.Model;
      }

      if (isPortableTrackerDevice) {
        row.PortableTracking = d.PortableTracking;
        row.PortableTrackingNumber = d.PortableTrackingNumber;
        row.PortableTrackingSIMNumber = d.PortableTrackingSIMNumber;
        row.Vendor = d.PortableVendor;
        row.InvoiceNo = d.PortableInvoiceNo;
      }

      if (isFingerprintDevice) {
        row.PowerAppID = d.PowerAppSID;
        row.NewIPAfterVLAN = d.NewIPAfterVLAN;
      }

      if (isTabletDevice || isSIMDevice) {
        row.SIMNumber = d.SIMNumber;
      }

      if (isSIMDevice) {
        row.SIMType = d.SIMType;
      }

      if (isServerDevice) {
        row.ServerBrand = d.Model;
        row.ServerModel = d.ServerModel;
        row.Processor = d.ServerProcessor;
        row.RAM = d.ServerRAM;
        row.HDD = d.ServerHDD;
        row.OS = d.ServerOS;
        row.Vendor = d.ServerVendor;
        row.Purpose = d.ServerPurpose;
      }

      if (isComputerDevice) {
        row.Vendor = d.Vendor;
        row.InvoiceNumber = d.InvoiceNumber;
        row.RentOrNot = d.RentOrNot;
        row.OSVersion = d.OSVersion;
        row.Processor = d.Processor;
        row.Gen = d.Gen;
        row.RAMGB = d.RAMGB;
        row.HDDGB = d.HDDGB;
        row.SSDGB = d.SSDGB;
        row.PenStorage = d.PenStorage;
        row.MouseType = d.MouseType;
        row.KeyboardType = d.KeyboardType;
      }

      row.SerialNumber = d.SerialNumber;
      row.AssetCode = d.AssetCode;
      row.Location = d.Location;

      if (!hideIP) {
        row.IPAddress = d.IPAddress;
      }

      row.Status = d.Status;
      row.PurchaseDate = d.PurchaseDate ? d.PurchaseDate.slice(0, 10) : "";
      row.WarrantyPeriod = d.WarrantyPeriod;

      if (!hideHandover) {
        row.HandoverDate = d.HandoverDate ? d.HandoverDate.slice(0, 10) : "";
      }

      row.Age = calculateAge(d.PurchaseDate);

      row.PreviousUsers =
        d.PreviousUsers && d.PreviousUsers.length > 0
          ? normalizePreviousUsers(d.PreviousUsers)
              .map((u, i) => `${i + 1}. ${u}`)
              .join(", ")
          : "";

      row.Notes = d.Notes;

      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, title);
    XLSX.writeFile(workbook, `${title}_Report.xlsx`);
  };
    return (
    <div className="device-page">
      <div className="page-header">
        <h1>{title}</h1>
        <span className="device-count">{filteredDevices.length} Devices</span>
      </div>

      {isAdmin && (
        <form className="device-form pro-card" onSubmit={saveDevice}>
          {needsEmployee && (
            <>
              <input
                name="EmployeeName"
                placeholder="Employee Name"
                value={form.EmployeeName}
                onChange={handleChange}
              />

              <input
                name="EPFNumber"
                placeholder="EPF Number"
                value={form.EPFNumber}
                onChange={handleChange}
              />
            </>
          )}

          {!hideDepartment && (
            <input
              name="Department"
              placeholder="Department"
              value={form.Department}
              readOnly
            />
          )}

          {!hideDeviceName && (
            <input
              name="DeviceName"
              placeholder="Device Name"
              value={form.DeviceName}
              onChange={handleChange}
            />
          )}

          <input
            name="PONumber"
            placeholder="PO Number"
            value={form.PONumber}
            onChange={handleChange}
          />

          {isPrinterDevice && (
            <>
              <input
                name="TonerModel"
                placeholder="Toner Model"
                value={form.TonerModel}
                onChange={handleChange}
              />

              <input
                name="CurrentUser"
                placeholder="Current User"
                value={form.CurrentUser}
                onChange={handleChange}
              />

              <select
                name="RentOrNot"
                value={form.RentOrNot}
                onChange={handleChange}
              >
                <option value="">Rent or Not</option>
                <option value="Rent">Rent</option>
                <option value="Not Rent">Not Rent</option>
              </select>
            </>
          )}

          {(isTabletDevice || isSIMDevice) && (
            <>
              <input
                name="SIMNumber"
                placeholder="SIM Number"
                value={form.SIMNumber}
                onChange={handleChange}
              />

              {isSIMDevice && (
                <select
                  name="SIMType"
                  value={form.SIMType}
                  onChange={handleChange}
                >
                  <option value="">Select SIM Type</option>
                  <option value="Data Only">Data Only</option>
                  <option value="Mobile">Mobile</option>
                </select>
              )}
            </>
          )}

          {!hideModel && !isServerDevice && !isSmartBoardDevice && (
            <input
              name="Model"
              placeholder="Model"
              value={form.Model}
              onChange={handleChange}
            />
          )}

          {isServerDevice && (
            <>
              <input name="Model" placeholder="Server Brand" value={form.Model} onChange={handleChange} />
              <input name="ServerModel" placeholder="Server Model" value={form.ServerModel} onChange={handleChange} />
              <input name="ServerProcessor" placeholder="Processor" value={form.ServerProcessor} onChange={handleChange} />
              <input name="ServerRAM" placeholder="RAM" value={form.ServerRAM} onChange={handleChange} />
              <input name="ServerHDD" placeholder="HDD" value={form.ServerHDD} onChange={handleChange} />
              <input name="ServerOS" placeholder="OS" value={form.ServerOS} onChange={handleChange} />
              <input name="ServerVendor" placeholder="Vendor" value={form.ServerVendor} onChange={handleChange} />
              <input name="ServerPurpose" placeholder="Purpose" value={form.ServerPurpose} onChange={handleChange} />
            </>
          )}

          {isSwitchDevice && (
            <>
              <input name="ExactLocation" placeholder="Exact Location" value={form.ExactLocation} onChange={handleChange} />
              <input name="ITReferenceNumber" placeholder="IT Reference Number" value={form.ITReferenceNumber} onChange={handleChange} />
              <input name="Vendor" placeholder="Vendor" value={form.Vendor} onChange={handleChange} />
            </>
          )}

          {isProjectorDevice && (
            <>
              <input name="CurrentLocation" placeholder="Current Location" value={form.CurrentLocation} onChange={handleChange} />
              <input name="ProjectorVendor" placeholder="Vendor" value={form.ProjectorVendor} onChange={handleChange} />
            </>
          )}

          {isWirelessAPDevice && (
            <>
              <input name="AccessPointBrand" placeholder="Access Point Brand" value={form.AccessPointBrand} onChange={handleChange} />
              <input name="AccessPointModel" placeholder="Access Point Model" value={form.AccessPointModel} onChange={handleChange} />
              <input name="ExactLocation" placeholder="Exact Location" value={form.ExactLocation} onChange={handleChange} />
              <input name="WirelessVendor" placeholder="Vendor" value={form.WirelessVendor} onChange={handleChange} />
              <input name="WirelessUsername" placeholder="Username" value={form.WirelessUsername} onChange={handleChange} />
              <input name="WirelessPassword" placeholder="Password" value={form.WirelessPassword} onChange={handleChange} />
            </>
          )}

          {isUPSDevice && (
            <>
              <input name="UPSBrand" placeholder="Brand" value={form.UPSBrand} onChange={handleChange} />
              <input name="UPSITReferenceNumber" placeholder="IT Reference Number" value={form.UPSITReferenceNumber} onChange={handleChange} />
              <input name="UPSVendor" placeholder="Vendor" value={form.UPSVendor} onChange={handleChange} />
            </>
          )}

          {isSmartBoardDevice && (
            <>
              <input name="Model" placeholder="Model" value={form.Model} onChange={handleChange} />
              <input name="Description" placeholder="Description" value={form.Description} onChange={handleChange} />
              <input name="Vendor" placeholder="Vendor" value={form.Vendor} onChange={handleChange} />
              <input name="CurrentLocation" placeholder="Current Location" value={form.CurrentLocation} onChange={handleChange} />
              <input name="Warranty" placeholder="Warranty" value={form.Warranty} onChange={handleChange} />
            </>
          )}

          {isPortableTrackerDevice && (
            <>
              <input name="PortableTracking" placeholder="Portable Tracking" value={form.PortableTracking} onChange={handleChange} />
              <input name="PortableTrackingNumber" placeholder="Portable Tracking Number" value={form.PortableTrackingNumber} onChange={handleChange} />
              <input name="PortableTrackingSIMNumber" placeholder="Portable Tracking SIM Number" value={form.PortableTrackingSIMNumber} onChange={handleChange} />
              <input name="PortableVendor" placeholder="Vendor" value={form.PortableVendor} onChange={handleChange} />
              <input name="PortableInvoiceNo" placeholder="Invoice No" value={form.PortableInvoiceNo} onChange={handleChange} />
            </>
          )}

          {isFingerprintDevice && (
            <>
              <input name="PowerAppSID" placeholder="Power App ID" value={form.PowerAppSID} onChange={handleChange} />
              <input name="NewIPAfterVLAN" placeholder="New IP After VLAN" value={form.NewIPAfterVLAN} onChange={handleChange} />
            </>
          )}

          {isComputerDevice && (
            <>
              <input name="Vendor" placeholder="Vendor" value={form.Vendor} onChange={handleChange} />
              <input name="InvoiceNumber" placeholder="Invoice Number" value={form.InvoiceNumber} onChange={handleChange} />

              <select name="RentOrNot" value={form.RentOrNot} onChange={handleChange}>
                <option value="">Rent or Not</option>
                <option value="Rent">Rent</option>
                <option value="Not Rent">Not Rent</option>
              </select>

              <input name="OSVersion" placeholder="OS Version" value={form.OSVersion} onChange={handleChange} />
              <input name="Processor" placeholder="Processor" value={form.Processor} onChange={handleChange} />
              <input name="Gen" placeholder="Generation" value={form.Gen} onChange={handleChange} />
              <input name="RAMGB" placeholder="RAM (GB)" value={form.RAMGB} onChange={handleChange} />
              <input name="HDDGB" placeholder="HDD (GB)" value={form.HDDGB} onChange={handleChange} />
              <input name="SSDGB" placeholder="SSD (GB)" value={form.SSDGB} onChange={handleChange} />
              <input name="PenStorage" placeholder="Pen Storage" value={form.PenStorage} onChange={handleChange} />

              <select name="MouseType" value={form.MouseType} onChange={handleChange}>
                <option value="">Select Mouse Type</option>
                <option value="Wired">Wired</option>
                <option value="Wireless">Wireless</option>
              </select>

              <select name="KeyboardType" value={form.KeyboardType} onChange={handleChange}>
                <option value="">Select Keyboard Type</option>
                <option value="Wired">Wired</option>
                <option value="Wireless">Wireless</option>
              </select>
            </>
          )}

          <input name="SerialNumber" placeholder="Serial Number" value={form.SerialNumber} onChange={handleChange} />
          <input name="AssetCode" placeholder="Asset Code" value={form.AssetCode} onChange={handleChange} />
          <input name="Location" placeholder="Location" value={form.Location} onChange={handleChange} />

          {!hideIP && (
            <input name="IPAddress" placeholder="IP Address" value={form.IPAddress} onChange={handleChange} />
          )}

          <select name="Status" value={form.Status} onChange={handleChange}>
            <option>Available</option>
            <option>Assigned</option>
            <option>In Repair</option>
            <option>Retired</option>
            <option>Missing</option>
          </select>

          <input type="date" name="PurchaseDate" value={form.PurchaseDate} onChange={handleChange} />

          <input
            name="WarrantyPeriod"
            placeholder="Warranty Period"
            value={form.WarrantyPeriod}
            onChange={handleChange}
          />

          {!hideHandover && (
            <input type="date" name="HandoverDate" value={form.HandoverDate} onChange={handleChange} />
          )}

          <div className="previous-users-box">
            <h3>Previous Users</h3>

            {normalizePreviousUsers(form.PreviousUsers).map((userName, index) => (
              <div className="previous-user-row" key={index}>
                <input
                  placeholder={`Previous User ${index + 1}`}
                  value={userName}
                  onChange={(e) => handlePreviousUserChange(index, e.target.value)}
                />

                <button type="button" className="btn-delete" onClick={() => removePreviousUserField(index)}>
                  Remove
                </button>
              </div>
            ))}

            <button type="button" className="btn-save" onClick={addPreviousUserField}>
              + Add Previous User
            </button>
          </div>

          <textarea name="Notes" placeholder="Notes" value={form.Notes} onChange={handleChange}></textarea>

          <div className="form-actions">
            <button className="btn-save" type="submit">
              {editId ? `Update ${title}` : `Add ${title}`}
            </button>

            {editId && (
              <button
                className="btn-cancel"
                type="button"
                onClick={() => {
                  setEditId(null);
                  setForm({ ...emptyForm, DeviceType: deviceType });
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      )}

      <div className="pro-card">
        <div className="search-box">
          <input
            placeholder="Search by EPF, name, previous user, serial, asset, department, location, PO, vendor, invoice"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Status</option>
            <option>Available</option>
            <option>Assigned</option>
            <option>In Repair</option>
            <option>Retired</option>
            <option>Missing</option>
          </select>

          <button type="button" onClick={exportExcel}>Download Excel</button>
        </div>
      </div>

      <div className="table-card">
        <table className="device-table">
          <thead>
            <tr>
              <th>#</th>

              {needsEmployee && (
                <>
                  <th>Employee</th>
                  <th>EPF</th>
                </>
              )}

              {!hideDepartment && <th>{isSwitchDevice ? "Exact Location" : "Department"}</th>}
              {!hideDeviceName && <th>Device</th>}

              <th>PO Number</th>

              {isPrinterDevice && (
                <>
                  <th>Toner Model</th>
                  <th>Current User</th>
                  <th>Rent</th>
                </>
              )}

              {isSwitchDevice && (
                <>
                  <th>IT Ref No</th>
                  <th>Vendor</th>
                </>
              )}

              {(isTabletDevice || isSIMDevice) && <th>SIM Number</th>}

              {!hideModel && !isSmartBoardDevice && <th>{isServerDevice ? "Server Brand" : "Model"}</th>}

              {isServerDevice && (
                <>
                  <th>Server Model</th>
                  <th>Processor</th>
                  <th>RAM</th>
                  <th>HDD</th>
                  <th>OS</th>
                  <th>Vendor</th>
                  <th>Purpose</th>
                </>
              )}

              {isProjectorDevice && (
                <>
                  <th>Current Location</th>
                  <th>Vendor</th>
                </>
              )}

              {isWirelessAPDevice && (
                <>
                  <th>Access Point Brand</th>
                  <th>Access Point Model</th>
                  <th>Exact Location</th>
                  <th>Vendor</th>
                  <th>Username</th>
                  <th>Password</th>
                </>
              )}

              {isUPSDevice && (
                <>
                  <th>Brand</th>
                  <th>IT Ref No</th>
                  <th>Vendor</th>
                </>
              )}

              {isSmartBoardDevice && (
                <>
                  <th>Model</th>
                  <th>Description</th>
                  <th>Vendor</th>
                  <th>Current Location</th>
                  <th>Warranty</th>
                </>
              )}

              {isPortableTrackerDevice && (
                <>
                  <th>Portable Tracking</th>
                  <th>Tracking Number</th>
                  <th>Tracking SIM Number</th>
                  <th>Vendor</th>
                  <th>Invoice No</th>
                </>
              )}

              {isFingerprintDevice && (
                <>
                  <th>Power App ID</th>
                  <th>New IP After VLAN</th>
                </>
              )}

              <th>Serial</th>
              <th>Asset</th>
              <th>Location</th>

              {!hideIP && <th>IP</th>}

              {isSIMDevice && <th>SIM Type</th>}

              {isComputerDevice && (
                <>
                  <th>Vendor</th>
                  <th>Invoice</th>
                  <th>Rent</th>
                  <th>OS</th>
                  <th>Processor</th>
                  <th>Gen</th>
                  <th>RAM</th>
                  <th>HDD</th>
                  <th>SSD</th>
                  <th>Pen</th>
                  <th>Mouse</th>
                  <th>Keyboard</th>
                </>
              )}

              <th>Status</th>
              <th>Purchase</th>
              <th>Warranty Period</th>

              {!hideHandover && <th>Handover</th>}

              <th>Age</th>
              <th>Previous Users</th>
              <th>Notes</th>

              {isAdmin && <th>Action</th>}
            </tr>
          </thead>

          <tbody>
            {filteredDevices.map((d, index) => (
              <tr key={d._id}>
                <td>{index + 1}</td>

                {needsEmployee && (
                  <>
                    <td>{d.EmployeeName}</td>
                    <td>{d.EPFNumber}</td>
                  </>
                )}

                {!hideDepartment && <td>{isSwitchDevice ? d.ExactLocation : d.Department}</td>}
                {!hideDeviceName && <td>{d.DeviceName}</td>}

                <td>{d.PONumber}</td>

                {isPrinterDevice && (
                  <>
                    <td>{d.TonerModel}</td>
                    <td>{d.CurrentUser}</td>
                    <td>{d.RentOrNot}</td>
                  </>
                )}

                {isSwitchDevice && (
                  <>
                    <td>{d.ITReferenceNumber}</td>
                    <td>{d.Vendor}</td>
                  </>
                )}

                {(isTabletDevice || isSIMDevice) && <td>{d.SIMNumber}</td>}

                {!hideModel && !isSmartBoardDevice && <td>{d.Model}</td>}

                {isServerDevice && (
                  <>
                    <td>{d.ServerModel}</td>
                    <td>{d.ServerProcessor}</td>
                    <td>{d.ServerRAM}</td>
                    <td>{d.ServerHDD}</td>
                    <td>{d.ServerOS}</td>
                    <td>{d.ServerVendor}</td>
                    <td>{d.ServerPurpose}</td>
                  </>
                )}

                {isProjectorDevice && (
                  <>
                    <td>{d.CurrentLocation}</td>
                    <td>{d.ProjectorVendor}</td>
                  </>
                )}

                {isWirelessAPDevice && (
                  <>
                    <td>{d.AccessPointBrand}</td>
                    <td>{d.AccessPointModel}</td>
                    <td>{d.ExactLocation}</td>
                    <td>{d.WirelessVendor}</td>
                    <td>{d.WirelessUsername}</td>
                    <td>{d.WirelessPassword}</td>
                  </>
                )}

                {isUPSDevice && (
                  <>
                    <td>{d.UPSBrand}</td>
                    <td>{d.UPSITReferenceNumber}</td>
                    <td>{d.UPSVendor}</td>
                  </>
                )}

                {isSmartBoardDevice && (
                  <>
                    <td>{d.Model}</td>
                    <td>{d.Description}</td>
                    <td>{d.Vendor}</td>
                    <td>{d.CurrentLocation}</td>
                    <td>{d.Warranty}</td>
                  </>
                )}

                {isPortableTrackerDevice && (
                  <>
                    <td>{d.PortableTracking}</td>
                    <td>{d.PortableTrackingNumber}</td>
                    <td>{d.PortableTrackingSIMNumber}</td>
                    <td>{d.PortableVendor}</td>
                    <td>{d.PortableInvoiceNo}</td>
                  </>
                )}

                {isFingerprintDevice && (
                  <>
                    <td>{d.PowerAppSID}</td>
                    <td>{d.NewIPAfterVLAN}</td>
                  </>
                )}

                <td>{d.SerialNumber}</td>
                <td>{d.AssetCode}</td>
                <td>{d.Location}</td>

                {!hideIP && <td>{d.IPAddress}</td>}

                {isSIMDevice && <td>{d.SIMType}</td>}

                {isComputerDevice && (
                  <>
                    <td>{d.Vendor}</td>
                    <td>{d.InvoiceNumber}</td>
                    <td>{d.RentOrNot}</td>
                    <td>{d.OSVersion}</td>
                    <td>{d.Processor}</td>
                    <td>{d.Gen}</td>
                    <td>{d.RAMGB}</td>
                    <td>{d.HDDGB}</td>
                    <td>{d.SSDGB}</td>
                    <td>{d.PenStorage}</td>
                    <td>{d.MouseType}</td>
                    <td>{d.KeyboardType}</td>
                  </>
                )}

                <td>
                  <span className={`badge ${(d.Status || "Available").replaceAll(" ", "-").toLowerCase()}`}>
                    {d.Status}
                  </span>
                </td>

                <td>{d.PurchaseDate ? d.PurchaseDate.slice(0, 10) : ""}</td>
                <td>{d.WarrantyPeriod}</td>

                {!hideHandover && (
                  <td>{d.HandoverDate ? d.HandoverDate.slice(0, 10) : ""}</td>
                )}

                <td>{calculateAge(d.PurchaseDate)}</td>

                <td>
                  {d.PreviousUsers && d.PreviousUsers.length > 0
                    ? normalizePreviousUsers(d.PreviousUsers).map((u, i) => (
                        <div key={i}>
                          {i + 1}. {u}
                        </div>
                      ))
                    : "-"}
                </td>

                <td>{d.Notes}</td>

                {isAdmin && (
                  <td>
                    <button className="btn-edit" onClick={() => editDevice(d)}>Edit</button>
                    <button className="btn-delete" onClick={() => deleteDevice(d._id)}>Delete</button>
                  </td>
                )}
              </tr>
            ))}

            {filteredDevices.length === 0 && (
              <tr>
                <td colSpan={isAdmin ? 60 : 59} className="no-data">
                  No data available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DevicePage;