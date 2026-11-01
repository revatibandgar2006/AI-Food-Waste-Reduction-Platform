import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import "../App.css";

function PickupSchedule() {
  const [pickups, setPickups] = useState([]);
  const [myPickups, setMyPickups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState("");
  const [error, setError] = useState("");
  const [claimingId, setClaimingId] = useState(null);

  const loadData = async () => {
    try {
      const [availRes, myRes] = await Promise.allSettled([
        api.getAvailablePickups(),
        api.getMyPickups(),
      ]);

      if (availRes.status === "fulfilled" && availRes.value.pickups) {
        setPickups(availRes.value.pickups);
      }
      if (myRes.status === "fulfilled" && myRes.value.pickups) {
        setMyPickups(myRes.value.pickups);
      }
      const failures = [availRes, myRes].filter((result) => result.status === "rejected");
      setError(failures.map((result) => result.reason?.message || "Unable to load pickup data.").join(" "));
    } catch (loadError) {
      setError(loadError.message || "Unable to load pickup data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleClaim = async (donationId) => {
    setClaimingId(donationId);
    try {
      setActionMsg("Accepting pickup...");
      await api.claimPickup(donationId);
      setActionMsg("Pickup accepted. Your route and receiver handoff are now active.");
      await loadData();
    } catch (err) {
      setActionMsg(`⚠️ ${err.message}`);
    } finally {
      setClaimingId(null);
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
          <button className="active">Pickup Schedule</button>
        </Link>
        <Link to="/volunteer/delivery">
          <button>Delivery Status</button>
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
          <h2>Pickup Schedule & Real-Time Dispatch</h2>
          <p>Accept urgent surplus food pickups and manage your active rescue route.</p>
        </div>

        {error && <div role="alert" className="pickup-error">{error} <button className="outline-btn" onClick={loadData}>Try again</button></div>}
        {loading && <p>Finding open rescue routes…</p>}

        {actionMsg && (
          <div
            style={{
              padding: "12px 18px",
              marginBottom: "18px",
              borderRadius: "8px",
              background: actionMsg.includes("✅") ? "#ecfdf5" : "#fffbeb",
              color: actionMsg.includes("✅") ? "#065f46" : "#92400e",
              border: "1px solid currentColor",
              fontWeight: "600",
            }}
          >
            {actionMsg}
          </div>
        )}

        {/* Section 1: Available Pickups dispatched by donors */}
        <h2 className="section-title">🚨 Open Rescue Dispatches</h2>
        <section style={{ marginBottom: "30px" }}>
          {!loading && pickups.length === 0 ? (
            <p style={{ color: "#64748b" }}>No unassigned food donations available right now. Great job!</p>
          ) : !loading ? (
            pickups.map((item) => (
              <div className="food-list-card" key={item.id} style={{ justifyContent: "space-between" }}>
                <div style={{ display: "flex", gap: "15px", alignItems: "center" }}>
                  <div className="food-icon">🍱</div>
                  <div className="food-details">
                    <h3>{item.food_name}</h3>
                    <p>📍 Donor: <strong>{item.organization_name || item.donor_name}</strong> ({item.pickup_location})</p>
                    <p>⚖️ Quantity: <strong>{item.quantity_display}</strong></p>
                    {item.requested_by_name && <p>🏠 Requested by: <strong>{item.requested_by_name}</strong></p>}
                    <p style={{ color: item.freshness_score > 75 ? "#16a34a" : "#ca8a04", fontWeight: "600" }}>
                      🌿 AI Freshness: {item.freshness_score}% | Urgency: {item.urgency_level}
                    </p>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "8px", alignItems: "flex-end" }}>
                  <span className={`status ${item.status === 'AVAILABLE' ? 'available' : 'requested'}`}>
                    {item.status}
                  </span>
                  <button
                    type="button"
                    className="primary-btn small"
                    onClick={() => handleClaim(item.id)}
                    disabled={claimingId === item.id}
                  >
                    {claimingId === item.id ? "Accepting…" : "+ Accept Pickup"}
                  </button>
                </div>
              </div>
            ))
          ) : null}
        </section>

        {/* Section 2: My Accepted Pickups */}
        <h2 className="section-title">📋 My Assigned Route</h2>
        <section>
          {!loading && myPickups.length === 0 ? (
            <p style={{ color: "#64748b" }}>You haven't accepted any active pickups yet.</p>
          ) : !loading ? (
            myPickups.map((pickup) => (
              <div className="food-list-card" key={pickup.id}>
                <div className="food-icon">📦</div>
                <div className="food-details">
                  <h3>{pickup.food_name}</h3>
                  <p>📍 Location: <strong>{pickup.pickup_location}</strong></p>
                  <p>⚖️ Quantity: <strong>{pickup.quantity_display}</strong></p>
                  <p>📞 Donor Contact: <strong>{pickup.donor_phone || "Contact via App"}</strong></p>
                </div>
                <span className={`status ${pickup.pickup_status === 'PICKED_UP' ? 'completed' : 'requested'}`}>
                  {pickup.pickup_status}
                </span>
              </div>
            ))
          ) : null}
        </section>
      </main>
    </div>
  );
}

export default PickupSchedule;