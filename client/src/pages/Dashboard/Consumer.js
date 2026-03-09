import React, { useEffect, useState } from "react";
import Layout from "../../components/shared/Layout/Layout";
import moment from "moment";
import API from "../../services/API";

const Consumer = () => {
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState("all");

  const getRequests = async () => {
    try {
      const { data } = await API.get("/request/get-hospital-requests");
      if (data?.success) setRequests(data?.requests);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getRequests();
    // Auto-refresh every 10 seconds so hospital sees status updates live
    const interval = setInterval(getRequests, 10000);
    return () => clearInterval(interval);
  }, []);

  const filtered =
    filter === "all" ? requests : requests.filter((r) => r.status === filter);
  const pendingCount = requests.filter((r) => r.status === "pending").length;
  const acceptedCount = requests.filter((r) => r.status === "accepted").length;
  const rejectedCount = requests.filter((r) => r.status === "rejected").length;
  const totalML = requests
    .filter((r) => r.status === "accepted")
    .reduce((sum, r) => sum + (Number(r.quantity) || 0), 0);

  return (
    <Layout>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
        .con-page { font-family: 'DM Sans', sans-serif; }
        .con-title { font-family: 'Syne', sans-serif; font-size: 26px; font-weight: 700; color: #fff; margin-bottom: 4px; }
        .con-title span { background: linear-gradient(90deg, #c084fc, #f472b6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .con-subtitle { font-size: 14px; color: rgba(255,255,255,0.4); margin-bottom: 28px; }
        .con-live { display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: 20px; background: rgba(34,197,94,0.1); border: 1px solid rgba(34,197,94,0.25); font-size: 12px; color: #4ade80; font-weight: 600; margin-bottom: 24px; }
        .con-live-dot { width: 7px; height: 7px; border-radius: 50%; background: #4ade80; animation: pulse 1.5s infinite; }
        @keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:0.3;} }
        .con-info { padding: 14px 18px; border-radius: 12px; margin-bottom: 24px; background: rgba(99,102,241,0.08); border: 1px solid rgba(99,102,241,0.2); font-size: 13px; color: rgba(255,255,255,0.5); line-height: 1.6; }
        .con-info strong { color: rgba(255,255,255,0.8); }
        .con-stats { display: flex; gap: 14px; margin-bottom: 28px; flex-wrap: wrap; }
        .con-stat { flex: 1; min-width: 120px; padding: 18px 20px; border-radius: 16px; text-align: center; }
        .con-stat.yellow { background: rgba(234,179,8,0.08); border: 1px solid rgba(234,179,8,0.25); }
        .con-stat.green { background: rgba(34,197,94,0.08); border: 1px solid rgba(34,197,94,0.25); }
        .con-stat.red { background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.25); }
        .con-stat.purple { background: rgba(168,85,247,0.08); border: 1px solid rgba(168,85,247,0.25); }
        .con-stat-num { font-family: 'Syne', sans-serif; font-size: 26px; font-weight: 800; color: #fff; }
        .con-stat-label { font-size: 11px; color: rgba(255,255,255,0.35); margin-top: 4px; }
        .con-filters { display: flex; gap: 8px; margin-bottom: 24px; flex-wrap: wrap; }
        .con-filter-btn { padding: 8px 18px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.1); background: transparent; color: rgba(255,255,255,0.4); font-size: 13px; font-weight: 600; font-family: 'DM Sans', sans-serif; cursor: pointer; transition: all 0.2s; }
        .con-filter-btn:hover { border-color: rgba(168,85,247,0.3); color: rgba(255,255,255,0.7); }
        .con-filter-btn.active { background: rgba(168,85,247,0.15); border-color: rgba(168,85,247,0.4); color: #e879f9; }
        .con-req-btn { display: inline-flex; align-items: center; gap: 8px; padding: 11px 22px; border-radius: 12px; border: none; cursor: pointer; background: linear-gradient(135deg, #9333ea, #ec4899); color: white; font-size: 14px; font-weight: 600; font-family: 'DM Sans', sans-serif; box-shadow: 0 4px 16px rgba(147,51,234,0.35); transition: all 0.2s; margin-bottom: 24px; text-decoration: none; display: inline-flex; }
        .con-req-btn:hover { transform: translateY(-2px); color: white; }
        .con-list { display: flex; flex-direction: column; gap: 14px; }
        .con-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 18px; padding: 22px; transition: all 0.2s; }
        .con-card.pending { border-left: 3px solid #eab308; }
        .con-card.accepted { border-left: 3px solid #22c55e; }
        .con-card.rejected { border-left: 3px solid #ef4444; }
        .con-card-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; flex-wrap: wrap; margin-bottom: 16px; }
        .con-card-left { display: flex; align-items: center; gap: 14px; }
        .con-blood-badge { width: 54px; height: 54px; border-radius: 14px; background: linear-gradient(135deg, #9333ea, #ec4899); display: flex; align-items: center; justify-content: center; font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 800; color: white; flex-shrink: 0; }
        .con-card-org { font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 700; color: #fff; margin-bottom: 4px; }
        .con-card-detail { font-size: 13px; color: rgba(255,255,255,0.4); margin-bottom: 2px; }
        .con-right { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; }
        .con-qty { font-family: 'Syne', sans-serif; font-size: 24px; font-weight: 800; color: #c084fc; }
        .con-qty-label { font-size: 11px; color: rgba(255,255,255,0.3); text-align: right; }
        .con-status-badge { display: inline-flex; align-items: center; gap: 5px; padding: 5px 12px; border-radius: 8px; font-size: 12px; font-weight: 600; }
        .con-status-badge.pending { background: rgba(234,179,8,0.12); color: #fbbf24; border: 1px solid rgba(234,179,8,0.25); }
        .con-status-badge.accepted { background: rgba(34,197,94,0.12); color: #4ade80; border: 1px solid rgba(34,197,94,0.25); }
        .con-status-badge.rejected { background: rgba(239,68,68,0.12); color: #f87171; border: 1px solid rgba(239,68,68,0.25); }
        .con-divider { height: 1px; background: rgba(255,255,255,0.06); margin-bottom: 14px; }
        .con-org-info { display: flex; gap: 18px; flex-wrap: wrap; margin-bottom: 12px; }
        .con-org-detail { font-size: 13px; color: rgba(255,255,255,0.4); display: flex; align-items: center; gap: 6px; }
        .con-org-detail span { color: rgba(255,255,255,0.65); }
        .con-note { margin-top: 8px; padding: 10px 14px; border-radius: 10px; font-size: 13px; }
        .con-note.accepted { background: rgba(34,197,94,0.08); border: 1px solid rgba(34,197,94,0.2); color: #4ade80; }
        .con-note.rejected { background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2); color: #f87171; }
        .con-note.pending { background: rgba(234,179,8,0.08); border: 1px solid rgba(234,179,8,0.2); color: #fbbf24; }
        .con-empty { text-align: center; padding: 80px 20px; }
        .con-empty-icon { font-size: 48px; margin-bottom: 12px; }
        .con-empty-text { font-size: 15px; color: rgba(255,255,255,0.3); margin-bottom: 6px; }
        .con-empty-sub { font-size: 13px; color: rgba(255,255,255,0.15); }
      `}</style>

      <div className="con-page">
        <div className="con-title">
          My Blood <span>Requests</span> 📋
        </div>
        <div className="con-subtitle">
          Live status of every blood request you've sent to organisations
        </div>

        <div className="con-live">
          <div className="con-live-dot" />
          Auto-refreshes every 10 seconds
        </div>

        <div className="con-info">
          💡 Go to <strong>Blood Availability</strong> in the sidebar → find a
          blood bank with stock → click a blood group pill → submit your
          request. Status updates here automatically.
        </div>

        <a href="/orgnaisation" className="con-req-btn">
          🩸 Make New Request → Blood Availability
        </a>

        <div className="con-stats">
          <div className="con-stat yellow">
            <div className="con-stat-num">{pendingCount}</div>
            <div className="con-stat-label">Pending</div>
          </div>
          <div className="con-stat green">
            <div className="con-stat-num">{acceptedCount}</div>
            <div className="con-stat-label">Accepted</div>
          </div>
          <div className="con-stat red">
            <div className="con-stat-num">{rejectedCount}</div>
            <div className="con-stat-label">Rejected</div>
          </div>
          <div className="con-stat purple">
            <div className="con-stat-num">{totalML}</div>
            <div className="con-stat-label">Total ML Received</div>
          </div>
        </div>

        <div className="con-filters">
          {["all", "pending", "accepted", "rejected"].map((f) => (
            <button
              key={f}
              className={`con-filter-btn ${filter === f ? "active" : ""}`}
              onClick={() => setFilter(f)}
            >
              {f === "all"
                ? "All"
                : f === "pending"
                  ? "🟡 Pending"
                  : f === "accepted"
                    ? "✅ Accepted"
                    : "❌ Rejected"}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="con-empty">
            <div className="con-empty-icon">📋</div>
            <div className="con-empty-text">
              {filter === "all" ? "No requests yet" : `No ${filter} requests`}
            </div>
            <div className="con-empty-sub">
              {filter === "all"
                ? "Go to Blood Availability and click a blood group pill to request"
                : `Switch to "All" to see everything`}
            </div>
          </div>
        ) : (
          <div className="con-list">
            {filtered.map((req) => (
              <div className={`con-card ${req.status}`} key={req._id}>
                <div className="con-card-top">
                  <div className="con-card-left">
                    <div className="con-blood-badge">{req.bloodGroup}</div>
                    <div>
                      <div className="con-card-org">
                        {req.organisation?.organisationName ||
                          "Unknown Organisation"}
                      </div>
                      <div className="con-card-detail">
                        📅{" "}
                        {moment(req.createdAt).format("DD MMM YYYY, hh:mm A")}
                      </div>
                      <div className="con-card-detail">
                        🕐 {moment(req.createdAt).fromNow()}
                      </div>
                    </div>
                  </div>
                  <div className="con-right">
                    <div>
                      <div className="con-qty">{req.quantity} ml</div>
                      <div className="con-qty-label">requested</div>
                    </div>
                    <span className={`con-status-badge ${req.status}`}>
                      {req.status === "pending"
                        ? "🟡 Pending"
                        : req.status === "accepted"
                          ? "✅ Accepted"
                          : "❌ Rejected"}
                    </span>
                  </div>
                </div>
                <div className="con-divider" />
                <div className="con-org-info">
                  {req.organisation?.email && (
                    <div className="con-org-detail">
                      ✉️ <span>{req.organisation.email}</span>
                    </div>
                  )}
                  {req.organisation?.phone && (
                    <div className="con-org-detail">
                      📞 <span>{req.organisation.phone}</span>
                    </div>
                  )}
                  {req.organisation?.address && (
                    <div className="con-org-detail">
                      📍 <span>{req.organisation.address}</span>
                    </div>
                  )}
                </div>
                <div className={`con-note ${req.status}`}>
                  {req.status === "pending" &&
                    `🟡 Waiting for ${req.organisation?.organisationName} to review. This page refreshes automatically — no need to reload!`}
                  {req.status === "accepted" &&
                    `✅ Accepted! ${req.quantity}ml of ${req.bloodGroup} has been dispatched from ${req.organisation?.organisationName}.`}
                  {req.status === "rejected" &&
                    `❌ Rejected by ${req.organisation?.organisationName}. Please try requesting from a different blood bank.`}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Consumer;
