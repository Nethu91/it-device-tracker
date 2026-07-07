import React, { useState } from "react";
import axios from "axios";
import "../styles/profile.css";

const BASE_API =
  window.location.hostname === "localhost"
    ? "http://localhost:5000/api"
    : "https://it-device-tracker.onrender.com/api";

const AUTH_API = `${BASE_API}/auth`;

function Profile() {
  const storedUser = JSON.parse(localStorage.getItem("user"));

  const [user, setUser] = useState(storedUser);

  const [form, setForm] = useState({
    username: storedUser?.username || "",
    email: storedUser?.email || "",
    phone: storedUser?.phone || "",
    department: storedUser?.department || "",
    position: storedUser?.position || "",
  });

  const [profilePicture, setProfilePicture] = useState(null);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const isMicrosoftUser = user?.authProvider === "microsoft";

  const getAuthHeaders = () => ({
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const updateProfile = async (e) => {
    e.preventDefault();

    try {
      const data = new FormData();

      data.append("username", form.username);
      data.append("email", form.email);
      data.append("phone", form.phone);
      data.append("department", form.department);
      data.append("position", form.position);

      if (profilePicture) {
        data.append("profilePicture", profilePicture);
      }

      const res = await axios.put(
        `${AUTH_API}/profile/${user.id}`,
        data,
        getAuthHeaders()
      );

      localStorage.setItem("user", JSON.stringify(res.data.user));
      setUser(res.data.user);

      alert("Profile updated successfully");
    } catch (err) {
      console.error("Profile update error:", err.response?.data || err.message);
      alert(err.response?.data?.message || "Profile update failed");
    }
  };

  const handlePasswordInputChange = (e) => {
    setPasswordForm({
      ...passwordForm,
      [e.target.name]: e.target.value,
    });
  };

  const changePassword = async (e) => {
    e.preventDefault();

    if (isMicrosoftUser) {
      alert("Microsoft users cannot change password here.");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert("New passwords do not match");
      return;
    }

    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      alert("Please fill all password fields");
      return;
    }

    try {
      await axios.put(
        `${AUTH_API}/change-password/${user.id}`,
        {
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        },
        getAuthHeaders()
      );

      alert("Password changed successfully");

      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err) {
      console.error("Password change error:", err.response?.data || err.message);
      alert(err.response?.data?.message || "Password change failed");
    }
  };

  // ✅ profilePicture is now a full Cloudinary URL (permanent), not a local filename
  const imageUrl = user?.profilePicture || null;

  return (
    <div className="profile-page">
      <div className="page-header">
        <h1>My Profile</h1>
      </div>

      <div className="profile-grid">
        <div className="profile-card">
          <div className="profile-image">
            {imageUrl ? (
              <img src={imageUrl} alt="Profile" />
            ) : (
              <div className="profile-avatar">
                {user?.username?.charAt(0).toUpperCase() || "U"}
              </div>
            )}
          </div>

          <h2>{user?.username}</h2>
          <p>{user?.role}</p>
          <p>{user?.email}</p>

          {isMicrosoftUser && (
            <span className="microsoft-badge">Microsoft Account</span>
          )}
        </div>

        <form className="profile-form" onSubmit={updateProfile}>
          <h2>Update Profile</h2>

          <input
            name="username"
            placeholder="Username"
            value={form.username}
            onChange={handleChange}
          />

          <input
            name="email"
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
          />

          <input
            name="phone"
            placeholder="Contact Number"
            value={form.phone}
            onChange={handleChange}
          />

          <input
            name="department"
            placeholder="Department"
            value={form.department}
            onChange={handleChange}
          />

          <input
            name="position"
            placeholder="Position"
            value={form.position}
            onChange={handleChange}
          />

          <input
            type="file"
            accept="image/*"
            onChange={(e) => setProfilePicture(e.target.files[0])}
          />

          <button type="submit">Update Profile</button>
        </form>

        {isMicrosoftUser ? (
          <div className="profile-form microsoft-info-card">
            <h2>Microsoft Account</h2>

            <p>
              You signed in using Microsoft. Password changes must be done
              through your Microsoft account.
            </p>
          </div>
        ) : (
          <form className="profile-form" onSubmit={changePassword}>
            <h2>Change Password</h2>

            <input
              type="password"
              name="currentPassword"
              placeholder="Current Password"
              value={passwordForm.currentPassword}
              onChange={handlePasswordInputChange}
            />

            <input
              type="password"
              name="newPassword"
              placeholder="New Password"
              value={passwordForm.newPassword}
              onChange={handlePasswordInputChange}
            />

            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm New Password"
              value={passwordForm.confirmPassword}
              onChange={handlePasswordInputChange}
            />

            <button type="submit">Change Password</button>
          </form>
        )}
      </div>
    </div>
  );
}

export default Profile;