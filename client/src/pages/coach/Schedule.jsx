import React, { useEffect, useState } from "react";
import {
  getEvents,
  addEvent,
  updateEvent,
  deleteEvent,
} from "../../Services/api";

const Schedule = () => {
  const [events, setEvents] = useState([]);
  const [startDate, setStartDate] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);

  const [form, setForm] = useState({
    title: "",
    details: "",
    type: "MATCH",
    date: "",
  });

  // 🔥 7 DAYS
  const getDays = () => {
    const arr = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      arr.push({
        day: d.toLocaleDateString("en-US", { weekday: "short" }),
        date: d.getDate(),
        full: d.toISOString().split("T")[0],
      });
    }
    return arr;
  };

  const days = getDays();

  const getMonthYear = () => {
    return startDate.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  };

  const fetchEvents = async () => {
    try {
      const res = await getEvents();
      setEvents(res.data);
    } catch (err) {
      console.log("FETCH ERROR:", err);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleSave = async () => {
    try {
      if (!form.title || !form.date) {
        alert("Fill required fields ❌");
        return;
      }

      const formattedDate = new Date(form.date).toISOString();

      if (editId) {
        await updateEvent(editId, { ...form, date: formattedDate });
        setEditId(null);
      } else {
        await addEvent({ ...form, date: formattedDate });
      }

      setShowModal(false);
      setForm({ title: "", details: "", type: "MATCH", date: "" });
      fetchEvents();
    } catch (err) {
      console.log("SAVE ERROR:", err.response?.data || err.message);
      alert("Save failed ❌");
    }
  };

  const handleDelete = async (id) => {
    await deleteEvent(id);
    fetchEvents();
  };

  const handleEdit = (e) => {
    setForm({
      title: e.title,
      details: e.details,
      type: e.type,
      date: e.date.slice(0, 10),
    });
    setEditId(e._id);
    setShowModal(true);
  };

  const handleDateClick = (date) => {
    setForm({ ...form, date });
    setShowModal(true);
  };

  const nextWeek = () => {
    const next = new Date(startDate);
    next.setDate(startDate.getDate() + 7);
    setStartDate(next);
  };

  const prevWeek = () => {
    const prev = new Date(startDate);
    prev.setDate(startDate.getDate() - 7);
    setStartDate(prev);
  };

  // 🔥 type badge color
  const getTypeBadge = (type) => {
    if (type === "MATCH") return "bg-blue-100 text-blue-700";
    if (type === "TRAINING") return "bg-green-100 text-green-700";
    if (type === "TOURNAMENT") return "bg-purple-100 text-purple-700";
    return "bg-gray-100 text-gray-700";
  };

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Schedule · {getMonthYear()}</h2>
        <button
          onClick={() => { setShowModal(true); setEditId(null); setForm({ title: "", details: "", type: "MATCH", date: "" }); }}
          className="bg-green-700 text-white px-4 py-2 rounded"
        >
          + Add Event
        </button>
      </div>

      {/* CALENDAR */}
      <div className="flex items-center gap-2">
        <button onClick={prevWeek} className="px-3 py-1 border rounded">←</button>

        <div className="grid grid-cols-7 gap-3 flex-1">
          {days.map((d, i) => {
            const event = events.find((e) => e.date?.slice(0, 10) === d.full);
            return (
              <div
                key={i}
                onClick={() => handleDateClick(d.full)}
                className={`bg-white rounded-xl p-4 shadow text-center cursor-pointer hover:border-green-400 border-2 transition-all ${
                  event ? "border-green-500" : "border-transparent"
                }`}
              >
                <p className="text-xs text-gray-400">{d.day}</p>
                <p className="text-lg font-bold">{d.date}</p>
                {event && (
                  <p className="text-xs text-green-600 mt-1">{event.type}</p>
                )}
              </div>
            );
          })}
        </div>

        <button onClick={nextWeek} className="px-3 py-1 border rounded">→</button>
      </div>

      {/* EVENTS LIST */}
      <div className="bg-white rounded-xl shadow">
        <div className="p-4 border-b">
          <h3 className="font-semibold">All Upcoming Matches</h3>
        </div>

        <div className="divide-y">
          {events.length === 0 ? (
            <div className="p-6 text-center text-gray-400 text-sm">
              No events added yet. Click + Add Event to create one.
            </div>
          ) : (
            events.map((m) => (
              <div key={m._id} className="flex justify-between items-center p-4 text-sm">
                <div className="flex items-center gap-4">
                  <div className="bg-gray-100 px-3 py-2 rounded text-center min-w-[50px]">
                    <p className="font-bold text-sm">
                      {new Date(m.date).toLocaleDateString("en-US", { day: "numeric", month: "short" }).split(" ")[0]}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(m.date).toLocaleDateString("en-US", { month: "short" })}
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold">{m.title}</p>
                    <p className="text-gray-400 text-xs">{m.details}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded ${getTypeBadge(m.type)}`}>
                    {m.type}
                  </span>
                  <button onClick={() => handleEdit(m)} className="text-blue-600 text-xs">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(m._id)} className="text-red-600 text-xs">
                    Remove
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-xl w-80 shadow-xl">
            <h2 className="mb-3 font-semibold">
              {editId ? "Edit Event" : "Add Event"}
            </h2>

            <input
              placeholder="Title"
              className="border w-full mb-2 p-2 rounded"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />

            <input
              placeholder="Details (e.g. vs City Club · Home)"
              className="border w-full mb-2 p-2 rounded"
              value={form.details}
              onChange={(e) => setForm({ ...form, details: e.target.value })}
            />

            <input
              type="date"
              className="border w-full mb-2 p-2 rounded"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />

            <select
              className="border w-full mb-4 p-2 rounded"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              <option value="MATCH">Match</option>
              <option value="TRAINING">Training</option>
              <option value="TOURNAMENT">Tournament</option>
            </select>

            <div className="flex justify-end gap-2">
              <button onClick={() => setShowModal(false)} className="text-gray-500 px-3 py-1">
                Cancel
              </button>
              <button onClick={handleSave} className="bg-green-700 text-white px-3 py-1 rounded">
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Schedule;