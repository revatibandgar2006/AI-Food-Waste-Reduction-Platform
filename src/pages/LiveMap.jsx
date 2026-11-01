
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import { api } from "../services/api";
import "leaflet/dist/leaflet.css";
import "./Home.css";

// Default map center: Pune. Donation markers use saved database coordinates.
const PUNE_CENTER = [18.5204, 73.8567];

// Custom markers that work with Vite without separate image files.
function createFoodIcon(urgency) {
  const color =
    urgency === "CRITICAL" || urgency === "HIGH"
      ? "#ef4444"
      : urgency === "NORMAL"
        ? "#059669"
        : "#2563eb";

  return L.divIcon({
    className: "food-map-marker",
    html: `
      <div style="
        width: 34px;
        height: 34px;
        background: ${color};
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 10px rgba(0,0,0,.35);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 17px;
      ">🍱</div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -17],
  });
}

// Move the map to the selected donation.
function MapFocus({ donation }) {
  const map = useMap();

  useEffect(() => {
    if (!donation) return;

    const lat = Number(donation.latitude);
    const lng = Number(donation.longitude);

    if (
      Number.isFinite(lat) &&
      Number.isFinite(lng) &&
      Math.abs(lat) <= 90 &&
      Math.abs(lng) <= 180
    ) {
      map.flyTo([lat, lng], 15, { duration: 0.8 });
    }
  }, [donation, map]);

  return null;
}

function hasCoordinates(donation) {
  if (
    donation.latitude === null ||
    donation.latitude === undefined ||
    donation.latitude === "" ||
    donation.longitude === null ||
    donation.longitude === undefined ||
    donation.longitude === ""
  ) {
    return false;
  }

  const lat = Number(donation.latitude);
  const lng = Number(donation.longitude);

  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lng) <= 180 &&
    (lat !== 0 || lng !== 0)
  );
}

function formatQuantity(donation) {
  return (
    donation.quantity_display ||
    (donation.quantity_kg != null
      ? `${donation.quantity_kg} kg`
      : "Quantity not specified")
  );
}

export default function LiveMap() {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("ALL");
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [dispatchMsg, setDispatchMsg] = useState("");
  const [claiming, setClaiming] = useState(false);

  const fetchLiveDonations = async () => {
    try {
      setLoadError("");

      const response = await api.getDonations();
      const rows = Array.isArray(response.donations)
        ? response.donations
        : [];

      setDonations(rows);

      setSelectedDonation((current) => {
        if (!rows.length) return null;

        if (current) {
          const stillExists = rows.find(
            (item) => String(item.id) === String(current.id)
          );

          if (stillExists) return stillExists;
        }

        return rows.find(hasCoordinates) || rows[0];
      });
    } catch (error) {
      setLoadError(
        error.message ||
          "Could not load donations. Check that the backend and database are running."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveDonations();

    const interval = setInterval(fetchLiveDonations, 15000);
    return () => clearInterval(interval);
  }, []);

  const filteredDonations = useMemo(() => {
    return donations.filter((donation) => {
      if (selectedFilter === "ALL") return true;

      if (selectedFilter === "CRITICAL") {
        return ["CRITICAL", "HIGH"].includes(
          String(donation.urgency_level || "").toUpperCase()
        );
      }

      return String(donation.food_type || "")
        .toLowerCase()
        .includes(selectedFilter.toLowerCase());
    });
  }, [donations, selectedFilter]);

  const mappedDonations = useMemo(
    () => filteredDonations.filter(hasCoordinates),
    [filteredDonations]
  );

  const missingCoordinates = filteredDonations.length - mappedDonations.length;

  const mapCenter = selectedDonation && hasCoordinates(selectedDonation)
    ? [
        Number(selectedDonation.latitude),
        Number(selectedDonation.longitude),
      ]
    : mappedDonations.length
      ? [
          Number(mappedDonations[0].latitude),
          Number(mappedDonations[0].longitude),
        ]
      : PUNE_CENTER;

  const handleClaim = async (donation) => {
    try {
      setClaiming(true);
      setDispatchMsg("");

      await api.claimPickup(donation.id);

      setDispatchMsg(
        `Pickup request submitted for ${donation.food_name}.`
      );

      await fetchLiveDonations();
    } catch (error) {
      setDispatchMsg(
        error.message ||
          "Unable to claim this pickup. Sign in with a volunteer account and try again."
      );
    } finally {
      setClaiming(false);
    }
  };

  const filters = [
    { label: "All", value: "ALL" },
    { label: "Urgent / Critical", value: "CRITICAL" },
    { label: "Cooked", value: "Cooked" },
    { label: "Vegetables", value: "Vegetables" },
    { label: "Bread", value: "Bread" },
  ];

  return (
    <div
      style={{
        background: "#f8fafc",
        minHeight: "90vh",
        paddingBottom: 48,
      }}
    >
      {/* Page heading */}
      <header
        style={{
          background: "linear-gradient(135deg, #064e3b, #0f172a)",
          color: "white",
          padding: "32px 24px",
        }}
      >
        <div style={{ maxWidth: 1300, margin: "0 auto" }}>
          <div
            style={{
              color: "#6ee7b7",
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: 1,
              marginBottom: 10,
            }}
          >
            LIVE FOOD RESCUE MAP
          </div>

          <h1 style={{ margin: "0 0 10px", fontSize: 32 }}>
            Food Donation Locations
          </h1>

          <p
            style={{
              color: "#cbd5e1",
              maxWidth: 750,
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            Explore available food donations on a real geographic map.
            Select a marker to view its details and pickup location.
          </p>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 12,
              marginTop: 22,
            }}
          >
            {[
              ["Active listings", donations.length],
              ["Shown on map", mappedDonations.length],
              ["Urgent listings", donations.filter((d) =>
                ["HIGH", "CRITICAL"].includes(
                  String(d.urgency_level || "").toUpperCase()
                )
              ).length],
            ].map(([label, value]) => (
              <div
                key={label}
                style={{
                  background: "rgba(255,255,255,.08)",
                  border: "1px solid rgba(255,255,255,.15)",
                  borderRadius: 8,
                  padding: "12px 18px",
                  minWidth: 120,
                }}
              >
                <div style={{ color: "#cbd5e1", fontSize: 12 }}>
                  {label}
                </div>
                <strong style={{ fontSize: 22 }}>{value}</strong>
              </div>
            ))}
          </div>
        </div>
      </header>

      <main
        style={{
          maxWidth: 1300,
          margin: "24px auto",
          padding: "0 20px",
        }}
      >
        {/* Filters */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexWrap: "wrap",
            marginBottom: 18,
          }}
        >
          <strong style={{ color: "#334155", fontSize: 14 }}>
            Filter:
          </strong>

          {filters.map((filter) => {
            const active = selectedFilter === filter.value;

            return (
              <button
                key={filter.value}
                onClick={() => setSelectedFilter(filter.value)}
                style={{
                  border: `1px solid ${active ? "#059669" : "#cbd5e1"}`,
                  background: active ? "#059669" : "white",
                  color: active ? "white" : "#334155",
                  borderRadius: 999,
                  padding: "9px 14px",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                {filter.label}
              </button>
            );
          })}

          <button
            onClick={fetchLiveDonations}
            style={{
              marginLeft: "auto",
              border: "1px solid #cbd5e1",
              background: "white",
              borderRadius: 7,
              padding: "9px 14px",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            ↻ Refresh
          </button>
        </div>

        {loadError && (
          <div
            role="alert"
            style={{
              background: "#fef2f2",
              color: "#991b1b",
              border: "1px solid #fecaca",
              borderRadius: 8,
              padding: 14,
              marginBottom: 16,
            }}
          >
            {loadError}
          </div>
        )}

        {dispatchMsg && (
          <div
            role="status"
            style={{
              background: "#ecfdf5",
              color: "#065f46",
              border: "1px solid #a7f3d0",
              borderRadius: 8,
              padding: 14,
              marginBottom: 16,
            }}
          >
            {dispatchMsg}
          </div>
        )}

        {missingCoordinates > 0 && (
          <div
            style={{
              background: "#fffbeb",
              color: "#92400e",
              border: "1px solid #fde68a",
              borderRadius: 8,
              padding: 12,
              marginBottom: 16,
              fontSize: 14,
            }}
          >
            {missingCoordinates} donation(s) do not have valid GPS
            coordinates and cannot be placed accurately on the map.
            Their location must be saved when the donation is created.
          </div>
        )}

        {/* Real map and selected donation */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.5fr) minmax(280px, 1fr)",
            gap: 20,
            alignItems: "start",
          }}
        >
          <section
            style={{
              background: "white",
              padding: 14,
              borderRadius: 14,
              border: "1px solid #e2e8f0",
              boxShadow: "0 4px 15px rgba(15,23,42,.06)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 10,
                flexWrap: "wrap",
                marginBottom: 12,
              }}
            >
              <strong style={{ color: "#0f172a" }}>
                OpenStreetMap · Real GPS coordinates
              </strong>

              <span style={{ fontSize: 12, color: "#64748b" }}>
                {mappedDonations.length} map marker(s)
              </span>
            </div>

            <div
              style={{
                height: 540,
                width: "100%",
                overflow: "hidden",
                borderRadius: 10,
                background: "#e2e8f0",
              }}
            >
              <MapContainer
                center={mapCenter}
                zoom={12}
                scrollWheelZoom
                style={{ height: "100%", width: "100%" }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <MapFocus donation={selectedDonation} />

                {mappedDonations.map((donation) => (
                  <Marker
                    key={donation.id}
                    position={[
                      Number(donation.latitude),
                      Number(donation.longitude),
                    ]}
                    icon={createFoodIcon(
                      String(donation.urgency_level || "").toUpperCase()
                    )}
                    eventHandlers={{
                      click: () => setSelectedDonation(donation),
                    }}
                  >
                    <Popup>
                      <div style={{ minWidth: 180 }}>
                        <strong>
                          {donation.food_name || "Food donation"}
                        </strong>
                        <p style={{ margin: "6px 0" }}>
                          {donation.pickup_location || "Address not provided"}
                        </p>
                        <p style={{ margin: "6px 0" }}>
                          Quantity: {formatQuantity(donation)}
                        </p>
                        <button
                          onClick={() => setSelectedDonation(donation)}
                          style={{
                            border: 0,
                            background: "#059669",
                            color: "white",
                            padding: "7px 10px",
                            borderRadius: 5,
                            cursor: "pointer",
                          }}
                        >
                          View details
                        </button>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>

            <div
              style={{
                display: "flex",
                gap: 16,
                flexWrap: "wrap",
                marginTop: 12,
                fontSize: 12,
                color: "#475569",
              }}
            >
              <span>🔴 High / critical urgency</span>
              <span>🟢 Normal urgency</span>
              <span>🔵 Other urgency</span>
            </div>

            {!loading && mappedDonations.length === 0 && (
              <p style={{ color: "#64748b", lineHeight: 1.6 }}>
                No donations with valid coordinates match this filter.
                The map is centered on Pune until valid donation coordinates
                are available.
              </p>
            )}
          </section>

          {/* Selected donation details */}
          <aside
            style={{
              background: "white",
              border: "1px solid #e2e8f0",
              borderRadius: 14,
              padding: 22,
              boxShadow: "0 4px 15px rgba(15,23,42,.06)",
            }}
          >
            <h2
              style={{
                fontSize: 20,
                color: "#0f172a",
                margin: "0 0 18px",
              }}
            >
              Donation Details
            </h2>

            {loading ? (
              <p>Loading donations from the database...</p>
            ) : !selectedDonation ? (
              <p style={{ color: "#64748b", lineHeight: 1.6 }}>
                No donations found. Add a donation or refresh the map.
              </p>
            ) : (
              <>
                <div
                  style={{
                    display: "inline-block",
                    background: "#ecfdf5",
                    color: "#047857",
                    borderRadius: 6,
                    padding: "6px 9px",
                    fontSize: 12,
                    fontWeight: 700,
                    marginBottom: 12,
                  }}
                >
                  {selectedDonation.urgency_level || "NORMAL"} URGENCY
                </div>

                <h3
                  style={{
                    fontSize: 24,
                    margin: "0 0 12px",
                    color: "#0f172a",
                    overflowWrap: "anywhere",
                  }}
                >
                  {selectedDonation.food_name}
                </h3>

                <p style={{ color: "#475569", lineHeight: 1.6 }}>
                  📍 {selectedDonation.pickup_location ||
                    "Pickup address not provided"}
                </p>

                <div
                  style={{
                    border: "1px solid #e2e8f0",
                    borderRadius: 10,
                    padding: 14,
                    margin: "16px 0",
                    lineHeight: 2,
                    fontSize: 14,
                  }}
                >
                  <div>
                    <strong>Food type:</strong>{" "}
                    {selectedDonation.food_type || "Not specified"}
                  </div>
                  <div>
                    <strong>Quantity:</strong>{" "}
                    {formatQuantity(selectedDonation)}
                  </div>
                  <div>
                    <strong>Status:</strong>{" "}
                    {selectedDonation.status || "AVAILABLE"}
                  </div>
                  <div>
                    <strong>Freshness score:</strong>{" "}
                    {selectedDonation.freshness_score != null
                      ? `${selectedDonation.freshness_score}%`
                      : "Not available"}
                  </div>
                  <div>
                    <strong>Spoilage risk:</strong>{" "}
                    {selectedDonation.spoilage_risk || "Not available"}
                  </div>
                  <div>
                    <strong>Storage:</strong>{" "}
                    {selectedDonation.storage_type || "Not specified"}
                  </div>

                  {hasCoordinates(selectedDonation) ? (
                    <div>
                      <strong>GPS:</strong>{" "}
                      {Number(selectedDonation.latitude).toFixed(6)},{" "}
                      {Number(selectedDonation.longitude).toFixed(6)}
                    </div>
                  ) : (
                    <div style={{ color: "#b45309" }}>
                      <strong>GPS:</strong> Coordinates not saved
                    </div>
                  )}
                </div>

                {selectedDonation.ai_recommendation && (
                  <p
                    style={{
                      color: "#475569",
                      fontSize: 13,
                      lineHeight: 1.6,
                    }}
                  >
                    💡 {selectedDonation.ai_recommendation}
                  </p>
                )}

                {hasCoordinates(selectedDonation) && (
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${Number(
                      selectedDonation.latitude
                    )},${Number(selectedDonation.longitude)}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: "block",
                      textAlign: "center",
                      textDecoration: "none",
                      border: "1px solid #059669",
                      color: "#047857",
                      padding: 12,
                      borderRadius: 8,
                      marginTop: 14,
                      fontWeight: 700,
                    }}
                  >
                    Open directions in Google Maps
                  </a>
                )}

                <button
                  onClick={() => handleClaim(selectedDonation)}
                  disabled={
                    claiming ||
                    !["AVAILABLE"].includes(
                      String(selectedDonation.status || "").toUpperCase()
                    )
                  }
                  style={{
                    width: "100%",
                    border: 0,
                    borderRadius: 8,
                    padding: 13,
                    marginTop: 12,
                    background:
                      claiming ||
                      String(selectedDonation.status || "").toUpperCase() !==
                        "AVAILABLE"
                        ? "#94a3b8"
                        : "#059669",
                    color: "white",
                    fontWeight: 700,
                    cursor: claiming ? "wait" : "pointer",
                  }}
                >
                  {claiming ? "Submitting..." : "Claim Pickup"}
                </button>

                <Link
                  to="/"
                  style={{
                    display: "block",
                    textAlign: "center",
                    marginTop: 16,
                    color: "#047857",
                    textDecoration: "none",
                    fontWeight: 600,
                  }}
                >
                  Back to Home
                </Link>
              </>
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}
