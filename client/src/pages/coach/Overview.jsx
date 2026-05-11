import React, { useEffect, useState } from "react";
import API from "../../Services/api";
import {
  getEvents,
  getFitnessReports,
  getFitnessSummary,
} from "../../Services/api";
import TrainingPlanAI from "../../components/AI/TrainingPlanAI";

// ── Real coach from localStorage ────────────────────────────────
const getCoachContext = () => {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return {
      name:      user.name      || "Coach",
      clubName:  user.clubName  || "Grassroot Club",
      position:  user.position  || "Head Coach",
    };
  } catch {
    return { name: "Coach", clubName: "Grassroot Club", position: "Head Coach" };
  }
};

const getInitials = (name = "") =>
  name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
};

// ── Fitness helpers ─────────────────────────────────────────────
const getFitnessStatus = (fit) => {
  if (fit >= 85) return { label: "Fit",     color: "#22c55e", bg: "#f0fdf4" };
  if (fit >= 60) return { label: "Monitor", color: "#f59e0b", bg: "#fefce8" };
  return               { label: "Injured",  color: "#ef4444", bg: "#fef2f2" };
};

// ── Event type styles ───────────────────────────────────────────
const TYPE_STYLE = {
  MATCH:      { bg: "#eff6ff", color: "#2563eb", label: "Match" },
  TRAINING:   { bg: "#f0fdf4", color: "#16a34a", label: "Training" },
  TOURNAMENT: { bg: "#fdf4ff", color: "#9333ea", label: "Tournament" },
};
const getTypeStyle = (type) =>
  TYPE_STYLE[type] || { bg: "#f8fafc", color: "#64748b", label: type };

// ── UI helpers ──────────────────────────────────────────────────
const Card = ({ children, style = {} }) => (
  <div style={{
    background: "#ffffff",
    borderRadius: 18,
    boxShadow: "0 2px 16px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)",
    padding: "16px",
    ...style,
  }}>
    {children}
  </div>
);

const SLabel = ({ children, style = {} }) => (
  <p style={{ fontSize: 12, fontWeight: 700, color: "#0f172a", margin: "0 0 10px", ...style }}>
    {children}
  </p>
);

