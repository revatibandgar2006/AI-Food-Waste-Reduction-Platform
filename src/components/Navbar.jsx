import { useEffect, useState } from "react";
import { NavLink, Link, useLocation } from "react-router-dom";
import "./Navbar.css";

const PUBLIC_LINKS = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/impact", label: "Impact" },
  { to: "/research", label: "Research" },
  { to: "/map", label: "Live map" },
  { to: "/contact", label: "Contact" },
];

const WORKSPACE_PATHS = {
  donor: "/donor",
  volunteer: "/volunteer",
  receiver: "/receiver",
  ngo: "/receiver",
  admin: "/admin",
};

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const session = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  })();
  const roleKey = session?.roleKey || session?.role?.toLowerCase();
  const workspacePath = localStorage.getItem("token") ? WORKSPACE_PATHS[roleKey] : null;
  const links = workspacePath
    ? [...PUBLIC_LINKS, { to: workspacePath, label: "Dashboard" }]
    : PUBLIC_LINKS;
  const logout = () => {
    ["token", "user", "isLoggedIn", "userRole", "userName", "userEmail"].forEach((key) => localStorage.removeItem(key));
    window.location.assign("/");
  };

  useEffect(() => setOpen(false), [location.pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    // close mobile menu on route change / resize back to desktop
    const onResize = () => window.innerWidth > 820 && setOpen(false);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <header className={`fr-nav ${scrolled ? "fr-nav--scrolled" : ""}`}>
      <div className="fr-nav__bar fr-container">
        <Link to="/" className="fr-nav__brand" onClick={() => setOpen(false)}>
          <span className="fr-nav__mark" aria-hidden="true">
            <svg viewBox="0 0 40 40" width="30" height="30">
              <path d="M11 3v14a3 3 0 0 0 3 3v17" stroke="currentColor" strokeWidth="2.4" fill="none" strokeLinecap="round" />
              <path d="M8 3v9a2.5 2.5 0 0 0 5 0V3" stroke="currentColor" strokeWidth="2.4" fill="none" strokeLinecap="round" />
              <path d="M14 3v9" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
              <path d="M29 3c-4.4 1.4-7 5.6-7 11 0 4 2.1 6.4 5 7v16" stroke="currentColor" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span className="fr-nav__word">
            Food<em>Rescue</em>
          </span>
        </Link>

        <nav className="fr-nav__links" aria-label="Primary">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === "/"}
              className={({ isActive }) => "fr-nav__link" + (isActive ? " is-active" : "")}
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="fr-nav__actions">
          {workspacePath ? (
            <button className="fr-nav__login" onClick={logout}>Log out</button>
          ) : (
            <Link to="/login" className="fr-nav__login">Log in</Link>
          )}
          <Link to={workspacePath || "/signup"} className="fr-btn fr-btn--primary fr-nav__cta">
            {workspacePath ? "Dashboard" : "Join the rescue"}
          </Link>
        </div>

        <button
          className={`fr-nav__burger ${open ? "is-open" : ""}`}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span /><span /><span />
        </button>
      </div>

      <div className={`fr-nav__mobile ${open ? "is-open" : ""}`}>
        {links.map((l) => (
          <NavLink key={l.to} to={l.to} end={l.to === "/"} onClick={() => setOpen(false)} className="fr-nav__mobileLink">
            {l.label}
          </NavLink>
        ))}
        <hr />
        {workspacePath ? (
          <>
            <Link to={workspacePath} onClick={() => setOpen(false)} className="fr-btn fr-btn--primary" style={{ marginTop: 8 }}>
              Dashboard
            </Link>
            <button className="fr-nav__mobileLink fr-nav__mobileLogout" onClick={logout}>Log out</button>
          </>
        ) : (
          <>
            <Link to="/login" onClick={() => setOpen(false)} className="fr-nav__mobileLink">Log in</Link>
            <Link to="/signup" onClick={() => setOpen(false)} className="fr-btn fr-btn--primary" style={{ marginTop: 8 }}>
              Join the rescue
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
