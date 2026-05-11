import React, { useEffect, useState, useCallback } from "react";
import API from "../../Services/api";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

/* ─── tiny helpers ─────────────────────────────────────── */
const SR = (runs, balls) =>
  balls > 0 ? ((runs / balls) * 100).toFixed(1) : "0.0";
const ECO = (runs, overs) =>
  overs > 0 ? (runs / overs).toFixed(2) : "0.00";

const EMPTY_PLAYER = {
  playerId: "",
  playerName: "",
  jerseyNumber: "",
  position: "Batsman",
  runs: "",
  balls: "",
  fours: "",
  sixes: "",
  dismissal: "not out",
  overs: "",
  maidens: "",
  runsConceded: "",
  wickets: "",
  catches: "",
  runOuts: "",
};

const DISMISSALS = [
  "not out", "bowled", "caught", "lbw", "run out",
  "stumped", "hit wicket", "retired hurt",
];

const EMPTY_FORM = {
  matchTitle: "",
  matchDate: "",
  venue: "",
  matchType: "T20",
  teamA: "",
  teamAScore: "",
  teamB: "",
  teamBScore: "",
  result: "",
  winningTeam: "",
  notes: "",
  playing11: Array(11).fill(null).map(() => ({ ...EMPTY_PLAYER })),
};

