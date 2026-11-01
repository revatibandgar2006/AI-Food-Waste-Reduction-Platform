
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import "../App.css";

function getDistanceKm(lat1, lon1, lat2, lon2) {
  const toRadians = (value) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) ** 2;

  return (
    earthRadiusKm *
    2 *
    Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  );
}

// Time-based expiry alert. This does not certify food safety.
function getExpiryAlert(expiryValue) {
  if (!expiryValue) {
    return {
      label: "EXPIRY NOT SET",
      color: "#64748b",
      level: "UNKNOWN",
    };
  }

  const expiryTime = new Date(expiryValue).getTime();

  if (!Number.isFinite(expiryTime)) {
    return {
      label: "INVALID EXPIRY TIME",
      color: "#64748b",
      level: "UNKNOWN",
    };
  }

  const remainingMs = expiryTime - Date.now();

  if (remainingMs <= 0) {
    return {
      label: "EXPIRED",
      color: "#dc2626",
      level: "EXPIRED",
    };
  }

  if (remainingMs <= 2 * 60 * 60 * 1000) {
    return {
      label: "URGENT",
      color: "#ea580c",
      level: "URGENT",
    };
  }

  if (remainingMs <= 6 * 60 * 60 * 1000) {
    return {
      label: "EXPIRING SOON",
      color: "#ca8a04",
      level: "SOON",
    };
  }

  return {
    label: "NORMAL",
    color: "#15803d",
    level: "NORMAL",
  };
}

