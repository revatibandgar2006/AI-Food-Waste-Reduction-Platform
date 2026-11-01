import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import "../App.css";

function MyListings() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchListings = async () => {
    try {
      const res = await api.getMyDonations();
      setListings(res.donations || []);
      setError("");
    } catch (requestError) {
      setListings([]);
      setError(requestError.message || "Could not load your listings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  const deleteFood = async (id) => {
    try {
      await api.deleteDonation(id);
      setListings((prev) => prev.filter((food) => food.id !== id));
    } catch (requestError) {
      setError(requestError.message || "Could not remove this listing.");
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
          <div className="avatar">D</div>

          <div className="user-info">
            <strong>Donor</strong>
            <span>Food Donor</span>
          </div>

          <Link to="/login">
            <button className="logout-btn">
              Logout
            </button>
          </Link>
        </div>
      </header>

      <nav className="navbar">

        <Link to="/donor">
          <button>Dashboard</button>
        </Link>

        <Link to="/donor/add-food">
          <button>Add Food</button>
        </Link>

        <Link to="/donor/listings">
          <button className="active">
            My Listings
          </button>
        </Link>

        <Link to="/donor/status">
          <button>Status</button>
        </Link>

      </nav>

      <main className="container">

        <div className="page-heading">
          <h2>My Listings</h2>

          <p>
            Food donations you have added.
          </p>
        </div>

        <h2 className="section-title">
          My Food Donations
        </h2>

        {error && <p role="alert" className="listing-error">{error}</p>}

        {loading ? <p>Loading your listings…</p> : null}

        {!loading && listings.length === 0 ? (

          <div className="empty-food">

            <div className="empty-icon">
              🍱
            </div>

            <h2>No food donations yet</h2>

            <p>
              Add your first food donation to help
              reduce food waste.
            </p>

            <Link to="/donor/add-food">
              <button className="donor-primary-btn">
                ➕ Add Food Donation
              </button>
            </Link>

          </div>

        ) : !loading ? (

          listings.map((food) => (

            <div
              className="food-list-card"
              key={food.id}
            >

              <div className="food-icon">
                🍱
              </div>

              <div className="food-details">
                <h3>{food.food_name || food.name}</h3>

                <p>
                  Quantity: {food.quantity_display || food.quantity}
                </p>

                <p>
                  Type: {food.food_type || food.type}
                </p>

                <p>
                  Pickup: {food.pickup_location || food.location}
                </p>

                <p>
                  Expiry: {food.expiry_time ? new Date(food.expiry_time).toLocaleString() : food.expiry}
                </p>

                {food.freshness_score && (
                  <p style={{ color: food.freshness_score > 70 ? "#16a34a" : "#ca8a04", fontWeight: "600" }}>
                    🌿 AI Freshness: {food.freshness_score}% ({food.spoilage_risk || 'Normal'} Risk)
                  </p>
                )}

                {food.description && (
                  <p>
                    Description: {food.description}
                  </p>
                )}
              </div>

              <div className="listing-actions">

                <span
                  className={`status ${
                    food.status === "AVAILABLE"
                      ? "available"
                      : food.status === "REQUESTED"
                      ? "requested"
                      : "completed"
                  }`}
                >
                  {(food.status || "AVAILABLE").replaceAll("_", " ")}
                </span>

                <button
                  type="button"
                  className="delete-food-btn"
                  onClick={() => deleteFood(food.id)}
                >
                  🗑 Delete
                </button>

              </div>

            </div>

          ))

        ) : null}

      </main>
    </div>
  );
}

export default MyListings;