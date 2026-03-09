import React, { useEffect, useState } from "react";
import Layout from "../../components/shared/Layout/Layout";
import API from "../../services/API";
import moment from "moment";

const OrgRequests = () => {
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loadingId, setLoadingId] = useState(null);

  const getRequests = async () => {
    try {
      const { data } = await API.get("/request/get-org-requests");
      if (data?.success) setRequests(data?.requests);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getRequests();
    // Auto-refresh every 15 seconds so org sees new requests without refreshing
    const interval = setInterval(getRequests, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleAccept = async (id) => {
    try {
      setLoadingId(id);
      const { data } = await API.put(`/request/accept-request/${id}`);
      if (data?.success) {
        alert("✅ Request accepted! Blood deducted from your inventory.");
        getRequests();
      }
    } catch (error) {
      alert(error?.response?.data?.message || "Something went wrong");
    } finally {
      setLoadingId(null);
    }
  };

  const handleReject = async (id) => {
    try {
      setLoadingId(id);
      const { data } = await API.put(`/request/reject-request/${id}`);
      if (data?.success) {
        alert("❌ Request rejected.");
        getRequests();
      }
    } catch (error) {
      alert(error?.response?.data?.message || "Something went wrong");
    } finally {
      setLoadingId(null);
    }
  };

  const filtered =
    filter === "all" ? requests : requests.filter((r) => r.status === filter);
  const pendingCount = requests.filter((r) => r.status === "pending").length;
  const acceptedCount = requests.filter((r) => r.status === "accepted").length;
  const rejectedCount = requests.filter((r) => r.status === "rejected").length;

  return (
    <Layout>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
        .oreq-page { font-family: 'DM Sans', sans-serif; }
        .oreq-title { font-family: 'Syne', sans-serif; font-size: 26px; font-weight: 700; color: #fff; margin-bottom: 4px; }
        .oreq-title span { background: linear-gradient(90deg, #c084fc, #f472b6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .oreq-subtitle { font-size: 14px; color: rgba(255,255,255,0.4); margin-bottom: 28px; }
        .oreq-live { display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: 20px; background: rgba(34,197,94,0.1); border: 1px solid rgba(34,197,94,0.25); font-size: 12px; color: #4ade80; font-weight: 600; margin-bottom: 24px; }
        .oreq-live-dot { width: 7px; height: 7px; border-radius: 50%; background: #4ade80; animation: pulse 1.5s infinite; }
        @keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:0.3;} }
        .oreq-stats { display: flex; gap: 14px; margin-bottom: 28px; flex-wrap: wrap; }
        .oreq-stat { flex: 1; min-width: 120px; padding: 18px 20px; border-radius: 16px; text-align: center; }
        .oreq-stat.yellow { background: rgba(234,179,8,0.08); border: 1px solid rgba(234,179,8,0.25); }
        .oreq-stat.green { background: rgba(34,197,94,0.08); border: 1px solid rgba(34,197,94,0.25); }
        .oreq-stat.red { background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.25); }
        .oreq-stat.purple { background: rgba(168,85,247,0.08); border: 1px solid rgba(168,85,247,0.25); }
        .oreq-stat-num { font-family: 'Syne', sans-serif; font-size: 28px; font-weight: 800; color: #fff; }
        .oreq-stat-label { font-size: 12px; color: rgba(255,255,255,0.35); margin-top: 4px; }
        .oreq-alert { padding: 14px 18px; border-radius: 12px; margin-bottom: 20px; background: rgba(234,179,8,0.08); border: 1px solid rgba(234,179,8,0.25); font-size: 13px; color: #fbbf24; }
        .oreq-alert strong { color: #fde68a; }
        .oreq-filters { display: flex; gap: 8px; margin-bottom: 24px; flex-wrap: wrap; }
        .oreq-filter-btn { padding: 8px 18px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.1); background: transparent; color: rgba(255,255,255,0.4); font-size: 13px; font-weight: 600; font-family: 'DM Sans', sans-serif; cursor: pointer; transition: all 0.2s; }
        .oreq-filter-btn:hover { border-color: rgba(168,85,247,0.3); color: rgba(255,255,255,0.7); }
        .oreq-filter-btn.active { background: rgba(168,85,247,0.15); border-color: rgba(168,85,247,0.4); color: #e879f9; }
        .oreq-list { display: flex; flex-direction: column; gap: 14px; }
        .oreq-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 18px; padding: 22px; transition: all 0.2s; }
        .oreq-card.pending { border-left: 3px solid #eab308; }
        .oreq-card.accepted { border-left: 3px solid #22c55e; }
        .oreq-card.rejected { border-left: 3px solid #ef4444; }
        .oreq-card-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; flex-wrap: wrap; margin-bottom: 16px; }
        .oreq-card-left { display: flex; align-items: center; gap: 14px; }
        .oreq-blood-badge { width: 54px; height: 54px; border-radius: 14px; background: linear-gradient(135deg, #9333ea, #ec4899); display: flex; align-items: center; justify-content: center; font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 800; color: white; flex-shrink: 0; }
        .oreq-card-name { font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 700; color: #fff; margin-bottom: 4px; }
        .oreq-card-detail { font-size: 13px; color: rgba(255,255,255,0.4); margin-bottom: 2px; }
        .oreq-right { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; }
        .oreq-qty { font-family: 'Syne', sans-serif; font-size: 24px; font-weight: 800; color: #c084fc; }
        .oreq-qty-label { font-size: 11px; color: rgba(255,255,255,0.3); text-align: right; }
        .oreq-status-badge { display: inline-flex; align-items: center; gap: 5px; padding: 5px 12px; border-radius: 8px; font-size: 12px; font-weight: 600; }
        .oreq-status-badge.pending { background: rgba(234,179,8,0.12); color: #fbbf24; border: 1px solid rgba(234,179,8,0.25); }
        .oreq-status-badge.accepted { background: rgba(34,197,94,0.12); color: #4ade80; border: 1px solid rgba(34,197,94,0.25); }
        .oreq-status-badge.rejected { background: rgba(239,68,68,0.12); color: #f87171; border: 1px solid rgba(239,68,68,0.25); }
        .oreq-divider { height: 1px; background: rgba(255,255,255,0.06); margin-bottom: 14px; }
        .oreq-hospital-info { display: flex; gap: 18px; flex-wrap: wrap; margin-bottom: 16px; }
        .oreq-hosp-detail { font-size: 13px; color: rgba(255,255,255,0.4); display: flex; align-items: center; gap: 6px; }
        .oreq-hosp-detail span { color: rgba(255,255,255,0.65); }
        .oreq-actions { display: flex; gap: 10px; margin-top: 4px; }
        .oreq-accept-btn { padding: 11px 26px; border-radius: 11px; border: none; cursor: pointer; background: linear-gradient(135deg, #16a34a, #22c55e); color: white; font-size: 13px; font-weight: 600; font-family: 'DM Sans', sans-serif; transition: all 0.2s; box-shadow: 0 4px 12px rgba(34,197,94,0.25); }
        .oreq-accept-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(34,197,94,0.4); }
        .oreq-accept-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
        .oreq-reject-btn { padding: 11px 26px; border-radius: 11px; border: 1px solid rgba(239,68,68,0.3); background: rgba(239,68,68,0.08); color: #f87171; font-size: 13px; font-weight: 600; font-family: 'DM Sans', sans-serif; cursor: pointer; transition: all 0.2s; }
        .oreq-reject-btn:hover { background: rgba(239,68,68,0.18); border-color: rgba(239,68,68,0.5); }
        .oreq-reject-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .oreq-empty { text-align: center; padding: 80px 20px; }
        .oreq-empty-icon { font-size: 48px; margin-bottom: 12px; }
        .oreq-empty-text { font-size: 15px; color: rgba(255,255,255,0.3); margin-bottom: 6px; }
        .oreq-empty-sub { font-size: 13px; color: rgba(255,255,255,0.15); }
      `}</style>

      <div className="oreq-page">
        <div className="oreq-title">
          Blood <span>Requests</span> 📋
        </div>
        <div className="oreq-subtitle">
          Incoming blood requests from hospitals — accept or reject below
        </div>

        <div className="oreq-live">
          <div className="oreq-live-dot" />
          Auto-refreshes every 15 seconds
        </div>

        <div className="oreq-stats">
          <div className="oreq-stat yellow">
            <div className="oreq-stat-num">{pendingCount}</div>
            <div className="oreq-stat-label">Pending</div>
          </div>
          <div className="oreq-stat green">
            <div className="oreq-stat-num">{acceptedCount}</div>
            <div className="oreq-stat-label">Accepted</div>
          </div>
          <div className="oreq-stat red">
            <div className="oreq-stat-num">{rejectedCount}</div>
            <div className="oreq-stat-label">Rejected</div>
          </div>
          <div className="oreq-stat purple">
            <div className="oreq-stat-num">{requests.length}</div>
            <div className="oreq-stat-label">Total</div>
          </div>
        </div>

        {pendingCount > 0 && (
          <div className="oreq-alert">
            🔔 You have{" "}
            <strong>
              {pendingCount} pending request{pendingCount > 1 ? "s" : ""}
            </strong>{" "}
            waiting. Accepting will automatically deduct from your inventory.
          </div>
        )}

        <div className="oreq-filters">
          {["all", "pending", "accepted", "rejected"].map((f) => (
            <button
              key={f}
              className={`oreq-filter-btn ${filter === f ? "active" : ""}`}
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
          <div className="oreq-empty">
            <div className="oreq-empty-icon">📋</div>
            <div className="oreq-empty-text">
              {filter === "all" ? "No requests yet" : `No ${filter} requests`}
            </div>
            <div className="oreq-empty-sub">
              {filter === "all"
                ? "Hospitals will send requests here when they need blood"
                : `Switch to "All" to see everything`}
            </div>
          </div>
        ) : (
          <div className="oreq-list">
            {filtered.map((req) => (
              <div className={`oreq-card ${req.status}`} key={req._id}>
                <div className="oreq-card-top">
                  <div className="oreq-card-left">
                    <div className="oreq-blood-badge">{req.bloodGroup}</div>
                    <div>
                      <div className="oreq-card-name">
                        {req.hospital?.hospitalName || "Unknown Hospital"}
                      </div>
                      <div className="oreq-card-detail">
                        📅{" "}
                        {moment(req.createdAt).format("DD MMM YYYY, hh:mm A")}
                      </div>
                      <div className="oreq-card-detail">
                        🕐 {moment(req.createdAt).fromNow()}
                      </div>
                    </div>
                  </div>
                  <div className="oreq-right">
                    <div>
                      <div className="oreq-qty">{req.quantity} ml</div>
                      <div className="oreq-qty-label">requested</div>
                    </div>
                    <span className={`oreq-status-badge ${req.status}`}>
                      {req.status === "pending"
                        ? "🟡 Pending"
                        : req.status === "accepted"
                          ? "✅ Accepted"
                          : "❌ Rejected"}
                    </span>
                  </div>
                </div>
                <div className="oreq-divider" />
                <div className="oreq-hospital-info">
                  {req.hospital?.email && (
                    <div className="oreq-hosp-detail">
                      ✉️ <span>{req.hospital.email}</span>
                    </div>
                  )}
                  {req.hospital?.phone && (
                    <div className="oreq-hosp-detail">
                      📞 <span>{req.hospital.phone}</span>
                    </div>
                  )}
                  {req.hospital?.address && (
                    <div className="oreq-hosp-detail">
                      📍 <span>{req.hospital.address}</span>
                    </div>
                  )}
                </div>
                {req.status === "pending" && (
                  <div className="oreq-actions">
                    <button
                      className="oreq-accept-btn"
                      onClick={() => handleAccept(req._id)}
                      disabled={loadingId === req._id}
                    >
                      {loadingId === req._id
                        ? "Processing..."
                        : "✅ Accept & Send Blood"}
                    </button>
                    <button
                      className="oreq-reject-btn"
                      onClick={() => handleReject(req._id)}
                      disabled={loadingId === req._id}
                    >
                      {loadingId === req._id ? "Processing..." : "❌ Reject"}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default OrgRequests;
