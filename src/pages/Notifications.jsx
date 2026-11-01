import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import "../App.css";

function Notifications() {
  const [notifications, setNotifications] = useState([
    {
      icon: "📦",
      title: "New pickup assigned",
      message: "Hotel Taj has assigned a new food pickup.",
      time: "10 minutes ago",
    },
    {
      icon: "🚚",
      title: "Delivery completed",
      message: "Your delivery to Hope Shelter was completed.",
      time: "1 hour ago",
    },
    {
      icon: "🔔",
      title: "Pickup reminder",
      message: "You have a pickup scheduled at 12:30 PM.",
      time: "2 hours ago",
    },
  ]);

  useEffect(() => {
    api.getNotifications()
      .then((res) => {
        if (res.notifications && res.notifications.length > 0) {
          const mapped = res.notifications.map((n) => ({
            icon: n.type === "DISPATCH" ? "🚨" : n.type === "OTP" ? "🔐" : n.type === "ESG" ? "💚" : "🔔",
            title: n.title,
            message: n.message,
            time: new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          }));
          setNotifications(mapped);
        }
      })
      .catch(() => {});
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
          <button className="active">
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

        {/* Page Heading */}

        <div className="page-heading">

          <h2>
            Notifications
          </h2>

          <p>
            Stay updated with your volunteer activities.
          </p>

        </div>


        {/* ================= NOTIFICATION LIST ================= */}

        <section>

          {notifications.map((notification, index) => (

            <div
              className="food-list-card"
              key={index}
            >

              <div className="food-icon">
                {notification.icon}
              </div>


              <div className="food-details">

                <h3>
                  {notification.title}
                </h3>

                <p>
                  {notification.message}
                </p>

                <small>
                  {notification.time}
                </small>

              </div>

            </div>

          ))}

        </section>

      </main>

    </div>
  );
}

export default Notifications;