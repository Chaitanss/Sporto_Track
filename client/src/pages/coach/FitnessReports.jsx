import React, { useEffect, useState } from "react";
import { getFitnessReports, getFitnessSummary } from "../../Services/api";
import API from "../../Services/api";

const FitnessReports = () => {
  const [players, setPlayers]   = useState([]);
  const [summary, setSummary]   = useState({});
  const [filter, setFilter]     = useState("All");
  const [feedback, setFeedback] = useState({});       // { [id]: text }
  const [expanded, setExpanded] = useState(null);     // expanded player id
  const [loading, setLoading]   = useState(true);
  const [toast, setToast]       = useState("");

  useEffect(() => {
    fetchData();
    // 🔥 Auto-refresh every 60 seconds to see new player reports
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [rep, sum] = await Promise.all([
        getFitnessReports(),
        getFitnessSummary(),
      ]);
      setPlayers(rep.data);
      setSummary(sum.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  // ── Coach sends feedback ───────────────────────────────────
  const handleFeedback = async (playerId) => {
    try {
      await API.put(`/fitness/${playerId}/feedback`, {
        feedback: feedback[playerId] || "",
      });
      showToast("✅ Feedback sent!");
      fetchData();
    } catch (err) {
      showToast("❌ Error sending feedback");
    }
  };

  // ── Helpers ────────────────────────────────────────────────
  const getStatus = (fit) => {
    if (fit >= 85) return { label: "Fit",     color: "green"  };
    if (fit >= 60) return { label: "Monitor", color: "yellow" };
    return               { label: "Injured",  color: "red"    };
  };

  const statusColors = {
    green:  { bg: "bg-green-100",  text: "text-green-700",  bar: "bg-green-500",  border: "border-green-200"  },
    yellow: { bg: "bg-yellow-100", text: "text-yellow-700", bar: "bg-yellow-500", border: "border-yellow-200" },
    red:    { bg: "bg-red-100",    text: "text-red-700",    bar: "bg-red-500",    border: "border-red-200"    },
  };

  const timeAgo = (date) => {
    if (!date) return "Not reported";
    const diff = Math.floor((Date.now() - new Date(date)) / 60000);
    if (diff < 1)  return "Just now";
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return `${Math.floor(diff / 1440)}d ago`;
  };

  const filtered = filter === "All"
    ? players
    : players.filter((p) => getStatus(p.fitness).label === filter);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* TOAST */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 bg-black text-white px-4 py-2 rounded-xl shadow text-sm">
          {toast}
        </div>
      )}

      {/* ── SUMMARY CARDS ─────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-4">

        <div className="bg-white p-6 rounded-2xl shadow-lg border-t-4 border-green-500 hover:shadow-xl transition">
          <p className="text-3xl font-bold">{summary.fit || 0}</p>
          <p className="text-sm text-gray-500 mt-1">Fully Fit</p>
          <div className="mt-3 h-1.5 bg-green-100 rounded-full">
            <div
              className="h-1.5 bg-green-500 rounded-full"
              style={{ width: players.length ? `${((summary.fit || 0) / players.length) * 100}%` : "0%" }}
            />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-lg border-t-4 border-yellow-500 hover:shadow-xl transition">
          <p className="text-3xl font-bold">{summary.monitor || 0}</p>
          <p className="text-sm text-gray-500 mt-1">Under Review</p>
          <div className="mt-3 h-1.5 bg-yellow-100 rounded-full">
            <div
              className="h-1.5 bg-yellow-500 rounded-full"
              style={{ width: players.length ? `${((summary.monitor || 0) / players.length) * 100}%` : "0%" }}
            />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-lg border-t-4 border-red-500 hover:shadow-xl transition">
          <p className="text-3xl font-bold">{summary.injured || 0}</p>
          <p className="text-sm text-gray-500 mt-1">Injured</p>
          <div className="mt-3 h-1.5 bg-red-100 rounded-full">
            <div
              className="h-1.5 bg-red-500 rounded-full"
              style={{ width: players.length ? `${((summary.injured || 0) / players.length) * 100}%` : "0%" }}
            />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-lg border-t-4 border-blue-500 hover:shadow-xl transition">
          <p className="text-3xl font-bold">{summary.avg || "0.0"}%</p>
          <p className="text-sm text-gray-500 mt-1">Avg Fitness</p>
          <div className="mt-3 h-1.5 bg-blue-100 rounded-full">
            <div
              className="h-1.5 bg-blue-500 rounded-full"
              style={{ width: `${summary.avg || 0}%` }}
            />
          </div>
        </div>

      </div>

      {/* ── FILTER TABS ───────────────────────────────────── */}
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-lg">Individual Fitness Levels</h3>
        <div className="flex gap-2">
          {["All", "Fit", "Monitor", "Injured"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition ${
                filter === f
                  ? f === "All"     ? "bg-gray-800 text-white border-gray-800"
                  : f === "Fit"     ? "bg-green-600 text-white border-green-600"
                  : f === "Monitor" ? "bg-yellow-500 text-white border-yellow-500"
                  :                   "bg-red-500 text-white border-red-500"
                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
              }`}
            >
              {f}
              {f !== "All" && (
                <span className="ml-1 opacity-70">
                  ({f === "Fit" ? summary.fit || 0
                   : f === "Monitor" ? summary.monitor || 0
                   : summary.injured || 0})
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── PLAYER CARDS ──────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">

        {filtered.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-2">🏋️</p>
            <p className="font-medium">No fitness reports yet.</p>
            <p className="text-sm mt-1">Players will appear here once they report their fitness.</p>
          </div>
        )}

        {filtered.map((p, i) => {
          const status = getStatus(p.fitness);
          const sc     = statusColors[status.color];
          const isOpen = expanded === p._id;
          const injuryDisplay =
            p.injury === "Other" ? (p.injuryOther || "Other") : p.injury;

          return (
            <div
              key={p._id}
              className={`border-b last:border-b-0 transition-all ${
                isOpen ? "bg-gray-50" : "hover:bg-gray-50"
              }`}
            >
              {/* ── Main Row ── */}
              <div
                className="flex items-center gap-4 px-6 py-4 cursor-pointer"
                onClick={() => setExpanded(isOpen ? null : p._id)}
              >

                {/* Avatar */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${sc.bg} ${sc.text} flex-shrink-0`}>
                  {p.player?.name?.charAt(0)?.toUpperCase() || "?"}
                </div>

                {/* Name + position */}
                <div className="w-40 flex-shrink-0">
                  <p className="font-semibold text-sm">{p.player?.name}</p>
                  <p className="text-xs text-gray-400">{p.player?.position || "—"}</p>
                </div>

                {/* Progress bar */}
                <div className="flex-1">
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Fitness</span>
                    <span className="font-semibold text-gray-700">{p.fitness}%</span>
                  </div>
                  <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-2.5 rounded-full transition-all duration-500 ${sc.bar}`}
                      style={{ width: `${p.fitness}%` }}
                    />
                  </div>
                </div>

                {/* Status badge */}
                <span className={`text-xs px-3 py-1 rounded-full font-medium flex-shrink-0 ${sc.bg} ${sc.text}`}>
                  {status.label}
                </span>

                {/* Injury badge */}
                {p.injury && p.injury !== "None" && (
                  <span className="text-xs bg-red-50 text-red-600 border border-red-200 px-2 py-1 rounded-full flex-shrink-0">
                    🚨 {injuryDisplay}
                    {p.severity && p.severity !== "None" && ` • ${p.severity}`}
                  </span>
                )}

                {/* Last reported */}
                <span className="text-xs text-gray-400 flex-shrink-0 w-24 text-right">
                  {timeAgo(p.lastReported)}
                </span>

                {/* Expand arrow */}
                <span className={`text-gray-400 text-xs transition-transform ${isOpen ? "rotate-180" : ""}`}>
                  ▼
                </span>

              </div>

              {/* ── Expanded Detail ── */}
              {isOpen && (
                <div className="px-6 pb-5 space-y-4 border-t border-gray-100">

                  <div className="grid grid-cols-3 gap-4 mt-4">

                    {/* Fitness History mini chart */}
                    <div className="col-span-2">
                      <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
                        Fitness History
                      </p>
                      {p.history && p.history.length > 0 ? (
                        <div className="flex gap-2 items-end">
                          {[...p.history, p.fitness].slice(-7).map((val, idx, arr) => (
                            <div key={idx} className="flex-1 text-center">
                              <div
                                className={`rounded transition-all ${
                                  val < 60 ? "bg-red-400" :
                                  val < 85 ? "bg-yellow-400" : "bg-green-400"
                                }`}
                                style={{ height: `${Math.max(val * 0.4, 12)}px` }}
                              />
                              <p className="text-xs text-gray-400 mt-1">{val}%</p>
                              {idx === arr.length - 1 && (
                                <p className="text-xs text-green-600 font-bold">Now</p>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400">Not enough history yet.</p>
                      )}
                    </div>

                    {/* Injury details */}
                    <div>
                      <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
                        Injury Report
                      </p>
                      {p.injury && p.injury !== "None" ? (
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Type</span>
                            <span className="font-medium text-red-600">{injuryDisplay}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Severity</span>
                            <span className={`font-medium ${
                              p.severity === "Severe" ? "text-red-600" :
                              p.severity === "Moderate" ? "text-yellow-600" :
                              "text-green-600"
                            }`}>{p.severity}</span>
                          </div>
                          {p.description && (
                            <div className="mt-2 bg-red-50 p-2 rounded text-xs text-red-700">
                              "{p.description}"
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-green-600 font-medium">✓ No injuries</p>
                      )}
                    </div>

                  </div>

                  {/* Coach Feedback Box */}
                  <div className="border-t border-gray-100 pt-4">
                    <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
                      Send Feedback to Player
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder={p.coachFeedback || "e.g. Rest today, light training tomorrow..."}
                        value={feedback[p._id] || ""}
                        onChange={(e) =>
                          setFeedback((prev) => ({ ...prev, [p._id]: e.target.value }))
                        }
                        className="flex-1 border rounded-lg px-3 py-2 text-sm"
                      />
                      <button
                        onClick={() => handleFeedback(p._id)}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition"
                      >
                        Send
                      </button>
                    </div>
                    {p.coachFeedback && (
                      <p className="text-xs text-gray-400 mt-1">
                        Last sent: "{p.coachFeedback}"
                      </p>
                    )}
                  </div>

                </div>
              )}

            </div>
          );
        })}
      </div>

    </div>
  );
};

export default FitnessReports;