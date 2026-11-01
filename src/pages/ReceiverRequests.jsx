import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import "../App.css";
import "./ReceiverRequests.css";

const STEPS = ["REQUESTED", "DISPATCHED", "IN_TRANSIT", "ARRIVED"];

function formatDate(value) {
  if (!value) return "Pending volunteer acceptance";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Time not available"
    : date.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}

function ReceiverRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const fetchRequests = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      const response = await api.getReceiverRequests();
      setRequests(response.requests || []);
      setError("");
    } catch (requestError) {
      setError(requestError.message || "Unable to load your requests.");
      setRequests([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    const interval = setInterval(() => fetchRequests(), 15000);
    return () => clearInterval(interval);
  }, []);

  const inTransitCount = requests.filter((request) => ["IN_TRANSIT", "ARRIVED"].includes(request.status)).length;
  const assignedCount = requests.filter((request) => request.volunteer_name).length;

  return (
    <div className="app receiver-requests-page">
      <header className="header">
        <div className="brand">
          <div className="brand-icon">🍴</div>
          <div><h1>Food Rescue</h1><p>Community delivery network</p></div>
        </div>
        <div className="user-area">
          <div className="avatar">R</div>
          <div className="user-info"><strong>Receiver workspace</strong><span>Request tracking</span></div>
          <button className="logout-btn" onClick={() => { api.logout(); window.location.assign("/login"); }}>Log out</button>
        </div>
      </header>

      <nav className="navbar" aria-label="Receiver workspace">
        <Link to="/receiver"><button>Browse food</button></Link>
        <Link to="/receiver/requests"><button className="active">My requests</button></Link>
        <Link to="/receiver/history"><button>History</button></Link>
      </nav>

      <main className="container receiver-requests">
        <section className="requests-heading">
          <div>
            <span className="eyebrow">YOUR RESCUE ROUTES</span>
            <h2>Requests, in motion.</h2>
            <p>See who accepted each request, when it was accepted, and when the food is expected.</p>
          </div>
          <div className="requests-heading__actions">
            <button className="outline-btn" onClick={() => fetchRequests(true)} disabled={refreshing}>
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
            <Link to="/receiver"><button className="primary-btn">Find food</button></Link>
          </div>
        </section>

        <section className="request-metrics" aria-label="Request summary">
          <div><span>Open requests</span><strong>{requests.length}</strong></div>
          <div><span>Volunteer accepted</span><strong>{assignedCount}</strong></div>
          <div><span>On the way</span><strong>{inTransitCount}</strong></div>
        </section>

        {error && <div className="request-alert" role="alert">{error} <Link to="/login">Sign in again</Link></div>}
        {loading ? (
          <div className="request-empty">Loading your requests…</div>
        ) : requests.length === 0 ? (
          <section className="request-empty">
            <span className="request-empty__index">00 / NO ACTIVE ROUTES</span>
            <h3>Your next rescue starts here.</h3>
            <p>When you request a listing, it will appear here immediately, then update as a volunteer accepts and carries it to you.</p>
            <Link to="/receiver"><button className="primary-btn">Browse available food</button></Link>
          </section>
        ) : (
          <section className="request-list" aria-label="Active food requests">
            {requests.map((request) => {
              const activeStep = Math.max(0, STEPS.indexOf(request.status));
              const statusLabel = request.status.replaceAll("_", " ").toLowerCase();
              return (
                <article className="request-card" key={request.id}>
                  <div className="request-card__top">
                    <div>
                      <span className="request-card__eyebrow">{request.food_type || "FOOD RESCUE"} · {request.quantity_display}</span>
                      <h3>{request.food_name}</h3>
                      <p>{request.pickup_location}</p>
                    </div>
                    <span className={`request-status request-status--${request.status.toLowerCase()}`}>{statusLabel}</span>
                  </div>

                  <div className="request-progress" aria-label={`Request status: ${statusLabel}`}>
                    {STEPS.map((step, index) => (
                      <div key={step} className={`request-progress__step ${index <= activeStep ? "is-complete" : ""}`}>
                        <span>{index < activeStep ? "✓" : `0${index + 1}`}</span>
                        <small>{step.replaceAll("_", " ")}</small>
                      </div>
                    ))}
                  </div>

                  <div className="request-details">
                    <div><span>Requested</span><strong>{formatDate(request.requested_at)}</strong></div>
                    <div><span>Accepted by</span><strong>{request.volunteer_name || "Waiting for a volunteer"}</strong></div>
                    <div><span>Accepted at</span><strong>{formatDate(request.accepted_at)}</strong></div>
                    <div><span>Estimated arrival</span><strong>{formatDate(request.estimated_delivery_at)}</strong></div>
                    <div><span>Food donor</span><strong>{request.donor_organization || request.donor_name}</strong></div>
                    <div><span>Pickup location</span><strong>{request.pickup_location}</strong></div>
                  </div>

                  {request.delivery_id && request.otp_code && (
                    <div className="request-otp">
                      <div><b>Handoff code</b><span>Share this with the volunteer when the food arrives.</span></div>
                      <strong aria-label="Handoff code">{request.otp_code}</strong>
                    </div>
                  )}
                </article>
              );
            })}
          </section>
        )}
      </main>
    </div>
  );
}

export default ReceiverRequests;