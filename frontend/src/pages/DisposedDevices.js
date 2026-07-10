import React, { useEffect, useState } from "react";
import axios from "axios";
import * as XLSX from "xlsx";

const BASE_API =
  window.location.hostname === "localhost"
    ? "http://localhost:5000/api"
    : "https://it-device-tracker.onrender.com/api";

function DisposedDevices() {
  const [devices, setDevices] = useState([]); // regular devices
  const [customDevices, setCustomDevices] = useState([]); // custom interface devices
  const [loading, setLoading] = useState(false);
  const [search, setSearch]   = useState("");
  const [error, setError]     = useState("");
  const [customError, setCustomError] = useState("");

  const getHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });

  // ✅ Regular saha custom fetch dekම වෙන වෙනම try-catch — ekක fail unoth
  // anithe eka ewath fail widihata pennanne na, real error eka ewath penenawa
  const loadDisposed = async () => {
    setLoading(true);
    setError("");
    setCustomError("");

    try {
      const res = await axios.get(`${BASE_API}/devices/disposed`, getHeaders());
      setDevices(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Load disposed (standard) error:", err.response?.data || err.message);
      setError(
        `Standard devices: ${err.response?.data?.message || err.message || "Failed to load"}`
      );
      setDevices([]);
    }

    try {
      const res = await axios.get(`${BASE_API}/custom-devices/disposed`, getHeaders());
      setCustomDevices(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Load disposed (custom) error:", err.response?.data || err.message);
      setCustomError(
        `Custom devices: ${err.response?.data?.message || err.message || "Failed to load"} ${
          err.response?.status ? `(HTTP ${err.response.status})` : ""
        }`
      );
      setCustomDevices([]);
    }

    setLoading(false);
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

  const restoreCustomDevice = async (id) => {
    if (!window.confirm("Restore this device?")) return;
    try {
      await axios.post(`${BASE_API}/custom-devices/restore/${id}`, {}, getHeaders());
      await loadDisposed();
    } catch (err) {
      setCustomError(err.response?.data?.message || "Restore failed");
    }
  };

  // ✅ Custom device data object eka "key: value, key: value" widihata summary line ekak widihata hadanawa
  const summarizeCustomData = (device) => {
    const data = device.data || {};
    return Object.entries(data)
      .filter(([, v]) => v !== "" && v !== null && v !== undefined)
      .map(([k, v]) => `${k}: ${v}`)
      .join(", ");
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

  const filteredCustom = customDevices.filter((d) => {
    const keyword = search.toLowerCase();
    return [
      d.templateName, d.disposalReason, summarizeCustomData(d),
    ].join(" ").toLowerCase().includes(keyword);
  });

  const totalCount = filtered.length + filteredCustom.length;

  const exportExcel = () => {
    const regularData = filtered.map((d, i) => ({
      No:             i + 1,
      Source:         "Standard",
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

    const customData = filteredCustom.map((d, i) => ({
      No:             regularData.length + i + 1,
      Source:         "Custom Interface",
      DeviceType:     d.templateName    || "",
      EmployeeName:   "",
      EPFNumber:      "",
      Department:     "",
      DeviceName:     "",
      Model:          "",
      SerialNumber:   "",
      AssetCode:      "",
      Location:       "",
      IPAddress:      "",
      PONumber:       "",
      Vendor:         "",
      PurchaseDate:   "",
      WarrantyPeriod: "",
      DisposalReason: d.disposalReason  || "",
      DisposedAt:     d.disposedAt      ? new Date(d.disposedAt).toLocaleDateString() : "",
      Notes:          summarizeCustomData(d),
    }));

    const ws = XLSX.utils.json_to_sheet([...regularData, ...customData]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Disposed Devices");
    XLSX.writeFile(wb, "Disposed_Devices_Report.xlsx");
  };

  return (
    <div className="device-page">
      <div className="page-header">
        <h1>Disposed Devices</h1>
        <span className="device-count">{totalCount} Devices</span>
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

      {customError && (
        <div style={{
          background: "#fee2e2", border: "1px solid #fca5a5", color: "#991b1b",
          padding: "12px 16px", borderRadius: "8px", marginBottom: "16px",
          fontWeight: 500, display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <span>⚠️ {customError}</span>
          <button onClick={() => setCustomError("")}
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

      {/* ── Standard devices table ── */}
      <div className="table-card">
        <h2>Standard Devices</h2>
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
                  <td colSpan={19} className="no-data">No disposed standard devices found</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Custom interface devices table ── */}
      <div className="table-card">
        <h2>Custom Interface Devices</h2>
        {loading ? (
          <div style={{ padding: "32px", textAlign: "center", color: "#6b7280" }}>Loading...</div>
        ) : (
          <table className="device-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Interface</th>
                <th>Details</th>
                <th>Disposal Reason</th>
                <th>Disposed At</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustom.map((d, i) => (
                <tr key={d._id}>
                  <td>{i + 1}</td>
                  <td>{d.templateName || "-"}</td>
                  <td>{summarizeCustomData(d) || "-"}</td>
                  <td>{d.disposalReason || "-"}</td>
                  <td>{d.disposedAt ? new Date(d.disposedAt).toLocaleDateString() : "-"}</td>
                  <td>
                    <button className="btn-save" onClick={() => restoreCustomDevice(d._id)}>
                      Restore
                    </button>
                  </td>
                </tr>
              ))}
              {filteredCustom.length === 0 && (
                <tr>
                  <td colSpan={6} className="no-data">No disposed custom devices found</td>
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