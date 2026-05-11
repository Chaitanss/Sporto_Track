import React, { useEffect, useState } from "react";
import {
  getSeasonStats,
  addSeasonStats,
  getSeasonSummary,
  deleteSeasonStats,
  updateSeasonStats,
} from "../../Services/api";
import API from "../../Services/api";
import InjuryRiskAI from "../../components/AI/InjuryRiskAI";

const PlayerStats = () => {
  const [players, setPlayers]       = useState([]);
  const [allPlayers, setAllPlayers] = useState([]);
  const [summary, setSummary]       = useState({});
  const [selected, setSelected]     = useState([]);
  const [deleteMode, setDeleteMode] = useState(false);

  const [formData, setFormData] = useState({
    playerId: "",
    matches:  "",
    runs:     "",
    wickets:  "",
    impactRate: "",
    rating:   "",
  });

  const fetchPlayers = async () => {
    try {
      const res = await API.get("/players");
      setAllPlayers(res.data);
    } catch {
      try {
        const res = await API.get("/player");
        setAllPlayers(res.data);
      } catch (err) {
        console.error("Could not fetch players", err);
      }
    }
  };

  const fetchStats = async () => {
    try {
      const res = await getSeasonStats();
      setPlayers(res.data);
    } catch (err) {
      console.error("Could not fetch stats", err);
    }
  };

  const fetchSummary = async () => {
    try {
      const res = await getSeasonSummary();
      setSummary(res.data);
    } catch (err) {
      console.error("Could not fetch summary", err);
    }
  };

  useEffect(() => {
    fetchPlayers();
    fetchStats();
    fetchSummary();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData, impactRate: formData.impactRate || "Medium" };
      const existing = players.find((p) => p.player?._id === formData.playerId);

      if (existing) {
        await updateSeasonStats(existing._id, payload);
      } else {
        await addSeasonStats(payload);
      }

      setFormData({ playerId: "", matches: "", runs: "", wickets: "", impactRate: "", rating: "" });
      fetchStats();
      fetchSummary();
    } catch (err) {
      alert(err.response?.data?.message || "Error");
    }
  };

  const handleDelete = async () => {
    await Promise.all([...new Set(selected)].map((id) => deleteSeasonStats(id)));
    setSelected([]);
    setDeleteMode(false);
    fetchStats();
  };

  // ── Build players array for InjuryRiskAI ─────────────────────
  const playersForRisk = players.map((p) => ({
    name:     p.player?.name || "Unknown",
    position: p.player?.position || "Unknown",
    fitness:  p.player?.fitness  || 80,
    matches:  p.matches  || 0,
    rating:   p.rating   || 0,
  }));

  return (
    <div className="space-y-6">

      {/* FORM — unchanged */}
      <div className="bg-white p-6 rounded-2xl shadow-lg border">
        <h3 className="font-semibold text-lg mb-4">Season Performance</h3>

        <form onSubmit={handleSubmit} className="grid grid-cols-6 gap-4">
          <select
            name="playerId"
            value={formData.playerId}
            onChange={handleChange}
            className="border p-3 rounded-lg"
          >
            <option value="">Select Player</option>
            {allPlayers.map((p) => (
              <option key={p._id} value={p._id}>{p.name}</option>
            ))}
          </select>

          <input name="matches"  placeholder="Matches" value={formData.matches}  onChange={handleChange} className="border p-3 rounded-lg" />
          <input name="runs"     placeholder="Runs"    value={formData.runs}     onChange={handleChange} className="border p-3 rounded-lg" />
          <input name="wickets"  placeholder="Wickets" value={formData.wickets}  onChange={handleChange} className="border p-3 rounded-lg" />

          <select
            name="impactRate"
            value={formData.impactRate}
            onChange={handleChange}
            className="border p-3 rounded-lg"
          >
            <option value="">Impact Rate</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>

          <input name="rating" placeholder="Rating" value={formData.rating} onChange={handleChange} className="border p-3 rounded-lg" />

          <div className="col-span-6 flex gap-3 mt-2">
            <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded-lg">
              Add Stats
            </button>
            <button type="button" onClick={() => setDeleteMode(!deleteMode)} className="bg-red-500 text-white px-6 py-2 rounded-lg">
              Delete
            </button>
            {deleteMode && selected.length > 0 && (
              <button type="button" onClick={handleDelete} className="bg-red-700 text-white px-6 py-2 rounded-lg">
                Confirm
              </button>
            )}
          </div>
        </form>
      </div>

      {/* TABLE — unchanged */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="p-4 border-b font-semibold text-lg">Season Performance</div>

        <table className="w-full text-base table-fixed">
          <thead className="bg-gray-100 text-gray-600 text-sm">
            <tr>
              {deleteMode && <th className="w-12"></th>}
              <th className="w-48 text-left px-4 py-4">Player</th>
              <th className="w-24 py-4">Matches</th>
              <th className="w-24 py-4">Runs</th>
              <th className="w-24 py-4">Wickets</th>
              <th className="w-28 py-4">Impact</th>
              <th className="w-24 py-4">Rating</th>
              <th className="w-28 py-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {players.length === 0 && (
              <tr>
                <td colSpan="8" className="text-center py-10 text-gray-400">
                  No stats added yet.
                </td>
              </tr>
            )}
            {players.map((p) => (
              <tr key={p._id} className="border-t hover:bg-gray-50">
                {deleteMode && (
                  <td className="text-center py-4">
                    <input
                      type="checkbox"
                      onChange={() =>
                        setSelected((prev) =>
                          prev.includes(p._id)
                            ? prev.filter((id) => id !== p._id)
                            : [...prev, p._id]
                        )
                      }
                    />
                  </td>
                )}
                <td className="px-4 py-4 font-semibold">{p.player?.name}</td>
                <td className="text-center py-4">{p.matches}</td>
                <td className="text-green-600 text-center py-4">{p.runs}</td>
                <td className="text-blue-600 text-center py-4">{p.wickets}</td>
                <td className="text-center py-4">{p.impactRate}</td>
                <td className="text-center py-4">{p.rating}</td>
                <td className="text-center py-4">
                  {p.userId ? (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">✓ Synced</span>
                  ) : (
                    <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">Not registered</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ✅ AI INJURY RISK PREDICTOR — ADDED below table */}
      <InjuryRiskAI players={playersForRisk} />

    </div>
  );
};

export default PlayerStats;