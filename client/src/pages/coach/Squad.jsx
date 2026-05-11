import React, { useEffect, useState } from "react";
import API from "../../Services/api";
import TeamSelectionAI from "../../components/AI/TeamSelectionAI";

const Squad = () => {
  const [squadPlayers, setSquadPlayers]           = useState([]);
  const [registeredPlayers, setRegisteredPlayers] = useState([]);
  const [search, setSearch]     = useState("");
  const [filter, setFilter]     = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [toast, setToast]       = useState("");

  const [form, setForm] = useState({
    playerId: "",
    position: "Batsman",
    age:      "",
    fitness:  "",
    jersey:   "",
  });

  useEffect(() => {
    fetchSquad();
    fetchRegisteredPlayers();
  }, []);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(""), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const fetchSquad = async () => {
    try {
      const res = await API.get("/players");
      setSquadPlayers(res.data);
    } catch (err) {
      console.error("Fetch squad error:", err);
    }
  };

  const fetchRegisteredPlayers = async () => {
    try {
      const res = await API.get("/players/registered");
      setRegisteredPlayers(res.data);
    } catch (err) {
      console.error("Fetch registered players error:", err);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const validate = () => {
    if (!editingPlayer && !form.playerId) return "Please select a player";
    return null;
  };

  const savePlayer = async () => {
    const error = validate();
    if (error) return setToast(error);

    try {
      if (editingPlayer) {
        await API.put(`/players/${editingPlayer._id}`, {
          position: form.position,
          age:      Number(form.age),
          fitness:  Number(form.fitness),
          jersey:   Number(form.jersey),
        });
        setToast("Player Updated ✅");
      } else {
        await API.post("/players", {
          playerId: form.playerId,
          position: form.position,
          age:      Number(form.age),
          fitness:  Number(form.fitness),
          jersey:   Number(form.jersey),
        });
        setToast("Player Added to Squad ✅");
      }
      fetchSquad();
      fetchRegisteredPlayers();
      closeModal();
    } catch (err) {
      console.error(err);
      setToast(err.response?.data?.message || "Error ❌");
    }
  };

  const removePlayer = async (id) => {
    if (!window.confirm("Remove this player from your squad?")) return;
    try {
      await API.delete(`/players/${id}`);
      fetchSquad();
      fetchRegisteredPlayers();
      setToast("Player Removed 🗑️");
    } catch (err) {
      setToast("Error removing player ❌");
    }
  };

  const openEdit = (player) => {
    setEditingPlayer(player);
    setForm({
      playerId: player._id,
      position: player.position || "Batsman",
      age:      player.age      || "",
      fitness:  player.fitness  || "",
      jersey:   player.jerseyNumber || "",
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingPlayer(null);
    setForm({ playerId: "", position: "Batsman", age: "", fitness: "", jersey: "" });
  };

  const filteredPlayers = squadPlayers.filter((p) =>
    p.name?.toLowerCase().includes(search.toLowerCase()) &&
    (filter === "All" || p.position === filter)
  );

  const availableToAdd = registeredPlayers.filter(
    (rp) => !squadPlayers.some((sp) => sp._id === rp._id)
  );

  // ── Build squadContext for TeamSelectionAI ────────────────────
  const squadContext = {
    nextMatch: "vs City Club",
    players: squadPlayers.map((p) => ({
      name:     p.name     || "Player",
      position: p.position || "Unknown",
      fitness:  p.fitness  || 80,
      age:      p.age      || 0,
    })),
  };

  return (
    <div className="space-y-5">

      {/* TOAST */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 bg-black text-white px-4 py-2 rounded shadow">
          {toast}
        </div>
      )}

      {/* HEADER — unchanged */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Squad Management</h2>
        <button
          onClick={() => setShowModal(true)}
          className="bg-green-700 text-white px-4 py-2 rounded"
        >
          + Add Player
        </button>
      </div>

      {/* SEARCH — unchanged */}
      <input
        placeholder="Search..."
        className="border p-2 rounded w-64"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* FILTER — unchanged */}
      <div className="flex gap-2">
        {["All", "Batsman", "Bowler", "All-Rounder"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded border text-sm ${
              filter === f ? "bg-green-100 text-green-700 border-green-500" : ""
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* TABLE — unchanged */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="grid grid-cols-7 px-4 py-3 bg-gray-50 border-b text-sm font-semibold text-gray-500">
          <span className="col-span-2">Name</span>
          <span>Position</span>
          <span>Age</span>
          <span>Fitness</span>
          <span>Jersey</span>
          <span>Actions</span>
        </div>

        {filteredPlayers.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <p className="text-3xl mb-2">🏏</p>
            <p>No players in squad yet.</p>
            <p className="text-sm">Click "+ Add Player" to add registered players.</p>
          </div>
        )}

        {filteredPlayers.map((p) => (
          <div
            key={p._id}
            className="grid grid-cols-7 items-center px-4 py-3 border-b hover:bg-gray-50"
          >
            <div className="col-span-2">
              <p className="font-medium">{p.name}</p>
              <p className="text-xs text-gray-400">{p.email}</p>
            </div>
            <span className="text-sm text-gray-600">{p.position}</span>
            <span className="text-sm text-gray-600">{p.age || "—"}</span>
            <span className="text-sm text-gray-600">{p.fitness ? `${p.fitness}%` : "—"}</span>
            <span className="text-sm text-gray-600">{p.jerseyNumber ? `#${p.jerseyNumber}` : "—"}</span>
            <div className="flex gap-2">
              <button onClick={() => openEdit(p)} className="bg-blue-500 text-white px-2 py-1 rounded text-xs">Edit</button>
              <button onClick={() => removePlayer(p._id)} className="bg-red-500 text-white px-2 py-1 rounded text-xs">Remove</button>
            </div>
          </div>
        ))}
      </div>

      {/* ✅ AI TEAM SELECTION — ADDED below table */}
      <TeamSelectionAI squadContext={squadContext} />

      {/* MODAL — unchanged */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-40">
          <div className="bg-white p-6 rounded-xl w-[420px] space-y-4 shadow-xl">
            <h2 className="font-bold text-lg">
              {editingPlayer ? "Edit Player Details" : "Add Player to Squad"}
            </h2>

            {!editingPlayer ? (
              <div>
                <label className="text-sm text-gray-500 mb-1 block">Select Registered Player</label>
                <select
                  name="playerId"
                  value={form.playerId}
                  onChange={handleChange}
                  className="w-full border p-2 rounded"
                >
                  <option value="">— Choose a player —</option>
                  {availableToAdd.map((p) => (
                    <option key={p._id} value={p._id}>{p.name} ({p.email})</option>
                  ))}
                </select>
                {availableToAdd.length === 0 && (
                  <p className="text-xs text-gray-400 mt-1">No unassigned registered players found.</p>
                )}
                <p className="text-xs text-blue-500 mt-2">
                  💡 Only players who have registered in the app appear here.
                </p>
              </div>
            ) : (
              <div className="bg-gray-50 p-3 rounded">
                <p className="font-medium">{editingPlayer.name}</p>
                <p className="text-xs text-gray-400">{editingPlayer.email}</p>
              </div>
            )}

            <select name="position" value={form.position} onChange={handleChange} className="w-full border p-2 rounded">
              <option>Batsman</option>
              <option>Bowler</option>
              <option>All-Rounder</option>
            </select>

            <div className="grid grid-cols-3 gap-2">
              <input name="age"     value={form.age}     onChange={handleChange} placeholder="Age"      className="border p-2 rounded" />
              <input name="fitness" value={form.fitness} onChange={handleChange} placeholder="Fitness %" className="border p-2 rounded" />
              <input name="jersey"  value={form.jersey}  onChange={handleChange} placeholder="Jersey #"  className="border p-2 rounded" />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={closeModal} className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={savePlayer} className="bg-green-700 text-white px-4 py-2 rounded">
                {editingPlayer ? "Update" : "Add to Squad"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Squad;