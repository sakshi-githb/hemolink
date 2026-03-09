import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import Spinner from "../components/shared/Spinner";
import Layout from "../components/shared/Layout/Layout";
import Modal from "../components/shared/modal/Modal";
import API from "../services/API";
import moment from "moment";

const facts = [
  {
    icon: "💉",
    text: "1 donation can save up to 3 lives — your blood is separated into red cells, plasma & platelets.",
  },
  {
    icon: "⏱️",
    text: "The whole donation process takes only 8–10 minutes. You're a hero in under 15!",
  },
  {
    icon: "🔁",
    text: "Your body fully replenishes donated blood within 24–48 hours.",
  },
  {
    icon: "🩺",
    text: "Before donating, you get a free mini health checkup — blood pressure, haemoglobin & more.",
  },
  {
    icon: "🔒",
    text: "Your identity is 100% private. Hospitals only see blood type — never your name or contact.",
  },
  {
    icon: "🌍",
    text: "Every 2 seconds, someone in the world needs blood. Your one donation matters enormously.",
  },
];

const bloodGroups = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"];

const HomePage = () => {
  const { loading, error, user } = useSelector((state) => state.auth);
  const [data, setData] = useState([]);
  const [totalOrgs, setTotalOrgs] = useState(0);
  const [camps, setCamps] = useState([]);
  const [factIndex, setFactIndex] = useState(0);
  const [hospitalRequests, setHospitalRequests] = useState([]);
  const [bloodAvailability, setBloodAvailability] = useState([]);
  const [orgChartData, setOrgChartData] = useState([]);
  const navigate = useNavigate();

  const isOrg = user?.role === "organisation";
  const isDonor = user?.role === "donar";
  const isHospital = user?.role === "hospital";
  const isAdmin = user?.role === "admin";

  const fetchAll = async () => {
    try {
      if (isOrg) {
        const { data: inv } = await API.get("/inventory/get-inventory");
        if (inv?.success) {
          setData(inv.inventory);
          // Build chart data from inventory
          const chart = bloodGroups.map((bg) => {
            const inTotal = inv.inventory
              .filter((r) => r.inventoryType === "in" && r.bloodGroup === bg)
              .reduce((s, r) => s + r.quantity, 0);
            const outTotal = inv.inventory
              .filter((r) => r.inventoryType === "out" && r.bloodGroup === bg)
              .reduce((s, r) => s + r.quantity, 0);
            return {
              bg,
              in: inTotal,
              out: outTotal,
              available: Math.max(0, inTotal - outTotal),
            };
          });
          setOrgChartData(chart);
        }
      }
      if (isDonor) {
        const { data: inv } = await API.post(
          "/inventory/get-inventory-hospital",
          {
            filters: { inventoryType: "in", donar: user?._id },
          },
        );
        if (inv?.success) setData(inv.inventory);
      }
      if (isHospital) {
        const { data: reqs } = await API.get("/request/get-hospital-requests");
        if (reqs?.success) setHospitalRequests(reqs.requests);
        const { data: avail } = await API.get(
          "/inventory/get-blood-availability",
        );
        if (avail?.success) setBloodAvailability(avail.availability);
      }
      const { data: orgs } = await API.get("/inventory/get-all-organisations");
      if (orgs?.success) setTotalOrgs(orgs.organisations?.length || 0);
      const { data: campsData } = await API.get("/camp/get-all-camps");
      if (campsData?.success) setCamps(campsData.camps);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    if (!user) return;
    if (isAdmin) {
      navigate("/admin");
      return;
    }
    fetchAll();
    const dataInterval = setInterval(fetchAll, 10000);
    const factInterval = setInterval(
      () => setFactIndex((i) => (i + 1) % facts.length),
      4000,
    );
    return () => {
      clearInterval(dataInterval);
      clearInterval(factInterval);
    };
  }, [user]);

  const pendingRequests = hospitalRequests.filter(
    (r) => r.status === "pending",
  ).length;
  const acceptedRequests = hospitalRequests.filter(
    (r) => r.status === "accepted",
  ).length;

  // Low stock alerts for hospital — any blood group below 500ml anywhere
  const lowStockAlerts = isHospital
    ? bloodAvailability.flatMap((a) =>
        a.bloodData
          .filter((b) => b.available > 0 && b.available < 500)
          .map((b) => ({
            org: a.organisation?.organisationName,
            bloodGroup: b.bloodGroup,
            ml: b.available,
          })),
      )
    : [];

  // Low stock for org
  const orgLowStock = isOrg
    ? orgChartData.filter((d) => d.available > 0 && d.available < 500)
    : [];

  // Max value for chart scaling
  const chartMax = Math.max(
    ...orgChartData.map((d) => Math.max(d.in, d.out)),
    1,
  );

  return (
    <Layout>
      {error && <span>{alert(error)}</span>}
      {loading ? (
        <Spinner />
      ) : (
        <>
          <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
            .hemo-home { font-family: 'DM Sans', sans-serif; }
            .hemo-greeting { margin-bottom: 28px; }
            .hemo-greeting-hi { font-family: 'Syne', sans-serif; font-size: 28px; font-weight: 700; color: #fff; margin-bottom: 4px; }
            .hemo-greeting-sub { font-size: 15px; color: rgba(255,255,255,0.4); }
            .hemo-greeting-name { background: linear-gradient(90deg, #c084fc, #f472b6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
            .hemo-live { display: inline-flex; align-items: center; gap: 6px; padding: 5px 12px; border-radius: 20px; background: rgba(34,197,94,0.1); border: 1px solid rgba(34,197,94,0.2); font-size: 11px; color: #4ade80; font-weight: 600; margin-left: 12px; vertical-align: middle; }
            .hemo-live-dot { width: 6px; height: 6px; border-radius: 50%; background: #4ade80; animation: pulse 1.5s infinite; }
            @keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:0.3;} }
            .hemo-stats { display: flex; gap: 16px; margin-bottom: 28px; flex-wrap: wrap; }
            .hemo-stat-card { flex: 1; min-width: 150px; padding: 20px 22px; border-radius: 18px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); transition: transform 0.2s; }
            .hemo-stat-card:hover { transform: translateY(-3px); }
            .hemo-stat-icon { font-size: 26px; margin-bottom: 10px; }
            .hemo-stat-num { font-family: 'Syne', sans-serif; font-size: 30px; font-weight: 800; color: #fff; margin-bottom: 2px; }
            .hemo-stat-label { font-size: 13px; color: rgba(255,255,255,0.4); }
            .hemo-stat-card.purple { border-color: rgba(168,85,247,0.25); background: rgba(168,85,247,0.08); }
            .hemo-stat-card.pink { border-color: rgba(236,72,153,0.25); background: rgba(236,72,153,0.08); }
            .hemo-stat-card.blue { border-color: rgba(99,102,241,0.25); background: rgba(99,102,241,0.08); }
            .hemo-stat-card.green { border-color: rgba(34,197,94,0.25); background: rgba(34,197,94,0.08); }
            .hemo-stat-card.yellow { border-color: rgba(234,179,8,0.25); background: rgba(234,179,8,0.08); }
            .hemo-fact-card { padding: 18px 22px; border-radius: 16px; margin-bottom: 28px; background: linear-gradient(135deg, rgba(168,85,247,0.12), rgba(236,72,153,0.08)); border: 1px solid rgba(168,85,247,0.2); display: flex; align-items: center; gap: 14px; }
            .hemo-fact-icon { font-size: 24px; flex-shrink: 0; }
            .hemo-fact-text { font-size: 14px; color: rgba(255,255,255,0.75); line-height: 1.5; }
            .hemo-fact-label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #a855f7; margin-bottom: 4px; }
            .hemo-privacy { padding: 18px 20px; border-radius: 14px; margin-bottom: 28px; background: rgba(34,197,94,0.06); border: 1px solid rgba(34,197,94,0.15); display: flex; gap: 14px; align-items: flex-start; }
            .hemo-privacy-icon { font-size: 22px; flex-shrink: 0; }
            .hemo-privacy-title { font-size: 14px; font-weight: 600; color: #4ade80; margin-bottom: 4px; }
            .hemo-privacy-text { font-size: 13px; color: rgba(255,255,255,0.5); line-height: 1.5; }
            .hemo-two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 28px; }
            @media (max-width: 900px) { .hemo-two-col { grid-template-columns: 1fr; } }
            .hemo-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 18px; padding: 22px; }
            .hemo-card-title { font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 700; color: rgba(255,255,255,0.85); margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
            .hemo-add-btn { display: inline-flex; align-items: center; gap: 8px; padding: 10px 20px; border-radius: 12px; border: none; cursor: pointer; background: linear-gradient(135deg, #9333ea, #ec4899); color: white; font-size: 14px; font-weight: 600; font-family: 'DM Sans', sans-serif; box-shadow: 0 4px 16px rgba(147,51,234,0.35); transition: all 0.2s; margin-bottom: 18px; }
            .hemo-add-btn:hover { transform: translateY(-2px); }
            .hemo-table { width: 100%; border-collapse: collapse; font-size: 13px; }
            .hemo-table th { text-align: left; padding: 10px 12px; font-size: 11px; font-weight: 600; color: rgba(255,255,255,0.3); text-transform: uppercase; letter-spacing: 0.8px; border-bottom: 1px solid rgba(255,255,255,0.06); }
            .hemo-table td { padding: 12px 12px; color: rgba(255,255,255,0.7); border-bottom: 1px solid rgba(255,255,255,0.04); }
            .hemo-table tr:hover td { background: rgba(168,85,247,0.05); }
            .hemo-badge { display: inline-block; padding: 3px 10px; border-radius: 8px; font-size: 11px; font-weight: 600; }
            .hemo-badge-in { background: rgba(34,197,94,0.15); color: #4ade80; }
            .hemo-badge-out { background: rgba(239,68,68,0.15); color: #f87171; }
            .hemo-badge-blood { background: rgba(168,85,247,0.15); color: #c084fc; }
            .hemo-badge-pending { background: rgba(234,179,8,0.15); color: #fbbf24; }
            .hemo-badge-accepted { background: rgba(34,197,94,0.15); color: #4ade80; }
            .hemo-badge-rejected { background: rgba(239,68,68,0.15); color: #f87171; }
            .hemo-empty { text-align: center; padding: 40px; color: rgba(255,255,255,0.2); font-size: 14px; }
            .hemo-steps { display: flex; flex-direction: column; gap: 12px; }
            .hemo-step { display: flex; align-items: flex-start; gap: 12px; }
            .hemo-step-num { width: 28px; height: 28px; border-radius: 8px; flex-shrink: 0; background: linear-gradient(135deg, #9333ea, #ec4899); display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; color: white; }
            .hemo-step-text { font-size: 13px; color: rgba(255,255,255,0.6); line-height: 1.5; padding-top: 4px; }
            .hemo-step-text strong { color: rgba(255,255,255,0.85); }
            .hemo-camp-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 16px; margin-bottom: 10px; display: flex; align-items: flex-start; gap: 14px; }
            .hemo-camp-icon { font-size: 22px; flex-shrink: 0; margin-top: 2px; }
            .hemo-camp-name { font-size: 14px; font-weight: 600; color: rgba(255,255,255,0.85); margin-bottom: 4px; }
            .hemo-camp-addr { font-size: 12px; color: rgba(255,255,255,0.4); margin-bottom: 4px; }
            .hemo-camp-date { font-size: 11px; color: #a855f7; font-weight: 500; }
            .hemo-camp-org { font-size: 11px; color: #4ade80; margin-top: 4px; }
            .hemo-camp-badge { display: inline-block; padding: 2px 8px; border-radius: 6px; font-size: 10px; font-weight: 600; background: rgba(34,197,94,0.15); color: #4ade80; margin-left: 8px; }
            .hemo-section-title { font-family: 'Syne', sans-serif; font-size: 17px; font-weight: 700; color: rgba(255,255,255,0.85); margin-bottom: 16px; }
            .hemo-donate-link { display: inline-block; margin-top: 12px; padding: 10px 20px; border-radius: 12px; background: linear-gradient(135deg, #9333ea, #ec4899); color: white; font-size: 13px; font-weight: 600; text-decoration: none; font-family: 'DM Sans', sans-serif; }
            .hemo-alert { padding: 14px 18px; border-radius: 12px; margin-bottom: 20px; display: flex; align-items: flex-start; gap: 12px; flex-wrap: wrap; justify-content: space-between; }
            .hemo-alert.yellow { background: rgba(234,179,8,0.08); border: 1px solid rgba(234,179,8,0.25); color: #fbbf24; }
            .hemo-alert.red { background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.25); color: #f87171; }
            .hemo-alert-link { color: #c084fc; font-weight: 600; text-decoration: none; font-size: 13px; background: none; border: none; cursor: pointer; font-family: inherit; }
            .hemo-low-pills { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
            .hemo-low-pill { padding: 3px 10px; border-radius: 7px; font-size: 11px; font-weight: 600; background: rgba(239,68,68,0.15); color: #f87171; border: 1px solid rgba(239,68,68,0.2); }

            /* ORG CHART */
            .org-chart { margin-bottom: 28px; }
            .org-chart-title { font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 700; color: #fff; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
            .org-chart-wrap { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); border-radius: 16px; padding: 20px; }
            .org-chart-legend { display: flex; gap: 16px; margin-bottom: 16px; flex-wrap: wrap; }
            .org-chart-legend-item { display: flex; align-items: center; gap: 6px; font-size: 12px; color: rgba(255,255,255,0.5); }
            .org-chart-legend-dot { width: 10px; height: 10px; border-radius: 3px; }
            .org-chart-bars { display: flex; gap: 8px; align-items: flex-end; height: 160px; }
            .org-chart-group { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; height: 100%; justify-content: flex-end; }
            .org-chart-bar-pair { display: flex; gap: 3px; align-items: flex-end; width: 100%; justify-content: center; }
            .org-chart-bar { width: 14px; border-radius: 4px 4px 0 0; transition: height 0.5s ease; min-height: 2px; cursor: pointer; position: relative; }
            .org-chart-bar:hover::after { content: attr(data-val) 'ml'; position: absolute; bottom: 100%; left: 50%; transform: translateX(-50%); background: rgba(0,0,0,0.8); color: #fff; font-size: 10px; padding: 3px 6px; border-radius: 4px; white-space: nowrap; margin-bottom: 4px; }
            .org-chart-bar.in { background: linear-gradient(180deg, #4ade80, #16a34a); }
            .org-chart-bar.out { background: linear-gradient(180deg, #f87171, #dc2626); }
            .org-chart-bar.avail { background: linear-gradient(180deg, #c084fc, #7c3aed); }
            .org-chart-label { font-size: 10px; color: rgba(255,255,255,0.4); margin-top: 6px; font-weight: 600; }
            .org-chart-low { display: flex; align-items: center; gap: 6px; padding: 10px 14px; border-radius: 10px; background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2); font-size: 12px; color: #f87171; margin-top: 14px; flex-wrap: wrap; }
            .org-chart-low strong { color: #fca5a5; }
          `}</style>

          <div className="hemo-home">
            <div className="hemo-greeting">
              <div className="hemo-greeting-hi">
                Hey,{" "}
                <span className="hemo-greeting-name">
                  {user?.name ||
                    user?.organisationName ||
                    user?.hospitalName ||
                    "there"}
                </span>{" "}
                👋
                <span className="hemo-live">
                  <div className="hemo-live-dot" /> Live
                </span>
              </div>
              <div className="hemo-greeting-sub">
                {isOrg
                  ? "Manage your blood inventory below"
                  : isHospital
                    ? "Track blood requests and availability"
                    : "Welcome to HemoLink — every drop counts 🩸"}
              </div>
            </div>

            {/* Hospital pending request alert */}
            {isHospital && pendingRequests > 0 && (
              <div className="hemo-alert yellow">
                <span>
                  🟡{" "}
                  <strong>
                    {pendingRequests} pending request
                    {pendingRequests > 1 ? "s" : ""}
                  </strong>{" "}
                  waiting for organisation approval
                </span>
                <a href="/consumer" className="hemo-alert-link">
                  View status →
                </a>
              </div>
            )}

            {/* Hospital low stock alert */}
            {isHospital && lowStockAlerts.length > 0 && (
              <div className="hemo-alert red">
                <div>
                  <div>
                    ⚠️ <strong>Low stock alert</strong> — some blood groups are
                    running low across blood banks
                  </div>
                  <div className="hemo-low-pills">
                    {lowStockAlerts.slice(0, 8).map((a, i) => (
                      <span key={i} className="hemo-low-pill">
                        {a.bloodGroup} @ {a.org} ({a.ml}ml)
                      </span>
                    ))}
                  </div>
                </div>
                <a href="/orgnaisation" className="hemo-alert-link">
                  Request now →
                </a>
              </div>
            )}

            {/* Org low stock alert */}
            {isOrg && orgLowStock.length > 0 && (
              <div className="hemo-alert red">
                <div>
                  ⚠️ <strong>Low inventory warning!</strong> These blood groups
                  are below 500ml:
                  <div className="hemo-low-pills">
                    {orgLowStock.map((d) => (
                      <span key={d.bg} className="hemo-low-pill">
                        {d.bg}: {d.available}ml
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="hemo-stats">
              {isHospital ? (
                <>
                  <div className="hemo-stat-card yellow">
                    <div className="hemo-stat-icon">🟡</div>
                    <div className="hemo-stat-num">{pendingRequests}</div>
                    <div className="hemo-stat-label">Pending Requests</div>
                  </div>
                  <div className="hemo-stat-card green">
                    <div className="hemo-stat-icon">✅</div>
                    <div className="hemo-stat-num">{acceptedRequests}</div>
                    <div className="hemo-stat-label">Accepted</div>
                  </div>
                  <div className="hemo-stat-card pink">
                    <div className="hemo-stat-icon">🏢</div>
                    <div className="hemo-stat-num">{totalOrgs}</div>
                    <div className="hemo-stat-label">Blood Banks</div>
                  </div>
                  <div className="hemo-stat-card blue">
                    <div className="hemo-stat-icon">🏕️</div>
                    <div className="hemo-stat-num">{camps.length}</div>
                    <div className="hemo-stat-label">Active Camps</div>
                  </div>
                </>
              ) : (
                <>
                  <div className="hemo-stat-card purple">
                    <div className="hemo-stat-icon">🩸</div>
                    <div className="hemo-stat-num">{data.length}</div>
                    <div className="hemo-stat-label">
                      {isDonor ? "Your Donations" : "Blood Records"}
                    </div>
                  </div>
                  <div className="hemo-stat-card pink">
                    <div className="hemo-stat-icon">🏢</div>
                    <div className="hemo-stat-num">{totalOrgs}</div>
                    <div className="hemo-stat-label">Organisations</div>
                  </div>
                  <div className="hemo-stat-card blue">
                    <div className="hemo-stat-icon">🏕️</div>
                    <div className="hemo-stat-num">{camps.length}</div>
                    <div className="hemo-stat-label">Active Camps</div>
                  </div>
                </>
              )}
            </div>

            <div className="hemo-fact-card">
              <div className="hemo-fact-icon">{facts[factIndex].icon}</div>
              <div>
                <div className="hemo-fact-label">Did you know?</div>
                <div className="hemo-fact-text">{facts[factIndex].text}</div>
              </div>
            </div>

            {/* ORG INVENTORY CHART */}
            {isOrg && orgChartData.some((d) => d.in > 0 || d.out > 0) && (
              <div className="org-chart">
                <div className="org-chart-title">
                  📊 Blood Inventory Overview
                </div>
                <div className="org-chart-wrap">
                  <div className="org-chart-legend">
                    <div className="org-chart-legend-item">
                      <div
                        className="org-chart-legend-dot"
                        style={{ background: "#4ade80" }}
                      />{" "}
                      Donated (IN)
                    </div>
                    <div className="org-chart-legend-item">
                      <div
                        className="org-chart-legend-dot"
                        style={{ background: "#f87171" }}
                      />{" "}
                      Used (OUT)
                    </div>
                    <div className="org-chart-legend-item">
                      <div
                        className="org-chart-legend-dot"
                        style={{ background: "#c084fc" }}
                      />{" "}
                      Available
                    </div>
                  </div>
                  <div className="org-chart-bars">
                    {orgChartData.map((d) => (
                      <div className="org-chart-group" key={d.bg}>
                        <div className="org-chart-bar-pair">
                          <div
                            className="org-chart-bar in"
                            data-val={d.in}
                            style={{ height: `${(d.in / chartMax) * 130}px` }}
                            title={`IN: ${d.in}ml`}
                          />
                          <div
                            className="org-chart-bar out"
                            data-val={d.out}
                            style={{ height: `${(d.out / chartMax) * 130}px` }}
                            title={`OUT: ${d.out}ml`}
                          />
                          <div
                            className="org-chart-bar avail"
                            data-val={d.available}
                            style={{
                              height: `${(d.available / chartMax) * 130}px`,
                            }}
                            title={`Available: ${d.available}ml`}
                          />
                        </div>
                        <div className="org-chart-label">{d.bg}</div>
                      </div>
                    ))}
                  </div>
                  {orgLowStock.length > 0 && (
                    <div className="org-chart-low">
                      ⚠️ <strong>Low stock:</strong>
                      {orgLowStock.map((d) => (
                        <span key={d.bg} style={{ marginLeft: 6 }}>
                          {" "}
                          {d.bg} ({d.available}ml)
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ORG: add record button + recent inventory */}
            {isOrg && (
              <>
                <button
                  className="hemo-add-btn"
                  data-bs-toggle="modal"
                  data-bs-target="#staticBackdrop"
                >
                  + Add Blood Record
                </button>
                <Modal onSuccess={fetchAll} />
                <div className="hemo-card" style={{ marginBottom: 24 }}>
                  <div className="hemo-card-title">🗃️ Recent Records</div>
                  {data.length === 0 ? (
                    <div className="hemo-empty">
                      No records yet — add your first blood record above
                    </div>
                  ) : (
                    <div style={{ overflowX: "auto" }}>
                      <table className="hemo-table">
                        <thead>
                          <tr>
                            <th>Blood Group</th>
                            <th>Type</th>
                            <th>Quantity</th>
                            <th>Email</th>
                            <th>Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.slice(0, 10).map((record) => (
                            <tr key={record._id}>
                              <td>
                                <span className="hemo-badge hemo-badge-blood">
                                  {record.bloodGroup}
                                </span>
                              </td>
                              <td>
                                <span
                                  className={`hemo-badge ${record.inventoryType === "in" ? "hemo-badge-in" : "hemo-badge-out"}`}
                                >
                                  {record.inventoryType === "in"
                                    ? "📥 IN"
                                    : "📤 OUT"}
                                </span>
                              </td>
                              <td>{record.quantity} ML</td>
                              <td style={{ fontSize: 12 }}>{record.email}</td>
                              <td style={{ fontSize: 12 }}>
                                {moment(record.createdAt).format("DD MMM YYYY")}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* DONOR: recent donations */}
            {isDonor && (
              <div className="hemo-two-col">
                <div className="hemo-card">
                  <div className="hemo-card-title">🩸 Recent Donations</div>
                  {data.length === 0 ? (
                    <div className="hemo-empty">
                      No donations yet
                      <br />
                      <a className="hemo-donate-link" href="/donation">
                        Record First Donation →
                      </a>
                    </div>
                  ) : (
                    <table className="hemo-table">
                      <thead>
                        <tr>
                          <th>Blood Group</th>
                          <th>Qty</th>
                          <th>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.slice(0, 6).map((r) => (
                          <tr key={r._id}>
                            <td>
                              <span className="hemo-badge hemo-badge-blood">
                                {r.bloodGroup}
                              </span>
                            </td>
                            <td>{r.quantity} ml</td>
                            <td style={{ fontSize: 12 }}>
                              {moment(r.createdAt).format("DD MMM YY")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
                <div className="hemo-card">
                  <div className="hemo-card-title">🏕️ Upcoming Camps</div>
                  {camps.length === 0 ? (
                    <div className="hemo-empty">No active camps right now</div>
                  ) : (
                    camps.slice(0, 3).map((camp) => (
                      <div className="hemo-camp-card" key={camp._id}>
                        <div className="hemo-camp-icon">🏕️</div>
                        <div>
                          <div className="hemo-camp-name">
                            {camp.campName}{" "}
                            <span className="hemo-camp-badge">Active</span>
                          </div>
                          <div className="hemo-camp-addr">
                            📍 {camp.address}
                          </div>
                          <div className="hemo-camp-date">
                            📅 {moment(camp.date).format("DD MMM YYYY")} ·{" "}
                            {camp.time}
                          </div>
                          <div className="hemo-camp-org">
                            🏥 {camp.organisation?.organisationName}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* HOSPITAL: recent requests */}
            {isHospital && (
              <div className="hemo-card" style={{ marginBottom: 24 }}>
                <div className="hemo-card-title">📋 Recent Blood Requests</div>
                {hospitalRequests.length === 0 ? (
                  <div className="hemo-empty">
                    No requests yet —{" "}
                    <a href="/orgnaisation" style={{ color: "#c084fc" }}>
                      request blood from a blood bank →
                    </a>
                  </div>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table className="hemo-table">
                      <thead>
                        <tr>
                          <th>Blood Group</th>
                          <th>Qty</th>
                          <th>Organisation</th>
                          <th>Status</th>
                          <th>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {hospitalRequests.slice(0, 8).map((r) => (
                          <tr key={r._id}>
                            <td>
                              <span className="hemo-badge hemo-badge-blood">
                                {r.bloodGroup}
                              </span>
                            </td>
                            <td>{r.quantity} ml</td>
                            <td style={{ fontSize: 12 }}>
                              {r.organisation?.organisationName || "—"}
                            </td>
                            <td>
                              <span
                                className={`hemo-badge hemo-badge-${r.status}`}
                              >
                                {r.status === "pending"
                                  ? "🟡 Pending"
                                  : r.status === "accepted"
                                    ? "✅ Accepted"
                                    : "❌ Rejected"}
                              </span>
                            </td>
                            <td style={{ fontSize: 12 }}>
                              {moment(r.createdAt).format("DD MMM YY")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            <div className="hemo-privacy">
              <div className="hemo-privacy-icon">🔒</div>
              <div>
                <div className="hemo-privacy-title">
                  Your privacy is protected
                </div>
                <div className="hemo-privacy-text">
                  {isDonor
                    ? "Hospitals and blood banks never see your name, phone, or address. They only see your blood type and quantity when it's needed."
                    : isHospital
                      ? "Donor personal information is never shared with hospitals. All you see is blood type and availability."
                      : "Donor personal information is protected. You only receive blood type and quantity data — no personal details."}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </Layout>
  );
};

export default HomePage;
