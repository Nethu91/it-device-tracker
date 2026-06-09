import React, { useEffect, useState } from "react";
import axios from "axios";

const BASE_API =
  window.location.hostname === "localhost"
    ? "http://localhost:5000/api"
    : "https://it-device-tracker.onrender.com/api";

function Users() {
  const [users, setUsers] = useState([]);

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    role: "user",
  });

  const getHeaders = () => ({
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${BASE_API}/auth/users`, getHeaders());

      const data = Array.isArray(res.data)
        ? res.data
        : res.data.users || res.data.data || [];

      setUsers(data);
    } catch (err) {
      console.error("Fetch users error:", err.response?.data || err.message);
      setUsers([]);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const resetForm = () => {
    setForm({
      username: "",
      email: "",
      password: "",
      role: "user",
    });
  };

  const createUser = async (e) => {
    e.preventDefault();

    try {
      const payload = {
        username: form.username.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        role: form.role,
      };

      await axios.post(`${BASE_API}/auth/register`, payload, getHeaders());

      alert("User created successfully");

      resetForm();
      await fetchUsers();
    } catch (err) {
      console.error("Create user error:", err.response?.data || err.message);
      alert(err.response?.data?.message || "User creation failed");
    }
  };

  const deleteUser = async (id) => {
    if (!window.confirm("Delete this user account?")) return;

    try {
      await axios.delete(`${BASE_API}/auth/users/${id}`, getHeaders());

      alert("User deleted successfully");
      await fetchUsers();
    } catch (err) {
      console.error("Delete user error:", err.response?.data || err.message);
      alert(err.response?.data?.message || "User delete failed");
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>User Management</h1>
        <span className="device-count">{users.length} Users</span>
      </div>

      <form className="device-form pro-card" onSubmit={createUser}>
        <input
          name="username"
          placeholder="Username"
          value={form.username}
          onChange={handleChange}
          required
        />

        <input
          name="email"
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          required
        />

        <input
          name="password"
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          required
        />

        <select name="role" value={form.role} onChange={handleChange}>
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>

        <button className="btn-save" type="submit">
          Create Account
        </button>
      </form>

      <div className="table-card">
        <h2>System Users</h2>

        <table className="device-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Username</th>
              <th>Email</th>
              <th>Role</th>
              <th>Login Type</th>
              <th>Phone</th>
              <th>Department</th>
              <th>Position</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {users.map((user, index) => (
              <tr key={user._id || user.id}>
                <td>{index + 1}</td>
                <td>{user.username || "-"}</td>
                <td>{user.email || "-"}</td>
                <td>
                  <span className="status-pill Active">
                    {user.role || "user"}
                  </span>
                </td>
                <td>{user.authProvider || "local"}</td>
                <td>{user.phone || "-"}</td>
                <td>{user.department || "-"}</td>
                <td>{user.position || "-"}</td>
                <td>
                  <button
                    type="button"
                    className="btn-delete"
                    onClick={() => deleteUser(user._id || user.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}

            {users.length === 0 && (
              <tr>
                <td colSpan="9">No users found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Users;