import { useState } from "react";
import { Link } from "react-router-dom";
import "../App.css";

function Settings() {
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);

    setTimeout(() => {
      setSaved(false);
    }, 3000);
  };

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


      {/* ================= NAVBAR ================= */}
      <nav className="navbar">

        <Link to="/volunteer/dashboard">
          <button>
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
          <button className="active">
            Settings
          </button>
        </Link>

      </nav>


      {/* ================= MAIN CONTENT ================= */}
      <main className="container">

        {/* Page Heading */}
        <div className="page-heading">

          <h2>
            Settings
          </h2>

          <p>
            Manage your volunteer account settings.
          </p>

        </div>


        {/* ================= SETTINGS CARD ================= */}
        <section
          className="food-list-card"
          style={{
            display: "block",
            maxWidth: "700px",
            marginTop: "25px",
          }}
        >

          {/* Notifications */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "20px 0",
              borderBottom: "1px solid #ddd",
            }}
          >

            <div>

              <h3>
                🔔 Notifications
              </h3>

              <p>
                Receive pickup and delivery alerts.
              </p>

            </div>

            <input
              type="checkbox"
              checked={notifications}
              onChange={(e) =>
                setNotifications(e.target.checked)
              }
              style={{
                width: "22px",
                height: "22px",
                cursor: "pointer",
              }}
            />

          </div>


          {/* Dark Mode */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "20px 0",
              borderBottom: "1px solid #ddd",
            }}
          >

            <div>

              <h3>
                🌙 Dark Mode
              </h3>

              <p>
                Change the appearance of the dashboard.
              </p>

            </div>

            <input
              type="checkbox"
              checked={darkMode}
              onChange={(e) =>
                setDarkMode(e.target.checked)
              }
              style={{
                width: "22px",
                height: "22px",
                cursor: "pointer",
              }}
            />

          </div>


          {/* Save Button */}
          <div
            style={{
              marginTop: "25px",
            }}
          >

            <button
              className="primary-btn"
              onClick={handleSave}
            >
              💾 Save Settings
            </button>

          </div>


          {/* Success Message */}
          {saved && (
            <div
              className="success-message"
              style={{
                marginTop: "20px",
              }}
            >
              ✅ Settings saved successfully!
            </div>
          )}

        </section>


        {/* ================= DARK MODE INFORMATION ================= */}
        {darkMode && (
          <section
            className="food-list-card"
            style={{
              display: "block",
              maxWidth: "700px",
              marginTop: "20px",
            }}
          >

            <h3>
              🌙 Dark Mode Enabled
            </h3>

            <p>
              Dark mode is currently enabled for your dashboard.
            </p>

          </section>
        )}

      </main>

    </div>
  );
}

export default Settings;