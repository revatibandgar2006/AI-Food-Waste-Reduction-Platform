import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import "../App.css";

function DonorDashboard() {
  const [stats, setStats] = useState({
    total: 0,
    available: 0,
    requested: 0,
    completed: 0,
  });
  const [latest, setLatest] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api.getMyDonations()
      .then((res) => {
        const list = res.donations || [];
        setLatest(list.slice(0, 3));
        setStats({
          total: list.length,
          available: list.filter((d) => d.status === "AVAILABLE").length,
          requested: list.filter((d) => ["REQUESTED", "ASSIGNED", "PICKED_UP"].includes(d.status)).length,
          completed: list.filter((d) => d.status === "DELIVERED").length,
        });
        setError("");
      })
      .catch((requestError) => setError(requestError.message || "Could not load your donations."));
  }, []);

  return (
    <div className="app">

      <header className="header">
        <div className="brand">
          <div className="brand-icon"> 🍴</div>

          <div>
            <h1> Food Rescue</h1>
            <p>Share food. Reduce waste.</p>
          </div>
        </div>

        <div className="user-area">
          <div className="avatar">D</div>

          <div className="user-info">
            <strong>{localStorage.getItem("userName") || "Donor"}</strong>
            <span>Food Donor</span>
          </div>

          <button className="logout-btn" onClick={() => { api.logout(); window.location.assign("/login"); }}>Logout</button>
        </div>
      </header>

      <nav className="navbar">
        <Link to="/donor">
          <button className="active">Dashboard</button>
        </Link>

        <Link to="/donor/add-food">
          <button>Add Food</button>
        </Link>

        <Link to="/donor/listings">
          <button>My Listings</button>
        </Link>

        <Link to="/donor/status">
          <button>Status</button>
        </Link>
      </nav>

      <main className="container">

        <section className="hero">
          <div>
            <span className="eyebrow">WELCOME BACK</span>

            <h2>Donor Dashboard</h2>

            <p>
              Thank you for helping reduce food waste and feed communities.
            </p>
          </div>

          <Link to="/donor/add-food">
            <button className="primary-btn">
              + Add Food
            </button>
          </Link>
        </section>

        {error && <p role="alert" className="dashboard-error">{error} <Link to="/login">Sign in again</Link></p>}

        <section className="stats four">
          <div className="stat-card">
            <span>🍱</span>
            <p>Total Donations</p>
            <strong>{stats.total}</strong>
          </div>

          <div className="stat-card">
            <span>📦</span>
            <p>Available</p>
            <strong>{stats.available}</strong>
          </div>

          <div className="stat-card">
            <span>🤝</span>
            <p>Requested</p>
            <strong>{stats.requested}</strong>
          </div>

          <div className="stat-card">
            <span>✅</span>
            <p>Completed</p>
            <strong>{stats.completed}</strong>
          </div>
        </section>

        <div className="section-header">
          <div><h2>Latest listings</h2><p>Your three most recent donations and their current status.</p></div>
          <Link to="/donor/listings"><button className="outline-btn">All listings</button></Link>
        </div>
        {latest.length === 0 ? (
          <div className="food-card donor-empty"><div className="food-icon">＋</div><div className="food-details"><h3>Your next listing can make someone's day.</h3><p>Post surplus with a pickup window and local volunteers can move it to a nearby community.</p><Link to="/donor/add-food"><button className="primary-btn small">Add a donation</button></Link></div></div>
        ) : (
          <section className="food-grid">
            {latest.map((food) => <article className="food-card donor-latest" key={food.id}><div className="food-icon">🍲</div><div className="food-details"><h3>{food.food_name}</h3><p>{food.quantity_display} · {food.pickup_location}</p><span className={`status ${food.status === "DELIVERED" ? "completed" : food.status === "AVAILABLE" ? "available" : "requested"}`}>{food.status.replaceAll("_", " ")}</span></div></article>)}
          </section>
        )}

        <div className="section-header">
          <div>
            <h2>Quick Actions</h2>
            <p>Manage your food donations</p>
          </div>
        </div>

        <section className="food-grid">

          <div className="food-card">
            <div className="food-icon">🍱</div>

            <div className="food-details">
              <h3>Add Food</h3>

              <p>
                List extra food that can be shared with people in need.
              </p>

              <Link to="/donor/add-food">
                <button className="primary-btn small">
                  Add Food
                </button>
              </Link>
            </div>
          </div>

          <div className="food-card">
            <div className="food-icon">📋</div>

            <div className="food-details">
              <h3>My Listings</h3>

              <p>
                View and manage your donated food listings.
              </p>

              <Link to="/donor/listings">
                <button className="outline-btn small">
                  View Listings
                </button>
              </Link>
            </div>
          </div>

        </section>

      </main>

    </div>
  );
}

export default DonorDashboard;