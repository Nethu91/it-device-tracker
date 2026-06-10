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

  /* =========================================
     ADMIN EMAIL / USERNAME + PASSWORD LOGIN
     Only admin accounts from users collection
  ========================================= */

  const loginUser = async (e) => {
    e.preventDefault();

    try {
      setNormalLoginLoading(true);

      const loginId = form.email.trim();
      const password = form.password;

      if (!loginId) {
        alert("Please enter admin email or username");
        return;
      }

      if (!password) {
        alert("Please enter admin password");
        return;
      }

      localStorage.removeItem("token");
      localStorage.removeItem("user");

      const normalizedLoginId = loginId.toLowerCase();

      const payload = {
        email: normalizedLoginId,
        username: normalizedLoginId,
        password,
      };

      console.log("ADMIN LOGIN PAYLOAD:", {
        email: payload.email,
        username: payload.username,
        password: "hidden",
      });

      const res = await axios.post(`${API_URL}/auth/login`, payload);

      if (String(res.data.user?.role || "").toLowerCase() !== "admin") {
        alert("Normal users must login with Microsoft");
        return;
      }

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      navigate("/", { replace: true });
    } catch (err) {
      console.error("Admin login error:", err.response?.data || err.message);

      alert(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Admin login failed"
      );
    } finally {
      setNormalLoginLoading(false);
    }
  };

  /* =========================================
     EMPLOYEE MICROSOFT LOGIN
     Employees use company Microsoft email only
  ========================================= */

  const handleMicrosoftLogin = async () => {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      sessionStorage.setItem("msLoginStarted", "true");

      setMsLoginLoading(true);

      await instance.loginRedirect(loginRequest);
    } catch (err) {
      console.error("Microsoft redirect login error:", err);
      alert(err.message || "Microsoft login failed");
      setMsLoginLoading(false);
    }
  };

  /* =========================================
     MICROSOFT REDIRECT RETURN HANDLING
     Microsoft login always becomes employee/user login
  ========================================= */

  useEffect(() => {
    const microsoftBackendLogin = async () => {
      try {
        if (inProgress !== InteractionStatus.None) return;

        const msLoginStarted =
          sessionStorage.getItem("msLoginStarted") === "true";

        if (!msLoginStarted) return;
        if (!isAuthenticated) return;
        if (!accounts || accounts.length === 0) return;

        const existingToken = localStorage.getItem("token");

        if (existingToken) {
          sessionStorage.removeItem("msLoginStarted");
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

        sessionStorage.removeItem("msLoginStarted");

        navigate("/", { replace: true });
      } catch (err) {
        console.error(
          "Microsoft backend login error:",
          err.response?.data || err.message
        );

        sessionStorage.removeItem("msLoginStarted");

        alert(
          err.response?.data?.message ||
            err.response?.data?.error ||
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

        <h2>IT Device Tracker</h2>
        <p>Secure access portal for Swisstek Aluminium</p>

        <div className="login-section">
          <h3>Admin Login</h3>
          <p className="login-note">
            Admins can sign in using admin email / username and password.
          </p>

          <form onSubmit={loginUser}>
            <input
              name="email"
              type="text"
              placeholder="Admin Email / Username"
              value={form.email}
              onChange={handleChange}
              autoComplete="username"
              required
            />

            <input
              name="password"
              type="password"
              placeholder="Admin Password"
              value={form.password}
              onChange={handleChange}
              autoComplete="current-password"
              required
            />

            <button type="submit" disabled={normalLoginLoading}>
              {normalLoginLoading ? "Signing in..." : "Admin Sign In"}
            </button>
          </form>
        </div>

        <div className="login-divider">
          <span>OR</span>
        </div>

        <div className="login-section">
          <h3>Employee Login</h3>
          <p className="login-note">
            Employees must use Microsoft company email to sign in.
          </p>

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
    </div>
  );
}

export default Login;