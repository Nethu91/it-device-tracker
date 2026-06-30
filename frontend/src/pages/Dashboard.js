import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";

const BASE_API =
  window.location.hostname === "localhost"
    ? "http://localhost:5000/api"
    : "https://it-device-tracker.onrender.com/api";

const DEVICE_API      = `${BASE_API}/devices`;
const EMPLOYEE_API    = `${BASE_API}/employees`;
const CUSTOM_DEVICE_API = `${BASE_API}/custom-devices`;

function Dashboard() {
  const storedUser = JSON.parse(localStorage.getItem("user") || "null");
  const isAdmin    = String(storedUser?.role || "").toLowerCase() === "admin";

  const [devices, setDevices]           = useState([]);
  const [employees, setEmployees]       = useState([]);
  const [customDevices, setCustomDevices] = useState([]);
  const [search, setSearch]             = useState("");
  const [results, setResults]           = useState([]);
  const [loading, setLoading]           = useState(false);

  const getAuthHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });

  const normalizeArray = (data, key) => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.[key])) return data[key];
    if (Array.isArray(data?.data)) return data.data;
    return [];
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      const [deviceRes, empRes, customRes] = await Promise.all([
        axios.get(DEVICE_API, getAuthHeaders()),
        axios.get(EMPLOYEE_API, getAuthHeaders()),
        axios.get(CUSTOM_DEVICE_API, getAuthHeaders()).catch(() => ({ data: [] })),
      ]);

      const deviceData     = normalizeArray(deviceRes.data, "devices");
      const employeeData   = normalizeArray(empRes.data, "employees");
      const customDeviceData = normalizeArray(customRes.data, "customDevices");

      setDevices(deviceData);
      setEmployees(employeeData);

      // ✅ User ට own custom devices පමණයි — Admin ට සියල්ල
      if (isAdmin) {
        setCustomDevices(customDeviceData);
      } else {
        const userId = storedUser?._id || storedUser?.id || "";
        const ownCustom = customDeviceData.filter(
          (d) => String(d.createdBy || "") === String(userId)
        );
        setCustomDevices(ownCustom);
      }

    } catch (err) {
      console.error("Dashboard load error:", err.response?.data || err.message);
      setDevices([]);
      setEmployees([]);
      setCustomDevices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();

    const handleFocus = () => loadDashboardData();
    const handleVisibilityChange = () => { if (!document.hidden) loadDashboardData(); };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    const interval = setInterval(() => loadDashboardData(), 10000);

    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Counts ── */
  const totalDeviceCount = devices.length + customDevices.length;

  const countByStatus = (status) => {
    const normalCount = devices.filter((d) => d.Status === status).length;
    const customCount = customDevices.filter((d) => d.status === status).length;
    return normalCount + customCount;
  };

  const normalizeType = (value) =>
    String(value || "").toLowerCase().replaceAll("-", " ").replaceAll("_", " ").replace(/\s+/g, " ").trim();

  const countByType = (...types) => {
    const normalizedTypes = types.map(normalizeType);
    return devices.filter((d) => normalizedTypes.includes(normalizeType(d.DeviceType))).length;
  };

  /* ── Search text builders ── */
  const searchText = (d) =>
    [
      d.DeviceType, d.EmployeeName, d.EPFNumber, d.Department, d.Designation,
      d.DeviceName, d.Model, d.SerialNumber, d.AssetCode, d.Location,
      d.IPAddress, d.SIMNumber, d.PONumber, d.Vendor, d.InvoiceNumber,
      d.CurrentUser, d.TonerModel, d.ExactLocation, d.ITReferenceNumber,
      d.CurrentLocation, d.ProjectorVendor, d.AccessPointBrand,
      d.AccessPointModel, d.WirelessVendor, d.WirelessUsername,
      d.PowerAppSID, d.NewIPAfterVLAN, d.PortableTracking,
      d.PortableTrackingNumber, d.PortableTrackingSIMNumber,
    ].join(" ").toLowerCase();

  const customSearchText = (d) =>
    [d.templateName, d.status, ...Object.values(d.data || {})].join(" ").toLowerCase();

  /* ── Suggestions ── */
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, devices, customDevices]);

  const handleSearch = () => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) { setResults([]); return; }

    const normalResults = devices
      .filter((d) => searchText(d).includes(keyword))
      .map((d) => ({ type: "normal", item: d }));

    const customResults = customDevices
      .filter((d) => customSearchText(d).includes(keyword))
      .map((d) => ({ type: "custom", item: d }));

    setResults([...normalResults, ...customResults]);
  };

  const selectSuggestion = (result) => {
    if (result.type === "normal") {
      const d = result.item;
      setSearch(`${d.DeviceType || ""} ${d.EmployeeName || ""} ${d.AssetCode || ""} ${d.SerialNumber || ""}`.trim());
    } else {
      const d = result.item;
      setSearch(`${d.templateName || ""} ${d.status || ""}`);
    }
    setResults([result]);
  };

  /* ── Summary cards — Admin vs User ── */
  const adminSummaryCards = [
    { title: "Employees",            value: employees.length },
    { title: "Desktops",             value: countByType("Desktop", "Desktops") },
    { title: "Laptops",              value: countByType("Laptop", "Laptops") },
    { title: "Tablets",              value: countByType("Tablet", "Tablets") },
    { title: "SIM",                  value: countByType("SIM", "Dongle", "Dongles") },
    { title: "Printers",             value: countByType("Printer", "Printers") },
    { title: "Switches",             value: countByType("Switch", "Switches") },
    { title: "Servers",              value: countByType("Server", "Servers") },
    { title: "Projectors",           value: countByType("Projector", "Projectors") },
    { title: "Wireless AP",          value: countByType("Wireless AP", "Wireless_AP", "WirelessAP") },
    { title: "UPS",                  value: countByType("UPS") },
    { title: "Smart Boards",         value: countByType("Smart Board", "Smart Boards") },
    { title: "Portable Trackers",    value: countByType("Portable Tracker", "Portable Trackers") },
    { title: "Fingerprint Machines", value: countByType("Fingerprint Machine", "Fingerprint Machines") },
    { title: "Custom Devices",       value: customDevices.length },
  ];

  // ✅ User ට same categories — own devices count පමණයි
  const userSummaryCards = [
    { title: "Desktops",             value: countByType("Desktop", "Desktops") },
    { title: "Laptops",              value: countByType("Laptop", "Laptops") },
    { title: "Tablets",              value: countByType("Tablet", "Tablets") },
    { title: "SIM",                  value: countByType("SIM", "Dongle", "Dongles") },
    { title: "Printers",             value: countByType("Printer", "Printers") },
    { title: "Switches",             value: countByType("Switch", "Switches") },
    { title: "Servers",              value: countByType("Server", "Servers") },
    { title: "Projectors",           value: countByType("Projector", "Projectors") },
    { title: "Wireless AP",          value: countByType("Wireless AP", "Wireless_AP", "WirelessAP") },
    { title: "UPS",                  value: countByType("UPS") },
    { title: "Smart Boards",         value: countByType("Smart Board", "Smart Boards") },
    { title: "Portable Trackers",    value: countByType("Portable Tracker", "Portable Trackers") },
    { title: "Fingerprint Machines", value: countByType("Fingerprint Machine", "Fingerprint Machines") },
    { title: "Custom Devices",       value: customDevices.length },
  ];

  const summaryCards = isAdmin ? adminSummaryCards : userSummaryCards;

  /* ── Search result row renderer ── */
  const renderResultRow = (result) => {
    if (result.type === "custom") {
      const d = result.item;
      const dataValues = Object.values(d.data || {}).join(" | ");
      return (
        <tr key={d._id}>
          <td>{d.templateName || "Custom Device"}</td>
          <td>-</td><td>-</td><td>-</td>
          <td>{dataValues || "-"}</td>
          <td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td>
          <td>{d.status || "-"}</td>
        </tr>
      );
    }

    const d = result.item;
    return (
      <tr key={d._id}>
        <td>{d.DeviceType || "-"}</td>
        <td>{d.EmployeeName || "-"}</td>
        <td>{d.EPFNumber || "-"}</td>
        <td>{d.Department || "-"}</td>
        <td>{d.DeviceName || "-"}</td>
        <td>{d.Model || d.AccessPointModel || d.ServerModel || "-"}</td>
        <td>{d.SerialNumber || "-"}</td>
        <td>{d.AssetCode || "-"}</td>
        <td>{d.Location || d.CurrentLocation || d.ExactLocation || "-"}</td>
        <td>{d.IPAddress || d.NewIPAfterVLAN || "-"}</td>
        <td>{d.SIMNumber || d.PortableTrackingSIMNumber || "-"}</td>
        <td>{d.PONumber || "-"}</td>
        <td>{d.Status || "-"}</td>
      </tr>
    );
  };

  /* ── JSX ── */
  return (
    <div className="page">
      <div className="page-header">
        <h1>IT Device Tracker Dashboard</h1>
        <span className="device-count">
          {loading ? "Loading..." : `${totalDeviceCount} Total Devices`}
        </span>
      </div>

      {/* ── Status cards ── */}
      <div className="dashboard-grid">
        <div className="dashboard-card">
          <h3>Total Devices</h3>
          <h1>{totalDeviceCount}</h1>
        </div>
        <div className="dashboard-card green">
          <h3>Available</h3>
          <h1>{countByStatus("Available")}</h1>
        </div>
        <div className="dashboard-card blue">
          <h3>Assigned</h3>
          <h1>{countByStatus("Assigned")}</h1>
        </div>
        <div className="dashboard-card orange">
          <h3>In Repair</h3>
          <h1>{countByStatus("In Repair")}</h1>
        </div>
        <div className="dashboard-card red">
          <h3>Missing</h3>
          <h1>{countByStatus("Missing")}</h1>
        </div>
      </div>

      {/* ── Search ── */}
      <div className="search-card">
        <h2>Search Devices</h2>
        <div className="search-wrapper">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search by EPF, Employee Name, Serial Number, Asset Code, PO Number, Custom Device"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setResults([]); }}
              onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
            />
            <button type="button" onClick={handleSearch}>Search</button>
          </div>

          {search && suggestions.length > 0 && results.length === 0 && (
            <div className="search-dropdown">
              {suggestions.map((result) => {
                const d = result.item;
                return (
                  <div className="search-item" key={d._id} onClick={() => selectSuggestion(result)}>
                    {result.type === "custom" ? (
                      <><strong>{d.templateName}</strong> | Custom Device | {d.status || "No Status"}</>
                    ) : (
                      <><strong>{d.DeviceType}</strong> | {d.EmployeeName || "No User"} | {d.AssetCode || "No Asset"} | {d.SerialNumber || "No Serial"}</>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Inventory summary ── */}
      <div className="summary-section">
        <div className="section-title-row">
          <h2>Inventory Summary</h2>
          <span>{isAdmin ? "Live updated device category overview" : "Your assigned devices"}</span>
        </div>
        <div className="summary-grid">
          {summaryCards.map((card) => (
            <div className="summary-card-pro" key={card.title}>
              <div className="summary-icon">📦</div>
              <div>
                <p>{card.title}</p>
                <h2>{card.value}</h2>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Search results ── */}
      {results.length > 0 && (
        <div className="table-card">
          <h2>Search Results</h2>
          <table className="device-table">
            <thead>
              <tr>
                <th>Type</th><th>Employee</th><th>EPF</th><th>Department</th>
                <th>Device / Data</th><th>Model</th><th>Serial</th><th>Asset</th>
                <th>Location</th><th>IP</th><th>SIM</th><th>PO</th><th>Status</th>
              </tr>
            </thead>
            <tbody>{results.map((result) => renderResultRow(result))}</tbody>
          </table>
        </div>
      )}

      {search && results.length === 0 && suggestions.length === 0 && (
        <div className="table-card no-data">No matching devices found</div>
      )}
    </div>
  );
}

export default Dashboard;