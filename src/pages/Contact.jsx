import { useState } from "react";
import { api } from "../services/api";
import "./Contact.css";

const INFO = [
  {
    label: "Email us",
    value: "hello@foodrescue.org",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M4 6.5l8 6 8-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
    ),
  },
  {
    label: "Call the helpline",
    value: "+91 98765 43210",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M6.6 10.8c1.3 2.6 3.4 4.7 6 6l2-2c.3-.3.7-.4 1.1-.3 1.2.4 2.5.6 3.8.6.6 0 1 .4 1 1v3.4c0 .6-.4 1-1 1C10.5 20.5 3.5 13.5 3.5 4.5c0-.6.4-1 1-1H8c.6 0 1 .4 1 1 0 1.3.2 2.6.6 3.8.1.4 0 .8-.3 1.1l-2 2z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/></svg>
    ),
  },
  {
    label: "Find us",
    value: "Pune, Maharashtra",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 21s7-7.2 7-12a7 7 0 1 0-14 0c0 4.8 7 12 7 12Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><circle cx="12" cy="9" r="2.4" stroke="currentColor" strokeWidth="1.8"/></svg>
    ),
  },
];

const FAQ = [
  { q: "Is there any cost to donate or receive food?", a: "No. Listing surplus food and requesting it are both free — the platform is not a marketplace." },
  { q: "How quickly is a pickup usually assigned?", a: "On average under ten minutes once a listing goes live, depending on volunteer availability nearby." },
  { q: "Can one account act as both donor and volunteer?", a: "Yes — pick a primary role at signup, and you can add another role from your profile settings later." },
];

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", subject: "General question", message: "" });
  const [errors, setErrors] = useState({});
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverMsg, setServerMsg] = useState("");

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const validate = () => {
    const next = {};
    if (form.name.trim().length < 2) next.name = "Enter your name.";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = "Enter a valid email address.";
    if (form.message.trim().length < 10) next.message = "Tell us a little more (10+ characters).";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const res = await api.submitContact(form);
      setSent(true);
      setServerMsg(res.message || "Message recorded successfully in PostgreSQL!");
    } catch (err) {
      setServerMsg(`Error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <section className="fr-section fr-contact-hero">
        <div className="fr-container fr-contact-hero__inner">
          <span className="fr-eyebrow">Get in touch</span>
          <h1>Questions, partnerships, or a kitchen ready to onboard?</h1>
          <p>Reach out below — a real person on the team replies within a day.</p>
        </div>
      </section>

      <section className="fr-section fr-contact-main">
        <div className="fr-container fr-contact-main__grid">
          <div className="fr-contact-info">
            {INFO.map((i) => (
              <div key={i.label} className="fr-contact-info__item">
                <span className="fr-route__icon fr-route__icon--forest">{i.icon}</span>
                <div>
                  <p className="fr-contact-info__label">{i.label}</p>
                  <p className="fr-contact-info__value">{i.value}</p>
                </div>
              </div>
            ))}

            <div className="fr-contact-faq">
              <h3>Quick answers</h3>
              {FAQ.map((f) => (
                <details key={f.q} className="fr-contact-faq__item">
                  <summary>{f.q}</summary>
                  <p>{f.a}</p>
                </details>
              ))}
            </div>
          </div>

          <div className="fr-card fr-contact-form">
            {sent ? (
              <div className="fr-contact-sent">
                <h3>✅ Message Recorded in Database!</h3>
                <p>{serverMsg}</p>
                <button
                  className="fr-btn fr-btn--primary"
                  style={{ marginTop: "16px" }}
                  onClick={() => { setSent(false); setForm({ name: "", email: "", subject: "General question", message: "" }); }}
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={onSubmit} noValidate>
                <div className="fr-field-row">
                  <div className={`fr-field ${errors.name ? "fr-field--error" : ""}`}>
                    <label htmlFor="c-name">Name</label>
                    <input id="c-name" value={form.name} onChange={update("name")} placeholder="Your name" />
                    {errors.name && <p className="fr-field__err">{errors.name}</p>}
                  </div>
                  <div className={`fr-field ${errors.email ? "fr-field--error" : ""}`}>
                    <label htmlFor="c-email">Email</label>
                    <input id="c-email" type="email" value={form.email} onChange={update("email")} placeholder="you@example.com" />
                    {errors.email && <p className="fr-field__err">{errors.email}</p>}
                  </div>
                </div>

                <div className="fr-field">
                  <label htmlFor="c-subject">Subject</label>
                  <select id="c-subject" value={form.subject} onChange={update("subject")}>
                    <option>General question</option>
                    <option>Onboard my kitchen or restaurant</option>
                    <option>Register our NGO / shelter</option>
                    <option>Volunteer support</option>
                    <option>Press &amp; partnerships</option>
                  </select>
                </div>

                <div className={`fr-field ${errors.message ? "fr-field--error" : ""}`}>
                  <label htmlFor="c-message">Message</label>
                  <textarea id="c-message" rows={5} value={form.message} onChange={update("message")} placeholder="How can we help?" />
                  {errors.message && <p className="fr-field__err">{errors.message}</p>}
                </div>

                <button className="fr-btn fr-btn--primary fr-auth__submit">Send message</button>
              </form>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
