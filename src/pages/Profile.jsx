import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import "../App.css";

function Profile() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    vehicleType: "",
    vehicleNumber: "",
    organizationName: "",
  });
  const [role, setRole] = useState("");
  const [profileImage, setProfileImage] = useState("https://ui-avatars.com/api/?name=User&background=2E7D32&color=fff&size=120");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const res = await api.getMe();
      if (res.user) {
        const u = res.user;
        setRole(u.role || "");
        setForm({
          name: u.name || "",
          email: u.email || "",
          phone: u.phone || "",
          address: u.address || "",
          city: u.city || "",
          vehicleType: res.profile?.vehicle_type || "",
          vehicleNumber: res.profile?.vehicle_number || "",
          organizationName: res.profile?.organization_name || "",
        });
        setProfileImage(
          u.avatar ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || "User")}&background=2E7D32&color=fff&size=120`
        );
        // Also update localStorage with latest from DB
        localStorage.setItem("userName", u.name);
        localStorage.setItem("userEmail", u.email);
      }
    } catch {
      // Load from localStorage fallback
      setForm(f => ({
        ...f,
        name: localStorage.getItem("userName") || "",
        email: localStorage.getItem("userEmail") || "",
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const imageURL = URL.createObjectURL(file);
      setProfileImage(imageURL);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      await api.updateProfile({
        name: form.name,
        phone: form.phone,
        address: form.address,
        city: form.city,
        vehicleType: form.vehicleType,
        vehicleNumber: form.vehicleNumber,
        organizationName: form.organizationName,
      });
      // Update localStorage immediately
      localStorage.setItem("userName", form.name);
      setSaved(true);
      setMessage("✅ Profile saved to database successfully!");
      setTimeout(() => {
        setSaved(false);
        setMessage("");
      }, 4000);
    } catch (err) {
      setMessage(`⚠️ ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "12px",
    marginTop: "8px",
    marginBottom: "20px",
    boxSizing: "border-box",
    border: "1px solid #ccc",
    borderRadius: "6px",
    fontSize: "15px",
  };

  const roleLabel = role === "VOLUNTEER" ? "Volunteer" : role === "DONOR" ? "Donor" : role === "RECEIVER" ? "NGO / Receiver" : role;
  const avatarLetter = (form.name || "U").charAt(0).toUpperCase();

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
          <div className="avatar">{avatarLetter}</div>
          <div className="user-info">
            <strong>{form.name || "User"}</strong>
            <span>{roleLabel}</span>
          </div>
          <Link to="/login">
            <button className="logout-btn" onClick={() => api.logout()}>Logout</button>
          </Link>
        </div>
      </header>

      <nav className="navbar">
        {role === "VOLUNTEER" && <>
          <Link to="/volunteer/dashboard"><button>Dashboard</button></Link>
          <Link to="/volunteer/pickup"><button>Pickup Schedule</button></Link>
          <Link to="/volunteer/delivery"><button>Delivery Status</button></Link>
          <Link to="/volunteer/notifications"><button>Notifications</button></Link>
          <Link to="/volunteer/profile"><button className="active">Profile</button></Link>
          <Link to="/volunteer/settings"><button>Settings</button></Link>
        </>}
        {role === "DONOR" && <>
          <Link to="/donor"><button>Dashboard</button></Link>
          <Link to="/donor/add-food"><button>Add Food</button></Link>
          <Link to="/donor/listings"><button>My Listings</button></Link>
          <Link to="/donor/status"><button>Status</button></Link>
        </>}
        {role === "RECEIVER" && <>
          <Link to="/receiver"><button>Dashboard</button></Link>
          <Link to="/receiver/requests"><button>My Requests</button></Link>
          <Link to="/receiver/history"><button>History</button></Link>
        </>}
      </nav>

      <main className="container">
        <div className="page-heading">
          <h2>My Profile</h2>
          <p>Update your information — changes are saved directly to the database.</p>
        </div>

        {loading ? (
          <p style={{ color: "#64748b", padding: "20px" }}>Loading profile from database...</p>
        ) : (
          <section
            className="food-list-card"
            style={{ display: "block", maxWidth: "700px", marginTop: "25px" }}
          >
            {/* Profile Image */}
            <div style={{ textAlign: "center", marginBottom: "25px" }}>
              <img
                src={profileImage}
                alt="Profile"
                style={{ width: "120px", height: "120px", borderRadius: "50%", objectFit: "cover", border: "3px solid #2E7D32" }}
              />
              <br /><br />
              <input type="file" accept="image/*" onChange={handleImageChange} />
              <p style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>Avatar preview only (upload feature coming soon)</p>
            </div>

            {/* Role Badge */}
            <div style={{ marginBottom: "20px", textAlign: "center" }}>
              <span style={{ background: "#ecfdf5", color: "#065f46", padding: "4px 16px", borderRadius: "20px", fontWeight: "600", fontSize: "14px" }}>
                🎯 Role: {roleLabel}
              </span>
            </div>

            <label><strong>Full Name *</strong></label>
            <input type="text" value={form.name} onChange={handleChange("name")} style={inputStyle} placeholder="Your full name" />

            <label><strong>Email</strong> <span style={{ color: "#94a3b8", fontSize: "13px" }}>(cannot be changed)</span></label>
            <input type="email" value={form.email} style={{ ...inputStyle, background: "#f8fafc", cursor: "not-allowed" }} readOnly />

            <label><strong>Phone</strong></label>
            <input type="text" value={form.phone} onChange={handleChange("phone")} style={inputStyle} placeholder="10-digit phone number" />

            <label><strong>Address / Area</strong></label>
            <input type="text" value={form.address} onChange={handleChange("address")} style={inputStyle} placeholder="Street address or area" />

            <label><strong>City</strong></label>
            <input type="text" value={form.city} onChange={handleChange("city")} style={inputStyle} placeholder="City" />

            {/* Volunteer-specific fields */}
            {role === "VOLUNTEER" && (
              <>
                <label><strong>Vehicle Type</strong></label>
                <select value={form.vehicleType} onChange={handleChange("vehicleType")} style={inputStyle}>
                  <option value="">Select vehicle</option>
                  <option value="MOTORCYCLE">🏍️ Motorcycle</option>
                  <option value="CAR">🚗 Car</option>
                  <option value="BICYCLE">🚲 Bicycle</option>
                  <option value="VAN">🚐 Van</option>
                  <option value="WALK">🚶 On Foot</option>
                </select>

                <label><strong>Vehicle Number</strong></label>
                <input type="text" value={form.vehicleNumber} onChange={handleChange("vehicleNumber")} style={inputStyle} placeholder="e.g. MH-12-AB-1234" />
              </>
            )}

            {/* Donor/Receiver organization field */}
            {(role === "DONOR" || role === "RECEIVER") && (
              <>
                <label><strong>Organization Name</strong></label>
                <input type="text" value={form.organizationName} onChange={handleChange("organizationName")} style={inputStyle} placeholder="Restaurant, NGO, or shelter name" />
              </>
            )}

            <button className="primary-btn" onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "💾 Save Profile to Database"}
            </button>

            {message && (
              <div
                className="success-message"
                style={{
                  marginTop: "15px",
                  background: message.includes("✅") ? "#ecfdf5" : "#fffbeb",
                  color: message.includes("✅") ? "#065f46" : "#92400e",
                  border: "1px solid currentColor",
                  padding: "12px",
                  borderRadius: "6px",
                  fontWeight: "600",
                }}
              >
                {message}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}

export default Profile;