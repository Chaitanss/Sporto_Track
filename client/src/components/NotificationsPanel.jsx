import { useState, useEffect, useCallback } from "react";
import { getMyNotifications, markNotificationRead, markAllNotificationsRead } from "../Services/api";
import { onNotification } from "../socket";

// ─── Icon map by notification type / keyword ────────────────────────────────
const resolveIcon = (title = "", type = "") => {
  const t = (title + type).toLowerCase();
  if (t.includes("drill") || t.includes("practice")) return { icon: "🎯", bg: "#1a3a2a", accent: "#22c55e" };
  if (t.includes("message"))                          return { icon: "💬", bg: "#1a2a3a", accent: "#38bdf8" };
  if (t.includes("match") || t.includes("schedule")) return { icon: "📅", bg: "#2a1a3a", accent: "#a78bfa" };
  if (t.includes("fitness") || t.includes("health")) return { icon: "💪", bg: "#2a2a1a", accent: "#facc15" };
  if (t.includes("rating") || t.includes("performance")) return { icon: "⭐", bg: "#2a1a1a", accent: "#f97316" };
  if (t.includes("win") || t.includes("result"))     return { icon: "🏆", bg: "#1a2a1a", accent: "#10b981" };
  if (t.includes("scout"))                           return { icon: "🔍", bg: "#1a1a2a", accent: "#818cf8" };
  if (t.includes("broadcast"))                       return { icon: "📢", bg: "#2a1a1a", accent: "#fb7185" };
  if (t.includes("analytics") || t.includes("report")) return { icon: "📊", bg: "#1a2a2a", accent: "#06b6d4" };
  if (t.includes("injury") || t.includes("alert"))  return { icon: "🚨", bg: "#2a1a1a", accent: "#ef4444" };
  if (t.includes("coach") || t.includes("note"))    return { icon: "📝", bg: "#1a2a3a", accent: "#38bdf8" };
  if (t.includes("squad") || t.includes("player"))  return { icon: "👥", bg: "#1a2a1a", accent: "#22c55e" };
  return { icon: "🔔", bg: "#1a2a1a", accent: "#22c55e" };
};

const timeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  if (d === 1) return "Yesterday";
  return `${d} days ago`;
};

