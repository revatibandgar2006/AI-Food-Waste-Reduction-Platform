import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import "../App.css";

function VolunteerDashboard() {
  const [stats, setStats] = useState({
    deliveriesCompleted: 0,
    badgeLevel: "BRONZE",
    pendingPickups: 0,
    co2OffsetKg: 0,
  });

  const [pickups, setPickups] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([api.getVolunteerStats(), api.getAvailablePickups()])
      .then(([statsRes, pickupRes]) => {
        setStats(statsRes.stats || {});
        setPickups(pickupRes.pickups || []);
        setError("");
      })
      .catch((requestError) => setError(requestError.message || "Could not load volunteer data."));
  }, []);

  return (
    <div className="app">

      {/* ================= HEADER ================= */}

      <header className="header">

        <div className="brand">

          <div className="brand-icon">
            🍴
          </div>

          <div>
            <h1>Food Rescue</h1>
            <p>Share food. Reduce waste.</p>
          </div>

        </div>

        <div className="user-area">

          <div className="avatar">
            V
          </div>

          <div className="user-info">
            <strong>Volunteer</strong>
            <span>Food Volunteer</span>
          </div>

          <Link to="/login">
            <button className="logout-btn">
              Logout
            </button>
          </Link>

        </div>

      </header>


      {/* ================= NAVIGATION ================= */}

      <nav className="navbar">

        <Link to="/volunteer/dashboard">
          <button className="active">
            Dashboard
          </button>
        </Link>

        <Link to="/volunteer/pickup">
          <button>
            Pickup Schedule
          </button>
        </Link>

        <Link to="/volunteer/delivery">
          <button>
            Delivery Status
          </button>
        </Link>

        <Link to="/volunteer/notifications">
          <button>
            Notifications
          </button>
        </Link>

        <Link to="/volunteer/profile">
          <button>
            Profile
          </button>
        </Link>

        <Link to="/volunteer/settings">
          <button>
            Settings
          </button>
        </Link>

      </nav>


      {/* ================= MAIN CONTENT ================= */}

      <main className="container">

        {/* Welcome Section */}

        <section className="hero">

          <div>

            <span className="eyebrow">
              WELCOME
            </span>

            <h2>
              Volunteer Dashboard
            </h2>

            <p>
              Manage your food pickups and deliveries
              and help reduce food waste in your community.
            </p>

          </div>

          <Link to="/volunteer/pickup">
            <button className="primary-btn">
              View Pickups
            </button>
          </Link>

        </section>


        {/* ================= STATS ================= */}

        <section className="stats">

          <div className="stat-card">
            <span>📦</span>
            <p>Pending Pickups</p>
            <strong>{stats.pendingPickups ?? 0}</strong>
          </div>

          <div className="stat-card">
            <span>🎖️</span>
            <p>Volunteer Badge</p>
            <strong>{stats.badgeLevel || "BRONZE"}</strong>
          </div>

          <div className="stat-card">
            <span>✅</span>
            <p>Completed Deliveries</p>
            <strong>{stats.deliveriesCompleted ?? 0}</strong>
          </div>

          <div className="stat-card">
            <span>🌿</span>
            <p>CO₂ Offset</p>
            <strong>{stats.co2OffsetKg ?? 0} kg</strong>
          </div>
        </section>


        {/* ================= QUICK ACTIONS ================= */}

        <div className="section-header">

          <div>

            <h2>
              Quick Actions
            </h2>

            <p>
              Quickly access your volunteer activities.
            </p>

          </div>

        </div>


        <section className="food-grid">

          <div className="food-card">

            <div className="food-icon">
              📦
            </div>

            <div className="food-details">

              <h3>
                Pickup Schedule
              </h3>

              <p>
                View your assigned food pickups.
              </p>

              <div className="card-buttons">

                <Link to="/volunteer/pickup">
                  <button className="primary-btn small">
                    View Pickups
                  </button>
                </Link>

              </div>

            </div>

          </div>


          <div className="food-card">

            <div className="food-icon">
              🚚
            </div>

            <div className="food-details">

              <h3>
                Delivery Status
              </h3>

              <p>
                Track your food deliveries.
              </p>

              <div className="card-buttons">

                <Link to="/volunteer/delivery">
                  <button className="primary-btn small">
                    View Deliveries
                  </button>
                </Link>

              </div>

            </div>

          </div>


          <div className="food-card">

            <div className="food-icon">
              🔔
            </div>

            <div className="food-details">

              <h3>
                Notifications
              </h3>

              <p>
                Check your latest volunteer updates.
              </p>

              <div className="card-buttons">

                <Link to="/volunteer/notifications">
                  <button className="primary-btn small">
                    View Notifications
                  </button>
                </Link>

              </div>

            </div>

          </div>

        </section>


        {/* ================= UPCOMING PICKUPS ================= */}

        <div className="section-header">

          <div>

            <h2>
              Upcoming Pickups
            </h2>

            <p>
              Your assigned food pickups.
            </p>

          </div>

        </div>


        <section>

          {pickups.map((pickup) => (

            <div
              className="food-list-card"
              key={pickup.id}
            >

              <div className="food-icon">
                📦
              </div>


              <div className="food-details">

                <h3>
                  {pickup.donor}
                </h3>

                <p>
                  {pickup.food}
                </p>

                <span>
                  Quantity: {pickup.quantity}
                </span>

                <br />

                <span>
                  Time: {pickup.time}
                </span>

              </div>


              <span
                className={`status ${
                  pickup.status === "Picked Up"
                    ? "completed"
                    : "requested"
                }`}
              >
                {pickup.status}
              </span>

            </div>

          ))}

        </section>


        {/* ================= ACTIVITY SUMMARY ================= */}

        <div className="section-header">

          <div>

            <h2>
              My Activity
            </h2>

            <p>
              Your food rescue contribution.
            </p>

          </div>

        </div>


        <section className="stats">

          <div className="stat-card">

            <span>
              🍱
            </span>

            <p>
              Total Food Collected
            </p>

            <strong>
              125 kg
            </strong>

          </div>


          <div className="stat-card">

            <span>
              🚚
            </span>

            <p>
              Successful Deliveries
            </p>

            <strong>
              18
            </strong>

          </div>


          <div className="stat-card">

            <span>
              🌱
            </span>

            <p>
              Meals Saved
            </p>

            <strong>
              250
            </strong>

          </div>


          <div className="stat-card">

            <span>
              ⭐
            </span>

            <p>
              Volunteer Rating
            </p>

            <strong>
              4.8 / 5
            </strong>

          </div>

        </section>

      </main>

    </div>
  );
}

export default VolunteerDashboard;