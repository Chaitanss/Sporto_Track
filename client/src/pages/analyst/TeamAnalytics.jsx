import React, { useEffect, useState } from "react";
import API from "../../Services/api";

const TeamAnalytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [animIn, setAnimIn] = useState(false);

  useEffect(() => { fetchAnalytics(); }, []);
  useEffect(() => { if (!loading) setTimeout(() => setAnimIn(true), 100); }, [loading]);

  const fetchAnalytics = async () => {
    try { const res = await API.get("/season/team-analytics"); setAnalytics(res.data); }
    catch (err) { console.error("Team analytics error:", err); setAnalytics(demoData); }
    finally { setLoading(false); }
  };

  if (loading) return <LoadingScreen />;
  const d = analytics || demoData;

  return (
    <div style={styles.page}>
      {/* HEADER */}
      <div style={{ ...styles.header, opacity: animIn ? 1 : 0, transform: animIn ? "translateY(0)" : "translateY(-16px)", transition: "all 0.6s ease" }}>
        <div>
          <p style={styles.headerEyebrow}>⚡ LIVE · SEASON 2025</p>
          <h1 style={styles.headerTitle}>Team Analytics</h1>
          <p style={styles.headerSub}>Aggregated from coach player stats · Real-time sync</p>
        </div>
        <div style={styles.headerBadge}>
          <span style={styles.pulseDot} />
          {d.totalPlayers} Players Tracked
        </div>
      </div>

      {/* TABS */}
      <div style={{ ...styles.tabs, opacity: animIn ? 1 : 0, transition: "all 0.6s ease 0.1s" }}>
        {["overview", "batting", "bowling", "players"].map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            style={{ ...styles.tab, ...(activeTab === tab ? styles.tabActive : {}) }}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* STAT CARDS */}
      <div style={{ ...styles.grid4, opacity: animIn ? 1 : 0, transform: animIn ? "translateY(0)" : "translateY(20px)", transition: "all 0.6s ease 0.15s" }}>
        <GlowCard title="Total Runs" value={d.totalRuns} sub="Season aggregate" accent="#7c3aed" bg="#f5f3ff" icon="🏏" />
        <GlowCard title="Runs Conceded" value={d.totalRunsConceded} sub="Across all matches" accent="#dc2626" bg="#fef2f2" icon="🎯" />
        <GlowCard title="Batting Avg" value={d.battingAvg} sub="Team average" accent="#059669" bg="#ecfdf5" icon="📈" />
        <GlowCard title="Total Wickets" value={d.totalWickets} sub="Season tally" accent="#d97706" bg="#fffbeb" icon="🎳" />
      </div>

      {/* CHARTS ROW */}
      {(activeTab === "overview" || activeTab === "batting") && (
        <div style={{ ...styles.grid2, opacity: animIn ? 1 : 0, transition: "all 0.6s ease 0.25s" }}>
          <GlassPanel title="Runs Scored vs Conceded" subtitle="Match-by-match breakdown">
            <BarChart scored={d.matchRunsScored} conceded={d.matchRunsConceded} />
          </GlassPanel>
          <GlassPanel title="Run Rate Trend" subtitle="Over the season">
            <RunRateChart data={d.runRateTrend} />
          </GlassPanel>
        </div>
      )}

      {/* BOTTOM ROW */}
      {(activeTab === "overview" || activeTab === "bowling") && (
        <div style={{ ...styles.grid3, opacity: animIn ? 1 : 0, transition: "all 0.6s ease 0.35s" }}>
          <GlassPanel title="Batting Order" subtitle="Effectiveness by position">
            <ProgressBar label="Top Order" value={d.battingOrder?.top || 80} color="#7c3aed" />
            <ProgressBar label="Middle Order" value={d.battingOrder?.middle || 65} color="#8b5cf6" />
            <ProgressBar label="Lower Order" value={d.battingOrder?.lower || 40} color="#a78bfa" />
          </GlassPanel>
          <GlassPanel title="Bowling Zones" subtitle="Economy by phase">
            <ProgressBar label="Powerplay" value={d.bowlingZones?.powerplay || 70} color="#7c3aed" />
            <ProgressBar label="Middle Overs" value={d.bowlingZones?.middle || 60} color="#6d28d9" />
            <ProgressBar label="Death Overs" value={d.bowlingZones?.death || 50} color="#dc2626" />
          </GlassPanel>
          <GlassPanel title="Match Situations" subtitle="Key stats">
            <StatRow label="Boundaries" value={d.boundaries} color="#7c3aed" icon="🏏" />
            <StatRow label="Sixes" value={d.sixes} color="#d97706" icon="🚀" />
            <StatRow label="Dot Balls" value={d.dotBalls} color="#059669" icon="⬤" />
            <StatRow label="Wickets Lost" value={d.wicketsLost} color="#dc2626" icon="❌" />
            <StatRow label="Avg Rating" value={d.avgRating} color="#6d28d9" icon="⭐" />
          </GlassPanel>
        </div>
      )}

      {/* PLAYERS TABLE */}
      {(activeTab === "overview" || activeTab === "players") && (
        <div style={{ ...styles.tableWrap, opacity: animIn ? 1 : 0, transition: "all 0.6s ease 0.45s" }}>
          <div style={styles.tableTitleRow}>
            <div>
              <p style={styles.panelEye}>SQUAD DATA</p>
              <h3 style={styles.panelTitle}>Player Season Stats</h3>
            </div>
            <span style={styles.playerCount}>{d.players?.length || 0} players</span>
          </div>
          <PlayerTable players={d.players || []} />
        </div>
      )}
    </div>
  );
};

