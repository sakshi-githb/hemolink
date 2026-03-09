import React, { useState } from "react";
import Layout from "../components/shared/Layout/Layout";
import { useSelector } from "react-redux";
import API from "../services/API";

const Settings = () => {
  const { user } = useSelector((state) => state.auth);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setSuccess("");
    setError("");
    if (!currentPassword || !newPassword || !confirmPassword) {
      return setError("Please fill all fields");
    }
    if (newPassword !== confirmPassword) {
      return setError("New passwords do not match");
    }
    if (newPassword.length < 6) {
      return setError("New password must be at least 6 characters");
    }
    if (newPassword === currentPassword) {
      return setError("New password must be different from current password");
    }
    try {
      setLoading(true);
      const { data } = await API.post("/auth/change-password", {
        currentPassword,
        newPassword,
      });
      if (data?.success) {
        setSuccess("✅ Password changed successfully!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setError(data?.message || "Something went wrong");
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Error changing password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
        .set-page { font-family: 'DM Sans', sans-serif; max-width: 560px; }
        .set-title { font-family: 'Syne', sans-serif; font-size: 26px; font-weight: 700; color: #fff; margin-bottom: 4px; }
        .set-title span { background: linear-gradient(90deg, #c084fc, #f472b6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .set-subtitle { font-size: 14px; color: rgba(255,255,255,0.4); margin-bottom: 32px; }
        .set-profile { background: rgba(168,85,247,0.07); border: 1px solid rgba(168,85,247,0.2); border-radius: 18px; padding: 22px; margin-bottom: 28px; display: flex; align-items: center; gap: 16px; }
        .set-avatar { width: 52px; height: 52px; border-radius: 14px; background: linear-gradient(135deg, #9333ea, #ec4899); display: flex; align-items: center; justify-content: center; font-size: 22px; flex-shrink: 0; }
        .set-profile-name { font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 700; color: #fff; margin-bottom: 3px; }
        .set-profile-email { font-size: 13px; color: rgba(255,255,255,0.4); }
        .set-profile-role { display: inline-block; padding: 2px 10px; border-radius: 6px; font-size: 10px; font-weight: 600; background: rgba(168,85,247,0.15); color: #c084fc; margin-top: 4px; }
        .set-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 18px; padding: 24px; }
        .set-card-title { font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 700; color: #fff; margin-bottom: 20px; }
        .set-field { margin-bottom: 18px; }
        .set-field label { display: block; font-size: 11px; font-weight: 600; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 8px; }
        .set-field input { width: 100%; padding: 12px 16px; border-radius: 12px; background: rgba(255,255,255,0.06); border: 1.5px solid rgba(255,255,255,0.1); color: #fff; font-size: 14px; font-family: 'DM Sans', sans-serif; outline: none; transition: all 0.2s; }
        .set-field input:focus { border-color: #a855f7; background: rgba(168,85,247,0.08); }
        .set-field input::placeholder { color: rgba(255,255,255,0.2); }
        .set-success { padding: 12px 16px; border-radius: 10px; background: rgba(34,197,94,0.1); border: 1px solid rgba(34,197,94,0.25); font-size: 13px; color: #4ade80; margin-bottom: 16px; }
        .set-error { padding: 12px 16px; border-radius: 10px; background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.25); font-size: 13px; color: #f87171; margin-bottom: 16px; }
        .set-btn { width: 100%; padding: 14px; border-radius: 12px; border: none; cursor: pointer; background: linear-gradient(135deg, #9333ea, #ec4899); color: white; font-size: 15px; font-weight: 600; font-family: 'DM Sans', sans-serif; transition: all 0.2s; box-shadow: 0 4px 16px rgba(147,51,234,0.3); }
        .set-btn:hover { transform: translateY(-2px); }
        .set-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
        .set-hint { font-size: 12px; color: rgba(255,255,255,0.25); margin-top: 6px; }
      `}</style>

      <div className="set-page">
        <div className="set-title">
          Account <span>Settings</span> ⚙️
        </div>
        <div className="set-subtitle">Manage your HemoLink account</div>

        {/* Profile info */}
        <div className="set-profile">
          <div className="set-avatar">
            {user?.role === "donar"
              ? "🩸"
              : user?.role === "hospital"
                ? "🏥"
                : user?.role === "organisation"
                  ? "🏢"
                  : "🛡️"}
          </div>
          <div>
            <div className="set-profile-name">
              {user?.name ||
                user?.organisationName ||
                user?.hospitalName ||
                "User"}
            </div>
            <div className="set-profile-email">{user?.email}</div>
            <div className="set-profile-role">
              {user?.role === "donar"
                ? "Donor"
                : user?.role === "organisation"
                  ? "Organisation"
                  : user?.role === "hospital"
                    ? "Hospital"
                    : "Admin"}
            </div>
          </div>
        </div>

        {/* Change password */}
        <div className="set-card">
          <div className="set-card-title">🔑 Change Password</div>

          {success && <div className="set-success">{success}</div>}
          {error && <div className="set-error">⚠️ {error}</div>}

          <div className="set-field">
            <label>Current Password</label>
            <input
              type="password"
              placeholder="Enter your current password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>
          <div className="set-field">
            <label>New Password</label>
            <input
              type="password"
              placeholder="At least 6 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <div className="set-hint">Must be at least 6 characters</div>
          </div>
          <div className="set-field">
            <label>Confirm New Password</label>
            <input
              type="password"
              placeholder="Repeat new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          <button
            className="set-btn"
            onClick={handleChangePassword}
            disabled={loading}
          >
            {loading ? "Saving..." : "Change Password →"}
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default Settings;