function ReceiverDashboard() {
  const [message, setMessage] = useState("");
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [requestCount, setRequestCount] = useState(0);
  const [receivedKg, setReceivedKg] = useState(0);
  const [requestingId, setRequestingId] = useState(null);
  const [receiverLocation, setReceiverLocation] = useState(null);
  const [locationMessage, setLocationMessage] = useState("");

  const loadAvailable = async () => {
    setLoading(true);

    try {
      const [foodRes, requestRes, historyRes] = await Promise.all([
        api.browseReceiverFood(),
        api.getReceiverRequests(),
        api.getReceiverHistory(),
      ]);

      setFoods(foodRes.donations || []);
      setRequestCount(requestRes.requests?.length || 0);

      setReceivedKg(
        (historyRes.history || []).reduce(
          (total, item) => total + (Number(item.quantity_kg) || 0),
          0
        )
      );

      setError("");
    } catch (loadError) {
      setFoods([]);
      setError(loadError.message || "Could not load receiver data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAvailable();

    if (!navigator.geolocation) {
      setLocationMessage(
        "Location is unavailable. Recommendations will use expiry priority."
      );
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setReceiverLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setLocationMessage("");
      },
      () => {
        setLocationMessage(
          "Allow location access to prioritize nearby donations."
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 60000,
      }
    );
  }, []);

  // Keep only active listings and exclude expired or invalid expiry times.
  const recommendedFoods = useMemo(() => {
    const now = Date.now();

    return foods
      .filter((food) => {
        const status = String(food.status || "AVAILABLE").toUpperCase();

        if (!["AVAILABLE", "REQUESTED"].includes(status)) {
          return false;
        }

        const expiryValue = food.expiry_time || food.expiry;

        // Do not recommend food without a valid, future expiry time.
        if (!expiryValue) return false;

        const expiryTime = new Date(expiryValue).getTime();

        return Number.isFinite(expiryTime) && expiryTime > now;
      })
      .map((food) => {
        const latitude = Number(food.latitude);
        const longitude = Number(food.longitude);

        const hasCoordinates =
          food.latitude !== null &&
          food.latitude !== undefined &&
          food.latitude !== "" &&
          food.longitude !== null &&
          food.longitude !== undefined &&
          food.longitude !== "" &&
          Number.isFinite(latitude) &&
          Number.isFinite(longitude) &&
          latitude >= -90 &&
          latitude <= 90 &&
          longitude >= -180 &&
          longitude <= 180;

        const distanceKm =
          receiverLocation && hasCoordinates
            ? getDistanceKm(
                receiverLocation.latitude,
                receiverLocation.longitude,
                latitude,
                longitude
              )
            : null;

        const expiryValue = food.expiry_time || food.expiry;
        const expiryTime = new Date(expiryValue).getTime();

        return {
          ...food,
          distanceKm,
          expiryTime: Number.isFinite(expiryTime) ? expiryTime : null,
        };
      })
      .sort((a, b) => {
        // Prioritize the earliest upcoming expiry.
        if (
          a.expiryTime !== null &&
          b.expiryTime !== null &&
          a.expiryTime !== b.expiryTime
        ) {
          return a.expiryTime - b.expiryTime;
        }

        if (a.expiryTime !== null && b.expiryTime === null) return -1;
        if (a.expiryTime === null && b.expiryTime !== null) return 1;

        // If expiry is equal, prioritize nearer food.
        if (a.distanceKm !== null && b.distanceKm !== null) {
          return a.distanceKm - b.distanceKm;
        }

        if (a.distanceKm !== null) return -1;
        if (b.distanceKm !== null) return 1;

        return 0;
      })
      .slice(0, 3);
  }, [foods, receiverLocation]);

  // Donations needing attention, including expired listings.
  const expiryAlerts = useMemo(() => {
    return foods
      .filter((food) => {
        const status = String(food.status || "AVAILABLE").toUpperCase();

        return ["AVAILABLE", "REQUESTED"].includes(status);
      })
      .map((food) => {
        const expiryValue = food.expiry_time || food.expiry;
        const expiryAlert = getExpiryAlert(expiryValue);
        const expiryTimestamp = expiryValue
          ? new Date(expiryValue).getTime()
          : null;

        return {
          ...food,
          expiryAlert,
          expiryTimestamp:
            expiryTimestamp !== null && Number.isFinite(expiryTimestamp)
              ? expiryTimestamp
              : null,
        };
      })
      .filter((food) =>
        ["EXPIRED", "URGENT", "SOON", "UNKNOWN"].includes(
          food.expiryAlert.level
        )
      )
      .sort((a, b) => {
        const priority = {
          EXPIRED: 1,
          URGENT: 2,
          SOON: 3,
          UNKNOWN: 4,
        };

        if (priority[a.expiryAlert.level] !== priority[b.expiryAlert.level]) {
          return (
            priority[a.expiryAlert.level] -
            priority[b.expiryAlert.level]
          );
        }

        if (
          a.expiryTimestamp !== null &&
          b.expiryTimestamp !== null
        ) {
          return a.expiryTimestamp - b.expiryTimestamp;
        }

        if (a.expiryTimestamp !== null) return -1;
        if (b.expiryTimestamp !== null) return 1;

        return 0;
      });
  }, [foods]);

  const requestFood = async (food) => {
    const expiryValue = food.expiry_time || food.expiry;
    const expiryAlert = getExpiryAlert(expiryValue);

    if (expiryAlert.level === "EXPIRED") {
      setMessage("⚠️ This listing has expired and cannot be requested.");
      return;
    }

    if (expiryAlert.level === "UNKNOWN") {
      setMessage(
        "⚠️ This listing has no valid expiry time. Please verify it before requesting."
      );
      return;
    }

    setRequestingId(food.id);

    try {
      setMessage(`Requesting ${food.food_name || food.name}...`);

      await api.requestFood(food.id);

      setMessage(
        `${food.food_name || food.name} is now in My Requests. We will show the volunteer and delivery estimate as soon as it is accepted.`
      );

      await loadAvailable();
    } catch (err) {
      setMessage(`⚠️ ${err.message}`);
    } finally {
      setRequestingId(null);
    }
  };

  const renderFoodCard = (food, recommended = false) => {
    const expiryValue = food.expiry_time || food.expiry;
    const expiryAlert = getExpiryAlert(expiryValue);
    const isExpired = expiryAlert.level === "EXPIRED";
    const expiryIsUnknown = expiryAlert.level === "UNKNOWN";

    return (
      <div
        className="food-card"
        key={`${recommended ? "recommended-" : ""}${food.id}`}
      >
        <div className="food-icon">{recommended ? "⭐" : "🍱"}</div>

        <div className="food-details">
          <h3>{food.food_name || food.name}</h3>

          {recommended && (
            <p style={{ color: "#15803d", fontWeight: "600" }}>
              Smart Match
            </p>
          )}

          <p
            style={{
              color: expiryAlert.color,
              fontWeight: "700",
              marginTop: "4px",
            }}
          >
            ⏰ {expiryAlert.label}
          </p>

          <p>
            <strong>Category:</strong>{" "}
            {food.food_type || food.category || "Food"}
          </p>

          <span>
            Quantity:{" "}
            {food.quantity_display || food.quantity || "Not specified"}
          </span>

          <br />

          <span>
            Location:{" "}
            {food.pickup_location || food.location || "Not specified"}
          </span>

          {recommended && food.distanceKm !== null && (
            <p style={{ marginTop: "6px" }}>
              📍 Approximately {food.distanceKm.toFixed(1)} km away
            </p>
          )}

          {recommended && food.expiryTime !== null && (
            <p style={{ marginTop: "4px" }}>
              ⏰ Expiry time:{" "}
              {new Date(food.expiryTime).toLocaleString()}
            </p>
          )}

          {food.freshness_score != null && (
            <p
              style={{
                color: "#16a34a",
                fontWeight: "600",
                marginTop: "4px",
              }}
            >
              🌿 AI Freshness: {food.freshness_score}%
            </p>
          )}

          {food.spoilage_risk && (
            <p>
              <strong>Spoilage Risk:</strong> {food.spoilage_risk}
            </p>
          )}

          <div className="card-buttons">
            <button
              type="button"
              className="primary-btn small"
              onClick={() => requestFood(food)}
              disabled={
                requestingId === food.id || isExpired || expiryIsUnknown
              }
              title={
                isExpired
                  ? "Expired listings cannot be requested"
                  : expiryIsUnknown
                    ? "Verify the expiry time before requesting"
                    : "Request this donation"
              }
            >
              {isExpired
                ? "Expired — Not Requestable"
                : expiryIsUnknown
                  ? "Expiry Not Verified"
                  : requestingId === food.id
                    ? "Requesting…"
                    : "Request Food"}
            </button>
          </div>
        </div>
      </div>
    );
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
          <div className="avatar">R</div>

          <div className="user-info">
            <strong>Receiver</strong>
            <span>Food Receiver / NGO</span>
          </div>

          <Link to="/login">
            <button type="button" className="logout-btn">
              Logout
            </button>
          </Link>
        </div>
      </header>

      <nav className="navbar">
        <Link to="/receiver">
          <button type="button" className="active">
            Dashboard
          </button>
        </Link>

        <Link to="/receiver/requests">
          <button type="button">My Requests</button>
        </Link>

        <Link to="/receiver/history">
          <button type="button">History</button>
        </Link>
      </nav>

      <main className="container">
        <section className="hero">
          <div>
            <span className="eyebrow">WELCOME</span>
            <h2>Receiver &amp; Shelter Dashboard</h2>
            <p>
              Find available surplus food and request nutritious donations
              for your community.
            </p>
          </div>

          <Link to="/receiver/requests">
            <button type="button" className="primary-btn">
              My Requests
            </button>
          </Link>
        </section>

        {message && (
          <div className="success-message" role="status">
            {message}
          </div>
        )}

        {error && !loading && (
          <div role="alert" style={{ marginTop: "16px" }}>
            {error}{" "}
            <button
              type="button"
              className="outline-btn"
              onClick={loadAvailable}
            >
              Try again
            </button>
          </div>
        )}

        <section className="stats">
          <div className="stat-card">
            <span>🍱</span>
            <p>Available Food</p>
            <strong>{foods.length}</strong>
          </div>

          <div className="stat-card">
            <span>📋</span>
            <p>My Requests</p>
            <strong>{requestCount}</strong>
          </div>

          <div className="stat-card">
            <span>✅</span>
            <p>Food Received</p>
            <strong>{receivedKg.toLocaleString()} kg</strong>
          </div>
        </section>

        {/* Expiry and urgency alerts */}
        <section style={{ marginTop: "28px" }}>
          <div className="section-header">
            <div>
              <h2>⏰ Expiry &amp; Urgency Alerts</h2>
              <p>
                Donations needing attention based on their recorded expiry
                time.
              </p>
            </div>
          </div>

          {loading && <p>Checking expiry alerts…</p>}

          {!loading && !error && expiryAlerts.length === 0 && (
            <p>No urgent expiry alerts right now.</p>
          )}

          {!loading && !error && expiryAlerts.length > 0 && (
            <div className="food-grid">
              {expiryAlerts.map((food) => (
                <div className="food-card" key={`alert-${food.id}`}>
                  <div className="food-icon">⏰</div>

                  <div className="food-details">
                    <h3>{food.food_name || food.name}</h3>

                    <p
                      style={{
                        color: food.expiryAlert.color,
                        fontWeight: "700",
                      }}
                    >
                      {food.expiryAlert.label}
                    </p>

                    <p>
                      <strong>Quantity:</strong>{" "}
                      {food.quantity_display ||
                        food.quantity ||
                        "Not specified"}
                    </p>

                    <p>
                      <strong>Expiry:</strong>{" "}
                      {food.expiryTimestamp !== null
                        ? new Date(
                            food.expiryTimestamp
                          ).toLocaleString()
                        : "Not available"}
                    </p>

                    {food.urgency_level && (
                      <p>
                        <strong>AI Urgency:</strong> {food.urgency_level}
                      </p>
                    )}

                    {food.spoilage_risk && (
                      <p>
                        <strong>Spoilage Risk:</strong>{" "}
                        {food.spoilage_risk}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Smart recommendations */}
        <section style={{ marginTop: "28px" }}>
          <div className="section-header">
            <div>
              <h2>⭐ Smart Recommended Food</h2>
              <p>
                Upcoming-expiry donations are prioritized first, followed by
                distance when location information is available.
              </p>
            </div>
          </div>

          {locationMessage && (
            <p role="status">{locationMessage}</p>
          )}

          {loading && <p>Finding suitable food donations…</p>}

          {!loading && !error && recommendedFoods.length === 0 && (
            <p>
              No suitable recommendations are available right now. Please
              check Available Food for Rescue below.
            </p>
          )}

          {!loading && !error && recommendedFoods.length > 0 && (
            <div className="food-grid">
              {recommendedFoods.map((food) =>
                renderFoodCard(food, true)
              )}
            </div>
          )}
        </section>

        {/* All available donations */}
        <section style={{ marginTop: "32px" }}>
          <div className="section-header">
            <div>
              <h2>Available Food for Rescue</h2>
              <p>
                Browse available donations and request food for your community.
              </p>
            </div>
          </div>

          <div className="food-grid">
            {loading && (
              <p>Loading available food from the network…</p>
            )}

            {!loading && !error && foods.length === 0 && (
              <p>
                No available listings right now. New donations will appear
                here as they are posted.
              </p>
            )}

            {!loading &&
              !error &&
              foods.map((food) => renderFoodCard(food))}
          </div>
        </section>

        <p
          style={{
            marginTop: "20px",
            fontSize: "13px",
            color: "#64748b",
          }}
        >
          Expiry alerts use the recorded expiry time. Always verify food
          condition and safe handling before distribution.
        </p>
      </main>
    </div>
  );
}

export default ReceiverDashboard;
