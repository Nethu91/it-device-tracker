import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";

const BASE_API =
  window.location.hostname === "localhost"
    ? "http://localhost:5000/api"
    : "https://it-device-tracker.onrender.com/api";

const DEVICE_API = `${BASE_API}/devices`;
const EMPLOYEE_API = `${BASE_API}/employees`;
const CUSTOM_DEVICE_API = `${BASE_API}/custom-devices`;

function Dashboard() {
  const [devices, setDevices] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [customDevices, setCustomDevices] = useState([]);

  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  /* =========================
     🔥 NEW: LIFECYCLE STATE
  ========================= */
  const [lifecycle, setLifecycle] = useState({
    near: 0,
    urgent: 0,
    disposed: 0,
  });

  const getAuthHeaders = () => ({
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });

  const normalizeArray = (data, key) => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.[key])) return data[key];
    if (Array.isArray(data?.data)) return data.data;
    return [];
  };

  /* =========================
     LOAD DASHBOARD DATA
  ========================= */
  const loadDashboardData = async () => {
    try {
      setLoading(true);

      const [deviceRes, empRes, customRes] = await Promise.all([
        axios.get(DEVICE_API, getAuthHeaders()),
        axios.get(EMPLOYEE_API, getAuthHeaders()),
        axios.get(CUSTOM_DEVICE_API, getAuthHeaders()).catch(() => ({
          data: [],
        })),
      ]);

      setDevices(normalizeArray(deviceRes.data, "devices"));
      setEmployees(normalizeArray(empRes.data, "employees"));
      setCustomDevices(normalizeArray(customRes.data, "customDevices"));
    } catch (err) {
      console.error("Dashboard error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     🔥 NEW: LIFECYCLE API
  ========================= */
  const loadLifecycle = async () => {
    try {
      const res = await axios.get(
        `${DEVICE_API}/dashboard/overview`,
        getAuthHeaders()
      );

      setLifecycle(res.data || { near: 0, urgent: 0, disposed: 0 });
    } catch (err) {
      console.error("Lifecycle error:", err.message);
    }
  };

  useEffect(() => {
    loadDashboardData();
    loadLifecycle();

    const interval = setInterval(() => {
      loadDashboardData();
      loadLifecycle();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const totalDeviceCount = devices.length + customDevices.length;

  const countByStatus = (status) => {
    const normalCount = devices.filter((d) => d.Status === status).length;
    const customCount = customDevices.filter((d) => d.status === status).length;
    return normalCount + customCount;
  };

  const normalizeType = (value) =>
    String(value || "")
      .toLowerCase()
      .replaceAll("-", " ")
      .replaceAll("_", " ")
      .trim();

  const countByType = (...types) => {
    const normalized = types.map(normalizeType);

    return devices.filter((d) =>
      normalized.includes(normalizeType(d.DeviceType))
    ).length;
  };

  const searchText = (d) =>
    [
      d.DeviceType,
      d.EmployeeName,
      d.EPFNumber,
      d.Department,
      d.DeviceName,
      d.Model,
      d.SerialNumber,
      d.AssetCode,
      d.Location,
      d.IPAddress,
    ]
      .join(" ")
      .toLowerCase();

  const customSearchText = (d) =>
    [d.templateName, d.status, ...Object.values(d.data || {})]
      .join(" ")
      .toLowerCase();

  const suggestions = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return [];

    const normalSuggestions = devices
      .filter((d) => searchText(d).includes(keyword))
      .map((d) => ({ type: "normal", item: d }));

    const customSuggestions = customDevices
      .filter((d) => customSearchText(d).includes(keyword))
      .map((d) => ({ type: "custom", item: d }));

    return [...normalSuggestions, ...customSuggestions].slice(0, 8);
  }, [search, devices, customDevices]);

  const handleSearch = () => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return setResults([]);

    const normalResults = devices
      .filter((d) => searchText(d).includes(keyword))
      .map((d) => ({ type: "normal", item: d }));

    const customResults = customDevices
      .filter((d) => customSearchText(d).includes(keyword))
      .map((d) => ({ type: "custom", item: d }));

    setResults([...normalResults, ...customResults]);
  };

  /* =========================
     SUMMARY CARDS (UNCHANGED + SAFE ADD)
  ========================= */
  const summaryCards = [
    { title: "Employees", value: employees.length },
    { title: "Desktops", value: countByType("Desktop", "Desktops") },
    { title: "Laptops", value: countByType("Laptop", "Laptops") },
    { title: "Tablets", value: countByType("Tablet", "Tablets") },
    { title: "SIM", value: countByType("SIM", "Dongle", "Dongles") },
    { title: "Printers", value: countByType("Printer", "Printers") },
    { title: "Switches", value: countByType("Switch", "Switches") },
    { title: "Servers", value: countByType("Server", "Servers") },
    { title: "UPS", value: countByType("UPS") },
    { title: "Custom Devices", value: customDevices.length },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <h1>IT Device Tracker Dashboard</h1>
        <span>
          {loading ? "Loading..." : `${totalDeviceCount} Devices`}
        </span>
      </div>

      {/* MAIN STATS */}
      <div className="dashboard-grid">
        <div className="dashboard-card">
          Total: {totalDeviceCount}
        </div>
        <div className="dashboard-card green">
          Available: {countByStatus("Available")}
        </div>
        <div className="dashboard-card blue">
          Assigned: {countByStatus("Assigned")}
        </div>
        <div className="dashboard-card red">
          Missing: {countByStatus("Missing")}
        </div>
      </div>

      {/* 🔥 NEW LIFECYCLE SECTION */}
      <div className="dashboard-grid">
        <div className="dashboard-card yellow">
          Near Expiry: {lifecycle.near}
        </div>
        <div className="dashboard-card orange">
          Urgent: {lifecycle.urgent}
        </div>
        <div className="dashboard-card gray">
          Disposed: {lifecycle.disposed}
        </div>
      </div>

      {/* SEARCH */}
      <div className="search-card">
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setResults([]);
          }}
          placeholder="Search devices..."
        />
        <button onClick={handleSearch}>Search</button>
      </div>

      {/* RESULTS */}
      {results.length > 0 && (
        <table className="device-table">
          <tbody>
            {results.map((r, i) => (
              <tr key={i}>
                <td>{r.type}</td>
                <td>{r.item.DeviceType || r.item.templateName}</td>
                <td>{r.item.EmployeeName || "-"}</td>
                <td>{r.item.Status || r.item.status || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Dashboard;