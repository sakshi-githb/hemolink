import moment from "moment";
import React, { useEffect, useState } from "react";
import Layout from "../components/shared/Layout/Layout";
import API from "../services/API";
import { useSelector } from "react-redux";
import DonorCampMap from "../components/shared/DonorCampMap";

const bloodGroups = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"];

const Donation = () => {
  const { user } = useSelector((state) => state.auth);
  const [data, setData] = useState([]);
  const [usageData, setUsageData] = useState([]);
  const [camps, setCamps] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [bloodGroup, setBloodGroup] = useState("");
  const [quantity, setQuantity] = useState("");
  const [campSearch, setCampSearch] = useState("");
  const [selectedCamp, setSelectedCamp] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showAllCamps, setShowAllCamps] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  const getDonations = async () => {
    try {
      const { data } = await API.post("/inventory/get-inventory-hospital", {
        filters: { inventoryType: "in", donar: user?._id },
      });
      if (data?.success) setData(data?.inventory);
    } catch (error) {
      console.log(error);
    }
  };

  const getUsage = async () => {
    try {
      const { data } = await API.get("/inventory/get-donor-blood-usage");
      if (data?.success) setUsageData(data?.usageData);
    } catch (error) {
      console.log(error);
    }
  };

  const getCamps = async (all = false) => {
    try {
      const { data } = await API.get(
        `/camp/get-all-camps${all ? "?showAll=true" : ""}`,
      );
      if (data?.success) setCamps(data?.camps);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getDonations();
    getCamps();
    getUsage();
  }, []);

  // ELIGIBILITY CHECK — 90 days between donations
  const sortedDonations = [...data].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  );
  const lastDonation = sortedDonations.length > 0 ? sortedDonations[0] : null;
  const daysSinceLast = lastDonation
    ? moment().diff(moment(lastDonation.createdAt), "days")
    : null;
  const canDonate = daysSinceLast === null || daysSinceLast >= 90;
  const daysRemaining = canDonate ? 0 : 90 - daysSinceLast;

  const filteredCamps =
    campSearch.trim() === ""
      ? camps
      : camps.filter(
          (c) =>
            c.campName?.toLowerCase().includes(campSearch.toLowerCase()) ||
            c.address?.toLowerCase().includes(campSearch.toLowerCase()) ||
            c.organisation?.organisationName
              ?.toLowerCase()
              .includes(campSearch.toLowerCase()),
        );

  const handleSelectCamp = (camp) => {
    setSelectedCamp(camp);
    setCampSearch(camp.campName);
    setShowSuggestions(false);
  };

  const handleSubmit = async () => {
    try {
      if (!canDonate)
        return alert(
          `You need to wait ${daysRemaining} more days before donating again.`,
        );
      if (!bloodGroup || !quantity || !selectedCamp)
        return alert("Please fill all fields and select a camp");
      if (!selectedCamp?.organisation?._id)
        return alert("Camp has no linked organisation. Contact admin.");
      setSubmitting(true);
      const { data } = await API.post("/inventory/create-inventory", {
        email: user?.email,
        organisation: selectedCamp.organisation._id,
        inventoryType: "in",
        bloodGroup,
        quantity: Number(quantity),
      });
      if (data?.success) {
        setShowForm(false);
        setBloodGroup("");
        setQuantity("");
        setCampSearch("");
        setSelectedCamp(null);
        getDonations();
        getUsage();
      }
    } catch (error) {
      alert(error?.response?.data?.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const totalDonated = data.reduce((sum, r) => sum + (r.quantity || 0), 0);
  const totalUsed = usageData.reduce(
    (sum, u) => sum + Math.min(u.usedQty || 0, u.donatedQty || 0),
    0,
  );

  return (
    <Layout>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
        .don-page { font-family: 'DM Sans', sans-serif; }
        .don-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 28px; flex-wrap: wrap; gap: 12px; }
        .don-title { font-family: 'Syne', sans-serif; font-size: 26px; font-weight: 700; color: #fff; margin-bottom: 4px; }
        .don-title span { background: linear-gradient(90deg, #c084fc, #f472b6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .don-subtitle { font-size: 14px; color: rgba(255,255,255,0.5); margin-top: 4px; }
        .don-btn-row { display: flex; gap: 10px; flex-wrap: wrap; }
        .don-add-btn { padding: 11px 22px; border-radius: 12px; border: none; cursor: pointer; background: linear-gradient(135deg, #9333ea, #ec4899); color: white; font-size: 14px; font-weight: 600; font-family: 'DM Sans', sans-serif; box-shadow: 0 4px 16px rgba(147,51,234,0.35); transition: all 0.2s; }
        .don-add-btn:hover { transform: translateY(-2px); }
        .don-add-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
        .don-map-btn { padding: 11px 22px; border-radius: 12px; border: 1px solid rgba(168,85,247,0.3); cursor: pointer; background: rgba(168,85,247,0.08); color: #c084fc; font-size: 14px; font-weight: 600; font-family: 'DM Sans', sans-serif; transition: all 0.2s; }
        .don-map-btn:hover { background: rgba(168,85,247,0.18); }
        .don-eligibility { padding: 16px 20px; border-radius: 14px; margin-bottom: 24px; display: flex; align-items: center; gap: 14px; }
        .don-eligibility.ok { background: rgba(34,197,94,0.08); border: 1px solid rgba(34,197,94,0.25); }
        .don-eligibility.wait { background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.25); }
        .don-elig-icon { font-size: 24px; flex-shrink: 0; }
        .don-elig-title { font-size: 14px; font-weight: 600; margin-bottom: 3px; }
        .don-elig-title.ok { color: #4ade80; }
        .don-elig-title.wait { color: #f87171; }
        .don-elig-sub { font-size: 12px; color: rgba(255,255,255,0.5); }
        .don-elig-bar { height: 4px; border-radius: 2px; background: rgba(255,255,255,0.08); margin-top: 8px; overflow: hidden; }
        .don-elig-bar-fill { height: 100%; border-radius: 2px; background: linear-gradient(90deg, #9333ea, #ec4899); transition: width 0.5s ease; }
        .don-map-section { margin-bottom: 28px; }
        .don-map-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; flex-wrap: wrap; gap: 10px; }
        .don-map-title { font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 700; color: #fff; }
        .don-camp-filter { display: flex; gap: 8px; }
        .don-camp-filter-btn { padding: 6px 14px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); background: transparent; color: rgba(255,255,255,0.5); font-size: 12px; font-weight: 600; font-family: 'DM Sans', sans-serif; cursor: pointer; transition: all 0.2s; }
        .don-camp-filter-btn.active { background: rgba(168,85,247,0.15); border-color: rgba(168,85,247,0.35); color: #e879f9; }
        .don-map-pins { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 10px; margin-top: 14px; }
        .don-map-pin { background: rgba(255,255,255,0.03); border: 1px solid rgba(168,85,247,0.15); border-radius: 12px; padding: 12px 14px; transition: all 0.2s; }
        .don-map-pin:hover { border-color: rgba(168,85,247,0.35); }
        .don-map-pin-name { font-size: 13px; font-weight: 600; color: #fff; margin-bottom: 4px; }
        .don-map-pin-detail { font-size: 11px; color: rgba(255,255,255,0.6); margin-bottom: 2px; }
        .don-map-pin-org { font-size: 11px; color: #a855f7; margin-top: 4px; font-weight: 500; }
        .don-form-card { background: rgba(168,85,247,0.07); border: 1px solid rgba(168,85,247,0.2); border-radius: 20px; padding: 28px; margin-bottom: 28px; animation: slideDown 0.3s ease; }
        @keyframes slideDown { from { opacity:0; transform:translateY(-10px); } to { opacity:1; transform:translateY(0); } }
        .don-form-title { font-family: 'Syne', sans-serif; font-size: 17px; font-weight: 700; color: #fff; margin-bottom: 20px; }
        .don-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
        @media(max-width:700px){ .don-form-grid { grid-template-columns: 1fr; } }
        .don-field label { display: block; font-size: 11px; font-weight: 600; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 8px; }
        .don-field select, .don-field input { width: 100%; padding: 12px 14px; border-radius: 12px; background: rgba(255,255,255,0.06); border: 1.5px solid rgba(255,255,255,0.1); color: #fff; font-size: 14px; font-family: 'DM Sans', sans-serif; outline: none; transition: all 0.2s; }
        .don-field select option { background: #1a0030; color: #fff; }
        .don-field select:focus, .don-field input:focus { border-color: #a855f7; background: rgba(168,85,247,0.1); }
        .don-field input::placeholder { color: rgba(255,255,255,0.2); }
        .camp-search-wrap { margin-bottom: 16px; position: relative; }
        .camp-search-label { display: block; font-size: 11px; font-weight: 600; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 8px; }
        .camp-search-input { width: 100%; padding: 12px 14px; border-radius: 12px; background: rgba(255,255,255,0.06); border: 1.5px solid rgba(255,255,255,0.1); color: #fff; font-size: 14px; font-family: 'DM Sans', sans-serif; outline: none; transition: all 0.2s; box-sizing: border-box; }
        .camp-search-input:focus { border-color: #a855f7; }
        .camp-search-input::placeholder { color: rgba(255,255,255,0.2); }
        .camp-suggestions { position: absolute; top: 100%; left: 0; right: 0; z-index: 50; background: #1a0030; border: 1px solid rgba(168,85,247,0.3); border-radius: 14px; margin-top: 4px; box-shadow: 0 8px 32px rgba(0,0,0,0.5); max-height: 280px; overflow-y: auto; }
        .camp-suggestion-item { padding: 14px 16px; cursor: pointer; border-bottom: 1px solid rgba(255,255,255,0.05); transition: background 0.15s; }
        .camp-suggestion-item:hover { background: rgba(168,85,247,0.15); }
        .camp-suggestion-item:last-child { border-bottom: none; }
        .sug-name { font-size: 14px; font-weight: 600; color: #fff; margin-bottom: 3px; }
        .sug-addr { font-size: 12px; color: rgba(255,255,255,0.6); margin-bottom: 2px; }
        .sug-org { font-size: 11px; color: #a855f7; font-weight: 500; }
        .sug-date { font-size: 11px; color: rgba(255,255,255,0.4); }
        .sug-no-results { padding: 18px 16px; font-size: 13px; color: rgba(255,255,255,0.3); text-align: center; }
        .don-camp-preview { padding: 14px 16px; border-radius: 12px; margin-bottom: 18px; background: rgba(34,197,94,0.07); border: 1px solid rgba(34,197,94,0.2); font-size: 13px; color: rgba(255,255,255,0.7); line-height: 1.7; }
        .don-camp-preview strong { color: #4ade80; }
        .don-form-actions { display: flex; gap: 12px; }
        .don-submit-btn { padding: 12px 28px; border-radius: 12px; border: none; cursor: pointer; background: linear-gradient(135deg, #9333ea, #ec4899); color: white; font-size: 14px; font-weight: 600; font-family: 'DM Sans', sans-serif; transition: all 0.2s; }
        .don-submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .don-cancel-btn { padding: 12px 22px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); background: transparent; color: rgba(255,255,255,0.5); font-size: 14px; cursor: pointer; font-family: 'DM Sans', sans-serif; }
        .don-info { padding: 16px 20px; border-radius: 14px; margin-bottom: 24px; background: rgba(99,102,241,0.08); border: 1px solid rgba(99,102,241,0.2); font-size: 13px; color: rgba(255,255,255,0.6); line-height: 1.6; }
        .don-info strong { color: rgba(255,255,255,0.9); }
        .don-stats { display: flex; gap: 14px; margin-bottom: 28px; flex-wrap: wrap; }
        .don-stat { flex: 1; min-width: 130px; padding: 18px 20px; border-radius: 16px; text-align: center; }
        .don-stat-num { font-family: 'Syne', sans-serif; font-size: 28px; font-weight: 800; color: #fff; }
        .don-stat-label { font-size: 12px; color: rgba(255,255,255,0.5); margin-top: 4px; }
        .don-stat.purple { border: 1px solid rgba(168,85,247,0.25); background: rgba(168,85,247,0.07); }
        .don-stat.pink { border: 1px solid rgba(236,72,153,0.25); background: rgba(236,72,153,0.07); }
        .don-stat.green { border: 1px solid rgba(34,197,94,0.25); background: rgba(34,197,94,0.07); }
        .don-table-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 18px; padding: 22px; margin-bottom: 24px; }
        .don-table-title { font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 700; color: #fff; margin-bottom: 18px; }
        .don-table { width: 100%; border-collapse: collapse; font-size: 13px; }
        .don-table th { text-align: left; padding: 10px 14px; font-size: 11px; font-weight: 600; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 0.8px; border-bottom: 1px solid rgba(255,255,255,0.06); }
        .don-table td { padding: 14px; color: rgba(255,255,255,0.85); border-bottom: 1px solid rgba(255,255,255,0.05); vertical-align: middle; }
        .don-table tr:last-child td { border-bottom: none; }
        .don-table tr:hover td { background: rgba(168,85,247,0.05); }
        .don-badge { display: inline-block; padding: 4px 12px; border-radius: 8px; font-size: 11px; font-weight: 600; }
        .don-badge-blood { background: rgba(168,85,247,0.15); color: #c084fc; }
        .don-badge-used { background: rgba(239,68,68,0.12); color: #f87171; }
        .don-badge-stored { background: rgba(99,102,241,0.12); color: #818cf8; }
        .don-empty { text-align: center; padding: 60px 20px; }
        .don-empty-icon { font-size: 48px; margin-bottom: 12px; }
        .don-empty-text { font-size: 15px; color: rgba(255,255,255,0.4); margin-bottom: 6px; }
        .don-empty-sub { font-size: 13px; color: rgba(255,255,255,0.2); }
        .don-impact-card { background: linear-gradient(135deg, rgba(168,85,247,0.1), rgba(236,72,153,0.07)); border: 1px solid rgba(168,85,247,0.2); border-radius: 18px; padding: 22px; margin-bottom: 24px; }
        .don-impact-title { font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 700; color: #fff; margin-bottom: 16px; }
        .don-impact-item { display: flex; align-items: center; gap: 14px; padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .don-impact-item:last-child { border-bottom: none; }
        .don-impact-icon { font-size: 22px; flex-shrink: 0; }
        .don-impact-text { font-size: 13px; color: rgba(255,255,255,0.75); line-height: 1.5; }
        .don-impact-text strong { color: #fff; }
        .don-used-badge { display: inline-block; padding: 3px 10px; border-radius: 6px; font-size: 11px; font-weight: 600; background: rgba(239,68,68,0.12); color: #f87171; margin-left: 8px; }
        .don-stored-badge { display: inline-block; padding: 3px 10px; border-radius: 6px; font-size: 11px; font-weight: 600; background: rgba(99,102,241,0.12); color: #818cf8; margin-left: 8px; }
        .don-no-camps-warn { padding: 12px 16px; border-radius: 10px; margin-bottom: 16px; background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2); font-size: 13px; color: #f87171; }
      `}</style>

      <div className="don-page">
        <div className="don-top">
          <div>
            <div className="don-title">
              My <span>Donations</span> 🩸
            </div>
            <div className="don-subtitle">
              Track every donation and see how your blood is being used
            </div>
          </div>
          <div className="don-btn-row">
            <button
              className="don-map-btn"
              onClick={() => setShowMap(!showMap)}
            >
              {showMap ? "✕ Hide Map" : "🗺️ Camp Map"}
            </button>
            <button
              className="don-add-btn"
              onClick={() => setShowForm(!showForm)}
              disabled={!canDonate}
            >
              {showForm
                ? "✕ Cancel"
                : canDonate
                  ? "+ Record Donation"
                  : `⏳ ${daysRemaining} days left`}
            </button>
          </div>
        </div>

        {/* ELIGIBILITY */}
        <div className={`don-eligibility ${canDonate ? "ok" : "wait"}`}>
          <div className="don-elig-icon">{canDonate ? "✅" : "⏳"}</div>
          <div style={{ flex: 1 }}>
            <div className={`don-elig-title ${canDonate ? "ok" : "wait"}`}>
              {canDonate
                ? daysSinceLast === null
                  ? "You're eligible to donate!"
                  : "Eligible to donate again ✅"
                : `Please wait ${daysRemaining} more days`}
            </div>
            <div className="don-elig-sub">
              {canDonate
                ? daysSinceLast === null
                  ? "You haven't donated before — go ahead!"
                  : `Last donation was ${daysSinceLast} days ago. You can donate again.`
                : `Last donation was ${daysSinceLast} days ago. Minimum gap is 90 days for safety.`}
            </div>
            {daysSinceLast !== null && (
              <div className="don-elig-bar">
                <div
                  className="don-elig-bar-fill"
                  style={{
                    width: `${Math.min(100, (daysSinceLast / 90) * 100)}%`,
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* MAP */}
        {showMap && (
          <div className="don-map-section">
            <div className="don-map-header">
              <div className="don-map-title">
                🗺️ Blood Donation Camps Near You
              </div>
              <div className="don-camp-filter">
                <button
                  className={`don-camp-filter-btn ${!showAllCamps ? "active" : ""}`}
                  onClick={() => {
                    setShowAllCamps(false);
                    getCamps(false);
                  }}
                >
                  Upcoming
                </button>
                <button
                  className={`don-camp-filter-btn ${showAllCamps ? "active" : ""}`}
                  onClick={() => {
                    setShowAllCamps(true);
                    getCamps(true);
                  }}
                >
                  All
                </button>
              </div>
            </div>

            <DonorCampMap camps={camps} />

            <div className="don-map-pins">
              {camps.map((camp) => (
                <div className="don-map-pin" key={camp._id}>
                  <div className="don-map-pin-name">🏕️ {camp.campName}</div>
                  <div className="don-map-pin-detail">📍 {camp.address}</div>
                  <div className="don-map-pin-detail">
                    📅 {moment(camp.date).format("DD MMM YYYY")} at {camp.time}
                  </div>
                  <div className="don-map-pin-org">
                    🏥 {camp.organisation?.organisationName}
                  </div>
                </div>
              ))}
              {camps.length === 0 && (
                <div
                  style={{
                    fontSize: 13,
                    color: "rgba(255,255,255,0.25)",
                    padding: "20px 0",
                  }}
                >
                  No camps found
                </div>
              )}
            </div>
          </div>
        )}

        {/* FORM */}
        {showForm && canDonate && (
          <div className="don-form-card">
            <div className="don-form-title">📋 Log Your Blood Donation</div>
            {camps.length === 0 && (
              <div className="don-no-camps-warn">
                ⚠️ No active camps right now. Ask your blood bank to create one.
              </div>
            )}
            <div className="don-form-grid">
              <div className="don-field">
                <label>Blood Group</label>
                <select
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value)}
                >
                  <option value="">Select blood group</option>
                  {bloodGroups.map((bg) => (
                    <option key={bg} value={bg}>
                      {bg}
                    </option>
                  ))}
                </select>
              </div>
              <div className="don-field">
                <label>Quantity (ML)</label>
                <input
                  type="number"
                  placeholder="e.g. 450"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </div>
            </div>

            <div className="camp-search-wrap">
              <label className="camp-search-label">
                Search Camp / Location
              </label>
              <input
                className="camp-search-input"
                type="text"
                placeholder="Type camp name or location..."
                value={campSearch}
                onChange={(e) => {
                  setCampSearch(e.target.value);
                  setSelectedCamp(null);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              />
              {showSuggestions && (
                <div className="camp-suggestions">
                  {filteredCamps.length === 0 ? (
                    <div className="sug-no-results">
                      No camps found for "{campSearch}"
                    </div>
                  ) : (
                    filteredCamps.map((camp) => (
                      <div
                        className="camp-suggestion-item"
                        key={camp._id}
                        onMouseDown={() => handleSelectCamp(camp)}
                      >
                        <div className="sug-name">🏕️ {camp.campName}</div>
                        <div className="sug-addr">📍 {camp.address}</div>
                        <div className="sug-org">
                          🏥 {camp.organisation?.organisationName}
                        </div>
                        <div className="sug-date">
                          📅 {moment(camp.date).format("DD MMM YYYY")} at{" "}
                          {camp.time}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {selectedCamp && (
              <div className="don-camp-preview">
                ✅ Selected: <strong>{selectedCamp.campName}</strong>
                <br />
                📍 {selectedCamp.address}
                <br />
                📅 {moment(selectedCamp.date).format("DD MMM YYYY")} at{" "}
                {selectedCamp.time}
                <br />
                🏥 Donation goes to:{" "}
                <strong>{selectedCamp.organisation?.organisationName}</strong>
              </div>
            )}

            <div className="don-form-actions">
              <button
                className="don-submit-btn"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? "Saving..." : "Submit Donation →"}
              </button>
              <button
                className="don-cancel-btn"
                onClick={() => {
                  setShowForm(false);
                  setSelectedCamp(null);
                  setCampSearch("");
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="don-info">
          💡 <strong>How it works:</strong> After donating at a camp, record it
          here. Your blood goes to that organisation's inventory. Below you can
          see if your donated blood has been sent to a hospital!
        </div>

        <div className="don-stats">
          <div className="don-stat purple">
            <div className="don-stat-num">{data.length}</div>
            <div className="don-stat-label">Total Donations</div>
          </div>
          <div className="don-stat pink">
            <div className="don-stat-num">{data.length * 3}</div>
            <div className="don-stat-label">Lives Potentially Saved</div>
          </div>
          <div className="don-stat green">
            <div className="don-stat-num">{totalUsed}</div>
            <div className="don-stat-label">ML of Your Blood Used</div>
          </div>
        </div>

        {usageData.length > 0 && (
          <div className="don-impact-card">
            <div className="don-impact-title">💉 Your Blood's Impact</div>
            {usageData.map((u, i) => (
              <div className="don-impact-item" key={i}>
                <div className="don-impact-icon">
                  {u.usedQty > 0 ? "🏥" : "🏦"}
                </div>
                <div className="don-impact-text">
                  You donated{" "}
                  <strong>
                    {u.donatedQty}ml of {u.bloodGroup}
                  </strong>{" "}
                  to <strong>{u.organisation?.organisationName}</strong> on{" "}
                  {moment(u.createdAt).format("DD MMM YYYY")}.
                  {u.usedQty > 0 ? (
                    <>
                      <span className="don-used-badge">
                        🏥 Used by a hospital
                      </span>{" "}
                      — your blood helped save lives!
                    </>
                  ) : (
                    <>
                      <span className="don-stored-badge">🏦 Stored safely</span>{" "}
                      — ready when needed.
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="don-table-card">
          <div className="don-table-title">📅 Donation History</div>
          {data.length === 0 ? (
            <div className="don-empty">
              <div className="don-empty-icon">🩸</div>
              <div className="don-empty-text">No donations recorded yet</div>
              <div className="don-empty-sub">
                Click "Record Donation" after your first donation!
              </div>
            </div>
          ) : (
            <table className="don-table">
              <thead>
                <tr>
                  <th>Blood Group</th>
                  <th>Quantity</th>
                  <th>Organisation</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {data.map((record) => {
                  const usage = usageData.find(
                    (u) => u._id?.toString() === record._id?.toString(),
                  );
                  return (
                    <tr key={record._id}>
                      <td>
                        <span className="don-badge don-badge-blood">
                          {record.bloodGroup}
                        </span>
                      </td>
                      <td>{record.quantity} ML</td>
                      <td>{record.organisation?.organisationName || "—"}</td>
                      <td>
                        {usage?.usedQty > 0 ? (
                          <span className="don-badge don-badge-used">
                            🏥 Used
                          </span>
                        ) : (
                          <span className="don-badge don-badge-stored">
                            🏦 Stored
                          </span>
                        )}
                      </td>
                      <td>{moment(record.createdAt).format("DD MMM YYYY")}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Donation;