const StatCard = ({ value, label, sub, icon, accent, topBorder }) => (
  <div style={{
    background: "#fff",
    borderRadius: 14,
    padding: "14px 12px",
    boxShadow: "0 2px 12px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)",
    position: "relative",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    gap: 3,
    borderTop: topBorder ? `3px solid ${accent}` : "none",
  }}>
    <div style={{ position: "absolute", top: 0, right: 0, width: 55, height: 55, background: `radial-gradient(circle at top right,${accent}22,transparent 70%)`, borderRadius: "0 14px 0 100%" }} />
    <span style={{ fontSize: 16 }}>{icon}</span>
    <p style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", lineHeight: 1, margin: 0 }}>{value}</p>
    <p style={{ fontSize: 10.5, color: "#64748b", fontWeight: 600, margin: 0 }}>{label}</p>
    {sub && <p style={{ fontSize: 9.5, color: "#94a3b8", fontWeight: 500, margin: 0 }}>{sub}</p>}
    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg,${accent},${accent}44)`, borderRadius: "0 0 14px 14px" }} />
  </div>
);

// ── Component ───────────────────────────────────────────────────
const Overview = () => {
  const coachCtx = getCoachContext();
  const firstName = coachCtx.name.split(" ").slice(-1)[0]; // last name or full

  // Squad
  const [squadPlayers, setSquadPlayers] = useState([]);
  const [loadingSquad, setLoadingSquad] = useState(true);

  // Fitness
  const [fitnessPlayers, setFitnessPlayers] = useState([]);
  const [fitnessSummary, setFitnessSummary] = useState({});
  const [loadingFitness, setLoadingFitness] = useState(true);

  // Events / Schedule
  const [events, setEvents]         = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);

  useEffect(() => {
    // Squad
    API.get("/players").then(r => { setSquadPlayers(r.data || []); setLoadingSquad(false); }).catch(() => setLoadingSquad(false));

    // Fitness
    Promise.all([getFitnessReports(), getFitnessSummary()])
      .then(([rep, sum]) => { setFitnessPlayers(rep.data || []); setFitnessSummary(sum.data || {}); })
      .catch(() => {})
      .finally(() => setLoadingFitness(false));

    // Events
    getEvents().then(r => { setEvents(r.data || []); setLoadingEvents(false); }).catch(() => setLoadingEvents(false));
  }, []);

  // Derived
  const squadSize    = squadPlayers.length;
  const fitCount     = fitnessSummary.fit     || 0;
  const injuredCount = fitnessSummary.injured || 0;
  const avgFitness   = fitnessSummary.avg     || 0;

  const today = new Date();
  const upcomingEvents = events
    .filter(e => new Date(e.date) >= today)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 3);

  // Next match for banner
  const nextMatch = upcomingEvents.find(e => e.type === "MATCH") || upcomingEvents[0];

  // Squad AI context
  const squadContext = {
    coachName:   coachCtx.name,
    clubName:    coachCtx.clubName,
    nextMatch:   nextMatch ? nextMatch.title : "Upcoming",
    daysToMatch: nextMatch ? Math.max(0, Math.ceil((new Date(nextMatch.date) - today) / 86400000)) : 0,
    avgFitness:  Number(avgFitness),
    squadSize,
  };

  // Top 4 squad players for roster preview
  const rosterPreview = squadPlayers.slice(0, 4);

  // Drills summary (static session plan from DrillLibrary defaults)
  const sessionDrills = [
    { label: "Batting Practice",   dur: "30 min", icon: "🏏" },
    { label: "Fitness Drills",     dur: "20 min", icon: "🏃" },
    { label: "Bowling Accuracy",   dur: "25 min", icon: "🎯" },
    { label: "Strategy Session",   dur: "15 min", icon: "🧠" },
  ];

  const Spinner = () => (
    <div style={{ display: "flex", justifyContent: "center", padding: "16px 0" }}>
      <div style={{ width: 20, height: 20, border: "3px solid #16a34a", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
    </div>
  );

  return (
    <div style={{ fontFamily: "'DM Sans','Outfit','Segoe UI',sans-serif", color: "#0f172a", display: "flex", flexDirection: "column", gap: 14 }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* ── HEADER ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 12,
            background: "linear-gradient(135deg,#16a34a,#052e16)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontWeight: 800, fontSize: 15,
            boxShadow: "0 4px 12px rgba(21,128,61,0.35)", flexShrink: 0,
          }}>
            {getInitials(coachCtx.name)}
          </div>
          <div>
            <p style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#16a34a", margin: "0 0 1px" }}>Coach Portal</p>
            <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0, letterSpacing: "-0.02em", color: "#0f172a", lineHeight: 1 }}>
              {getGreeting()}, Coach {firstName} 👋
            </h1>
          </div>
        </div>
        <div style={{ background: "linear-gradient(135deg,#dcfce7,#bbf7d0)", border: "1px solid #86efac", borderRadius: 10, padding: "7px 12px", fontSize: 11.5, fontWeight: 700, color: "#15803d", display: "flex", alignItems: "center", gap: 5 }}>
          <span>🏏</span> {coachCtx.clubName} · Season Active
        </div>
      </div>

      {/* ── NEXT MATCH BANNER ── */}
      <div style={{
        background: "linear-gradient(135deg,#052e16 0%,#14532d 45%,#166534 100%)",
        borderRadius: 14, padding: "13px 18px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        boxShadow: "0 4px 18px rgba(21,128,61,0.22)", gap: 10, overflow: "hidden", position: "relative",
      }}>
        <div style={{ position: "absolute", top: -25, right: 80, width: 130, height: 130, borderRadius: "50%", background: "radial-gradient(circle,rgba(134,239,172,0.1),transparent 70%)", pointerEvents: "none" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>📋</div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 9.5, fontWeight: 700, color: "#86efac", letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 2px" }}>
              {nextMatch ? "Next Event" : "No Upcoming Events"}
            </p>
            <p style={{ color: "#fff", fontSize: 13, margin: 0, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {nextMatch
                ? `${nextMatch.title} · ${new Date(nextMatch.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}`
                : "Add events in Schedule"}
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          <div style={{ textAlign: "center", background: "rgba(255,255,255,0.08)", borderRadius: 10, padding: "7px 14px" }}>
            <p style={{ fontSize: 18, fontWeight: 800, color: "#fff", margin: 0, lineHeight: 1 }}>{squadContext.daysToMatch}</p>
            <p style={{ fontSize: 9, color: "#86efac", fontWeight: 600, margin: "2px 0 0", textTransform: "uppercase", letterSpacing: "0.08em" }}>Days Left</p>
          </div>
          <div style={{ textAlign: "center", background: "rgba(255,255,255,0.08)", borderRadius: 10, padding: "7px 14px" }}>
            <p style={{ fontSize: 18, fontWeight: 800, color: "#fff", margin: 0, lineHeight: 1 }}>{squadSize}</p>
            <p style={{ fontSize: 9, color: "#86efac", fontWeight: 600, margin: "2px 0 0", textTransform: "uppercase", letterSpacing: "0.08em" }}>Squad</p>
          </div>
        </div>
      </div>

      {/* ── STAT CARDS ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
        <StatCard value={`${avgFitness}%`}  label="Team Fitness"   sub="Target: 90%"              icon="💪" accent="#22c55e" />
        <StatCard value={squadSize}         label="Squad Size"      sub={`${fitCount} avail · ${injuredCount} injured`} icon="👥" accent="#3b82f6" />
        <StatCard value={fitCount}          label="Fully Fit"       sub="Ready to play"             icon="✅" accent="#16a34a" />
        <StatCard value={injuredCount}      label="Under Review"    sub="Needs attention"           icon="🚨" accent="#ef4444" />
      </div>

      {/* ── 3-COL GRID ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>

        {/* COL 1 — SQUAD ROSTER */}
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <SLabel style={{ margin: 0 }}>Squad Roster</SLabel>
            <span style={{ background: "#dcfce7", color: "#16a34a", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 999, border: "1px solid #bbf7d0" }}>
              {squadSize} Players
            </span>
          </div>

          {loadingSquad ? <Spinner /> : squadPlayers.length === 0 ? (
            <div style={{ textAlign: "center", padding: "16px 0", color: "#94a3b8", fontSize: 12 }}>
              🏏 No players in squad yet
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {squadPlayers.slice(0, 5).map((p, i) => {
                const fs = getFitnessStatus(p.fitness || 80);
                return (
                  <div key={p._id || i} style={{ display: "flex", alignItems: "center", gap: 9, padding: "8px 10px", background: "#f8fafc", borderRadius: 11, border: "1px solid #e2e8f0" }}>
                    <div style={{ width: 30, height: 30, borderRadius: 9, background: "linear-gradient(135deg,#16a34a,#052e16)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 11, flexShrink: 0 }}>
                      {getInitials(p.name)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 12, fontWeight: 700, color: "#1e293b", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</p>
                      <p style={{ fontSize: 10, color: "#94a3b8", margin: 0 }}>{p.position || "—"}</p>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3, flexShrink: 0 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: fs.color }}>{p.fitness ? `${p.fitness}%` : "—"}</span>
                      <span style={{ background: fs.bg, color: fs.color, fontSize: 8.5, fontWeight: 700, padding: "1px 6px", borderRadius: 999 }}>{fs.label}</span>
                    </div>
                  </div>
                );
              })}
              {squadPlayers.length > 5 && (
                <p style={{ fontSize: 10.5, color: "#94a3b8", textAlign: "center", margin: "2px 0 0", fontWeight: 600 }}>+{squadPlayers.length - 5} more players</p>
              )}
            </div>
          )}

          {/* AI Training Plan */}
          <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 12, marginTop: 12 }}>
            <p style={{ fontSize: 9.5, fontWeight: 700, color: "#64748b", letterSpacing: "0.06em", textTransform: "uppercase", margin: "0 0 7px", display: "flex", alignItems: "center", gap: 4 }}>🤖 AI Training Plan</p>
            <TrainingPlanAI squadContext={squadContext} />
          </div>
        </Card>

        {/* COL 2 — FITNESS + TODAY'S TRAINING */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

          {/* FITNESS SUMMARY */}
          <Card>
            <SLabel>Team Fitness Overview</SLabel>

            {/* Big ring */}
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
              <div style={{ position: "relative", flexShrink: 0 }}>
                <svg width={70} height={70} viewBox="0 0 70 70">
                  <circle cx={35} cy={35} r={28} fill="none" stroke="#f0fdf4" strokeWidth={7} />
                  <circle cx={35} cy={35} r={28} fill="none" stroke="url(#cgr)" strokeWidth={7}
                    strokeDasharray={`${2 * Math.PI * 28 * (Math.min(Number(avgFitness), 100) / 100)} ${2 * Math.PI * 28}`}
                    strokeLinecap="round" transform="rotate(-90 35 35)" />
                  <defs>
                    <linearGradient id="cgr" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#22c55e" /><stop offset="100%" stopColor="#16a34a" />
                    </linearGradient>
                  </defs>
                </svg>
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: "#15803d" }}>{avgFitness}%</span>
                </div>
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 800, margin: "0 0 2px", color: "#0f172a" }}>
                  {Number(avgFitness) >= 85 ? "Team Peak" : Number(avgFitness) >= 70 ? "Good Shape" : "Needs Work"}
                </p>
                <p style={{ fontSize: 11, color: "#64748b", margin: "0 0 7px" }}>Avg Team Fitness</p>
                <div style={{ display: "flex", gap: 5 }}>
                  {[
                    { label: `${fitCount} Fit`,       color: "#16a34a", bg: "#dcfce7" },
                    { label: `${injuredCount} Out`,   color: "#ef4444", bg: "#fef2f2" },
                  ].map(t => (
                    <span key={t.label} style={{ background: t.bg, color: t.color, fontSize: 9.5, fontWeight: 700, padding: "2px 7px", borderRadius: 999 }}>{t.label}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Individual bars */}
            {loadingFitness ? <Spinner /> : fitnessPlayers.slice(0, 4).map((p, i) => {
              const fs = getFitnessStatus(p.fitness);
              return (
                <div key={i} style={{ marginBottom: 7 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#475569" }}>{p.player?.name || "Player"}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: fs.color }}>{p.fitness}%</span>
                  </div>
                  <div style={{ height: 5, background: "#e2e8f0", borderRadius: 999 }}>
                    <div style={{ height: 5, width: `${p.fitness}%`, background: fs.color, borderRadius: 999, transition: "width 0.4s" }} />
                  </div>
                </div>
              );
            })}
            {fitnessPlayers.length === 0 && !loadingFitness && (
              <p style={{ fontSize: 11, color: "#94a3b8", textAlign: "center", margin: "6px 0" }}>No fitness reports yet</p>
            )}
          </Card>

          {/* TODAY'S TRAINING */}
          <Card>
            <SLabel>Today's Training</SLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {sessionDrills.map((d, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", background: "#f8fafc", borderRadius: 10, border: "1px solid #e2e8f0" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <span style={{ fontSize: 14 }}>{d.icon}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#1e293b" }}>{d.label}</span>
                  </div>
                  <span style={{ fontSize: 10, color: "#64748b", fontWeight: 600, background: "#e2e8f0", padding: "2px 7px", borderRadius: 999 }}>{d.dur}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* COL 3 — SCHEDULE + NOTES */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

          {/* UPCOMING SCHEDULE */}
          <Card>
            <SLabel>Upcoming Schedule</SLabel>

            {loadingEvents ? <Spinner /> : upcomingEvents.length === 0 ? (
              <div style={{ textAlign: "center", padding: "14px 0", color: "#94a3b8", fontSize: 12 }}>📅 No upcoming events</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {upcomingEvents.map((event) => {
                  const d  = new Date(event.date);
                  const ts = getTypeStyle(event.type);
                  const daysAway = Math.ceil((d - today) / 86400000);
                  return (
                    <div key={event._id} style={{ display: "flex", gap: 8, alignItems: "center", padding: "9px 10px", background: "#f8fafc", borderRadius: 11, border: "1px solid #e2e8f0" }}>
                      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 9, padding: "5px 8px", textAlign: "center", flexShrink: 0, minWidth: 38 }}>
                        <p style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", margin: 0, lineHeight: 1 }}>{d.getDate()}</p>
                        <p style={{ fontSize: 8.5, color: "#94a3b8", fontWeight: 700, margin: "2px 0 0", textTransform: "uppercase" }}>
                          {d.toLocaleDateString("en-US", { month: "short" })}
                        </p>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 12, fontWeight: 700, color: "#1e293b", margin: "0 0 1px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{event.title}</p>
                        <p style={{ fontSize: 10, color: "#94a3b8", margin: 0 }}>
                          {daysAway === 0 ? "Today" : daysAway === 1 ? "Tomorrow" : `In ${daysAway} days`}
                        </p>
                      </div>
                      <span style={{ background: ts.bg, color: ts.color, fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 999, flexShrink: 0 }}>{ts.label}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* COACH NOTES */}
          <Card style={{ flex: 1 }}>
            <SLabel>Coach Notes</SLabel>
            <textarea
              placeholder="Add match notes, tactics, observations..."
              rows={4}
              style={{
                width: "100%", border: "1px solid #e2e8f0", borderRadius: 10,
                padding: "10px 12px", fontSize: 12.5, color: "#1e293b",
                fontFamily: "inherit", resize: "none", outline: "none",
                background: "#f8fafc", boxSizing: "border-box",
                lineHeight: 1.5,
              }}
              onFocus={e => e.target.style.borderColor = "#16a34a"}
              onBlur={e => e.target.style.borderColor = "#e2e8f0"}
            />
            <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
              {[
                { label: "#Tactics",  bg: "#eff6ff", color: "#2563eb" },
                { label: "#Fitness",  bg: "#f0fdf4", color: "#16a34a" },
                { label: "#Injury",   bg: "#fef2f2", color: "#ef4444" },
              ].map(tag => (
                <span key={tag.label} style={{ background: tag.bg, color: tag.color, fontSize: 10.5, fontWeight: 700, padding: "3px 10px", borderRadius: 999, cursor: "pointer" }}>{tag.label}</span>
              ))}
            </div>
            <div style={{ marginTop: 10 }}>
              <div style={{ background: "#f8fafc", borderRadius: 10, padding: "10px 12px" }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: "#64748b", letterSpacing: "0.05em", textTransform: "uppercase", margin: "0 0 7px" }}>Key Tactical Points</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  {[
                    { icon: "🏏", text: "Attack early with slip fielders" },
                    { icon: "⚡", text: "Aggressive field in powerplay" },
                    { icon: "🛡️", text: "Spread field in death overs" },
                    { icon: "🎯", text: "Yorkers in final overs" },
                  ].map((pt, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 11.5, color: "#475569" }}>
                      <span>{pt.icon}</span><span>{pt.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Overview;