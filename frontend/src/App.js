import React, { useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useLocation,
  Navigate,
} from "react-router-dom";
import { useMsal } from "@azure/msal-react";

import Dashboard from "./pages/Dashboard";
import Desktops from "./pages/Desktops";
import Laptops from "./pages/Laptops";
import Tablets from "./pages/Tablets";
import SIM from "./pages/SIM";
import Printers from "./pages/Printers";
import Switches from "./pages/Switches";
import Servers from "./pages/Servers";
import Projectors from "./pages/Projectors";
import WirelessAP from "./pages/WirelessAP";
import UPS from "./pages/UPS";
import SmartBoards from "./pages/SmartBoards";
import PortableTrackers from "./pages/PortableTrackers";
import FingerprintMachines from "./pages/FingerprintMachines";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import Users from "./pages/Users";
import Employees from "./pages/Employees";
import "./styles/app.css";

function Layout() {
  const location = useLocation();
  const { instance } = useMsal();

  const hideSidebar = location.pathname === "/login";
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));
  const isAdmin = user?.role === "admin";

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  if (!token && location.pathname !== "/login") {
    return <Navigate to="/login" replace />;
  }

  if (token && location.pathname === "/login") {
    return <Navigate to="/" replace />;
  }

  const formattedDate = currentTime.toLocaleDateString("en-GB", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "2-digit",
  });

  const formattedTime = currentTime.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const logout = async () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    const accounts = instance.getAllAccounts();

    if (accounts.length > 0) {
      await instance.logoutRedirect({
        account: accounts[0],
        postLogoutRedirectUri: "/login",
      });
    } else {
      window.location.href = "/login";
    }
  };

  return (
    <div className="app">
      {!hideSidebar && (
        <div className="sidebar">
          <div className="datetime-box">
            <div className="time">{formattedTime}</div>
            <div className="date">{formattedDate}</div>
          </div>

          <div className="logo-section">
            <img
              src="/swisstekaluminiumlogo.png"
              alt="Swisstek"
              className="logo"
            />
            <h2>IT Device Tracker</h2>
          </div>

          {user && (
            <div className="user-box">
              {user.profilePicture ? (
                <img
                  src={`https://it-device-tracker.onrender.com/uploads/${user.profilePicture}`}
                  alt="Profile"
                  className="sidebar-profile-img"
                />
              ) : (
                <div className="avatar">
                  {user.username?.charAt(0).toUpperCase()}
                </div>
              )}

              <h4>{user.username}</h4>
              <p>{user.role}</p>

              <Link to="/profile" className="profile-btn">
                My Profile
              </Link>

              <button onClick={logout}>Logout</button>
            </div>
          )}

          <Link to="/">Dashboard</Link>

          {isAdmin && <Link to="/employees">Employee Management</Link>}
          {isAdmin && <Link to="/users">User Management</Link>}

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
        </div>
      )}

      <div className={hideSidebar ? "auth-content" : "main-content"}>
        <Routes>
          <Route path="/" element={<Dashboard />} />

          <Route
            path="/employees"
            element={isAdmin ? <Employees /> : <Navigate to="/" replace />}
          />

          <Route
            path="/users"
            element={isAdmin ? <Users /> : <Navigate to="/" replace />}
          />

          <Route path="/desktops" element={<Desktops />} />
          <Route path="/laptops" element={<Laptops />} />
          <Route path="/tablets" element={<Tablets />} />
          <Route path="/dongles" element={<SIM />} />
          <Route path="/printers" element={<Printers />} />
          <Route path="/switches" element={<Switches />} />
          <Route path="/servers" element={<Servers />} />
          <Route path="/projectors" element={<Projectors />} />
          <Route path="/wireless-ap" element={<WirelessAP />} />
          <Route path="/ups" element={<UPS />} />
          <Route path="/smart-boards" element={<SmartBoards />} />
          <Route path="/portable-trackers" element={<PortableTrackers />} />
          <Route
            path="/fingerprint-machines"
            element={<FingerprintMachines />}
          />
          <Route path="/profile" element={<Profile />} />
          <Route path="/login" element={<Login />} />

          <Route path="*" element={<Navigate to="/" replace />} />
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