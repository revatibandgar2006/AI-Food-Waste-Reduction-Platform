import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import "../App.css";

function DeliveryStatus() {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [otpInputs, setOtpInputs] = useState({});
  const [statusMsg, setStatusMsg] = useState("");
  const [error, setError] = useState("");
  const [verifyingId, setVerifyingId] = useState(null);

  const fetchDeliveries = async () => {
    try {
      const res = await api.getMyDeliveries();
      setDeliveries(res.deliveries || []);
      setError("");
    } catch (err) {
      setDeliveries([]);
      setError(err.message || "Could not load delivery tasks.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveries();
  }, []);

  const handleOtpChange = (deliveryId, val) => {
    setOtpInputs((prev) => ({ ...prev, [deliveryId]: val.replace(/\D/g, "").slice(0, 6) }));
  };

  const handleVerifyOtp = async (deliveryId) => {
    const code = otpInputs[deliveryId];
    if (!code || code.length < 6) {
      setStatusMsg("⚠️ Please enter a valid 6-digit receiver handoff OTP.");
      return;
    }

    try {
      setVerifyingId(deliveryId);
      setStatusMsg("Verifying OTP with chain-of-custody engine...");
      const res = await api.verifyDeliveryOtp(deliveryId, code);
      setStatusMsg(`✅ Verified! Delivery #${deliveryId} completed. Rescued ${res.data?.impact?.foodSavedKg} kg (${res.data?.impact?.mealsServed} meals, offset ${res.data?.impact?.co2OffsetKg} kg CO₂)!`);
      fetchDeliveries();
    } catch (err) {
      setStatusMsg(`❌ Verification failed: ${err.message}`);
    } finally {
      setVerifyingId(null);
    }
  };

  return (
    <div className="app">
      {/* ================= HEADER ================= */}
      <header className="header">
        <div className="brand">
          <div className="brand-icon">🍴</div>
          <div>
            <h1>Food Rescue</h1>
            <p>Share food. Reduce waste.</p>
          </div>
        </div>

        <div className="user-area">
          <div className="avatar">V</div>
          <div className="user-info">
            <strong>Volunteer</strong>
            <span>Food Volunteer</span>
          </div>
          <Link to="/login">
            <button className="logout-btn">Logout</button>
          </Link>
        </div>
      </header>

      {/* ================= NAVIGATION ================= */}
      <nav className="navbar">
        <Link to="/volunteer/dashboard">
          <button>Dashboard</button>
        </Link>
        <Link to="/volunteer/pickup">
          <button>Pickup Schedule</button>
        </Link>
        <Link to="/volunteer/delivery">
          <button className="active">Delivery Status</button>
        </Link>
        <Link to="/volunteer/notifications">
          <button>Notifications</button>
        </Link>
        <Link to="/volunteer/profile">
          <button>Profile</button>
        </Link>
        <Link to="/volunteer/settings">
          <button>Settings</button>
        </Link>
      </nav>

      {/* ================= MAIN CONTENT ================= */}
      <main className="container">
        <div className="page-heading">
          <h2>Delivery Status & Receiver Handoff</h2>
          <p>Track food rescue transit and verify receiver 6-digit handoff OTPs.</p>
        </div>

        {error && <div role="alert" className="delivery-error">{error} <button className="outline-btn" onClick={fetchDeliveries}>Try again</button></div>}
        {loading && <p>Loading assigned deliveries…</p>}

        {statusMsg && (
          <div
            style={{
              padding: "12px 18px",
              marginBottom: "18px",
              borderRadius: "8px",
              background: statusMsg.includes("✅") ? "#ecfdf5" : "#fffbeb",
              color: statusMsg.includes("✅") ? "#065f46" : "#92400e",
              border: "1px solid currentColor",
              fontWeight: "600",
            }}
          >
            {statusMsg}
          </div>
        )}

        {/* ================= DELIVERY LIST ================= */}
        <section>
          {!loading && deliveries.length === 0 ? (
            <div className="empty-food">
              <div className="empty-icon">🚚</div>
              <h2>No active deliveries</h2>
              <p>Check the Pickup Schedule to claim pending food rescue donations.</p>
            </div>
          ) : !loading ? (
            deliveries.map((delivery) => (
              <div
                className="food-list-card"
                key={delivery.id}
                style={{ flexDirection: "column", alignItems: "flex-start", gap: "10px" }}
              >
                <div style={{ display: "flex", width: "100%", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                    <div className="food-icon">🚚</div>
                    <div className="food-details">
                      <h3>{delivery.food_name || delivery.food}</h3>
                      <p>
                        📍 Destination: <strong>{delivery.receiver_org || delivery.receiver_name || delivery.destination || delivery.delivery_address}</strong>
                      </p>
                      <p>
                        ⚖️ Quantity: <strong>{delivery.quantity_display || delivery.quantity}</strong>
                      </p>
                    </div>
                  </div>

                  <span
                    className={`status ${
                      delivery.status === "DELIVERED" || delivery.status === "Delivered"
                        ? "completed"
                        : "requested"
                    }`}
                  >
                    {delivery.status}
                  </span>
                </div>

                {/* OTP Handoff Verification Panel for active transit */}
                {delivery.status !== "DELIVERED" && delivery.status !== "Delivered" && (
                  <div
                    style={{
                      width: "100%",
                      marginTop: "8px",
                      padding: "12px",
                      background: "#f8fafc",
                      borderRadius: "6px",
                      border: "1px dashed #cbd5e1",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      flexWrap: "wrap",
                      gap: "10px",
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: "14px", color: "#1e293b" }}>🔐 Receiver Handoff Verification</strong>
                      <p style={{ margin: "2px 0 0", fontSize: "13px", color: "#64748b" }}>
                        Ask receiver for their 6-digit OTP to complete chain-of-custody transfer.
                      </p>
                    </div>

                    <div style={{ display: "flex", gap: "8px" }}>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength="6"
                        placeholder="e.g. 749102"
                        value={otpInputs[delivery.id] || ""}
                        onChange={(e) => handleOtpChange(delivery.id, e.target.value)}
                        style={{
                          width: "110px",
                          padding: "6px 10px",
                          border: "1px solid #cbd5e1",
                          borderRadius: "4px",
                          letterSpacing: "2px",
                          fontWeight: "bold",
                          textAlign: "center",
                        }}
                      />
                      <button
                        type="button"
                        className="primary-btn small"
                        onClick={() => handleVerifyOtp(delivery.id)}
                        disabled={verifyingId === delivery.id}
                      >
                        {verifyingId === delivery.id ? "Verifying…" : "Verify & Complete"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : null}
        </section>
      </main>
    </div>
  );
}

export default DeliveryStatus;