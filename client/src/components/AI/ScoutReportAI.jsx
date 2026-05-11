import { useState } from "react";
import useAI from "../../hooks/useAI";
import { aiScoutReport } from "../../Services/api";

/* ══════════════════════════════════════════════════════════
   SCOUT REPORT AI — Opposition Scouting Summary
   Drop inside ScoutReports.jsx
══════════════════════════════════════════════════════════ */
const ScoutReportAI = () => {
  const [form, setForm] = useState({
    opponentName: "",
    weakness: "",
    tactic: "",
    notes: "",
    matchType: "T20",
  });
  const [report, setReport]     = useState(null);
  const [expanded, setExpanded] = useState(true);
  const { loading, error, callAI } = useAI();

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleGenerate = async () => {
    if (!form.opponentName.trim()) return;
    const data = await callAI(() => aiScoutReport(form));
    if (data?.report) {
      setReport(data.report);
      setExpanded(true);
    }
  };

  const MATCH_TYPES = ["T20", "ODI", "Test", "T10"];

  return (
    <div
      style={{
        background: "linear-gradient(160deg,#0d1f33,#091520)",
        border: "1px solid #1e3a5f",
        borderRadius: 20,
        overflow: "hidden",
        marginTop: 20,
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "14px 20px",
          background: "rgba(0,245,200,0.04)",
          borderBottom: "1px solid #1e3a5f",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 18 }}>🔍</span>
          <div>
            <p
              style={{
                color: "#e2e8f0",
                fontWeight: 700,
                fontSize: 13,
                margin: 0,
              }}
            >
              AI Scout Report Generator
            </p>
            <p style={{ color: "#334155", fontSize: 10, margin: 0 }}>
              Paste opposition info — AI generates full scouting report
            </p>
          </div>
        </div>
        {report && (
          <button
            onClick={() => setExpanded((e) => !e)}
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
            {expanded ? "▲ Collapse" : "▼ Expand"}
          </button>
        )}
      </div>

      <div style={{ padding: "16px 20px" }}>

        {/* Input Form */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
          <div>
            <p style={{ fontSize: 9, color: "#475569", letterSpacing: 3, fontWeight: 700, marginBottom: 5 }}>
              OPPONENT NAME *
            </p>
            <input
              name="opponentName"
              value={form.opponentName}
              onChange={handleChange}
              placeholder="e.g. Mumbai Strikers"
              style={{
                width: "100%",
                background: "#0a1929",
                border: "1px solid #1e3a5f",
                borderRadius: 10,
                padding: "8px 12px",
                color: "#e2e8f0",
                fontSize: 12,
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>
          <div>
            <p style={{ fontSize: 9, color: "#475569", letterSpacing: 3, fontWeight: 700, marginBottom: 5 }}>
              MATCH TYPE
            </p>
            <select
              name="matchType"
              value={form.matchType}
              onChange={handleChange}
              style={{
                width: "100%",
                background: "#0a1929",
                border: "1px solid #1e3a5f",
                borderRadius: 10,
                padding: "8px 12px",
                color: "#e2e8f0",
                fontSize: 12,
                outline: "none",
              }}
            >
              {MATCH_TYPES.map((t) => (
                <option key={t} value={t} style={{ background: "#0a1929" }}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ marginBottom: 10 }}>
          <p style={{ fontSize: 9, color: "#475569", letterSpacing: 3, fontWeight: 700, marginBottom: 5 }}>
            THEIR WEAKNESS (optional)
          </p>
          <textarea
            name="weakness"
            value={form.weakness}
            onChange={handleChange}
            rows={2}
            placeholder="e.g. Struggles against left-arm pace in the powerplay..."
            style={{
              width: "100%",
              background: "#0a1929",
              border: "1px solid #1e3a5f",
              borderRadius: 10,
              padding: "8px 12px",
              color: "#e2e8f0",
              fontSize: 12,
              outline: "none",
              resize: "none",
              boxSizing: "border-box",
            }}
          />
        </div>

        <div style={{ marginBottom: 10 }}>
          <p style={{ fontSize: 9, color: "#475569", letterSpacing: 3, fontWeight: 700, marginBottom: 5 }}>
            OUR TACTIC (optional)
          </p>
          <textarea
            name="tactic"
            value={form.tactic}
            onChange={handleChange}
            rows={2}
            placeholder="e.g. Open with spinners, target their top order early..."
            style={{
              width: "100%",
              background: "#0a1929",
              border: "1px solid #1e3a5f",
              borderRadius: 10,
              padding: "8px 12px",
              color: "#e2e8f0",
              fontSize: 12,
              outline: "none",
              resize: "none",
              boxSizing: "border-box",
            }}
          />
        </div>

        <div style={{ marginBottom: 14 }}>
          <p style={{ fontSize: 9, color: "#475569", letterSpacing: 3, fontWeight: 700, marginBottom: 5 }}>
            EXTRA NOTES (optional)
          </p>
          <input
            name="notes"
            value={form.notes}
            onChange={handleChange}
            placeholder="e.g. Playing at home ground, key player injured..."
            style={{
              width: "100%",
              background: "#0a1929",
              border: "1px solid #1e3a5f",
              borderRadius: 10,
              padding: "8px 12px",
              color: "#e2e8f0",
              fontSize: 12,
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading || !form.opponentName.trim()}
          style={{
            width: "100%",
            background:
              loading || !form.opponentName.trim()
                ? "#0a1929"
                : "linear-gradient(135deg,#00f5c8,#00c9a8)",
            border:
              loading || !form.opponentName.trim()
                ? "1px solid #1e3a5f"
                : "none",
            borderRadius: 12,
            color: loading || !form.opponentName.trim() ? "#334155" : "#060e1a",
            fontWeight: 700,
            fontSize: 13,
            padding: "11px 0",
            cursor:
              loading || !form.opponentName.trim() ? "not-allowed" : "pointer",
            transition: "all 0.2s",
          }}
        >
          {loading
            ? "⏳ Generating Scout Report..."
            : report
            ? "🔄 Regenerate Report"
            : "🔍 Generate AI Scout Report"}
        </button>

        {error && (
          <p style={{ color: "#f87171", fontSize: 11, marginTop: 8 }}>{error}</p>
        )}
      </div>

      {/* ── GENERATED REPORT ── */}
      {report && expanded && !loading && (
        <div
          style={{
            borderTop: "1px solid #1e3a5f",
            padding: "16px 20px",
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          {/* Title bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 2,
            }}
          >
            <div
              style={{
                width: 4,
                height: 36,
                background: "linear-gradient(180deg,#00f5c8,#38bdf8)",
                borderRadius: 99,
                flexShrink: 0,
              }}
            />
            <div>
              <p style={{ fontSize: 9, color: "#00f5c8", letterSpacing: 3, fontWeight: 700, margin: 0 }}>
                SCOUTING REPORT
              </p>
              <h3 style={{ color: "#f1f5f9", fontSize: 16, fontWeight: 800, margin: 0 }}>
                {form.opponentName}
              </h3>
            </div>
          </div>

          {/* Opponent Summary */}
          {report.opponentSummary && (
            <div
              style={{
                background: "#0a1929",
                border: "1px solid #1e3a5f",
                borderRadius: 12,
                padding: "12px 14px",
              }}
            >
              <p style={{ fontSize: 9, color: "#475569", letterSpacing: 3, fontWeight: 700, marginBottom: 6 }}>
                OPPOSITION OVERVIEW
              </p>
              <p style={{ color: "#94a3b8", fontSize: 13, lineHeight: 1.65, margin: 0 }}>
                {report.opponentSummary}
              </p>
            </div>
          )}

          {/* Two-col: Threats + Weaknesses */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {/* Key Threats */}
            {report.keyThreats?.length > 0 && (
              <div
                style={{
                  background: "rgba(248,113,113,0.06)",
                  border: "1px solid rgba(248,113,113,0.2)",
                  borderRadius: 12,
                  padding: "12px 14px",
                }}
              >
                <p style={{ fontSize: 9, color: "#f87171", letterSpacing: 3, fontWeight: 700, marginBottom: 8 }}>
                  ⚠️ KEY THREATS
                </p>
                {report.keyThreats.map((t, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      gap: 6,
                      marginBottom: 5,
                      alignItems: "flex-start",
                    }}
                  >
                    <span style={{ color: "#f87171", fontSize: 10, fontWeight: 700, flexShrink: 0, marginTop: 1 }}>
                      •
                    </span>
                    <p style={{ color: "#94a3b8", fontSize: 11, margin: 0, lineHeight: 1.5 }}>
                      {t}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Weaknesses */}
            {report.exploitableWeaknesses?.length > 0 && (
              <div
                style={{
                  background: "rgba(0,245,200,0.04)",
                  border: "1px solid rgba(0,245,200,0.15)",
                  borderRadius: 12,
                  padding: "12px 14px",
                }}
              >
                <p style={{ fontSize: 9, color: "#00f5c8", letterSpacing: 3, fontWeight: 700, marginBottom: 8 }}>
                  🎯 EXPLOIT THESE
                </p>
                {report.exploitableWeaknesses.map((w, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      gap: 6,
                      marginBottom: 5,
                      alignItems: "flex-start",
                    }}
                  >
                    <span style={{ color: "#00f5c8", fontSize: 10, fontWeight: 700, flexShrink: 0, marginTop: 1 }}>
                      •
                    </span>
                    <p style={{ color: "#94a3b8", fontSize: 11, margin: 0, lineHeight: 1.5 }}>
                      {w}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recommended Tactics by Phase */}
          {report.recommendedTactics?.length > 0 && (
            <div>
              <p style={{ fontSize: 9, color: "#475569", letterSpacing: 3, fontWeight: 700, marginBottom: 8 }}>
                📋 TACTICAL GAMEPLAN
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {report.recommendedTactics.map((t, i) => {
                  const phaseColors = ["#38bdf8", "#fbbf24", "#f87171"];
                  const color = phaseColors[i] || "#64748b";
                  return (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        gap: 12,
                        background: "#0a1929",
                        border: "1px solid #0f2744",
                        borderRadius: 10,
                        padding: "10px 14px",
                        alignItems: "flex-start",
                      }}
                    >
                      <span
                        style={{
                          background: `${color}22`,
                          border: `1px solid ${color}44`,
                          borderRadius: 6,
                          color,
                          fontSize: 9,
                          fontWeight: 700,
                          padding: "3px 7px",
                          whiteSpace: "nowrap",
                          flexShrink: 0,
                          letterSpacing: 1,
                          marginTop: 1,
                        }}
                      >
                        {t.phase?.toUpperCase()}
                      </span>
                      <p style={{ color: "#64748b", fontSize: 12, margin: 0, lineHeight: 1.5 }}>
                        {t.tactic}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Player Matchups + Verdict */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {report.playerMatchups && (
              <div
                style={{
                  background: "#0a1929",
                  border: "1px solid #0f2744",
                  borderRadius: 10,
                  padding: "10px 12px",
                }}
              >
                <p style={{ fontSize: 9, color: "#a78bfa", letterSpacing: 2, fontWeight: 700, marginBottom: 4 }}>
                  🤝 MATCHUPS
                </p>
                <p style={{ color: "#64748b", fontSize: 11, margin: 0, lineHeight: 1.5 }}>
                  {report.playerMatchups}
                </p>
              </div>
            )}
            {report.overallVerdict && (
              <div
                style={{
                  background: "rgba(251,191,36,0.06)",
                  border: "1px solid rgba(251,191,36,0.2)",
                  borderRadius: 10,
                  padding: "10px 12px",
                }}
              >
                <p style={{ fontSize: 9, color: "#fbbf24", letterSpacing: 2, fontWeight: 700, marginBottom: 4 }}>
                  ⚖️ VERDICT
                </p>
                <p style={{ color: "#94a3b8", fontSize: 11, margin: 0, lineHeight: 1.5, fontWeight: 600 }}>
                  {report.overallVerdict}
                </p>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
};

export default ScoutReportAI;