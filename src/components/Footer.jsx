import { Link } from "react-router-dom";
import "./Footer.css";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="fr-foot">
      <div className="fr-container fr-foot__grid">
        <div className="fr-foot__brand">
          <div className="fr-nav__word" style={{ color: "var(--cream)" }}>
            Food<em style={{ color: "var(--sprout)" }}>Rescue</em>
          </div>
          <p className="fr-foot__tag">
            Surplus food finds a home, not a bin. We connect kitchens with extra
            to give, volunteers who can carry it, and shelters ready to serve it.
          </p>
          <div className="fr-foot__social" aria-label="Social links">
            <a href="#" aria-label="Instagram" className="fr-foot__icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.8"/><circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8"/><circle cx="17.2" cy="6.8" r="1.1" fill="currentColor"/></svg>
            </a>
            <a href="#" aria-label="Twitter / X" className="fr-foot__icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M4 4l16 16M20 4L4 20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
            </a>
            <a href="#" aria-label="LinkedIn" className="fr-foot__icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.8"/><circle cx="8" cy="8.5" r="1.2" fill="currentColor"/><path d="M8 11.5v6M12 17.5v-3.6c0-1.6 1-2.4 2.2-2.4 1.2 0 1.8.9 1.8 2.4v3.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
            </a>
          </div>
        </div>

        <nav className="fr-foot__col" aria-label="Site">
          <h4>Site</h4>
          <Link to="/">Home</Link>
          <Link to="/about">About</Link>
          <Link to="/research">Research</Link>
          <Link to="/contact">Contact</Link>
        </nav>

        <nav className="fr-foot__col" aria-label="Get involved">
          <h4>Get involved</h4>
          <Link to="/signup">Donate surplus food</Link>
          <Link to="/signup">Volunteer to deliver</Link>
          <Link to="/signup">Register your NGO</Link>
        </nav>

        <div className="fr-foot__col fr-foot__news">
          <h4>Stay in the loop</h4>
          <p style={{ color: "rgba(251,247,238,0.72)", fontSize: 14, marginBottom: 12 }}>
            One short email a month — new partners, cities, and how much food we rescued together.
          </p>
          <form
            className="fr-foot__form"
            onSubmit={(e) => e.preventDefault()}
          >
            <label htmlFor="foot-email" className="fr-visually-hidden">Email address</label>
            <input id="foot-email" type="email" required placeholder="you@example.com" />
            <button type="submit" className="fr-btn fr-btn--primary" style={{ padding: "10px 18px" }}>Subscribe</button>
          </form>
        </div>
      </div>

      <div className="fr-foot__bottom fr-container">
        <span>© {year} Food Rescue. Built to keep good food on plates, not in landfills.</span>
        <span className="fr-foot__legal">
          <a href="#">Privacy</a>
          <a href="#">Terms</a>
        </span>
      </div>
    </footer>
  );
}