/* ═══════════════════════════════════════════════════════════
   COMPONENT
═══════════════════════════════════════════════════════════ */
const CoachMatchRecords = () => {
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

  const fetchRecords = useCallback(async () => {
    try {
      const res = await API.get("/match-records");
      setRecords(res.data);
    } catch (err) {
      showToast("Failed to load records ❌", "error");
    }
  }, []);

  const fetchSquad = useCallback(async () => {
    try {
      const res = await API.get("/players");
      setSquadPlayers(res.data);
    } catch (err) {
      console.error("Squad fetch error:", err);
    }
  }, []);

  useEffect(() => {
    fetchRecords();
    fetchSquad();
  }, [fetchRecords, fetchSquad]);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "success" }), 3000);
  };

  const handleInfo = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handlePlayer = (idx, field, value) => {
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
  };

  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setActiveTab("info");
    setShowModal(true);
  };

  const openEdit = (rec) => {
    setEditingId(rec._id);
    const p11 = [...rec.playing11];
    while (p11.length < 11) p11.push({ ...EMPTY_PLAYER });
    setForm({
      matchTitle: rec.matchTitle,
      matchDate: rec.matchDate?.slice(0, 10) || "",
      venue: rec.venue || "",
      matchType: rec.matchType || "T20",
      teamA: rec.teamA,
      teamAScore: rec.teamAScore || "",
      teamB: rec.teamB,
      teamBScore: rec.teamBScore || "",
      result: rec.result || "",
      winningTeam: rec.winningTeam || "",
      notes: rec.notes || "",
      playing11: p11,
    });
    setActiveTab("info");
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.matchTitle || !form.matchDate || !form.teamA || !form.teamB) {
      return showToast("Fill in match title, date, and both teams ❗", "error");
    }
    setLoading(true);
    try {
      const payload = {
        ...form,
        playing11: form.playing11
          .filter((p) => p.playerName.trim() !== "")
          .map((p) => ({
            ...p,
            runs: Number(p.runs) || 0,
            balls: Number(p.balls) || 0,
            fours: Number(p.fours) || 0,
            sixes: Number(p.sixes) || 0,
            overs: Number(p.overs) || 0,
            maidens: Number(p.maidens) || 0,
            runsConceded: Number(p.runsConceded) || 0,
            wickets: Number(p.wickets) || 0,
            catches: Number(p.catches) || 0,
            runOuts: Number(p.runOuts) || 0,
            jerseyNumber: Number(p.jerseyNumber) || 0,
          })),
      };
      if (editingId) {
        await API.put(`/match-records/${editingId}`, payload);
        showToast("Match updated ✅");
      } else {
        await API.post("/match-records", payload);
        showToast("Match record saved ✅");
      }
      fetchRecords();
      setShowModal(false);
    } catch (err) {
      showToast(err.response?.data?.message || "Save failed ❌", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this match record?")) return;
    try {
      await API.delete(`/match-records/${id}`);
      showToast("Deleted 🗑️");
      fetchRecords();
    } catch {
      showToast("Delete failed ❌", "error");
    }
  };

  const exportToExcel = (rec) => {
    const info = [
      ["Match", rec.matchTitle],
      ["Date", new Date(rec.matchDate).toLocaleDateString()],
      ["Venue", rec.venue || "—"],
      ["Type", rec.matchType],
      ["Team A", rec.teamA],
      ["Team A Score", rec.teamAScore || "—"],
      ["Team B", rec.teamB],
      ["Team B Score", rec.teamBScore || "—"],
      ["Result", rec.result || "—"],
      [],
      ["#", "Player", "Jersey", "Position", "Runs", "Balls", "4s", "6s", "SR", "Dismissal",
        "Overs", "Maidens", "Runs Given", "Wickets", "Economy", "Catches", "Run Outs"],
    ];
    rec.playing11.forEach((p, i) => {
      info.push([
        i + 1, p.playerName, p.jerseyNumber, p.position,
        p.runs, p.balls, p.fours, p.sixes,
        SR(p.runs, p.balls), p.dismissal,
        p.overs, p.maidens, p.runsConceded, p.wickets, ECO(p.runsConceded, p.overs),
        p.catches, p.runOuts,
      ]);
    });
    const ws = XLSX.utils.aoa_to_sheet(info);
    ws["!cols"] = Array(17).fill({ wch: 14 });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Match");
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buf], { type: "application/octet-stream" }),
      `${rec.matchTitle.replace(/\s+/g, "_")}.xlsx`);
  };

  const exportAll = () => {
    const rows = [["Match", "Date", "Venue", "Type", "Team A", "Score A",
      "Team B", "Score B", "Result", "Added By"]];
    records.forEach((r) => {
      rows.push([
        r.matchTitle,
        new Date(r.matchDate).toLocaleDateString(),
        r.venue || "—",
        r.matchType,
        r.teamA, r.teamAScore || "—",
        r.teamB, r.teamBScore || "—",
        r.result || "—",
        r.createdBy?.name || "—",
      ]);
    });
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws["!cols"] = Array(10).fill({ wch: 18 });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "All Matches");
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buf], { type: "application/octet-stream" }), "All_Match_Records.xlsx");
  };

  const filtered = records.filter((r) =>
    r.matchTitle?.toLowerCase().includes(search.toLowerCase()) ||
    r.teamA?.toLowerCase().includes(search.toLowerCase()) ||
    r.teamB?.toLowerCase().includes(search.toLowerCase())
  );

  /* ── PLAYER DROPDOWN — reusable, visible on dark bg ── */
  const PlayerDropdown = ({ p, i }) => (
    <td className="py-2 pr-3">
      <select
        value={p.playerId}
        onChange={(e) => handlePlayer(i, "playerId", e.target.value)}
        style={{ backgroundColor: "#0d2410", color: "#ffffff" }}
        className="border border-emerald-700/50 rounded-lg px-2 py-1.5 text-xs w-full focus:outline-none focus:border-emerald-400 transition"
      >
        <option value="" style={{ backgroundColor: "#0d2410", color: "#ffffff" }}>— Select Player —</option>
        {squadPlayers.map((sp) => (
          <option key={sp._id} value={sp._id} style={{ backgroundColor: "#0d2410", color: "#ffffff" }}>
            {sp.name}{sp.jerseyNumber ? ` (#${sp.jerseyNumber})` : ""}
          </option>
        ))}
      </select>
      {p.playerName && (
        <p className="text-[10px] text-emerald-400 mt-0.5 pl-1">{p.playerName}</p>
      )}
    </td>
  );

  /* ════════════════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a1f0a] via-[#0f2d12] to-[#071a07] text-white p-6 font-sans">

      {/* TOAST */}
      {toast.msg && (
        <div className={`fixed top-5 right-5 z-[999] px-5 py-3 rounded-xl shadow-2xl text-sm font-semibold
          ${toast.type === "error" ? "bg-red-600" : "bg-emerald-600"}`}>
          {toast.msg}
        </div>
      )}

      {/* ── HEADER ── */}
      <div className="flex flex-wrap gap-3 justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Match Records</h1>
          <p className="text-green-400 text-sm mt-1">
            {records.length} matches recorded · Synced with Analyst
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={exportAll}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-green-500/40 text-green-300 hover:bg-green-900/40 text-sm font-medium transition">
            ⬇ Export All
          </button>
          <button onClick={openAdd}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-5 py-2.5 rounded-xl text-sm transition shadow-lg shadow-emerald-900">
            + Add Match
          </button>
        </div>
      </div>

      {/* ── SEARCH ── */}
      <div className="mb-6">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍  Search by match title or team…"
          className="w-full max-w-sm bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-emerald-500 transition"
        />
      </div>

      {/* ── CARDS ── */}
      {filtered.length === 0 ? (
        <div className="text-center py-24 text-white/30">
          <div className="text-5xl mb-3">🏏</div>
          <p className="text-lg font-medium">No match records yet</p>
          <p className="text-sm mt-1">Click "+ Add Match" to create the first one</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-5">
          {filtered.map((rec) => (
            <MatchCard
              key={rec._id}
              rec={rec}
              onView={() => setDetailRecord(rec)}
              onEdit={() => openEdit(rec)}
              onDelete={() => handleDelete(rec._id)}
              onExport={() => exportToExcel(rec)}
            />
          ))}
        </div>
      )}

      {/* ═══ ADD / EDIT MODAL ═══ */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-start justify-center overflow-y-auto py-8 px-4">
          <div className="bg-[#0d2410] border border-green-800/50 rounded-2xl w-full max-w-4xl shadow-2xl">

            <div className="flex justify-between items-center px-7 py-5 border-b border-green-800/40">
              <h2 className="text-xl font-bold text-white">
                {editingId ? "Edit Match Record" : "Add New Match Record"}
              </h2>
              <button onClick={() => setShowModal(false)}
                className="text-white/40 hover:text-white text-2xl leading-none">×</button>
            </div>

            {/* Tab bar */}
            <div className="flex border-b border-green-800/40 px-7">
              {["info", "batting", "bowling", "fielding"].map((t) => (
                <button key={t} onClick={() => setActiveTab(t)}
                  className={`px-5 py-3 text-sm font-semibold capitalize transition border-b-2 mr-1
                    ${activeTab === t
                      ? "border-emerald-400 text-emerald-400"
                      : "border-transparent text-white/40 hover:text-white/70"}`}>
                  {t === "info" ? "Match Info" : t}
                </button>
              ))}
            </div>

            <div className="p-7 space-y-6">

              {/* ── MATCH INFO ── */}
              {activeTab === "info" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Match Title *" name="matchTitle" value={form.matchTitle}
                      onChange={handleInfo} placeholder="e.g. T20 5 of 70" />
                    <Field label="Match Date *" name="matchDate" type="date"
                      value={form.matchDate} onChange={handleInfo} />
                    <Field label="Venue" name="venue" value={form.venue}
                      onChange={handleInfo} placeholder="e.g. Wankhede Stadium" />
                    <SelectField label="Match Type" name="matchType" value={form.matchType}
                      onChange={handleInfo} options={["T20", "ODI", "Test", "Other"]} />
                    <Field label="Team A *" name="teamA" value={form.teamA}
                      onChange={handleInfo} placeholder="e.g. FC Thunder" />
                    <Field label="Team A Score" name="teamAScore" value={form.teamAScore}
                      onChange={handleInfo} placeholder="e.g. 185/6 (20)" />
                    <Field label="Team B *" name="teamB" value={form.teamB}
                      onChange={handleInfo} placeholder="e.g. Rising Stars" />
                    <Field label="Team B Score" name="teamBScore" value={form.teamBScore}
                      onChange={handleInfo} placeholder="e.g. 163/8 (20)" />
                    <Field label="Result" name="result" value={form.result}
                      onChange={handleInfo} placeholder="e.g. FC Thunder won by 22 runs"
                      className="sm:col-span-2" />
                    <Field label="Winning Team" name="winningTeam" value={form.winningTeam}
                      onChange={handleInfo} placeholder="e.g. FC Thunder" />
                  </div>
                  <div>
                    <label className="block text-xs text-white/50 mb-1.5 uppercase tracking-widest">Notes</label>
                    <textarea name="notes" value={form.notes} onChange={handleInfo} rows={3}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-emerald-500 resize-none"
                      placeholder="Match notes, highlights…" />
                  </div>
                </div>
              )}

              {/* ── BATTING ── */}
              {activeTab === "batting" && (
                <div className="space-y-3">
                  <p className="text-xs text-white/40 uppercase tracking-widest mb-4">
                    Playing 11 — Batting Stats
                    {squadPlayers.length > 0 && (
                      <span className="ml-2 text-emerald-400 normal-case">
                        ({squadPlayers.length} squad players)
                      </span>
                    )}
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-white/40 text-xs uppercase tracking-wider">
                          <th className="text-left py-2 pr-3">#</th>
                          <th className="text-left py-2 pr-3 min-w-[170px]">Player</th>
                          <th className="py-2 pr-3">Runs</th>
                          <th className="py-2 pr-3">Balls</th>
                          <th className="py-2 pr-3">4s</th>
                          <th className="py-2 pr-3">6s</th>
                          <th className="py-2 pr-3">SR</th>
                          <th className="text-left py-2 min-w-[120px]">Dismissal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {form.playing11.map((p, i) => (
                          <tr key={i} className="border-t border-white/5">
                            <td className="py-2 pr-3 text-white/40 text-xs">{i + 1}</td>
                            <PlayerDropdown p={p} i={i} />
                            {["runs", "balls", "fours", "sixes"].map((f) => (
                              <td key={f} className="py-2 pr-3">
                                <NumInput val={p[f]} onChange={(v) => handlePlayer(i, f, v)} />
                              </td>
                            ))}
                            <td className="py-2 pr-3 text-center text-white/60 text-xs">
                              {SR(p.runs, p.balls)}
                            </td>
                            <td className="py-2">
                              <select
                                value={p.dismissal}
                                onChange={(e) => handlePlayer(i, "dismissal", e.target.value)}
                                style={{ backgroundColor: "#0d2410", color: "#ffffff" }}
                                className="border border-emerald-700/50 rounded-lg px-2 py-1.5 text-xs w-full focus:outline-none focus:border-emerald-400 transition"
                              >
                                {DISMISSALS.map((d) => (
                                  <option key={d} value={d} style={{ backgroundColor: "#0d2410", color: "#ffffff" }}>{d}</option>
                                ))}
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ── BOWLING ── */}
              {activeTab === "bowling" && (
                <div className="space-y-3">
                  <p className="text-xs text-white/40 uppercase tracking-widest mb-4">
                    Playing 11 — Bowling Stats
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-white/40 text-xs uppercase tracking-wider">
                          <th className="text-left py-2 pr-3">#</th>
                          <th className="text-left py-2 pr-3 min-w-[170px]">Player</th>
                          <th className="py-2 pr-3">Overs</th>
                          <th className="py-2 pr-3">Maidens</th>
                          <th className="py-2 pr-3">Runs</th>
                          <th className="py-2 pr-3">Wickets</th>
                          <th className="py-2">Economy</th>
                        </tr>
                      </thead>
                      <tbody>
                        {form.playing11.map((p, i) => (
                          <tr key={i} className="border-t border-white/5">
                            <td className="py-2 pr-3 text-white/40 text-xs">{i + 1}</td>
                            <PlayerDropdown p={p} i={i} />
                            {["overs", "maidens", "runsConceded", "wickets"].map((f) => (
                              <td key={f} className="py-2 pr-3">
                                <NumInput val={p[f]} onChange={(v) => handlePlayer(i, f, v)} />
                              </td>
                            ))}
                            <td className="py-2 text-center text-white/60 text-xs">
                              {ECO(p.runsConceded, p.overs)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ── FIELDING ── */}
              {activeTab === "fielding" && (
                <div className="space-y-3">
                  <p className="text-xs text-white/40 uppercase tracking-widest mb-4">
                    Playing 11 — Fielding Stats
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-white/40 text-xs uppercase tracking-wider">
                          <th className="text-left py-2 pr-3">#</th>
                          <th className="text-left py-2 pr-3 min-w-[170px]">Player</th>
                          <th className="py-2 pr-3">Catches</th>
                          <th className="py-2">Run Outs</th>
                        </tr>
                      </thead>
                      <tbody>
                        {form.playing11.map((p, i) => (
                          <tr key={i} className="border-t border-white/5">
                            <td className="py-2 pr-3 text-white/40 text-xs">{i + 1}</td>
                            <PlayerDropdown p={p} i={i} />
                            {["catches", "runOuts"].map((f) => (
                              <td key={f} className="py-2 pr-3">
                                <NumInput val={p[f]} onChange={(v) => handlePlayer(i, f, v)} />
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

            {/* Modal footer */}
            <div className="flex justify-end gap-3 px-7 py-5 border-t border-green-800/40">
              <button onClick={() => setShowModal(false)}
                className="px-5 py-2.5 rounded-xl border border-white/20 text-white/60 hover:text-white text-sm transition">
                Cancel
              </button>
              <button onClick={handleSave} disabled={loading}
                className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm transition shadow-lg disabled:opacity-50">
                {loading ? "Saving…" : editingId ? "Update Record" : "Save Record"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {detailRecord && (
        <DetailModal rec={detailRecord} onClose={() => setDetailRecord(null)}
          onExport={() => exportToExcel(detailRecord)} />
      )}
    </div>
  );
};

/* ─── MATCH CARD ───────────────────────────────────────── */
const MatchCard = ({ rec, onView, onEdit, onDelete, onExport }) => (
  <div className="group bg-white/5 border border-white/10 hover:border-emerald-500/40 rounded-2xl p-5 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-900/30">
    <div className="flex justify-between text-xs text-white/40 mb-3">
      <span className="bg-emerald-900/40 text-emerald-300 px-2 py-0.5 rounded-full">
        {rec.matchType}
      </span>
      <span>{new Date(rec.matchDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
    </div>
    <div className="space-y-1 mb-3">
      <div className="flex justify-between items-center">
        <span className="font-bold text-white text-base">{rec.teamA}</span>
        <span className="text-emerald-300 font-mono text-sm">{rec.teamAScore || "—"}</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="font-bold text-white/70 text-base">{rec.teamB}</span>
        <span className="text-white/50 font-mono text-sm">{rec.teamBScore || "—"}</span>
      </div>
    </div>
    {rec.result && (
      <p className="text-xs text-emerald-400 font-medium mb-3">{rec.result}</p>
    )}
    <div className="flex items-center justify-between pt-3 border-t border-white/5">
      <span className="text-[10px] text-white/30">
        Added by {rec.createdBy?.name || "—"} · {rec.playing11?.length || 0} players
      </span>
      <div className="flex gap-2">
        <ActionBtn onClick={onExport} label="↓ Excel" color="green" />
        <ActionBtn onClick={onView} label="View" color="blue" />
        <ActionBtn onClick={onEdit} label="Edit" color="yellow" />
        <ActionBtn onClick={onDelete} label="Del" color="red" />
      </div>
    </div>
  </div>
);

/* ─── DETAIL MODAL ─────────────────────────────────────── */
const DetailModal = ({ rec, onClose, onExport }) => {
  const [tab, setTab] = useState("batting");
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#0d2410] border border-green-800/50 rounded-2xl w-full max-w-5xl shadow-2xl my-auto">
        <div className="flex justify-between items-start px-7 py-5 border-b border-green-800/40">
          <div>
            <h2 className="text-xl font-bold">{rec.matchTitle}</h2>
            <p className="text-sm text-white/50 mt-0.5">
              {rec.teamA} vs {rec.teamB} · {new Date(rec.matchDate).toLocaleDateString()}
              {rec.venue && ` · ${rec.venue}`}
            </p>
            {rec.result && <p className="text-emerald-400 text-sm mt-1 font-medium">{rec.result}</p>}
          </div>
          <div className="flex gap-3 items-center">
            <button onClick={onExport}
              className="text-xs bg-emerald-700 hover:bg-emerald-600 px-3 py-1.5 rounded-lg font-semibold transition">
              ↓ Excel
            </button>
            <button onClick={onClose} className="text-white/40 hover:text-white text-2xl">×</button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 px-7 py-4 border-b border-white/5">
          <div className="bg-white/5 rounded-xl p-4">
            <p className="text-xs text-white/40 mb-1">{rec.teamA}</p>
            <p className="text-2xl font-bold text-emerald-300">{rec.teamAScore || "—"}</p>
          </div>
          <div className="bg-white/5 rounded-xl p-4">
            <p className="text-xs text-white/40 mb-1">{rec.teamB}</p>
            <p className="text-2xl font-bold text-white/60">{rec.teamBScore || "—"}</p>
          </div>
        </div>
        <div className="flex px-7 border-b border-white/5">
          {["batting", "bowling", "fielding"].map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-5 py-3 text-sm font-semibold capitalize transition border-b-2 mr-1
                ${tab === t ? "border-emerald-400 text-emerald-400" : "border-transparent text-white/40 hover:text-white/60"}`}>
              {t}
            </button>
          ))}
        </div>
        <div className="p-7 overflow-x-auto">
          {rec.playing11.length === 0 ? (
            <p className="text-center text-white/30 py-10">No player data recorded</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-white/40 text-xs uppercase tracking-wider border-b border-white/10">
                  {tab === "batting" && (
                    <>
                      <th className="text-left py-2 pb-3">Player</th>
                      <th className="py-2">R</th><th className="py-2">B</th>
                      <th className="py-2">4s</th><th className="py-2">6s</th>
                      <th className="py-2">SR</th><th className="text-left py-2 pl-3">Dismissal</th>
                    </>
                  )}
                  {tab === "bowling" && (
                    <>
                      <th className="text-left py-2 pb-3">Player</th>
                      <th className="py-2">O</th><th className="py-2">M</th>
                      <th className="py-2">R</th><th className="py-2">W</th><th className="py-2">Eco</th>
                    </>
                  )}
                  {tab === "fielding" && (
                    <>
                      <th className="text-left py-2 pb-3">Player</th>
                      <th className="py-2">Catches</th><th className="py-2">Run Outs</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {rec.playing11.map((p, i) => (
                  <tr key={i} className="border-b border-white/5 hover:bg-white/3">
                    <td className="py-2.5 pr-4">
                      <span className="font-medium text-white">{p.playerName}</span>
                      <span className="text-white/30 text-xs ml-2">#{p.jerseyNumber}</span>
                    </td>
                    {tab === "batting" && (
                      <>
                        <td className="py-2.5 text-center font-bold text-emerald-300">{p.runs}</td>
                        <td className="py-2.5 text-center text-white/60">{p.balls}</td>
                        <td className="py-2.5 text-center text-white/60">{p.fours}</td>
                        <td className="py-2.5 text-center text-white/60">{p.sixes}</td>
                        <td className="py-2.5 text-center text-white/50">{SR(p.runs, p.balls)}</td>
                        <td className="py-2.5 pl-3 text-white/50 text-xs">{p.dismissal}</td>
                      </>
                    )}
                    {tab === "bowling" && (
                      <>
                        <td className="py-2.5 text-center text-white/60">{p.overs}</td>
                        <td className="py-2.5 text-center text-white/60">{p.maidens}</td>
                        <td className="py-2.5 text-center text-white/60">{p.runsConceded}</td>
                        <td className="py-2.5 text-center font-bold text-emerald-300">{p.wickets}</td>
                        <td className="py-2.5 text-center text-white/50">{ECO(p.runsConceded, p.overs)}</td>
                      </>
                    )}
                    {tab === "fielding" && (
                      <>
                        <td className="py-2.5 text-center text-white/60">{p.catches}</td>
                        <td className="py-2.5 text-center text-white/60">{p.runOuts}</td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

/* ─── tiny shared components ────────────────────────────── */
const Field = ({ label, name, value, onChange, type = "text", placeholder = "", className = "" }) => (
  <div className={className}>
    <label className="block text-xs text-white/50 mb-1.5 uppercase tracking-widest">{label}</label>
    <input type={type} name={name} value={value} onChange={onChange} placeholder={placeholder}
      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-emerald-500 transition" />
  </div>
);

const SelectField = ({ label, name, value, onChange, options }) => (
  <div>
    <label className="block text-xs text-white/50 mb-1.5 uppercase tracking-widest">{label}</label>
    <select name={name} value={value} onChange={onChange}
      style={{ backgroundColor: "#0d2410", color: "#ffffff" }}
      className="w-full border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 transition">
      {options.map((o) => (
        <option key={o} value={o} style={{ backgroundColor: "#0d2410", color: "#ffffff" }}>{o}</option>
      ))}
    </select>
  </div>
);

const NumInput = ({ val, onChange }) => (
  <input type="number" min="0" value={val}
    onChange={(e) => onChange(e.target.value)}
    className="w-16 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white text-center focus:outline-none focus:border-emerald-500 transition" />
);

const colors = {
  green: "bg-emerald-700/50 hover:bg-emerald-600/70 text-emerald-200",
  blue: "bg-blue-700/50 hover:bg-blue-600/70 text-blue-200",
  yellow: "bg-yellow-700/40 hover:bg-yellow-600/60 text-yellow-200",
  red: "bg-red-700/40 hover:bg-red-600/60 text-red-200",
};

const ActionBtn = ({ onClick, label, color }) => (
  <button onClick={onClick}
    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${colors[color]}`}>
    {label}
  </button>
);

export default CoachMatchRecords;