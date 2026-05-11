import { useEffect, useState, useRef } from "react";
import { broadcastMessage, getBroadcastHistory } from "../../Services/api";

// ─── helpers ────────────────────────────────────────────────────────────────
const fmtDate = (d) => {
  if (!d) return "";
  const date = new Date(d);
  const today = new Date();
  const diff = today - date;
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString([], { day: "numeric", month: "short" });
};

const MESSAGE_TYPES = [
  { value: "Pre-Match Briefing",   icon: "⚡", color: "#92400E", bg: "#FFFBEB", border: "#FDE68A" },
  { value: "Fitness Alert",        icon: "💪", color: "#BE123C", bg: "#FFF1F2", border: "#FECDD3" },
  { value: "Tactical Update",      icon: "🎯", color: "#1E40AF", bg: "#EFF6FF", border: "#BFDBFE" },
  { value: "Performance Review",   icon: "📊", color: "#5B21B6", bg: "#EDE9FE", border: "#DDD6FE" },
  { value: "Training Schedule",    icon: "🗓️", color: "#065F46", bg: "#D1FAE5", border: "#6EE7B7" },
  { value: "Match Report",         icon: "📋", color: "#0E7490", bg: "#ECFEFF", border: "#A5F3FC" },
  { value: "General Announcement", icon: "📣", color: "#9A3412", bg: "#FFF7ED", border: "#FED7AA" },
  { value: "Injury Update",        icon: "🏥", color: "#9D174D", bg: "#FDF2F8", border: "#FBCFE8" },
];

const TARGETS = [
  { key: "coach",   label: "Head Coach",   icon: "🧠", desc: "Sends directly to all coaches" },
  { key: "players", label: "All Players",  icon: "👥", desc: "Sends to every squad player" },
];

