import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import * as XLSX from "xlsx";

const BASE_API =
  window.location.hostname === "localhost"
    ? "http://localhost:5000/api"
    : "https://it-device-tracker.onrender.com/api";

function CustomDevicePage() {
  const storedUser = JSON.parse(localStorage.getItem("user"));
  const isAdmin = String(storedUser?.role || "").toLowerCase() === "admin";

  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [formData, setFormData] = useState({});
  const [status, setStatus] = useState("Available");
  const [devices, setDevices] = useState([]);
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState("");

  const getHeaders = () => ({
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });

  const loadTemplates = async () => {
    try {
      const res = await axios.get(`${BASE_API}/device-templates`, getHeaders());
      const data = Array.isArray(res.data) ? res.data : [];

      setTemplates(data);

      if (selectedTemplateId) {
        const current = data.find((t) => t._id === selectedTemplateId);
        setSelectedTemplate(current || null);
      }
    } catch (err) {
      console.error("Load templates error:", err.response?.data || err.message);
      setTemplates([]);
    }
  };

  const loadDevices = async (templateId) => {
    if (!templateId) return;

    try {
      const res = await axios.get(
        `${BASE_API}/custom-devices/template/${templateId}`,
        getHeaders()
      );

      setDevices(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(
        "Load custom devices error:",
        err.response?.data || err.message
      );
      setDevices([]);
    }
  };

  useEffect(() => {
    loadTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const buildEmptyForm = (template) => {
    const initialData = {};

    template?.fields?.forEach((field) => {
      initialData[field.name] = "";
    });

    return initialData;
  };

  const selectTemplate = async (id) => {
    setSelectedTemplateId(id);

    const template = templates.find((t) => t._id === id);
    setSelectedTemplate(template || null);

    setFormData(buildEmptyForm(template));
    setStatus("Available");
    setEditId(null);
    setSearch("");

    await loadDevices(id);
  };

  const handleChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setFormData(buildEmptyForm(selectedTemplate));
    setStatus("Available");
    setEditId(null);
  };

  const saveCustomDevice = async (e) => {
    e.preventDefault();

    if (!selectedTemplateId) {
      alert("Please select an interface");
      return;
    }

    try {
      const payload = {
        templateId: selectedTemplateId,
        data: formData,
        status,
      };

      if (editId) {
        if (!isAdmin) {
          alert("Only admins can update custom device records");
          return;
        }

        await axios.put(
          `${BASE_API}/custom-devices/${editId}`,
          payload,
          getHeaders()
        );

        alert("Custom device updated successfully");
      } else {
        await axios.post(`${BASE_API}/custom-devices`, payload, getHeaders());

        alert("Custom device saved successfully");
      }

      resetForm();
      await loadDevices(selectedTemplateId);
    } catch (err) {
      console.error(
        "Custom device save error:",
        err.response?.data || err.message
      );
      alert(err.response?.data?.message || "Failed to save custom device");
    }
  };

  const editCustomDevice = (device) => {
    if (!isAdmin) {
      alert("Only admins can edit custom device records");
      return;
    }

    setEditId(device._id);
    setFormData(device.data || {});
    setStatus(device.status || "Available");

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteCustomDevice = async (id) => {
    if (!isAdmin) {
      alert("Only admins can delete custom device records");
      return;
    }

    if (!window.confirm("Delete this custom device record?")) return;

    try {
      await axios.delete(`${BASE_API}/custom-devices/${id}`, getHeaders());

      alert("Custom device deleted successfully");
      await loadDevices(selectedTemplateId);
    } catch (err) {
      console.error(
        "Delete custom device error:",
        err.response?.data || err.message
      );
      alert(err.response?.data?.message || "Failed to delete custom device");
    }
  };

  const deleteInterface = async () => {
    if (!isAdmin) {
      alert("Only admins can delete interfaces");
      return;
    }

    if (!selectedTemplateId) {
      alert("Please select an interface first");
      return;
    }

    if (
      !window.confirm(
        `Are you sure you want to remove "${selectedTemplate?.name}" interface?`
      )
    ) {
      return;
    }

    try {
      await axios.delete(
        `${BASE_API}/device-templates/${selectedTemplateId}`,
        getHeaders()
      );

      alert("Interface removed successfully");

      setSelectedTemplateId("");
      setSelectedTemplate(null);
      setDevices([]);
      setFormData({});
      setSearch("");
      await loadTemplates();
    } catch (err) {
      console.error(
        "Delete interface error:",
        err.response?.data || err.message
      );
      alert(err.response?.data?.message || "Failed to remove interface");
    }
  };

  const filteredDevices = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return devices;

    return devices.filter((device) =>
      [device.templateName, device.status, ...Object.values(device.data || {})]
        .join(" ")
        .toLowerCase()
        .includes(keyword)
    );
  }, [search, devices]);

  const downloadExcel = () => {
    if (!isAdmin) {
      alert("Only admins can download Excel reports");
      return;
    }

    if (!selectedTemplate) {
      alert("Please select an interface");
      return;
    }

    const exportData = filteredDevices.map((device, index) => {
      const row = {
        No: index + 1,
        Interface: selectedTemplate.name,
      };

      selectedTemplate.fields.forEach((field) => {
        row[field.label] = device.data?.[field.name] || "";
      });

      row.Status = device.status || "";
      row.CreatedAt = device.createdAt
        ? new Date(device.createdAt).toLocaleString()
        : "";

      return row;
    });

    if (exportData.length === 0) {
      alert("No data to export");
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, selectedTemplate.name);
    XLSX.writeFile(workbook, `${selectedTemplate.name}_Data.xlsx`);
  };

  const renderField = (field) => {
    if (field.type === "textarea") {
      return (
        <textarea
          key={field.name}
          placeholder={field.label}
          value={formData[field.name] || ""}
          onChange={(e) => handleChange(field.name, e.target.value)}
          required={field.required}
        />
      );
    }

    if (field.type === "select") {
      return (
        <select
          key={field.name}
          value={formData[field.name] || ""}
          onChange={(e) => handleChange(field.name, e.target.value)}
          required={field.required}
        >
          <option value="">{field.label}</option>

          {(field.options || []).map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      );
    }

    return (
      <input
        key={field.name}
        type={field.type}
        placeholder={field.label}
        value={formData[field.name] || ""}
        onChange={(e) => handleChange(field.name, e.target.value)}
        required={field.required}
      />
    );
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Custom Device Interfaces</h1>
        <span className="device-count">{templates.length} Interfaces</span>
      </div>

      <div className="pro-card">
        <h2>Select Interface</h2>

        <div className="search-box">
          <select
            value={selectedTemplateId}
            onChange={(e) => selectTemplate(e.target.value)}
          >
            <option value="">Select custom device interface</option>

            {templates.map((template) => (
              <option key={template._id} value={template._id}>
                {template.name}
              </option>
            ))}
          </select>

          {selectedTemplate && isAdmin && (
            <button
              type="button"
              className="btn-delete"
              onClick={deleteInterface}
            >
              Delete Interface
            </button>
          )}
        </div>
      </div>

      {selectedTemplate && (
        <form className="device-form pro-card" onSubmit={saveCustomDevice}>
          <h2>
            {editId ? "Update" : "Add"} {selectedTemplate.name}
          </h2>

          {selectedTemplate.fields.map((field) => renderField(field))}

          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option>Available</option>
            <option>Assigned</option>
            <option>In Repair</option>
            <option>Retired</option>
            <option>Missing</option>
          </select>

          <button className="btn-save" type="submit">
            {editId
              ? `Update ${selectedTemplate.name}`
              : `Save ${selectedTemplate.name}`}
          </button>

          {editId && isAdmin && (
            <button type="button" className="btn-delete" onClick={resetForm}>
              Cancel Edit
            </button>
          )}
        </form>
      )}

      {selectedTemplate && (
        <div className="pro-card">
          <div className="search-box">
            <input
              placeholder={`Search ${selectedTemplate.name} data`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            {isAdmin && (
              <button type="button" onClick={downloadExcel}>
                Download Excel
              </button>
            )}
          </div>
        </div>
      )}

      {selectedTemplate && (
        <div className="table-card">
          <h2>{selectedTemplate.name} Data</h2>

          <table className="device-table">
            <thead>
              <tr>
                <th>#</th>

                {selectedTemplate.fields.map((field) => (
                  <th key={field.name}>{field.label}</th>
                ))}

                <th>Status</th>

                {isAdmin && <th>Action</th>}
              </tr>
            </thead>

            <tbody>
              {filteredDevices.map((device, index) => (
                <tr key={device._id}>
                  <td>{index + 1}</td>

                  {selectedTemplate.fields.map((field) => (
                    <td key={field.name}>
                      {device.data?.[field.name] || "-"}
                    </td>
                  ))}

                  <td>
                    <span
                      className={`badge ${(device.status || "Available")
                        .replaceAll(" ", "-")
                        .toLowerCase()}`}
                    >
                      {device.status || "Available"}
                    </span>
                  </td>

                  {isAdmin && (
                    <td>
                      <button
                        type="button"
                        className="btn-edit"
                        onClick={() => editCustomDevice(device)}
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        className="btn-delete"
                        onClick={() => deleteCustomDevice(device._id)}
                      >
                        Delete
                      </button>
                    </td>
                  )}
                </tr>
              ))}

              {filteredDevices.length === 0 && (
                <tr>
                  <td
                    colSpan={
                      selectedTemplate.fields.length + (isAdmin ? 3 : 2)
                    }
                  >
                    No data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default CustomDevicePage;