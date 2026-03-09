import React, { useEffect, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import API from "../../../services/API";

const Sidebar = () => {
  const { user } = useSelector((state) => state.auth);
  const location = useLocation();
  const [lowStock, setLowStock] = useState([]);

  // Check low inventory for org role
  useEffect(() => {
    if (user?.role !== "organisation") return;
    const checkLow = async () => {
      try {
        const { data } = await API.get("/inventory/get-blood-availability");
        if (data?.success) {
          const myOrg = data.availability?.find(
            (a) => a.organisation?._id === user?._id,
          );
          if (myOrg) {
            const low = myOrg.bloodData.filter(
              (b) => b.available > 0 && b.available < 500,
            );
            setLowStock(low);
          }
        }
      } catch (e) {
        console.log(e);
      }
    };
    checkLow();
    const interval = setInterval(checkLow, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const donorMenu = [
    { path: "/", label: "Home", icon: "🏠" },
    { path: "/donation", label: "My Donations", icon: "🩸" },
    { path: "/orgnaisation", label: "Organisations", icon: "🏢" },
    { path: "/settings", label: "Settings", icon: "⚙️" },
  ];
  const orgMenu = [
    { path: "/", label: "Inventory", icon: "🗃️" },
    { path: "/donar", label: "Donors", icon: "🩸" },
    { path: "/hospital", label: "Hospitals", icon: "🏥" },
    { path: "/org-camps", label: "My Camps", icon: "🏕️" },
    { path: "/org-requests", label: "Blood Requests", icon: "📋" },
    { path: "/settings", label: "Settings", icon: "⚙️" },
  ];
  const hospitalMenu = [
    { path: "/", label: "Home", icon: "🏠" },
    { path: "/orgnaisation", label: "Blood Availability", icon: "🩸" },
    { path: "/consumer", label: "My Requests", icon: "📋" },
    { path: "/settings", label: "Settings", icon: "⚙️" },
  ];
  const adminMenu = [
    { path: "/admin", label: "Dashboard", icon: "🛡️" },
    { path: "/donar-list", label: "Donor List", icon: "🩸" },
    { path: "/hospital-list", label: "Hospital List", icon: "🏥" },
    { path: "/org-list", label: "Organisation List", icon: "🏢" },
    { path: "/settings", label: "Settings", icon: "⚙️" },
  ];

  const menuMap = {
    donar: donorMenu,
    organisation: orgMenu,
    hospital: hospitalMenu,
    admin: adminMenu,
  };
  const menu = menuMap[user?.role] || [];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&display=swap');
        .hemo-sidebar { position: fixed; left: 0; top: 64px; bottom: 0; width: 220px; background: rgba(13,0,21,0.95); border-right: 1px solid rgba(168,85,247,0.12); padding: 20px 12px; display: flex; flex-direction: column; gap: 4px; backdrop-filter: blur(20px); overflow-y: auto; }
        .hemo-sidebar-section { font-size: 10px; font-weight: 600; color: rgba(255,255,255,0.25); text-transform: uppercase; letter-spacing: 1px; padding: 0 12px; margin-bottom: 8px; margin-top: 4px; }
        .hemo-menu-item { display: flex; align-items: center; gap: 10px; padding: 11px 14px; border-radius: 12px; text-decoration: none; color: rgba(255,255,255,0.5); font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 500; transition: all 0.2s ease; border: 1px solid transparent; }
        .hemo-menu-item:hover { background: rgba(168,85,247,0.1); color: rgba(255,255,255,0.85); border-color: rgba(168,85,247,0.2); }
        .hemo-menu-item.active { background: rgba(168,85,247,0.18); color: #e879f9; border-color: rgba(168,85,247,0.3); box-shadow: 0 0 16px rgba(168,85,247,0.15); }
        .hemo-menu-icon { font-size: 16px; }
        .hemo-low-stock { margin: 8px 4px; padding: 10px 12px; border-radius: 12px; background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2); }
        .hemo-low-stock-title { font-size: 10px; font-weight: 700; color: #f87171; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 6px; display: flex; align-items: center; gap: 5px; }
        .hemo-low-pill { display: inline-block; padding: 2px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; background: rgba(239,68,68,0.15); color: #f87171; margin: 2px 3px 2px 0; }
        .hemo-sidebar-bottom { margin-top: auto; padding: 14px; border-radius: 14px; background: rgba(168,85,247,0.06); border: 1px solid rgba(168,85,247,0.12); }
        .hemo-sidebar-privacy { font-size: 11px; color: rgba(255,255,255,0.3); line-height: 1.5; font-family: 'DM Sans', sans-serif; }
        .hemo-sidebar-privacy span { color: #a855f7; }
      `}</style>
      <div className="hemo-sidebar">
        <div className="hemo-sidebar-section">Navigation</div>
        {menu.map((item) => (
          <Link
            key={item.path + item.label}
            to={item.path}
            className={`hemo-menu-item ${location.pathname === item.path ? "active" : ""}`}
          >
            <span className="hemo-menu-icon">{item.icon}</span>
            {item.label}
          </Link>
        ))}

        {/* Low stock warning for org */}
        {user?.role === "organisation" && lowStock.length > 0 && (
          <div className="hemo-low-stock">
            <div className="hemo-low-stock-title">⚠️ Low Stock</div>
            {lowStock.map((b) => (
              <span key={b.bloodGroup} className="hemo-low-pill">
                {b.bloodGroup} {b.available}ml
              </span>
            ))}
          </div>
        )}

        <div className="hemo-sidebar-bottom">
          <div className="hemo-sidebar-privacy">
            🔒 <span>Your data is private.</span> Hospitals & organisations
            never see your personal details.
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
