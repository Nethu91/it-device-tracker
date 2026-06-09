import React, { useState } from "react";
import axios from "axios";

const BASE_API =
  window.location.hostname === "localhost"
    ? "http://localhost:5000/api"
    : "https://it-device-tracker.onrender.com/api";

function InterfaceBuilder() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const [fields, setFields] = useState([
    {
      label: "",
      type: "text",
      required: false,
      options: [""],
    },
  ]);

  const getHeaders = () => ({
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });

  const updateField = (index, key, value) => {
    const updated = [...fields];

    updated[index] = {
      ...updated[index],
      [key]: value,
    };

    // Dropdown select කළාම empty option එකක් auto add කරන්න
    if (key === "type" && value === "select") {
      updated[index].options =
        updated[index].options && updated[index].options.length > 0
          ? updated[index].options
          : [""];
    }

    // Dropdown නෙවෙයි නම් options clear කරන්න
    if (key === "type" && value !== "select") {
      updated[index].options = [""];
    }

    setFields(updated);
  };

  const updateOption = (fieldIndex, optionIndex, value) => {
    const updated = [...fields];
    const options = [...(updated[fieldIndex].options || [])];

    options[optionIndex] = value;
    updated[fieldIndex].options = options;

    setFields(updated);
  };

  const addOption = (fieldIndex) => {
    const updated = [...fields];
    updated[fieldIndex].options = [...(updated[fieldIndex].options || []), ""];
    setFields(updated);
  };

  const removeOption = (fieldIndex, optionIndex) => {
    const updated = [...fields];
    const options = [...(updated[fieldIndex].options || [])];

    if (options.length === 1) {
      alert("At least one dropdown option is required");
      return;
    }

    updated[fieldIndex].options = options.filter((_, i) => i !== optionIndex);
    setFields(updated);
  };

  const addField = () => {
    setFields([
      ...fields,
      {
        label: "",
        type: "text",
        required: false,
        options: [""],
      },
    ]);
  };

  const removeField = (index) => {
    if (fields.length === 1) {
      alert("At least one field is required");
      return;
    }

    setFields(fields.filter((_, i) => i !== index));
  };

  const saveTemplate = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      alert("Interface name is required");
      return;
    }

    const cleanFields = fields
      .filter((field) => field.label.trim() !== "")
      .map((field) => ({
        label: field.label.trim(),
        type: field.type,
        required: field.required,
        options:
          field.type === "select"
            ? (field.options || [])
                .map((option) => option.trim())
                .filter((option) => option !== "")
                .join(",")
            : "",
      }));

    if (cleanFields.length === 0) {
      alert("Please add at least one field");
      return;
    }

    const invalidDropdown = cleanFields.find(
      (field) => field.type === "select" && !field.options
    );

    if (invalidDropdown) {
      alert(`Please add dropdown options for ${invalidDropdown.label}`);
      return;
    }

    try {
      await axios.post(
        `${BASE_API}/device-templates`,
        {
          name: name.trim(),
          description: description.trim(),
          fields: cleanFields,
        },
        getHeaders()
      );

      alert("New device interface created successfully");

      setName("");
      setDescription("");
      setFields([
        {
          label: "",
          type: "text",
          required: false,
          options: [""],
        },
      ]);
    } catch (err) {
      console.error("Template create error:", err.response?.data || err.message);
      alert(err.response?.data?.message || "Failed to create interface");
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>GUI Interface Builder</h1>
        <span className="device-count">Create custom device pages</span>
      </div>

      <form className="pro-card device-form" onSubmit={saveTemplate}>
        <input
          placeholder="Interface Name, e.g. CCTV Camera"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <h3>Fields</h3>

        {fields.map((field, fieldIndex) => (
          <div className="field-builder-card" key={fieldIndex}>
            <div className="field-builder-row">
              <input
                placeholder="Field Label, e.g. Department"
                value={field.label}
                onChange={(e) =>
                  updateField(fieldIndex, "label", e.target.value)
                }
              />

              <select
                value={field.type}
                onChange={(e) =>
                  updateField(fieldIndex, "type", e.target.value)
                }
              >
                <option value="text">Text</option>
                <option value="number">Number</option>
                <option value="date">Date</option>
                <option value="select">Dropdown</option>
                <option value="textarea">Textarea</option>
              </select>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={field.required}
                  onChange={(e) =>
                    updateField(fieldIndex, "required", e.target.checked)
                  }
                />
                Required
              </label>

              <button
                type="button"
                className="btn-delete"
                onClick={() => removeField(fieldIndex)}
              >
                Remove Field
              </button>
            </div>

            {field.type === "select" && (
              <div className="dropdown-options-box">
                <h4>Dropdown Options</h4>

                {(field.options || [""]).map((option, optionIndex) => (
                  <div className="dropdown-option-row" key={optionIndex}>
                    <input
                      placeholder={`Option ${optionIndex + 1}, e.g. IT`}
                      value={option}
                      onChange={(e) =>
                        updateOption(fieldIndex, optionIndex, e.target.value)
                      }
                    />

                    <button
                      type="button"
                      className="btn-delete"
                      onClick={() => removeOption(fieldIndex, optionIndex)}
                    >
                      Remove
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  className="btn-save"
                  onClick={() => addOption(fieldIndex)}
                >
                  + Add Option
                </button>
              </div>
            )}
          </div>
        ))}

        <button type="button" className="btn-save" onClick={addField}>
          + Add Field
        </button>

        <button type="submit" className="btn-save">
          Create Interface
        </button>
      </form>
    </div>
  );
}

export default InterfaceBuilder;