import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import "./Auth.css";

const ROLES = [
  {
    id: "donor",
    label: "Donor",
    hint: "Restaurant, hostel, or event kitchen with surplus food",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path
          d="M6 2v9a2 2 0 0 0 2 2v9"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M4 2v6a1.5 1.5 0 0 0 3 0V2"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M8 2v6"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M17 2c-2.6 0.9-4.2 3.6-4.2 6.8 0 2.5 1.3 4 3 4.4v9.8"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },

  {
    id: "volunteer",
    label: "Volunteer",
    hint: "Pick up and deliver food across your city",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <rect
          x="2"
          y="8"
          width="12"
          height="8"
          rx="1.4"
          stroke="currentColor"
          strokeWidth="1.8"
        />

        <path
          d="M14 11h3.5L20 14v2h-6"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />

        <circle
          cx="6.5"
          cy="18"
          r="1.6"
          stroke="currentColor"
          strokeWidth="1.8"
        />

        <circle
          cx="16.5"
          cy="18"
          r="1.6"
          stroke="currentColor"
          strokeWidth="1.8"
        />
      </svg>
    ),
  },

  {
    id: "ngo",
    label: "NGO / Shelter",
    hint: "Receive food for the people you serve",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path
          d="M3 11l9-7 9 7"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <path
          d="M5 10v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-9"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

export default function Signup() {
  const navigate = useNavigate();

  const [role, setRole] = useState("volunteer");

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirm: "",
    city: "",
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Message displayed below signup button
  const [successMessage, setSuccessMessage] = useState("");

  // Update input values
  const update = (key) => (e) => {
    let value = e.target.value;

    if (key === "phone" && !/^\d*$/.test(value)) {
      setErrors((prev) => ({ ...prev, phone: "Numbers only. Enter a 10-digit phone number." }));
      return;
    }

    if (key === "phone") value = value.slice(0, 10);

    if (key === "city" && !/^\p{L}*(?:\s\p{L}*)*$/u.test(value)) {
      setErrors((prev) => ({ ...prev, city: "Use letters and spaces only." }));
      return;
    }

    setForm((f) => ({
      ...f,
      [key]: value,
    }));

    // Clear field error
    setErrors((prev) => ({
      ...prev,
      [key]: "",
    }));

    // Clear success/error message
    setSuccessMessage("");
  };

  // Form validation
  const validate = () => {
    const next = {};

    if (form.name.trim().length < 2) {
      next.name = "Enter your full name.";
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      next.email = "Enter a valid email address.";
    }

    if (!/^\d{10}$/.test(form.phone)) {
      next.phone = "Enter a 10-digit phone number.";
    }

    if (form.password.length < 6) {
      next.password = "Password must be at least 6 characters.";
    }

    if (form.confirm !== form.password) {
      next.confirm = "Passwords don't match.";
    }

    if (!/^\p{L}+(?:\s\p{L}+)*$/u.test(form.city.trim())) {
      next.city = "Enter a city using letters and spaces only.";
    }

    setErrors(next);

    return Object.keys(next).length === 0;
  };

  // Submit signup form
  const onSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage("");

    if (!validate()) {
      return;
    }

    setSubmitting(true);

    try {
      await api.register({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone,
        password: form.password,
        city: form.city.trim(),
        address: form.city.trim(),
        role: role,
      });

      setSubmitting(false);
      setSuccessMessage(
        `✅ Successfully registered as ${
          ROLES.find((r) => r.id === role).label
        }! Please log in to continue.`
      );

      setForm({
        name: "",
        email: "",
        phone: "",
        password: "",
        confirm: "",
        city: "",
      });

      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (err) {
      setSubmitting(false);
      setSuccessMessage(`⚠️ ${err.message}`);
    }
  };

  return (
    <div className="fr-auth">

      {/* ================= LEFT PANEL ================= */}

      <aside className="fr-auth__panel">

        {/* BRAND */}
        <div className="fr-auth__brand">

          <svg width="26" height="26" viewBox="0 0 40 40">

            <path
              d="M11 3v14a3 3 0 0 0 3 3v17"
              stroke="currentColor"
              strokeWidth="2.4"
              fill="none"
              strokeLinecap="round"
            />

            <path
              d="M8 3v9a2.5 2.5 0 0 0 5 0V3"
              stroke="currentColor"
              strokeWidth="2.4"
              fill="none"
              strokeLinecap="round"
            />

            <path
              d="M14 3v9"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
            />

            <path
              d="M29 3c-4.4 1.4-7 5.6-7 11 0 4 2.1 6.4 5 7v16"
              stroke="currentColor"
              strokeWidth="2.4"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

          </svg>

          <span className="fr-nav__word">
            Food<em>Rescue</em>
          </span>

        </div>

        {/* QUOTE */}
        <div className="fr-auth__quote">
          <h2>Three roles. One chain that keeps food moving instead of rotting.</h2>

          <p>
            Pick the one that's you — you can always help in more than one way
            later.
          </p>
        </div>

        {/* STATISTICS */}
        <div className="fr-auth__ticker">
          <div><b>18,400 kg</b>rescued</div>
          <div><b>256</b>kitchens</div>
          <div><b>92</b>shelters</div>
        </div>

      </aside>

      {/* ================= RIGHT SIDE ================= */}

      <div className="fr-auth__formSide">

        <div className="fr-auth__box">

          <h1>Create your account</h1>

          <p className="fr-auth__lede">
            Join as a donor, volunteer, or receiving NGO.
          </p>

          {/* ================= ROLE SELECTION ================= */}

          <div
            className="fr-roles"
            role="radiogroup"
            aria-label="I am signing up as"
          >

            {ROLES.map((r) => (

              <button
                key={r.id}
                type="button"
                role="radio"
                aria-checked={role === r.id}
                className={`fr-role ${
                  role === r.id ? "is-active" : ""
                }`}
                onClick={() => {
                  setRole(r.id);
                  setSuccessMessage("");
                }}
                title={r.hint}
              >

                {r.icon}

                {r.label}

              </button>

            ))}

          </div>

          {/* ================= FORM ================= */}

          <form onSubmit={onSubmit} noValidate>

            {/* NAME */}

            <div
              className={`fr-field ${
                errors.name ? "fr-field--error" : ""
              }`}
            >

              <label htmlFor="su-name">
                {role === "ngo"
                  ? "Organization name"
                  : "Full name"}
              </label>

              <input
                id="su-name"
                placeholder={
                  role === "ngo"
                    ? "Hope Shelter"
                    : "Revati Sharma"
                }
                value={form.name}
                onChange={update("name")}
              />

              {errors.name && (
                <p className="fr-field__err">
                  {errors.name}
                </p>
              )}

            </div>

            {/* EMAIL */}

            <div
              className={`fr-field ${
                errors.email ? "fr-field--error" : ""
              }`}
            >

              <label htmlFor="su-email">
                Email
              </label>

              <input
                id="su-email"
                type="email"
                autoComplete="email"
                required
                maxLength={254}
                placeholder="you@example.com"
                value={form.email}
                onChange={update("email")}
                onBlur={() => {
                  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
                    setErrors((prev) => ({ ...prev, email: "Enter a valid email address." }));
                  }
                }}
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? "su-email-error" : undefined}
              />

              {errors.email && (
                <p id="su-email-error" className="fr-field__err" role="alert">
                  {errors.email}
                </p>
              )}

            </div>

            {/* PHONE */}

            <div
              className={`fr-field ${
                errors.phone ? "fr-field--error" : ""
              }`}
            >

              <label htmlFor="su-phone">
                Phone number
              </label>

              <input
                id="su-phone"
                type="text"
                inputMode="numeric"
                autoComplete="tel-national"
                maxLength={10}
                placeholder="9876543210"
                value={form.phone}
                onChange={update("phone")}
                aria-invalid={Boolean(errors.phone)}
                aria-describedby={errors.phone ? "su-phone-error" : undefined}
              />

              {errors.phone && (
                <p id="su-phone-error" className="fr-field__err" role="alert">
                  {errors.phone}
                </p>
              )}

            </div>

            {/* CITY */}

            <div
              className={`fr-field ${
                errors.city ? "fr-field--error" : ""
              }`}
            >

              <label htmlFor="su-city">City</label>

              <input
                id="su-city"
                type="text"
                autoComplete="address-level2"
                placeholder="Pune"
                value={form.city}
                onChange={update("city")}
                aria-invalid={Boolean(errors.city)}
                aria-describedby={errors.city ? "su-city-error" : undefined}
              />

              {errors.city && (
                <p id="su-city-error" className="fr-field__err" role="alert">
                  {errors.city}
                </p>
              )}

            </div>

            {/* PASSWORD */}

            <div
              className={`fr-field ${
                errors.password ? "fr-field--error" : ""
              }`}
            >

              <label htmlFor="su-password">
                Password
              </label>

              <input
                id="su-password"
                type="password"
                autoComplete="new-password"
                placeholder="At least 6 characters"
                value={form.password}
                onChange={update("password")}
              />

              {errors.password && (
                <p className="fr-field__err">
                  {errors.password}
                </p>
              )}

            </div>

            {/* CONFIRM PASSWORD */}

            <div
              className={`fr-field ${
                errors.confirm ? "fr-field--error" : ""
              }`}
            >

              <label htmlFor="su-confirm">
                Confirm password
              </label>

              <input
                id="su-confirm"
                type="password"
                autoComplete="new-password"
                placeholder="Re-enter password"
                value={form.confirm}
                onChange={update("confirm")}
              />

              {errors.confirm && (
                <p className="fr-field__err">
                  {errors.confirm}
                </p>
              )}

            </div>

            {/* ================= SIGNUP BUTTON ================= */}

            <button
              type="submit"
              className="fr-btn fr-btn--primary fr-auth__submit"
              disabled={submitting}
            >

              {submitting
                ? "Creating account..."
                : `Sign up as ${
                    ROLES.find((r) => r.id === role).label
                  }`}

            </button>

            {/* ================= MESSAGE BELOW BUTTON ================= */}

            {successMessage && (

              <p
                style={{
                  marginTop: "15px",
                  textAlign: "center",
                  fontWeight: "600",
                  fontSize: "14px",
                  color: successMessage.startsWith("✅")
                    ? "#16803c"
                    : "#d97706",
                }}
              >
                {successMessage}
              </p>

            )}

          </form>

          {/* LOGIN LINK */}

          <p className="fr-auth__switch">

            Already have an account?{" "}

            <Link
              to="/login"
              className="fr-link"
            >
              Log in
            </Link>

          </p>

        </div>

      </div>

    </div>
  );
}