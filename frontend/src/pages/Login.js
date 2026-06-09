import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../styles/auth.css";

import { useMsal, useIsAuthenticated } from "@azure/msal-react";
import { InteractionStatus } from "@azure/msal-browser";
import { loginRequest } from "../auth/msalConfig";

const API_URL =
  window.location.hostname === "localhost"
    ? "http://localhost:5000/api"
    : "https://it-device-tracker.onrender.com/api";

function Login() {
  const navigate = useNavigate();

  const { instance, accounts, inProgress } = useMsal();
  const isAuthenticated = useIsAuthenticated();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [normalLoginLoading, setNormalLoginLoading] = useState(false);
  const [msLoginLoading, setMsLoginLoading] = useState(false);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  // Normal email/password login
  const loginUser = async (e) => {
    e.preventDefault();

    try {
      setNormalLoginLoading(true);

      const payload = {
        email: form.email.trim().toLowerCase(),
        password: form.password,
      };

      const res = await axios.post(`${API_URL}/auth/login`, payload);

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      navigate("/", { replace: true });
    } catch (err) {
      console.error("Normal login error:", err.response?.data || err.message);
      alert(err.response?.data?.message || "Login failed");
    } finally {
      setNormalLoginLoading(false);
    }
  };

  // Microsoft login button
  const handleMicrosoftLogin = async () => {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      setMsLoginLoading(true);

      await instance.loginRedirect(loginRequest);
    } catch (err) {
      console.error("Microsoft redirect login error:", err);
      alert(err.message || "Microsoft login failed");
      setMsLoginLoading(false);
    }
  };

  // Microsoft redirect return handling
  useEffect(() => {
    const microsoftBackendLogin = async () => {
      try {
        if (inProgress !== InteractionStatus.None) return;
        if (!isAuthenticated) return;
        if (!accounts || accounts.length === 0) return;

        const existingToken = localStorage.getItem("token");

        if (existingToken) {
          navigate("/", { replace: true });
          return;
        }

        setMsLoginLoading(true);

        const activeAccount = instance.getActiveAccount() || accounts[0];

        if (!instance.getActiveAccount()) {
          instance.setActiveAccount(activeAccount);
        }

        const tokenResponse = await instance.acquireTokenSilent({
          ...loginRequest,
          account: activeAccount,
        });

        if (!tokenResponse.idToken) {
          alert("Microsoft ID token not received");
          return;
        }

        const email =
          tokenResponse.account?.username ||
          activeAccount.username ||
          activeAccount.idTokenClaims?.preferred_username ||
          activeAccount.idTokenClaims?.email;

        const name =
          tokenResponse.account?.name ||
          activeAccount.name ||
          activeAccount.idTokenClaims?.name ||
          email;

        if (!email) {
          alert("Microsoft email not received");
          return;
        }

        const res = await axios.post(`${API_URL}/auth/microsoft-login`, {
          idToken: tokenResponse.idToken,
          email,
          name,
        });

        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));

        navigate("/", { replace: true });
      } catch (err) {
        console.error(
          "Microsoft backend login error:",
          err.response?.data || err.message
        );

        alert(
          err.response?.data?.message ||
            err.message ||
            "Microsoft login failed"
        );
      } finally {
        setMsLoginLoading(false);
      }
    };

    microsoftBackendLogin();
  }, [isAuthenticated, accounts, inProgress, instance, navigate]);

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

          <button type="submit" disabled={normalLoginLoading}>
            {normalLoginLoading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="login-divider">
          <span>OR</span>
        </div>

        <button
          type="button"
          className="microsoft-btn"
          onClick={handleMicrosoftLogin}
          disabled={msLoginLoading || inProgress !== InteractionStatus.None}
        >
          {msLoginLoading || inProgress !== InteractionStatus.None
            ? "Signing in..."
            : "Sign in with Microsoft"}
        </button>
      </div>
    </div>
  );
}

export default Login;