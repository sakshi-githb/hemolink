import React, { useEffect, useState } from "react";
import Layout from "./../../components/shared/Layout/Layout";
import { useSelector } from "react-redux";
import API from "../../services/API";
import moment from "moment";

const bloodGroups = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"];

const OrganisationPage = () => {
  const { user } = useSelector((state) => state.auth);
  const [orgs, setOrgs] = useState([]);
  const [camps, setCamps] = useState([]);
  const [availability, setAvailability] = useState([]);
  const [search, setSearch] = useState("");
  const [requestForm, setRequestForm] = useState(null); // { orgId, orgName, bloodGroup }
  const [quantity, setQuantity] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const isHospital = user?.role === "hospital";
  const isDonor = user?.role === "donar";

  const fetchAll = async () => {
    try {
      const { data: orgData } = await API.get(
        "/inventory/get-all-organisations",
      );
      if (orgData?.success) setOrgs(orgData.organisations);

      const { data: campData } = await API.get("/camp/get-all-camps");
      if (campData?.success) setCamps(campData.camps);

      if (isHospital) {
        const { data: avData } = await API.get(
          "/inventory/get-blood-availability",
        );
        if (avData?.success) setAvailability(avData.availability);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 10000);
    return () => clearInterval(interval);
  }, [user]);

  const handleRequestBlood = async () => {
    try {
      if (!quantity || !requestForm) return alert("Please enter quantity");
      if (Number(quantity) <= 0)
        return alert("Quantity must be greater than 0");
      setSubmitting(true);
      const { data } = await API.post("/request/create-request", {
        bloodGroup: requestForm.bloodGroup,
        quantity: Number(quantity),
        organisation: requestForm.orgId,
      });
      if (data?.success) {
        setSuccessMsg(
          `✅ Request for ${quantity}ml of ${requestForm.bloodGroup} sent to ${requestForm.orgName}! Check My Requests for status.`,
        );
        setRequestForm(null);
        setQuantity("");
        setTimeout(() => setSuccessMsg(""), 6000);
      } else {
        alert(data?.message || "Error sending request");
      }
    } catch (error) {
      alert(error?.response?.data?.message || "Error sending request");
    } finally {
      setSubmitting(false);
    }
  };

  const getAvailabilityForOrg = (orgId) =>
    availability.find(
      (a) => a.organisation?._id?.toString() === orgId?.toString(),
    );

  const getCampsForOrg = (orgId) =>
    camps.filter(
      (c) =>
        (c.organisation?._id || c.organisation)?.toString() ===
        orgId?.toString(),
    );

  const filteredOrgs = orgs.filter(
    (org) =>
      org.organisationName?.toLowerCase().includes(search.toLowerCase()) ||
      org.address?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <Layout>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
        .org-page { font-family: 'DM Sans', sans-serif; }
        .org-title { font-family: 'Syne', sans-serif; font-size: 26px; font-weight: 700; color: #fff; margin-bottom: 4px; }
        .org-title span { background: linear-gradient(90deg, #c084fc, #f472b6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .org-subtitle { font-size: 14px; color: rgba(255,255,255,0.4); margin-bottom: 28px; }
        .org-live { display: inline-flex; align-items: center; gap: 6px; padding: 5px 12px; border-radius: 20px; background: rgba(34,197,94,0.1); border: 1px solid rgba(34,197,94,0.2); font-size: 11px; color: #4ade80; font-weight: 600; margin-bottom: 24px; }
        .org-live-dot { width: 6px; height: 6px; border-radius: 50%; background: #4ade80; animation: pulse 1.5s infinite; }
        @keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:0.3;} }
        .org-search { width: 100%; max-width: 380px; padding: 12px 16px; background: rgba(255,255,255,0.05); border: 1.5px solid rgba(255,255,255,0.1); border-radius: 12px; color: #fff; font-size: 14px; font-family: 'DM Sans', sans-serif; outline: none; transition: all 0.2s; margin-bottom: 24px; display: block; }
        .org-search:focus { border-color: #a855f7; }
        .org-search::placeholder { color: rgba(255,255,255,0.2); }
        .section-heading { font-family: 'Syne', sans-serif; font-size: 17px; font-weight: 700; color: #fff; margin-bottom: 16px; }
        .section-heading span { background: linear-gradient(90deg, #c084fc, #f472b6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }

        /* SUCCESS MSG */
        .org-success { padding: 14px 18px; border-radius: 12px; margin-bottom: 20px; background: rgba(34,197,94,0.1); border: 1px solid rgba(34,197,94,0.3); font-size: 13px; color: #4ade80; line-height: 1.5; }

        /* CAMPS TOP */
        .camps-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 12px; margin-bottom: 36px; }
        .top-camp-card { background: rgba(168,85,247,0.07); border: 1px solid rgba(168,85,247,0.2); border-radius: 16px; padding: 18px; position: relative; overflow: hidden; transition: all 0.2s; }
        .top-camp-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, #9333ea, #ec4899); }
        .top-camp-card:hover { border-color: rgba(168,85,247,0.4); transform: translateY(-2px); }
        .top-camp-name { font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700; color: #fff; margin-bottom: 8px; }
        .top-camp-detail { font-size: 12px; color: rgba(255,255,255,0.45); margin-bottom: 4px; }
        .top-camp-org { margin-top: 10px; padding: 7px 12px; border-radius: 8px; background: rgba(34,197,94,0.08); border: 1px solid rgba(34,197,94,0.2); font-size: 12px; color: #4ade80; }
        .no-camps-msg { text-align: center; padding: 28px; color: rgba(255,255,255,0.2); font-size: 14px; background: rgba(255,255,255,0.02); border-radius: 14px; border: 1px solid rgba(255,255,255,0.05); margin-bottom: 28px; }

        /* ORG CARDS */
        .org-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; }
        .org-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 18px; padding: 22px; transition: all 0.2s; }
        .org-card:hover { border-color: rgba(168,85,247,0.25); }
        .org-card-top { display: flex; align-items: center; gap: 14px; margin-bottom: 16px; }
        .org-avatar { width: 44px; height: 44px; border-radius: 12px; flex-shrink: 0; background: linear-gradient(135deg, #9333ea, #ec4899); display: flex; align-items: center; justify-content: center; font-size: 20px; }
        .org-name { font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 700; color: #fff; margin-bottom: 3px; }
        .org-badge { display: inline-block; padding: 2px 8px; border-radius: 6px; font-size: 10px; font-weight: 600; background: rgba(34,197,94,0.12); color: #4ade80; }
        .org-divider { height: 1px; background: rgba(255,255,255,0.06); margin: 12px 0; }
        .org-detail { display: flex; align-items: flex-start; gap: 8px; margin-bottom: 8px; font-size: 13px; color: rgba(255,255,255,0.45); }
        .org-detail a { color: #c084fc; text-decoration: none; }

        /* BLOOD AVAILABILITY */
        .blood-avail-section { margin-top: 14px; }
        .blood-avail-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: rgba(255,255,255,0.3); margin-bottom: 10px; }
        .blood-pills { display: flex; flex-wrap: wrap; gap: 7px; margin-bottom: 12px; }
        .blood-pill { padding: 6px 12px; border-radius: 9px; font-size: 12px; font-weight: 700; cursor: pointer; transition: all 0.2s; font-family: 'Syne', sans-serif; border: 1.5px solid transparent; }
        .blood-pill.available { background: rgba(168,85,247,0.15); border-color: rgba(168,85,247,0.3); color: #c084fc; }
        .blood-pill.available:hover { background: rgba(168,85,247,0.3); transform: translateY(-1px); box-shadow: 0 4px 12px rgba(168,85,247,0.3); }
        .blood-pill.empty { background: rgba(255,255,255,0.03); border-color: rgba(255,255,255,0.06); color: rgba(255,255,255,0.2); cursor: not-allowed; }
        .blood-pill-ml { font-size: 10px; font-weight: 400; opacity: 0.7; }

        /* REQUEST FORM inline */
        .req-form { margin-top: 12px; padding: 14px; border-radius: 12px; background: rgba(168,85,247,0.08); border: 1px solid rgba(168,85,247,0.25); }
        .req-form-title { font-size: 13px; font-weight: 600; color: #e879f9; margin-bottom: 10px; }
        .req-form-row { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
        .req-form-input { flex: 1; min-width: 100px; padding: 10px 14px; background: rgba(255,255,255,0.06); border: 1.5px solid rgba(255,255,255,0.1); border-radius: 10px; color: #fff; font-size: 14px; font-family: 'DM Sans', sans-serif; outline: none; }
        .req-form-input:focus { border-color: #a855f7; }
        .req-form-input::placeholder { color: rgba(255,255,255,0.2); }
        .req-submit-btn { padding: 10px 20px; border-radius: 10px; border: none; cursor: pointer; background: linear-gradient(135deg, #9333ea, #ec4899); color: white; font-size: 13px; font-weight: 600; font-family: 'DM Sans', sans-serif; transition: all 0.2s; white-space: nowrap; }
        .req-submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .req-cancel-btn { padding: 10px 16px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.1); background: transparent; color: rgba(255,255,255,0.4); font-size: 13px; cursor: pointer; font-family: 'DM Sans', sans-serif; }

        /* Org camps */
        .org-camps-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: rgba(255,255,255,0.3); margin-bottom: 8px; }
        .org-camp-pill { padding: 8px 12px; border-radius: 10px; background: rgba(168,85,247,0.06); border: 1px solid rgba(168,85,247,0.15); margin-bottom: 8px; }
        .org-camp-pill-name { font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.75); margin-bottom: 3px; }
        .org-camp-pill-detail { font-size: 11px; color: rgba(255,255,255,0.3); }
        .no-camps-pill { font-size: 12px; color: rgba(255,255,255,0.2); }

        .org-empty { text-align: center; padding: 80px 20px; }
        .org-empty-icon { font-size: 48px; margin-bottom: 12px; }
        .org-empty-text { font-size: 15px; color: rgba(255,255,255,0.3); }
      `}</style>

      <div className="org-page">
        <div className="org-title">
          {isHospital ? (
            <>
              Blood <span>Availability</span> 🩸
            </>
          ) : (
            <>
              Blood Banks & <span>Organisations</span> 🏢
            </>
          )}
        </div>
        <div className="org-subtitle">
          {isHospital
            ? "Click any purple blood group pill to request blood from that organisation"
            : "Find a verified blood bank near you — see their active camps"}
        </div>

        <div className="org-live">
          <div className="org-live-dot" /> Updates every 10 seconds
        </div>

        {successMsg && <div className="org-success">{successMsg}</div>}

        {/* HOSPITAL INFO BOX */}
        {isHospital && (
          <div
            style={{
              padding: "14px 18px",
              borderRadius: 12,
              marginBottom: 24,
              background: "rgba(99,102,241,0.08)",
              border: "1px solid rgba(99,102,241,0.2)",
              fontSize: 13,
              color: "rgba(255,255,255,0.5)",
              lineHeight: 1.6,
            }}
          >
            💡{" "}
            <strong style={{ color: "rgba(255,255,255,0.8)" }}>
              How to request blood:
            </strong>{" "}
            Find an organisation below → click a{" "}
            <span style={{ color: "#c084fc", fontWeight: 600 }}>
              purple blood group pill
            </span>{" "}
            → enter quantity → submit. Your request will appear as 🟡 Pending in{" "}
            <a href="/consumer" style={{ color: "#c084fc" }}>
              My Requests
            </a>{" "}
            until the organisation approves it.
          </div>
        )}

        {/* ACTIVE CAMPS */}
        <div className="section-heading">
          🏕️ <span>Active Camps</span>
        </div>
        {camps.length === 0 ? (
          <div className="no-camps-msg">No active camps at the moment</div>
        ) : (
          <div className="camps-grid">
            {camps.map((camp) => (
              <div className="top-camp-card" key={camp._id}>
                <div className="top-camp-name">{camp.campName}</div>
                <div className="top-camp-detail">📍 {camp.address}</div>
                <div className="top-camp-detail">
                  📅 {moment(camp.date).format("DD MMM YYYY")} &nbsp;🕐{" "}
                  {camp.time}
                </div>
                <div className="top-camp-org">
                  ✅ By:{" "}
                  <strong>{camp.organisation?.organisationName || "—"}</strong>
                </div>
              </div>
            ))}
          </div>
        )}

        <input
          className="org-search"
          type="text"
          placeholder="🔍 Search organisation name or address..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="section-heading">
          🏥 All <span>Organisations</span>
        </div>

        {filteredOrgs.length === 0 ? (
          <div className="org-empty">
            <div className="org-empty-icon">🏢</div>
            <div className="org-empty-text">
              {orgs.length === 0
                ? "No organisations registered yet"
                : "No results found"}
            </div>
          </div>
        ) : (
          <div className="org-grid">
            {filteredOrgs.map((org) => {
              const orgAvail = getAvailabilityForOrg(org._id);
              const orgCamps = getCampsForOrg(org._id);
              const isRequestOpen = requestForm?.orgId === org._id;

              return (
                <div className="org-card" key={org._id}>
                  <div className="org-card-top">
                    <div className="org-avatar">🏥</div>
                    <div>
                      <div className="org-name">{org.organisationName}</div>
                      <span className="org-badge">✅ Verified</span>
                    </div>
                  </div>

                  {org.email && (
                    <div className="org-detail">
                      ✉️ <a href={`mailto:${org.email}`}>{org.email}</a>
                    </div>
                  )}
                  {org.phone && (
                    <div className="org-detail">📞 {org.phone}</div>
                  )}
                  {org.address && (
                    <div className="org-detail">📍 {org.address}</div>
                  )}

                  {/* HOSPITAL: show blood availability pills */}
                  {isHospital && (
                    <>
                      <div className="org-divider" />
                      <div className="blood-avail-section">
                        <div className="blood-avail-title">
                          🩸 Blood Available — Click to Request
                        </div>
                        <div className="blood-pills">
                          {bloodGroups.map((bg) => {
                            const bgData = orgAvail?.bloodData?.find(
                              (b) => b.bloodGroup === bg,
                            );
                            const ml = bgData?.available || 0;
                            return (
                              <div
                                key={bg}
                                className={`blood-pill ${ml > 0 ? "available" : "empty"}`}
                                onClick={() => {
                                  if (ml <= 0) return;
                                  setRequestForm(
                                    isRequestOpen &&
                                      requestForm?.bloodGroup === bg
                                      ? null
                                      : {
                                          orgId: org._id,
                                          orgName: org.organisationName,
                                          bloodGroup: bg,
                                        },
                                  );
                                  setQuantity("");
                                }}
                                title={
                                  ml > 0
                                    ? `Click to request ${bg}`
                                    : "Not available"
                                }
                              >
                                {bg}{" "}
                                <span className="blood-pill-ml">
                                  {ml > 0 ? `${ml}ml` : "—"}
                                </span>
                              </div>
                            );
                          })}
                        </div>

                        {/* Inline request form */}
                        {isRequestOpen && requestForm && (
                          <div className="req-form">
                            <div className="req-form-title">
                              Requesting{" "}
                              <strong>{requestForm.bloodGroup}</strong> from{" "}
                              {requestForm.orgName}
                            </div>
                            <div className="req-form-row">
                              <input
                                className="req-form-input"
                                type="number"
                                placeholder="Quantity in ML (e.g. 450)"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                              />
                              <button
                                className="req-submit-btn"
                                onClick={handleRequestBlood}
                                disabled={submitting}
                              >
                                {submitting ? "Sending..." : "🩸 Send Request"}
                              </button>
                              <button
                                className="req-cancel-btn"
                                onClick={() => {
                                  setRequestForm(null);
                                  setQuantity("");
                                }}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {/* CAMPS inside org card */}
                  <div className="org-divider" />
                  <div className="org-camps-title">🏕️ Their Active Camps</div>
                  {orgCamps.length === 0 ? (
                    <div className="no-camps-pill">No active camps</div>
                  ) : (
                    orgCamps.map((camp) => (
                      <div className="org-camp-pill" key={camp._id}>
                        <div className="org-camp-pill-name">
                          {camp.campName}
                        </div>
                        <div className="org-camp-pill-detail">
                          📍 {camp.address} · 📅{" "}
                          {moment(camp.date).format("DD MMM")} at {camp.time}
                        </div>
                      </div>
                    ))
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

export default OrganisationPage;
