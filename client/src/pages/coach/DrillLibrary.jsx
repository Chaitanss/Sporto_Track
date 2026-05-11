import React, { useState, useEffect } from "react";
import { addDrill, shareDrill, deleteDrill, updateDrill, getAllPlayers } from "../../Services/api";

const DrillLibrary = () => {
  const [drills, setDrills] = useState([
    { id: 1, name: "Batting Nets Practice", type: "Technical", duration: 30, done: false },
    { id: 2, name: "Bowling Line & Length", type: "Technical", duration: 20, done: false },
    { id: 3, name: "Fielding Drills", type: "Fitness", duration: 15, done: false },
    { id: 4, name: "Match Simulation", type: "Tactical", duration: 20, done: false },
    { id: 5, name: "Warm-up & Stretch", type: "Fitness", duration: 10, done: false },
  ]);

  // 🔥 HISTORY STATE
  const [history, setHistory] = useState([]);

  // 🔥 PLAYERS STATE
  const [players, setPlayers] = useState([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState("all");
  const [sendingDrillId, setSendingDrillId] = useState(null);
  const [sendSuccess, setSendSuccess] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [editIndex, setEditIndex] = useState(null);

  const [form, setForm] = useState({
    name: "",
    type: "",
    duration: "",
  });

  // 🔥 Load all registered players on mount using API instance (has token interceptor)
  useEffect(() => {
    const fetchPlayers = async () => {
      const data = await getAllPlayers();
      setPlayers(data);
    };
    fetchPlayers();
  }, []);

  const toggleDone = (id) => {
    setDrills(drills.map((d) => d.id === id ? { ...d, done: !d.done } : d));
  };

  // 🔥 SEND DRILL TO SELECTED PLAYER(S)
  const handleSendDrill = async (drill) => {
    try {
      setSendingDrillId(drill._id || drill.id);

      if (!drill._id) {
        setSendSuccess("⚠️ Add this drill first before sending.");
        setTimeout(() => setSendSuccess(null), 3000);
        setSendingDrillId(null);
        return;
      }

      let userIds = [];
      if (selectedPlayerId === "all") {
        userIds = players.map((p) => p._id);
      } else {
        userIds = [selectedPlayerId];
      }

      await shareDrill(drill._id, userIds);

      const playerName =
        selectedPlayerId === "all"
          ? "All Players"
          : players.find((p) => p._id === selectedPlayerId)?.name || "Player";

      setSendSuccess(`✅ "${drill.name}" sent to ${playerName}!`);
      setTimeout(() => setSendSuccess(null), 3000);
    } catch (err) {
      console.log("❌ SEND ERROR:", err);
      setSendSuccess("❌ Failed to send drill.");
      setTimeout(() => setSendSuccess(null), 3000);
    } finally {
      setSendingDrillId(null);
    }
  };

  const handleSave = async () => {
    if (!form.name || !form.type || !form.duration) return;

    if (editIndex !== null) {
      const updated = [...drills];
      try {
        if (updated[editIndex]._id) {
          await updateDrill(updated[editIndex]._id, form);
        }
      } catch (err) {}

      updated[editIndex] = {
        ...updated[editIndex],
        ...form,
        duration: Number(form.duration),
      };
      setDrills(updated);
      setEditIndex(null);
    } else {
      try {
        const res = await addDrill({
          name: form.name,
          type: form.type,
          duration: Number(form.duration),
        });

        // 🔥 SAVE TO HISTORY
        setHistory((prev) => [...prev, { ...res.data }]);

        setDrills([
          ...drills,
          {
            id: Date.now(),
            _id: res.data._id,
            ...form,
            duration: Number(form.duration),
            done: false,
          },
        ]);
      } catch (err) {
        console.log(err);
        setDrills([
          ...drills,
          {
            id: Date.now(),
            ...form,
            duration: Number(form.duration),
            done: false,
          },
        ]);
      }
    }

    setForm({ name: "", type: "", duration: "" });
    setShowModal(false);
  };

  const handleDelete = async (id) => {
    try {
      await deleteDrill(id);
    } catch (err) {}
    setDrills(drills.filter((d) => d.id !== id));
    setHistory(history.filter((h) => h._id !== id));
  };

  const handleEdit = (index) => {
    const d = drills[index];
    setForm({ name: d.name, type: d.type, duration: d.duration });
    setEditIndex(index);
    setShowModal(true);
  };

  const totalDuration = drills.reduce((sum, d) => sum + d.duration, 0);
  const countType = (type) => drills.filter((d) => d.type === type).length;

  return (
    <div className="grid grid-cols-3 gap-4">

      {/* LEFT SIDE */}
      <div className="col-span-2 bg-white rounded-xl shadow">

        <div className="flex justify-between items-center p-4 border-b">
          <div>
            <h2 className="font-semibold text-slate-800">Today's Session Plan</h2>
            <p className="text-xs text-gray-400">
              Grassroot Cricket Training · {totalDuration} min
            </p>
          </div>
        </div>

        {/* 🔥 PLAYER DROPDOWN + ADD BUTTON ROW */}
        <div className="flex gap-3 p-4 border-b items-end flex-wrap">
          <div className="flex flex-col gap-1 flex-1 min-w-[220px]">
            <label className="text-xs text-gray-500 font-medium">Send Drills To:</label>
            <select
              value={selectedPlayerId}
              onChange={(e) => setSelectedPlayerId(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="all">👥 All Players</option>
              {players.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name} ({p.email})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => { setShowModal(true); setEditIndex(null); }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
          >
            + Add Drill
          </button>
        </div>

        {/* 🔥 SUCCESS TOAST */}
        {sendSuccess && (
          <div className="mx-4 mt-2 bg-blue-50 border border-blue-200 text-blue-700 text-sm px-4 py-2 rounded-lg">
            {sendSuccess}
          </div>
        )}

        {/* DRILL LIST */}
        <div>
          {drills.map((d, index) => (
            <div
              key={d.id}
              className="flex items-center justify-between p-4 border-b hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 text-blue-700 w-7 h-7 flex items-center justify-center rounded text-sm font-bold">
                  {index + 1}
                </div>
                <div>
                  <p className={`font-medium ${d.done ? "line-through text-gray-400" : "text-slate-700"}`}>
                    {d.name}
                  </p>
                  <p className="text-xs text-gray-400">{d.type}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500">{d.duration} min</span>

                <input
                  type="checkbox"
                  className="accent-blue-600"
                  checked={d.done}
                  onChange={() => toggleDone(d.id)}
                />

                {/* 🔥 SEND BUTTON */}
                <button
                  onClick={() => handleSendDrill(d)}
                  disabled={sendingDrillId === (d._id || d.id)}
                  className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {sendingDrillId === (d._id || d.id) ? "Sending..." : "Send"}
                </button>

                <button
                  onClick={() => handleEdit(index)}
                  className="text-slate-600 hover:text-slate-800 text-sm transition-colors"
                >
                  Edit
                </button>

                <button
                  onClick={() => handleDelete(d._id || d.id)}
                  className="text-red-600 hover:text-red-700 text-sm transition-colors"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 text-sm text-gray-500">
          ✅ {drills.filter((d) => d.done).length} of {drills.length} drills completed
        </div>

        {/* 🔥 HISTORY */}
        <div className="p-4 border-t">
          <h3 className="font-semibold mb-2 text-slate-800">History</h3>
          {history.length === 0 ? (
            <p className="text-xs text-gray-400">No drills added yet.</p>
          ) : (
            history.map((h) => (
              <div key={h._id} className="flex justify-between text-sm py-1">
                <span className="text-slate-700">{h.name}</span>
                <span className="text-slate-500">{h.duration} min</span>
              </div>
            ))
          )}
        </div>

      </div>

      {/* RIGHT SIDE */}
      <div className="space-y-4">

        <div className="bg-white rounded-xl shadow p-4">
          <h3 className="font-semibold mb-3 text-sm text-slate-800">Session Stats</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-600">Total Duration</span>
              <span className="font-semibold text-blue-700">{totalDuration} min</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Tactical</span>
              <span className="text-slate-800 font-medium">{countType("Tactical")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Technical</span>
              <span className="text-slate-800 font-medium">{countType("Technical")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Fitness</span>
              <span className="text-slate-800 font-medium">{countType("Fitness")}</span>
            </div>
          </div>
        </div>

        {/* 🔥 REGISTERED PLAYERS LIST */}
        <div className="bg-white rounded-xl shadow p-4">
          <h3 className="font-semibold mb-3 text-sm text-slate-800">Registered Players</h3>
          {players.length === 0 ? (
            <p className="text-xs text-gray-400">No players registered yet.</p>
          ) : (
            <div className="space-y-2">
              {players.map((p) => (
                <div key={p._id} className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                    {p.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">{p.name}</p>
                    <p className="text-xs text-gray-400">{p.email}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* POPUP */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-xl w-80 shadow-xl">
            <h2 className="font-semibold mb-3 text-slate-800">
              {editIndex !== null ? "Edit Drill" : "Add Drill"}
            </h2>

            <input
              placeholder="Name"
              className="border w-full mb-2 p-2 rounded focus:outline-none focus:border-blue-500"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />

            <select
              className="border w-full mb-2 p-2 rounded focus:outline-none focus:border-blue-500"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              <option value="">Select Type</option>
              <option value="Technical">Technical</option>
              <option value="Tactical">Tactical</option>
              <option value="Fitness">Fitness</option>
            </select>

            <input
              type="number"
              placeholder="Duration (min)"
              className="border w-full mb-4 p-2 rounded focus:outline-none focus:border-blue-500"
              value={form.duration}
              onChange={(e) => setForm({ ...form, duration: e.target.value })}
            />

            <div className="flex justify-end gap-2">
              <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-slate-700 px-3 py-1 transition-colors">
                Cancel
              </button>
              <button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded transition-colors">
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DrillLibrary;