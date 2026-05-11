import React, { useEffect, useState } from "react";
import API from "../../Services/api";

const getInitials = (name = "") =>
  name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
};

const impactStyle = (rate) => {
  if (rate === "High")   return { color: "#22c55e", bg: "#f0fdf4", border: "#bbf7d0" };
  if (rate === "Medium") return { color: "#f59e0b", bg: "#fefce8", border: "#fde68a" };
  return                        { color: "#ef4444", bg: "#fef2f2", border: "#fecaca" };
};

const resultStyle = (result = "") => {
  const l = result.toLowerCase();
  if (l.includes("won") || l.includes("win") || l.includes("beat"))
    return { label: "W", color: "#22c55e", bg: "#f0fdf4" };
  if (l.includes("lost") || l.includes("lose") || l.includes("defeat"))
    return { label: "L", color: "#ef4444", bg: "#fef2f2" };
  return { label: "D", color: "#f59e0b", bg: "#fefce8" };
};

const Card = ({ children, style = {} }) => (
  <div style={{ background: "#ffffff", borderRadius: 18, boxShadow: "0 2px 16px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)", padding: "16px", ...style }}>
    {children}
  </div>
);

const SLabel = ({ children, style = {} }) => (
  <p style={{ fontSize: 12, fontWeight: 700, color: "#0f172a", margin: "0 0 10px", ...style }}>{children}</p>
);

