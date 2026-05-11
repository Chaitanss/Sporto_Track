import React, { useEffect, useState, useCallback } from "react";
import API from "../../Services/api";
import useAI from "../../hooks/useAI";
import { aiMatchReportWriter } from "../../Services/api";

const fmt = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";

// ═══════════════════════════════════════════════
// AI MATCH REPORT WRITER COMPONENT
// ═══════════════════════════════════════════════
const MatchReportWriterAI = ({ matchData }) => {
  const [report, setReport] = useState(null);
  const [expanded, setExpanded] = useState(true);
  const { loading, error, callAI } = useAI();

  const canGenerate = matchData?.teamA || matchData?.finalScore || matchData?.matchSummary;

  const handleGenerate = async () => {
    const data = await callAI(() => aiMatchReportWriter(matchData));
    if (data?.report) { setReport(data.report); setExpanded(true); }
  };

  return (
    <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 16, overflow: "hidden", marginTop: 12 }}>
      {/* Header */}
      <div style={{ padding: "12px 18px", background: "#f5f3ff", borderBottom: report ? "1px solid #e5e7eb" : "none", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 16 }}>✍️</span>
          <div>
            <p style={{ color: "#111827", fontWeight: 700, fontSize: 13, margin: 0 }}>AI Report Writer</p>
            <p style={{ color: "#9ca3af", fontSize: 10, margin: 0 }}>Auto-generates narrative from match data</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {report && (
            <button onClick={() => setExpanded((e) => !e)} style={{ background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 8, color: "#6b7280", fontSize: 11, padding: "5px 10px", cursor: "pointer" }}>
              {expanded ? "▲ Hide" : "▼ Show"}
            </button>
          )}
          <button onClick={handleGenerate} disabled={loading || !canGenerate} style={{
            background: loading || !canGenerate ? "#e5e7eb" : "#7c3aed",
            border: "none", borderRadius: 8,
            color: loading || !canGenerate ? "#9ca3af" : "#ffffff",
            fontWeight: 700, fontSize: 11, padding: "6px 14px",
            cursor: loading || !canGenerate ? "not-allowed" : "pointer", transition: "all 0.2s",
          }}>
            {loading ? "Generating..." : report ? "🔄 Regenerate" : "✨ Generate Report"}
          </button>
        </div>
      </div>

      {!canGenerate && !report && (
        <p style={{ color: "#9ca3af", fontSize: 11, padding: "10px 18px", margin: 0 }}>Select a match and add a summary above to generate a report.</p>
      )}
      {error && <p style={{ color: "#dc2626", fontSize: 11, padding: "10px 18px" }}>{error}</p>}
      {loading && (
        <div style={{ padding: "18px", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 16, height: 16, border: "2px solid #e5e7eb", borderTop: "2px solid #7c3aed", borderRadius: "50%", animation: "mrspin 0.8s linear infinite" }} />
          <style>{`@keyframes mrspin{to{transform:rotate(360deg)}}`}</style>
          <p style={{ color: "#9ca3af", fontSize: 12, margin: 0 }}>Writing your match report...</p>
        </div>
      )}

      {report && expanded && !loading && (
        <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <p style={{ fontSize: 9, color: "#7c3aed", letterSpacing: 3, fontWeight: 700, marginBottom: 4 }}>HEADLINE</p>
            <h3 style={{ color: "#111827", fontSize: 17, fontWeight: 800, margin: 0, lineHeight: 1.3 }}>{report.headline}</h3>
          </div>
          <div style={{ background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "12px 16px" }}>
            <p style={{ fontSize: 9, color: "#9ca3af", letterSpacing: 3, fontWeight: 700, marginBottom: 6 }}>MATCH NARRATIVE</p>
            <p style={{ color: "#4b5563", fontSize: 13, lineHeight: 1.7, margin: 0 }}>{report.narrative}</p>
          </div>
          {report.manOfMatch && (
            <div style={{ background: "#f5f3ff", border: "1px solid #ddd6fe", borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 18 }}>🏆</span>
              <div>
                <p style={{ fontSize: 9, color: "#7c3aed", letterSpacing: 2, fontWeight: 700, margin: 0 }}>MAN OF THE MATCH</p>
                <p style={{ color: "#374151", fontSize: 12, margin: "2px 0 0" }}>{report.manOfMatch}</p>
              </div>
            </div>
          )}
          {report.keyStats?.length > 0 && (
            <div>
              <p style={{ fontSize: 9, color: "#9ca3af", letterSpacing: 3, fontWeight: 700, marginBottom: 8 }}>KEY INSIGHTS</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {report.keyStats.map((stat, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 8, padding: "7px 12px" }}>
                    <span style={{ color: "#7c3aed", fontSize: 11, fontWeight: 700, flexShrink: 0, marginTop: 1 }}>{i + 1}.</span>
                    <p style={{ color: "#6b7280", fontSize: 12, margin: 0 }}>{stat}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {report.trends && (
              <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 10, padding: "10px 12px" }}>
                <p style={{ fontSize: 9, color: "#2563eb", letterSpacing: 2, fontWeight: 700, marginBottom: 4 }}>📈 TREND</p>
                <p style={{ color: "#4b5563", fontSize: 11, margin: 0 }}>{report.trends}</p>
              </div>
            )}
            {report.recommendation && (
              <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, padding: "10px 12px" }}>
                <p style={{ fontSize: 9, color: "#d97706", letterSpacing: 2, fontWeight: 700, marginBottom: 4 }}>🎯 NEXT MATCH</p>
                <p style={{ color: "#4b5563", fontSize: 11, margin: 0 }}>{report.recommendation}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════
// MAIN MATCH REPORTS PAGE
// ═══════════════════════════════════════════════
const MatchReports = () => {
  const [matchRecords, setMatchRecords]       = useState([]);
  const [pastReports, setPastReports]         = useState([]);
  const [drafts, setDrafts]                   = useState([]);
  const [selectedMatchId, setSelectedMatchId] = useState("");
  const [finalScore, setFinalScore]           = useState("");
  const [matchSummary, setMatchSummary]       = useState("");
  const [playerRatings, setPlayerRatings]     = useState([]);
  const [nextOpponent, setNextOpponent]       = useState("");
  const [theirWeakness, setTheirWeakness]     = useState("");
  const [recommendedTactic, setRecommendedTactic] = useState("");
  const [toast, setToast]                     = useState({ msg: "", type: "success" });
  const [loading, setLoading]                 = useState(false);
  const [viewReport, setViewReport]           = useState(null);
  const [viewDraft, setViewDraft]             = useState(null);

  const fetchMatchRecords = useCallback(async () => {
    try { const res = await API.get("/match-records"); setMatchRecords(res.data || []); }
    catch (err) { console.error("Fetch match records error:", err); }
  }, []);

  const fetchPastReports = useCallback(async () => {
    try { const res = await API.get("/match-reports/analyst"); setPastReports(res.data || []); }
    catch { setPastReports([]); }
  }, []);

  const loadDrafts = useCallback(() => {
    try { const stored = localStorage.getItem("matchReportDrafts"); setDrafts(stored ? JSON.parse(stored) : []); }
    catch { setDrafts([]); }
  }, []);

  useEffect(() => { fetchMatchRecords(); fetchPastReports(); loadDrafts(); }, [fetchMatchRecords, fetchPastReports, loadDrafts]);

  useEffect(() => {
    if (!selectedMatchId) { setFinalScore(""); setPlayerRatings([]); return; }
    const rec = matchRecords.find((r) => r._id === selectedMatchId);
    if (rec) {
      setFinalScore(`${rec.teamAScore || ""} vs ${rec.teamBScore || ""}`.trim());
      const players = (rec.playing11 || []).map((p) => ({ playerId: p.playerId || p._id || "", name: p.playerName, rating: 5 }));
      setPlayerRatings(players);
    }
  }, [selectedMatchId, matchRecords]);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "success" }), 3500);
  };

  const validate = () => {
    if (!selectedMatchId) return "Please select a match.";
    if (!matchSummary.trim()) return "Please write a match summary.";
    return null;
  };

  const handlePushToCoach = async () => {
    const err = validate();
    if (err) return showToast(err, "error");
    setLoading(true);
    try {
      const rec = matchRecords.find((r) => r._id === selectedMatchId);
      const payload = { type: "match_report", title: `📋 Match Report: ${rec?.matchTitle || "Match"}`, message: matchSummary, data: { matchId: selectedMatchId, matchTitle: rec?.matchTitle, finalScore, matchSummary, playerRatings, matchDate: rec?.matchDate, teamA: rec?.teamA, teamB: rec?.teamB, result: rec?.result } };
      await API.post("/notifications/push-to-coach", payload);
      setPastReports((prev) => [{ _id: Date.now().toString(), matchTitle: rec?.matchTitle, teamA: rec?.teamA, teamB: rec?.teamB, result: rec?.result, finalScore, matchSummary, playerRatings, matchDate: rec?.matchDate, pushedAt: new Date().toISOString() }, ...prev]);
      showToast("✅ Report pushed to Coach successfully!");
      resetForm();
    } catch (err) { showToast(err.response?.data?.message || "Push failed ❌", "error"); }
    finally { setLoading(false); }
  };

  const handleSaveDraft = () => {
    if (!selectedMatchId && !matchSummary.trim()) return showToast("Nothing to save as draft.", "error");
    const rec = matchRecords.find((r) => r._id === selectedMatchId);
    const draft = { id: Date.now().toString(), matchId: selectedMatchId, matchTitle: rec?.matchTitle || "Untitled Match", teamA: rec?.teamA || "", teamB: rec?.teamB || "", finalScore, matchSummary, playerRatings, savedAt: new Date().toISOString() };
    const updated = [draft, ...drafts];
    setDrafts(updated);
    localStorage.setItem("matchReportDrafts", JSON.stringify(updated));
    showToast("📝 Draft saved!");
  };

  const handleLoadDraft = (draft) => {
    setSelectedMatchId(draft.matchId || "");
    setFinalScore(draft.finalScore || "");
    setMatchSummary(draft.matchSummary || "");
    setPlayerRatings(draft.playerRatings || []);
    setViewDraft(null);
    showToast("Draft loaded into editor ✏️");
  };

  const handleDeleteDraft = (id) => {
    const updated = drafts.filter((d) => d.id !== id);
    setDrafts(updated);
    localStorage.setItem("matchReportDrafts", JSON.stringify(updated));
    showToast("Draft deleted 🗑️");
  };

  const handleSendOppositionToCoach = async () => {
    if (!nextOpponent.trim()) return showToast("Select a next opponent.", "error");
    setLoading(true);
    try {
      await API.post("/notifications/push-to-coach", { type: "opposition_analysis", title: `🔍 Opposition Analysis: ${nextOpponent}`, message: `Weakness: ${theirWeakness || "N/A"} | Tactic: ${recommendedTactic || "N/A"}`, data: { nextOpponent, theirWeakness, recommendedTactic } });
      showToast("✅ Opposition analysis sent to Coach!");
      setNextOpponent(""); setTheirWeakness(""); setRecommendedTactic("");
    } catch (err) { showToast(err.response?.data?.message || "Send failed ❌", "error"); }
    finally { setLoading(false); }
  };

  const resetForm = () => { setSelectedMatchId(""); setFinalScore(""); setMatchSummary(""); setPlayerRatings([]); };
  const updateRating = (idx, rating) => setPlayerRatings((prev) => { const arr = [...prev]; arr[idx] = { ...arr[idx], rating }; return arr; });

  const ResultBadge = ({ result }) => {
    if (!result) return null;
    const lower = result.toLowerCase();
    const isWin = lower.includes("won") || lower.includes("win") || lower.includes("beat");
    const isLoss = lower.includes("lost") || lower.includes("lose") || lower.includes("defeat");
    const isDraw = lower.includes("draw") || lower.includes("tie");
    return (
      <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${isWin ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : isLoss ? "bg-red-50 text-red-500 border border-red-100" : isDraw ? "bg-amber-50 text-amber-600 border border-amber-100" : "bg-gray-100 text-gray-400"}`}>
        {isWin ? "W" : isLoss ? "L" : isDraw ? "D" : "—"}
      </span>
    );
  };

  const selectedRec = matchRecords.find((r) => r._id === selectedMatchId);
  const aiMatchData = { matchTitle: selectedRec?.matchTitle, teamA: selectedRec?.teamA, teamB: selectedRec?.teamB, finalScore, matchSummary, playerRatings, result: selectedRec?.result, matchDate: selectedRec?.matchDate };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">

      {toast.msg && (
        <div className={`fixed top-5 right-5 z-[999] px-5 py-3 rounded-xl shadow-xl text-sm font-semibold flex items-center gap-2 text-white
          ${toast.type === "error" ? "bg-red-500" : "bg-purple-600"}`}>
          {toast.msg}
        </div>
      )}

      {/* HEADER */}
      <div className="px-8 pt-8 pb-6 border-b border-gray-100 bg-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-purple-500 font-semibold uppercase tracking-widest mb-1">Analyst Hub</p>
            <h1 className="text-3xl font-black tracking-tight text-gray-900">Match Reports</h1>
            <p className="text-gray-400 text-sm mt-1">{matchRecords.length} matches recorded · {pastReports.length} reports pushed</p>
          </div>
          <button onClick={handlePushToCoach} disabled={loading}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition shadow-lg shadow-purple-200">
            ⬆ Push to Coach
          </button>
        </div>
      </div>

      <div className="px-8 py-6 space-y-6">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

          {/* LEFT: REPORT BUILDER */}
          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-gray-900 text-base">Post-Match Report Builder</h2>
                  <p className="text-gray-400 text-xs mt-0.5">Push to Coach · Players see their ratings</p>
                </div>
                <span className="text-[10px] text-purple-600 bg-purple-50 border border-purple-100 px-2 py-1 rounded-lg font-semibold">ANALYST</span>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-gray-400 uppercase tracking-widest mb-1.5">MATCH</label>
                  <select value={selectedMatchId} onChange={(e) => setSelectedMatchId(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-purple-400 transition">
                    <option value="">Select a match…</option>
                    {matchRecords.map((rec) => (
                      <option key={rec._id} value={rec._id}>{rec.matchTitle} ({fmt(rec.matchDate)})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-gray-400 uppercase tracking-widest mb-1.5">FINAL SCORE</label>
                  <input value={finalScore} onChange={(e) => setFinalScore(e.target.value)} placeholder="e.g. 185/6 vs 163/8"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 placeholder:text-gray-300 focus:outline-none focus:border-purple-400 transition" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-gray-400 uppercase tracking-widest mb-1.5">MATCH SUMMARY</label>
                <textarea value={matchSummary} onChange={(e) => setMatchSummary(e.target.value)} rows={3}
                  placeholder="Describe team performance, key moments, tactical observations…"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 placeholder:text-gray-300 focus:outline-none focus:border-purple-400 resize-none transition" />
              </div>

              {playerRatings.length > 0 && (
                <div>
                  <label className="block text-[10px] text-gray-400 uppercase tracking-widest mb-3">PLAYER RATINGS</label>
                  <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                    {playerRatings.map((p, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center text-[10px] font-bold text-purple-700 flex-shrink-0">
                          {p.name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                        </div>
                        <span className="text-sm text-gray-600 flex-1 truncate">{p.name}</span>
                        <div className="flex gap-0.5">
                          {[1,2,3,4,5,6,7,8,9,10].map((n) => (
                            <button key={n} onClick={() => updateRating(idx, n)}
                              className={`w-6 h-6 rounded-md text-[10px] font-bold transition ${p.rating >= n ? n <= 3 ? "bg-red-400 text-white" : n <= 6 ? "bg-amber-400 text-white" : "bg-purple-500 text-white" : "bg-gray-100 text-gray-300 hover:bg-gray-200"}`}>
                              {n}
                            </button>
                          ))}
                        </div>
                        <span className={`text-xs font-bold w-5 text-right ${p.rating <= 3 ? "text-red-500" : p.rating <= 6 ? "text-amber-500" : "text-purple-600"}`}>{p.rating}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button onClick={handlePushToCoach} disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-sm transition">
                  ⬆ Push to Coach
                </button>
                <button onClick={handleSaveDraft}
                  className="flex items-center gap-2 border border-gray-200 hover:border-purple-300 text-gray-500 hover:text-purple-600 px-4 py-2.5 rounded-xl text-sm transition">
                  💾 Save Draft
                </button>
              </div>

              <MatchReportWriterAI matchData={aiMatchData} />
            </div>
          </div>

          {/* RIGHT: PAST REPORTS */}
          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
              <h2 className="font-bold text-gray-900 text-base">Past Reports</h2>
              {pastReports.length > 0 && (
                <span className="text-xs bg-purple-50 text-purple-600 border border-purple-100 px-2.5 py-1 rounded-lg font-semibold">{pastReports.length} pushed</span>
              )}
            </div>
            <div className="p-4">
              {pastReports.length === 0 && matchRecords.length > 0 ? (
                <div className="space-y-2">
                  {matchRecords.slice(0, 6).map((rec) => (
                    <div key={rec._id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100 hover:border-purple-200 transition cursor-pointer group" onClick={() => setViewReport({ ...rec, isPastRecord: true })}>
                      <ResultBadge result={rec.result} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">vs {rec.teamB}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">{rec.teamAScore || "—"} · {fmt(rec.matchDate)}</p>
                      </div>
                      <button className="text-xs text-purple-500 hover:text-purple-700 opacity-0 group-hover:opacity-100 transition font-medium">View →</button>
                    </div>
                  ))}
                </div>
              ) : pastReports.length > 0 ? (
                <div className="space-y-2">
                  {pastReports.map((rpt, i) => (
                    <div key={rpt._id || i} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100 hover:border-purple-200 transition cursor-pointer group" onClick={() => setViewReport(rpt)}>
                      <ResultBadge result={rpt.result} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">vs {rpt.teamB || rpt.matchTitle}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">{rpt.finalScore || rpt.teamAScore || "—"} · {fmt(rpt.pushedAt || rpt.matchDate)}</p>
                      </div>
                      <span className="text-[10px] text-purple-500 opacity-0 group-hover:opacity-100 transition font-medium">View →</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-14 text-gray-300">
                  <div className="text-4xl mb-2">📋</div>
                  <p className="text-sm text-gray-400">No reports pushed yet</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* BOTTOM ROW */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Opposition Analysis */}
          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
              <h2 className="font-bold text-gray-900 text-base">Opposition Analysis</h2>
              <p className="text-gray-400 text-xs mt-0.5">Send tactical insights to Coach</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] text-gray-400 uppercase tracking-widest mb-1.5">NEXT OPPONENT</label>
                <select value={nextOpponent} onChange={(e) => setNextOpponent(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-purple-400 transition">
                  <option value="">Select next opponent…</option>
                  {[...new Set(matchRecords.map((r) => [r.teamA, r.teamB]).flat())].map((team) => (
                    <option key={team} value={team}>{team}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-gray-400 uppercase tracking-widest mb-1.5">THEIR WEAKNESS</label>
                <textarea value={theirWeakness} onChange={(e) => setTheirWeakness(e.target.value)} rows={3}
                  placeholder="e.g. High defensive line, vulnerable to fast breaks…"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 placeholder:text-gray-300 focus:outline-none focus:border-purple-400 resize-none transition" />
              </div>
              <div>
                <label className="block text-[10px] text-gray-400 uppercase tracking-widest mb-1.5">RECOMMENDED TACTIC</label>
                <textarea value={recommendedTactic} onChange={(e) => setRecommendedTactic(e.target.value)} rows={3}
                  placeholder="e.g. Open with spinners, target opening partnership…"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 placeholder:text-gray-300 focus:outline-none focus:border-purple-400 resize-none transition" />
              </div>
              <button onClick={handleSendOppositionToCoach} disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-sm transition">
                ⬆ Send to Coach
              </button>
            </div>
          </div>

          {/* Draft History */}
          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-gray-900 text-base">Draft History</h2>
                <p className="text-gray-400 text-xs mt-0.5">Saved drafts — load & continue editing</p>
              </div>
              {drafts.length > 0 && (
                <span className="text-xs bg-gray-100 text-gray-500 border border-gray-200 px-2.5 py-1 rounded-lg font-semibold">{drafts.length} saved</span>
              )}
            </div>
            <div className="p-4">
              {drafts.length === 0 ? (
                <div className="text-center py-14 text-gray-300">
                  <div className="text-4xl mb-2">📝</div>
                  <p className="text-sm text-gray-400">No drafts saved yet</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {drafts.map((draft) => (
                    <div key={draft.id} className="p-3.5 rounded-xl bg-gray-50 border border-gray-100 hover:border-purple-200 transition group">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] bg-amber-50 text-amber-600 border border-amber-100 px-1.5 py-0.5 rounded font-bold tracking-wide">DRAFT</span>
                            <p className="text-sm font-semibold text-gray-800 truncate">{draft.matchTitle || "Untitled"}</p>
                          </div>
                          {draft.matchSummary && <p className="text-xs text-gray-400 line-clamp-2 mb-1.5">{draft.matchSummary}</p>}
                          <span className="text-[10px] text-gray-300">Saved {fmt(draft.savedAt)}</span>
                        </div>
                        <div className="flex gap-1.5 flex-shrink-0">
                          <button onClick={() => setViewDraft(draft)} className="text-[11px] text-purple-600 hover:text-purple-700 bg-purple-50 hover:bg-purple-100 px-2.5 py-1.5 rounded-lg font-medium transition">View</button>
                          <button onClick={() => handleLoadDraft(draft)} className="text-[11px] text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 px-2.5 py-1.5 rounded-lg font-medium transition">Load</button>
                          <button onClick={() => handleDeleteDraft(draft.id)} className="text-[11px] text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100 px-2.5 py-1.5 rounded-lg font-medium transition">Del</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* VIEW REPORT MODAL */}
      {viewReport && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-2xl shadow-2xl my-auto">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-gray-900 text-lg">{viewReport.matchTitle || `vs ${viewReport.teamB}`}</h3>
                <p className="text-gray-400 text-xs mt-0.5">{viewReport.teamA} vs {viewReport.teamB} · {fmt(viewReport.matchDate || viewReport.pushedAt)}</p>
              </div>
              <button onClick={() => setViewReport(null)} className="text-gray-300 hover:text-gray-600 text-2xl">×</button>
            </div>
            <div className="p-6 space-y-4">
              {(viewReport.finalScore || viewReport.teamAScore) && (
                <div className="bg-purple-50 border border-purple-100 rounded-xl p-4">
                  <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">Final Score</p>
                  <p className="text-xl font-bold text-purple-700 font-mono">{viewReport.finalScore || `${viewReport.teamAScore} vs ${viewReport.teamBScore}`}</p>
                </div>
              )}
              {viewReport.matchSummary && (
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-2">Summary</p>
                  <p className="text-sm text-gray-600 leading-relaxed">{viewReport.matchSummary}</p>
                </div>
              )}
            </div>
            <div className="flex justify-end px-6 py-4 border-t border-gray-100">
              <button onClick={() => setViewReport(null)} className="px-5 py-2 rounded-xl border border-gray-200 text-gray-500 hover:text-gray-700 text-sm transition">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW DRAFT MODAL */}
      {viewDraft && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-amber-50 text-amber-600 border border-amber-100 px-2 py-0.5 rounded font-bold">DRAFT</span>
                <h3 className="font-bold text-gray-900">{viewDraft.matchTitle || "Untitled Draft"}</h3>
              </div>
              <button onClick={() => setViewDraft(null)} className="text-gray-300 hover:text-gray-600 text-2xl">×</button>
            </div>
            <div className="p-6 space-y-3">
              {viewDraft.matchSummary && (
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">Summary</p>
                  <p className="text-sm text-gray-600 leading-relaxed">{viewDraft.matchSummary}</p>
                </div>
              )}
            </div>
            <div className="flex gap-3 justify-end px-6 py-4 border-t border-gray-100">
              <button onClick={() => setViewDraft(null)} className="px-4 py-2 rounded-xl border border-gray-200 text-gray-400 hover:text-gray-600 text-sm transition">Close</button>
              <button onClick={() => handleLoadDraft(viewDraft)} className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm transition">Load into Editor</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MatchReports;