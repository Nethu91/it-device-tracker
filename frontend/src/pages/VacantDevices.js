import React, { useEffect, useState } from "react";
import axios from "axios";
import * as XLSX from "xlsx";

const BASE_API =
  window.location.hostname === "localhost"
    ? "http://localhost:5000/api"
    : "https://it-device-tracker.onrender.com/api";

function VacantDevices() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch]   = useState("");
  const [error, setError]     = useState("");

  const getHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });

  // ✅ Vacant devices = released devices (releasedAt තියෙන, currently unassigned)
  const loadVacantDevices = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`${BASE_API}/devices`, getHeaders());
      const all = Array.isArray(res.data) ? res.data : [];

      const vacant = all.filter(
        (d) =>
          d.releasedAt &&
          (!d.EmployeeName || d.EmployeeName === "") &&
          d.isDisposed !== true
      );

      // Most recently released first
      vacant.sort((a, b) => new Date(b.releasedAt) - new Date(a.releasedAt));

      setDevices(vacant);
    } catch (err) {
      setError("Failed to load vacant devices");
      setDevices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVacantDevices();
  }, []);

  const filtered = devices.filter((d) => {
    const keyword = search.toLowerCase();
    return [
      d.DeviceType, d.releasedFromEmployee, d.releasedFromEPF,
      d.Department, d.DeviceName, d.Model, d.SerialNumber,
      d.AssetCode, d.Location, d.PONumber, d.Vendor,
    ].join(" ").toLowerCase().includes(keyword);
  });

  const exportExcel = () => {
    const data = filtered.map((d, i) => ({
      No:                i + 1,
      DeviceType:        d.DeviceType        || "",
      Model:             d.Model             || "",
      SerialNumber:      d.SerialNumber      || "",
      AssetCode:         d.AssetCode         || "",
      Department:        d.Department        || "",
      Location:          d.Location          || "",
      PONumber:          d.PONumber          || "",
      Vendor:            d.Vendor            || "",
      Status:            d.Status            || "",
      PreviouslyAssignedTo: d.releasedFromEmployee || "",
      PreviousEPF:       d.releasedFromEPF   || "",
      ReleasedDate:      d.releasedAt        ? new Date(d.releasedAt).toLocaleDateString() : "",
      PurchaseDate:      d.PurchaseDate      ? d.PurchaseDate.slice(0, 10) : "",
      WarrantyPeriod:    d.WarrantyPeriod    || "",
      Notes:             d.Notes             || "",
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Vacant Devices");
    XLSX.writeFile(wb, "Vacant_Devices_Report.xlsx");
  };

  return (
    <div className="device-page">
      <div className="page-header">
        <h1>Vacant Devices</h1>
        <span className="device-count">{filtered.length} Devices</span>
      </div>

      <p style={{ color: "#6b7280", marginBottom: "16px", fontSize: "14px" }}>
        Devices automatically freed when employees were marked <strong>Inactive</strong> (left the company).
        These devices are now <strong>Available</strong> for reassignment.
      </p>

      {error && (
        <div style={{
          background: "#fee2e2", border: "1px solid #fca5a5", color: "#991b1b",
          padding: "12px 16px", borderRadius: "8px", marginBottom: "16px",
          fontWeight: 500, display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <span>⚠️ {error}</span>
          <button onClick={() => setError("")}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: "18px", color: "#991b1b" }}>✕</button>
        </div>
      )}

      <div className="pro-card">
        <div className="search-box">
          <input
            placeholder="Search by device type, previous employee, serial, asset..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="button" onClick={loadVacantDevices}>Refresh</button>
          <button type="button" onClick={exportExcel}>Download Excel</button>
        </div>
      </div>

      <div className="table-card">
        {loading ? (
          <div style={{ padding: "32px", textAlign: "center", color: "#6b7280" }}>Loading...</div>
        ) : (
          <table className="device-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Device Type</th>
                <th>Model</th>
                <th>Serial</th>
                <th>Asset</th>
                <th>Department</th>
                <th>Location</th>
                <th>Status</th>
                <th>Previously Assigned To</th>
                <th>Previous EPF</th>
                <th>Released Date</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d, i) => (
                <tr key={d._id} style={{ background: "#f0fdf4", borderLeft: "3px solid #22c55e" }}>
                  <td>{i + 1}</td>
                  <td>{d.DeviceType || "-"}</td>
                  <td>{d.Model || "-"}</td>
                  <td>{d.SerialNumber || "-"}</td>
                  <td>{d.AssetCode || "-"}</td>
                  <td>{d.Department || "-"}</td>
                  <td>{d.Location || "-"}</td>
                  <td>
                    <span className={`badge ${(d.Status || "Available").toLowerCase()}`}>{d.Status}</span>
                  </td>
                  <td>{d.releasedFromEmployee || "-"}</td>
                  <td>{d.releasedFromEPF || "-"}</td>
                  <td>{d.releasedAt ? new Date(d.releasedAt).toLocaleDateString() : "-"}</td>
                  <td>{d.Notes || "-"}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={12} className="no-data">No vacant devices found</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default VacantDevices;