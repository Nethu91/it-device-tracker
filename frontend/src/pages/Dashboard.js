import React, { useEffect, useState } from "react";
import axios from "axios";

function Dashboard() {
  const [devices, setDevices] = useState([]);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);

  const loadDevices = async () => {
    const res = await axios.get("https://it-device-tracker.onrender.com/api/devices");
    setDevices(res.data);
  };

  useEffect(() => {
    loadDevices();
  }, []);

  const handleSearch = async () => {
    if (search.trim() === "") {
      setResults([]);
      return;
    }

    const res = await axios.get(
      `https://it-device-tracker.onrender.com/api/devices/search/${search}`
    );

    setResults(res.data);
  };

  const countByStatus = (status) =>
    devices.filter((d) => d.Status === status).length;

  return (
    <div className="page">
      <div className="page-header">
        <h1>IT Device Tracker Dashboard</h1>
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
      </div>

      <div className="search-card">
        <h2>Search Devices</h2>

        <div className="search-box">
          <input
            type="text"
            placeholder="Search by EPF Number, Employee Name, Serial Number, Asset Code"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <button onClick={handleSearch}>Search</button>
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
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {results.map((d) => (
                <tr key={d._id}>
                  <td>{d.DeviceType}</td>
                  <td>{d.EmployeeName}</td>
                  <td>{d.EPFNumber}</td>
                  <td>{d.DeviceName}</td>
                  <td>{d.Model}</td>
                  <td>{d.SerialNumber}</td>
                  <td>{d.AssetCode}</td>
                  <td>{d.Location}</td>
                  <td>{d.IPAddress}</td>
                  <td>{d.SIMNumber}</td>
                  <td>{d.Status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {search && results.length === 0 && (
        <div className="table-card no-data">No matching devices found</div>
      )}
    </div>
  );
}

export default Dashboard;