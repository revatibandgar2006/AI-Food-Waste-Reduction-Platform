import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import "../App.css";

function DonationStatus() {
  const [donations, setDonations] = useState([]);
  const [stats, setStats] = useState({ total: 0, available: 0, requested: 0, completed: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDonations();
  }, []);

  const fetchDonations = async () => {
    try {
      const res = await api.getMyDonations();
      const list = res.donations || [];
      setDonations(list);
      setStats({
        total: list.length,
        available: list.filter(d => d.status === "AVAILABLE").length,
        requested: list.filter(d => ["REQUESTED", "ASSIGNED", "PICKED_UP"].includes(d.status)).length,
        completed: list.filter(d => d.status === "DELIVERED").length,
      });
    } catch (requestError) {
      setError(requestError.message || "Could not load donation status.");
      setDonations([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusClass = (status) => {
    if (status === "AVAILABLE") return "available";
    if (status === "DELIVERED") return "completed";
    return "requested";
  };

  const getStatusLabel = (status) => {
    const map = {
      AVAILABLE: "Available",
      REQUESTED: "Requested",
      ASSIGNED: "Assigned",
      PICKED_UP: "Picked Up",
      DELIVERED: "Delivered",
      EXPIRED: "Expired",
      CANCELLED: "Cancelled",
    };
    return map[status] || status;
  };

  return (
    <div className="app">
      <header className="header">
        <div className="brand">
          <div className="brand-icon">🍴</div>
          <div>
            <h1>Food Rescue</h1>
            <p>Share food. Reduce waste.</p>
          </div>
        </div>
        <div className="user-area">
          <div className="avatar">{(localStorage.getItem("userName") || "D").charAt(0).toUpperCase()}</div>
          <div className="user-info">
            <strong>{localStorage.getItem("userName") || "Donor"}</strong>
            <span>Food Donor</span>
          </div>
          <Link to="/login">
            <button className="logout-btn" onClick={() => api.logout()}>Logout</button>
          </Link>
        </div>
      </header>

      <nav className="navbar">
        <Link to="/donor"><button>Dashboard</button></Link>
        <Link to="/donor/add-food"><button>Add Food</button></Link>
        <Link to="/donor/listings"><button>My Listings</button></Link>
        <Link to="/donor/status"><button className="active">Status</button></Link>
      </nav>

      <main className="container">
        <div className="page-heading">
          <h2>Donation Status</h2>
          <p>Live tracking of all your food donations from database.</p>
        </div>

        <div className="stats four">
          <div className="stat-card">
            <span>📦</span>
            <p>Total</p>
            <strong>{stats.total}</strong>
          </div>
          <div className="stat-card">
            <span>🟢</span>
            <p>Available</p>
            <strong>{stats.available}</strong>
          </div>
          <div className="stat-card">
            <span>🟡</span>
            <p>In Progress</p>
            <strong>{stats.requested}</strong>
          </div>
          <div className="stat-card">
            <span>✅</span>
            <p>Delivered</p>
            <strong>{stats.completed}</strong>
          </div>
        </div>

        <h2 className="section-title">All Donations (Live from Database)</h2>

        {error && <p role="alert">{error} <button className="outline-btn" onClick={fetchDonations}>Try again</button></p>}

        {loading ? (
          <p style={{ color: "#64748b", padding: "20px" }}>Loading from database...</p>
        ) : donations.length === 0 ? (
          <div className="empty-food">
            <div className="empty-icon">📋</div>
            <h2>No donations yet</h2>
            <p>Add your first food donation to start tracking.</p>
            <Link to="/donor/add-food">
              <button className="primary-btn">+ Add Food Donation</button>
            </Link>
          </div>
        ) : (
          donations.map((donation, index) => (
            <div className="food-list-card" key={donation.id || index}>
              <div className="food-icon">🍱</div>
              <div className="food-details">
                <h3>{donation.food_name || donation.name}</h3>
                <p>Quantity: {donation.quantity_display || donation.quantity}</p>
                <p>📍 Location: {donation.pickup_location || "—"}</p>
                {donation.expiry_time && (
                  <p>⏰ Expiry: {new Date(donation.expiry_time).toLocaleString()}</p>
                )}
                {donation.freshness_score && (
                  <p style={{ color: donation.freshness_score > 70 ? "#16a34a" : "#ca8a04", fontWeight: "600" }}>
                    🌿 AI Freshness: {donation.freshness_score}% — {donation.ai_recommendation?.substring(0, 80)}...
                  </p>
                )}
              </div>
              <span className={`status ${getStatusClass(donation.status)}`}>
                {getStatusLabel(donation.status)}
              </span>
            </div>
          ))
        )}
      </main>
    </div>
  );
}

export default DonationStatus;