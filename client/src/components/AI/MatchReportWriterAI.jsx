import { useState } from "react";
import useAI from "../../hooks/useAI";
import { aiMatchReportWriter } from "../../Services/api";

/* ══════════════════════════════════════════════════════════
   MATCH REPORT WRITER AI
   Drop this inside MatchReports.jsx — pass matchData prop
══════════════════════════════════════════════════════════ */
const MatchReportWriterAI = ({ matchData }) => {
  const [report, setReport]     = useState(null);
  const [expanded, setExpanded] = useState(true);
  const { loading, error, callAI } = useAI();

  const canGenerate =
    matchData?.selectedMatchId || matchData?.matchTitle || matchData?.finalScore;

  const handleGenerate = async () => {
    const data = await callAI(() => aiMatchReportWriter(matchData));
    if (data?.report) {
      setReport(data.report);
      setExpanded(true);
    }
  };

  return (
    <div
      style={{
        background: "linear-gradient(160deg,#0d1f33,#091520)",
        border: "1px solid #1e3a5f",
        borderRadius: 16,
        overflow: "hidden",
        marginTop: 12,
      }}
    >
      {/* Header row */}
      <div
        style={{
          padding: "12px 18px",
          background: "rgba(0,212,180,0.06)",
          borderBottom: report ? "1px solid #1e3a5f" : "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 16 }}>✍️</span>
          <div>
            <p
              style={{
                color: "#e2e8f0",
                fontWeight: 700,
                fontSize: 13,
                margin: 0,
              }}
            >
              AI Report Writer
            </p>
            <p style={{ color: "#475569", fontSize: 10, margin: 0 }}>
              Auto-generates narrative report from match data
            </p>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          {report && (
            <button
              onClick={() => setExpanded((e) => !e)}
              style={{
                background: "#111d33",
                border: "1px solid #243352",
                borderRadius: 8,
                color: "#64748b",
                fontSize: 11,
                padding: "5px 10px",
                cursor: "pointer",
              }}
            >
              {expanded ? "▲ Hide" : "▼ Show"}
            </button>
          )}
          <button
            onClick={handleGenerate}
            disabled={loading || !canGenerate}
            style={{
              background:
                loading || !canGenerate
                  ? "#1e3a5f"
                  : "linear-gradient(135deg,#00d4b4,#38bdf8)",
              border: "none",
              borderRadius: 8,
              color: loading || !canGenerate ? "#475569" : "#060e1a",
              fontWeight: 700,
              fontSize: 11,
              padding: "6px 14px",
              cursor: loading || !canGenerate ? "not-allowed" : "pointer",
              transition: "all 0.2s",
              whiteSpace: "nowrap",
            }}
          >
            {loading
              ? "Generating..."
              : report
              ? "🔄 Regenerate"
              : "✨ Generate Report"}
          </button>
        </div>
      </div>

      {!canGenerate && !report && (
        <p
          style={{
            color: "#334155",
            fontSize: 11,
            padding: "10px 18px",
            margin: 0,
          }}
        >
          Select a match and add a summary above to generate a report.
        </p>
      )}

      {error && (
        <p style={{ color: "#f87171", fontSize: 11, padding: "10px 18px" }}>
          {error}
        </p>
      )}

      {loading && (
        <div
          style={{
            padding: "18px",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div
            style={{
              width: 16,
              height: 16,
              border: "2px solid #1e3a5f",
              borderTop: "2px solid #00d4b4",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
            }}
          />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          <p style={{ color: "#475569", fontSize: 12, margin: 0 }}>
            Writing your match report...
          </p>
        </div>
      )}

      {/* Generated Report */}
      {report && expanded && !loading && (
        <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Headline */}
          <div>
            <p
              style={{
                fontSize: 9,
                color: "#00d4b4",
                letterSpacing: 3,
                fontWeight: 700,
                marginBottom: 4,
              }}
            >
              HEADLINE
            </p>
            <h3
              style={{
                color: "#f1f5f9",
                fontSize: 17,
                fontWeight: 800,
                margin: 0,
                lineHeight: 1.3,
              }}
            >
              {report.headline}
            </h3>
          </div>

          {/* Narrative */}
          <div
            style={{
              background: "#111d33",
              border: "1px solid #1e3a5f",
              borderRadius: 12,
              padding: "12px 16px",
            }}
          >
            <p
              style={{
                fontSize: 9,
                color: "#475569",
                letterSpacing: 3,
                fontWeight: 700,
                marginBottom: 6,
              }}
            >
              MATCH NARRATIVE
            </p>
            <p
              style={{
                color: "#94a3b8",
                fontSize: 13,
                lineHeight: 1.7,
                margin: 0,
              }}
            >
              {report.narrative}
            </p>
          </div>

          {/* Man of the Match */}
          {report.manOfMatch && (
            <div
              style={{
                background: "rgba(0,212,180,0.06)",
                border: "1px solid rgba(0,212,180,0.2)",
                borderRadius: 10,
                padding: "10px 14px",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <span style={{ fontSize: 18 }}>🏆</span>
              <div>
                <p
                  style={{
                    fontSize: 9,
                    color: "#00d4b4",
                    letterSpacing: 2,
                    fontWeight: 700,
                    margin: 0,
                  }}
                >
                  MAN OF THE MATCH
                </p>
                <p
                  style={{ color: "#cbd5e1", fontSize: 12, margin: "2px 0 0" }}
                >
                  {report.manOfMatch}
                </p>
              </div>
            </div>
          )}

          {/* Key Stats */}
          {report.keyStats?.length > 0 && (
            <div>
              <p
                style={{
                  fontSize: 9,
                  color: "#475569",
                  letterSpacing: 3,
                  fontWeight: 700,
                  marginBottom: 8,
                }}
              >
                KEY INSIGHTS
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {report.keyStats.map((stat, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 8,
                      background: "#0a1929",
                      border: "1px solid #0f2744",
                      borderRadius: 8,
                      padding: "7px 12px",
                    }}
                  >
                    <span
                      style={{
                        color: "#00d4b4",
                        fontSize: 11,
                        fontWeight: 700,
                        flexShrink: 0,
                        marginTop: 1,
                      }}
                    >
                      {i + 1}.
                    </span>
                    <p style={{ color: "#94a3b8", fontSize: 12, margin: 0 }}>
                      {stat}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Trend + Recommendation */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {report.trends && (
              <div
                style={{
                  background: "#0a1929",
                  border: "1px solid #0f2744",
                  borderRadius: 10,
                  padding: "10px 12px",
                }}
              >
                <p
                  style={{
                    fontSize: 9,
                    color: "#38bdf8",
                    letterSpacing: 2,
                    fontWeight: 700,
                    marginBottom: 4,
                  }}
                >
                  📈 TREND
                </p>
                <p style={{ color: "#64748b", fontSize: 11, margin: 0 }}>
                  {report.trends}
                </p>
              </div>
            )}
            {report.recommendation && (
              <div
                style={{
                  background: "#0a1929",
                  border: "1px solid #0f2744",
                  borderRadius: 10,
                  padding: "10px 12px",
                }}
              >
                <p
                  style={{
                    fontSize: 9,
                    color: "#fbbf24",
                    letterSpacing: 2,
                    fontWeight: 700,
                    marginBottom: 4,
                  }}
                >
                  🎯 NEXT MATCH
                </p>
                <p style={{ color: "#64748b", fontSize: 11, margin: 0 }}>
                  {report.recommendation}
                </p>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
};

export default MatchReportWriterAI;