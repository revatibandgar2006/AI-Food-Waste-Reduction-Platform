import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import "../App.css";

function ReceiverHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalKg: 0, totalMeals: 0, totalDeliveries: 0 });

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await api.getReceiverHistory();
      const list = res.history || [];
      setHistory(list);

      const totalKg = list.reduce((sum, h) => sum + (parseFloat(h.quantity_kg) || 0), 0);
      setStats({
        totalDeliveries: list.length,
        totalKg: Math.round(totalKg * 10) / 10,
        totalMeals: Math.round(totalKg * 2.5),
      });
    } catch {
      setHistory([]);
    } finally {
      setLoading(false);
    }
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
          <div className="avatar">{(localStorage.getItem("userName") || "R").charAt(0).toUpperCase()}</div>
          <div className="user-info">
            <strong>{localStorage.getItem("userName") || "Receiver"}</strong>
            <span>Food Receiver</span>
          </div>
          <Link to="/login">
            <button className="logout-btn" onClick={() => api.logout()}>Logout</button>
          </Link>
        </div>
      </header>

      <nav className="navbar">
        <Link to="/receiver"><button>Dashboard</button></Link>
        <Link to="/receiver/requests"><button>My Requests</button></Link>
        <Link to="/receiver/history"><button className="active">History</button></Link>
      </nav>

      <main className="container">
        <div className="page-heading">
          <h2>Delivery History</h2>
          <p>All food donations your organization has received — saved in database.</p>
        </div>

        {/* ESG Impact Summary */}
        <section className="stats">
          <div className="stat-card">
            <span>✅</span>
            <p>Total Deliveries</p>
            <strong>{stats.totalDeliveries}</strong>
          </div>
          <div className="stat-card">
            <span>🍱</span>
            <p>Food Received</p>
            <strong>{stats.totalKg} kg</strong>
          </div>
          <div className="stat-card">
            <span>🤲</span>
            <p>Meals Served</p>
            <strong>{stats.totalMeals}</strong>
          </div>
        </section>

        <h2 className="section-title">Previous Deliveries Received</h2>

        {loading ? (
          <p style={{ color: "#64748b", padding: "20px" }}>Loading from database...</p>
        ) : history.length === 0 ? (
          <div className="receiver-history-empty">
            <div className="receiver-history-icon">📋</div>
            <h2>No history yet</h2>
            <p>Completed food deliveries will appear here once volunteers deliver to your shelter.</p>
            <Link to="/receiver/requests">
              <button className="primary-btn">Browse Available Food</button>
            </Link>
          </div>
        ) : (
          <div className="receiver-history-list">
            {history.map((item, idx) => (
              <div className="food-list-card" key={item.id || idx}>
                <div className="food-icon">🍱</div>
                <div className="food-details">
                  <h3>{item.food_name}</h3>
                  <p>Quantity: <strong>{item.quantity_display}</strong> ({item.quantity_kg} kg)</p>
                  <p>🚚 Volunteer: <strong>{item.volunteer_name}</strong></p>
                  <p>🏠 From: <strong>{item.donor_name}</strong></p>
                  {item.delivered_at && (
                    <p>📅 Delivered: {new Date(item.delivered_at).toLocaleString()}</p>
                  )}
                  {item.co2_saved_kg && (
                    <p style={{ color: "#16a34a", fontWeight: "600" }}>
                      🌿 CO₂ Saved: {item.co2_saved_kg} kg | 💧 Water Saved: {item.water_saved_liters} L
                    </p>
                  )}
                  {item.receiver_feedback && (
                    <p style={{ fontStyle: "italic", color: "#64748b" }}>
                      ⭐ {item.receiver_rating}/5 — "{item.receiver_feedback}"
                    </p>
                  )}
                </div>
                <span className="status completed">DELIVERED</span>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default ReceiverHistory;