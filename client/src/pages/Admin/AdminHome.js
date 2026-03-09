import React, { useEffect, useState, useCallback } from "react";
import Layout from "../../components/shared/Layout/Layout";
import { useSelector } from "react-redux";
import API from "../../services/API";
import moment from "moment";

const tabs = [
  { id: "overview", label: "Overview", icon: "📊" },
  { id: "donors", label: "Donors", icon: "🩸" },
  { id: "hospitals", label: "Hospitals", icon: "🏥" },
  { id: "orgs", label: "Organisations", icon: "🏢" },
  { id: "requests", label: "Blood Requests", icon: "📋" },
  { id: "inventory", label: "Inventory", icon: "🗃️" },
  { id: "camps", label: "Camps", icon: "🏕️" },
];

const AdminHome = () => {
  const { user } = useSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState({});
  const [donors, setDonors] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [orgs, setOrgs] = useState([]);
  const [requests, setRequests] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [camps, setCamps] = useState([]);
  const [reqFilter, setReqFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [loadingId, setLoadingId] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // CSV EXPORT
  const exportCSV = (filename, headers, rows) => {
    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row
          .map((cell) => `"${String(cell || "").replace(/"/g, '""')}"`)
          .join(","),
      ),
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportDonors = () =>
    exportCSV(
      "hemolink_donors.csv",
      ["Name", "Email", "Phone", "Address", "Joined"],
      donors.map((d) => [
        d.name,
        d.email,
        d.phone,
        d.address,
        moment(d.createdAt).format("DD MMM YYYY"),
      ]),
    );

  const exportHospitals = () =>
    exportCSV(
      "hemolink_hospitals.csv",
      ["Hospital Name", "Email", "Phone", "Address", "Joined"],
      hospitals.map((h) => [
        h.hospitalName,
        h.email,
        h.phone,
        h.address,
        moment(h.createdAt).format("DD MMM YYYY"),
      ]),
    );

  const exportOrgs = () =>
    exportCSV(
      "hemolink_organisations.csv",
      ["Organisation Name", "Email", "Phone", "Address", "Joined"],
      orgs.map((o) => [
        o.organisationName,
        o.email,
        o.phone,
        o.address,
        moment(o.createdAt).format("DD MMM YYYY"),
      ]),
    );

  const exportInventory = () =>
    exportCSV(
      "hemolink_inventory.csv",
      ["Blood Group", "Type", "Quantity (ML)", "Organisation", "Email", "Date"],
      inventory.map((r) => [
        r.bloodGroup,
        r.inventoryType,
        r.quantity,
        r.organisation?.organisationName,
        r.email,
        moment(r.createdAt).format("DD MMM YYYY"),
      ]),
    );

  const refreshAll = useCallback(async () => {
    try {
      const [s, d, h, o, r, inv, c] = await Promise.all([
        API.get("/admin/site-stats"),
        API.get("/admin/donar-list"),
        API.get("/admin/hospital-list"),
        API.get("/admin/org-list"),
        API.get("/admin/all-requests"),
        API.get("/admin/all-inventory"),
        API.get("/admin/all-camps"),
      ]);
      if (s.data?.success) setStats(s.data.stats);
      if (d.data?.success) setDonors(d.data.donarData);
      if (h.data?.success) setHospitals(h.data.hospitalData);
      if (o.data?.success) setOrgs(o.data.orgData);
      if (r.data?.success) setRequests(r.data.requests);
      if (inv.data?.success) setInventory(inv.data.inventory);
      if (c.data?.success) setCamps(c.data.camps);
      setLastUpdated(new Date());
    } catch (e) {
      console.log(e);
    }
  }, []);

  useEffect(() => {
    refreshAll();
    const interval = setInterval(refreshAll, 10000);
    return () => clearInterval(interval);
  }, [refreshAll]);

  const handleDelete = async (id, type) => {
    if (
      !window.confirm(
        `Delete this ${type}? This will also delete ALL their related records. This cannot be undone.`,
      )
    )
      return;
    try {
      await API.delete(`/admin/delete-donar/${id}`);
      await refreshAll();
    } catch (e) {
      alert("Error deleting");
    }
  };

  const handleAccept = async (id) => {
    try {
      setLoadingId(id);
      const { data } = await API.put(`/admin/accept-request/${id}`);
      if (data?.success) {
        await refreshAll();
      } else {
        alert(data?.message || "Error");
      }
    } catch (e) {
      alert(e?.response?.data?.message || "Error accepting");
    } finally {
      setLoadingId(null);
    }
  };

  const handleReject = async (id) => {
    try {
      setLoadingId(id);
      await API.put(`/admin/reject-request/${id}`);
      await refreshAll();
    } catch (e) {
      alert("Error rejecting");
    } finally {
      setLoadingId(null);
    }
  };

  const handleDeleteCamp = async (id) => {
    if (!window.confirm("Remove this camp permanently?")) return;
    try {
      await API.delete(`/admin/delete-camp/${id}`);
      await refreshAll();
    } catch (e) {
      alert("Error removing camp");
    }
  };

  const pendingCount = requests.filter((r) => r.status === "pending").length;
  const filteredRequests =
    reqFilter === "all"
      ? requests
      : requests.filter((r) => r.status === reqFilter);

  const filterList = (list, keys) =>
    !search
      ? list
      : list.filter((item) =>
          keys.some((k) =>
            item[k]?.toLowerCase().includes(search.toLowerCase()),
          ),
        );

  const exportBtnStyle = {
    padding: "8px 18px",
    borderRadius: 10,
    border: "1px solid rgba(34,197,94,0.25)",
    background: "rgba(34,197,94,0.08)",
    color: "#4ade80",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "'DM Sans',sans-serif",
    marginBottom: 14,
    display: "inline-block",
  };

  return (
    <Layout>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
.adm { font-family: 'DM Sans', sans-serif; }
.adm-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 28px; flex-wrap: wrap; gap: 12px; }
.adm-title { font-family: 'Syne', sans-serif; font-size: 26px; font-weight: 700; color: #fff; }
.adm-title span { background: linear-gradient(90deg, #c084fc, #f472b6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
.adm-subtitle { font-size: 14px; color: rgba(255,255,255,0.6); margin-top: 4px; }
.adm-header-right { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; }
.adm-live { display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: 20px; background: rgba(34,197,94,0.1); border: 1px solid rgba(34,197,94,0.25); font-size: 12px; color: #4ade80; font-weight: 600; }
.adm-live-dot { width: 7px; height: 7px; border-radius: 50%; background: #4ade80; animation: pulse 1.5s infinite; }
.adm-updated { font-size: 11px; color: rgba(255,255,255,0.4); }
.adm-refresh-btn { padding: 7px 16px; border-radius: 10px; border: 1px solid rgba(168,85,247,0.3); background: rgba(168,85,247,0.08); color: #c084fc; font-size: 12px; font-weight: 600; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 0.2s; }
.adm-refresh-btn:hover { background: rgba(168,85,247,0.18); }
@keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:0.3;} }
.adm-tabs { display: flex; gap: 4px; margin-bottom: 28px; flex-wrap: wrap; background: rgba(255,255,255,0.03); padding: 5px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.06); }
.adm-tab { padding: 9px 14px; border-radius: 11px; border: none; background: transparent; color: rgba(255,255,255,0.6); font-size: 13px; font-weight: 600; font-family: 'DM Sans', sans-serif; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 6px; position: relative; white-space: nowrap; }
.adm-tab:hover { color: #fff; background: rgba(255,255,255,0.05); }
.adm-tab.active { background: rgba(168,85,247,0.2); color: #e879f9; border: 1px solid rgba(168,85,247,0.3); }
.adm-tab-badge { position: absolute; top: 3px; right: 3px; min-width: 16px; height: 16px; padding: 0 4px; border-radius: 8px; background: #ef4444; color: white; font-size: 9px; font-weight: 700; display: flex; align-items: center; justify-content: center; }
.adm-search { width: 100%; max-width: 380px; padding: 11px 16px; background: rgba(255,255,255,0.05); border: 1.5px solid rgba(255,255,255,0.1); border-radius: 12px; color: #fff; font-size: 14px; font-family: 'DM Sans', sans-serif; outline: none; transition: all 0.2s; margin-bottom: 20px; display: block; }
.adm-search:focus { border-color: #a855f7; background: rgba(168,85,247,0.08); }
.adm-search::placeholder { color: rgba(255,255,255,0.3); }
.adm-stats-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 12px; margin-bottom: 28px; }
.adm-stat { padding: 18px 20px; border-radius: 16px; text-align: center; transition: transform 0.2s; cursor: default; }
.adm-stat:hover { transform: translateY(-2px); }
.adm-stat.purple { background: rgba(168,85,247,0.08); border: 1px solid rgba(168,85,247,0.25); }
.adm-stat.pink { background: rgba(236,72,153,0.08); border: 1px solid rgba(236,72,153,0.25); }
.adm-stat.blue { background: rgba(99,102,241,0.08); border: 1px solid rgba(99,102,241,0.25); }
.adm-stat.green { background: rgba(34,197,94,0.08); border: 1px solid rgba(34,197,94,0.25); }
.adm-stat.yellow { background: rgba(234,179,8,0.08); border: 1px solid rgba(234,179,8,0.25); }
.adm-stat.red { background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.25); }
.adm-stat.teal { background: rgba(20,184,166,0.08); border: 1px solid rgba(20,184,166,0.25); }
.adm-stat.orange { background: rgba(249,115,22,0.08); border: 1px solid rgba(249,115,22,0.25); }
.adm-stat-icon { font-size: 22px; margin-bottom: 8px; }
.adm-stat-num { font-family: 'Syne', sans-serif; font-size: 26px; font-weight: 800; color: #fff; }
.adm-stat-label { font-size: 11px; color: rgba(255,255,255,0.6); margin-top: 4px; }
.adm-section-title { font-family: 'Syne', sans-serif; font-size: 17px; font-weight: 700; color: #fff; margin-bottom: 6px; }
.adm-section-sub { font-size: 13px; color: rgba(255,255,255,0.6); margin-bottom: 18px; }
.adm-count { font-size: 13px; color: rgba(255,255,255,0.6); margin-bottom: 14px; }
.adm-count span { color: #a855f7; font-weight: 600; }
.adm-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px; }
.adm-card { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 18px; transition: border-color 0.2s; }
.adm-card:hover { border-color: rgba(168,85,247,0.3); }
.adm-card-top { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
.adm-avatar { width: 40px; height: 40px; border-radius: 11px; background: linear-gradient(135deg, #9333ea, #ec4899); display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; }
.adm-card-name { font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 700; color: #fff; margin-bottom: 3px; }
.adm-card-role { display: inline-block; padding: 2px 8px; border-radius: 6px; font-size: 10px; font-weight: 600; }
.adm-role-donor { background: rgba(168,85,247,0.15); color: #c084fc; }
.adm-role-hospital { background: rgba(99,102,241,0.15); color: #818cf8; }
.adm-role-org { background: rgba(236,72,153,0.15); color: #f472b6; }
.adm-card-detail { font-size: 13px; color: rgba(255,255,255,0.85); margin-bottom: 5px; display: flex; align-items: center; gap: 6px; font-weight: 400; }
.adm-card-detail span { color: #fff; font-weight: 500; }
.adm-divider { height: 1px; background: rgba(255,255,255,0.08); margin: 12px 0; }
.adm-del-btn { width: 100%; padding: 9px; border-radius: 10px; border: 1px solid rgba(239,68,68,0.25); background: rgba(239,68,68,0.08); color: #f87171; font-size: 12px; font-weight: 600; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 0.2s; }
.adm-del-btn:hover { background: rgba(239,68,68,0.2); border-color: rgba(239,68,68,0.4); }
.adm-joined { font-size: 11px; color: rgba(255,255,255,0.5); margin-top: 8px; text-align: right; }
.adm-req-filters { display: flex; gap: 8px; margin-bottom: 18px; flex-wrap: wrap; }
.adm-req-filter { padding: 7px 16px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.15); background: transparent; color: rgba(255,255,255,0.7); font-size: 12px; font-weight: 600; font-family: 'DM Sans', sans-serif; cursor: pointer; transition: all 0.2s; }
.adm-req-filter.active { background: rgba(168,85,247,0.15); border-color: rgba(168,85,247,0.35); color: #e879f9; }
.adm-req-list { display: flex; flex-direction: column; gap: 12px; }
.adm-req-card { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 18px; }
.adm-req-card.pending { border-left: 3px solid #eab308; }
.adm-req-card.accepted { border-left: 3px solid #22c55e; }
.adm-req-card.rejected { border-left: 3px solid #ef4444; }
.adm-req-top { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; margin-bottom: 12px; }
.adm-req-left { display: flex; align-items: center; gap: 12px; }
.adm-blood-pill { width: 48px; height: 48px; border-radius: 12px; background: linear-gradient(135deg, #9333ea, #ec4899); display: flex; align-items: center; justify-content: center; font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 800; color: white; flex-shrink: 0; }
.adm-req-name { font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 700; color: #fff; margin-bottom: 3px; }
.adm-req-detail { font-size: 12px; color: rgba(255,255,255,0.7); }
.adm-req-right { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; }
.adm-req-qty { font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 800; color: #c084fc; }
.adm-status { display: inline-flex; align-items: center; gap: 5px; padding: 4px 11px; border-radius: 7px; font-size: 11px; font-weight: 600; }
.adm-status.pending { background: rgba(234,179,8,0.12); color: #fbbf24; border: 1px solid rgba(234,179,8,0.2); }
.adm-status.accepted { background: rgba(34,197,94,0.12); color: #4ade80; border: 1px solid rgba(34,197,94,0.2); }
.adm-status.rejected { background: rgba(239,68,68,0.12); color: #f87171; border: 1px solid rgba(239,68,68,0.2); }
.adm-req-flow { display: flex; align-items: center; gap: 8px; padding: 10px 14px; border-radius: 10px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); margin-bottom: 12px; flex-wrap: wrap; }
.adm-req-flow-item { font-size: 13px; color: rgba(255,255,255,0.85); }
.adm-req-flow-item strong { color: #fff; font-weight: 600; }
.adm-req-flow-arrow { color: #a855f7; font-size: 16px; }
.adm-req-actions { display: flex; gap: 8px; }
.adm-accept-btn { padding: 9px 22px; border-radius: 10px; border: none; cursor: pointer; background: linear-gradient(135deg, #16a34a, #22c55e); color: white; font-size: 12px; font-weight: 600; font-family: 'DM Sans', sans-serif; transition: all 0.2s; }
.adm-accept-btn:hover { transform: translateY(-1px); }
.adm-accept-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
.adm-reject-btn { padding: 9px 22px; border-radius: 10px; border: 1px solid rgba(239,68,68,0.3); background: rgba(239,68,68,0.08); color: #f87171; font-size: 12px; font-weight: 600; font-family: 'DM Sans', sans-serif; cursor: pointer; transition: all 0.2s; }
.adm-reject-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.adm-table-wrap { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; overflow: hidden; overflow-x: auto; }
.adm-table { width: 100%; border-collapse: collapse; font-size: 13px; min-width: 600px; }
.adm-table th { text-align: left; padding: 12px 16px; font-size: 11px; font-weight: 600; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 0.8px; border-bottom: 1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.03); white-space: nowrap; }
.adm-table td { padding: 12px 16px; color: rgba(255,255,255,0.9); border-bottom: 1px solid rgba(255,255,255,0.06); vertical-align: middle; font-size: 13px; }
.adm-table tr:last-child td { border-bottom: none; }
.adm-table tr:hover td { background: rgba(168,85,247,0.06); }
.adm-badge { display: inline-block; padding: 3px 10px; border-radius: 7px; font-size: 11px; font-weight: 600; }
.adm-badge-blood { background: rgba(168,85,247,0.15); color: #c084fc; }
.adm-badge-in { background: rgba(34,197,94,0.12); color: #4ade80; }
.adm-badge-out { background: rgba(239,68,68,0.12); color: #f87171; }
.adm-camp-list { display: flex; flex-direction: column; gap: 10px; }
.adm-camp-card { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); border-radius: 14px; padding: 16px; display: flex; align-items: flex-start; justify-content: space-between; gap: 14px; }
.adm-camp-left { display: flex; gap: 12px; align-items: flex-start; }
.adm-camp-icon { font-size: 20px; flex-shrink: 0; margin-top: 2px; }
.adm-camp-name { font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 700; color: #fff; margin-bottom: 4px; }
.adm-camp-detail { font-size: 13px; color: rgba(255,255,255,0.85); margin-bottom: 3px; }
.adm-camp-org { font-size: 12px; color: #c084fc; font-weight: 500; margin-top: 4px; }
.adm-active-badge { display: inline-block; padding: 2px 8px; border-radius: 6px; font-size: 10px; font-weight: 600; background: rgba(34,197,94,0.12); color: #4ade80; margin-left: 8px; }
.adm-camp-del-btn { padding: 7px 14px; border-radius: 9px; border: 1px solid rgba(239,68,68,0.25); background: rgba(239,68,68,0.08); color: #f87171; font-size: 12px; font-weight: 600; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 0.2s; white-space: nowrap; flex-shrink: 0; }
.adm-camp-del-btn:hover { background: rgba(239,68,68,0.18); }
.adm-empty { text-align: center; padding: 60px 20px; }
.adm-empty-icon { font-size: 44px; margin-bottom: 12px; }
.adm-empty-text { font-size: 14px; color: rgba(255,255,255,0.4); }
.adm-alert { padding: 14px 18px; border-radius: 12px; margin-bottom: 20px; background: rgba(234,179,8,0.08); border: 1px solid rgba(234,179,8,0.25); font-size: 13px; color: #fbbf24; display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.adm-alert-btn { background: none; border: none; color: #c084fc; cursor: pointer; font-weight: 600; font-family: 'DM Sans', sans-serif; font-size: 13px; }
.adm-summary-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 24px; }
@media(max-width:700px){ .adm-summary-grid { grid-template-columns: 1fr; } }
.adm-summary-box { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 20px; }
.adm-summary-box-title { font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700; color: #fff; margin-bottom: 14px; }
.adm-summary-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
.adm-summary-label { font-size: 13px; color: rgba(255,255,255,0.75); }
.adm-summary-val { font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 800; }
      `}</style>

      <div className="adm">
        <div className="adm-header">
          <div>
            <div className="adm-title">
              Admin <span>Control Panel</span> 🛡️
            </div>
            <div className="adm-subtitle">
              Welcome back, {user?.name} — full control over HemoLink
            </div>
          </div>
          <div className="adm-header-right">
            <div className="adm-live">
              <div className="adm-live-dot" /> Live — auto-refreshes every 10s
            </div>
            <div className="adm-updated">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </div>
            <button className="adm-refresh-btn" onClick={refreshAll}>
              🔄 Refresh Now
            </button>
          </div>
        </div>

        {/* TABS */}
        <div className="adm-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`adm-tab ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => {
                setActiveTab(tab.id);
                setSearch("");
                setReqFilter("all");
              }}
            >
              {tab.icon} {tab.label}
              {tab.id === "requests" && pendingCount > 0 && (
                <span className="adm-tab-badge">{pendingCount}</span>
              )}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW ── */}
        {activeTab === "overview" && (
          <>
            <div className="adm-stats-grid">
              <div className="adm-stat purple">
                <div className="adm-stat-icon">🩸</div>
                <div className="adm-stat-num">{stats.totalDonors || 0}</div>
                <div className="adm-stat-label">Total Donors</div>
              </div>
              <div className="adm-stat blue">
                <div className="adm-stat-icon">🏥</div>
                <div className="adm-stat-num">{stats.totalHospitals || 0}</div>
                <div className="adm-stat-label">Hospitals</div>
              </div>
              <div className="adm-stat pink">
                <div className="adm-stat-icon">🏢</div>
                <div className="adm-stat-num">{stats.totalOrgs || 0}</div>
                <div className="adm-stat-label">Organisations</div>
              </div>
              <div className="adm-stat green">
                <div className="adm-stat-icon">📥</div>
                <div className="adm-stat-num">{stats.totalBloodIn || 0}</div>
                <div className="adm-stat-label">Total ML Donated</div>
              </div>
              <div className="adm-stat red">
                <div className="adm-stat-icon">📤</div>
                <div className="adm-stat-num">{stats.totalBloodOut || 0}</div>
                <div className="adm-stat-label">Total ML Used</div>
              </div>
              <div className="adm-stat yellow">
                <div className="adm-stat-icon">⏳</div>
                <div className="adm-stat-num">{stats.pendingRequests || 0}</div>
                <div className="adm-stat-label">Pending Requests</div>
              </div>
              <div className="adm-stat teal">
                <div className="adm-stat-icon">🏕️</div>
                <div className="adm-stat-num">{stats.totalCamps || 0}</div>
                <div className="adm-stat-label">Active Camps</div>
              </div>
              <div className="adm-stat orange">
                <div className="adm-stat-icon">🗃️</div>
                <div className="adm-stat-num">{stats.totalInventory || 0}</div>
                <div className="adm-stat-label">Inventory Records</div>
              </div>
            </div>

            {pendingCount > 0 && (
              <div className="adm-alert">
                <span>
                  🔔{" "}
                  <strong>
                    {pendingCount} pending blood request
                    {pendingCount > 1 ? "s" : ""}
                  </strong>{" "}
                  need your attention
                </span>
                <button
                  className="adm-alert-btn"
                  onClick={() => setActiveTab("requests")}
                >
                  Review now →
                </button>
              </div>
            )}

            <div className="adm-summary-grid">
              <div className="adm-summary-box">
                <div className="adm-summary-box-title">👥 Users Breakdown</div>
                {[
                  ["🩸 Donors", stats.totalDonors, "#c084fc"],
                  ["🏥 Hospitals", stats.totalHospitals, "#818cf8"],
                  ["🏢 Organisations", stats.totalOrgs, "#f472b6"],
                ].map(([label, val, color]) => (
                  <div className="adm-summary-row" key={label}>
                    <span className="adm-summary-label">{label}</span>
                    <span className="adm-summary-val" style={{ color }}>
                      {val || 0}
                    </span>
                  </div>
                ))}
              </div>
              <div className="adm-summary-box">
                <div className="adm-summary-box-title">🩸 Blood Flow</div>
                {[
                  ["📥 Donated (IN)", stats.totalBloodIn, "#4ade80"],
                  ["📤 Used (OUT)", stats.totalBloodOut, "#f87171"],
                  [
                    "💾 Available",
                    Math.max(
                      0,
                      (stats.totalBloodIn || 0) - (stats.totalBloodOut || 0),
                    ),
                    "#c084fc",
                  ],
                ].map(([label, val, color]) => (
                  <div className="adm-summary-row" key={label}>
                    <span className="adm-summary-label">{label}</span>
                    <span className="adm-summary-val" style={{ color }}>
                      {val || 0} ml
                    </span>
                  </div>
                ))}
              </div>
              <div className="adm-summary-box">
                <div className="adm-summary-box-title">
                  📋 Requests Breakdown
                </div>
                {[
                  [
                    "🟡 Pending",
                    requests.filter((r) => r.status === "pending").length,
                    "#fbbf24",
                  ],
                  [
                    "✅ Accepted",
                    requests.filter((r) => r.status === "accepted").length,
                    "#4ade80",
                  ],
                  [
                    "❌ Rejected",
                    requests.filter((r) => r.status === "rejected").length,
                    "#f87171",
                  ],
                ].map(([label, val, color]) => (
                  <div className="adm-summary-row" key={label}>
                    <span className="adm-summary-label">{label}</span>
                    <span className="adm-summary-val" style={{ color }}>
                      {val}
                    </span>
                  </div>
                ))}
              </div>
              <div className="adm-summary-box">
                <div className="adm-summary-box-title">🏕️ Camps & Records</div>
                {[
                  ["🏕️ Active Camps", stats.totalCamps, "#4ade80"],
                  ["🗃️ Inventory Records", stats.totalInventory, "#818cf8"],
                ].map(([label, val, color]) => (
                  <div className="adm-summary-row" key={label}>
                    <span className="adm-summary-label">{label}</span>
                    <span className="adm-summary-val" style={{ color }}>
                      {val || 0}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── DONORS ── */}
        {activeTab === "donors" && (
          <>
            <div className="adm-section-title">🩸 All Donors</div>
            <div className="adm-section-sub">
              Deleting a donor also deletes all their inventory records
            </div>
            <button style={exportBtnStyle} onClick={exportDonors}>
              ⬇️ Export CSV
            </button>
            <input
              className="adm-search"
              placeholder="🔍 Search name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="adm-count">
              Showing{" "}
              <span>{filterList(donors, ["name", "email"]).length}</span> of{" "}
              {donors.length} donors
            </div>
            {filterList(donors, ["name", "email"]).length === 0 ? (
              <div className="adm-empty">
                <div className="adm-empty-icon">🩸</div>
                <div className="adm-empty-text">
                  {donors.length === 0
                    ? "No donors registered yet"
                    : "No results"}
                </div>
              </div>
            ) : (
              <div className="adm-cards">
                {filterList(donors, ["name", "email"]).map((d) => (
                  <div className="adm-card" key={d._id}>
                    <div className="adm-card-top">
                      <div className="adm-avatar">🩸</div>
                      <div>
                        <div className="adm-card-name">{d.name}</div>
                        <span className="adm-card-role adm-role-donor">
                          Donor
                        </span>
                      </div>
                    </div>
                    <div className="adm-card-detail">
                      ✉️ <span>{d.email}</span>
                    </div>
                    {d.phone && (
                      <div className="adm-card-detail">
                        📞 <span>{d.phone}</span>
                      </div>
                    )}
                    {d.address && (
                      <div className="adm-card-detail">
                        📍 <span>{d.address}</span>
                      </div>
                    )}
                    <div className="adm-divider" />
                    <button
                      className="adm-del-btn"
                      onClick={() => handleDelete(d._id, "donor")}
                    >
                      🗑️ Delete Account + Records
                    </button>
                    <div className="adm-joined">
                      Joined {moment(d.createdAt).fromNow()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── HOSPITALS ── */}
        {activeTab === "hospitals" && (
          <>
            <div className="adm-section-title">🏥 All Hospitals</div>
            <div className="adm-section-sub">
              Deleting a hospital also deletes all their blood requests and
              inventory OUT records
            </div>
            <button style={exportBtnStyle} onClick={exportHospitals}>
              ⬇️ Export CSV
            </button>
            <input
              className="adm-search"
              placeholder="🔍 Search name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="adm-count">
              Showing{" "}
              <span>
                {filterList(hospitals, ["hospitalName", "email"]).length}
              </span>{" "}
              of {hospitals.length} hospitals
            </div>
            {filterList(hospitals, ["hospitalName", "email"]).length === 0 ? (
              <div className="adm-empty">
                <div className="adm-empty-icon">🏥</div>
                <div className="adm-empty-text">
                  {hospitals.length === 0
                    ? "No hospitals registered yet"
                    : "No results"}
                </div>
              </div>
            ) : (
              <div className="adm-cards">
                {filterList(hospitals, ["hospitalName", "email"]).map((h) => (
                  <div className="adm-card" key={h._id}>
                    <div className="adm-card-top">
                      <div className="adm-avatar">🏥</div>
                      <div>
                        <div className="adm-card-name">{h.hospitalName}</div>
                        <span className="adm-card-role adm-role-hospital">
                          Hospital
                        </span>
                      </div>
                    </div>
                    <div className="adm-card-detail">
                      ✉️ <span>{h.email}</span>
                    </div>
                    {h.phone && (
                      <div className="adm-card-detail">
                        📞 <span>{h.phone}</span>
                      </div>
                    )}
                    {h.address && (
                      <div className="adm-card-detail">
                        📍 <span>{h.address}</span>
                      </div>
                    )}
                    <div className="adm-divider" />
                    <button
                      className="adm-del-btn"
                      onClick={() => handleDelete(h._id, "hospital")}
                    >
                      🗑️ Delete Account + Records
                    </button>
                    <div className="adm-joined">
                      Joined {moment(h.createdAt).fromNow()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── ORGANISATIONS ── */}
        {activeTab === "orgs" && (
          <>
            <div className="adm-section-title">🏢 All Organisations</div>
            <div className="adm-section-sub">
              Deleting an org also deletes all their inventory, camps, and
              requests
            </div>
            <button style={exportBtnStyle} onClick={exportOrgs}>
              ⬇️ Export CSV
            </button>
            <input
              className="adm-search"
              placeholder="🔍 Search name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="adm-count">
              Showing{" "}
              <span>
                {filterList(orgs, ["organisationName", "email"]).length}
              </span>{" "}
              of {orgs.length} organisations
            </div>
            {filterList(orgs, ["organisationName", "email"]).length === 0 ? (
              <div className="adm-empty">
                <div className="adm-empty-icon">🏢</div>
                <div className="adm-empty-text">
                  {orgs.length === 0
                    ? "No organisations registered yet"
                    : "No results"}
                </div>
              </div>
            ) : (
              <div className="adm-cards">
                {filterList(orgs, ["organisationName", "email"]).map((o) => (
                  <div className="adm-card" key={o._id}>
                    <div className="adm-card-top">
                      <div className="adm-avatar">🏢</div>
                      <div>
                        <div className="adm-card-name">
                          {o.organisationName}
                        </div>
                        <span className="adm-card-role adm-role-org">
                          Organisation
                        </span>
                      </div>
                    </div>
                    <div className="adm-card-detail">
                      ✉️ <span>{o.email}</span>
                    </div>
                    {o.phone && (
                      <div className="adm-card-detail">
                        📞 <span>{o.phone}</span>
                      </div>
                    )}
                    {o.address && (
                      <div className="adm-card-detail">
                        📍 <span>{o.address}</span>
                      </div>
                    )}
                    <div className="adm-divider" />
                    <button
                      className="adm-del-btn"
                      onClick={() => handleDelete(o._id, "organisation")}
                    >
                      🗑️ Delete Account + Records
                    </button>
                    <div className="adm-joined">
                      Joined {moment(o.createdAt).fromNow()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── REQUESTS ── */}
        {activeTab === "requests" && (
          <>
            <div className="adm-section-title">📋 All Blood Requests</div>
            <div className="adm-section-sub">
              Accept or reject any pending request — updates instantly
              everywhere
            </div>
            {pendingCount > 0 && (
              <div className="adm-alert">
                <span>
                  🔔{" "}
                  <strong>
                    {pendingCount} pending request{pendingCount > 1 ? "s" : ""}
                  </strong>{" "}
                  waiting for approval
                </span>
              </div>
            )}
            <div className="adm-req-filters">
              {["all", "pending", "accepted", "rejected"].map((f) => (
                <button
                  key={f}
                  className={`adm-req-filter ${reqFilter === f ? "active" : ""}`}
                  onClick={() => setReqFilter(f)}
                >
                  {f === "all"
                    ? `All (${requests.length})`
                    : f === "pending"
                      ? `🟡 Pending (${requests.filter((r) => r.status === "pending").length})`
                      : f === "accepted"
                        ? `✅ Accepted (${requests.filter((r) => r.status === "accepted").length})`
                        : `❌ Rejected (${requests.filter((r) => r.status === "rejected").length})`}
                </button>
              ))}
            </div>
            {filteredRequests.length === 0 ? (
              <div className="adm-empty">
                <div className="adm-empty-icon">📋</div>
                <div className="adm-empty-text">
                  No {reqFilter === "all" ? "" : reqFilter} requests found
                </div>
              </div>
            ) : (
              <div className="adm-req-list">
                {filteredRequests.map((req) => (
                  <div className={`adm-req-card ${req.status}`} key={req._id}>
                    <div className="adm-req-top">
                      <div className="adm-req-left">
                        <div className="adm-blood-pill">{req.bloodGroup}</div>
                        <div>
                          <div className="adm-req-name">
                            {req.hospital?.hospitalName || "Unknown Hospital"}
                          </div>
                          <div className="adm-req-detail">
                            📅{" "}
                            {moment(req.createdAt).format(
                              "DD MMM YYYY, hh:mm A",
                            )}{" "}
                            · {moment(req.createdAt).fromNow()}
                          </div>
                        </div>
                      </div>
                      <div className="adm-req-right">
                        <div className="adm-req-qty">{req.quantity} ml</div>
                        <span className={`adm-status ${req.status}`}>
                          {req.status === "pending"
                            ? "🟡 Pending"
                            : req.status === "accepted"
                              ? "✅ Accepted"
                              : "❌ Rejected"}
                        </span>
                      </div>
                    </div>
                    <div className="adm-req-flow">
                      <div className="adm-req-flow-item">
                        🏥 <strong>{req.hospital?.hospitalName}</strong>
                      </div>
                      <div className="adm-req-flow-arrow">→</div>
                      <div className="adm-req-flow-item">requesting from</div>
                      <div className="adm-req-flow-arrow">→</div>
                      <div className="adm-req-flow-item">
                        🏢 <strong>{req.organisation?.organisationName}</strong>
                      </div>
                    </div>
                    {req.status === "pending" && (
                      <div className="adm-req-actions">
                        <button
                          className="adm-accept-btn"
                          onClick={() => handleAccept(req._id)}
                          disabled={loadingId === req._id}
                        >
                          {loadingId === req._id
                            ? "Processing..."
                            : "✅ Accept & Dispatch"}
                        </button>
                        <button
                          className="adm-reject-btn"
                          onClick={() => handleReject(req._id)}
                          disabled={loadingId === req._id}
                        >
                          {loadingId === req._id
                            ? "Processing..."
                            : "❌ Reject"}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── INVENTORY ── */}
        {activeTab === "inventory" && (
          <>
            <div className="adm-section-title">🗃️ All Blood Inventory</div>
            <div className="adm-section-sub">
              Every blood record across all organisations — {inventory.length}{" "}
              total
            </div>
            <button style={exportBtnStyle} onClick={exportInventory}>
              ⬇️ Export CSV
            </button>
            <input
              className="adm-search"
              placeholder="🔍 Filter by blood group (e.g. O+)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="adm-table-wrap">
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>Blood Group</th>
                    <th>Type</th>
                    <th>Quantity</th>
                    <th>Organisation</th>
                    <th>Donor / Hospital</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {inventory
                    .filter(
                      (r) =>
                        !search ||
                        r.bloodGroup
                          ?.toLowerCase()
                          .includes(search.toLowerCase()),
                    )
                    .slice(0, 150)
                    .map((record) => (
                      <tr key={record._id}>
                        <td>
                          <span className="adm-badge adm-badge-blood">
                            {record.bloodGroup}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`adm-badge ${record.inventoryType === "in" ? "adm-badge-in" : "adm-badge-out"}`}
                          >
                            {record.inventoryType === "in" ? "📥 IN" : "📤 OUT"}
                          </span>
                        </td>
                        <td>{record.quantity} ml</td>
                        <td style={{ fontSize: 12 }}>
                          {record.organisation?.organisationName || "—"}
                        </td>
                        <td
                          style={{
                            fontSize: 12,
                            color: "rgba(255,255,255,0.4)",
                          }}
                        >
                          {record.inventoryType === "in"
                            ? record.donar?.name || record.donar?.email || "—"
                            : record.hospital?.hospitalName ||
                              record.hospital?.email ||
                              "—"}
                        </td>
                        <td style={{ fontSize: 12 }}>
                          {moment(record.createdAt).format("DD MMM YY, HH:mm")}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            {inventory.length > 150 && (
              <div
                style={{
                  fontSize: 12,
                  color: "rgba(255,255,255,0.25)",
                  marginTop: 10,
                  textAlign: "center",
                }}
              >
                Showing first 150 of {inventory.length} records
              </div>
            )}
          </>
        )}

        {/* ── CAMPS ── */}
        {activeTab === "camps" && (
          <>
            <div className="adm-section-title">🏕️ All Donation Camps</div>
            <div className="adm-section-sub">
              All camps across all organisations — remove any invalid ones
            </div>
            <input
              className="adm-search"
              placeholder="🔍 Search by name or address..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="adm-count">
              Showing{" "}
              <span>
                {
                  camps.filter(
                    (c) =>
                      !search ||
                      c.campName
                        ?.toLowerCase()
                        .includes(search.toLowerCase()) ||
                      c.address?.toLowerCase().includes(search.toLowerCase()),
                  ).length
                }
              </span>{" "}
              camps
            </div>
            {camps.length === 0 ? (
              <div className="adm-empty">
                <div className="adm-empty-icon">🏕️</div>
                <div className="adm-empty-text">No camps created yet</div>
              </div>
            ) : (
              <div className="adm-camp-list">
                {camps
                  .filter(
                    (c) =>
                      !search ||
                      c.campName
                        ?.toLowerCase()
                        .includes(search.toLowerCase()) ||
                      c.address?.toLowerCase().includes(search.toLowerCase()),
                  )
                  .map((camp) => (
                    <div className="adm-camp-card" key={camp._id}>
                      <div className="adm-camp-left">
                        <div className="adm-camp-icon">🏕️</div>
                        <div>
                          <div className="adm-camp-name">
                            {camp.campName}
                            {camp.isActive && (
                              <span className="adm-active-badge">Active</span>
                            )}
                          </div>
                          <div className="adm-camp-detail">
                            📍 {camp.address}
                          </div>
                          <div className="adm-camp-detail">
                            📅 {moment(camp.date).format("DD MMM YYYY")}{" "}
                            &nbsp;🕐 {camp.time}
                          </div>
                          {camp.attendance != null && (
                            <div className="adm-camp-detail">
                              👥 {camp.attendance} donors attended
                            </div>
                          )}
                          <div className="adm-camp-org">
                            🏥 {camp.organisation?.organisationName} ·{" "}
                            {camp.organisation?.email}
                          </div>
                        </div>
                      </div>
                      <button
                        className="adm-camp-del-btn"
                        onClick={() => handleDeleteCamp(camp._id)}
                      >
                        🗑️ Remove
                      </button>
                    </div>
                  ))}
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
};

export default AdminHome;
