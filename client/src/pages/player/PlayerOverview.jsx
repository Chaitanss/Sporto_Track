import { useEffect, useState } from "react";
import DrillSuggestion from "../../components/AI/DrillSuggestion";
import FitnessPredictor from "../../components/AI/FitnessPredictor";
import { getAllCoachesForSchedule, getEventsByCoach } from "../../Services/api";

// ── Real player from localStorage ──────────────────────────────
const getPlayerContext = () => {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return {
      name:        user.name        || "Player",
      position:    user.position    || "FWD #9",
      runs:        user.runs        || 0,
      wickets:     user.wickets     || 0,
      fitness:     user.fitness     || 80,
      coachRating: user.coachRating || 0,
      matches:     user.matches     || 0,
      strikeRate:  user.strikeRate  || 0,
    };
  } catch {
    return { name: "Player", position: "FWD #9", fitness: 80, runs: 0, wickets: 0, matches: 0, strikeRate: 0, coachRating: 0 };
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

// Color Swapped: Modern Tech Blue & Slate accents
const TYPE_STYLE = {
  MATCH:      { bg: "#e0f2fe", color: "#0369a1", label: "Match" },
  TRAINING:   { bg: "#f1f5f9", color: "#475569", label: "Training" },
  TOURNAMENT: { bg: "#ede9fe", color: "#6d28d9", label: "Tournament" },
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

const StatCard = ({ value, label, icon, accent }) => (
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
  }}>
    <div style={{ position: "absolute", top: 0, right: 0, width: 55, height: 55, background: `radial-gradient(circle at top right,${accent}22,transparent 70%)`, borderRadius: "0 14px 0 100%" }} />
    <span style={{ fontSize: 16 }}>{icon}</span>
    <p style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", lineHeight: 1, margin: 0 }}>{value}</p>
    <p style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", margin: 0 }}>{label}</p>
    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg,${accent},${accent}44)`, borderRadius: "0 0 14px 14px" }} />
  </div>
);

// ── Component ───────────────────────────────────────────────────
const PlayerOverview = () => {
  const playerCtx = getPlayerContext();

  const [coaches,         setCoaches]        = useState([]);
  const [selectedCoach,  setSelectedCoach]  = useState(null);
  const [events,          setEvents]         = useState([]);
  const [loadingCoaches, setLoadingCoaches] = useState(true);
  const [loadingEvents,  setLoadingEvents]  = useState(false);

  useEffect(() => {
    const init = async () => {
      setLoadingCoaches(true);
      const data = await getAllCoachesForSchedule();
      const list = data || [];
      setCoaches(list);
      if (list.length > 0) {
        setSelectedCoach(list[0]);
        setLoadingEvents(true);
        const ev = await getEventsByCoach(list[0]._id);
        setEvents(ev || []);
        setLoadingEvents(false);
      }
      setLoadingCoaches(false);
    };
    init();
  }, []);

  const handleSelectCoach = async (e) => {
    const coachId = e.target.value;
    if (!coachId) { setSelectedCoach(null); setEvents([]); return; }
    const coach = coaches.find((c) => c._id === coachId);
    setSelectedCoach(coach);
    setLoadingEvents(true);
    const data = await getEventsByCoach(coachId);
    setEvents(data || []);
    setLoadingEvents(false);
  };

  const today = new Date();
  const upcomingEvents = events
    .filter((e) => new Date(e.date) >= today)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 3);

  const firstName = playerCtx.name.split(" ")[0];

  return (
    <div style={{ fontFamily: "'DM Sans','Outfit','Segoe UI',sans-serif", color: "#0f172a", display: "flex", flexDirection: "column", gap: 14 }}>

      {/* ── HEADER ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 12,
            background: "linear-gradient(135deg,#3b82f6,#1d4ed8)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontWeight: 800, fontSize: 15,
            boxShadow: "0 4px 12px rgba(29,78,216,0.32)", flexShrink: 0,
          }}>
            {getInitials(playerCtx.name)}
          </div>
          <div>
            <p style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#3b82f6", margin: "0 0 1px" }}>Player Portal</p>
            <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0, letterSpacing: "-0.02em", color: "#0f172a", lineHeight: 1 }}>
              {getGreeting()}, {firstName} 👋
            </h1>
          </div>
        </div>
        <div style={{ background: "linear-gradient(135deg,#f1f5f9,#e2e8f0)", border: "1px solid #cbd5e1", borderRadius: 10, padding: "7px 12px", fontSize: 11.5, fontWeight: 700, color: "#475569", display: "flex", alignItems: "center", gap: 5 }}>
          <span>🏏</span> {playerCtx.position} · Season Active
        </div>
      </div>

      {/* ── COACH BANNER ── */}
      <div style={{
        background: "linear-gradient(135deg,#0f172a 0%,#1e293b 40%,#334155 100%)",
        borderRadius: 14, padding: "13px 18px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        boxShadow: "0 4px 18px rgba(15,23,42,0.22)", gap: 10, overflow: "hidden", position: "relative",
      }}>
        <div style={{ position: "absolute", top: -25, right: 80, width: 130, height: 130, borderRadius: "50%", background: "radial-gradient(circle,rgba(255,255,255,0.05),transparent 70%)", pointerEvents: "none" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>💬</div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 9.5, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 2px" }}>Coach Message</p>
            <p style={{ color: "#fff", fontSize: 12.5, margin: 0, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              "Great net practice yesterday! Keep your focus for the upcoming match 🏏"
            </p>
          </div>
        </div>
        <button style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 9, padding: "6px 14px", color: "#fff", fontWeight: 700, fontSize: 11.5, cursor: "pointer", flexShrink: 0, fontFamily: "inherit" }}>
          Reply
        </button>
      </div>

      {/* ── STAT CARDS ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
        <StatCard value={playerCtx.runs}             label="Runs This Season" icon="🏃" accent="#2563eb" />
        <StatCard value={playerCtx.wickets}          label="Wickets"           icon="🎯" accent="#0284c7" />
        <StatCard value={`${playerCtx.fitness}%`}   label="Fitness Level"     icon="💪" accent="#0f172a" />
        <StatCard value={playerCtx.coachRating || "—"} label="Coach Rating"   icon="⭐" accent="#7c3aed" />
      </div>

      {/* ── 3-COL GRID ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>

        {/* COL 1 — FITNESS */}
        <Card style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          <SLabel>My Fitness Overview</SLabel>

          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <div style={{ position: "relative", flexShrink: 0 }}>
              <svg width={70} height={70} viewBox="0 0 70 70">
                <circle cx={35} cy={35} r={28} fill="none" stroke="#f1f5f9" strokeWidth={7} />
                <circle cx={35} cy={35} r={28} fill="none" stroke="url(#gr1)" strokeWidth={7}
                  strokeDasharray={`${2 * Math.PI * 28 * (playerCtx.fitness / 100)} ${2 * Math.PI * 28}`}
                  strokeLinecap="round" transform="rotate(-90 35 35)" />
                <defs>
                  <linearGradient id="gr1" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" /><stop offset="100%" stopColor="#1d4ed8" />
                  </linearGradient>
                </defs>
              </svg>
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: "#1d4ed8" }}>{playerCtx.fitness}%</span>
              </div>
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 800, margin: "0 0 2px", color: "#0f172a" }}>
                {playerCtx.fitness >= 85 ? "Peak Condition" : playerCtx.fitness >= 60 ? "Good Shape" : "Needs Rest"}
              </p>
              <p style={{ fontSize: 11, color: "#64748b", margin: "0 0 7px" }}>Match Ready 🏏</p>
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                {["Stamina ✓", "Speed ✓"].map(t => (
                  <span key={t} style={{ background: "#eff6ff", color: "#1d4ed8", fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 999, border: "1px solid #dbeafe" }}>{t}</span>
                ))}
              </div>
            </div>
          </div>

          {/* History bars */}
          <div style={{ display: "flex", gap: 5, alignItems: "flex-end", marginBottom: 12 }}>
            {[52, 58, 70, 80, 90].map((h, i) => (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                <div style={{ width: "100%", height: h * 0.48, background: h < 65 ? "linear-gradient(180deg,#94a3b8,#cbd5e1)" : "linear-gradient(180deg,#3b82f6,#60a5fa)", borderRadius: 5 }} />
                <span style={{ fontSize: 8.5, color: "#94a3b8", fontWeight: 600 }}>W{i + 1}</span>
              </div>
            ))}
          </div>

          <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 10 }}>
            <p style={{ fontSize: 9.5, fontWeight: 700, color: "#64748b", letterSpacing: "0.06em", textTransform: "uppercase", margin: "0 0 6px", display: "flex", alignItems: "center", gap: 4 }}>🤖 AI Coach Suggestion</p>
            <DrillSuggestion playerContext={playerCtx} />
          </div>
        </Card>

        {/* COL 2 — PRACTICE + QUICK STATS */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

          <Card>
            <SLabel>Today's Practice</SLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 10 }}>
              {[
                { label: "Batting Nets",     dur: "30 min", icon: "🏏" },
                { label: "Bowling Practice", dur: "20 min", icon: "🎳" },
                { label: "Fielding Drills",  dur: "15 min", icon: "🤸" },
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 10px", background: "#f8fafc", borderRadius: 10, border: "1px solid #e2e8f0" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <span style={{ fontSize: 15 }}>{item.icon}</span>
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: "#1e293b" }}>{item.label}</span>
                  </div>
                  <span style={{ fontSize: 10.5, color: "#475569", fontWeight: 600, background: "#e2e8f0", padding: "2px 7px", borderRadius: 999 }}>{item.dur}</span>
                </div>
              ))}
            </div>
            <div style={{ background: "#f8fafc", borderRadius: 10, padding: "10px 12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <span style={{ fontSize: 10.5, fontWeight: 700, color: "#64748b" }}>Session Progress</span>
                <span style={{ fontSize: 10.5, fontWeight: 700, color: "#1d4ed8" }}>0 / 3</span>
              </div>
              <div style={{ height: 4, background: "#e2e8f0", borderRadius: 999 }}>
                <div style={{ height: 4, width: "0%", background: "linear-gradient(90deg,#3b82f6,#1d4ed8)", borderRadius: 999 }} />
              </div>
            </div>
          </Card>

          <Card>
            <SLabel>Quick Stats</SLabel>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
              {[
                { val: playerCtx.matches,           label: "Matches",     bg: "#f1f5f9", color: "#475569" },
                { val: `${playerCtx.strikeRate}%`, label: "Strike Rate", bg: "#eff6ff", color: "#1d4ed8" },
                { val: "3",                         label: "Fifties",     bg: "#f8fafc", color: "#0f172a" },
                { val: "1",                         label: "Centuries",   bg: "#ede9fe", color: "#6d28d9" },
              ].map((s, i) => (
                <div key={i} style={{ background: s.bg, borderRadius: 10, padding: "9px", textAlign: "center" }}>
                  <p style={{ fontSize: 18, fontWeight: 800, color: s.color, margin: "0 0 1px" }}>{s.val}</p>
                  <p style={{ fontSize: 9.5, color: "#64748b", fontWeight: 600, margin: 0, textTransform: "uppercase", letterSpacing: "0.04em" }}>{s.label}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* COL 3 — NEXT MATCH + REAL SCHEDULE */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

          {/* NEXT MATCH */}
          <Card>
            <SLabel>Next Match</SLabel>
            <div style={{ background: "linear-gradient(135deg,#f8fafc,#f1f5f9)", borderRadius: 12, padding: "12px 14px", border: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: "linear-gradient(135deg,#3b82f6,#1d4ed8)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, margin: "0 auto 4px" }}>🏠</div>
                <p style={{ fontSize: 9.5, fontWeight: 800, color: "#1d4ed8", margin: "0 0 1px", letterSpacing: "0.06em", textTransform: "uppercase" }}>Home</p>
                <p style={{ fontSize: 10.5, fontWeight: 600, color: "#0f172a", margin: 0 }}>Local Club</p>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#fff", border: "2px solid #cbd5e1", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 900, color: "#475569", margin: "0 auto 3px" }}>VS</div>
                <p style={{ fontSize: 9.5, color: "#94a3b8", fontWeight: 600, margin: 0 }}>Saturday</p>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: "linear-gradient(135deg,#64748b,#334155)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, margin: "0 auto 4px" }}>✈️</div>
                <p style={{ fontSize: 9.5, fontWeight: 800, color: "#334155", margin: "0 0 1px", letterSpacing: "0.06em", textTransform: "uppercase" }}>Away</p>
                <p style={{ fontSize: 10.5, fontWeight: 600, color: "#334155", margin: 0 }}>City Team</p>
              </div>
            </div>
            <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 10 }}>
              <p style={{ fontSize: 9.5, fontWeight: 700, color: "#64748b", letterSpacing: "0.06em", textTransform: "uppercase", margin: "0 0 6px", display: "flex", alignItems: "center", gap: 4 }}>🤖 AI Match Readiness</p>
              <FitnessPredictor playerContext={playerCtx} />
            </div>
          </Card>

          {/* REAL SCHEDULE */}
          <Card style={{ flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <SLabel style={{ margin: 0 }}>Upcoming Schedule</SLabel>
              {coaches.length > 1 && (
                <select
                  onChange={handleSelectCoach}
                  defaultValue={coaches[0]?._id || ""}
                  style={{ border: "1px solid #e2e8f0", borderRadius: 7, padding: "3px 7px", fontSize: 10.5, color: "#475569", fontFamily: "inherit", background: "#f8fafc", cursor: "pointer", outline: "none" }}
                >
                  {coaches.map((c) => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              )}
            </div>

            {(loadingCoaches || loadingEvents) ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "18px 0" }}>
                <div style={{ width: 22, height: 22, border: "3px solid #3b82f6", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
              </div>
            ) : upcomingEvents.length === 0 ? (
              <div style={{ textAlign: "center", padding: "14px 0", color: "#94a3b8", fontSize: 12 }}>
                📅 No upcoming events scheduled
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {upcomingEvents.map((event) => {
                  const d  = new Date(event.date);
                  const ts = getTypeStyle(event.type);
                  return (
                    <div key={event._id} style={{ display: "flex", gap: 8, alignItems: "center", padding: "9px 10px", background: "#f8fafc", borderRadius: 11, border: "1px solid #e2e8f0" }}>
                      {/* Date block */}
                      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 9, padding: "5px 8px", textAlign: "center", flexShrink: 0, minWidth: 38 }}>
                        <p style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", margin: 0, lineHeight: 1 }}>{d.getDate()}</p>
                        <p style={{ fontSize: 8.5, color: "#94a3b8", fontWeight: 700, margin: "2px 0 0", textTransform: "uppercase" }}>
                          {d.toLocaleDateString("en-US", { month: "short" })}
                        </p>
                      </div>
                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 12, fontWeight: 700, color: "#1e293b", margin: "0 0 1px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{event.title}</p>
                        <p style={{ fontSize: 10, color: "#94a3b8", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {event.details || (selectedCoach ? `Coach: ${selectedCoach.name}` : "")}
                        </p>
                      </div>
                      {/* Badge */}
                      <span style={{ background: ts.bg, color: ts.color, fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 999, flexShrink: 0 }}>
                        {ts.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PlayerOverview;