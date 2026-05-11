import React, { useEffect, useState, useCallback } from "react";
import API from "../../Services/api";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const SR = (runs, balls) =>
  balls > 0 ? ((runs / balls) * 100).toFixed(1) : "0.0";
const ECO = (runs, overs) =>
  overs > 0 ? (runs / overs).toFixed(2) : "0.00";

const EMPTY_PLAYER = {
  playerId: "", playerName: "", jerseyNumber: "", position: "Batsman",
  runs: "", balls: "", fours: "", sixes: "", dismissal: "not out",
  overs: "", maidens: "", runsConceded: "", wickets: "", catches: "", runOuts: "",
};

const DISMISSALS = [
  "not out", "bowled", "caught", "lbw", "run out",
  "stumped", "hit wicket", "retired hurt",
];

const EMPTY_FORM = {
  matchTitle: "", matchDate: "", venue: "", matchType: "T20",
  teamA: "", teamAScore: "", teamB: "", teamBScore: "",
  result: "", winningTeam: "", notes: "",
  playing11: Array(11).fill(null).map(() => ({ ...EMPTY_PLAYER })),
};

const AnalystMatchRecords = () => {
  const [records, setRecords] = useState([]);
  const [squadPlayers, setSquadPlayers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [activeTab, setActiveTab] = useState("info");
  const [detailRecord, setDetailRecord] = useState(null);
  const [toast, setToast] = useState({ msg: "", type: "success" });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("All");

  const fetchRecords = useCallback(async () => {
    try { const res = await API.get("/match-records"); setRecords(res.data); }
    catch { showToast("Failed to load match records ❌", "error"); }
  }, []);

  const fetchSquad = useCallback(async () => {
    try { const res = await API.get("/players/squad"); setSquadPlayers(res.data); }
    catch (err) { console.error("Squad fetch error:", err); }
  }, []);

  useEffect(() => { fetchRecords(); fetchSquad(); }, [fetchRecords, fetchSquad]);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "success" }), 3000);
  };

  const handleInfo = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handlePlayer = (idx, field, value) =>
    setForm((f) => {
      const p11 = [...f.playing11];
      p11[idx] = { ...p11[idx], [field]: value };
      if (field === "playerId") {
        const sp = squadPlayers.find((s) => s._id === value);
        if (sp) {
          p11[idx].playerName = sp.name;
          p11[idx].jerseyNumber = sp.jerseyNumber || "";
          p11[idx].position = sp.position || "Batsman";
        } else {
          p11[idx].playerName = "";
          p11[idx].jerseyNumber = "";
        }
      }
      return { ...f, playing11: p11 };
    });

  const openAdd = () => { setEditingId(null); setForm(EMPTY_FORM); setActiveTab("info"); setShowModal(true); };

  const openEdit = (rec) => {
    setEditingId(rec._id);
    const p11 = [...rec.playing11];
    while (p11.length < 11) p11.push({ ...EMPTY_PLAYER });
    setForm({
      matchTitle: rec.matchTitle, matchDate: rec.matchDate?.slice(0, 10) || "",
      venue: rec.venue || "", matchType: rec.matchType || "T20",
      teamA: rec.teamA, teamAScore: rec.teamAScore || "",
      teamB: rec.teamB, teamBScore: rec.teamBScore || "",
      result: rec.result || "", winningTeam: rec.winningTeam || "",
      notes: rec.notes || "", playing11: p11,
    });
    setActiveTab("info");
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.matchTitle || !form.matchDate || !form.teamA || !form.teamB)
      return showToast("Fill in match title, date, and both teams ❗", "error");
    setLoading(true);
    try {
      const payload = {
        ...form,
        playing11: form.playing11.filter((p) => p.playerName.trim() !== "").map((p) => ({
          ...p,
          runs: Number(p.runs) || 0, balls: Number(p.balls) || 0,
          fours: Number(p.fours) || 0, sixes: Number(p.sixes) || 0,
          overs: Number(p.overs) || 0, maidens: Number(p.maidens) || 0,
          runsConceded: Number(p.runsConceded) || 0, wickets: Number(p.wickets) || 0,
          catches: Number(p.catches) || 0, runOuts: Number(p.runOuts) || 0,
          jerseyNumber: Number(p.jerseyNumber) || 0,
        })),
      };
      if (editingId) { await API.put(`/match-records/${editingId}`, payload); showToast("Match record updated ✅"); }
      else { await API.post("/match-records", payload); showToast("Match record created ✅"); }
      fetchRecords();
      setShowModal(false);
    } catch (err) { showToast(err.response?.data?.message || "Save failed ❌", "error"); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this match record?")) return;
    try { await API.delete(`/match-records/${id}`); showToast("Record deleted 🗑️"); fetchRecords(); }
    catch { showToast("Delete failed ❌", "error"); }
  };

  const exportToExcel = (rec) => {
    const info = [
      ["Match", rec.matchTitle], ["Date", new Date(rec.matchDate).toLocaleDateString()],
      ["Venue", rec.venue || "—"], ["Type", rec.matchType],
      ["Team A", rec.teamA], ["Team A Score", rec.teamAScore || "—"],
      ["Team B", rec.teamB], ["Team B Score", rec.teamBScore || "—"],
      ["Result", rec.result || "—"], [],
      ["#", "Player", "Jersey", "Position", "Runs", "Balls", "4s", "6s", "SR", "Dismissal",
        "Overs", "Maidens", "Runs Conceded", "Wickets", "Economy", "Catches", "Run Outs"],
    ];
    rec.playing11.forEach((p, i) => info.push([
      i + 1, p.playerName, p.jerseyNumber, p.position, p.runs, p.balls, p.fours, p.sixes,
      SR(p.runs, p.balls), p.dismissal, p.overs, p.maidens, p.runsConceded, p.wickets,
      ECO(p.runsConceded, p.overs), p.catches, p.runOuts,
    ]));
    const ws = XLSX.utils.aoa_to_sheet(info);
    ws["!cols"] = Array(17).fill({ wch: 15 });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Match");
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buf], { type: "application/octet-stream" }), `${rec.matchTitle.replace(/\s+/g, "_")}.xlsx`);
  };

  const exportAll = () => {
    const rows = [["Match", "Date", "Venue", "Type", "Team A", "Score A", "Team B", "Score B", "Result", "Added By"]];
    records.forEach((r) => rows.push([
      r.matchTitle, new Date(r.matchDate).toLocaleDateString(), r.venue || "—", r.matchType,
      r.teamA, r.teamAScore || "—", r.teamB, r.teamBScore || "—", r.result || "—", r.createdBy?.name || "—",
    ]));
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws["!cols"] = Array(10).fill({ wch: 18 });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "All Matches");
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buf], { type: "application/octet-stream" }), "All_Match_Records.xlsx");
  };

  const filtered = records.filter((r) => {
    const matchSearch =
      r.matchTitle?.toLowerCase().includes(search.toLowerCase()) ||
      r.teamA?.toLowerCase().includes(search.toLowerCase()) ||
      r.teamB?.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === "All" || r.matchType === filterType;
    return matchSearch && matchType;
  });

  const totalRuns = records.reduce((sum, r) => sum + r.playing11.reduce((s, p) => s + (p.runs || 0), 0), 0);
  const totalWickets = records.reduce((sum, r) => sum + r.playing11.reduce((s, p) => s + (p.wickets || 0), 0), 0);

  const PlayerDropdown = ({ p, i }) => (
    <td className="py-2 pr-3">
      <select
        value={p.playerId}
        onChange={(e) => handlePlayer(i, "playerId", e.target.value)}
        style={{ backgroundColor: "#f5f3ff", color: "#4c1d95" }}
        className="border border-purple-200 rounded-lg px-2 py-1.5 text-xs w-full focus:outline-none focus:border-purple-500 transition"
      >
        <option value="" style={{ backgroundColor: "#f5f3ff", color: "#4c1d95" }}>— Select Player —</option>
        {squadPlayers.map((sp) => (
          <option key={sp._id} value={sp._id} style={{ backgroundColor: "#f5f3ff", color: "#4c1d95" }}>
            {sp.name}{sp.jerseyNumber ? ` (#${sp.jerseyNumber})` : ""}
          </option>
        ))}
      </select>
      {p.playerName && <p className="text-[10px] text-purple-600 mt-0.5 pl-1">{p.playerName}</p>}
    </td>
  );

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 p-6 font-sans">

      {/* TOAST */}
      {toast.msg && (
        <div className={`fixed top-5 right-5 z-[999] px-5 py-3 rounded-xl shadow-2xl text-sm font-semibold text-white
          ${toast.type === "error" ? "bg-red-500" : "bg-purple-600"}`}>
          {toast.msg}
        </div>
      )}

      {/* HEADER */}
      <div className="flex flex-wrap gap-4 justify-between items-center mb-8">
        <div>
          <p className="text-xs text-purple-500 font-semibold uppercase tracking-widest mb-1">Analyst Hub</p>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Match Records</h1>
          <p className="text-gray-400 text-sm mt-1">
            {records.length} matches · {filtered.length} showing · Synced with Coach
          </p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <button onClick={exportAll}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-purple-200 text-purple-600 hover:bg-purple-50 text-sm font-medium transition">
            ⬇ Export All
          </button>
          <button onClick={openAdd}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition shadow-lg shadow-purple-200">
            + Add Match
          </button>
        </div>
      </div>

      {/* STAT PILLS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Matches", val: records.length, color: "purple", bg: "bg-purple-50", border: "border-purple-100", text: "text-purple-700" },
          { label: "Total Runs", val: totalRuns.toLocaleString(), color: "emerald", bg: "bg-emerald-50", border: "border-emerald-100", text: "text-emerald-700" },
          { label: "Total Wickets", val: totalWickets, color: "amber", bg: "bg-amber-50", border: "border-amber-100", text: "text-amber-700" },
          { label: "Avg Runs/Match", val: records.length ? Math.round(totalRuns / records.length) : 0, color: "violet", bg: "bg-violet-50", border: "border-violet-100", text: "text-violet-700" },
        ].map((s) => (
          <div key={s.label} className={`${s.bg} border ${s.border} rounded-2xl p-4 hover:shadow-md transition`}>
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">{s.label}</p>
            <p className={`text-2xl font-extrabold ${s.text}`}>{s.val}</p>
          </div>
        ))}
      </div>

      {/* FILTERS */}
      <div className="flex flex-wrap gap-3 mb-6 items-center">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍  Search match or team…"
          className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 placeholder:text-gray-300 focus:outline-none focus:border-purple-400 transition w-64 shadow-sm"
        />
        <div className="flex gap-2">
          {["All", "T20", "ODI", "Test", "Other"].map((t) => (
            <button key={t} onClick={() => setFilterType(t)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition
                ${filterType === t
                  ? "bg-purple-600 text-white shadow-md"
                  : "border border-gray-200 text-gray-500 hover:text-purple-600 hover:border-purple-300 bg-white"}`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* CARDS */}
      {filtered.length === 0 ? (
        <div className="text-center py-24 text-gray-300">
          <div className="text-5xl mb-3">📊</div>
          <p className="text-lg font-medium text-gray-400">No match records found</p>
          <p className="text-sm mt-1 text-gray-300">Records added by coach will appear here automatically</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filtered.map((rec) => (
            <AnalystMatchCard
              key={rec._id} rec={rec}
              onView={() => setDetailRecord(rec)}
              onEdit={() => openEdit(rec)}
              onDelete={() => handleDelete(rec._id)}
              onExport={() => exportToExcel(rec)}
            />
          ))}
        </div>
      )}

      {/* ADD / EDIT MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-start justify-center overflow-y-auto py-8 px-4">
          <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-4xl shadow-2xl">
            <div className="flex justify-between items-center px-7 py-5 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">
                {editingId ? "Edit Match Record" : "Add New Match Record"}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-300 hover:text-gray-600 text-2xl">×</button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-100 px-7">
              {["info", "batting", "bowling", "fielding"].map((t) => (
                <button key={t} onClick={() => setActiveTab(t)}
                  className={`px-5 py-3 text-sm font-semibold capitalize transition border-b-2 mr-1
                    ${activeTab === t ? "border-purple-500 text-purple-600" : "border-transparent text-gray-400 hover:text-gray-600"}`}>
                  {t === "info" ? "Match Info" : t}
                </button>
              ))}
            </div>

            <div className="p-7 space-y-5">

              {activeTab === "info" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <AField label="Match Title *" name="matchTitle" value={form.matchTitle} onChange={handleInfo} placeholder="e.g. T20 5 of 70" />
                    <AField label="Match Date *" name="matchDate" type="date" value={form.matchDate} onChange={handleInfo} />
                    <AField label="Venue" name="venue" value={form.venue} onChange={handleInfo} placeholder="e.g. Wankhede" />
                    <ASelectField label="Match Type" name="matchType" value={form.matchType} onChange={handleInfo} options={["T20", "ODI", "Test", "Other"]} />
                    <AField label="Team A *" name="teamA" value={form.teamA} onChange={handleInfo} placeholder="Team A name" />
                    <AField label="Team A Score" name="teamAScore" value={form.teamAScore} onChange={handleInfo} placeholder="e.g. 185/6 (20)" />
                    <AField label="Team B *" name="teamB" value={form.teamB} onChange={handleInfo} placeholder="Team B name" />
                    <AField label="Team B Score" name="teamBScore" value={form.teamBScore} onChange={handleInfo} placeholder="e.g. 163/8 (20)" />
                    <AField label="Result" name="result" value={form.result} onChange={handleInfo} placeholder="e.g. Team A won by 22 runs" className="sm:col-span-2" />
                    <AField label="Winning Team" name="winningTeam" value={form.winningTeam} onChange={handleInfo} placeholder="Winning team name" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-widest">Notes</label>
                    <textarea name="notes" value={form.notes} onChange={handleInfo} rows={3}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 placeholder:text-gray-300 focus:outline-none focus:border-purple-400 resize-none"
                      placeholder="Analysis notes…" />
                  </div>
                </div>
              )}

              {activeTab === "batting" && (
                <div className="space-y-3">
                  <p className="text-xs text-gray-400 uppercase tracking-widest mb-4">
                    Playing 11 — Batting Stats
                    {squadPlayers.length > 0 && <span className="ml-2 text-purple-500 normal-case">({squadPlayers.length} squad players available)</span>}
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-gray-400 text-xs uppercase tracking-wider">
                          <th className="text-left py-2 pr-3">#</th>
                          <th className="text-left py-2 pr-3 min-w-[170px]">Player</th>
                          <th className="py-2 pr-3">Runs</th><th className="py-2 pr-3">Balls</th>
                          <th className="py-2 pr-3">4s</th><th className="py-2 pr-3">6s</th>
                          <th className="py-2 pr-3">SR</th>
                          <th className="text-left py-2 min-w-[110px]">Dismissal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {form.playing11.map((p, i) => (
                          <tr key={i} className="border-t border-gray-100">
                            <td className="py-2 pr-3 text-gray-300 text-xs">{i + 1}</td>
                            <PlayerDropdown p={p} i={i} />
                            {["runs", "balls", "fours", "sixes"].map((f) => (
                              <td key={f} className="py-2 pr-3">
                                <ANumInput val={p[f]} onChange={(v) => handlePlayer(i, f, v)} />
                              </td>
                            ))}
                            <td className="py-2 pr-3 text-center text-gray-400 text-xs">{SR(p.runs, p.balls)}</td>
                            <td className="py-2">
                              <select value={p.dismissal} onChange={(e) => handlePlayer(i, "dismissal", e.target.value)}
                                style={{ backgroundColor: "#f5f3ff", color: "#4c1d95" }}
                                className="border border-purple-200 rounded-lg px-2 py-1.5 text-xs w-full focus:outline-none focus:border-purple-400 transition">
                                {DISMISSALS.map((d) => <option key={d} value={d} style={{ backgroundColor: "#f5f3ff", color: "#4c1d95" }}>{d}</option>)}
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === "bowling" && (
                <div className="space-y-3">
                  <p className="text-xs text-gray-400 uppercase tracking-widest mb-4">Playing 11 — Bowling Stats</p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-gray-400 text-xs uppercase tracking-wider">
                          <th className="text-left py-2 pr-3">#</th>
                          <th className="text-left py-2 pr-3 min-w-[170px]">Player</th>
                          <th className="py-2 pr-3">Overs</th><th className="py-2 pr-3">Maidens</th>
                          <th className="py-2 pr-3">Runs</th><th className="py-2 pr-3">Wickets</th>
                          <th className="py-2">Economy</th>
                        </tr>
                      </thead>
                      <tbody>
                        {form.playing11.map((p, i) => (
                          <tr key={i} className="border-t border-gray-100">
                            <td className="py-2 pr-3 text-gray-300 text-xs">{i + 1}</td>
                            <PlayerDropdown p={p} i={i} />
                            {["overs", "maidens", "runsConceded", "wickets"].map((f) => (
                              <td key={f} className="py-2 pr-3">
                                <ANumInput val={p[f]} onChange={(v) => handlePlayer(i, f, v)} />
                              </td>
                            ))}
                            <td className="py-2 text-center text-gray-400 text-xs">{ECO(p.runsConceded, p.overs)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === "fielding" && (
                <div className="space-y-3">
                  <p className="text-xs text-gray-400 uppercase tracking-widest mb-4">Playing 11 — Fielding Stats</p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-gray-400 text-xs uppercase tracking-wider">
                          <th className="text-left py-2 pr-3">#</th>
                          <th className="text-left py-2 pr-3 min-w-[170px]">Player</th>
                          <th className="py-2 pr-3">Catches</th><th className="py-2">Run Outs</th>
                        </tr>
                      </thead>
                      <tbody>
                        {form.playing11.map((p, i) => (
                          <tr key={i} className="border-t border-gray-100">
                            <td className="py-2 pr-3 text-gray-300 text-xs">{i + 1}</td>
                            <PlayerDropdown p={p} i={i} />
                            {["catches", "runOuts"].map((f) => (
                              <td key={f} className="py-2 pr-3">
                                <ANumInput val={p[f]} onChange={(v) => handlePlayer(i, f, v)} />
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 px-7 py-5 border-t border-gray-100">
              <button onClick={() => setShowModal(false)}
                className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-500 hover:text-gray-700 text-sm transition">
                Cancel
              </button>
              <button onClick={handleSave} disabled={loading}
                className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm transition shadow-lg disabled:opacity-50">
                {loading ? "Saving…" : editingId ? "Update" : "Save Record"}
              </button>
            </div>
          </div>
        </div>
      )}

      {detailRecord && (
        <AnalystDetailModal rec={detailRecord} onClose={() => setDetailRecord(null)} onExport={() => exportToExcel(detailRecord)} />
      )}
    </div>
  );
};

/* CARD */
const AnalystMatchCard = ({ rec, onView, onEdit, onDelete, onExport }) => {
  const topBatter = rec.playing11.reduce((top, p) => (p.runs || 0) > (top.runs || 0) ? p : top, { runs: 0, playerName: "—" });
  const topBowler = rec.playing11.reduce((top, p) => (p.wickets || 0) > (top.wickets || 0) ? p : top, { wickets: 0, playerName: "—" });

  return (
    <div className="group bg-white border border-gray-100 hover:border-purple-200 rounded-2xl p-5 transition-all duration-300 hover:shadow-lg hover:shadow-purple-100">
      <div className="flex justify-between text-xs text-gray-400 mb-3">
        <span className="bg-purple-50 text-purple-600 px-2.5 py-0.5 rounded-full font-medium border border-purple-100">
          {rec.matchType} · {rec.matchTitle}
        </span>
        <span>{new Date(rec.matchDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
      </div>
      <div className="space-y-1 mb-3">
        <div className="flex justify-between">
          <span className="font-bold text-gray-900">{rec.teamA}</span>
          <span className="text-purple-600 font-mono text-sm">{rec.teamAScore || "—"}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-semibold text-gray-400">{rec.teamB}</span>
          <span className="text-gray-400 font-mono text-sm">{rec.teamBScore || "—"}</span>
        </div>
      </div>
      {rec.result && <p className="text-xs text-purple-500 font-medium mb-3">{rec.result}</p>}
      {rec.playing11.length > 0 && (
        <div className="flex gap-2 mb-3">
          {topBatter.runs > 0 && (
            <span className="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full border border-emerald-100">
              🏏 {topBatter.playerName} {topBatter.runs}
            </span>
          )}
          {topBowler.wickets > 0 && (
            <span className="text-[10px] bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full border border-amber-100">
              🎳 {topBowler.playerName} {topBowler.wickets}w
            </span>
          )}
        </div>
      )}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <span className="text-[10px] text-gray-300">
          By {rec.createdBy?.name || "—"} ({rec.createdByRole || "—"}) · {rec.playing11?.length || 0} players
        </span>
        <div className="flex gap-2">
          <ABtnA onClick={onExport} label="↓ Excel" color="green" />
          <ABtnA onClick={onView} label="Scorecard" color="purple" />
          <ABtnA onClick={onEdit} label="Edit" color="yellow" />
          <ABtnA onClick={onDelete} label="Del" color="red" />
        </div>
      </div>
    </div>
  );
};

/* DETAIL MODAL */
const AnalystDetailModal = ({ rec, onClose, onExport }) => {
  const [tab, setTab] = useState("batting");
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-5xl shadow-2xl my-auto">
        <div className="flex justify-between items-start px-7 py-5 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{rec.matchTitle}</h2>
            <p className="text-sm text-gray-400 mt-0.5">
              {rec.teamA} vs {rec.teamB} · {new Date(rec.matchDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
              {rec.venue && ` · ${rec.venue}`}
            </p>
            {rec.result && <p className="text-purple-600 text-sm mt-1 font-semibold">{rec.result}</p>}
          </div>
          <div className="flex gap-3 items-center">
            <button onClick={onExport} className="text-xs bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg font-semibold transition">↓ Export Excel</button>
            <button onClick={onClose} className="text-gray-300 hover:text-gray-600 text-2xl">×</button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 px-7 py-4 border-b border-gray-100">
          <div className="bg-purple-50 border border-purple-100 rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-1">{rec.teamA}</p>
            <p className="text-3xl font-extrabold text-purple-700">{rec.teamAScore || "—"}</p>
          </div>
          <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-1">{rec.teamB}</p>
            <p className="text-3xl font-extrabold text-gray-400">{rec.teamBScore || "—"}</p>
          </div>
        </div>
        <div className="flex px-7 border-b border-gray-100">
          {["batting", "bowling", "fielding"].map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-5 py-3 text-sm font-semibold capitalize transition border-b-2 mr-1
                ${tab === t ? "border-purple-500 text-purple-600" : "border-transparent text-gray-400 hover:text-gray-600"}`}>
              {t}
            </button>
          ))}
        </div>
        <div className="p-7 overflow-x-auto">
          {rec.playing11.length === 0 ? (
            <p className="text-center text-gray-300 py-10">No player data recorded</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 text-xs uppercase tracking-wider border-b border-gray-100">
                  {tab === "batting" && (<><th className="text-left py-2 pb-3 pr-4">Player</th><th className="py-2 px-3">R</th><th className="py-2 px-3">B</th><th className="py-2 px-3">4s</th><th className="py-2 px-3">6s</th><th className="py-2 px-3">SR</th><th className="text-left py-2 pl-4">Dismissal</th></>)}
                  {tab === "bowling" && (<><th className="text-left py-2 pb-3 pr-4">Player</th><th className="py-2 px-3">O</th><th className="py-2 px-3">M</th><th className="py-2 px-3">R</th><th className="py-2 px-3">W</th><th className="py-2 px-3">Eco</th></>)}
                  {tab === "fielding" && (<><th className="text-left py-2 pb-3 pr-4">Player</th><th className="py-2 px-3">Catches</th><th className="py-2 px-3">Run Outs</th></>)}
                </tr>
              </thead>
              <tbody>
                {rec.playing11.map((p, i) => (
                  <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition">
                    <td className="py-3 pr-4">
                      <span className="font-semibold text-gray-800">{p.playerName}</span>
                      <span className="text-gray-300 text-xs ml-2">#{p.jerseyNumber}</span>
                    </td>
                    {tab === "batting" && (<><td className="py-3 px-3 text-center font-bold text-purple-600 text-base">{p.runs}</td><td className="py-3 px-3 text-center text-gray-400">{p.balls}</td><td className="py-3 px-3 text-center text-gray-400">{p.fours}</td><td className="py-3 px-3 text-center text-gray-400">{p.sixes}</td><td className="py-3 px-3 text-center text-gray-300 text-xs">{SR(p.runs, p.balls)}</td><td className="py-3 pl-4 text-gray-400 text-xs">{p.dismissal}</td></>)}
                    {tab === "bowling" && (<><td className="py-3 px-3 text-center text-gray-400">{p.overs}</td><td className="py-3 px-3 text-center text-gray-400">{p.maidens}</td><td className="py-3 px-3 text-center text-gray-400">{p.runsConceded}</td><td className="py-3 px-3 text-center font-bold text-purple-600 text-base">{p.wickets}</td><td className="py-3 px-3 text-center text-gray-300 text-xs">{ECO(p.runsConceded, p.overs)}</td></>)}
                    {tab === "fielding" && (<><td className="py-3 px-3 text-center text-gray-400">{p.catches}</td><td className="py-3 px-3 text-center text-gray-400">{p.runOuts}</td></>)}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {rec.notes && (
          <div className="px-7 pb-6">
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Notes</p>
            <p className="text-sm text-gray-500 bg-gray-50 rounded-xl p-4">{rec.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
};

/* Shared UI */
const AField = ({ label, name, value, onChange, type = "text", placeholder = "", className = "" }) => (
  <div className={className}>
    <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-widest">{label}</label>
    <input type={type} name={name} value={value} onChange={onChange} placeholder={placeholder}
      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 placeholder:text-gray-300 focus:outline-none focus:border-purple-400 transition" />
  </div>
);

const ASelectField = ({ label, name, value, onChange, options }) => (
  <div>
    <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-widest">{label}</label>
    <select name={name} value={value} onChange={onChange}
      style={{ backgroundColor: "#f9fafb", color: "#374151" }}
      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-400 transition">
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  </div>
);

const ANumInput = ({ val, onChange }) => (
  <input type="number" min="0" value={val} onChange={(e) => onChange(e.target.value)}
    className="w-14 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-xs text-gray-700 text-center focus:outline-none focus:border-purple-400 transition" />
);

const abtnColors = {
  green: "bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-100",
  purple: "bg-purple-50 hover:bg-purple-100 text-purple-600 border border-purple-100",
  yellow: "bg-amber-50 hover:bg-amber-100 text-amber-600 border border-amber-100",
  red: "bg-red-50 hover:bg-red-100 text-red-500 border border-red-100",
};

const ABtnA = ({ onClick, label, color }) => (
  <button onClick={onClick} className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${abtnColors[color]}`}>{label}</button>
);

export default AnalystMatchRecords;