import React, { useEffect, useState } from "react";
import axios from "axios";
import * as XLSX from "xlsx";

const BASE_API =
  window.location.hostname === "localhost"
    ? "http://localhost:5000/api"
    : "https://it-device-tracker.onrender.com/api";

function CustomDevicePage() {
  const storedUser = JSON.parse(localStorage.getItem("user"));
  const isAdmin = String(storedUser?.role || "").toLowerCase() === "admin";

  const [templates, setTemplates]               = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [formData, setFormData]                 = useState({});
  const [status, setStatus]                     = useState("Available");
  const [devices, setDevices]                   = useState([]);
  const [editId, setEditId]                     = useState(null);
  const [search, setSearch]                     = useState("");
  const [todayDate, setTodayDate]               = useState(new Date());
  const [ageAsOfDate, setAgeAsOfDate]           = useState("");
  const [error, setError]                       = useState("");

  const getHeaders = () => ({
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });

  useEffect(() => {
    const timer = setInterval(() => setTodayDate(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  /* ── Age calculation ── */
  const calculateAgeFromDate = (dateValue, customEndDate = "") => {
    if (!dateValue) return "-";
    const startDate = new Date(dateValue);
    const endDate   = customEndDate ? new Date(customEndDate) : new Date(todayDate);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return "-";
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);
    if (startDate > endDate) return "0 Years 0 Months 0 Days";

    let years  = endDate.getFullYear() - startDate.getFullYear();
    let months = endDate.getMonth()    - startDate.getMonth();
    let days   = endDate.getDate()     - startDate.getDate();

    if (days < 0) {
      months--;
      days += new Date(endDate.getFullYear(), endDate.getMonth(), 0).getDate();
    }
    if (months < 0) { years--; months += 12; }
    if (years < 0) return "0 Years 0 Months 0 Days";

    return `${years} Year${years !== 1 ? "s" : ""} ${months} Month${months !== 1 ? "s" : ""} ${days} Day${days !== 1 ? "s" : ""}`;
  };

  const normalizeFieldText = (value) =>
    String(value || "").replaceAll("_", " ").replaceAll("-", " ").toLowerCase();

  const getDateFields = () =>
    selectedTemplate?.fields?.filter((f) => f.type === "date") || [];

  const getPreferredAgeDateField = () => {
    const dateFields = getDateFields();
    if (dateFields.length === 0) return null;
    const priorityKeywords = [
      "purchase","buy","bought","handover","issued","assign",
      "assigned","install","installed","warranty","created","date",
    ];
    return (
      dateFields.find((field) => {
        const fieldText = normalizeFieldText(`${field.label} ${field.name}`);
        return priorityKeywords.some((kw) => fieldText.includes(kw));
      }) || dateFields[0]
    );
  };

  const getCustomAge = (device) => {
    const ageDateField = getPreferredAgeDateField();
    if (!ageDateField) return "-";
    return calculateAgeFromDate(device.data?.[ageDateField.name], ageAsOfDate);
  };

  const shouldShowAgeColumn = () => getDateFields().length > 0;

  const formatDateValue = (value) => {
    if (!value) return "-";
    const date = new Date(value);
    return isNaN(date.getTime()) ? value : date.toISOString().slice(0, 10);
  };

  /* ── Load templates ── */
  const loadTemplates = async () => {
    try {
      const res  = await axios.get(`${BASE_API}/device-templates`, getHeaders());
      const data = Array.isArray(res.data) ? res.data : [];
      setTemplates(data);
      if (selectedTemplateId) {
        setSelectedTemplate(data.find((t) => t._id === selectedTemplateId) || null);
      }
    } catch (err) {
      console.error("Load templates error:", err.response?.data || err.message);
      setTemplates([]);
    }
  };

  /* ── Load devices — Admin: all, User: own only ── */
  const loadDevices = async (templateId) => {
    if (!templateId) return;
    try {
      const res = await axios.get(
        `${BASE_API}/custom-devices/template/${templateId}`,
        getHeaders()
      );
      const all = Array.isArray(res.data) ? res.data : [];

      if (isAdmin) {
        // ✅ Admin: සියලුම devices
        setDevices(all);
      } else {
        // ✅ User: createdBy field එකෙන් own devices පමණයි
        const userId = storedUser?._id || storedUser?.id || "";
        const own = all.filter(
          (d) => String(d.createdBy || "") === String(userId)
        );
        setDevices(own);
      }
    } catch (err) {
      console.error("Load custom devices error:", err.response?.data || err.message);
      setDevices([]);
    }
  };

  useEffect(() => {
    loadTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const buildEmptyForm = (template) => {
    const initialData = {};
    template?.fields?.forEach((field) => { initialData[field.name] = ""; });
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
    setAgeAsOfDate("");
    setError("");
    await loadDevices(id);
  };

  const handleChange = (name, value) =>
    setFormData((prev) => ({ ...prev, [name]: value }));

  const resetForm = () => {
    setFormData(buildEmptyForm(selectedTemplate));
    setStatus("Available");
    setEditId(null);
    setError("");
  };

  /* ── Save ── */
  const saveCustomDevice = async (e) => {
    e.preventDefault();
    if (!selectedTemplateId) {
      setError("Please select an interface");
      return;
    }

    try {
      const payload = { templateId: selectedTemplateId, data: formData, status };

      if (editId) {
        // Edit — admin only
        if (!isAdmin) {
          setError("Only admins can update records");
          return;
        }
        await axios.put(`${BASE_API}/custom-devices/${editId}`, payload, getHeaders());
      } else {
        await axios.post(`${BASE_API}/custom-devices`, payload, getHeaders());
      }

      resetForm();
      setError("");
      await loadDevices(selectedTemplateId);
    } catch (err) {
      console.error("Save error:", err.response?.data || err.message);
      setError(err.response?.data?.message || "Failed to save");
    }
  };

  /* ── Edit ── */
  const editCustomDevice = (device) => {
    if (!isAdmin) { setError("Only admins can edit records"); return; }
    setEditId(device._id);
    setFormData(device.data || {});
    setStatus(device.status || "Available");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /* ── Delete device ── */
  const deleteCustomDevice = async (id) => {
    if (!isAdmin) { setError("Only admins can delete records"); return; }
    if (!window.confirm("Delete this record?")) return;
    try {
      await axios.delete(`${BASE_API}/custom-devices/${id}`, getHeaders());
      await loadDevices(selectedTemplateId);
    } catch (err) {
      console.error("Delete error:", err.response?.data || err.message);
      setError(err.response?.data?.message || "Failed to delete");
    }
  };

  /* ── Delete interface ── */
  const deleteInterface = async () => {
    if (!isAdmin) { setError("Only admins can delete interfaces"); return; }
    if (!selectedTemplateId) { setError("Please select an interface first"); return; }
    if (!window.confirm(`Remove "${selectedTemplate?.name}" interface?`)) return;
    try {
      await axios.delete(`${BASE_API}/device-templates/${selectedTemplateId}`, getHeaders());
      setSelectedTemplateId("");
      setSelectedTemplate(null);
      setDevices([]);
      setFormData({});
      setSearch("");
      setAgeAsOfDate("");
      setError("");
      await loadTemplates();
    } catch (err) {
      console.error("Delete interface error:", err.response?.data || err.message);
      setError(err.response?.data?.message || "Failed to remove interface");
    }
  };

  /* ── Filter ── */
  const filteredDevices = (() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return devices;
    return devices.filter((device) =>
      [device.templateName, device.status, getCustomAge(device), ...Object.values(device.data || {})]
        .join(" ").toLowerCase().includes(keyword)
    );
  })();

  /* ── Excel export ── */
  const downloadExcel = () => {
    if (!isAdmin) { setError("Only admins can download Excel reports"); return; }
    if (!selectedTemplate) { setError("Please select an interface"); return; }

    const showAge = shouldShowAgeColumn();
    const exportData = filteredDevices.map((device, index) => {
      const row = { No: index + 1, Interface: selectedTemplate.name };
      selectedTemplate.fields.forEach((field) => {
        const value = device.data?.[field.name] || "";
        row[field.label] = field.type === "date" ? formatDateValue(value) : value;
      });
      if (showAge) row.Age = getCustomAge(device);
      row.Status    = device.status || "";
      row.CreatedAt = device.createdAt ? new Date(device.createdAt).toLocaleString() : "";
      return row;
    });

    if (exportData.length === 0) { setError("No data to export"); return; }

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook  = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, selectedTemplate.name);
    XLSX.writeFile(workbook, `${selectedTemplate.name}_Data.xlsx`);
  };

  /* ── Render field ── */
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
            <option key={option} value={option}>{option}</option>
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

  /* ── JSX ── */
  return (
    <div className="page">
      <div className="page-header">
        <h1>Custom Device Interfaces</h1>
        <span className="device-count">{templates.length} Interfaces</span>
      </div>

      {/* ── Error banner ── */}
      {error && (
        <div style={{
          background: "#fee2e2", border: "1px solid #fca5a5", color: "#991b1b",
          padding: "12px 16px", borderRadius: "8px", marginBottom: "16px",
          fontWeight: 500, display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <span>⚠️ {error}</span>
          <button onClick={() => setError("")}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: "18px", color: "#991b1b" }}>
            ✕
          </button>
        </div>
      )}

      {/* ── Select interface ── */}
      <div className="pro-card">
        <h2>Select Interface</h2>
        <div className="search-box">
          <select value={selectedTemplateId} onChange={(e) => selectTemplate(e.target.value)}>
            <option value="">Select custom device interface</option>
            {templates.map((template) => (
              <option key={template._id} value={template._id}>{template.name}</option>
            ))}
          </select>
          {selectedTemplate && isAdmin && (
            <button type="button" className="btn-delete" onClick={deleteInterface}>
              Delete Interface
            </button>
          )}
        </div>
      </div>

      {/* ── Add/Edit form — Admin only ✅ ── */}
      {selectedTemplate && isAdmin && (
        <form className="device-form pro-card" onSubmit={saveCustomDevice}>
          <h2>{editId ? "Update" : "Add"} {selectedTemplate.name}</h2>
          {selectedTemplate.fields.map((field) => renderField(field))}
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option>Available</option>
            <option>Assigned</option>
            <option>In Repair</option>
            <option>Retired</option>
            <option>Missing</option>
          </select>
          <div className="form-actions">
            <button className="btn-save" type="submit">
              {editId ? `Update ${selectedTemplate.name}` : `Save ${selectedTemplate.name}`}
            </button>
            {editId && (
              <button type="button" className="btn-cancel" onClick={resetForm}>
                Cancel Edit
              </button>
            )}
          </div>
        </form>
      )}

      {/* ── Search bar ── */}
      {selectedTemplate && (
        <div className="pro-card">
          <div className="search-box">
            <input
              placeholder={`Search ${selectedTemplate.name} data`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {shouldShowAgeColumn() && (
              <input
                type="date"
                value={ageAsOfDate}
                onChange={(e) => setAgeAsOfDate(e.target.value)}
                title="Calculate age as of this date"
              />
            )}
            {shouldShowAgeColumn() && ageAsOfDate && (
              <button type="button" className="btn-delete" onClick={() => setAgeAsOfDate("")}>
                Today Age
              </button>
            )}
            {isAdmin && (
              <button type="button" onClick={downloadExcel}>Download Excel</button>
            )}
          </div>
        </div>
      )}

      {/* ── Table ── */}
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
                {shouldShowAgeColumn() && (
                  <th>{ageAsOfDate ? `Age as of ${ageAsOfDate}` : "Age"}</th>
                )}
                <th>Status</th>
                {isAdmin && <th>Action</th>}
              </tr>
            </thead>
            <tbody>
              {filteredDevices.map((device, index) => (
                <tr key={device._id}>
                  <td>{index + 1}</td>
                  {selectedTemplate.fields.map((field) => {
                    const value = device.data?.[field.name];
                    return (
                      <td key={field.name}>
                        {field.type === "date" ? formatDateValue(value) : value || "-"}
                      </td>
                    );
                  })}
                  {shouldShowAgeColumn() && <td>{getCustomAge(device)}</td>}
                  <td>
                    <span className={`badge ${(device.status || "Available").replaceAll(" ", "-").toLowerCase()}`}>
                      {device.status || "Available"}
                    </span>
                  </td>
                  {isAdmin && (
                    <td>
                      <button type="button" className="btn-edit" onClick={() => editCustomDevice(device)}>Edit</button>
                      <button type="button" className="btn-delete" onClick={() => deleteCustomDevice(device._id)}>Delete</button>
                    </td>
                  )}
                </tr>
              ))}
              {filteredDevices.length === 0 && (
                <tr>
                  <td colSpan={selectedTemplate.fields.length + (shouldShowAgeColumn() ? 1 : 0) + (isAdmin ? 3 : 2)}>
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