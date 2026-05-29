import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";

const API_URL = "https://it-device-tracker.onrender.com/api";

function Dashboard() {
  const [devices, setDevices] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);

  const loadDashboardData = async () => {
    try {
      const deviceRes = await axios.get(`${API_URL}/devices`);
      setDevices(deviceRes.data || []);

      try {
        const empRes = await axios.get(`${API_URL}/employees`);
        setEmployees(empRes.data || []);
      } catch {
        setEmployees([]);
      }
    } catch (err) {
      console.error("Dashboard load error:", err);
    }
  };

  useEffect(() => {
  loadDashboardData();

  const interval = setInterval(() => {
    loadDashboardData();
  }, 10000); // every 10 seconds

  return () => clearInterval(interval);
}, []);

  const countByStatus = (status) =>
    devices.filter((d) => d.Status === status).length;

  const normalizeType = (value) =>
  String(value || "")
    .toLowerCase()
    .replaceAll("-", " ")
    .replaceAll("_", " ")
    .replace(/\s+/g, " ")
    .trim();

const countByType = (...types) => {
  const normalizedTypes = types.map(normalizeType);

  return devices.filter((d) =>
    normalizedTypes.includes(normalizeType(d.DeviceType))
  ).length;
};

  const suggestions = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return [];

    return devices
      .filter((d) =>
        [
          d.DeviceType,
          d.EmployeeName,
          d.EPFNumber,
          d.DeviceName,
          d.Model,
          d.SerialNumber,
          d.AssetCode,
          d.Location,
          d.IPAddress,
          d.SIMNumber,
          d.PONumber,
          d.CurrentUser,
          d.TonerModel,
          d.AccessPointBrand,
          d.AccessPointModel,
          d.ExactLocation,
          d.PowerAppSID,
          d.NewIPAfterVLAN,
        ]
          .join(" ")
          .toLowerCase()
          .includes(keyword)
      )
      .slice(0, 8);
  }, [search, devices]);

  const handleSearch = () => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) {
      setResults([]);
      return;
    }

    const filtered = devices.filter((d) =>
      [
        d.DeviceType,
        d.EmployeeName,
        d.EPFNumber,
        d.DeviceName,
        d.Model,
        d.SerialNumber,
        d.AssetCode,
        d.Location,
        d.IPAddress,
        d.SIMNumber,
        d.PONumber,
        d.CurrentUser,
        d.TonerModel,
        d.AccessPointBrand,
        d.AccessPointModel,
        d.ExactLocation,
        d.PowerAppSID,
        d.NewIPAfterVLAN,
      ]
        .join(" ")
        .toLowerCase()
        .includes(keyword)
    );

    setResults(filtered);
  };

  const selectSuggestion = (device) => {
    setSearch(
      `${device.DeviceType || ""} ${device.EmployeeName || ""} ${
        device.AssetCode || ""
      } ${device.SerialNumber || ""}`.trim()
    );
    setResults([device]);
  };

  const summaryCards = [
  { title: "Employees", value: employees.length },
  { title: "Desktops", value: countByType("Desktop", "Desktops") },
  { title: "Laptops", value: countByType("Laptop", "Laptops") },
  { title: "Tablets", value: countByType("Tablet", "Tablets") },
  { title: "SIM", value: countByType("SIM", "Dongle", "Dongles") },
  { title: "Printers", value: countByType("Printer", "Printers") },
  { title: "Switches", value: countByType("Switch", "Switches") },
  { title: "Servers", value: countByType("Server", "Servers") },
  { title: "Projectors", value: countByType("Projector", "Projectors") },
  { title: "Wireless AP", value: countByType("Wireless AP", "Wireless_AP", "WirelessAP") },
  { title: "UPS", value: countByType("UPS") },
  { title: "Smart Boards", value: countByType("Smart Board", "Smart Boards") },
  { title: "Portable Trackers", value: countByType("Portable Tracker", "Portable Trackers") },
  { title: "Fingerprint Machines", value: countByType("Fingerprint Machine", "Fingerprint Machines") },
];

  return (
    <div className="page">
      <div className="page-header">
        <h1>IT Device Tracker Dashboard</h1>
        <span className="device-count">{devices.length} Total Devices</span>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <h3>Total Devices</h3>
          <h1>{devices.length}</h1>
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

      <div className="search-card">
        <h2>Search Devices</h2>

        <div className="search-wrapper">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search by EPF, Employee Name, Serial Number, Asset Code, PO Number"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setResults([]);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearch();
              }}
            />

            <button onClick={handleSearch}>Search</button>
          </div>

          {search && suggestions.length > 0 && results.length === 0 && (
            <div className="search-dropdown">
              {suggestions.map((d) => (
                <div
                  className="search-item"
                  key={d._id}
                  onClick={() => selectSuggestion(d)}
                >
                  <strong>{d.DeviceType}</strong> | {d.EmployeeName || "No User"} |{" "}
                  {d.AssetCode || "No Asset"} | {d.SerialNumber || "No Serial"}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="summary-section">
  <div className="section-title-row">
    <h2>Inventory Summary</h2>
    <span>Live updated device category overview</span>
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

      {results.length > 0 && (
        <div className="table-card">
          <h2>Search Results</h2>

          <table className="device-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Employee</th>
                <th>EPF</th>
                <th>Device</th>
                <th>Model</th>
                <th>Serial</th>
                <th>Asset</th>
                <th>Location</th>
                <th>IP</th>
                <th>SIM</th>
                <th>PO</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {results.map((d) => (
                <tr key={d._id}>
                  <td>{d.DeviceType}</td>
                  <td>{d.EmployeeName || "-"}</td>
                  <td>{d.EPFNumber || "-"}</td>
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
              ))}
            </tbody>
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