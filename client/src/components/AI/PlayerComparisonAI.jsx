import { useState } from "react";
import useAI from "../../hooks/useAI";
import { aiPlayerComparison } from "../../Services/api";

/* ══════════════════════════════════════════════════════════
   PLAYER COMPARISON AI NARRATOR
   Drop this inside ComparePlayers.jsx
   Props: p1, p2  (player objects already in scope)
══════════════════════════════════════════════════════════ */
const PlayerComparisonAI = ({ p1, p2 }) => {
  const [narrative, setNarrative] = useState("");
  const [visible, setVisible]     = useState(true);
  const { loading, error, callAI } = useAI();

  const handleNarrate = async () => {
    if (!p1 || !p2) return;
    const data = await callAI(() => aiPlayerComparison(p1, p2));
    if (data?.narrative) {
      setNarrative(data.narrative);
      setVisible(true);
    }
  };

  const canNarrate = p1 && p2 && p1._id !== p2._id;

  return (
    <div
      style={{
        background: "linear-gradient(160deg,#0d1f33 0%,#091520 100%)",
        border: "1px solid #0f2744",
        borderRadius: 20,
        padding: "20px 24px",
        marginTop: 20,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: narrative ? 14 : 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 18 }}>🤖</span>
          <div>
            <p
              style={{
                color: "#e2e8f0",
                fontWeight: 700,
                fontSize: 13,
                margin: 0,
              }}
            >
              AI Comparison Narrator
            </p>
            <p style={{ color: "#334155", fontSize: 11, margin: 0 }}>
              {p1 && p2
                ? `${p1.name} vs ${p2.name}`
                : "Select two players above"}
            </p>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          {narrative && (
            <button
              onClick={() => setVisible((v) => !v)}
              style={{
                background: "#0a1929",
                border: "1px solid #1e3a5f",
                borderRadius: 8,
                color: "#475569",
                fontSize: 11,
                padding: "5px 10px",
                cursor: "pointer",
              }}
            >
              {visible ? "▲ Hide" : "▼ Show"}
            </button>
          )}
          <button
            onClick={handleNarrate}
            disabled={loading || !canNarrate}
            style={{
              background:
                loading || !canNarrate
                  ? "#0a1929"
                  : "linear-gradient(135deg,#00e5ff22,#f472b622)",
              border:
                loading || !canNarrate
                  ? "1px solid #1e3a5f"
                  : "1px solid #00e5ff44",
              borderRadius: 10,
              color: loading || !canNarrate ? "#334155" : "#e2e8f0",
              fontWeight: 700,
              fontSize: 12,
              padding: "8px 18px",
              cursor: loading || !canNarrate ? "not-allowed" : "pointer",
              transition: "all 0.2s",
              whiteSpace: "nowrap",
            }}
          >
            {loading
              ? "Analysing..."
              : narrative
              ? "🔄 Re-narrate"
              : "✨ AI Narrate"}
          </button>
        </div>
      </div>

      {error && (
        <p style={{ color: "#f87171", fontSize: 11, marginTop: 8 }}>{error}</p>
      )}

      {loading && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginTop: 12,
          }}
        >
          <div
            style={{
              width: 14,
              height: 14,
              border: "2px solid #1e3a5f",
              borderTop: "2px solid #00e5ff",
              borderRadius: "50%",
              animation: "cpspin 0.8s linear infinite",
            }}
          />
          <style>{`@keyframes cpspin{to{transform:rotate(360deg)}}`}</style>
          <p style={{ color: "#334155", fontSize: 12, margin: 0 }}>
            Comparing {p1?.name} and {p2?.name}...
          </p>
        </div>
      )}

      {/* Narrative */}
      {narrative && visible && !loading && (
        <div
          style={{
            background: "#0a1929",
            border: "1px solid #1e3a5f",
            borderRadius: 14,
            padding: "14px 18px",
            marginTop: 12,
          }}
        >
          {/* Player chips */}
          <div
            style={{
              display: "flex",
              gap: 8,
              marginBottom: 10,
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                background: "#00e5ff1a",
                border: "1px solid #00e5ff44",
                borderRadius: 99,
                color: "#00e5ff",
                fontSize: 10,
                fontWeight: 700,
                padding: "3px 10px",
                letterSpacing: 1,
              }}
            >
              {p1?.name}
            </span>
            <span style={{ color: "#1e3a5f", fontSize: 12, alignSelf: "center" }}>vs</span>
            <span
              style={{
                background: "#f472b61a",
                border: "1px solid #f472b644",
                borderRadius: 99,
                color: "#f472b6",
                fontSize: 10,
                fontWeight: 700,
                padding: "3px 10px",
                letterSpacing: 1,
              }}
            >
              {p2?.name}
            </span>
          </div>

          <p
            style={{
              color: "#94a3b8",
              fontSize: 13.5,
              lineHeight: 1.75,
              margin: 0,
            }}
          >
            {narrative}
          </p>
        </div>
      )}
    </div>
  );
};

export default PlayerComparisonAI;