const LoadingScreen = () => (
  <div style={styles.loadWrap}>
    <div style={styles.spinner} />
    <p style={{ color: "#7c3aed", marginTop: 16, fontFamily: "sans-serif", letterSpacing: 4, fontSize: 12, fontWeight: 700 }}>LOADING ANALYTICS</p>
  </div>
);

const GlowCard = ({ title, value, sub, accent, bg, icon }) => {
  const [hov, setHov] = useState(false);
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ ...styles.glowCard, background: hov ? bg : "#ffffff", boxShadow: hov ? `0 8px 32px ${accent}22` : "0 1px 4px #0000000a", borderColor: hov ? accent + "44" : "#e5e7eb", transition: "all 0.3s ease", transform: hov ? "translateY(-4px)" : "translateY(0)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <p style={styles.cardLabel}>{title}</p>
          <p style={{ ...styles.cardValue, color: accent }}>{value}</p>
          <p style={styles.cardSub}>{sub}</p>
        </div>
        <span style={{ fontSize: 28, opacity: 0.7 }}>{icon}</span>
      </div>
      <div style={{ height: 3, background: `linear-gradient(90deg, ${accent}, ${accent}44)`, marginTop: 12, borderRadius: 2 }} />
    </div>
  );
};

const GlassPanel = ({ title, subtitle, children }) => (
  <div style={styles.glassPanel}>
    <p style={styles.panelEye}>ANALYTICS</p>
    <h3 style={styles.panelTitle}>{title}</h3>
    <p style={styles.panelSub}>{subtitle}</p>
    <div style={{ marginTop: 20 }}>{children}</div>
  </div>
);

const BarChart = ({ scored = [], conceded = [] }) => {
  const max = Math.max(...scored, ...conceded, 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 140 }}>
      {scored.map((s, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
          <div style={{ width: "100%", background: "#7c3aed", borderRadius: "4px 4px 0 0", height: `${(s / max) * 110}px`, transition: "height 0.8s ease" }} />
          <div style={{ width: "100%", background: "#fca5a5", borderRadius: "0 0 4px 4px", height: `${((conceded[i] || 0) / max) * 110}px`, transition: "height 0.8s ease" }} />
          <span style={{ fontSize: 10, color: "#9ca3af" }}>M{i + 1}</span>
        </div>
      ))}
    </div>
  );
};

