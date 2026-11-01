import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import "./Home.css";

const STEPS = [
  {
    n: "01",
    title: "A kitchen lists what's left over",
    body: "Restaurants, hostel messes, and event caterers log surplus food the moment it's ready — what it is, how much, and by when it should move.",
  },
  {
    n: "02",
    title: "A volunteer picks up the route",
    body: "The nearest available volunteer gets the pickup, confirms quantity at the door, and marks the delivery in transit for full visibility.",
  },
  {
    n: "03",
    title: "A shelter serves it the same day",
    body: "Old-age homes, shelters, and community kitchens receive the food while it's still good, and confirm the delivery to close the loop.",
  },
];

const DEFAULT_STATS = [
  { target: 0, suffix: " kg", label: "Food delivered to communities" },
  { target: 0, suffix: "", label: "Donor kitchens in the network" },
  { target: 0, suffix: "", label: "Active rescue volunteers" },
  { target: 0, suffix: "", label: "Community receiver partners" },
];

function RescueRoute() {
  return (
    <div className="fr-route" role="img" aria-label="A food pickup travels from a kitchen, to a volunteer, to a shelter">
      <svg className="fr-route__svg" viewBox="0 0 640 200" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path id="fr-route-path" d="M70 150 C 160 150, 160 60, 250 60 S 380 150, 470 150 S 560 60, 590 60"
          stroke="var(--line)" strokeWidth="3" strokeDasharray="2 12" strokeLinecap="round" />
        <circle className="fr-route__dot" r="7" fill="var(--harvest)">
          <animateMotion dur="6s" repeatCount="indefinite" rotate="auto">
            <mpath href="#fr-route-path" />
          </animateMotion>
        </circle>
      </svg>

      <div className="fr-route__node" style={{ left: "6%", top: "62%" }}>
        <span className="fr-route__icon fr-route__icon--forest">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M6 2v9a2 2 0 0 0 2 2v9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M4 2v6a1.5 1.5 0 0 0 3 0V2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M8 2v6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M17 2c-2.6 0.9-4.2 3.6-4.2 6.8 0 2.5 1.3 4 3 4.4v9.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </span>
        <p><strong>Hotel Taj</strong><br />12 kg veg biryani, ready</p>
      </div>

      <div className="fr-route__node" style={{ left: "38%", top: "20%" }}>
        <span className="fr-route__icon fr-route__icon--gold">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><rect x="2" y="8" width="12" height="8" rx="1.4" stroke="currentColor" strokeWidth="1.8"/><path d="M14 11h3.5L20 14v2h-6" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><circle cx="6.5" cy="18" r="1.6" stroke="currentColor" strokeWidth="1.8"/><circle cx="16.5" cy="18" r="1.6" stroke="currentColor" strokeWidth="1.8"/></svg>
        </span>
        <p><strong>Revati, Volunteer</strong><br />En route · 8 min away</p>
      </div>

      <div className="fr-route__node" style={{ left: "88%", top: "62%" }}>
        <span className="fr-route__icon fr-route__icon--clay">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M3 11l9-7 9 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M5 10v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M12 20v-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
        </span>
        <p><strong>Hope Shelter</strong><br />Waiting on today's delivery</p>
      </div>
    </div>
  );
}

export default function Home() {
  const [stats, setStats] = useState(DEFAULT_STATS);

  useEffect(() => {
    api.getPlatformAnalytics()
      .then((res) => {
        if (res.data) {
          const d = res.data;
          setStats([
            { target: Math.round(Number(d.foodSavedKg) || 0), suffix: " kg", label: "Food delivered to communities" },
            { target: Number(d.activeDonors) || 0, suffix: "", label: "Donor kitchens in the network" },
            { target: Number(d.activeVolunteers) || 0, suffix: "", label: "Active rescue volunteers" },
            { target: Number(d.partnerShelters) || 0, suffix: "", label: "Community receiver partners" },
          ]);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <>
      <section className="fr-hero">
        <div className="fr-container fr-hero__grid">
          <div className="fr-hero__copy">
            <span className="fr-eyebrow">Live in Pune &amp; growing</span>
            <h1 className="fr-hero__title">
              Good food doesn't belong in a bin. It belongs on a plate.
            </h1>
            <p className="fr-hero__sub">
              Food Rescue connects kitchens with surplus to give, volunteers who
              can carry it across town, and shelters ready to serve it — usually
              within the hour.
            </p>
            <div className="fr-hero__ctas">
              <Link to="/signup" className="fr-btn fr-btn--primary">I have food to give</Link>
              <Link to="/signup" className="fr-btn fr-btn--ghost">I want to volunteer</Link>
            </div>
            <p className="fr-hero__note">No fee to donate. No fee to receive. Ever.</p>
          </div>
          <div className="fr-hero__visual">
            <RescueRoute />
          </div>
        </div>
      </section>

      <section className="fr-section fr-how">
        <div className="fr-container">
          <div className="fr-section__head">
            <span className="fr-eyebrow">How a rescue happens</span>
            <h2>Three steps, one afternoon</h2>
          </div>
          <ol className="fr-how__list">
            {STEPS.map((s) => (
              <li key={s.n} className="fr-how__item">
                <span className="fr-how__n">{s.n}</span>
                <h3>{s.title}</h3>
                <p>{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="fr-section fr-stats">
        <div className="fr-container fr-stats__grid">
          {stats.map((s) => (
            <StatItem key={s.label} {...s} />
          ))}
        </div>
      </section>

      <section className="fr-section fr-quote">
        <div className="fr-container fr-quote__inner">
          <svg width="40" height="30" viewBox="0 0 40 30" fill="none" className="fr-quote__mark"><path d="M0 30V17.6C0 7.4 6.4 1 15.8 0l1.4 4.6C10.8 6 7.6 9.6 7.4 15h8.4v15H0Zm22 0V17.6C22 7.4 28.4 1 37.8 0l1.4 4.6C32.8 6 29.6 9.6 29.4 15h8.4v15H22Z" fill="var(--harvest)"/></svg>
          <p className="fr-quote__text">
            Before Food Rescue, our leftover kitchen staff had one option after
            large events: the bin. Now a volunteer is usually at our gate before
            the last guest has left.
          </p>
          <p className="fr-quote__by">— Kitchen Manager, community event caterer, Pune</p>
        </div>
      </section>

      <section className="fr-cta">
        <div className="fr-container fr-cta__inner">
          <h2>Have ten minutes and a two-wheeler?</h2>
          <p>That's most of what a rescue takes. Sign up as a volunteer and we'll match you with a pickup near you.</p>
          <Link to="/signup" className="fr-btn fr-btn--light">Become a volunteer</Link>
        </div>
      </section>

      <section className="fr-research-teaser">
        <div className="fr-container fr-research-teaser__inner">
          <div>
            <span className="fr-eyebrow">Research &amp; field notes</span>
            <h2>Better rescue starts with better evidence.</h2>
            <p>Read practical notes on food waste, safe redistribution, and the work happening across the food system.</p>
          </div>
          <Link to="/research" className="fr-btn fr-btn--ghost">Explore the field notes <span aria-hidden="true">→</span></Link>
        </div>
      </section>
    </>
  );
}

function StatItem({ target, suffix, label }) {
  const value = Math.max(0, Math.round(Number(target) || 0));
  return (
    <div className="fr-stat">
      <span className="fr-stat__num">{value.toLocaleString("en-IN")}{suffix}</span>
      <span className="fr-stat__label">{label}</span>
    </div>
  );
}
