import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import "./Auth.css";

export default function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
    role: "volunteer",
  });

  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Update form fields
  const update = (key) => (e) => {
    setForm((f) => ({
      ...f,
      [key]: e.target.value,
    }));

    // Clear field error
    setErrors((prev) => ({
      ...prev,
      [key]: "",
    }));

    // Clear message
    setMessage("");
  };

  // Validate login form
  const validate = () => {
    const next = {};

    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) {
      next.email = "Enter a valid email address.";
    }

    if (form.password.length < 6) {
      next.password = "Password must be at least 6 characters.";
    }

    if (!form.role) {
      next.role = "Please select a role.";
    }

    setErrors(next);

    return Object.keys(next).length === 0;
  };

  // Login submit
  const onSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!validate()) {
      return;
    }

    setSubmitting(true);

    try {
      const res = await api.login({
        email: form.email.trim(),
        password: form.password,
        role: form.role,
      });

      setSubmitting(false);

      // Redirect according to user role
      const roleTarget = res.user.role.toUpperCase();
      if (roleTarget === "DONOR") {
        navigate("/donor");
      } else if (roleTarget === "RECEIVER") {
        navigate("/receiver");
      } else if (roleTarget === "VOLUNTEER") {
        navigate("/volunteer");
      } else if (roleTarget === "ADMIN") {
        navigate("/admin");
      } else {
        navigate("/donor");
      }
    } catch (err) {
      setSubmitting(false);
      setMessage(`⚠️ ${err.message}`);
    }
  };

  const handleQuickLogin = async (roleType, email, pwd) => {
    setMessage(`Logging in as ${roleType}...`);
    try {
      const res = await api.login({ email, password: pwd, role: roleType });
      const roleTarget = res.user.role.toUpperCase();
      if (roleTarget === "DONOR") navigate("/donor");
      else if (roleTarget === "RECEIVER") navigate("/receiver");
      else if (roleTarget === "VOLUNTEER") navigate("/volunteer");
      else if (roleTarget === "ADMIN") navigate("/admin");
      else navigate("/donor");
    } catch (err) {
      setMessage(`⚠️ ${err.message}`);
    }
  };

  return (
    <div className="fr-auth">

      {/* =========================================
          LEFT SIDE
      ========================================= */}

      <aside className="fr-auth__panel">

        {/* BRAND */}
        <div className="fr-auth__brand">

          <span className="fr-nav__word">
            🍴 Food<em>Rescue</em>
          </span>

        </div>

        {/* QUOTE */}
        <div className="fr-auth__quote">
          <h2>"Together we can rescue food and reduce waste."</h2>

          <p>
            Connect donors, receivers and volunteers to make sure good food
            reaches people who need it.
          </p>
        </div>

        {/* STATISTICS */}
        <div className="fr-auth__ticker">
          <div><b>18,400 kg</b>rescued</div>
          <div><b>256</b>kitchens</div>
          <div><b>92</b>shelters</div>
        </div>

      </aside>

      {/* =========================================
          RIGHT SIDE
      ========================================= */}

      <div className="fr-auth__formSide">

        <div className="fr-auth__box">

          {/* TITLE */}
          <h1>Welcome back</h1>

          <p className="fr-auth__lede">
            Sign in to continue your food rescue work.
          </p>

          <div className="fr-demo">
            <div className="fr-demo__label">Try a demo workspace <span>Password: password123</span></div>
            <div className="fr-demo__grid">
              <button
                type="button"
                onClick={() => handleQuickLogin("donor", "donor@foodbridge.org", "password123")}
                className="fr-demo__button"
                disabled={submitting}
              >
                <span>01</span><strong>Donor</strong><small>List surplus food</small>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin("volunteer", "volunteer@foodbridge.org", "password123")}
                className="fr-demo__button"
                disabled={submitting}
              >
                <span>02</span><strong>Volunteer</strong><small>Rescue &amp; deliver</small>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin("receiver", "receiver@foodbridge.org", "password123")}
                className="fr-demo__button"
                disabled={submitting}
              >
                <span>03</span><strong>Receiver</strong><small>Request food</small>
              </button>
            </div>
          </div>

          {/* =====================================
              LOGIN FORM
          ===================================== */}

          <form onSubmit={onSubmit} noValidate>

            {/* ROLE */}
            <div
              className={`fr-field ${
                errors.role ? "fr-field--error" : ""
              }`}
            >

              <label htmlFor="role">
                Login as
              </label>

              <select
                id="role"
                value={form.role}
                onChange={update("role")}
              >

                <option value="donor">
                  🍱 Donor
                </option>

                <option value="ngo">
                  🏠 NGO / Shelter
                </option>

                <option value="volunteer">
                  🚚 Volunteer
                </option>

                <option value="admin">
                  🛡️ Platform administrator
                </option>

              </select>

              {errors.role && (
                <p className="fr-field__err">
                  {errors.role}
                </p>
              )}

            </div>

            {/* EMAIL */}
            <div
              className={`fr-field ${
                errors.email ? "fr-field--error" : ""
              }`}
            >

              <label htmlFor="login-email">
                Email
              </label>

              <input
                id="login-email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={update("email")}
              />

              {errors.email && (
                <p className="fr-field__err">
                  {errors.email}
                </p>
              )}

            </div>

            {/* PASSWORD */}
            <div
              className={`fr-field ${
                errors.password ? "fr-field--error" : ""
              }`}
            >

              <div className="fr-field__row">

                <label htmlFor="login-password">
                  Password
                </label>

              </div>

              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={form.password}
                onChange={update("password")}
              />

              {errors.password && (
                <p className="fr-field__err">
                  {errors.password}
                </p>
              )}

            </div>

            {/* LOGIN BUTTON */}
            <button
              type="submit"
              className="fr-btn fr-btn--primary fr-auth__submit"
              disabled={submitting}
            >

              {submitting
                ? "Logging in..."
                : "Log in"}

            </button>

            {/* MESSAGE BELOW LOGIN BUTTON */}
            {message && (
              <p
                style={{
                  marginTop: "15px",
                  textAlign: "center",
                  fontWeight: "600",
                  fontSize: "14px",
                  color: "#d97706",
                }}
              >
                {message}
              </p>
            )}

          </form>

          {/* SIGNUP LINK */}
          <p className="fr-auth__switch">

            New to Food Rescue?{" "}

            <Link
              to="/signup"
              className="fr-link"
            >
              Create an account
            </Link>

          </p>

        </div>

      </div>

    </div>
  );
}