const RunRateChart = ({ data = [] }) => {
  const max = Math.max(...data, 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 140 }}>
      {data.map((v, i) => {
        const color = v > 7 ? "#7c3aed" : v > 6 ? "#8b5cf6" : "#a78bfa";
        return (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <span style={{ fontSize: 9, color, fontWeight: 700 }}>{v}</span>
            <div style={{ width: "100%", background: color, borderRadius: 4, height: `${(v / max) * 100}px`, boxShadow: `0 2px 8px ${color}66`, transition: "height 0.8s ease" }} />
            <span style={{ fontSize: 10, color: "#9ca3af" }}>M{i + 1}</span>
          </div>
        );
      })}
    </div>
  );
};

const ProgressBar = ({ label, value, color }) => (
  <div style={{ marginBottom: 18 }}>
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
      <span style={{ fontSize: 13, color: "#4b5563" }}>{label}</span>
      <span style={{ fontSize: 13, color, fontWeight: 700 }}>{value}%</span>
    </div>
    <div style={{ background: "#f3f4f6", borderRadius: 99, height: 6, overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${value}%`, background: `linear-gradient(90deg, ${color}, ${color}88)`, borderRadius: 99, transition: "width 1s ease" }} />
    </div>
  </div>
);

const StatRow = ({ label, value, color, icon }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #f3f4f6" }}>
    <span style={{ color: "#6b7280", fontSize: 13 }}>{icon} {label}</span>
    <span style={{ color, fontWeight: 700, fontSize: 15 }}>{value}</span>
  </div>
);

const PlayerTable = ({ players }) => (
  <div style={{ overflowX: "auto" }}>
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
          {["Player", "Matches", "Runs", "Wickets", "Impact", "Rating", "Status"].map((h) => (
            <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, color: "#9ca3af", letterSpacing: 2, fontWeight: 700 }}>{h.toUpperCase()}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {players.map((p, i) => <PlayerRow key={i} player={p} index={i} />)}
      </tbody>
    </table>
    {players.length === 0 && (
      <div style={{ textAlign: "center", padding: "48px 0", color: "#d1d5db" }}>
        <p style={{ fontSize: 32 }}>📊</p>
        <p style={{ fontSize: 14, marginTop: 8, color: "#9ca3af" }}>No player stats available yet</p>
      </div>
    )}
  </div>
);

const PlayerRow = ({ player, index }) => {
  const [hov, setHov] = useState(false);
  const impactColor = player.impactRate === "High" ? "#059669" : player.impactRate === "Medium" ? "#d97706" : "#dc2626";
  const impactBg = player.impactRate === "High" ? "#ecfdf5" : player.impactRate === "Medium" ? "#fffbeb" : "#fef2f2";
  const synced = player.userId != null;
  return (
    <tr onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background: hov ? "#f9fafb" : "transparent", transition: "background 0.2s", borderBottom: "1px solid #f3f4f6" }}>
      <td style={{ padding: "14px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#f5f3ff", border: "1px solid #ddd6fe", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#7c3aed" }}>
            {player.name?.charAt(0) || "?"}
          </div>
          <span style={{ color: "#111827", fontWeight: 500 }}>{player.name || "Unknown"}</span>
        </div>
      </td>
      <td style={{ padding: "14px 16px", color: "#6b7280" }}>{player.matches}</td>
      <td style={{ padding: "14px 16px", color: "#7c3aed", fontWeight: 600 }}>{player.runs}</td>
      <td style={{ padding: "14px 16px", color: "#6d28d9", fontWeight: 600 }}>{player.wickets}</td>
      <td style={{ padding: "14px 16px" }}>
        <span style={{ background: impactBg, color: impactColor, padding: "3px 10px", borderRadius: 99, fontSize: 12, fontWeight: 600 }}>{player.impactRate}</span>
      </td>
      <td style={{ padding: "14px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ color: "#f59e0b" }}>★</span>
          <span style={{ color: "#111827", fontWeight: 600 }}>{player.rating}</span>
        </div>
      </td>
      <td style={{ padding: "14px 16px" }}>
        <span style={{ background: synced ? "#ecfdf5" : "#fffbeb", color: synced ? "#059669" : "#d97706", padding: "3px 10px", borderRadius: 99, fontSize: 12, fontWeight: 600 }}>
          {synced ? "✓ Synced" : "Not registered"}
        </span>
      </td>
    </tr>
  );
};

const styles = {
  page: { minHeight: "100vh", background: "#f9fafb", padding: "32px 28px", position: "relative", overflow: "hidden", fontFamily: "'Segoe UI', sans-serif" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 },
  headerEyebrow: { fontSize: 11, color: "#7c3aed", letterSpacing: 4, fontWeight: 700, marginBottom: 4 },
  headerTitle: { fontSize: 32, fontWeight: 800, color: "#111827", margin: 0, letterSpacing: 0.5 },
  headerSub: { fontSize: 13, color: "#9ca3af", marginTop: 4 },
  headerBadge: { display: "flex", alignItems: "center", gap: 8, background: "#f5f3ff", border: "1px solid #ddd6fe", padding: "10px 18px", borderRadius: 12, fontSize: 13, color: "#6b7280" },
  pulseDot: { display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: "#059669", boxShadow: "0 0 8px #05996966" },
  tabs: { display: "flex", gap: 4, marginBottom: 24, background: "#f3f4f6", padding: 4, borderRadius: 12, width: "fit-content" },
  tab: { padding: "8px 22px", borderRadius: 9, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#9ca3af", background: "transparent", letterSpacing: 0.5, transition: "all 0.2s" },
  tabActive: { background: "#7c3aed", color: "#ffffff", boxShadow: "0 2px 12px #7c3aed44" },
  grid4: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 20 },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 },
  grid3: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 20 },
  glowCard: { background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 16, padding: "20px 22px" },
  cardLabel: { fontSize: 12, color: "#9ca3af", letterSpacing: 2, fontWeight: 600, marginBottom: 8, textTransform: "uppercase" },
  cardValue: { fontSize: 36, fontWeight: 800, letterSpacing: -1, lineHeight: 1 },
  cardSub: { fontSize: 12, color: "#d1d5db", marginTop: 4 },
  glassPanel: { background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 16, padding: "24px", boxShadow: "0 1px 4px #0000000a" },
  panelEye: { fontSize: 10, color: "#d1d5db", letterSpacing: 3, fontWeight: 700, marginBottom: 4 },
  panelTitle: { fontSize: 16, fontWeight: 700, color: "#111827", margin: 0 },
  panelSub: { fontSize: 12, color: "#9ca3af", marginTop: 2 },
  tableWrap: { background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 16, padding: "24px", boxShadow: "0 1px 4px #0000000a" },
  tableTitleRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  playerCount: { background: "#f5f3ff", color: "#7c3aed", border: "1px solid #ddd6fe", padding: "4px 14px", borderRadius: 99, fontSize: 12, fontWeight: 600 },
  loadWrap: { minHeight: "100vh", background: "#f9fafb", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" },
  spinner: { width: 40, height: 40, border: "3px solid #e5e7eb", borderTop: "3px solid #7c3aed", borderRadius: "50%", animation: "spin 0.8s linear infinite" },
};

const demoData = {
  totalPlayers: 14, totalRuns: 1245, totalRunsConceded: 980, battingAvg: "42.5", totalWickets: 48,
  boundaries: 145, sixes: 32, dotBalls: 210, wicketsLost: 48, avgRating: "4.4",
  matchRunsScored: [120, 80, 100, 140, 110, 130, 90, 150],
  matchRunsConceded: [90, 70, 85, 100, 95, 110, 75, 120],
  runRateTrend: [6.2, 5.5, 7.1, 6.8, 7.5, 6.3, 5.9, 7.2],
  battingOrder: { top: 80, middle: 65, lower: 40 },
  bowlingZones: { powerplay: 70, middle: 60, death: 50 },
  players: [
    { name: "Suraj", matches: 19, runs: 1200, wickets: 60, impactRate: "High", rating: 4.9, userId: "abc" },
    { name: "Ayush", matches: 19, runs: 897, wickets: 27, impactRate: "Medium", rating: 4.7, userId: "xyz" },
    { name: "Sonu", matches: 17, runs: 400, wickets: 16, impactRate: "Medium", rating: 4.0, userId: null },
    { name: "N ZN X", matches: 17, runs: 400, wickets: 16, impactRate: "High", rating: 4.0, userId: null },
  ],
};

export default TeamAnalytics;