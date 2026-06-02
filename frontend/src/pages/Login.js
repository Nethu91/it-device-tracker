import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../styles/auth.css";

import { useMsal } from "@azure/msal-react";
import { loginRequest } from "../auth/msalConfig";

const API_URL = "https://it-device-tracker.onrender.com/api";

function Login() {
  const navigate = useNavigate();
  const { instance, accounts } = useMsal();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  useEffect(() => {
    const microsoftBackendLogin = async () => {
      const microsoftAccount = accounts[0];

      if (!microsoftAccount) return;

      try {
        const res = await axios.post(`${API_URL}/auth/microsoft-login`, {
          name: microsoftAccount.name,
          email: microsoftAccount.username,
        });

        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));

        navigate("/", { replace: true });
      } catch (err) {
        console.error("Microsoft backend login error:", err);
        alert(err.response?.data?.message || "Microsoft backend login failed");
      }
    };

    microsoftBackendLogin();
  }, [accounts, navigate]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const loginUser = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post(`${API_URL}/auth/login`, form);

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      navigate("/", { replace: true });
    } catch (err) {
      alert(err.response?.data?.message || "Login failed");
    }
  };

  const handleMicrosoftLogin = async () => {
    try {
      await instance.loginRedirect(loginRequest);
    } catch (err) {
      console.error("Microsoft login error:", err);
      alert(err.message || "Microsoft login failed");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <img src="/swisstekaluminiumlogo.png" alt="Swisstek" />

        <h2>Login</h2>
        <p>Sign in to IT Device Tracker</p>

        <form onSubmit={loginUser}>
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

          <button type="submit">Sign In</button>
        </form>

        <div className="login-divider">
          <span>OR</span>
        </div>

        <button
          type="button"
          className="microsoft-btn"
          onClick={handleMicrosoftLogin}
        >
          Sign in with Microsoft
        </button>
      </div>
    </div>
  );
}

export default Login;