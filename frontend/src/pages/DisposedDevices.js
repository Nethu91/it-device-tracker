import React, { useEffect, useState } from "react";
import axios from "axios";
import * as XLSX from "xlsx";

const BASE_API =
  window.location.hostname === "localhost"
    ? "http://localhost:5000/api"
    : "https://it-device-tracker.onrender.com/api";

function DisposedDevices() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch]   = useState("");
  const [error, setError]     = useState("");

  const getHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });

  const loadDisposed = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`${BASE_API}/devices/disposed`, getHeaders());
      setDevices(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError("Failed to load disposed devices");
      setDevices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDisposed();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const restoreDevice = async (id) => {
    if (!window.confirm("Restore this device?")) return;
    try {
      await axios.post(`${BASE_API}/devices/restore/${id}`, {}, getHeaders());
      await loadDisposed();
    } catch (err) {
      setError(err.response?.data?.message || "Restore failed");
    }
  };

  const filtered = devices.filter((d) => {
    const keyword = search.toLowerCase();
    return [
      d.DeviceType, d.EmployeeName, d.EPFNumber, d.Department,
      d.DeviceName, d.Model, d.SerialNumber, d.AssetCode,
      d.Location, d.IPAddress, d.PONumber, d.Vendor,
      d.disposalReason, d.Notes,
    ].join(" ").toLowerCase().includes(keyword);
  });

  const exportExcel = () => {
    const data = filtered.map((d, i) => ({
      No:             i + 1,
      DeviceType:     d.DeviceType     || "",
      EmployeeName:   d.EmployeeName   || "",
      EPFNumber:      d.EPFNumber      || "",
      Department:     d.Department     || "",
      DeviceName:     d.DeviceName     || "",
      Model:          d.Model          || "",
      SerialNumber:   d.SerialNumber   || "",
      AssetCode:      d.AssetCode      || "",
      Location:       d.Location       || "",
      IPAddress:      d.IPAddress      || "",
      PONumber:       d.PONumber       || "",
      Vendor:         d.Vendor         || "",
      PurchaseDate:   d.PurchaseDate   ? d.PurchaseDate.slice(0, 10) : "",
      WarrantyPeriod: d.WarrantyPeriod || "",
      DisposalReason: d.disposalReason || "",
      DisposedAt:     d.disposedAt     ? new Date(d.disposedAt).toLocaleDateString() : "",
      Notes:          d.Notes          || "",
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Disposed Devices");
    XLSX.writeFile(wb, "Disposed_Devices_Report.xlsx");
  };

  return (
    <div className="device-page">
      <div className="page-header">
        <h1>Disposed Devices</h1>
        <span className="device-count">{filtered.length} Devices</span>
      </div>

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
            placeholder="Search disposed devices..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
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
                <th>Employee</th>
                <th>EPF</th>
                <th>Department</th>
                <th>Device Name</th>
                <th>Model</th>
                <th>Serial</th>
                <th>Asset</th>
                <th>Location</th>
                <th>IP</th>
                <th>PO Number</th>
                <th>Vendor</th>
                <th>Purchase Date</th>
                <th>Warranty</th>
                <th>Disposal Reason</th>
                <th>Disposed At</th>
                <th>Notes</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d, i) => (
                <tr key={d._id}>
                  <td>{i + 1}</td>
                  <td>{d.DeviceType || "-"}</td>
                  <td>{d.EmployeeName || "-"}</td>
                  <td>{d.EPFNumber || "-"}</td>
                  <td>{d.Department || "-"}</td>
                  <td>{d.DeviceName || "-"}</td>
                  <td>{d.Model || "-"}</td>
                  <td>{d.SerialNumber || "-"}</td>
                  <td>{d.AssetCode || "-"}</td>
                  <td>{d.Location || "-"}</td>
                  <td>{d.IPAddress || "-"}</td>
                  <td>{d.PONumber || "-"}</td>
                  <td>{d.Vendor || "-"}</td>
                  <td>{d.PurchaseDate ? d.PurchaseDate.slice(0, 10) : "-"}</td>
                  <td>{d.WarrantyPeriod || "-"}</td>
                  <td>{d.disposalReason || "-"}</td>
                  <td>{d.disposedAt ? new Date(d.disposedAt).toLocaleDateString() : "-"}</td>
                  <td>{d.Notes || "-"}</td>
                  <td>
                    <button className="btn-save" onClick={() => restoreDevice(d._id)}>
                      Restore
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={19} className="no-data">No disposed devices found</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default DisposedDevices;