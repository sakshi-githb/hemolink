import React from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useSelector } from "react-redux";

const Header = () => {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500&display=swap');
        .hemo-header {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          height: 64px;
          background: rgba(13,0,21,0.85);
          backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(168,85,247,0.15);
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 28px;
          box-shadow: 0 4px 24px rgba(0,0,0,0.3);
        }
        .hemo-header-brand {
          display: flex; align-items: center; gap: 10px; text-decoration: none;
        }
        .hemo-header-logo {
          width: 36px; height: 36px; border-radius: 10px;
          background: linear-gradient(135deg, #a855f7, #ec4899);
          display: flex; align-items: center; justify-content: center;
          font-size: 17px;
          box-shadow: 0 0 14px rgba(168,85,247,0.5);
        }
        .hemo-header-name {
          font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 800;
          background: linear-gradient(90deg, #c084fc, #f472b6);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text; letter-spacing: -0.3px;
        }
        .hemo-header-right { display: flex; align-items: center; gap: 16px; }
        .hemo-header-user {
          display: flex; align-items: center; gap: 8px;
          padding: 6px 14px; border-radius: 20px;
          background: rgba(168,85,247,0.12);
          border: 1px solid rgba(168,85,247,0.2);
        }
        .hemo-header-avatar {
          width: 28px; height: 28px; border-radius: 50%;
          background: linear-gradient(135deg, #a855f7, #ec4899);
          display: flex; align-items: center; justify-content: center;
          font-size: 13px; color: white; font-weight: 600;
        }
        .hemo-header-username {
          font-family: 'DM Sans', sans-serif; font-size: 14px;
          color: rgba(255,255,255,0.85); font-weight: 500;
        }
        .hemo-header-role {
          font-size: 11px; padding: 2px 8px; border-radius: 10px;
          background: linear-gradient(135deg, #9333ea, #ec4899);
          color: white; font-weight: 600; text-transform: capitalize;
        }
        .hemo-logout-btn {
          padding: 8px 18px; border-radius: 10px; border: none; cursor: pointer;
          background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.3);
          color: #f87171; font-size: 13px; font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          transition: all 0.2s;
        }
        .hemo-logout-btn:hover {
          background: rgba(239,68,68,0.25); color: #fca5a5;
        }
      `}</style>
      <header className="hemo-header">
        <Link to="/" className="hemo-header-brand">
          <div className="hemo-header-logo">🩸</div>
          <span className="hemo-header-name">HemoLink</span>
        </Link>
        <div className="hemo-header-right">
          <div className="hemo-header-user">
            <div className="hemo-header-avatar">
              {(user?.name ||
                user?.hospitalName ||
                user?.organisationName ||
                "U")[0].toUpperCase()}
            </div>
            <span className="hemo-header-username">
              {user?.name || user?.hospitalName || user?.organisationName}
            </span>
            <span className="hemo-header-role">
              {user?.role === "donar" ? "Donor" : user?.role}
            </span>
          </div>
          <button className="hemo-logout-btn" onClick={handleLogout}>
            Sign out
          </button>
        </div>
      </header>
    </>
  );
};

export default Header;
