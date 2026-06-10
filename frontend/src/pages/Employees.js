import React, { useEffect, useState } from "react";
import axios from "axios";

const API_URL =
  window.location.hostname === "localhost"
    ? "http://localhost:5000"
    : "https://it-device-tracker.onrender.com";

function Employees() {
  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;
  const isAdmin = String(user?.role || "").toLowerCase() === "admin";

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

    CompanyEmail: "",
    AccessRole: "user",
    CanLogin: true,

    AdminUsername: "",
    AdminPassword: "",
  });

  const [newDepartment, setNewDepartment] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [editId, setEditId] = useState(null);

  const getHeaders = () => ({
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });

  const showError = (err, fallback) => {
    const data = err.response?.data;
    console.log(fallback, data || err.message);
    alert(data?.message || data?.error || err.message || fallback);
  };

  const normalizeArray = (data, key) => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.[key])) return data[key];
    if (Array.isArray(data?.data)) return data.data;
    return [];
  };

  const fetchEmployees = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/employees`, getHeaders());
      setEmployees(normalizeArray(res.data, "employees"));
    } catch (err) {
      console.log("Employees Fetch Error:", err.response?.data || err.message);
      setEmployees([]);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await axios.get(
        `${API_URL}/api/employees/departments/all`,
        getHeaders()
      );
      setDepartments(normalizeArray(res.data, "departments"));
    } catch (err) {
      console.log("Department Fetch Error:", err.response?.data || err.message);
      setDepartments([]);
    }
  };

  const fetchLocations = async () => {
    try {
      const res = await axios.get(
        `${API_URL}/api/employees/locations/all`,
        getHeaders()
      );
      setLocations(normalizeArray(res.data, "locations"));
    } catch (err) {
      console.log("Location Fetch Error:", err.response?.data || err.message);
      setLocations([]);
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchDepartments();
    fetchLocations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const resetForm = () => {
    setForm({
      FirstName: "",
      SecondName: "",
      EPFNumber: "",
      Department: "",
      Location: "",
      Status: "Active",

      CompanyEmail: "",
      AccessRole: "user",
      CanLogin: true,

      AdminUsername: "",
      AdminPassword: "",
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

  const validateEmployeeForm = () => {
    if (!form.FirstName.trim()) {
      alert("First name is required");
      return false;
    }

    if (!form.SecondName.trim()) {
      alert("Second name is required");
      return false;
    }

    if (!form.EPFNumber.toString().trim()) {
      alert("EPF number is required");
      return false;
    }

    if (!form.Department.trim()) {
      alert("Department is required");
      return false;
    }

    if (!form.Location.trim()) {
      alert("Location is required");
      return false;
    }

    if (
      form.CompanyEmail.trim() &&
      !form.CompanyEmail.toLowerCase().trim().endsWith("@swisstekaluminium.com")
    ) {
      alert("Please enter a valid Swisstek company Microsoft email");
      return false;
    }

    if (form.AccessRole === "admin") {
      if (!form.CompanyEmail.trim()) {
        alert("Company email is required for admin account");
        return false;
      }

      if (!form.AdminUsername.trim()) {
        alert("Admin username is required");
        return false;
      }

      if (!editId && !form.AdminPassword.trim()) {
        alert("Admin password is required for new admin account");
        return false;
      }
    }

    return true;
  };

  const saveEmployee = async (e) => {
    e.preventDefault();

    if (!isAdmin) {
      alert("Admin access only");
      return;
    }

    if (!validateEmployeeForm()) return;

    try {
      const companyEmail = form.CompanyEmail.trim().toLowerCase();

      const payload = {
        FirstName: form.FirstName.trim(),
        SecondName: form.SecondName.trim(),
        EPFNumber: form.EPFNumber.toString().trim(),
        Department: form.Department.trim(),
        Location: form.Location.trim(),
        Status: form.Status || "Active",

        CompanyEmail: companyEmail,
        AccessRole: form.AccessRole || "user",
        CanLogin: Boolean(form.CanLogin),

        AdminUsername: form.AdminUsername.trim(),
        AdminPassword: form.AdminPassword,

        firstName: form.FirstName.trim(),
        secondName: form.SecondName.trim(),
        epfNumber: form.EPFNumber.toString().trim(),
        department: form.Department.trim(),
        location: form.Location.trim(),
        status: form.Status || "Active",
        companyEmail,
        accessRole: form.AccessRole || "user",
        canLogin: Boolean(form.CanLogin),
        adminUsername: form.AdminUsername.trim(),
        adminPassword: form.AdminPassword,
      };

      console.log("SENDING EMPLOYEE:", payload);

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
      FirstName: emp.FirstName || emp.firstName || "",
      SecondName: emp.SecondName || emp.secondName || "",
      EPFNumber: emp.EPFNumber || emp.epfNumber || "",
      Department: emp.Department || emp.department || "",
      Location: emp.Location || emp.location || "",
      Status: emp.Status || emp.status || "Active",

      CompanyEmail: emp.CompanyEmail || emp.companyEmail || "",
      AccessRole: emp.AccessRole || emp.accessRole || "user",
      CanLogin: emp.CanLogin === false || emp.canLogin === false ? false : true,

      AdminUsername: emp.CompanyEmail
        ? emp.CompanyEmail.split("@")[0]
        : emp.FullName || "",
      AdminPassword: "",
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
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

  const getFullName = (emp) => {
    return (
      emp.FullName ||
      emp.fullName ||
      `${emp.FirstName || emp.firstName || ""} ${
        emp.SecondName || emp.secondName || ""
      }`.trim()
    );
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Employee & Access Management</h1>
        <span className="count-badge">{employees.length} Employees</span>
      </div>

      {isAdmin && (
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
      )}

      {isAdmin && (
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
            type="text"
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
              <option key={dep._id || dep.Name} value={dep.Name}>
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
              <option key={loc._id || loc.Name} value={loc.Name}>
                {loc.Name}
              </option>
            ))}
          </select>

          <select name="Status" value={form.Status} onChange={handleChange}>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>

          <input
            name="CompanyEmail"
            type="email"
            placeholder="Company Microsoft Email"
            value={form.CompanyEmail}
            onChange={handleChange}
          />

          <select
            name="AccessRole"
            value={form.AccessRole}
            onChange={handleChange}
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>

          <label className="checkbox-label">
            <input
              type="checkbox"
              name="CanLogin"
              checked={form.CanLogin}
              onChange={handleChange}
            />
            Allow Microsoft Login
          </label>

          {form.AccessRole === "admin" && (
            <>
              <input
                name="AdminUsername"
                type="text"
                placeholder="Admin Username"
                value={form.AdminUsername}
                onChange={handleChange}
                required
              />

              <input
                name="AdminPassword"
                type="password"
                placeholder={
                  editId
                    ? "Admin Password (leave blank to keep old password)"
                    : "Admin Password"
                }
                value={form.AdminPassword}
                onChange={handleChange}
                required={!editId}
              />
            </>
          )}

          <button className="btn-save" type="submit">
            {editId ? "Update Employee" : "Add Employee"}
          </button>

          {editId && (
            <button type="button" className="btn-delete" onClick={resetForm}>
              Cancel Edit
            </button>
          )}
        </form>
      )}

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>EPF</th>
              <th>Name</th>
              <th>Department</th>
              <th>Location</th>
              <th>Company Email</th>
              <th>Access Role</th>
              <th>Can Login</th>
              {isAdmin && <th>Action</th>}
            </tr>
          </thead>

          <tbody>
            {employees.map((emp) => (
              <tr key={emp._id}>
                <td>{emp.EPFNumber || emp.epfNumber || "-"}</td>

                <td>{getFullName(emp) || "-"}</td>

                <td>{emp.Department || emp.department || "-"}</td>

                <td>{emp.Location || emp.location || "-"}</td>

                <td>{emp.CompanyEmail || emp.companyEmail || "-"}</td>

                <td>
                  <span className="status-pill Active">
                    {emp.AccessRole || emp.accessRole || "user"}
                  </span>
                </td>

                <td>
                  {emp.CanLogin === false || emp.canLogin === false ? (
                    <span className="status-pill Inactive">Disabled</span>
                  ) : (
                    <span className="status-pill Active">Enabled</span>
                  )}
                </td>

                {isAdmin && (
                  <td>
                    <button
                      className="btn-edit"
                      type="button"
                      onClick={() => editEmployee(emp)}
                    >
                      Edit
                    </button>

                    <button
                      className="btn-delete"
                      type="button"
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