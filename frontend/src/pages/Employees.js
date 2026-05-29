import React, { useEffect, useState } from "react";
import axios from "axios";

const API_URL = "http://localhost:5000";

function Employees() {
  const user = JSON.parse(localStorage.getItem("user"));
  const isAdmin = user?.role === "admin";

  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [locations, setLocations] = useState([]);

  const [form, setForm] = useState({
    FirstName: "",
    SecondName: "",
    EPFNumber: "",
    Department: "",
    Location: "",
    Status: "Active",
  });

  const [newDepartment, setNewDepartment] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [editId, setEditId] = useState(null);

  const getHeaders = () => ({
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });

  const showError = (err, fallback) => {
    const data = err.response?.data;
    console.log(fallback, data || err.message);
    alert(data?.message || data?.error || err.message || fallback);
  };

  useEffect(() => {
    fetchEmployees();
    fetchDepartments();
    fetchLocations();
    // eslint-disable-next-line
  }, []);

  const fetchEmployees = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/employees`, getHeaders());
      setEmployees(res.data);
    } catch (err) {
      console.log("Employees Fetch Error:", err.response?.data || err.message);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await axios.get(
        `${API_URL}/api/employees/departments/all`,
        getHeaders()
      );
      setDepartments(res.data);
    } catch (err) {
      console.log("Department Fetch Error:", err.response?.data || err.message);
    }
  };

  const fetchLocations = async () => {
    try {
      const res = await axios.get(
        `${API_URL}/api/employees/locations/all`,
        getHeaders()
      );
      setLocations(res.data);
    } catch (err) {
      console.log("Location Fetch Error:", err.response?.data || err.message);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    setForm({
      FirstName: "",
      SecondName: "",
      EPFNumber: "",
      Department: "",
      Location: "",
      Status: "Active",
    });
    setEditId(null);
  };

  const addDepartment = async () => {
    if (!newDepartment.trim()) {
      alert("Please enter department name");
      return;
    }

    try {
      await axios.post(
        `${API_URL}/api/employees/departments`,
        { Name: newDepartment.trim() },
        getHeaders()
      );

      setNewDepartment("");
      await fetchDepartments();
      alert("Department added successfully");
    } catch (err) {
      showError(err, "Department add failed");
    }
  };

  const addLocation = async () => {
    if (!newLocation.trim()) {
      alert("Please enter location name");
      return;
    }

    try {
      await axios.post(
        `${API_URL}/api/employees/locations`,
        { Name: newLocation.trim() },
        getHeaders()
      );

      setNewLocation("");
      await fetchLocations();
      alert("Location added successfully");
    } catch (err) {
      showError(err, "Location add failed");
    }
  };

  const saveEmployee = async (e) => {
    e.preventDefault();

    if (!isAdmin) {
      alert("Admin access only");
      return;
    }

    try {
      const payload = {
        ...form,
        FirstName: form.FirstName.trim(),
        SecondName: form.SecondName.trim(),
        Department: form.Department.trim(),
        Location: form.Location.trim(),
        EPFNumber: Number(form.EPFNumber),
      };

      if (editId) {
        await axios.put(
          `${API_URL}/api/employees/${editId}`,
          payload,
          getHeaders()
        );
        alert("Employee updated successfully");
      } else {
        await axios.post(`${API_URL}/api/employees`, payload, getHeaders());
        alert("Employee added successfully");
      }

      resetForm();
      await fetchEmployees();
    } catch (err) {
      showError(err, "Employee save failed");
    }
  };

  const editEmployee = (emp) => {
    setEditId(emp._id);
    setForm({
      FirstName: emp.FirstName || "",
      SecondName: emp.SecondName || "",
      EPFNumber: emp.EPFNumber || "",
      Department: emp.Department || "",
      Location: emp.Location || "",
      Status: emp.Status || "Active",
    });
  };

  const deleteEmployee = async (id) => {
    if (!window.confirm("Delete this employee?")) return;

    try {
      await axios.delete(`${API_URL}/api/employees/${id}`, getHeaders());
      alert("Employee deleted successfully");
      await fetchEmployees();
    } catch (err) {
      showError(err, "Delete failed");
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Employee Management</h1>
        <span className="count-badge">{employees.length} Employees</span>
      </div>

      <div className="pro-card">
        <h2>Add Department & Location</h2>

        <div className="form-grid">
          <input
            placeholder="New Department"
            value={newDepartment}
            onChange={(e) => setNewDepartment(e.target.value)}
          />

          <button type="button" className="btn-save" onClick={addDepartment}>
            Add Department
          </button>

          <input
            placeholder="New Location"
            value={newLocation}
            onChange={(e) => setNewLocation(e.target.value)}
          />

          <button type="button" className="btn-save" onClick={addLocation}>
            Add Location
          </button>
        </div>
      </div>

      <form className="device-form pro-card" onSubmit={saveEmployee}>
        <input
          name="FirstName"
          placeholder="First Name"
          value={form.FirstName}
          onChange={handleChange}
          required
        />

        <input
          name="SecondName"
          placeholder="Second Name"
          value={form.SecondName}
          onChange={handleChange}
          required
        />

        <input
          name="EPFNumber"
          type="number"
          placeholder="EPF Number"
          value={form.EPFNumber}
          onChange={handleChange}
          required
        />

        <select
          name="Department"
          value={form.Department}
          onChange={handleChange}
          required
        >
          <option value="">Select Department</option>
          {departments.map((dep) => (
            <option key={dep._id} value={dep.Name}>
              {dep.Name}
            </option>
          ))}
        </select>

        <select
          name="Location"
          value={form.Location}
          onChange={handleChange}
          required
        >
          <option value="">Select Location</option>
          {locations.map((loc) => (
            <option key={loc._id} value={loc.Name}>
              {loc.Name}
            </option>
          ))}
        </select>

        <select name="Status" value={form.Status} onChange={handleChange}>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>

        <button className="btn-save" type="submit">
          {editId ? "Update Employee" : "Add Employee"}
        </button>

        {editId && (
          <button type="button" className="btn-delete" onClick={resetForm}>
            Cancel Edit
          </button>
        )}
      </form>

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>First Name</th>
              <th>Second Name</th>
              <th>Full Name</th>
              <th>EPF</th>
              <th>Department</th>
              <th>Location</th>
              <th>Status</th>
              {isAdmin && <th>Action</th>}
            </tr>
          </thead>

          <tbody>
            {employees.map((emp) => (
              <tr key={emp._id}>
                <td>{emp.FirstName}</td>
                <td>{emp.SecondName}</td>
                <td>{emp.FullName}</td>
                <td>{emp.EPFNumber}</td>
                <td>{emp.Department}</td>
                <td>{emp.Location}</td>
                <td>
                  <span className={`status-pill ${emp.Status}`}>
                    {emp.Status}
                  </span>
                </td>
                {isAdmin && (
                  <td>
                    <button className="btn-edit" onClick={() => editEmployee(emp)}>
                      Edit
                    </button>
                    <button
                      className="btn-delete"
                      onClick={() => deleteEmployee(emp._id)}
                    >
                      Delete
                    </button>
                  </td>
                )}
              </tr>
            ))}

            {employees.length === 0 && (
              <tr>
                <td colSpan={isAdmin ? 8 : 7}>No employees found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Employees;