import React, { useEffect, useState } from "react";
import {
  BrowserRouter, Routes, Route, Link, useLocation, Navigate,
} from "react-router-dom";
import { useMsal } from "@azure/msal-react";

import Dashboard           from "./pages/Dashboard";
import Desktops            from "./pages/Desktops";
import Laptops             from "./pages/Laptops";
import Tablets             from "./pages/Tablets";
import SIM                 from "./pages/SIM";
import Printers            from "./pages/Printers";
import Switches            from "./pages/Switches";
import Servers             from "./pages/Servers";
import Projectors          from "./pages/Projectors";
import WirelessAP          from "./pages/WirelessAP";
import UPS                 from "./pages/UPS";
import SmartBoards         from "./pages/SmartBoards";
import PortableTrackers    from "./pages/PortableTrackers";
import FingerprintMachines from "./pages/FingerprintMachines";
import DisposedDevices     from "./pages/DisposedDevices";
import VacantDevices       from "./pages/VacantDevices";   // ✅ NEW

import Login    from "./pages/Login";
import Profile  from "./pages/Profile";
import Employees from "./pages/Employees";

import InterfaceBuilder  from "./pages/InterfaceBuilder";
import CustomDevicePage  from "./pages/CustomDevicePage";

import "./styles/app.css";

function Layout() {
  const location  = useLocation();
  const { instance } = useMsal();

  const hideSidebar = location.pathname === "/login";
  const token       = localStorage.getItem("token");

  // ✅ user is now state, so the sidebar re-renders when the profile updates
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const isAdmin = String(user?.role || "").toLowerCase() === "admin";

  // ✅ Refresh sidebar's user data whenever Profile.js saves an update
  useEffect(() => {
    const refreshUser = () => {
      const storedUser = localStorage.getItem("user");
      setUser(storedUser ? JSON.parse(storedUser) : null);
    };

    window.addEventListener("userUpdated", refreshUser);
    window.addEventListener("storage", refreshUser);

    return () => {
      window.removeEventListener("userUpdated", refreshUser);
      window.removeEventListener("storage", refreshUser);
    };
  }, []);

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!token && location.pathname !== "/login") return <Navigate to="/login" replace />;
  if (token  && location.pathname === "/login")  return <Navigate to="/"      replace />;

  const formattedDate = currentTime.toLocaleDateString("en-GB", {
    weekday: "short", year: "numeric", month: "short", day: "2-digit",
  });
  const formattedTime = currentTime.toLocaleTimeString("en-US", {
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });

  const logout = async () => {
    localStorage.clear();
    sessionStorage.clear();
    try {
      const accounts = instance.getAllAccounts();
      if (accounts.length > 0) {
        await instance.logoutRedirect({
          account: accounts[0],
          postLogoutRedirectUri: window.location.origin + "/login",
        });
      } else {
        window.location.replace("/login");
      }
    } catch (err) {
      console.error("Logout error:", err);
      window.location.replace("/login");
    }
  };

  // ✅ profilePicture is now a full Cloudinary URL — use it directly
  const profileImageUrl = user?.profilePicture || null;

  return (
    <div className="app">
      {!hideSidebar && (
        <div className="sidebar">
          <div className="datetime-box">
            <div className="time">{formattedTime}</div>
            <div className="date">{formattedDate}</div>
          </div>

          <div className="logo-section">
            <img src="/swisstekaluminiumlogo.png" alt="Swisstek" className="logo" />
            <h2>IT Device Tracker</h2>
          </div>

          <div className="user-box">
            {profileImageUrl ? (
              <img src={profileImageUrl} alt="Profile" className="sidebar-profile-img" />
            ) : (
              <div className="avatar">
                {(user?.username || user?.email || "U").charAt(0).toUpperCase()}
              </div>
            )}
            <h4>{user?.username || "User"}</h4>
            <p>{isAdmin ? "Admin" : "User"}</p>
            <Link to="/profile" className="profile-btn">My Profile</Link>
            <button type="button" onClick={logout}>Logout</button>
          </div>

          <Link to="/">Dashboard</Link>

          {isAdmin && (
            <>
              <Link to="/employees">Employee & Access Management</Link>
              <Link to="/interface-builder">GUI Builder</Link>
            </>
          )}

          <Link to="/custom-devices">Custom Devices</Link>
          <Link to="/desktops">Desktops</Link>
          <Link to="/laptops">Laptops</Link>
          <Link to="/tablets">Tablets</Link>
          <Link to="/dongles">SIM</Link>
          <Link to="/printers">Printers</Link>
          <Link to="/switches">Switches</Link>
          <Link to="/servers">Servers</Link>
          <Link to="/projectors">Projectors</Link>
          <Link to="/wireless-ap">Wireless AP</Link>
          <Link to="/ups">UPS</Link>
          <Link to="/smart-boards">Smart Board & TV & Monitor</Link>
          <Link to="/portable-trackers">Portable Trackers</Link>
          <Link to="/fingerprint-machines">Fingerprint Machines</Link>

          {/* ✅ Disposed Devices — Admin only */}
          {isAdmin && (
            <Link to="/disposed-devices" style={{ color: "#f97316", fontWeight: 600 }}>
              🗑️ Disposed Devices
            </Link>
          )}

          {/* ✅ Vacant Devices — Admin only */}
          {isAdmin && (
            <Link to="/vacant-devices" style={{ color: "#22c55e", fontWeight: 600 }}>
              ✅ Vacant Devices
            </Link>
          )}
        </div>
      )}

      <div className={hideSidebar ? "auth-content" : "main-content"}>
        <Routes>
          <Route path="/"          element={<Dashboard />} />
          <Route path="/employees" element={isAdmin ? <Employees />       : <Navigate to="/" replace />} />
          <Route path="/interface-builder" element={isAdmin ? <InterfaceBuilder /> : <Navigate to="/" replace />} />
          <Route path="/custom-devices"    element={<CustomDevicePage />} />
          <Route path="/desktops"          element={<Desktops />} />
          <Route path="/laptops"           element={<Laptops />} />
          <Route path="/tablets"           element={<Tablets />} />
          <Route path="/dongles"           element={<SIM />} />
          <Route path="/printers"          element={<Printers />} />
          <Route path="/switches"          element={<Switches />} />
          <Route path="/servers"           element={<Servers />} />
          <Route path="/projectors"        element={<Projectors />} />
          <Route path="/wireless-ap"       element={<WirelessAP />} />
          <Route path="/ups"               element={<UPS />} />
          <Route path="/smart-boards"      element={<SmartBoards />} />
          <Route path="/portable-trackers" element={<PortableTrackers />} />
          <Route path="/fingerprint-machines" element={<FingerprintMachines />} />

          {/* ✅ Disposed Devices route — Admin only */}
          <Route path="/disposed-devices" element={isAdmin ? <DisposedDevices /> : <Navigate to="/" replace />} />

          {/* ✅ Vacant Devices route — Admin only */}
          <Route path="/vacant-devices" element={isAdmin ? <VacantDevices /> : <Navigate to="/" replace />} />

          <Route path="/profile" element={<Profile />} />
          <Route path="/login"   element={<Login />} />
          <Route path="*"        element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  );
}

export default App;