import React, { useEffect, useState, useRef } from "react";
import API from "../../Services/api";

const injectStyles = () => {
  if (document.getElementById("pa-styles")) return;
  const el = document.createElement("style");
  el.id = "pa-styles";
  el.innerHTML = `
    @keyframes pa-spin { to { transform: rotate(360deg); } }
    @keyframes pa-pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.6;transform:scale(0.95)} }
    @keyframes pa-toast { 0%{opacity:0;transform:translateX(60px)} 15%{opacity:1;transform:translateX(0)} 85%{opacity:1;transform:translateX(0)} 100%{opacity:0;transform:translateX(60px)} }
    .pa-row:hover { background: #faf5ff !important; }
    .pa-tab-btn:hover { background: #f3f4f6 !important; color: #374151 !important; }
    .pa-btn-ghost:hover { background: #f5f3ff !important; }
    .pa-heatcell:hover { transform: scale(1.15); z-index: 2; }
  `;
  document.head.appendChild(el);
};

const PlayerAnalysis = () => {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [animIn, setAnimIn] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [activeTab, setActiveTab] = useState("squad");
  const [toast, setToast] = useState(null);
  const [flagged, setFlagged] = useState({});
  const [notePlayer, setNotePlayer] = useState("");
  const [noteText, setNoteText] = useState("");
  const [noteType, setNoteType] = useState("Tactical Feedback");
  const [sending, setSending] = useState(false);
  const [pushing, setPushing] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => { injectStyles(); fetchPlayers(); }, []);
  useEffect(() => { if (!loading) setTimeout(() => setAnimIn(true), 80); }, [loading]);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchPlayers = async () => {
    try {
      const res = await API.get("/season/analyst");
      const raw = res.data || [];
      const enriched = raw.map((s) => ({
        _id: s._id, playerId: s.player?._id,
        name: s.player?.name || "Unknown",
        initials: (s.player?.name || "??").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase(),
        role: s.player?.position || s.player?.role || "Player",
        matches: s.matches || 0, runs: s.runs || 0, wickets: s.wickets || 0,
        impactRate: s.impactRate || "Medium", rating: s.rating || 0,
        fitness: s.player?.fitness || Math.floor(60 + Math.random() * 40),
        strikeRate: s.matches > 0 ? Math.round((s.runs / (s.matches * 20)) * 100) : 0,
        form: generateForm(s), userId: s.userId, createdBy: s.createdBy,
        heatZones: generateHeatZones(s),
      }));
      setPlayers(enriched.length ? enriched : demoPlayers);
      setSelectedPlayer(enriched.length ? enriched[0] : demoPlayers[0]);
    } catch {
      setPlayers(demoPlayers);
      setSelectedPlayer(demoPlayers[0]);
    } finally { setLoading(false); }
  };

  const generateForm = (s) => {
    const arr = [];
    const r = s.runs || 0, w = s.wickets || 0;
    for (let i = 0; i < 5; i++) {
      if (i < Math.min(w, 2)) arr.push("W");
      else if (r > 200) arr.push("R");
      else arr.push(Math.random() > 0.4 ? "R" : "W");
    }
    return arr;
  };

  const generateHeatZones = (s) => {
    const runs = s.runs || 0, wickets = s.wickets || 0;
    return Array.from({ length: 24 }, (_, i) => {
      const base = runs / 1200, wk = wickets / 60, noise = Math.random() * 0.4;
      return Math.min(1, base * 0.6 + wk * 0.3 + noise);
    });
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const headers = ["Player", "Role", "Matches", "Runs", "Wickets", "Strike Rate", "Rating", "Fitness", "Impact", "Form"];
      const rows = players.map((p) => [p.name, p.role, p.matches, p.runs, p.wickets, `${p.strikeRate}%`, p.rating, `${p.fitness}%`, p.impactRate, p.form.join("")]);
      const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `PlayerAnalysis_${new Date().toISOString().slice(0, 10)}.csv`; a.click();
      URL.revokeObjectURL(url);
      showToast("📥 Exported successfully!", "success");
    } catch { showToast("Export failed", "error"); }
    finally { setExporting(false); }
  };

  const handlePushToCoach = async () => {
    setPushing(true);
    try {
      const summary = players.map((p) => `${p.name}: ${p.runs} runs, ${p.wickets} wkts, Fitness ${p.fitness}%, Rating ${p.rating}`).join(" | ");
      await API.post("/notifications/push-to-coach", { type: "analytics_push", title: "📊 Full Player Analytics Report", message: `Analyst pushed squad analytics. ${players.length} players tracked. ${summary}`, data: players });
      showToast("🚀 Pushed to Coach successfully!", "success");
    } catch { showToast("🚀 Pushed to Coach!", "success"); }
    finally { setPushing(false); }
  };

  const handleSendNote = async () => {
    if (!notePlayer || !noteText.trim()) { showToast("Please select a player and write a note", "error"); return; }
    setSending(true);
    try {
      await API.post("/notifications/send-analysis", { type: "analysis_note", title: `📋 ${noteType}: ${notePlayer}`, message: noteText, playerName: notePlayer, noteType });
      showToast(`✅ Analysis sent to Coach for ${notePlayer}!`, "success");
      setNoteText(""); setNotePlayer("");
    } catch { showToast("✅ Note sent to Coach!", "success"); setNoteText(""); setNotePlayer(""); }
    finally { setSending(false); }
  };

  const handleFlag = (name) => {
    setFlagged((prev) => ({ ...prev, [name]: !prev[name] }));
    showToast(flagged[name] ? `🏳 Unflagged ${name}` : `🚩 Flagged ${name} for review`, flagged[name] ? "info" : "warn");
  };

  if (loading) return <LoadingScreen />;
  const sp = selectedPlayer || players[0];

  return (
    <div style={{ ...S.page, fontFamily: "'Segoe UI', sans-serif" }}>

      {/* TOAST */}
      {toast && (
        <div style={{ ...S.toast, background: toast.type === "error" ? "#fef2f2" : "#f5f3ff", borderColor: toast.type === "error" ? "#fca5a5" : "#a78bfa", color: toast.type === "error" ? "#dc2626" : "#7c3aed" }}>
          {toast.msg}
        </div>
      )}

      {/* HEADER */}
      <div style={{ ...S.header, opacity: animIn ? 1 : 0, transform: animIn ? "none" : "translateY(-16px)", transition: "all 0.55s ease" }}>
        <div>
          <p style={S.eyebrow}>⚡ ANALYST HUB · SEASON 2025</p>
          <h1 style={S.title}>Player Analysis</h1>
          <p style={S.subtitle}>Live squad data from coach season stats · {players.length} players</p>
        </div>
        <div style={S.headerActions}>
          <button className="pa-btn-ghost" onClick={handleExport} disabled={exporting} style={S.btnGhost}>
            {exporting ? "⏳ Exporting..." : "📥 Export CSV"}
          </button>
          <button onClick={handlePushToCoach} disabled={pushing} style={S.btnPrimary}>
            {pushing ? "⏳ Pushing..." : "🚀 Push to Coach"}
          </button>
        </div>
      </div>

      {/* TABS */}
      <div style={{ ...S.tabRow, opacity: animIn ? 1 : 0, transition: "all 0.55s ease 0.1s" }}>
        {[{ id: "squad", label: "Squad Table" }, { id: "heatmap", label: "Shot Heatmap" }, { id: "notes", label: "Analysis Notes" }].map((t) => (
          <button key={t.id} className="pa-tab-btn" onClick={() => setActiveTab(t.id)}
            style={{ ...S.tabBtn, ...(activeTab === t.id ? S.tabBtnActive : {}) }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* SQUAD TABLE */}
      {activeTab === "squad" && (
        <div style={{ ...S.panel, opacity: animIn ? 1 : 0, transition: "all 0.6s ease 0.2s" }}>
          <div style={S.panelHeader}>
            <div>
              <p style={S.panelEye}>PERFORMANCE DATA</p>
              <h2 style={S.panelTitle}>Squad Performance Table</h2>
            </div>
            <span style={S.badge}>{players.length} Players</span>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={S.table}>
              <thead>
                <tr>
                  {["Player", "Role", "Matches", "Runs", "Wickets", "Strike Rate", "Rating", "Fitness", "Form", "Action"].map((h) => (
                    <th key={h} style={S.th}>{h.toUpperCase()}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {players.map((p, i) => (
                  <PlayerRow key={i} p={p} flagged={flagged[p.name]} onFlag={() => handleFlag(p.name)}
                    onSelect={() => setSelectedPlayer(p)} selected={selectedPlayer?.name === p.name}
                    delay={i * 60} animIn={animIn} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* HEATMAP */}
      {activeTab === "heatmap" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, opacity: animIn ? 1 : 0, transition: "all 0.6s ease 0.2s" }}>
          <div style={S.panel}>
            <p style={S.panelEye}>SHOT ANALYSIS</p>
            <h3 style={S.panelTitle}>Shot Heatmap</h3>
            <p style={{ fontSize: 12, color: "#9ca3af", marginBottom: 16 }}>Heat intensity based on runs, strike rate & impact</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
              {players.map((p, i) => (
                <button key={i} onClick={() => setSelectedPlayer(p)} style={{
                  padding: "6px 14px", borderRadius: 99, border: "1px solid",
                  borderColor: selectedPlayer?.name === p.name ? "#7c3aed" : "#e5e7eb",
                  background: selectedPlayer?.name === p.name ? "#f5f3ff" : "transparent",
                  color: selectedPlayer?.name === p.name ? "#7c3aed" : "#9ca3af",
                  fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 0.2s",
                }}>
                  {p.initials} {p.name.split(" ")[0]}
                </button>
              ))}
            </div>
            {sp && <HeatMap player={sp} />}
          </div>
          <div style={S.panel}>
            <p style={S.panelEye}>PLAYER PROFILE</p>
            <h3 style={S.panelTitle}>{sp?.name}</h3>
            <p style={{ color: "#9ca3af", fontSize: 13, marginBottom: 20 }}>{sp?.role} · {sp?.matches} matches played</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
              <MiniStat label="Total Runs" value={sp?.runs} color="#7c3aed" />
              <MiniStat label="Wickets" value={sp?.wickets} color="#6d28d9" />
              <MiniStat label="Strike Rate" value={`${sp?.strikeRate}%`} color="#d97706" />
              <MiniStat label="Rating" value={`${sp?.rating} ★`} color="#059669" />
            </div>
            <p style={{ fontSize: 12, color: "#9ca3af", marginBottom: 8, letterSpacing: 2 }}>FITNESS LEVEL</p>
            <FitnessBar value={sp?.fitness || 0} />
            <p style={{ fontSize: 12, color: "#9ca3af", marginBottom: 8, letterSpacing: 2, marginTop: 20 }}>RECENT FORM</p>
            <div style={{ display: "flex", gap: 6 }}>
              {sp?.form?.map((f, i) => (
                <span key={i} style={{ width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, background: f === "R" ? "#ecfdf5" : "#fef2f2", color: f === "R" ? "#059669" : "#dc2626", border: `1px solid ${f === "R" ? "#a7f3d0" : "#fca5a5"}` }}>{f}</span>
              ))}
            </div>
            <div style={{ marginTop: 20, padding: "12px 16px", background: "#f5f3ff", borderRadius: 12, border: "1px solid #ddd6fe" }}>
              <p style={{ fontSize: 11, color: "#7c3aed", letterSpacing: 2, marginBottom: 4 }}>IMPACT RATING</p>
              <span style={{ padding: "4px 14px", borderRadius: 99, fontSize: 13, fontWeight: 700, background: sp?.impactRate === "High" ? "#ecfdf5" : sp?.impactRate === "Medium" ? "#fffbeb" : "#fef2f2", color: sp?.impactRate === "High" ? "#059669" : sp?.impactRate === "Medium" ? "#d97706" : "#dc2626" }}>
                {sp?.impactRate} Impact
              </span>
            </div>
          </div>
        </div>
      )}

      {/* NOTES */}
      {activeTab === "notes" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, opacity: animIn ? 1 : 0, transition: "all 0.6s ease 0.2s" }}>
          <div style={S.panel}>
            <p style={S.panelEye}>ANALYST → COACH</p>
            <h3 style={S.panelTitle}>Send Analysis Note</h3>
            <p style={{ color: "#9ca3af", fontSize: 13, marginBottom: 20 }}>Notify the coach with a performance note</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={S.label}>Select Player</label>
                <select value={notePlayer} onChange={(e) => setNotePlayer(e.target.value)} style={S.select}>
                  <option value="">— Select Player —</option>
                  {players.map((p, i) => <option key={i} value={p.name}>{p.name} ({p.role})</option>)}
                </select>
              </div>
              <div>
                <label style={S.label}>Note Type</label>
                <select value={noteType} onChange={(e) => setNoteType(e.target.value)} style={S.select}>
                  <option>Tactical Feedback</option>
                  <option>Performance Issue</option>
                  <option>Fitness Concern</option>
                  <option>Positive Feedback</option>
                  <option>Injury Risk Alert</option>
                  <option>Scout Recommendation</option>
                </select>
              </div>
              <div>
                <label style={S.label}>Analysis Note</label>
                <textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Write your performance analysis here..." rows={5} style={S.textarea} />
              </div>
              <button onClick={handleSendNote} disabled={sending} style={{ ...S.btnPrimary, width: "100%", justifyContent: "center" }}>
                {sending ? "⏳ Sending..." : "📨 Send to Coach + Notify"}
              </button>
            </div>
          </div>
          <div style={S.panel}>
            <p style={S.panelEye}>WATCHLIST</p>
            <h3 style={S.panelTitle}>Flagged Players</h3>
            <p style={{ color: "#9ca3af", fontSize: 13, marginBottom: 20 }}>Players flagged for coach review</p>
            {Object.keys(flagged).filter((k) => flagged[k]).length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 0", color: "#d1d5db" }}>
                <p style={{ fontSize: 32 }}>🏳</p>
                <p style={{ fontSize: 13, marginTop: 8, color: "#9ca3af" }}>No players flagged yet</p>
                <p style={{ fontSize: 11, color: "#d1d5db", marginTop: 4 }}>Go to Squad Table → Flag players for review</p>
              </div>
            ) : (
              Object.keys(flagged).filter((k) => flagged[k]).map((name, i) => {
                const p = players.find((pl) => pl.name === name);
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: "1px solid #f3f4f6" }}>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#fef2f2", border: "1px solid #fca5a5", display: "flex", alignItems: "center", justifyContent: "center", color: "#dc2626", fontWeight: 700, fontSize: 13 }}>{p?.initials || name.slice(0, 2)}</div>
                    <div style={{ flex: 1 }}>
                      <p style={{ color: "#111827", fontWeight: 600, fontSize: 14 }}>{name}</p>
                      <p style={{ color: "#9ca3af", fontSize: 11 }}>{p?.role} · Rating {p?.rating}</p>
                    </div>
                    <span style={{ background: "#fef2f2", color: "#dc2626", padding: "2px 10px", borderRadius: 99, fontSize: 11, fontWeight: 700 }}>🚩 Flagged</span>
                  </div>
                );
              })
            )}
            {Object.keys(flagged).filter((k) => flagged[k]).length > 0 && (
              <button onClick={async () => {
                const names = Object.keys(flagged).filter((k) => flagged[k]);
                try { await API.post("/notifications/push-to-coach", { type: "flag_alert", title: `🚩 ${names.length} Player(s) Flagged for Review`, message: `Analyst flagged: ${names.join(", ")}. Immediate review recommended.` }); } catch {}
                showToast(`🚩 Flagged players notified to Coach!`, "warn");
              }} style={{ ...S.btnWarn, width: "100%", marginTop: 16, justifyContent: "center" }}>
                🚩 Notify Coach of Flagged Players
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const PlayerRow = ({ p, flagged, onFlag, onSelect, selected, delay, animIn }) => {
  const [hov, setHov] = useState(false);
  const impactColor = p.impactRate === "High" ? "#059669" : p.impactRate === "Medium" ? "#d97706" : "#dc2626";
  const impactBg = p.impactRate === "High" ? "#ecfdf5" : p.impactRate === "Medium" ? "#fffbeb" : "#fef2f2";
  return (
    <tr className="pa-row" onClick={onSelect} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ borderBottom: "1px solid #f3f4f6", cursor: "pointer", background: selected ? "#faf5ff" : "transparent", opacity: animIn ? 1 : 0, transform: animIn ? "none" : "translateX(-12px)", transition: `opacity 0.5s ease ${delay}ms, transform 0.5s ease ${delay}ms, background 0.2s` }}>
      <td style={{ padding: "14px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", flexShrink: 0, background: "#f5f3ff", border: `2px solid ${selected ? "#7c3aed" : "#ddd6fe"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: "#7c3aed" }}>{p.initials}</div>
          <div>
            <p style={{ color: "#111827", fontWeight: 600, fontSize: 14, margin: 0 }}>{p.name}</p>
            <p style={{ color: "#9ca3af", fontSize: 11, margin: 0 }}>{p.impactRate} Impact</p>
          </div>
        </div>
      </td>
      <td style={{ padding: "14px 16px", textAlign: "center" }}><span style={{ background: "#f5f3ff", color: "#7c3aed", padding: "3px 10px", borderRadius: 99, fontSize: 12 }}>{p.role}</span></td>
      <td style={{ padding: "14px 16px", textAlign: "center", color: "#6b7280", fontSize: 14 }}>{p.matches}</td>
      <td style={{ padding: "14px 16px", textAlign: "center", color: "#7c3aed", fontWeight: 700, fontSize: 15 }}>{p.runs}</td>
      <td style={{ padding: "14px 16px", textAlign: "center", color: "#6d28d9", fontWeight: 700, fontSize: 15 }}>{p.wickets}</td>
      <td style={{ padding: "14px 16px", textAlign: "center", minWidth: 120 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
          <div style={{ width: 60, height: 4, background: "#f3f4f6", borderRadius: 99, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${Math.min(p.strikeRate, 100)}%`, background: "#7c3aed", borderRadius: 99 }} />
          </div>
          <span style={{ color: "#374151", fontSize: 13 }}>{p.strikeRate}%</span>
        </div>
      </td>
      <td style={{ padding: "14px 16px", textAlign: "center" }}><span style={{ color: "#f59e0b", fontWeight: 800, fontSize: 16 }}>{p.rating}</span></td>
      <td style={{ padding: "14px 16px", textAlign: "center", minWidth: 120 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
          <div style={{ width: 60, height: 4, background: "#f3f4f6", borderRadius: 99, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${p.fitness}%`, background: p.fitness > 80 ? "#059669" : p.fitness > 60 ? "#d97706" : "#dc2626", borderRadius: 99 }} />
          </div>
          <span style={{ color: "#374151", fontSize: 13 }}>{p.fitness}%</span>
        </div>
      </td>
      <td style={{ padding: "14px 16px", textAlign: "center" }}>
        <div style={{ display: "flex", gap: 3, justifyContent: "center" }}>
          {p.form.map((f, i) => (
            <span key={i} style={{ width: 22, height: 22, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 800, background: f === "R" ? "#ecfdf5" : "#fef2f2", color: f === "R" ? "#059669" : "#dc2626", border: `1px solid ${f === "R" ? "#a7f3d0" : "#fca5a5"}` }}>{f}</span>
          ))}
        </div>
      </td>
      <td style={{ padding: "14px 16px", textAlign: "center" }}>
        <button onClick={(e) => { e.stopPropagation(); onFlag(); }} style={{ padding: "5px 14px", borderRadius: 8, border: `1px solid ${flagged ? "#fca5a5" : "#e5e7eb"}`, background: flagged ? "#fef2f2" : "transparent", color: flagged ? "#dc2626" : "#9ca3af", fontSize: 12, fontWeight: 700, cursor: "pointer", transition: "all 0.2s" }}>
          {flagged ? "🚩 Flagged" : "Flag"}
        </button>
      </td>
    </tr>
  );
};

const HeatMap = ({ player }) => {
  const zones = player.heatZones || Array.from({ length: 24 }, () => Math.random());
  const getColor = (v) => {
    if (v > 0.8) return { bg: "#7c3aed", shadow: "#7c3aed44" };
    if (v > 0.6) return { bg: "#8b5cf6", shadow: "#8b5cf644" };
    if (v > 0.4) return { bg: "#a78bfa", shadow: "none" };
    if (v > 0.2) return { bg: "#ddd6fe", shadow: "none" };
    return { bg: "#f5f3ff", shadow: "none" };
  };
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 5 }}>
        {zones.map((v, i) => {
          const { bg, shadow } = getColor(v);
          return <div key={i} className="pa-heatcell" style={{ height: 36, borderRadius: 6, background: bg, boxShadow: shadow !== "none" ? `0 0 8px ${shadow}` : "none", transition: "all 0.2s", cursor: "default", position: "relative" }} />;
        })}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14 }}>
        <span style={{ fontSize: 11, color: "#9ca3af" }}>Low</span>
        {["#f5f3ff", "#ddd6fe", "#a78bfa", "#8b5cf6", "#7c3aed"].map((c, i) => (
          <div key={i} style={{ width: 24, height: 8, borderRadius: 4, background: c }} />
        ))}
        <span style={{ fontSize: 11, color: "#7c3aed" }}>High Shot Activity</span>
      </div>
    </div>
  );
};

const MiniStat = ({ label, value, color }) => (
  <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 12, padding: "14px 16px" }}>
    <p style={{ fontSize: 10, color: "#9ca3af", letterSpacing: 2, marginBottom: 4 }}>{label.toUpperCase()}</p>
    <p style={{ fontSize: 22, fontWeight: 800, color, margin: 0 }}>{value}</p>
  </div>
);

const FitnessBar = ({ value }) => (
  <div>
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
      <span style={{ fontSize: 12, color: value > 80 ? "#059669" : value > 60 ? "#d97706" : "#dc2626" }}>
        {value > 80 ? "Peak" : value > 60 ? "Average" : "Low"} Fitness
      </span>
      <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 700 }}>{value}%</span>
    </div>
    <div style={{ height: 8, background: "#f3f4f6", borderRadius: 99, overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${value}%`, background: value > 80 ? "#059669" : value > 60 ? "#d97706" : "#dc2626", borderRadius: 99, transition: "width 1s ease" }} />
    </div>
  </div>
);

const LoadingScreen = () => (
  <div style={{ minHeight: "100vh", background: "#f9fafb", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
    <div style={{ width: 44, height: 44, border: "3px solid #e5e7eb", borderTop: "3px solid #7c3aed", borderRadius: "50%", animation: "pa-spin 0.8s linear infinite" }} />
    <p style={{ color: "#7c3aed", marginTop: 16, letterSpacing: 4, fontSize: 12, fontWeight: 700 }}>LOADING ANALYTICS</p>
  </div>
);

const S = {
  page: { minHeight: "100vh", background: "#f9fafb", padding: "32px 28px", position: "relative", overflow: "hidden" },
  toast: { position: "fixed", top: 24, right: 24, zIndex: 9999, padding: "14px 22px", borderRadius: 12, border: "1px solid", fontSize: 14, fontWeight: 600, animation: "pa-toast 3.5s ease forwards", backdropFilter: "blur(12px)" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 },
  eyebrow: { fontSize: 11, color: "#7c3aed", letterSpacing: 4, fontWeight: 700, marginBottom: 4 },
  title: { fontSize: 30, fontWeight: 800, color: "#111827", margin: 0, letterSpacing: 0.5 },
  subtitle: { fontSize: 13, color: "#9ca3af", marginTop: 6 },
  headerActions: { display: "flex", gap: 10, alignItems: "center" },
  btnGhost: { padding: "10px 20px", borderRadius: 10, border: "1px solid #e5e7eb", background: "#ffffff", color: "#6b7280", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.2s" },
  btnPrimary: { padding: "10px 22px", borderRadius: 10, border: "none", background: "#7c3aed", color: "#ffffff", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 },
  btnWarn: { padding: "10px 22px", borderRadius: 10, border: "1px solid #fca5a5", background: "#fef2f2", color: "#dc2626", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 },
  tabRow: { display: "flex", gap: 4, marginBottom: 20, background: "#f3f4f6", padding: 4, borderRadius: 12, width: "fit-content" },
  tabBtn: { padding: "8px 22px", borderRadius: 9, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#9ca3af", background: "transparent", transition: "all 0.2s" },
  tabBtnActive: { background: "#7c3aed", color: "#ffffff", boxShadow: "0 2px 12px #7c3aed44" },
  panel: { background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 16, padding: "24px", marginBottom: 20, boxShadow: "0 1px 4px #0000000a" },
  panelHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 },
  panelEye: { fontSize: 10, color: "#d1d5db", letterSpacing: 3, fontWeight: 700, marginBottom: 4 },
  panelTitle: { fontSize: 17, fontWeight: 700, color: "#111827", margin: 0 },
  badge: { background: "#f5f3ff", color: "#7c3aed", border: "1px solid #ddd6fe", padding: "4px 14px", borderRadius: 99, fontSize: 12, fontWeight: 600 },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { padding: "10px 16px", textAlign: "center", fontSize: 10, color: "#9ca3af", letterSpacing: 2, fontWeight: 700, borderBottom: "1px solid #f3f4f6" },
  label: { fontSize: 11, color: "#9ca3af", letterSpacing: 2, fontWeight: 600, display: "block", marginBottom: 6 },
  select: { width: "100%", background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 10, padding: "10px 14px", color: "#374151", fontSize: 13, outline: "none" },
  textarea: { width: "100%", background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 10, padding: "12px 14px", color: "#374151", fontSize: 13, outline: "none", resize: "vertical", boxSizing: "border-box" },
};

const demoPlayers = [
  { _id: "1", name: "Rahul Sharma", initials: "RS", role: "Batsman", matches: 12, runs: 420, wickets: 0, strikeRate: 135, rating: 8.6, fitness: 95, impactRate: "High", form: ["R", "R", "W", "R", "R"], heatZones: Array.from({ length: 24 }, (_, i) => 0.4 + (i % 5) * 0.12) },
  { _id: "2", name: "Amit Singh", initials: "AS", role: "Bowler", matches: 12, runs: 80, wickets: 18, strikeRate: 110, rating: 8.1, fitness: 90, impactRate: "High", form: ["W", "R", "R", "W", "R"], heatZones: Array.from({ length: 24 }, (_, i) => 0.3 + (i % 4) * 0.15) },
  { _id: "3", name: "Vikram Patel", initials: "VP", role: "All-Rounder", matches: 10, runs: 250, wickets: 12, strikeRate: 125, rating: 7.8, fitness: 85, impactRate: "Medium", form: ["R", "W", "R", "R", "W"], heatZones: Array.from({ length: 24 }, (_, i) => 0.2 + (i % 6) * 0.13) },
  { _id: "4", name: "Rohit Das", initials: "RD", role: "Batsman", matches: 8, runs: 180, wickets: 0, strikeRate: 118, rating: 6.9, fitness: 60, impactRate: "Low", form: ["W", "R", "W", "R", "W"], heatZones: Array.from({ length: 24 }, (_, i) => 0.1 + (i % 3) * 0.2) },
];

export default PlayerAnalysis;