import React, { useEffect, useState } from "react";
import axios from "axios";

const API = "https://it-device-tracker.onrender.com/api/devices";

function DevicePage({ title, deviceType }) {

  const emptyForm = {
    DeviceType: deviceType,
    EmployeeName: "",
    EPFNumber: "",
    DeviceName: "",
    Model: "",
    SerialNumber: "",
    AssetCode: "",
    Location: "",
    IPAddress: "",
    SIMNumber: "",
    Status: "Available",
    PurchaseDate: "",
    HandoverDate: "",
    Notes: "",
  };

  const [devices, setDevices] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);

  // USER
  const user = JSON.parse(localStorage.getItem("user"));
  const isAdmin = user?.role === "admin";

  // LOAD DEVICES
  const loadDevices = async () => {
    try {

      const res = await axios.get(
        `${API}/type/${deviceType}`
      );

      setDevices(res.data);

    } catch (err) {
      console.error("Load error:", err);
    }
  };

  useEffect(() => {

    setForm(emptyForm);
    setEditId(null);

    loadDevices();

 // eslint-disable-next-line react-hooks/exhaustive-deps
}, [deviceType]);

  // FORM CHANGE
  const handleChange = (e) => {

    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });

  };

  // SAVE
  const saveDevice = async (e) => {

    e.preventDefault();

    try {

      if (editId) {

        await axios.put(
          `${API}/${editId}`,
          form
        );

      } else {

        await axios.post(API, form);

      }

      setForm(emptyForm);
      setEditId(null);

      loadDevices();

    } catch (err) {

      console.error("Save error:", err);

      alert(
        "Save failed. Check backend terminal."
      );
    }
  };

  // EDIT
  const editDevice = (d) => {

    setEditId(d._id);

    setForm({
      DeviceType: deviceType,
      EmployeeName: d.EmployeeName || "",
      EPFNumber: d.EPFNumber || "",
      DeviceName: d.DeviceName || "",
      Model: d.Model || "",
      SerialNumber: d.SerialNumber || "",
      AssetCode: d.AssetCode || "",
      Location: d.Location || "",
      IPAddress: d.IPAddress || "",
      SIMNumber: d.SIMNumber || "",
      Status: d.Status || "Available",

      PurchaseDate:
        d.PurchaseDate
          ? d.PurchaseDate.slice(0, 10)
          : "",

      HandoverDate:
        d.HandoverDate
          ? d.HandoverDate.slice(0, 10)
          : "",

      Notes: d.Notes || "",
    });
  };

  // DELETE
  const deleteDevice = async (id) => {

    if (
      !window.confirm(
        "Are you sure you want to delete this device?"
      )
    ) {
      return;
    }

    try {

      await axios.delete(`${API}/${id}`);

      loadDevices();

    } catch (err) {

      console.error("Delete error:", err);

    }
  };

  return (
    <div className="page">

      {/* HEADER */}

      <div className="page-header">

        <h1>{title}</h1>

        <span>
          {devices.length} Devices
        </span>

      </div>

      {/* ADMIN FORM */}

      {isAdmin && (

        <form
          className="device-form pro-card"
          onSubmit={saveDevice}
        >

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

          <input
            name="DeviceName"
            placeholder="Device Name"
            value={form.DeviceName}
            onChange={handleChange}
          />

          <input
            name="Model"
            placeholder="Model"
            value={form.Model}
            onChange={handleChange}
          />

          <input
            name="SerialNumber"
            placeholder="Serial Number"
            value={form.SerialNumber}
            onChange={handleChange}
          />

          <input
            name="AssetCode"
            placeholder="Asset Code"
            value={form.AssetCode}
            onChange={handleChange}
          />

          <select
            name="Location"
            value={form.Location}
            onChange={handleChange}
          >

            <option value="">
              Select Location
            </option>

            <option>
              Head Office
            </option>

            <option>
              Factory
            </option>

            <option>
              IT Department
            </option>

            <option>
              Finance
            </option>

            <option>
              HR
            </option>

            <option>
              Stores
            </option>

            <option>
              Other
            </option>

          </select>

          <input
            name="IPAddress"
            placeholder="IP Address"
            value={form.IPAddress}
            onChange={handleChange}
          />

          <input
            name="SIMNumber"
            placeholder="SIM Number"
            value={form.SIMNumber}
            onChange={handleChange}
          />

          <select
            name="Status"
            value={form.Status}
            onChange={handleChange}
          >

            <option>
              Available
            </option>

            <option>
              Assigned
            </option>

            <option>
              In Repair
            </option>

            <option>
              Retired
            </option>

            <option>
              Missing
            </option>

          </select>

          <input
            type="date"
            name="PurchaseDate"
            value={form.PurchaseDate}
            onChange={handleChange}
          />

          <input
            type="date"
            name="HandoverDate"
            value={form.HandoverDate}
            onChange={handleChange}
          />

          <textarea
            name="Notes"
            placeholder="Notes"
            value={form.Notes}
            onChange={handleChange}
          ></textarea>

          <div className="form-actions">

            <button
              className="btn-save"
              type="submit"
            >
              {editId
                ? `Update ${title}`
                : `Add ${title}`}
            </button>

            {editId && (

              <button
                className="btn-cancel"
                type="button"
                onClick={() => {

                  setEditId(null);

                  setForm(emptyForm);

                }}
              >
                Cancel
              </button>

            )}

          </div>

        </form>

      )}

      {/* TABLE */}

      <div className="table-card">

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

              <th>Purchase</th>

              <th>Handover</th>

              <th>Notes</th>

              {isAdmin && (
                <th>Action</th>
              )}

            </tr>

          </thead>

          <tbody>

            {devices.map((d) => (

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

                <td>

                  <span
                    className={`badge ${(d.Status || "Available")
                      .replaceAll(" ", "-")
                      .toLowerCase()}`}
                  >
                    {d.Status}
                  </span>

                </td>

                <td>
                  {d.PurchaseDate
                    ? d.PurchaseDate.slice(0, 10)
                    : ""}
                </td>

                <td>
                  {d.HandoverDate
                    ? d.HandoverDate.slice(0, 10)
                    : ""}
                </td>

                <td>{d.Notes}</td>

                {isAdmin && (

                  <td>

                    <button
                      className="btn-edit"
                      onClick={() => editDevice(d)}
                    >
                      Edit
                    </button>

                    <button
                      className="btn-delete"
                      onClick={() => deleteDevice(d._id)}
                    >
                      Delete
                    </button>

                  </td>

                )}

              </tr>

            ))}

            {devices.length === 0 && (

              <tr>

                <td
                  colSpan={
                    isAdmin ? 15 : 14
                  }
                  className="no-data"
                >
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