const StatCard = ({ value, label, sub, icon, accent }) => (
  <div style={{ background: "#fff", borderRadius: 14, padding: "14px 12px", boxShadow: "0 2px 12px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", gap: 3 }}>
    <div style={{ position: "absolute", top: 0, right: 0, width: 55, height: 55, background: `radial-gradient(circle at top right,${accent}22,transparent 70%)`, borderRadius: "0 14px 0 100%" }} />
    <span style={{ fontSize: 16 }}>{icon}</span>
    <p style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", lineHeight: 1, margin: 0 }}>{value}</p>
    <p style={{ fontSize: 10.5, color: "#64748b", fontWeight: 600, margin: 0 }}>{label}</p>
    {sub && <p style={{ fontSize: 9.5, color: "#94a3b8", fontWeight: 500, margin: 0 }}>{sub}</p>}
    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg,${accent},${accent}44)`, borderRadius: "0 0 14px 14px" }} />
  </div>
);

const Spinner = () => (
  <div style={{ display: "flex", justifyContent: "center", padding: "16px 0" }}>
    <div style={{ width: 20, height: 20, border: "3px solid #7c3aed", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
  </div>
);

const Overview = () => {
  // ── Analyst context — name from localStorage, clubName from API ──
  const [analystCtx, setAnalystCtx] = useState(() => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      return { name: user.name || "Analyst", clubName: "FC Thunder" };
    } catch {
      return { name: "Analyst", clubName: "FC Thunder" };
    }
  });

  const firstName = analystCtx.name.split(" ")[0];

  const [players,       setPlayers]       = useState([]);
  const [loadingStats,  setLoadingStats]  = useState(true);
  const [matches,       setMatches]       = useState([]);
  const [loadingMatch,  setLoadingMatch]  = useState(true);
  const [teamData,      setTeamData]      = useState(null);
  const [loadingTeam,   setLoadingTeam]   = useState(true);

  useEffect(() => {
    // ── Fetch live club name ──
    API.get("/team/club-name")
      .then(r => { if (r.data?.clubName) setAnalystCtx(prev => ({ ...prev, clubName: r.data.clubName })); })
      .catch(() => {});

    // Season stats
    API.get("/season/analyst")
      .then(r => setPlayers(r.data || []))
      .catch(() => {})
      .finally(() => setLoadingStats(false));

    // Match records
    API.get("/match-records")
      .then(r => setMatches(r.data || []))
      .catch(() => {})
      .finally(() => setLoadingMatch(false));

    // Team analytics
    API.get("/season/team-analytics")
      .then(r => setTeamData(r.data || null))
      .catch(() => {})
      .finally(() => setLoadingTeam(false));
  }, []);

  const totalPlayers  = players.length;
  const totalRuns     = players.reduce((s, p) => s + (p.runs || 0), 0);
  const totalWickets  = players.reduce((s, p) => s + (p.wickets || 0), 0);
  const avgRating     = totalPlayers
    ? (players.reduce((s, p) => s + (p.rating || 0), 0) / totalPlayers).toFixed(1)
    : "—";

  const wins   = matches.filter(m => (m.result || "").toLowerCase().includes("won") || (m.result || "").toLowerCase().includes("win")).length;
  const losses = matches.filter(m => (m.result || "").toLowerCase().includes("lost") || (m.result || "").toLowerCase().includes("lose")).length;
  const draws  = matches.length - wins - losses;
  const winRate = matches.length ? Math.round((wins / matches.length) * 100) : 0;

  const topBatsman = [...players].sort((a, b) => (b.runs || 0) - (a.runs || 0))[0];
  const topBowler  = [...players].sort((a, b) => (b.wickets || 0) - (a.wickets || 0))[0];
  const topRated   = [...players].sort((a, b) => (b.rating || 0) - (a.rating || 0))[0];

  const recentMatches = [...matches]
    .sort((a, b) => new Date(b.matchDate || 0) - new Date(a.matchDate || 0))
    .slice(0, 3);

  const chartMatches = [...matches]
    .sort((a, b) => new Date(a.matchDate || 0) - new Date(b.matchDate || 0))
    .slice(-8);

  const maxRuns = Math.max(...chartMatches.map(m => parseInt(m.teamAScore) || 0), 1);

  const topPlayers = [...players]
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, 5);

  return (
    <div style={{ fontFamily: "'DM Sans','Outfit','Segoe UI',sans-serif", color: "#0f172a", display: "flex", flexDirection: "column", gap: 14 }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* ── HEADER ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: "linear-gradient(135deg,#7c3aed,#4c1d95)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 15, boxShadow: "0 4px 12px rgba(124,58,237,0.35)", flexShrink: 0 }}>
            {getInitials(analystCtx.name)}
          </div>
          <div>
            <p style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#7c3aed", margin: "0 0 1px" }}>Analyst Hub</p>
            <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0, letterSpacing: "-0.02em", color: "#0f172a", lineHeight: 1 }}>
              {getGreeting()}, {firstName} 👋
            </h1>
          </div>
        </div>
        <div style={{ background: "linear-gradient(135deg,#f5f3ff,#ede9fe)", border: "1px solid #c4b5fd", borderRadius: 10, padding: "7px 12px", fontSize: 11.5, fontWeight: 700, color: "#6d28d9", display: "flex", alignItems: "center", gap: 5 }}>
          <span>⚡</span> {analystCtx.clubName} · Season 2025
        </div>
      </div>

      {/* ── WAR ROOM BANNER ── */}
      <div style={{ background: "linear-gradient(135deg,#1e0a3c 0%,#3b0764 40%,#5b21b6 100%)", borderRadius: 14, padding: "13px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 4px 18px rgba(124,58,237,0.25)", gap: 10, overflow: "hidden", position: "relative" }}>
        <div style={{ position: "absolute", top: -25, right: 80, width: 130, height: 130, borderRadius: "50%", background: "radial-gradient(circle,rgba(167,139,250,0.12),transparent 70%)", pointerEvents: "none" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>⚡</div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 9.5, fontWeight: 700, color: "#c4b5fd", letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 2px" }}>War Room · Live Season Dashboard</p>
            <p style={{ color: "#fff", fontSize: 13, margin: 0, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {analystCtx.clubName} · {matches.length} matches · {totalPlayers} players tracked
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 7, flexShrink: 0 }}>
          {[
            { val: matches.length, label: "Matches", bg: "rgba(255,255,255,0.08)" },
            { val: `${wins}W`, label: "Wins", bg: "rgba(34,197,94,0.15)" },
            { val: `${winRate}%`, label: "Win Rate", bg: "rgba(167,139,250,0.15)" },
          ].map(b => (
            <div key={b.label} style={{ textAlign: "center", background: b.bg, borderRadius: 9, padding: "6px 12px" }}>
              <p style={{ fontSize: 16, fontWeight: 800, color: "#fff", margin: 0, lineHeight: 1 }}>{b.val}</p>
              <p style={{ fontSize: 8.5, color: "#c4b5fd", fontWeight: 600, margin: "2px 0 0", textTransform: "uppercase", letterSpacing: "0.07em" }}>{b.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── STAT CARDS ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 10 }}>
        <StatCard value={totalRuns}    label="Total Runs"      sub="Season aggregate" icon="🏏" accent="#7c3aed" />
        <StatCard value={totalWickets} label="Total Wickets"   sub="Season tally"     icon="🎯" accent="#2563eb" />
        <StatCard value={avgRating}    label="Avg Rating"      sub="Team average"     icon="⭐" accent="#f59e0b" />
        <StatCard value={`${winRate}%`} label="Win Rate"       sub={`${wins}W ${losses}L ${draws}D`} icon="🏆" accent="#22c55e" />
        <StatCard value={totalPlayers} label="Players Tracked" sub="All positions"    icon="👥" accent="#ec4899" />
      </div>

      {/* ── 3-COL MAIN GRID ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>

        {/* COL 1 */}
        <Card>
          <SLabel>Runs Per Match — Season</SLabel>
          {loadingMatch ? <Spinner /> : chartMatches.length === 0 ? (
            <div style={{ textAlign: "center", padding: "16px 0", color: "#94a3b8", fontSize: 12 }}>📊 No match data yet</div>
          ) : (
            <div style={{ display: "flex", alignItems: "flex-end", gap: 5, height: 90, marginBottom: 8 }}>
              {chartMatches.map((m, i) => {
                const score = parseInt(m.teamAScore) || 0;
                const pct   = Math.max((score / maxRuns) * 100, 8);
                const rs    = resultStyle(m.result || "");
                return (
                  <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                    <div style={{ width: "100%", height: `${pct * 0.85}px`, background: `linear-gradient(180deg,${rs.color},${rs.color}88)`, borderRadius: "5px 5px 0 0", minHeight: 8 }} />
                    <span style={{ fontSize: 8.5, color: "#94a3b8", fontWeight: 600 }}>M{i + 1}</span>
                  </div>
                );
              })}
            </div>
          )}
          <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
            {[{ c: "#22c55e", l: "Win" }, { c: "#ef4444", l: "Loss" }, { c: "#f59e0b", l: "Draw" }].map(x => (
              <div key={x.l} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: x.c }} />
                <span style={{ fontSize: 9.5, color: "#94a3b8", fontWeight: 600 }}>{x.l}</span>
              </div>
            ))}
          </div>
          <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 10 }}>
            <p style={{ fontSize: 10.5, fontWeight: 700, color: "#64748b", margin: "0 0 8px", letterSpacing: "0.04em", textTransform: "uppercase" }}>Season Record</p>
            <div style={{ display: "flex", gap: 8 }}>
              {[
                { val: wins,   label: "Wins",   color: "#22c55e", bg: "#f0fdf4" },
                { val: losses, label: "Losses", color: "#ef4444", bg: "#fef2f2" },
                { val: draws,  label: "Draws",  color: "#f59e0b", bg: "#fefce8" },
              ].map(s => (
                <div key={s.label} style={{ flex: 1, textAlign: "center", background: s.bg, borderRadius: 10, padding: "8px 4px" }}>
                  <p style={{ fontSize: 18, fontWeight: 800, color: s.color, margin: 0 }}>{s.val}</p>
                  <p style={{ fontSize: 9.5, color: "#94a3b8", fontWeight: 600, margin: 0, textTransform: "uppercase" }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* COL 2 */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Card>
            <SLabel>Top Performers</SLabel>
            {loadingStats ? <Spinner /> : players.length === 0 ? (
              <div style={{ textAlign: "center", padding: "10px 0", color: "#94a3b8", fontSize: 12 }}>No stats yet</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  { icon: "🏏", label: "Top Batsman",   player: topBatsman, val: topBatsman ? `${topBatsman.runs} runs`  : "—" },
                  { icon: "🎯", label: "Top Bowler",    player: topBowler,  val: topBowler  ? `${topBowler.wickets} wkts` : "—" },
                  { icon: "⭐", label: "Highest Rated", player: topRated,   val: topRated   ? `${topRated.rating} / 10`   : "—" },
                ].map((item, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", background: "#f8fafc", borderRadius: 11, border: "1px solid #e2e8f0" }}>
                    <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600, margin: 0, textTransform: "uppercase", letterSpacing: "0.04em" }}>{item.label}</p>
                      <p style={{ fontSize: 12.5, fontWeight: 700, color: "#1e293b", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {item.player?.player?.name || item.player?.name || "—"}
                      </p>
                    </div>
                    <span style={{ fontSize: 11.5, fontWeight: 700, color: "#7c3aed", flexShrink: 0 }}>{item.val}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
          <Card>
            <SLabel>Home vs Away</SLabel>
            {[
              { label: "Home Wins",  value: teamData?.battingOrder?.top    || winRate,                      color: "#7c3aed" },
              { label: "Away Wins",  value: teamData?.battingOrder?.middle || Math.max(winRate - 15, 0),   color: "#2563eb" },
              { label: "Home Runs",  value: teamData?.bowlingZones?.powerplay || 70,                        color: "#22c55e" },
              { label: "Away Runs",  value: teamData?.bowlingZones?.middle    || 55,                        color: "#f59e0b" },
            ].map((b, i) => (
              <div key={i} style={{ marginBottom: 9 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                  <span style={{ fontSize: 11.5, color: "#475569", fontWeight: 600 }}>{b.label}</span>
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: b.color }}>{b.value}%</span>
                </div>
                <div style={{ height: 5, background: "#e2e8f0", borderRadius: 999 }}>
                  <div style={{ height: 5, width: `${b.value}%`, background: `linear-gradient(90deg,${b.color},${b.color}88)`, borderRadius: 999 }} />
                </div>
              </div>
            ))}
          </Card>
        </div>

        {/* COL 3 */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Card>
            <SLabel>Recent Matches</SLabel>
            {loadingMatch ? <Spinner /> : recentMatches.length === 0 ? (
              <div style={{ textAlign: "center", padding: "10px 0", color: "#94a3b8", fontSize: 12 }}>No matches yet</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {recentMatches.map((m, i) => {
                  const rs = resultStyle(m.result || "");
                  const d  = m.matchDate ? new Date(m.matchDate) : null;
                  return (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 9, padding: "9px 10px", background: "#f8fafc", borderRadius: 11, border: "1px solid #e2e8f0" }}>
                      <div style={{ width: 28, height: 28, borderRadius: 8, background: rs.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <span style={{ fontSize: 12, fontWeight: 800, color: rs.color }}>{rs.label}</span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 12, fontWeight: 700, color: "#1e293b", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          vs {m.teamB || m.matchTitle || "—"}
                        </p>
                        <p style={{ fontSize: 10, color: "#94a3b8", margin: 0 }}>
                          {m.teamAScore || "—"}{d ? ` · ${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}` : ""}
                        </p>
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 700, color: rs.color, background: rs.bg, padding: "2px 7px", borderRadius: 999, flexShrink: 0 }}>
                        {m.result || "—"}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
          <Card style={{ flex: 1 }}>
            <SLabel>Player Stats</SLabel>
            {loadingStats ? <Spinner /> : topPlayers.length === 0 ? (
              <div style={{ textAlign: "center", padding: "10px 0", color: "#94a3b8", fontSize: 12 }}>No player data yet</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 40px 40px 50px", gap: 4, padding: "0 2px 4px", borderBottom: "1px solid #f1f5f9" }}>
                  {["Player", "Runs", "Wkts", "Impact"].map(h => (
                    <span key={h} style={{ fontSize: 9.5, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", textAlign: h === "Player" ? "left" : "center" }}>{h}</span>
                  ))}
                </div>
                {topPlayers.map((p, i) => {
                  const is   = impactStyle(p.impactRate);
                  const name = p.player?.name || p.name || "Player";
                  return (
                    <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 40px 40px 50px", gap: 4, alignItems: "center", padding: "6px 2px", borderBottom: i < topPlayers.length - 1 ? "1px solid #f8fafc" : "none" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 7, minWidth: 0 }}>
                        <div style={{ width: 24, height: 24, borderRadius: 7, background: "linear-gradient(135deg,#7c3aed,#4c1d95)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 9, flexShrink: 0 }}>
                          {getInitials(name)}
                        </div>
                        <span style={{ fontSize: 11.5, fontWeight: 600, color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</span>
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#7c3aed", textAlign: "center" }}>{p.runs || 0}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#2563eb", textAlign: "center" }}>{p.wickets || 0}</span>
                      <div style={{ display: "flex", justifyContent: "center" }}>
                        <span style={{ background: is.bg, color: is.color, fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 999, border: `1px solid ${is.border}` }}>
                          {p.impactRate || "—"}
                        </span>
                      </div>
                    </div>
                  );
                })}
                {players.length > 5 && (
                  <p style={{ fontSize: 10.5, color: "#94a3b8", textAlign: "center", margin: "2px 0 0", fontWeight: 600 }}>+{players.length - 5} more players</p>
                )}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Overview;