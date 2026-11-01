
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import "../App.css";

const initialFood = {
  name: "",
  quantity: "",
  type: "",
  expiry: "",
  location: "",
  description: "",
  storageType: "Room Temperature",
  latitude: "",
  longitude: "",
};

function AddFood() {
  const navigate = useNavigate();

  const [food, setFood] = useState(initialFood);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationMessage, setLocationMessage] = useState("");
  const [aiResult, setAiResult] = useState(null);


  const handleChange = (e) => {
    const { name, value } = e.target;

    setFood((previousFood) => ({
      ...previousFood,
      [name]: value,
    }));

    if (name === "location") {
      setLocationMessage("");
    }
  };


  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setLocationMessage(
        "Your browser does not support location detection. Please use another browser."
      );
      return;
    }

    setLocationLoading(true);
    setLocationMessage("Getting your current location...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        setFood((previousFood) => ({
          ...previousFood,
          latitude: String(latitude),
          longitude: String(longitude),
        }));

        setLocationLoading(false);
        setLocationMessage(
          `Location captured successfully. Latitude: ${latitude.toFixed(
            6
          )}, Longitude: ${longitude.toFixed(6)}.`
        );
      },
      (error) => {
        setLocationLoading(false);

        let errorMessage =
          "Could not get your location. Please allow location permission and try again.";

        if (error.code === 1) {
          errorMessage =
            "Location permission denied. Allow location access in your browser settings.";
        } else if (error.code === 2) {
          errorMessage =
            "Your current location is unavailable. Please try again.";
        } else if (error.code === 3) {
          errorMessage =
            "Location request timed out. Please try again.";
        }

        setLocationMessage(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !food.name.trim() ||
      !food.quantity.trim() ||
      !food.type ||
      !food.expiry ||
      !food.location.trim()
    ) {
      setMessage("Please fill all required fields.");
      return;
    }

    if (
      (food.latitude && !food.longitude) ||
      (!food.latitude && food.longitude)
    ) {
      setMessage("Please capture your location again.");
      return;
    }

    setLoading(true);
    setMessage("");
    setAiResult(null);

    try {
      const donationData = {
        name: food.name.trim(),
        quantity: food.quantity.trim(),
        type: food.type,
        expiry: food.expiry,
        location: food.location.trim(),
        description: food.description.trim(),
        storageType: food.storageType,
      };

      // Send coordinates only when both values are available.
      if (food.latitude && food.longitude) {
        donationData.latitude = Number(food.latitude);
        donationData.longitude = Number(food.longitude);
      }

      const res = await api.createDonation(donationData);

      setAiResult(res.aiAnalysis || null);

      setMessage(
        `Donation published! AI Freshness Score: ${
          res.donation?.freshness_score ?? 95
        }% (${res.donation?.spoilage_risk || "LOW"} risk). Volunteers notified.`
      );

      setFood({ ...initialFood });
      setLocationMessage("");

      setTimeout(() => {
        navigate("/donor/listings");
      }, 1800);
    } catch (err) {
      setMessage(`Could not publish donation: ${err.message}`);
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
          <div className="avatar">D</div>
          <div className="user-info">
            <strong>Donor</strong>
            <span>Food Donor</span>
          </div>

          <Link to="/login">
            <button type="button" className="logout-btn">
              Logout
            </button>
          </Link>
        </div>
      </header>

      <nav className="navbar">
        <Link to="/donor">
          <button type="button">Dashboard</button>
        </Link>

        <Link to="/donor/add-food">
          <button type="button" className="active">
            Add Food
          </button>
        </Link>

        <Link to="/donor/listings">
          <button type="button">My Listings</button>
        </Link>

        <Link to="/donor/status">
          <button type="button">Status</button>
        </Link>
      </nav>

      <main className="container">
        <div className="page-heading">
          <h2>Add Food Donation</h2>
          <p>
            Add surplus food that can be rescued and distributed.
          </p>
        </div>

        {message && (
          <div className="success-message" role="status">
            {message}
          </div>
        )}

        <form className="food-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="food-name">Food Name *</label>
            <input
              id="food-name"
              type="text"
              name="name"
              placeholder="Example: Vegetable Biryani"
              value={food.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="food-quantity">Quantity *</label>
            <input
              id="food-quantity"
              type="text"
              name="quantity"
              placeholder="Example: 20 kg"
              value={food.quantity}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="food-type">Food Type *</label>
            <select
              id="food-type"
              name="type"
              value={food.type}
              onChange={handleChange}
              required
            >
              <option value="">Select food type</option>
              <option value="Cooked Food">Cooked Food</option>
              <option value="Vegetables">Vegetables</option>
              <option value="Rice">Rice</option>
              <option value="Bread">Bread</option>
              <option value="Fruits">Fruits</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="food-expiry">Expiry / Best Before *</label>
            <input
              id="food-expiry"
              type="datetime-local"
              name="expiry"
              value={food.expiry}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="food-location">Pickup Address / Location *</label>
            <input
              id="food-location"
              type="text"
              name="location"
              placeholder="Example: Hotel name, area, city"
              value={food.location}
              onChange={handleChange}
              required
            />

            <button
              type="button"
              className="primary-btn"
              onClick={handleGetLocation}
              disabled={locationLoading}
              style={{ marginTop: "10px" }}
            >
              {locationLoading
                ? "Getting Location..."
                : "📍 Use My Current Location"}
            </button>

            {locationMessage && (
              <p
                role="status"
                style={{ marginTop: "8px", overflowWrap: "anywhere" }}
              >
                {locationMessage}
              </p>
            )}

            {food.latitude && food.longitude && (
              <p style={{ marginTop: "6px" }}>
                Coordinates ready to submit.
              </p>
            )}

            <small>
              Use this button while you are at the actual food pickup
              location. The address above must describe where volunteers
              should collect the food.
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="storage-type">Storage Type</label>
            <select
              id="storage-type"
              name="storageType"
              value={food.storageType}
              onChange={handleChange}
            >
              <option value="Room Temperature">
                Room Temperature
              </option>
              <option value="Refrigerated">Refrigerated</option>
              <option value="Frozen">Frozen</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="food-description">Description</label>
            <textarea
              id="food-description"
              name="description"
              rows="4"
              placeholder="Additional information about the food..."
              value={food.description}
              onChange={handleChange}
            />
          </div>

          <button
            type="submit"
            className="primary-btn add-food-submit"
            disabled={loading}
          >
            {loading
              ? "Publishing Donation..."
              : "+ Add Food Donation"}
          </button>
        </form>
      </main>
    </div>
  );
}

export default AddFood;