// ─── component ──────────────────────────────────────────────────────────────
export default function Broadcast() {
  const [sendTo, setSendTo]       = useState([]);
  const [msgType, setMsgType]     = useState(MESSAGE_TYPES[0]);
  const [subject, setSubject]     = useState("");
  const [body, setBody]           = useState("");
  const [history, setHistory]     = useState([]);
  const [sending, setSending]     = useState(false);
  const [toast, setToast]         = useState(null);
  const [preview, setPreview]     = useState(null);
  const [charCount, setCharCount] = useState(0);
  const bodyRef = useRef();

  useEffect(() => { fetchHistory(); }, []);

  const fetchHistory = async () => {
    try {
      const res = await getBroadcastHistory();
      setHistory(res.data);
    } catch { /* silently ignore */ }
  };

  const toggleTarget = (key) => {
    setSendTo((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const showToast = (text, ok = true) => {
    setToast({ text, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const handleSend = async () => {
    if (!sendTo.length)   return showToast("Select at least one recipient.", false);
    if (!subject.trim())  return showToast("Subject cannot be empty.", false);
    if (!body.trim())     return showToast("Message body cannot be empty.", false);

    setSending(true);
    try {
      const res = await broadcastMessage({
        sendTo,
        messageType: msgType.value,
        subject: subject.trim(),
        message: body.trim(),
      });

      showToast(`✅ Sent to ${res.data.recipients?.length || 0} recipient(s)`);
      setSubject("");
      setBody("");
      setCharCount(0);
      setSendTo([]);
      fetchHistory();
    } catch (err) {
      showToast(err?.response?.data?.message || "Failed to send.", false);
    } finally {
      setSending(false);
    }
  };

  const selectedType = msgType;

  return (
    <div style={styles.root}>
      <style>{css}</style>

      {/* ── TOAST ── */}
      {toast && (
        <div style={{
          position:"fixed",top:24,right:24,zIndex:9999,
          padding:"12px 20px",borderRadius:12,fontSize:13,fontWeight:600,
          background: toast.ok ? "#F5F3FF" : "#FFF1F2",
          border: `1.5px solid ${toast.ok ? "#DDD6FE" : "#FECDD3"}`,
          color: toast.ok ? "#5B21B6" : "#BE123C",
          boxShadow:"0 4px 24px rgba(124,58,237,0.12)",
          animation:"bcSlideIn 0.3s ease",
        }}>
          {toast.text}
        </div>
      )}

      {/* ── HEADER ── */}
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.pageTitle}>
            <span style={{ color:"#7C3AED" }}>📡</span> Group Broadcast
          </h1>
          <p style={styles.pageSubtitle}>
            Send targeted messages to coaches &amp; players instantly
          </p>
        </div>
        <div style={styles.statsRow}>
          <StatPill label="Sent Today" value={history.filter(h => fmtDate(h.createdAt).startsWith("Today")).length} color="#7C3AED" bg="#EDE9FE" border="#DDD6FE" />
          <StatPill label="Total Sent"  value={history.length} color="#5B21B6" bg="#F5F3FF" border="#DDD6FE" />
        </div>
      </div>

      {/* ── BODY GRID ── */}
      <div style={styles.grid}>

        {/* ── LEFT: COMPOSE ── */}
        <div style={styles.card}>

          {/* card header */}
          <div style={styles.cardHeader}>
            <span style={{ fontSize:18 }}>✍️</span>
            <span style={styles.cardTitle}>New Broadcast Message</span>
          </div>

          {/* RECIPIENT TARGETS */}
          <label style={styles.fieldLabel}>SEND TO</label>
          <div style={styles.targetRow}>
            {TARGETS.map((t) => {
              const active = sendTo.includes(t.key);
              return (
                <button
                  key={t.key}
                  onClick={() => toggleTarget(t.key)}
                  className="bc-target-btn"
                  style={{
                    ...styles.targetBtn,
                    borderColor:  active ? "#7C3AED" : "#DDD6FE",
                    background:   active ? "#F5F3FF" : "#FAFAFA",
                    boxShadow:    active ? "0 0 0 2px #EDE9FE" : "none",
                  }}
                >
                  <span style={styles.targetIcon}>{t.icon}</span>
                  <div>
                    <p style={{ ...styles.targetLabel, color: active ? "#5B21B6" : "#3B0764" }}>
                      {t.label}
                    </p>
                    <p style={styles.targetDesc}>{t.desc}</p>
                  </div>
                  <div style={{
                    ...styles.targetCheck,
                    background:   active ? "#7C3AED" : "transparent",
                    borderColor:  active ? "#7C3AED" : "#DDD6FE",
                  }}>
                    {active && <span style={{ color: "#fff", fontSize: 11, fontWeight: 800 }}>✓</span>}
                  </div>
                </button>
              );
            })}
          </div>

          {/* MESSAGE TYPE */}
          <label style={styles.fieldLabel}>MESSAGE TYPE</label>
          <div style={styles.typeGrid}>
            {MESSAGE_TYPES.map((t) => {
              const active = msgType.value === t.value;
              return (
                <button
                  key={t.value}
                  onClick={() => setMsgType(t)}
                  title={t.value}
                  className="bc-type-chip"
                  style={{
                    ...styles.typeChip,
                    borderColor: active ? t.color : "#EDE9FE",
                    background:  active ? t.bg : "#FAFAFA",
                    color:       active ? t.color : "#A78BFA",
                  }}
                >
                  <span style={{ fontSize:16 }}>{t.icon}</span>
                  <span style={{ fontSize:11, fontWeight:600 }}>{t.value}</span>
                </button>
              );
            })}
          </div>

          {/* Live type badge */}
          <div style={{
            ...styles.typeBadge,
            background:  selectedType.bg,
            borderColor: selectedType.border,
            color:       selectedType.color,
          }}>
            {selectedType.icon} &nbsp;{selectedType.value}
          </div>

          {/* SUBJECT */}
          <label style={styles.fieldLabel}>SUBJECT</label>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g. Pre-match tactical briefing vs Riverside FC"
            style={styles.input}
            className="bc-input"
            maxLength={100}
          />

          {/* MESSAGE BODY */}
          <label style={{ ...styles.fieldLabel, display:"flex", justifyContent:"space-between" }}>
            <span>MESSAGE</span>
            <span style={{ color: charCount > 900 ? "#BE123C" : "#A78BFA", fontWeight:400 }}>
              {charCount}/1000
            </span>
          </label>
          <textarea
            ref={bodyRef}
            value={body}
            onChange={(e) => { setBody(e.target.value); setCharCount(e.target.value.length); }}
            placeholder="Write your broadcast message here..."
            style={styles.textarea}
            className="bc-input"
            maxLength={1000}
            rows={6}
          />

          {/* SEND BUTTON */}
          <button
            onClick={handleSend}
            disabled={sending}
            className="bc-send-btn"
            style={{
              ...styles.sendBtn,
              opacity: sending ? 0.7 : 1,
              cursor:  sending ? "not-allowed" : "pointer",
            }}
          >
            {sending ? (
              <span style={{ display:"flex", alignItems:"center", gap:8 }}>
                <span className="bc-spinner" /> Sending...
              </span>
            ) : (
              <>📡 Send Broadcast</>
            )}
          </button>
        </div>

        {/* ── RIGHT: HISTORY ── */}
        <div style={styles.historyPanel}>

          <div style={styles.cardHeader}>
            <span style={{ fontSize:18 }}>🕒</span>
            <span style={styles.cardTitle}>Broadcast History</span>
            <span style={styles.historyCount}>{history.length}</span>
          </div>

          <div style={styles.historyList}>
            {history.length === 0 && (
              <div style={styles.emptyState}>
                <p style={{ fontSize:36, margin:0 }}>📭</p>
                <p style={{ color:"#A78BFA", fontSize:14, marginTop:8 }}>No broadcasts sent yet</p>
              </div>
            )}

            {history.map((item, i) => {
              const type = MESSAGE_TYPES.find((t) => t.value === item.messageType) || MESSAGE_TYPES[6];
              const toLabel = item.sentTo === "Coach" ? "🧠 Coach" : item.sentTo === "Players" ? "👥 Players" : "🧠+👥 All";

              return (
                <div
                  key={item._id || i}
                  style={styles.historyItem}
                  className="bc-history-item"
                  onClick={() => setPreview(item)}
                >
                  <div style={{
                    ...styles.historyIcon,
                    background: type.bg,
                    color:      type.color,
                    border:     `1px solid ${type.border}`,
                  }}>
                    {type.icon}
                  </div>

                  <div style={{ flex:1, overflow:"hidden" }}>
                    <p style={styles.historyTitle}>{item.title}</p>
                    <p style={styles.historyMeta}>{toLabel}</p>
                  </div>

                  <div style={{ textAlign:"right", flexShrink:0 }}>
                    <p style={styles.historyTime}>{fmtDate(item.createdAt)}</p>
                    <span style={styles.sentBadge}>Sent</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── PREVIEW MODAL ── */}
      {preview && (
        <div style={styles.modalOverlay} onClick={() => setPreview(null)}>
          <div style={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
              <div>
                <p style={{ color:"#7C3AED", fontSize:12, fontWeight:700, letterSpacing:1, marginBottom:4 }}>
                  {MESSAGE_TYPES.find(t => t.value === preview.messageType)?.icon} {preview.messageType?.toUpperCase()}
                </p>
                <h3 style={{ color:"#3B0764", fontSize:20, fontWeight:700, margin:0 }}>{preview.title}</h3>
              </div>
              <button onClick={() => setPreview(null)} style={styles.modalClose}>✕</button>
            </div>

            <div style={styles.modalMeta}>
              <span>📅 {new Date(preview.createdAt).toLocaleString()}</span>
              <span>👥 {preview.sentTo}</span>
            </div>

            <div style={styles.modalBody}>
              <p style={{ color:"#4B5563", lineHeight:1.7, margin:0 }}>{preview.message}</p>
            </div>

            <button onClick={() => setPreview(null)} style={styles.modalCloseBtn}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── stat pill ───────────────────────────────────────────────────────────────
function StatPill({ label, value, color, bg, border }) {
  return (
    <div style={{
      background: bg || "#F5F3FF",
      border: `1.5px solid ${border || "#DDD6FE"}`,
      borderRadius: 12,
      padding: "10px 20px",
      textAlign: "center",
    }}>
      <p style={{ color, fontSize:26, fontWeight:800, margin:0, lineHeight:1 }}>{value}</p>
      <p style={{ color:"#A78BFA", fontSize:11, fontWeight:600, margin:"4px 0 0", letterSpacing:1 }}>
        {label.toUpperCase()}
      </p>
    </div>
  );
}

// ─── styles ──────────────────────────────────────────────────────────────────
const styles = {
  root: {
    minHeight: "100vh",
    background: "#F5F3FF",
    padding: "32px 36px",
    fontFamily: "'Inter','Segoe UI',sans-serif",
    position: "relative",
  },
  pageHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 28,
    flexWrap: "wrap",
    gap: 16,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: 800,
    color: "#3B0764",
    margin: 0,
    letterSpacing: -0.5,
  },
  pageSubtitle: {
    color: "#A78BFA",
    fontSize: 14,
    margin: "6px 0 0",
  },
  statsRow: {
    display: "flex",
    gap: 12,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 400px",
    gap: 24,
    alignItems: "flex-start",
  },
  card: {
    background: "#fff",
    border: "1.5px solid #DDD6FE",
    borderRadius: 20,
    padding: 28,
    display: "flex",
    flexDirection: "column",
    gap: 16,
    boxShadow: "0 2px 16px rgba(124,58,237,0.06)",
  },
  cardHeader: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 4,
  },
  cardTitle: {
    color: "#3B0764",
    fontSize: 17,
    fontWeight: 700,
    flex: 1,
  },
  historyCount: {
    background: "#EDE9FE",
    color: "#5B21B6",
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 700,
    padding: "2px 10px",
    border: "1px solid #DDD6FE",
  },
  fieldLabel: {
    color: "#7C3AED",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 1.5,
    margin: 0,
  },
  targetRow: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  targetBtn: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    padding: "14px 18px",
    border: "1.5px solid",
    borderRadius: 14,
    cursor: "pointer",
    textAlign: "left",
    transition: "all 0.2s",
    width: "100%",
  },
  targetIcon: {
    fontSize: 26,
    flexShrink: 0,
  },
  targetLabel: {
    fontSize: 14,
    fontWeight: 700,
    margin: 0,
  },
  targetDesc: {
    fontSize: 12,
    color: "#A78BFA",
    margin: "2px 0 0",
  },
  targetCheck: {
    width: 20,
    height: 20,
    borderRadius: "50%",
    border: "2px solid",
    marginLeft: "auto",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    transition: "all 0.2s",
  },
  typeGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 8,
  },
  typeChip: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 5,
    padding: "10px 6px",
    border: "1.5px solid",
    borderRadius: 10,
    cursor: "pointer",
    transition: "all 0.15s",
    textAlign: "center",
    background: "#FAFAFA",
  },
  typeBadge: {
    display: "inline-flex",
    alignItems: "center",
    padding: "6px 14px",
    borderRadius: 20,
    border: "1.5px solid",
    fontSize: 13,
    fontWeight: 600,
    alignSelf: "flex-start",
  },
  input: {
    background: "#F9F8FF",
    border: "1.5px solid #DDD6FE",
    borderRadius: 12,
    padding: "13px 16px",
    color: "#3B0764",
    fontSize: 14,
    fontFamily: "inherit",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
    transition: "border-color 0.2s",
  },
  textarea: {
    background: "#F9F8FF",
    border: "1.5px solid #DDD6FE",
    borderRadius: 12,
    padding: "13px 16px",
    color: "#3B0764",
    fontSize: 14,
    fontFamily: "inherit",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
    resize: "vertical",
    lineHeight: 1.6,
    transition: "border-color 0.2s",
  },
  sendBtn: {
    background: "linear-gradient(135deg, #7C3AED, #6D28D9)",
    border: "none",
    borderRadius: 14,
    padding: "16px",
    color: "#fff",
    fontSize: 16,
    fontWeight: 800,
    fontFamily: "inherit",
    letterSpacing: 0.5,
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 4,
    transition: "transform 0.15s, box-shadow 0.15s",
  },
  historyPanel: {
    background: "#fff",
    border: "1.5px solid #DDD6FE",
    borderRadius: 20,
    padding: 24,
    display: "flex",
    flexDirection: "column",
    gap: 16,
    maxHeight: "82vh",
    overflow: "hidden",
    boxShadow: "0 2px 16px rgba(124,58,237,0.06)",
  },
  historyList: {
    flex: 1,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  historyItem: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "14px 16px",
    background: "#FAFAFA",
    border: "1.5px solid #EDE9FE",
    borderRadius: 12,
    cursor: "pointer",
    transition: "all 0.15s",
  },
  historyIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 20,
    flexShrink: 0,
  },
  historyTitle: {
    color: "#3B0764",
    fontSize: 14,
    fontWeight: 600,
    margin: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  historyMeta: {
    color: "#A78BFA",
    fontSize: 12,
    margin: "3px 0 0",
  },
  historyTime: {
    color: "#A78BFA",
    fontSize: 11,
    margin: 0,
    whiteSpace: "nowrap",
  },
  sentBadge: {
    background: "#EDE9FE",
    color: "#5B21B6",
    fontSize: 10,
    fontWeight: 700,
    padding: "2px 8px",
    borderRadius: 20,
    letterSpacing: 0.5,
    marginTop: 4,
    display: "inline-block",
    border: "1px solid #DDD6FE",
  },
  emptyState: {
    textAlign: "center",
    padding: "48px 0",
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(59,7,100,0.30)",
    zIndex: 9999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backdropFilter: "blur(4px)",
  },
  modalBox: {
    background: "#fff",
    border: "1.5px solid #DDD6FE",
    borderRadius: 20,
    padding: 32,
    width: "100%",
    maxWidth: 520,
    boxShadow: "0 24px 80px rgba(124,58,237,0.18)",
  },
  modalClose: {
    background: "#F5F3FF",
    border: "1.5px solid #DDD6FE",
    borderRadius: 8,
    color: "#7C3AED",
    width: 32,
    height: 32,
    cursor: "pointer",
    fontSize: 16,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  modalMeta: {
    display: "flex",
    gap: 20,
    color: "#A78BFA",
    fontSize: 13,
    marginBottom: 20,
    paddingBottom: 16,
    borderBottom: "1.5px solid #EDE9FE",
  },
  modalBody: {
    background: "#F9F8FF",
    border: "1.5px solid #EDE9FE",
    borderRadius: 12,
    padding: "16px 20px",
    marginBottom: 24,
  },
  modalCloseBtn: {
    background: "linear-gradient(135deg, #7C3AED, #6D28D9)",
    border: "none",
    borderRadius: 12,
    padding: "12px 24px",
    color: "#fff",
    fontSize: 14,
    fontWeight: 700,
    fontFamily: "inherit",
    cursor: "pointer",
    width: "100%",
  },
};

const css = `
  * { box-sizing: border-box; }

  .bc-input:focus {
    border-color: #7C3AED !important;
    box-shadow: 0 0 0 3px rgba(124,58,237,0.10);
  }
  .bc-input::placeholder { color: #C4B5FD; }
  .bc-input::-webkit-scrollbar { width: 4px; }
  .bc-input::-webkit-scrollbar-track { background: transparent; }
  .bc-input::-webkit-scrollbar-thumb { background: #DDD6FE; border-radius: 2px; }

  .bc-target-btn:hover {
    background: #F5F3FF !important;
    border-color: #C4B5FD !important;
    transform: translateX(3px);
  }
  .bc-type-chip:hover { transform: translateY(-2px); }

  .bc-send-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 28px rgba(124,58,237,0.30);
  }
  .bc-send-btn:active:not(:disabled) { transform: translateY(0); }

  .bc-history-item:hover {
    background: #F5F3FF !important;
    border-color: #C4B5FD !important;
    transform: translateX(4px);
  }

  @keyframes bcSlideIn {
    from { opacity: 0; transform: translateY(-12px) scale(0.95); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }

  .bc-spinner {
    width: 16px; height: 16px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: #fff;
    border-radius: 50%;
    display: inline-block;
    animation: bcSpin 0.7s linear infinite;
  }
  @keyframes bcSpin { to { transform: rotate(360deg); } }

  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #DDD6FE; border-radius: 2px; }

  @media (max-width: 900px) {
    div[style*="gridTemplateColumns: 1fr 400px"] {
      grid-template-columns: 1fr !important;
    }
  }
`;