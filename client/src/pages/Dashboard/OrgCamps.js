import React, { useEffect, useState } from "react";
import Layout from "../../components/shared/Layout/Layout";
import API from "../../services/API";
import moment from "moment";

const OrgCamps = () => {
  const [camps, setCamps] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [campName, setCampName] = useState("");
  const [address, setAddress] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [attendanceId, setAttendanceId] = useState(null);
  const [attendanceVal, setAttendanceVal] = useState("");
  const [showPast, setShowPast] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  const getCamps = async () => {
    try {
      const { data } = await API.get("/camp/get-org-camps");
      if (data?.success) setCamps(data?.camps);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getCamps();
  }, []);

  const handleCreate = async () => {
    try {
      if (!campName || !address || !date || !time)
        return alert("Please fill all fields");
      if (date < today) return alert("Camp date cannot be in the past");
      setSubmitting(true);
      const { data } = await API.post("/camp/create-camp", {
        campName,
        address,
        date,
        time,
      });
      if (data?.success) {
        setShowForm(false);
        setCampName("");
        setAddress("");
        setDate("");
        setTime("");
        getCamps();
      }
    } catch (error) {
      alert(error?.response?.data?.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Remove this camp?")) return;
    try {
      await API.delete(`/camp/delete-camp/${id}`);
      getCamps();
    } catch (error) {
      console.log(error);
    }
  };

  const handleAttendance = async (id) => {
    try {
      if (!attendanceVal || isNaN(attendanceVal))
        return alert("Enter a valid number");
      await API.put(`/camp/update-attendance/${id}`, {
        attendance: attendanceVal,
      });
      setAttendanceId(null);
      setAttendanceVal("");
      getCamps();
    } catch (error) {
      alert("Error saving attendance");
    }
  };

  const upcomingCamps = camps.filter((c) => c.date >= today);
  const pastCamps = camps.filter((c) => c.date < today);
  const displayCamps = showPast ? camps : upcomingCamps;

  const lowInventoryGroups = []; // placeholder — org will see this on homepage

  return (
    <Layout>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
        .camp-page { font-family: 'DM Sans', sans-serif; }
        .camp-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 28px; flex-wrap: wrap; gap: 12px; }
        .camp-title { font-family: 'Syne', sans-serif; font-size: 26px; font-weight: 700; color: #fff; }
        .camp-title span { background: linear-gradient(90deg, #c084fc, #f472b6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .camp-subtitle { font-size: 14px; color: rgba(255,255,255,0.4); margin-top: 4px; }
        .camp-btn { padding: 11px 22px; border-radius: 12px; border: none; cursor: pointer; background: linear-gradient(135deg, #9333ea, #ec4899); color: white; font-size: 14px; font-weight: 600; font-family: 'DM Sans', sans-serif; box-shadow: 0 4px 16px rgba(147,51,234,0.35); transition: all 0.2s; }
        .camp-btn:hover { transform: translateY(-2px); }
        .camp-form { background: rgba(168,85,247,0.07); border: 1px solid rgba(168,85,247,0.2); border-radius: 20px; padding: 28px; margin-bottom: 28px; animation: slideDown 0.3s ease; }
        @keyframes slideDown { from { opacity:0; transform:translateY(-10px); } to { opacity:1; transform:translateY(0); } }
        .camp-form-title { font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 700; color: #fff; margin-bottom: 18px; }
        .camp-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
        @media(max-width:600px){ .camp-grid { grid-template-columns: 1fr; } }
        .camp-field label { display: block; font-size: 11px; font-weight: 600; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 8px; }
        .camp-field input { width: 100%; padding: 12px 14px; border-radius: 12px; background: rgba(255,255,255,0.06); border: 1.5px solid rgba(255,255,255,0.1); color: #fff; font-size: 14px; font-family: 'DM Sans', sans-serif; outline: none; transition: all 0.2s; }
        .camp-field input:focus { border-color: #a855f7; background: rgba(168,85,247,0.1); }
        .camp-field input::placeholder { color: rgba(255,255,255,0.2); }
        .camp-actions { display: flex; gap: 12px; }
        .camp-submit { padding: 12px 28px; border-radius: 12px; border: none; cursor: pointer; background: linear-gradient(135deg, #9333ea, #ec4899); color: white; font-size: 14px; font-weight: 600; font-family: 'DM Sans', sans-serif; transition: all 0.2s; }
        .camp-submit:disabled { opacity: 0.6; cursor: not-allowed; }
        .camp-cancel { padding: 12px 22px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); background: transparent; color: rgba(255,255,255,0.5); font-size: 14px; cursor: pointer; font-family: 'DM Sans', sans-serif; }
        .camp-info { padding: 14px 18px; border-radius: 12px; margin-bottom: 20px; background: rgba(99,102,241,0.08); border: 1px solid rgba(99,102,241,0.2); font-size: 13px; color: rgba(255,255,255,0.5); line-height: 1.6; }
        .camp-info strong { color: rgba(255,255,255,0.8); }
        .camp-filter-row { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; }
        .camp-filter-label { font-size: 13px; color: rgba(255,255,255,0.4); }
        .camp-filter-btn { padding: 7px 16px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.1); background: transparent; color: rgba(255,255,255,0.4); font-size: 12px; font-weight: 600; font-family: 'DM Sans', sans-serif; cursor: pointer; transition: all 0.2s; }
        .camp-filter-btn.active { background: rgba(168,85,247,0.15); border-color: rgba(168,85,247,0.35); color: #e879f9; }
        .camp-count { font-size: 13px; color: rgba(255,255,255,0.3); margin-bottom: 16px; }
        .camp-count span { color: #a855f7; font-weight: 600; }
        .camp-list { display: flex; flex-direction: column; gap: 14px; }
        .camp-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 20px; transition: border-color 0.2s; }
        .camp-card:hover { border-color: rgba(168,85,247,0.3); }
        .camp-card.past { border-left: 3px solid rgba(255,255,255,0.1); opacity: 0.75; }
        .camp-card.upcoming { border-left: 3px solid #a855f7; }
        .camp-card-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 14px; flex-wrap: wrap; margin-bottom: 14px; }
        .camp-card-left { display: flex; gap: 14px; align-items: flex-start; }
        .camp-card-icon { font-size: 26px; flex-shrink: 0; }
        .camp-card-name { font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 700; color: #fff; margin-bottom: 6px; }
        .camp-card-detail { font-size: 13px; color: rgba(255,255,255,0.45); margin-bottom: 3px; }
        .camp-badge { display: inline-block; padding: 2px 10px; border-radius: 6px; font-size: 10px; font-weight: 600; margin-left: 8px; }
        .camp-badge.active { background: rgba(34,197,94,0.15); color: #4ade80; }
        .camp-badge.past { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.35); }
        .camp-card-actions { display: flex; gap: 8px; flex-wrap: wrap; }
        .camp-del-btn { padding: 8px 16px; border-radius: 10px; border: 1px solid rgba(239,68,68,0.25); background: rgba(239,68,68,0.08); color: #f87171; font-size: 12px; font-weight: 600; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 0.2s; }
        .camp-del-btn:hover { background: rgba(239,68,68,0.18); }
        .camp-attend-btn { padding: 8px 16px; border-radius: 10px; border: 1px solid rgba(168,85,247,0.25); background: rgba(168,85,247,0.08); color: #c084fc; font-size: 12px; font-weight: 600; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 0.2s; }
        .camp-attend-btn:hover { background: rgba(168,85,247,0.18); }
        .camp-attend-form { display: flex; gap: 8px; align-items: center; margin-top: 12px; flex-wrap: wrap; padding: 12px 14px; border-radius: 10px; background: rgba(168,85,247,0.07); border: 1px solid rgba(168,85,247,0.2); }
        .camp-attend-input { padding: 9px 14px; border-radius: 9px; background: rgba(255,255,255,0.06); border: 1.5px solid rgba(255,255,255,0.1); color: #fff; font-size: 14px; font-family: 'DM Sans', sans-serif; outline: none; width: 120px; }
        .camp-attend-input:focus { border-color: #a855f7; }
        .camp-attend-save { padding: 9px 18px; border-radius: 9px; border: none; cursor: pointer; background: linear-gradient(135deg, #9333ea, #ec4899); color: white; font-size: 12px; font-weight: 600; font-family: 'DM Sans', sans-serif; }
        .camp-attend-cancel { padding: 9px 14px; border-radius: 9px; border: 1px solid rgba(255,255,255,0.1); background: transparent; color: rgba(255,255,255,0.4); font-size: 12px; cursor: pointer; font-family: 'DM Sans', sans-serif; }
        .camp-attend-badge { display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; border-radius: 8px; background: rgba(34,197,94,0.1); border: 1px solid rgba(34,197,94,0.2); color: #4ade80; font-size: 12px; font-weight: 600; margin-top: 8px; }
        .camp-empty { text-align: center; padding: 60px; color: rgba(255,255,255,0.25); font-size: 15px; }
        .camp-empty-icon { font-size: 44px; margin-bottom: 12px; }
        .camp-section-label { font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700; color: rgba(255,255,255,0.5); margin-bottom: 12px; margin-top: 20px; padding-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.06); }
      `}</style>

      <div className="camp-page">
        <div className="camp-top">
          <div>
            <div className="camp-title">
              Blood Donation <span>Camps</span> 🏕️
            </div>
            <div className="camp-subtitle">
              Create camps — donors can select them when recording donations
            </div>
          </div>
          <button className="camp-btn" onClick={() => setShowForm(!showForm)}>
            {showForm ? "✕ Cancel" : "+ Create Camp"}
          </button>
        </div>

        {showForm && (
          <div className="camp-form">
            <div className="camp-form-title">📋 New Blood Donation Camp</div>
            <div className="camp-grid">
              <div className="camp-field">
                <label>Camp Name</label>
                <input
                  placeholder="e.g. Diwali Blood Drive"
                  value={campName}
                  onChange={(e) => setCampName(e.target.value)}
                />
              </div>
              <div className="camp-field">
                <label>Address / Location</label>
                <input
                  placeholder="e.g. Near Shivajinagar Station, Pune"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
              <div className="camp-field">
                <label>Date</label>
                <input
                  type="date"
                  min={today}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div className="camp-field">
                <label>Time</label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                />
              </div>
            </div>
            <div className="camp-actions">
              <button
                className="camp-submit"
                onClick={handleCreate}
                disabled={submitting}
              >
                {submitting ? "Creating..." : "Create Camp →"}
              </button>
              <button
                className="camp-cancel"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="camp-info">
          💡 <strong>How it works:</strong> Create a camp with location and
          date. Donors see your camps and select them when recording donations.
          Blood goes directly to your inventory. After a camp ends, mark
          attendance to track how many donors showed up.
        </div>

        <div className="camp-filter-row">
          <span className="camp-filter-label">Show:</span>
          <button
            className={`camp-filter-btn ${!showPast ? "active" : ""}`}
            onClick={() => setShowPast(false)}
          >
            📅 Upcoming ({upcomingCamps.length})
          </button>
          <button
            className={`camp-filter-btn ${showPast ? "active" : ""}`}
            onClick={() => setShowPast(true)}
          >
            🕐 All including past ({camps.length})
          </button>
        </div>

        {displayCamps.length === 0 ? (
          <div className="camp-empty">
            <div className="camp-empty-icon">🏕️</div>
            <div>
              {showPast
                ? "No camps created yet"
                : "No upcoming camps — create one above!"}
            </div>
          </div>
        ) : (
          <div className="camp-list">
            {displayCamps.map((camp) => {
              const isPast = camp.date < today;
              return (
                <div
                  className={`camp-card ${isPast ? "past" : "upcoming"}`}
                  key={camp._id}
                >
                  <div className="camp-card-top">
                    <div className="camp-card-left">
                      <div className="camp-card-icon">
                        {isPast ? "📁" : "🏕️"}
                      </div>
                      <div>
                        <div className="camp-card-name">
                          {camp.campName}
                          <span
                            className={`camp-badge ${isPast ? "past" : "active"}`}
                          >
                            {isPast ? "Past" : "Upcoming"}
                          </span>
                        </div>
                        <div className="camp-card-detail">
                          📍 {camp.address}
                        </div>
                        <div className="camp-card-detail">
                          📅 {moment(camp.date).format("DD MMM YYYY")} &nbsp;🕐{" "}
                          {camp.time}
                        </div>
                        {isPast &&
                          camp.attendance !== null &&
                          camp.attendance !== undefined && (
                            <div className="camp-attend-badge">
                              👥 {camp.attendance} donor
                              {camp.attendance !== 1 ? "s" : ""} attended
                            </div>
                          )}
                      </div>
                    </div>
                    <div className="camp-card-actions">
                      {isPast && (
                        <button
                          className="camp-attend-btn"
                          onClick={() => {
                            setAttendanceId(camp._id);
                            setAttendanceVal(camp.attendance || "");
                          }}
                        >
                          👥{" "}
                          {camp.attendance !== null &&
                          camp.attendance !== undefined
                            ? "Edit Attendance"
                            : "Mark Attendance"}
                        </button>
                      )}
                      <button
                        className="camp-del-btn"
                        onClick={() => handleDelete(camp._id)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  {attendanceId === camp._id && (
                    <div className="camp-attend-form">
                      <span
                        style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}
                      >
                        👥 How many donors attended?
                      </span>
                      <input
                        className="camp-attend-input"
                        type="number"
                        min="0"
                        placeholder="e.g. 45"
                        value={attendanceVal}
                        onChange={(e) => setAttendanceVal(e.target.value)}
                      />
                      <button
                        className="camp-attend-save"
                        onClick={() => handleAttendance(camp._id)}
                      >
                        Save
                      </button>
                      <button
                        className="camp-attend-cancel"
                        onClick={() => setAttendanceId(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default OrgCamps;
