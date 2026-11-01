import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import "./Home.css";

export default function ImpactLab() {
  // Simulator inputs
  const [foodType, setFoodType] = useState("Cooked Food");
  const [storageType, setStorageType] = useState("Hot Held");
  const [quantityKg, setQuantityKg] = useState(25);
  const [cookedHoursAgo, setCookedHoursAgo] = useState(2);
  const [ambientTempC, setAmbientTempC] = useState(28);

  // Prediction result
  const [prediction, setPrediction] = useState(null);
  const [predicting, setPredicting] = useState(false);

  // Platform live ESG metrics
  const [platformStats, setPlatformStats] = useState({
    foodSavedKg: 18450,
    mealsServed: 46125,
    co2OffsetKg: 46125,
    waterSavedLiters: 18450000,
    activeDonors: 240,
    activeVolunteers: 85,
    partnerShelters: 94,
    treesEquivalent: 2200,
  });

  const runPrediction = async () => {
    setPredicting(true);
    try {
      const cookedAt = new Date(Date.now() - cookedHoursAgo * 60 * 60 * 1000);
      const res = await api.predictFreshness({
        foodType,
        cookedAt,
        storageType,
        quantityKg: parseFloat(quantityKg) || 10,
        ambientTempC: parseFloat(ambientTempC) || 28,
      });
      if (res.prediction) {
        setPrediction(res.prediction);
      }
    } catch (err) {
      console.warn("Prediction error:", err.message);
    } finally {
      setPredicting(false);
    }
  };

  useEffect(() => {
    // Initial prediction
    runPrediction();

    // Fetch platform ESG metrics from PostgreSQL
    api.getPlatformAnalytics()
      .then((res) => {
        if (res.data) setPlatformStats((prev) => ({ ...prev, ...res.data }));
      })
      .catch(() => {});
  }, []);

  return (
    <div style={{ background: "#f8fafc", minHeight: "90vh", paddingBottom: "70px" }}>
      {/* HEADER */}
      <div style={{ background: "linear-gradient(135deg, #064e3b 0%, #1e1b4b 100%)", color: "#fff", padding: "48px 24px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ display: "inline-block", padding: "4px 12px", background: "rgba(16, 185, 129, 0.2)", border: "1px solid #10b981", borderRadius: "999px", fontSize: "12px", fontWeight: "700", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: "12px" }}>
            🧠 AI Intelligence & ESG Impact Lab
          </div>
          <h1 style={{ fontSize: "36px", fontWeight: "800", margin: "0 0 10px", letterSpacing: "-0.02em" }}>
            AI Freshness & ESG Sustainability Engine
          </h1>
          <p style={{ fontSize: "16px", color: "#cbd5e1", maxWidth: "760px", margin: 0, lineHeight: 1.6 }}>
            Empirical machine learning algorithms evaluating biological shelf-life, microbial decay curves, and environmental ESG metrics across the rescue lifecycle.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: "1200px", margin: "32px auto 0", padding: "0 20px" }}>
        {/* PLATFORM ESG COUNTERS (LIVE FROM POSTGRESQL) */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "18px", marginBottom: "36px" }}>
          <div style={{ background: "#fff", padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
            <span style={{ fontSize: "24px" }}>🍱</span>
            <div style={{ fontSize: "28px", fontWeight: "800", color: "#0f172a", marginTop: "8px" }}>
              {(platformStats.foodSavedKg || 18450).toLocaleString()} kg
            </div>
            <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "13px", fontWeight: "600" }}>
              Total Food Rescued from Landfill
            </p>
          </div>

          <div style={{ background: "#fff", padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
            <span style={{ fontSize: "24px" }}>🥣</span>
            <div style={{ fontSize: "28px", fontWeight: "800", color: "#059669", marginTop: "8px" }}>
              {(platformStats.mealsServed || 46125).toLocaleString()}
            </div>
            <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "13px", fontWeight: "600" }}>
              Nutritional Meals Distributed
            </p>
          </div>

          <div style={{ background: "#fff", padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
            <span style={{ fontSize: "24px" }}>🌍</span>
            <div style={{ fontSize: "28px", fontWeight: "800", color: "#2563eb", marginTop: "8px" }}>
              {(platformStats.co2OffsetKg || 46125).toLocaleString()} kg
            </div>
            <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "13px", fontWeight: "600" }}>
              CO₂ Equivalent Greenhouse Averted
            </p>
          </div>

          <div style={{ background: "#fff", padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
            <span style={{ fontSize: "24px" }}>💧</span>
            <div style={{ fontSize: "28px", fontWeight: "800", color: "#0891b2", marginTop: "8px" }}>
              {((platformStats.waterSavedLiters || 18450000) / 1000).toLocaleString()} kL
            </div>
            <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "13px", fontWeight: "600" }}>
              Agricultural Virtual Water Saved
            </p>
          </div>
        </div>

        {/* SECTION 2: INTERACTIVE AI FRESHNESS SIMULATOR */}
        <div style={{ background: "#fff", borderRadius: "16px", padding: "32px", border: "1px solid #e2e8f0", boxShadow: "0 10px 30px -10px rgba(0,0,0,0.05)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px", marginBottom: "24px", borderBottom: "1px solid #f1f5f9", paddingBottom: "18px" }}>
            <div>
              <span style={{ color: "#059669", fontWeight: "700", fontSize: "13px", textTransform: "uppercase" }}>Interactive Machine Learning Model</span>
              <h2 style={{ fontSize: "24px", fontWeight: "800", color: "#0f172a", margin: "4px 0 0" }}>
                AI Food Freshness & Spoilage Prediction Simulator
              </h2>
            </div>
            <button
              onClick={runPrediction}
              disabled={predicting}
              style={{
                padding: "10px 22px",
                background: "#059669",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                fontWeight: "700",
                fontSize: "14px",
                cursor: "pointer",
              }}
            >
              {predicting ? "Computing Decay Curves..." : "⚡ Run Prediction Model"}
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px" }}>
            {/* INPUT CONTROLS */}
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#334155", marginBottom: "16px" }}>
                1. Donation Parameters
              </h3>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#475569", marginBottom: "6px" }}>
                  Food Category:
                </label>
                <select
                  value={foodType}
                  onChange={(e) => setFoodType(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                >
                  <option value="Cooked Food">Cooked Food (Biryani, Curry, Rice)</option>
                  <option value="Bread">Bakery & Bread Products</option>
                  <option value="Vegetables">Raw Vegetables & Produce</option>
                  <option value="Fruits">Fresh Fruits</option>
                  <option value="Dairy">Dairy Products & Desserts</option>
                  <option value="Packaged">Dry Packaged Groceries</option>
                </select>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#475569", marginBottom: "6px" }}>
                  Thermal Preservation / Storage:
                </label>
                <select
                  value={storageType}
                  onChange={(e) => setStorageType(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                >
                  <option value="Hot Held">Hot Held (Above 60°C / 140°F)</option>
                  <option value="Refrigerated">Refrigerated (Below 4°C / 40°F)</option>
                  <option value="Frozen">Frozen (Below -18°C)</option>
                  <option value="Room Temperature">Room Temperature (~25°C - 30°C)</option>
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#475569", marginBottom: "6px" }}>
                    Prepared (Hours Ago): {cookedHoursAgo} hrs
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="24"
                    step="0.5"
                    value={cookedHoursAgo}
                    onChange={(e) => setCookedHoursAgo(parseFloat(e.target.value))}
                    style={{ width: "100%" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#475569", marginBottom: "6px" }}>
                    Batch Weight: {quantityKg} kg
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    step="1"
                    value={quantityKg}
                    onChange={(e) => setQuantityKg(parseFloat(e.target.value))}
                    style={{ width: "100%" }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#475569", marginBottom: "6px" }}>
                  Ambient Pune Temperature: {ambientTempC}°C
                </label>
                <input
                  type="range"
                  min="15"
                  max="42"
                  step="1"
                  value={ambientTempC}
                  onChange={(e) => setAmbientTempC(parseFloat(e.target.value))}
                  style={{ width: "100%" }}
                />
              </div>

              <button
                type="button"
                onClick={runPrediction}
                style={{
                  width: "100%",
                  padding: "12px",
                  background: "#0f172a",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                Re-calculate AI Decay & ESG Indicators
              </button>
            </div>

            {/* PREDICTION INFERENCE RESULT */}
            {prediction && (
              <div style={{ background: "#f8fafc", borderRadius: "12px", padding: "24px", border: "1px solid #e2e8f0" }}>
                <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#334155", marginBottom: "16px" }}>
                  2. AI Model Output & Biochemical Inference
                </h3>

                {/* GAUGE SCORE */}
                <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "20px" }}>
                  <div
                    style={{
                      width: "90px",
                      height: "90px",
                      borderRadius: "50%",
                      background: prediction.freshnessScore > 75 ? "#ecfdf5" : prediction.freshnessScore > 50 ? "#fef3c7" : "#fee2e2",
                      border: `4px solid ${prediction.freshnessScore > 75 ? "#10b981" : prediction.freshnessScore > 50 ? "#f59e0b" : "#ef4444"}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexDirection: "column",
                    }}
                  >
                    <span style={{ fontSize: "22px", fontWeight: "800", color: "#0f172a" }}>
                      {prediction.freshnessScore}%
                    </span>
                    <span style={{ fontSize: "10px", fontWeight: "700", color: "#64748b" }}>SCORE</span>
                  </div>

                  <div>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "6px" }}>
                      <span
                        style={{
                          padding: "3px 8px",
                          borderRadius: "4px",
                          fontSize: "12px",
                          fontWeight: "700",
                          background: prediction.spoilageRisk === "LOW" ? "#d1fae5" : prediction.spoilageRisk === "MEDIUM" ? "#fef3c7" : "#fee2e2",
                          color: prediction.spoilageRisk === "LOW" ? "#065f46" : prediction.spoilageRisk === "MEDIUM" ? "#92400e" : "#991b1b",
                        }}
                      >
                        Risk: {prediction.spoilageRisk}
                      </span>
                      <span
                        style={{
                          padding: "3px 8px",
                          borderRadius: "4px",
                          fontSize: "12px",
                          fontWeight: "700",
                          background: "#e0e7ff",
                          color: "#3730a3",
                        }}
                      >
                        Urgency: {prediction.urgencyLevel}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
                      Safe Transport Window: <strong>{prediction.shelfLifeHours} hours remaining</strong>
                    </p>
                  </div>
                </div>

                {/* RECOMMENDATION */}
                <div style={{ background: "#fff", padding: "14px", borderRadius: "8px", border: "1px solid #e2e8f0", marginBottom: "18px" }}>
                  <span style={{ fontSize: "12px", fontWeight: "700", color: "#475569", display: "block", marginBottom: "4px" }}>
                    🤖 Dynamic Protocol Recommendation:
                  </span>
                  <p style={{ margin: 0, fontSize: "13px", color: "#0f172a", lineHeight: 1.5 }}>
                    {prediction.aiRecommendation}
                  </p>
                </div>

                {/* ESG CALCULATIONS FOR THIS BATCH */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div style={{ background: "#ecfdf5", padding: "12px", borderRadius: "8px" }}>
                    <span style={{ fontSize: "11px", fontWeight: "700", color: "#047857" }}>PEOPLE FED</span>
                    <strong style={{ display: "block", fontSize: "18px", color: "#065f46" }}>
                      {Math.round(quantityKg * 2.5)} Meals
                    </strong>
                  </div>
                  <div style={{ background: "#eff6ff", padding: "12px", borderRadius: "8px" }}>
                    <span style={{ fontSize: "11px", fontWeight: "700", color: "#1d4ed8" }}>CO₂ MITIGATED</span>
                    <strong style={{ display: "block", fontSize: "18px", color: "#1e40af" }}>
                      {(quantityKg * 2.5).toFixed(1)} kg CO₂e
                    </strong>
                  </div>
                </div>

                <div style={{ marginTop: "16px", textAlign: "right" }}>
                  <Link
                    to="/donor/add-food"
                    style={{
                      display: "inline-block",
                      padding: "8px 16px",
                      background: "#059669",
                      color: "#fff",
                      borderRadius: "6px",
                      fontSize: "13px",
                      fontWeight: "700",
                      textDecoration: "none",
                    }}
                  >
                    + Donate This Item Now →
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
