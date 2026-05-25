import React, { useState } from "react";
import axios from "axios";
import "../styles/profile.css";

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
        `https://it-device-tracker.onrender.com/api/auth/profile/${user.id}`,
        data
      );

      localStorage.setItem(
        "user",
        JSON.stringify(res.data.user)
      );

      setUser(res.data.user);

      alert("Profile updated successfully");
    } catch (err) {
      alert(
        err.response?.data?.message ||
          "Profile update failed"
      );
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();

    if (
      passwordForm.newPassword !==
      passwordForm.confirmPassword
    ) {
      alert("New passwords do not match");
      return;
    }

    try {
      await axios.put(
        `https://it-device-tracker.onrender.com/api/auth/change-password/${user.id}`,
        {
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }
      );

      alert("Password changed successfully");

      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err) {
      alert(
        err.response?.data?.message ||
          "Password change failed"
      );
    }
  };

  const imageUrl = user?.profilePicture
    ? `https://it-device-tracker.onrender.com/uploads/${user.profilePicture}`
    : null;

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
                {user?.username?.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <h2>{user?.username}</h2>
          <p>{user?.role}</p>
          <p>{user?.email}</p>
        </div>

        <form
          className="profile-form"
          onSubmit={updateProfile}
        >
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
            onChange={(e) =>
              setProfilePicture(e.target.files[0])
            }
          />

          <button type="submit">
            Update Profile
          </button>
        </form>

        <form
          className="profile-form"
          onSubmit={changePassword}
        >
          <h2>Change Password</h2>

          <input
            type="password"
            placeholder="Current Password"
            value={passwordForm.currentPassword}
            onChange={(e) =>
              setPasswordForm({
                ...passwordForm,
                currentPassword: e.target.value,
              })
            }
          />

          <input
            type="password"
            placeholder="New Password"
            value={passwordForm.newPassword}
            onChange={(e) =>
              setPasswordForm({
                ...passwordForm,
                newPassword: e.target.value,
              })
            }
          />

          <input
            type="password"
            placeholder="Confirm New Password"
            value={passwordForm.confirmPassword}
            onChange={(e) =>
              setPasswordForm({
                ...passwordForm,
                confirmPassword: e.target.value,
              })
            }
          />

          <button type="submit">
            Change Password
          </button>
        </form>
      </div>
    </div>
  );
}

export default Profile;