// ─── THEME config per role ───────────────────────────────────────────────────
const THEMES = {
  player: {
    bg: "#f0fdf4",
    accent: "#16a34a",
    accentLight: "#dcfce7",
  },
  coach: {
    bg: "#f0fdf4",
    accent: "#16a34a",
    accentLight: "#dcfce7",
  },
  analyst: {
    bg: "#f0fdf4",
    accent: "#16a34a",
    accentLight: "#dcfce7",
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export default function NotificationsPanel({ role = "player" }) {
  const theme = THEMES[role] || THEMES.player;
  const isDark = false;

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [animating, setAnimating] = useState(null);

  // ── Fetch from server ──────────────────────────────────────────────────────
  const fetchNotifs = useCallback(async () => {
    try {
      const res = await getMyNotifications();
      setNotifications(res.data || []);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifs();
  }, [fetchNotifs]);

  // ── Real-time socket listener: prepend new notification instantly ──────────
  useEffect(() => {
    const unsub = onNotification((notif) => {
      setNotifications((prev) => {
        // Avoid duplicates
        if (prev.find((n) => n._id?.toString() === notif._id?.toString())) return prev;
        return [notif, ...prev];
      });
    });
    return unsub; // cleanup on unmount
  }, []);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const unreadCount = notifications.filter((n) => !n.read).length;

  const filtered =
    filter === "unread"
      ? notifications.filter((n) => !n.read)
      : notifications;

  const markRead = async (id) => {
    setAnimating(id);
    setTimeout(() => setAnimating(null), 400);
    try {
      await markNotificationRead(id);
    } catch {}
    setNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, read: true } : n))
    );
  };

  const markAllRead = async () => {
    try {
      await markAllNotificationsRead();
    } catch {}
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen"
      style={{
        background: "#f8fafc",
        fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
      }}
    >
      <style>{CSS(theme, isDark)}</style>

      {/* ── TOP STRIP ── */}
      <div
        className="sticky top-0 z-20 flex items-center justify-between px-6 py-4 border-b"
        style={{
          background: "#fff",
          borderColor: "#e2e8f0",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="flex items-center gap-3">
          <div
            style={{
              background: "#dcfce7",
              borderRadius: "12px",
              padding: "8px 10px",
              fontSize: "20px",
              position: "relative",
            }}
          >
            🔔
            {unreadCount > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: "-4px",
                  right: "-4px",
                  background: "#ef4444",
                  color: "#fff",
                  fontSize: "10px",
                  fontWeight: 700,
                  borderRadius: "999px",
                  padding: "1px 5px",
                  lineHeight: "16px",
                }}
              >
                {unreadCount}
              </span>
            )}
          </div>

          <div>
            <h1
              className="font-bold text-xl"
              style={{ color: "#0f172a", letterSpacing: "-0.4px" }}
            >
              Notifications
            </h1>
            <p style={{ fontSize: "12px", color: "#94a3b8", marginTop: "1px" }}>
              {unreadCount > 0 ? `${unreadCount} unread` : "All caught up ✓"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {["all", "unread"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="filter-pill"
              style={{
                background:
                  filter === f
                    ? theme.accent
                    : "#f1f5f9",
                color: filter === f ? "#fff" : "#64748b",
                border: "none",
                borderRadius: "999px",
                padding: "5px 14px",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
                textTransform: "capitalize",
                transition: "all 0.2s",
              }}
            >
              {f}
            </button>
          ))}

          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              style={{
                background: "transparent",
                border: `1.5px solid #e2e8f0`,
                borderRadius: "8px",
                padding: "5px 12px",
                fontSize: "12px",
                fontWeight: 600,
                color: "#64748b",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "5px",
                transition: "all 0.2s",
              }}
              className="mark-all-btn"
            >
              ✔ Mark all read
            </button>
          )}
        </div>
      </div>

      {/* ── BODY ── */}
      <div className="px-6 py-6 max-w-3xl mx-auto">
        {loading ? (
          <SkeletonList isDark={isDark} />
        ) : filtered.length === 0 ? (
          <EmptyState isDark={isDark} filter={filter} />
        ) : (
          <div className="notif-list">
            {filtered.map((n, idx) => {
              const { icon, bg, accent } = resolveIcon(n.title, n.type);
              const isUnread = !n.read;
              const isAnim = animating === n._id;

              return (
                <div
                  key={n._id || idx}
                  className={`notif-card ${isAnim ? "notif-fade" : ""}`}
                  style={{
                    background: isUnread ? "#fff" : "#f8fafc",
                    border: `1px solid ${isUnread ? "#e2e8f0" : "#f1f5f9"}`,
                    borderRadius: "16px",
                    padding: "16px 18px",
                    marginBottom: "10px",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "14px",
                    cursor: isUnread ? "pointer" : "default",
                    transition: "all 0.25s",
                    position: "relative",
                    overflow: "hidden",
                  }}
                  onClick={() => isUnread && markRead(n._id)}
                >
                  {/* Left accent stripe for unread */}
                  {isUnread && (
                    <div
                      style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: "3px",
                        background: accent,
                        borderRadius: "16px 0 0 16px",
                      }}
                    />
                  )}

                  {/* Icon bubble */}
                  <div
                    style={{
                      minWidth: "42px",
                      height: "42px",
                      borderRadius: "12px",
                      background: `${accent}18`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "20px",
                      boxShadow: "none",
                    }}
                  >
                    {icon}
                  </div>

                  {/* Text */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        fontWeight: isUnread ? 700 : 500,
                        fontSize: "14px",
                        color: "#0f172a",
                        marginBottom: "3px",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {n.title || "Notification"}
                    </p>
                    <p
                      style={{
                        fontSize: "13px",
                        color: "#64748b",
                        lineHeight: "1.5",
                      }}
                    >
                      {n.message || n.desc || ""}
                    </p>
                    <p
                      style={{
                        fontSize: "11px",
                        color: "#94a3b8",
                        marginTop: "6px",
                        fontWeight: 500,
                      }}
                    >
                      {timeAgo(n.createdAt)}
                    </p>
                  </div>

                  {/* Unread dot */}
                  <div style={{ display: "flex", alignItems: "center", paddingTop: "2px" }}>
                    {isUnread ? (
                      <div
                        style={{
                          width: "8px",
                          height: "8px",
                          borderRadius: "50%",
                          background: accent,
                          boxShadow: `0 0 6px ${accent}`,
                          flexShrink: 0,
                        }}
                      />
                    ) : (
                      <div style={{ width: "8px", height: "8px" }} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function SkeletonList({ isDark }) {
  return (
    <div>
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          style={{
            background: "#fff",
            border: `1px solid #e2e8f0`,
            borderRadius: "16px",
            padding: "16px 18px",
            marginBottom: "10px",
            display: "flex",
            gap: "14px",
            alignItems: "center",
          }}
        >
          <div className="skeleton" style={{ width: 42, height: 42, borderRadius: 12 }} />
          <div style={{ flex: 1 }}>
            <div className="skeleton" style={{ height: 14, width: "55%", borderRadius: 6, marginBottom: 8 }} />
            <div className="skeleton" style={{ height: 12, width: "80%", borderRadius: 6 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState({ isDark, filter }) {
  return (
    <div
      style={{
        textAlign: "center",
        padding: "64px 32px",
        color: "#94a3b8",
      }}
    >
      <div style={{ fontSize: "52px", marginBottom: "12px" }}>
        {filter === "unread" ? "✅" : "🔕"}
      </div>
      <p
        style={{
          fontWeight: 700,
          fontSize: "16px",
          marginBottom: "6px",
          color: "#475569",
        }}
      >
        {filter === "unread" ? "All caught up!" : "No notifications yet"}
      </p>
      <p style={{ fontSize: "13px" }}>
        {filter === "unread"
          ? "You have no unread notifications."
          : "When someone sends you a notification, it'll appear here."}
      </p>
    </div>
  );
}

// ─── CSS injection ────────────────────────────────────────────────────────────
const CSS = (theme, isDark) => `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');

  .notif-card:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 16px rgba(0,0,0,0.08);
  }

  .notif-fade {
    animation: fadeCheck 0.4s ease forwards;
  }

  @keyframes fadeCheck {
    0%   { background: #f0fdf4; }
    100% { background: #f8fafc; }
  }

  .skeleton {
    background: #e2e8f0;
    animation: shimmer 1.4s infinite linear;
    background-size: 200% 100%;
    background-image: linear-gradient(90deg,#e2e8f0 25%,#f1f5f9 50%,#e2e8f0 75%);
  }

  @keyframes shimmer {
    0%   { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  .filter-pill:hover { opacity: 0.85; }

  .mark-all-btn:hover {
    background: #f8fafc !important;
  }
`;