import React, { useState } from "react";
import axios from "axios";

function Users() {
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    role: "user",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const createUser = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem("token");

      await axios.post(
        "https://it-device-tracker.onrender.com/api/auth/register",
        form,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert("User created successfully");

      setForm({
        username: "",
        email: "",
        password: "",
        role: "user",
      });
    } catch (err) {
      alert(err.response?.data?.message || "User creation failed");
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>User Management</h1>
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
    </div>
  );
}

export default Users;