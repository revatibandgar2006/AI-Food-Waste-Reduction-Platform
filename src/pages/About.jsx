import { Link } from "react-router-dom";
import "./About.css";

const VALUES = [
  {
    title: "Speed over scale",
    body: "Cooked food has a window of a few hours. We optimize every screen for how fast a pickup can be assigned and confirmed, not for how many features we can show.",
  },
  {
    title: "Nobody pays",
    body: "Donors give for free, NGOs receive for free. The platform is funded by grants and volunteer time, not by fees on either side of a rescue.",
  },
  {
    title: "Dignity, not leftovers",
    body: "Food listed on Food Rescue meets the same handling and freshness standard the kitchen would serve to a paying guest.",
  },
];

const TEAM = [
  { role: "Authentication & Public Pages", focus: "Home, login, signup, about, contact" },
  { role: "Donor Module", focus: "Donor dashboard, listings, edit & status" },
  { role: "NGO / Receiver Module", focus: "Receiver dashboard, requests, history" },
  { role: "Volunteer & Shared Features", focus: "Volunteer dashboard, profile, notifications, maps" },
];

export default function About() {
  return (
    <>
      <section className="fr-section fr-about-hero">
        <div className="fr-container fr-about-hero__inner">
          <span className="fr-eyebrow">Our story</span>
          <h1>We built the bridge that was missing.</h1>
          <p>
            Every day, kitchens throw away food that's still good, while
            shelters a few kilometres away go without. The gap was never a
            lack of food or a lack of people willing to help — it was a lack
            of a fast, simple way to connect the two. Food Rescue is that
            connection.
          </p>
        </div>
      </section>

      <section className="fr-section fr-about-mission">
        <div className="fr-container fr-about-mission__grid">
          <div>
            <span className="fr-eyebrow">Mission</span>
            <h2>Keep good food moving toward people, not landfills.</h2>
            <p>
              We're a routing layer between three groups who already want to
              help each other: kitchens with surplus, volunteers with a
              little spare time, and shelters that feed people every day. Our
              job is to make the handoff between them take minutes, not
              phone calls and guesswork.
            </p>
            <p>
              What started as a student project to fight everyday food waste
              is built the way a real rescue operation needs to run — fast,
              trackable, and honest about where every meal ends up.
            </p>
            <Link to="/signup" className="fr-btn fr-btn--primary">Join as a partner</Link>
          </div>
          <ul className="fr-about-values">
            {VALUES.map((v) => (
              <li key={v.title} className="fr-card fr-about-values__item">
                <h3>{v.title}</h3>
                <p>{v.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="fr-section fr-about-flow">
        <div className="fr-container">
          <div className="fr-section__head">
            <span className="fr-eyebrow">Inside the platform</span>
            <h2>One dashboard for every role</h2>
          </div>
          <div className="fr-about-flow__grid">
            <div className="fr-card fr-about-flow__card">
              <h3>Donors</h3>
              <p>List surplus in under a minute, track pickup status, and see the shelters your food reached.</p>
            </div>
            <div className="fr-card fr-about-flow__card">
              <h3>Volunteers</h3>
              <p>See assigned pickups, confirm quantities, mark deliveries in transit, and watch your total food saved grow.</p>
            </div>
            <div className="fr-card fr-about-flow__card">
              <h3>NGOs &amp; shelters</h3>
              <p>Browse available food nearby, request what you need, and keep a history of every delivery received.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="fr-section fr-about-team">
        <div className="fr-container">
          <div className="fr-section__head">
            <span className="fr-eyebrow">Built by four people</span>
            <h2>How the project came together</h2>
          </div>
          <div className="fr-about-team__grid">
            {TEAM.map((t, i) => (
              <div key={t.role} className="fr-about-team__item">
                <span className="fr-how__n">{`0${i + 1}`}</span>
                <h4>{t.role}</h4>
                <p>{t.focus}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
