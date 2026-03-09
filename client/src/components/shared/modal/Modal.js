import React, { useState } from "react";
import { useSelector } from "react-redux";
import API from "../../../services/API";

const bloodGroups = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"];

const Modal = ({ onSuccess }) => {
  const [inventoryType, setInventoryType] = useState("in");
  const [bloodGroup, setBloodGroup] = useState("");
  const [quantity, setQuantity] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const { user } = useSelector((state) => state.auth);

  const handleSubmit = async () => {
    try {
      if (!bloodGroup || !quantity || !email) {
        return alert("Please fill all fields");
      }
      setLoading(true);
      const { data } = await API.post("/inventory/create-inventory", {
        email,
        organisation: user?._id,
        inventoryType,
        bloodGroup,
        quantity: Number(quantity),
      });
      if (data?.success) {
        alert("✅ Blood record added successfully!");
        // close modal without page reload
        const modalEl = document.getElementById("staticBackdrop");
        const modal = window.bootstrap?.Modal?.getInstance(modalEl);
        if (modal) modal.hide();
        // reset form
        setBloodGroup("");
        setQuantity("");
        setEmail("");
        setInventoryType("in");
        // tell parent to refresh data
        if (onSuccess) onSuccess();
      } else {
        alert(data?.message || "Something went wrong");
      }
    } catch (error) {
      alert(error?.response?.data?.message || "Error adding record");
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        .hemo-modal .modal-content {
          background: #1a0030;
          border: 1px solid rgba(168,85,247,0.3);
          border-radius: 20px;
          color: #fff;
        }
        .hemo-modal .modal-header {
          border-bottom: 1px solid rgba(255,255,255,0.08);
          padding: 20px 24px 16px;
        }
        .hemo-modal .modal-title {
          font-family: 'Syne', sans-serif;
          font-size: 18px; font-weight: 700; color: #fff;
        }
        .hemo-modal .btn-close { filter: invert(1); opacity: 0.5; }
        .hemo-modal .btn-close:hover { opacity: 1; }
        .hemo-modal .modal-body { padding: 20px 24px; }
        .hemo-modal .modal-footer { border-top: 1px solid rgba(255,255,255,0.08); padding: 16px 24px; }
        .hemo-modal-label { font-size: 11px; font-weight: 600; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 8px; display: block; }
        .hemo-modal-select, .hemo-modal-input {
          width: 100%; padding: 11px 14px;
          background: rgba(255,255,255,0.06);
          border: 1.5px solid rgba(255,255,255,0.1);
          border-radius: 12px; color: #fff;
          font-size: 14px; font-family: 'DM Sans', sans-serif;
          outline: none; transition: all 0.2s; margin-bottom: 16px;
        }
        .hemo-modal-select option { background: #1a0030; color: #fff; }
        .hemo-modal-select:focus, .hemo-modal-input:focus {
          border-color: #a855f7; background: rgba(168,85,247,0.1);
        }
        .hemo-modal-input::placeholder { color: rgba(255,255,255,0.2); }
        .hemo-modal-type { display: flex; gap: 12px; margin-bottom: 18px; }
        .hemo-modal-type-btn {
          flex: 1; padding: 10px; border-radius: 11px; cursor: pointer;
          border: 1.5px solid rgba(255,255,255,0.1);
          background: transparent; color: rgba(255,255,255,0.4);
          font-size: 13px; font-weight: 600; font-family: 'DM Sans', sans-serif;
          transition: all 0.2s; text-align: center;
        }
        .hemo-modal-type-btn.active-in {
          background: rgba(34,197,94,0.12); border-color: rgba(34,197,94,0.3); color: #4ade80;
        }
        .hemo-modal-type-btn.active-out {
          background: rgba(239,68,68,0.12); border-color: rgba(239,68,68,0.3); color: #f87171;
        }
        .hemo-modal-info { padding: 12px 14px; border-radius: 10px; background: rgba(99,102,241,0.08); border: 1px solid rgba(99,102,241,0.2); font-size: 12px; color: rgba(255,255,255,0.45); margin-bottom: 16px; line-height: 1.5; }
        .hemo-modal-submit {
          padding: 12px 28px; border-radius: 12px; border: none; cursor: pointer;
          background: linear-gradient(135deg, #9333ea, #ec4899);
          color: white; font-size: 14px; font-weight: 600;
          font-family: 'DM Sans', sans-serif; transition: all 0.2s;
        }
        .hemo-modal-submit:hover { transform: translateY(-1px); }
        .hemo-modal-submit:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
        .hemo-modal-cancel {
          padding: 12px 22px; border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.1); background: transparent;
          color: rgba(255,255,255,0.5); font-size: 14px; cursor: pointer;
          font-family: 'DM Sans', sans-serif; margin-right: 8px;
        }
      `}</style>

      <div
        className="modal fade hemo-modal"
        id="staticBackdrop"
        data-bs-backdrop="static"
        data-bs-keyboard="false"
        tabIndex={-1}
        aria-labelledby="staticBackdropLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="staticBackdropLabel">
                🩸 Add Blood Record
              </h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              />
            </div>
            <div className="modal-body">
              <div className="hemo-modal-info">
                <strong style={{ color: "rgba(255,255,255,0.7)" }}>
                  📥 IN
                </strong>{" "}
                = blood received from a donor &nbsp;|&nbsp;
                <strong style={{ color: "rgba(255,255,255,0.7)" }}>
                  📤 OUT
                </strong>{" "}
                = blood sent to a hospital
              </div>

              {/* IN / OUT toggle */}
              <label className="hemo-modal-label">Record Type</label>
              <div className="hemo-modal-type">
                <button
                  className={`hemo-modal-type-btn ${inventoryType === "in" ? "active-in" : ""}`}
                  onClick={() => setInventoryType("in")}
                >
                  📥 IN — Received from Donor
                </button>
                <button
                  className={`hemo-modal-type-btn ${inventoryType === "out" ? "active-out" : ""}`}
                  onClick={() => setInventoryType("out")}
                >
                  📤 OUT — Sent to Hospital
                </button>
              </div>

              {/* Blood Group */}
              <label className="hemo-modal-label">Blood Group</label>
              <select
                className="hemo-modal-select"
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
              >
                <option value="">Select blood group...</option>
                {bloodGroups.map((bg) => (
                  <option key={bg} value={bg}>
                    {bg}
                  </option>
                ))}
              </select>

              {/* Email */}
              <label className="hemo-modal-label">
                {inventoryType === "in" ? "Donor Email" : "Hospital Email"}
              </label>
              <input
                className="hemo-modal-input"
                type="email"
                placeholder={
                  inventoryType === "in"
                    ? "donor@email.com"
                    : "hospital@email.com"
                }
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              {/* Quantity */}
              <label className="hemo-modal-label">Quantity (ML)</label>
              <input
                className="hemo-modal-input"
                type="number"
                placeholder="e.g. 450"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                style={{ marginBottom: 0 }}
              />
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="hemo-modal-cancel"
                data-bs-dismiss="modal"
              >
                Cancel
              </button>
              <button
                type="button"
                className="hemo-modal-submit"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? "Saving..." : "Add Record →"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Modal;
