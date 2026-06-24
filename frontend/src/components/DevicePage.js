import React, { useEffect, useState } from "react";
import axios from "axios";
import * as XLSX from "xlsx";

const BASE_API =
  window.location.hostname === "localhost"
    ? "http://localhost:5000/api"
    : "https://it-device-tracker.onrender.com/api";

const DEVICE_API = `${BASE_API}/devices`;
const EMPLOYEE_API = `${BASE_API}/employees`;
const DEPARTMENT_API = `${BASE_API}/employees/departments/all`;

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

  const hideDepartment = false;

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
    Designation: "",

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
  const [allEmployees, setAllEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");

  // Realtime age update
  const [todayDate, setTodayDate] = useState(new Date());

  // Custom date for checking age as of selected date
  const [ageAsOfDate, setAgeAsOfDate] = useState("");

  const user = JSON.parse(localStorage.getItem("user"));
  const isAdmin = user?.role === "admin";

  const getHeaders = () => ({
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });

  /* =========================================
     REALTIME AGE CALCULATION
     Calculates age from selected base date to today/custom date
  ========================================= */

  useEffect(() => {
    const timer = setInterval(() => {
      setTodayDate(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const calculateAge = (dateValue, customEndDate = "") => {
    if (!dateValue) return "-";

    const startDate = new Date(dateValue);
    const endDate = customEndDate ? new Date(customEndDate) : new Date(todayDate);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return "-";

    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);

    if (startDate > endDate) return "0 Years 0 Months 0 Days";

    let years = endDate.getFullYear() - startDate.getFullYear();
    let months = endDate.getMonth() - startDate.getMonth();
    let days = endDate.getDate() - startDate.getDate();

    if (days < 0) {
      months--;

      const previousMonth = new Date(
        endDate.getFullYear(),
        endDate.getMonth(),
        0
      );

      days += previousMonth.getDate();
    }

    if (months < 0) {
      years--;
      months += 12;
    }

    if (years < 0) return "0 Years 0 Months 0 Days";

    return `${years} Year${years !== 1 ? "s" : ""} ${months} Month${
      months !== 1 ? "s" : ""
    } ${days} Day${days !== 1 ? "s" : ""}`;
  };

  const getAgeBaseDate = (device) => {
    return (
      device.AgeBaseDate ||
      device.ageBaseDate ||
      device.CustomDate ||
      device.customDate ||
      device.PurchaseDate ||
      device.purchaseDate ||
      device.Purchase ||
      device.purchase ||
      device.Purchase_Date ||
      device.purchase_date ||
      ""
    );
  };

  const getDeviceAge = (device) => {
    return calculateAge(getAgeBaseDate(device), ageAsOfDate);
  };

  const normalizePreviousUsers = (value) => {
    if (Array.isArray(value)) return value;
    if (typeof value === "string" && value.trim() !== "") return [value];
    return [""];
  };

  // ── Employee helper functions ──────────────────────────────────────────────

  const getEmployeeName = (emp) => {
    const firstName = emp.FirstName || emp.firstName || "";
    const secondName = emp.SecondName || emp.secondName || "";

    return (
      emp.FullName ||
      emp.fullName ||
      emp.EmployeeName ||
      emp.employeeName ||
      emp.userName ||
      emp.username ||
      emp.name ||
      `${firstName} ${secondName}`.trim()
    );
  };

  const getEmployeeEPF = (emp) => {
    return (
      emp.EPFNumber ||
      emp.epfNumber ||
      emp.EPF ||
      emp.epf ||
      emp.EpfNumber ||
      ""
    );
  };

  const getEmployeeDepartment = (emp) => {
    return emp.Department || emp.department || "";
  };

  const getEmployeeDesignation = (emp) => {
    return (
      emp.Designation ||
      emp.designation ||
      emp.Position ||
      emp.position ||
      ""
    );
  };

  const getEmployeeLocation = (emp) => {
    return emp.Location || emp.location || "";
  };

  // ── Employee selection ─────────────────────────────────────────────────────

  const selectEmployee = (emp) => {
    if (!emp) return;

    setForm((prev) => ({
      ...prev,
      EmployeeName: getEmployeeName(emp),
      EPFNumber: getEmployeeEPF(emp),
      Department: getEmployeeDepartment(emp) || getEmployeeDesignation(emp),
      Designation: getEmployeeDesignation(emp),
      Location: getEmployeeLocation(emp),
    }));
  };

  const findEmployeeByValue = (value) => {
    const key = String(value || "").trim().toLowerCase();

    if (!key) return null;

    return allEmployees.find((emp) => {
      const name = String(getEmployeeName(emp)).toLowerCase();
      const epf = String(getEmployeeEPF(emp)).toLowerCase();

      return name === key || epf === key;
    });
  };

  // ── Data loading ───────────────────────────────────────────────────────────

  const loadDevices = async () => {
    try {
      const res = await axios.get(`${DEVICE_API}`, getHeaders());

      const all = res.data || [];

      const filtered = all.filter(
        (d) => d.DeviceType === deviceType
      );

      setDevices(filtered);
    } catch (err) {
      console.error("Load devices error:", err.response?.data || err.message);
      setDevices([]);
    }
  };

  const loadEmployees = async () => {
    try {
      const res = await axios.get(EMPLOYEE_API, getHeaders());

      const employeeData = Array.isArray(res.data)
        ? res.data
        : res.data.employees || res.data.data || [];

      console.log("EMPLOYEES LOADED:", employeeData);
      console.log("FIRST EMPLOYEE:", employeeData?.[0]);

      setAllEmployees(employeeData);
    } catch (err) {
      console.error("Load employees error:", err.response?.data || err.message);
      setAllEmployees([]);
    }
  };

  const loadDepartments = async () => {
    try {
      const res = await axios.get(DEPARTMENT_API, getHeaders());

      const departmentData = Array.isArray(res.data)
        ? res.data
        : res.data.departments || res.data.data || [];

      console.log("DEPARTMENTS LOADED:", departmentData);

      setDepartments(departmentData);
    } catch (err) {
      console.error("Load departments error:", err.response?.data || err.message);
      setDepartments([]);
    }
  };

  useEffect(() => {
    setForm({ ...emptyForm, DeviceType: deviceType });
    setEditId(null);
    setAgeAsOfDate("");
    loadDevices();
    loadEmployees();
    loadDepartments();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceType]);

  // ── Form handlers ──────────────────────────────────────────────────────────

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
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

  // ── Save / Edit / Delete ───────────────────────────────────────────────────

  const saveDevice = async (e) => {
    e.preventDefault();

    const payload = { ...form };

    if (!needsEmployee) {
      payload.EmployeeName = "";
      payload.EPFNumber = "";
      payload.Designation = "";
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
      payload.DeviceName = "";
      payload.Model = "";
      payload.HandoverDate = "";
    }

    if (isFingerprintDevice) {
      payload.EmployeeName = "";
      payload.EPFNumber = "";
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
        await axios.put(`${DEVICE_API}/${editId}`, payload, getHeaders());
      } else {
        await axios.post(DEVICE_API, payload, getHeaders());
      }

      setForm({ ...emptyForm, DeviceType: deviceType });
      setEditId(null);
      await loadDevices();
      await loadEmployees();
    } catch (err) {
      console.error("Save error:", err.response?.data || err.message);
      alert(err.response?.data?.message || "Save failed");
    }
  };

  const editDevice = (d) => {
    setEditId(d._id);

    setForm({
      ...emptyForm,
      DeviceType: deviceType,

      EmployeeName: d.EmployeeName || "",
      EPFNumber: d.EPFNumber || "",
      Department: d.Department || "",
      Designation: d.Designation || "",

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
      await axios.delete(`${DEVICE_API}/${id}`, getHeaders());
      await loadDevices();
      await loadEmployees();
    } catch (err) {
      console.error("Delete error:", err.response?.data || err.message);
      alert(err.response?.data?.message || "Delete failed");
    }
  };

  // ── Filtering & Export ─────────────────────────────────────────────────────

  const filteredDevices = devices.filter((d) => {
    const keyword = search.toLowerCase();

    const previousUsersText = d.PreviousUsers
      ? normalizePreviousUsers(d.PreviousUsers).join(" ").toLowerCase()
      : "";

    const searchableText = [
      d.EmployeeName,
      d.EPFNumber,
      d.Department,
      d.Designation,
      d.DeviceName,
      d.Model,
      d.SerialNumber,
      d.AssetCode,
      d.Location,
      d.IPAddress,
      d.PONumber,
      d.Vendor,
      d.InvoiceNumber,
      d.TonerModel,
      d.CurrentUser,
      d.ExactLocation,
      d.ITReferenceNumber,
      d.CurrentLocation,
      d.ProjectorVendor,
      d.AccessPointBrand,
      d.AccessPointModel,
      d.WirelessVendor,
      d.WirelessUsername,
      d.PowerAppSID,
      d.NewIPAfterVLAN,
      d.PortableTracking,
      d.PortableTrackingNumber,
      d.PortableTrackingSIMNumber,
      getDeviceAge(d),
      previousUsersText,
    ]
      .join(" ")
      .toLowerCase();

    const matchSearch = searchableText.includes(keyword);
    const matchStatus = statusFilter ? d.Status === statusFilter : true;

    return matchSearch && matchStatus;
  });

  const exportExcel = () => {
    const exportData = filteredDevices.map((d, index) => ({
      No: index + 1,
      DeviceType: d.DeviceType,
      EmployeeName: d.EmployeeName,
      EPFNumber: d.EPFNumber,
      Department: d.Department,
      Designation: d.Designation,
      DeviceName: d.DeviceName,
      Model: d.Model,
      SerialNumber: d.SerialNumber,
      AssetCode: d.AssetCode,
      Location: d.Location,
      IPAddress: d.IPAddress,
      PONumber: d.PONumber,
      Vendor: d.Vendor,
      InvoiceNumber: d.InvoiceNumber,
      RentOrNot: d.RentOrNot,
      OSVersion: d.OSVersion,
      Processor: d.Processor,
      Gen: d.Gen,
      RAMGB: d.RAMGB,
      HDDGB: d.HDDGB,
      SSDGB: d.SSDGB,
      PenStorage: d.PenStorage,
      MouseType: d.MouseType,
      KeyboardType: d.KeyboardType,
      SIMNumber: d.SIMNumber,
      SIMType: d.SIMType,
      Status: d.Status,
      PurchaseDate: d.PurchaseDate ? d.PurchaseDate.slice(0, 10) : "",
      HandoverDate: d.HandoverDate ? d.HandoverDate.slice(0, 10) : "",
      WarrantyPeriod: d.WarrantyPeriod,
      Age: getDeviceAge(d),
      PreviousUsers:
        d.PreviousUsers && d.PreviousUsers.length > 0
          ? normalizePreviousUsers(d.PreviousUsers).join(", ")
          : "",
      Notes: d.Notes,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, title);
    XLSX.writeFile(workbook, `${title}_Report.xlsx`);
  };

  // ── Render helpers ─────────────────────────────────────────────────────────

  const renderEmployeeAutocomplete = (fieldName, placeholder) => {
    const listId =
      fieldName === "EmployeeName" ? "employee-name-list" : "employee-epf-list";

    return (
      <>
        <input
          name={fieldName}
          list={listId}
          placeholder={placeholder}
          value={form[fieldName]}
          onChange={(e) => {
            handleChange(e);

            const matched = findEmployeeByValue(e.target.value);
            if (matched) selectEmployee(matched);
          }}
          onBlur={(e) => {
            const typedValue = String(e.target.value || "").toLowerCase();
            if (!typedValue) return;

            const matched =
              findEmployeeByValue(e.target.value) ||
              allEmployees.find((emp) => {
                const name = String(getEmployeeName(emp)).toLowerCase();
                const epf = String(getEmployeeEPF(emp)).toLowerCase();
                return name.includes(typedValue) || epf.includes(typedValue);
              });

            if (matched) selectEmployee(matched);
          }}
          autoComplete="off"
        />

        <datalist id={listId}>
          {allEmployees.map((emp) => {
            const name = getEmployeeName(emp);
            const epf = getEmployeeEPF(emp);

            return (
              <option
                key={emp._id || `${name}-${epf}`}
                value={fieldName === "EmployeeName" ? name : epf}
              >
                {name} | EPF: {epf} |{" "}
                {getEmployeeDepartment(emp) || getEmployeeDesignation(emp)}
              </option>
            );
          })}
        </datalist>
      </>
    );
  };

  const renderTextInput = (name, placeholder, readOnly = false) => (
    <input
      name={name}
      placeholder={placeholder}
      value={form[name]}
      onChange={handleChange}
      readOnly={readOnly}
    />
  );

  const renderDepartmentInput = () => (
    <>
      <input
        name="Department"
        list="department-list"
        placeholder="Select or type Department"
        value={form.Department}
        onChange={handleChange}
        autoComplete="off"
      />

      <datalist id="department-list">
        {departments.map((dep) => (
          <option key={dep._id || dep.Name} value={dep.Name} />
        ))}
      </datalist>
    </>
  );

  const renderSelect = (name, options, placeholder) => (
    <select name={name} value={form[name]} onChange={handleChange}>
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );

  // ── Table columns ──────────────────────────────────────────────────────────

  const tableColumns = [
    ...(needsEmployee
      ? [
          { label: "Employee", value: "EmployeeName" },
          { label: "EPF", value: "EPFNumber" },
        ]
      : []),

    ...(!hideDepartment
      ? [
          {
            label: "Department",
            value: "Department",
          },
        ]
      : []),

    ...(!hideDeviceName
      ? [{ label: "Device", value: "DeviceName" }]
      : []),

    { label: "PO Number", value: "PONumber" },

    ...(isPrinterDevice
      ? [
          { label: "Toner Model", value: "TonerModel" },
          { label: "Current User", value: "CurrentUser" },
          { label: "Rent", value: "RentOrNot" },
        ]
      : []),

    ...(isSwitchDevice
      ? [
          { label: "IT Ref No", value: "ITReferenceNumber" },
          { label: "Vendor", value: "Vendor" },
        ]
      : []),

    ...(isTabletDevice || isSIMDevice
      ? [{ label: "SIM Number", value: "SIMNumber" }]
      : []),

    ...(!hideModel && !isSmartBoardDevice
      ? [
          {
            label: isServerDevice ? "Server Brand" : "Model",
            value: "Model",
          },
        ]
      : []),

    ...(isServerDevice
      ? [
          { label: "Server Model", value: "ServerModel" },
          { label: "Processor", value: "ServerProcessor" },
          { label: "RAM", value: "ServerRAM" },
          { label: "HDD", value: "ServerHDD" },
          { label: "OS", value: "ServerOS" },
          { label: "Vendor", value: "ServerVendor" },
          { label: "Purpose", value: "ServerPurpose" },
        ]
      : []),

    ...(isProjectorDevice
      ? [
          { label: "Current Location", value: "CurrentLocation" },
          { label: "Vendor", value: "ProjectorVendor" },
        ]
      : []),

    ...(isWirelessAPDevice
      ? [
          { label: "AP Brand", value: "AccessPointBrand" },
          { label: "AP Model", value: "AccessPointModel" },
          { label: "Exact Location", value: "ExactLocation" },
          { label: "Vendor", value: "WirelessVendor" },
          { label: "Username", value: "WirelessUsername" },
          { label: "Password", value: "WirelessPassword" },
        ]
      : []),

    ...(isUPSDevice
      ? [
          { label: "Brand", value: "UPSBrand" },
          { label: "IT Ref No", value: "UPSITReferenceNumber" },
          { label: "Vendor", value: "UPSVendor" },
        ]
      : []),

    ...(isSmartBoardDevice
      ? [
          { label: "Model", value: "Model" },
          { label: "Description", value: "Description" },
          { label: "Vendor", value: "Vendor" },
          { label: "Current Location", value: "CurrentLocation" },
        ]
      : []),

    ...(isPortableTrackerDevice
      ? [
          { label: "Portable Tracking", value: "PortableTracking" },
          { label: "Tracking Number", value: "PortableTrackingNumber" },
          { label: "Tracking SIM", value: "PortableTrackingSIMNumber" },
          { label: "Vendor", value: "PortableVendor" },
          { label: "Invoice No", value: "PortableInvoiceNo" },
        ]
      : []),

    ...(isFingerprintDevice
      ? [
          { label: "Power App ID", value: "PowerAppSID" },
          { label: "New IP After VLAN", value: "NewIPAfterVLAN" },
        ]
      : []),

    { label: "Serial", value: "SerialNumber" },
    { label: "Asset", value: "AssetCode" },
    { label: "Location", value: "Location" },

    ...(!hideIP ? [{ label: "IP", value: "IPAddress" }] : []),

    ...(isSIMDevice ? [{ label: "SIM Type", value: "SIMType" }] : []),

    ...(isComputerDevice
      ? [
          { label: "Vendor", value: "Vendor" },
          { label: "Invoice", value: "InvoiceNumber" },
          { label: "Rent", value: "RentOrNot" },
          { label: "OS", value: "OSVersion" },
          { label: "Processor", value: "Processor" },
          { label: "Gen", value: "Gen" },
          { label: "RAM", value: "RAMGB" },
          { label: "HDD", value: "HDDGB" },
          { label: "SSD", value: "SSDGB" },
          { label: "Pen", value: "PenStorage" },
          { label: "Mouse", value: "MouseType" },
          { label: "Keyboard", value: "KeyboardType" },
        ]
      : []),

    { label: "Status", value: "Status" },
    { label: "Purchase", value: "PurchaseDate" },
    { label: "Warranty Period", value: "WarrantyPeriod" },

    ...(!hideHandover
      ? [{ label: "Handover", value: "HandoverDate" }]
      : []),

    {
      label: ageAsOfDate ? `Age as of ${ageAsOfDate}` : "Age",
      value: "Age",
    },

    { label: "Previous Users", value: "PreviousUsers" },
    { label: "Notes", value: "Notes" },
  ];

  // ── Cell renderer ──────────────────────────────────────────────────────────

  const getCellValue = (device, key) => {
    if (key === "PurchaseDate" || key === "HandoverDate") {
      return device[key] ? device[key].slice(0, 10) : "";
    }

    if (key === "Age") {
      return getDeviceAge(device);
    }

    if (key === "PreviousUsers") {
      return device.PreviousUsers && device.PreviousUsers.length > 0
        ? normalizePreviousUsers(device.PreviousUsers).map((u, i) => (
            <div key={i}>
              {i + 1}. {u}
            </div>
          ))
        : "-";
    }

    if (key === "Status") {
      return (
        <span
          className={`badge ${(device.Status || "Available")
            .replaceAll(" ", "-")
            .toLowerCase()}`}
        >
          {device.Status}
        </span>
      );
    }

    return device[key] || "";
  };

  // ── JSX ────────────────────────────────────────────────────────────────────

  return (
    <div className="device-page">
      <div className="page-header">
        <h1>{title}</h1>
        <span className="device-count">{filteredDevices.length} Devices</span>
      </div>

      <div className="device-dashboard-cards">
        <div className="device-stat-card">
          <h3>Total</h3>
          <p>{devices.length}</p>
        </div>

        <div className="device-stat-card">
          <h3>Available</h3>
          <p>{devices.filter((d) => d.Status === "Available").length}</p>
        </div>

        <div className="device-stat-card">
          <h3>Assigned</h3>
          <p>{devices.filter((d) => d.Status === "Assigned").length}</p>
        </div>

        <div className="device-stat-card">
          <h3>In Repair</h3>
          <p>{devices.filter((d) => d.Status === "In Repair").length}</p>
        </div>

        <div className="device-stat-card">
          <h3>Retired</h3>
          <p>{devices.filter((d) => d.Status === "Retired").length}</p>
        </div>

        <div className="device-stat-card">
          <h3>Missing</h3>
          <p>{devices.filter((d) => d.Status === "Missing").length}</p>
        </div>
      </div>

      {isAdmin && (
        <form className="device-form pro-card" onSubmit={saveDevice}>
          {needsEmployee && (
            <>
              {renderEmployeeAutocomplete("EmployeeName", "Search Employee Name")}
              {renderEmployeeAutocomplete("EPFNumber", "Search EPF Number")}
            </>
          )}

          {!hideDepartment && renderDepartmentInput()}
          {!hideDeviceName && renderTextInput("DeviceName", "Device Name")}

          {renderTextInput("PONumber", "PO Number")}

          {isPrinterDevice && (
            <>
              {renderTextInput("TonerModel", "Toner Model")}
              {renderTextInput("CurrentUser", "Current User")}
              {renderSelect("RentOrNot", ["Rent", "Not Rent"], "Rent or Not")}
            </>
          )}

          {(isTabletDevice || isSIMDevice) && (
            <>
              {renderTextInput("SIMNumber", "SIM Number")}

              {isSIMDevice &&
                renderSelect(
                  "SIMType",
                  ["Data Only", "Mobile"],
                  "Select SIM Type"
                )}
            </>
          )}

          {!hideModel &&
            !isServerDevice &&
            !isSmartBoardDevice &&
            renderTextInput("Model", "Model")}

          {isServerDevice && (
            <>
              {renderTextInput("Model", "Server Brand")}
              {renderTextInput("ServerModel", "Server Model")}
              {renderTextInput("ServerProcessor", "Processor")}
              {renderTextInput("ServerRAM", "RAM")}
              {renderTextInput("ServerHDD", "HDD")}
              {renderTextInput("ServerOS", "OS")}
              {renderTextInput("ServerVendor", "Vendor")}
              {renderTextInput("ServerPurpose", "Purpose")}
            </>
          )}

          {isSwitchDevice && (
            <>
              {renderTextInput("ExactLocation", "Exact Location")}
              {renderTextInput("ITReferenceNumber", "IT Reference Number")}
              {renderTextInput("Vendor", "Vendor")}
            </>
          )}

          {isProjectorDevice && (
            <>
              {renderTextInput("CurrentLocation", "Current Location")}
              {renderTextInput("ProjectorVendor", "Vendor")}
            </>
          )}

          {isWirelessAPDevice && (
            <>
              {renderTextInput("AccessPointBrand", "Access Point Brand")}
              {renderTextInput("AccessPointModel", "Access Point Model")}
              {renderTextInput("ExactLocation", "Exact Location")}
              {renderTextInput("WirelessVendor", "Vendor")}
              {renderTextInput("WirelessUsername", "Username")}
              {renderTextInput("WirelessPassword", "Password")}
            </>
          )}

          {isUPSDevice && (
            <>
              {renderTextInput("UPSBrand", "Brand")}
              {renderTextInput("UPSITReferenceNumber", "IT Reference Number")}
              {renderTextInput("UPSVendor", "Vendor")}
            </>
          )}

          {isSmartBoardDevice && (
            <>
              {renderTextInput("Model", "Model")}
              {renderTextInput("Description", "Description")}
              {renderTextInput("Vendor", "Vendor")}
              {renderTextInput("CurrentLocation", "Current Location")}
            </>
          )}

          {isPortableTrackerDevice && (
            <>
              {renderTextInput("PortableTracking", "Portable Tracking")}
              {renderTextInput(
                "PortableTrackingNumber",
                "Portable Tracking Number"
              )}
              {renderTextInput(
                "PortableTrackingSIMNumber",
                "Portable Tracking SIM Number"
              )}
              {renderTextInput("PortableVendor", "Vendor")}
              {renderTextInput("PortableInvoiceNo", "Invoice No")}
            </>
          )}

          {isFingerprintDevice && (
            <>
              {renderTextInput("PowerAppSID", "Power App ID")}
              {renderTextInput("NewIPAfterVLAN", "New IP After VLAN")}
            </>
          )}

          {isComputerDevice && (
            <>
              {renderTextInput("Vendor", "Vendor")}
              {renderTextInput("InvoiceNumber", "Invoice Number")}
              {renderSelect("RentOrNot", ["Rent", "Not Rent"], "Rent or Not")}
              {renderTextInput("OSVersion", "OS Version")}
              {renderTextInput("Processor", "Processor")}
              {renderTextInput("Gen", "Generation")}
              {renderTextInput("RAMGB", "RAM (GB)")}
              {renderTextInput("HDDGB", "HDD (GB)")}
              {renderTextInput("SSDGB", "SSD (GB)")}
              {renderTextInput("PenStorage", "Pen Storage")}
              {renderSelect(
                "MouseType",
                ["Wired", "Wireless"],
                "Select Mouse Type"
              )}
              {renderSelect(
                "KeyboardType",
                ["Wired", "Wireless"],
                "Select Keyboard Type"
              )}
            </>
          )}

          {renderTextInput("SerialNumber", "Serial Number")}
          {renderTextInput("AssetCode", "Asset Code")}
          {renderTextInput("Location", "Location")}

          {!hideIP && renderTextInput("IPAddress", "IP Address")}

          <select name="Status" value={form.Status} onChange={handleChange}>
            <option>Available</option>
            <option>Assigned</option>
            <option>In Repair</option>
            <option>Retired</option>
            <option>Missing</option>
          </select>

          <input
            type="date"
            name="PurchaseDate"
            value={form.PurchaseDate}
            onChange={handleChange}
          />

          {renderTextInput("WarrantyPeriod", "Warranty Period")}

          {!hideHandover && (
            <input
              type="date"
              name="HandoverDate"
              value={form.HandoverDate}
              onChange={handleChange}
            />
          )}

          <div className="previous-users-box">
            <h3>Previous Users</h3>

            {normalizePreviousUsers(form.PreviousUsers).map(
              (userName, index) => (
                <div className="previous-user-row" key={index}>
                  <input
                    placeholder={`Previous User ${index + 1}`}
                    value={userName}
                    onChange={(e) =>
                      handlePreviousUserChange(index, e.target.value)
                    }
                  />

                  <button
                    type="button"
                    className="btn-delete"
                    onClick={() => removePreviousUserField(index)}
                  >
                    Remove
                  </button>
                </div>
              )
            )}

            <button
              type="button"
              className="btn-save"
              onClick={addPreviousUserField}
            >
              + Add Previous User
            </button>
          </div>

          <textarea
            name="Notes"
            placeholder="Notes"
            value={form.Notes}
            onChange={handleChange}
          ></textarea>

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

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Status</option>
            <option>Available</option>
            <option>Assigned</option>
            <option>In Repair</option>
            <option>Retired</option>
            <option>Missing</option>
          </select>

          <input
            type="date"
            value={ageAsOfDate}
            onChange={(e) => setAgeAsOfDate(e.target.value)}
            title="Calculate age as of this date"
          />

          {ageAsOfDate && (
            <button
              type="button"
              className="btn-delete"
              onClick={() => setAgeAsOfDate("")}
            >
              Today Age
            </button>
          )}

          <button type="button" onClick={exportExcel}>
            Download Excel
          </button>
        </div>
      </div>

      <div className="table-card">
        <table className="device-table">
          <thead>
            <tr>
              <th>#</th>

              {tableColumns.map((col) => (
                <th key={col.label}>{col.label}</th>
              ))}

              {isAdmin && <th>Action</th>}
            </tr>
          </thead>

          <tbody>
            {filteredDevices.map((device, index) => (
              <tr key={device._id}>
                <td>{index + 1}</td>

                {tableColumns.map((col) => (
                  <td key={col.label}>{getCellValue(device, col.value)}</td>
                ))}

                {isAdmin && (
                  <td>
                    <button
                      className="btn-edit"
                      onClick={() => editDevice(device)}
                    >
                      Edit
                    </button>

                    <button
                      className="btn-delete"
                      onClick={() => deleteDevice(device._id)}
                    >
                      Delete
                    </button>
                  </td>
                )}
              </tr>
            ))}

            {filteredDevices.length === 0 && (
              <tr>
                <td colSpan={tableColumns.length + 2} className="no-data">
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