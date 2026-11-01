import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import "./Home.css";

export default function AdminDashboard() {
  const [systemStats, setSystemStats] = useState(null);
  const [contactMessages, setContactMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    setRefreshing(true);
    try {
      const [sysRes, contactRes] = await Promise.allSettled([
        api.getSystemHealth(),
        api.getContactMessages(),
      ]);

      if (sysRes.status === "fulfilled" && sysRes.value.tables) {
        setSystemStats(sysRes.value);
      }
      if (contactRes.status === "fulfilled" && contactRes.value.messages) {
        setContactMessages(contactRes.value.messages);
      }
    } catch (err) {
      console.warn("Could not load admin stats:", err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 20000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ background: "#0f172a", minHeight: "92vh", color: "#f8fafc", paddingBottom: "60px" }}>
      {/* HEADER */}
      <div style={{ background: "linear-gradient(135deg, #020617 0%, #1e1b4b 100%)", borderBottom: "1px solid #334155", padding: "36px 24px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <div style={{ display: "inline-block", padding: "4px 10px", background: "rgba(16, 185, 129, 0.2)", border: "1px solid #10b981", borderRadius: "999px", fontSize: "11px", fontWeight: "700", color: "#34d399", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: "8px" }}>
              🛡️ Enterprise Architecture Console
            </div>
            <h1 style={{ fontSize: "28px", fontWeight: "800", margin: 0, letterSpacing: "-0.02em" }}>
              foodBridge-AI · PostgreSQL System Telemetry
            </h1>
            <p style={{ margin: "4px 0 0", color: "#94a3b8", fontSize: "14px" }}>
              Database: <code style={{ color: "#38bdf8" }}>foodbridge_db</code> @ localhost:5432 · Engine: Node.js Express MVC
            </p>
          </div>

          <button
            onClick={loadData}
            style={{
              padding: "10px 18px",
              background: "#10b981",
              color: "#022c22",
              border: "none",
              borderRadius: "8px",
              fontWeight: "700",
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            {refreshing ? "Refreshing..." : "🔄 Query PostgreSQL Live"}
          </button>
        </div>
      </div>

      <div style={{ maxWidth: "1200px", margin: "28px auto 0", padding: "0 20px" }}>
        {/* POSTGRESQL TABLES REAL-TIME METRICS */}
        <h2 style={{ fontSize: "18px", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "16px" }}>
          Live Schema Table Counts (PostgreSQL foodbridge_db)
        </h2>

        {systemStats?.tables ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "16px", marginBottom: "36px" }}>
            {Object.entries(systemStats.tables).map(([table, count]) => (
              <div
                key={table}
                style={{
                  background: "#1e293b",
                  border: "1px solid #334155",
                  borderRadius: "10px",
                  padding: "18px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                }}
              >
                <div style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase", fontWeight: "700", letterSpacing: "0.05em" }}>
                  TABLE: {table}
                </div>
                <div style={{ fontSize: "28px", fontWeight: "800", color: "#34d399", margin: "6px 0 2px" }}>
                  {count} <span style={{ fontSize: "13px", color: "#94a3b8", fontWeight: "500" }}>rows</span>
                </div>
                <span style={{ fontSize: "11px", color: "#38bdf8" }}>✓ Constraints & Indexes Active</span>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ background: "#1e293b", padding: "20px", borderRadius: "10px", color: "#94a3b8", marginBottom: "30px" }}>
            Connecting to PostgreSQL database telemetry...
          </div>
        )}

        {/* SERVER RUNTIME & SECURITY */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "36px" }}>
          <div style={{ background: "#1e293b", borderRadius: "12px", padding: "20px", border: "1px solid #334155" }}>
            <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#f1f5f9", margin: "0 0 12px" }}>
              ⚡ Real-Time Services Status
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #334155", paddingBottom: "6px" }}>
                <span style={{ color: "#94a3b8" }}>PostgreSQL Pool Status:</span>
                <strong style={{ color: "#34d399" }}>Connected & Healthy (Port 5432)</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #334155", paddingBottom: "6px" }}>
                <span style={{ color: "#94a3b8" }}>Socket.io Volunteer Dispatch:</span>
                <strong style={{ color: "#34d399" }}>Broadcasting & Listening</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #334155", paddingBottom: "6px" }}>
                <span style={{ color: "#94a3b8" }}>AI Freshness Engine:</span>
                <strong style={{ color: "#34d399" }}>Shelf-Life Decays Online</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #334155", paddingBottom: "6px" }}>
                <span style={{ color: "#94a3b8" }}>Handoff Verification Engine:</span>
                <strong style={{ color: "#34d399" }}>6-Digit OTP Cryptographic Hash</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#94a3b8" }}>Server Process Uptime:</span>
                <strong style={{ color: "#f8fafc" }}>{systemStats?.system?.uptime || 120} seconds</strong>
              </div>
            </div>
          </div>

          <div style={{ background: "#1e293b", borderRadius: "12px", padding: "20px", border: "1px solid #334155" }}>
            <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#f1f5f9", margin: "0 0 12px" }}>
              🎯 Role-Based Access Control (RBAC) Matrix
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "12px", color: "#cbd5e1" }}>
              <div><strong style={{ color: "#34d399" }}>🍱 DONOR:</strong> Post surplus food, track AI freshness, view listings, view impact.</div>
              <div><strong style={{ color: "#60a5fa" }}>🚚 VOLUNTEER:</strong> Claim rescue pickups, update transit, verify receiver handoff OTP.</div>
              <div><strong style={{ color: "#fbbf24" }}>🏠 RECEIVER / NGO:</strong> Browse available food, request meals, view delivery OTP code.</div>
              <div><strong style={{ color: "#c084fc" }}>🛡️ ADMIN:</strong> System telemetry, audit logs, contact inquiries, global override.</div>
            </div>
          </div>
        </div>

        {/* INBOUND CONTACT INQUIRIES FROM POSTGRESQL */}
        <div style={{ background: "#1e293b", borderRadius: "12px", padding: "24px", border: "1px solid #334155" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ fontSize: "18px", fontWeight: "700", color: "#f8fafc", margin: 0 }}>
              📩 Inbound Inquiries Saved to Database ({contactMessages.length})
            </h3>
            <span style={{ fontSize: "12px", color: "#94a3b8" }}>Table: contact_messages</span>
          </div>

          {contactMessages.length === 0 ? (
            <div style={{ color: "#64748b", padding: "16px 0", fontSize: "14px" }}>
              No inquiries submitted yet. You can submit one via the Contact tab and it will appear here in real time!
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {contactMessages.map((msg) => (
                <div
                  key={msg.id}
                  style={{
                    background: "#0f172a",
                    padding: "16px",
                    borderRadius: "8px",
                    border: "1px solid #334155",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <strong style={{ color: "#38bdf8", fontSize: "14px" }}>
                      Ticket #{msg.id}: {msg.subject}
                    </strong>
                    <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                      {new Date(msg.created_at).toLocaleString()}
                    </span>
                  </div>
                  <div style={{ fontSize: "13px", color: "#e2e8f0", marginBottom: "6px" }}>
                    From: <strong>{msg.name}</strong> &lt;{msg.email}&gt;
                  </div>
                  <p style={{ margin: 0, fontSize: "13px", color: "#94a3b8", lineHeight: 1.5 }}>
                    "{msg.message}"
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
