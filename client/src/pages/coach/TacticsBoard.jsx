import React, { useState, useEffect } from "react";
import API from "../../Services/api";

const TacticsBoard = () => {
  const [formation, setFormation] = useState("Attacking");
  const [notes, setNotes] = useState("");
  const [history, setHistory] = useState([]);
  const [editId, setEditId] = useState(null);

  const [positions, setPositions] = useState({
    Attacking: [
      { name: "Bowler", top: 75, left: 50 },
      { name: "Wicket Keeper", top: 85, left: 50 },
      { name: "Slip", top: 80, left: 40 },
      { name: "Gully", top: 70, left: 35 },
      { name: "Point", top: 60, left: 30 },
      { name: "Cover", top: 55, left: 50 },
      { name: "Mid Off", top: 65, left: 60 },
      { name: "Mid On", top: 65, left: 40 },
      { name: "Square Leg", top: 55, left: 70 },
      { name: "Fine Leg", top: 75, left: 75 },
    ],
    Defensive: [
      { name: "Bowler", top: 75, left: 50 },
      { name: "Wicket Keeper", top: 85, left: 50 },
      { name: "Deep Cover", top: 40, left: 60 },
      { name: "Long Off", top: 30, left: 50 },
      { name: "Long On", top: 30, left: 40 },
      { name: "Deep Mid Wicket", top: 50, left: 75 },
      { name: "Third Man", top: 60, left: 20 },
      { name: "Fine Leg", top: 75, left: 80 },
    ],
  });

  const [dragIndex, setDragIndex] = useState(null);

  // 🔥 LOAD HISTORY
  const fetchHistory = async () => {
    const res = await API.get("/tactics");
    setHistory(res.data);
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // 🔥 DRAG
  const handleMouseDown = (i) => setDragIndex(i);

  const handleMouseMove = (e) => {
    if (dragIndex === null) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const updated = [...positions[formation]];
    updated[dragIndex] = { ...updated[dragIndex], top: y, left: x };

    setPositions({ ...positions, [formation]: updated });
  };

  const handleMouseUp = () => setDragIndex(null);

  // 🔥 SAVE / UPDATE
  const handleSave = async () => {
    if (editId) {
      await API.put(`/tactics/${editId}`, {
        formation,
        positions,
        notes,
      });
      setEditId(null);
    } else {
      await API.post("/tactics", {
        formation,
        positions,
        notes,
      });
    }

    fetchHistory();
    alert("Saved!");
  };

  // 🔥 DELETE
  const handleDelete = async (id) => {
    await API.delete(`/tactics/${id}`);
    fetchHistory();
  };

  // 🔥 EDIT LOAD
  const handleEdit = (item) => {
    setFormation(item.formation);
    setPositions(item.positions);
    setNotes(item.notes);
    setEditId(item._id);
  };

  return (
    <div className="grid grid-cols-3 gap-4">

      {/* LEFT SIDE */}
      <div className="col-span-2 bg-white rounded-xl shadow p-4">

        {/* HEADER */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold">Field Setup Builder</h2>

          <button
            onClick={handleSave}
            className="bg-green-700 text-white px-3 py-1 rounded text-sm"
          >
            Save Strategy
          </button>
        </div>

        {/* FORMATION BUTTONS */}
        <div className="flex gap-2 mb-4">
          {["Attacking", "Defensive"].map((f) => (
            <button
              key={f}
              onClick={() => setFormation(f)}
              className={`px-3 py-1 rounded text-sm border ${
                formation === f
                  ? "bg-green-700 text-white"
                  : "hover:border-green-500"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* GROUND */}
        <div
          className="relative bg-green-800 rounded-xl h-[400px] flex items-center justify-center"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >

          {/* ✅ BOUNDARY */}
          <div className="absolute w-[90%] h-[90%] border-4 border-white rounded-full opacity-40"></div>

          {/* PITCH */}
          <div className="w-16 h-32 bg-yellow-200 rounded"></div>

          {/* PLAYERS */}
          {positions[formation].map((p, i) => (
            <div
              key={i}
              onMouseDown={() => handleMouseDown(i)}
              className="absolute text-xs text-white text-center cursor-pointer"
              style={{
                top: `${p.top}%`,
                left: `${p.left}%`,
                transform: "translate(-50%, -50%)",
              }}
            >
              <div className="bg-red-500 w-8 h-8 rounded-full flex items-center justify-center text-[10px]">
                🏏
              </div>
              <p className="mt-1">{p.name}</p>
            </div>
          ))}
        </div>

        {/* ✅ HISTORY (SAME STYLE SIMPLE BELOW) */}
        <div className="mt-4">
          <h3 className="font-semibold mb-2 text-sm">Strategy History</h3>

          {history.map((h) => (
            <div
              key={h._id}
              className="flex justify-between items-center border p-2 mb-2 rounded"
            >
              <div>
                <p className="text-sm font-medium">{h.formation}</p>
                <p className="text-xs text-gray-500">{h.notes}</p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(h)}
                  className="text-blue-600 text-sm"
                >
                  Edit
                </button>

                <button
                  onClick={() => handleDelete(h._id)}
                  className="text-red-600 text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* RIGHT SIDE (UNCHANGED) */}
      <div className="space-y-4">

        <div className="bg-white rounded-xl shadow p-4">
          <h3 className="font-semibold mb-2 text-sm">Strategy Notes</h3>

          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full border rounded p-2 text-sm"
            rows="5"
            placeholder="Write field strategy, bowling plan..."
          />

          <button
            onClick={handleSave}
            className="bg-green-700 text-white w-full mt-3 py-2 rounded text-sm"
          >
            Save Notes
          </button>
        </div>

        <div className="bg-white rounded-xl shadow p-4">
          <h3 className="font-semibold mb-2 text-sm">Key Tactical Points</h3>

          <ul className="text-sm space-y-2 text-gray-600">
            <li>🏏 Attack early with slip fielders</li>
            <li>⚡ Use aggressive field in powerplay</li>
            <li>🛡️ Spread field in death overs</li>
            <li>🎯 Focus on yorkers in final overs</li>
          </ul>
        </div>

      </div>
    </div>
  );
};

export default TacticsBoard;