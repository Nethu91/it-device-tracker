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

  // Realtime age update
  const [todayDate, setTodayDate] = useState(new Date());

  // Custom date for checking age as of selected date
  const [ageAsOfDate, setAgeAsOfDate] = useState("");

  const getHeaders = () => ({
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });

  /* =========================================
     REALTIME AGE CALCULATION
  ========================================= */

  useEffect(() => {
    const timer = setInterval(() => {
      setTodayDate(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const calculateAgeFromDate = (dateValue, customEndDate = "") => {
    if (!dateValue) return "-";

    const startDate = new Date(dateValue);
    const endDate = customEndDate ? new Date(customEndDate) : new Date(todayDate);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return "-";

    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);

    if (startDate > endDate) return "0 Years 0 Months 0 Days";

    let years = endDate.getFullYear() - startDate.getFullYear();
    let months = endDate.getMonth() - startDate.getMonth();
    let days = endDate.getDate() - startDate.getDate();

    if (days < 0) {
      months--;

      const previousMonth = new Date(
        endDate.getFullYear(),
        endDate.getMonth(),
        0
      );

      days += previousMonth.getDate();
    }

    if (months < 0) {
      years--;
      months += 12;
    }

    if (years < 0) return "0 Years 0 Months 0 Days";

    return `${years} Year${years !== 1 ? "s" : ""} ${months} Month${
      months !== 1 ? "s" : ""
    } ${days} Day${days !== 1 ? "s" : ""}`;
  };

  const normalizeFieldText = (value) => {
    return String(value || "")
      .replaceAll("_", " ")
      .replaceAll("-", " ")
      .toLowerCase();
  };

  const getDateFields = () => {
    if (!selectedTemplate?.fields) return [];

    return selectedTemplate.fields.filter((field) => field.type === "date");
  };

  const getPreferredAgeDateField = () => {
    const dateFields = getDateFields();

    if (dateFields.length === 0) return null;

    const priorityKeywords = [
      "purchase",
      "buy",
      "bought",
      "handover",
      "issued",
      "assign",
      "assigned",
      "install",
      "installed",
      "warranty",
      "created",
      "date",
    ];

    const preferredField = dateFields.find((field) => {
      const fieldText = normalizeFieldText(`${field.label} ${field.name}`);

      return priorityKeywords.some((keyword) => fieldText.includes(keyword));
    });

    return preferredField || dateFields[0];
  };

  const getCustomAge = (device) => {
    const ageDateField = getPreferredAgeDateField();

    if (!ageDateField) return "-";

    const dateValue = device.data?.[ageDateField.name];

    return calculateAgeFromDate(dateValue, ageAsOfDate);
  };

  const shouldShowAgeColumn = () => {
    return getDateFields().length > 0;
  };

  const formatDateValue = (value) => {
    if (!value) return "-";

    const date = new Date(value);

    if (isNaN(date.getTime())) return value;

    return date.toISOString().slice(0, 10);
  };

  /* =========================================
     LOAD DATA
  ========================================= */

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
    setAgeAsOfDate("");

    await loadDevices(id);
  };

  /* =========================================
     FORM HANDLERS
  ========================================= */

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
      setAgeAsOfDate("");

      await loadTemplates();
    } catch (err) {
      console.error(
        "Delete interface error:",
        err.response?.data || err.message
      );
      alert(err.response?.data?.message || "Failed to remove interface");
    }
  };

  /* =========================================
     SEARCH + EXPORT
  ========================================= */

  const filteredDevices = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return devices;

    return devices.filter((device) =>
      [
        device.templateName,
        device.status,
        getCustomAge(device),
        ...Object.values(device.data || {}),
      ]
        .join(" ")
        .toLowerCase()
        .includes(keyword)
    );
  }, [search, devices, todayDate, selectedTemplate, ageAsOfDate]);

  const downloadExcel = () => {
    if (!isAdmin) {
      alert("Only admins can download Excel reports");
      return;
    }

    if (!selectedTemplate) {
      alert("Please select an interface");
      return;
    }

    const showAge = shouldShowAgeColumn();

    const exportData = filteredDevices.map((device, index) => {
      const row = {
        No: index + 1,
        Interface: selectedTemplate.name,
      };

      selectedTemplate.fields.forEach((field) => {
        const value = device.data?.[field.name] || "";

        row[field.label] =
          field.type === "date" ? formatDateValue(value) : value;
      });

      if (showAge) {
        row.Age = getCustomAge(device);
      }

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

  /* =========================================
     RENDER FIELDS
  ========================================= */

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

            {shouldShowAgeColumn() && (
              <input
                type="date"
                value={ageAsOfDate}
                onChange={(e) => setAgeAsOfDate(e.target.value)}
                title="Calculate age as of this date"
              />
            )}

            {shouldShowAgeColumn() && ageAsOfDate && (
              <button
                type="button"
                className="btn-delete"
                onClick={() => setAgeAsOfDate("")}
              >
                Today Age
              </button>
            )}

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

                {shouldShowAgeColumn() && (
                  <th>
                    {ageAsOfDate ? `Age as of ${ageAsOfDate}` : "Age"}
                  </th>
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
                        {field.type === "date"
                          ? formatDateValue(value)
                          : value || "-"}
                      </td>
                    );
                  })}

                  {shouldShowAgeColumn() && <td>{getCustomAge(device)}</td>}

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
                      selectedTemplate.fields.length +
                      (shouldShowAgeColumn() ? 1 : 0) +
                      (isAdmin ? 3 : 2)
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