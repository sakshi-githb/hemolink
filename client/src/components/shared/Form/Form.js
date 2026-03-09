import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { handleLogin, handleRegister } from "../../../services/authService";

const Form = ({ formType, submitBtn, formTitle }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("donar");
  const [name, setName] = useState("");
  const [organisationName, setOrganisationName] = useState("");
  const [hospitalName, setHospitalName] = useState("");
  const [website, setWebsite] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const cardRef = useRef(null);

  const roles = [
    { value: "donar", label: "Donor", icon: "🩸" },
    { value: "organisation", label: "Organisation", icon: "🏢" },
    { value: "hospital", label: "Hospital", icon: "🏥" },
    { value: "admin", label: "Admin", icon: "🛡️" },
  ];

  useEffect(() => {
    if (cardRef.current) {
      cardRef.current.style.opacity = "0";
      cardRef.current.style.transform = "translateY(40px)";
      setTimeout(() => {
        if (cardRef.current) {
          cardRef.current.style.transition =
            "opacity 0.7s cubic-bezier(.22,1,.36,1), transform 0.7s cubic-bezier(.22,1,.36,1)";
          cardRef.current.style.opacity = "1";
          cardRef.current.style.transform = "translateY(0)";
        }
      }, 80);
    }
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,400&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        .hemo-page {
          min-height: 100vh; width: 100%;
          display: flex; align-items: center; justify-content: center;
          background: #0d0015; position: relative; overflow: hidden;
          font-family: 'DM Sans', sans-serif; padding: 20px;
        }
        .hemo-blob {
          position: absolute; border-radius: 50%;
          filter: blur(90px); opacity: 0.3; pointer-events: none;
          animation: blobPulse 8s ease-in-out infinite alternate;
        }
        .hemo-blob-1 { width: 550px; height: 550px; background: radial-gradient(circle, #7c3aed, #4f0090); top: -150px; left: -150px; animation-delay: 0s; }
        .hemo-blob-2 { width: 450px; height: 450px; background: radial-gradient(circle, #ec4899, #9d174d); bottom: -100px; right: -100px; animation-delay: -4s; }
        .hemo-blob-3 { width: 300px; height: 300px; background: radial-gradient(circle, #a855f7, #db2777); top: 40%; left: 45%; animation-delay: -2s; }
        @keyframes blobPulse {
          0% { transform: scale(1) translate(0px, 0px); }
          100% { transform: scale(1.2) translate(25px, -25px); }
        }
        .hemo-grid {
          position: absolute; inset: 0; pointer-events: none;
          background-image: linear-gradient(rgba(139,92,246,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.06) 1px, transparent 1px);
          background-size: 44px 44px;
        }
        .hemo-card {
          position: relative; z-index: 10;
          width: 100%; max-width: 460px;
          background: rgba(255,255,255,0.04);
          backdrop-filter: blur(28px); -webkit-backdrop-filter: blur(28px);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 28px; padding: 44px 40px 36px;
          box-shadow: 0 8px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.12);
        }
        .hemo-brand { display: flex; align-items: center; gap: 10px; margin-bottom: 28px; }
        .hemo-brand-dot {
          width: 38px; height: 38px; border-radius: 11px;
          background: linear-gradient(135deg, #a855f7, #ec4899);
          display: flex; align-items: center; justify-content: center;
          font-size: 18px; box-shadow: 0 4px 16px rgba(168,85,247,0.5);
        }
        .hemo-brand-name {
          font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 800;
          background: linear-gradient(90deg, #c084fc, #f472b6);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text; letter-spacing: -0.5px;
        }
        .hemo-title { font-family: 'Syne', sans-serif; font-size: 26px; font-weight: 700; color: #fff; margin-bottom: 6px; letter-spacing: -0.4px; }
        .hemo-subtitle { font-size: 14px; color: rgba(255,255,255,0.4); margin-bottom: 26px; }
        .hemo-roles { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 22px; }
        .hemo-role-pill { flex: 1; min-width: 78px; cursor: pointer; }
        .hemo-role-pill input[type="radio"] { display: none; }
        .hemo-role-label {
          display: flex; flex-direction: column; align-items: center; gap: 4px;
          padding: 10px 6px; border-radius: 14px;
          border: 1.5px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.03);
          color: rgba(255,255,255,0.45); font-size: 11px; font-weight: 500;
          cursor: pointer; transition: all 0.2s ease; text-align: center; user-select: none;
        }
        .role-icon { font-size: 17px; }
        .hemo-role-pill input[type="radio"]:checked + .hemo-role-label {
          border-color: #a855f7; background: rgba(168,85,247,0.18);
          color: #e879f9; box-shadow: 0 0 18px rgba(168,85,247,0.25);
        }
        .hemo-role-label:hover { border-color: rgba(168,85,247,0.45); color: rgba(255,255,255,0.75); }
        .hemo-field { margin-bottom: 14px; }
        .hemo-field label { display: block; font-size: 11px; font-weight: 500; color: rgba(255,255,255,0.45); text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 7px; }
        .hemo-field input {
          width: 100%; padding: 13px 16px;
          background: rgba(255,255,255,0.06); border: 1.5px solid rgba(255,255,255,0.09);
          border-radius: 12px; color: #fff; font-size: 15px;
          font-family: 'DM Sans', sans-serif; outline: none; transition: all 0.2s ease;
        }
        .hemo-field input::placeholder { color: rgba(255,255,255,0.18); }
        .hemo-field input:focus { border-color: #a855f7; background: rgba(168,85,247,0.09); box-shadow: 0 0 0 3px rgba(168,85,247,0.14); }
        .hemo-btn {
          width: 100%; padding: 15px; margin-top: 10px;
          background: linear-gradient(135deg, #9333ea, #ec4899);
          border: none; border-radius: 14px; color: #fff;
          font-size: 15px; font-weight: 600; font-family: 'Syne', sans-serif;
          cursor: pointer; letter-spacing: 0.3px; transition: all 0.2s ease;
          box-shadow: 0 4px 20px rgba(147,51,234,0.4);
        }
        .hemo-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(147,51,234,0.55); filter: brightness(1.08); }
        .hemo-btn:active { transform: translateY(0); }
        .hemo-divider { height: 1px; background: rgba(255,255,255,0.07); margin: 22px 0 18px; }
        .hemo-footer { text-align: center; font-size: 13px; color: rgba(255,255,255,0.35); }
        .hemo-footer a { color: #c084fc; text-decoration: none; font-weight: 500; transition: color 0.2s; }
        .hemo-footer a:hover { color: #f0abfc; }
        .hemo-login-roles { margin-top: 16px; margin-bottom: 0; }
        .hemo-login-label { font-size: 11px; font-weight: 500; color: rgba(255,255,255,0.35); text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 10px; }
      `}</style>

      <div className="hemo-page">
        <div className="hemo-blob hemo-blob-1" />
        <div className="hemo-blob hemo-blob-2" />
        <div className="hemo-blob hemo-blob-3" />
        <div className="hemo-grid" />

        <div className="hemo-card" ref={cardRef}>
          <div className="hemo-brand">
            <div className="hemo-brand-dot">🩸</div>
            <span className="hemo-brand-name">HemoLink</span>
          </div>

          <h1 className="hemo-title">
            {formType === "login" ? "Welcome back 👋" : "Create account ✨"}
          </h1>
          <p className="hemo-subtitle">
            {formType === "login"
              ? "Sign in to your HemoLink account"
              : "Join HemoLink and save lives today"}
          </p>

          <form
            onSubmit={(e) => {
              if (formType === "login")
                return handleLogin(e, email, password, role);
              else if (formType === "register")
                return handleRegister(
                  e,
                  name,
                  role,
                  email,
                  password,
                  phone,
                  organisationName,
                  address,
                  hospitalName,
                  website,
                );
            }}
          >
            {/* Role pills — register shows at top, login shows at bottom */}
            {formType === "register" && (
              <div className="hemo-roles">
                {roles.map((r) => (
                  <label key={r.value} className="hemo-role-pill">
                    <input
                      type="radio"
                      name="role"
                      value={r.value}
                      checked={role === r.value}
                      onChange={(e) => setRole(e.target.value)}
                    />
                    <span className="hemo-role-label">
                      <span className="role-icon">{r.icon}</span>
                      {r.label}
                    </span>
                  </label>
                ))}
              </div>
            )}

            {/* LOGIN FIELDS */}
            {formType === "login" && (
              <>
                <div className="hemo-field">
                  <label>Email</label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="hemo-field">
                  <label>Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <div className="hemo-login-label">Login as</div>
                <div className="hemo-roles hemo-login-roles">
                  {roles.map((r) => (
                    <label key={r.value} className="hemo-role-pill">
                      <input
                        type="radio"
                        name="role"
                        value={r.value}
                        checked={role === r.value}
                        onChange={(e) => setRole(e.target.value)}
                      />
                      <span className="hemo-role-label">
                        <span className="role-icon">{r.icon}</span>
                        {r.label}
                      </span>
                    </label>
                  ))}
                </div>
              </>
            )}

            {/* REGISTER FIELDS */}
            {formType === "register" && (
              <>
                {(role === "donar" || role === "admin") && (
                  <div className="hemo-field">
                    <label>Full Name</label>
                    <input
                      type="text"
                      placeholder="Your full name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                )}
                {role === "organisation" && (
                  <div className="hemo-field">
                    <label>Organisation Name</label>
                    <input
                      type="text"
                      placeholder="Organisation name"
                      value={organisationName}
                      onChange={(e) => setOrganisationName(e.target.value)}
                    />
                  </div>
                )}
                {role === "hospital" && (
                  <div className="hemo-field">
                    <label>Hospital Name</label>
                    <input
                      type="text"
                      placeholder="Hospital name"
                      value={hospitalName}
                      onChange={(e) => setHospitalName(e.target.value)}
                    />
                  </div>
                )}
                <div className="hemo-field">
                  <label>Email</label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="hemo-field">
                  <label>Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                {(role === "organisation" || role === "hospital") && (
                  <div className="hemo-field">
                    <label>Website</label>
                    <input
                      type="text"
                      placeholder="https://yourwebsite.com"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                    />
                  </div>
                )}
                {role !== "admin" && (
                  <>
                    <div className="hemo-field">
                      <label>Address</label>
                      <input
                        type="text"
                        placeholder="Your address"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                      />
                    </div>
                    <div className="hemo-field">
                      <label>Phone</label>
                      <input
                        type="text"
                        placeholder="+91 00000 00000"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </div>
                  </>
                )}
              </>
            )}

            <button className="hemo-btn" type="submit">
              {submitBtn} →
            </button>
          </form>

          <div className="hemo-divider" />
          <div className="hemo-footer">
            {formType === "login" ? (
              <p>
                Don't have an account? <Link to="/register">Sign up free</Link>
              </p>
            ) : (
              <p>
                Already have an account? <Link to="/login">Sign in</Link>
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Form;
