import React, { useState, useEffect } from "react";
import { getNotes, addNote, updateNote, deleteNote } from "../../Services/api";
import NoteFormatterAI from "../../components/AI/NoteFormatterAI";

const squadContext = {
  coachName: "Coach Rivera",
  clubName:  "Grassroot Club",
};

const CoachNotes = () => {
  const [note, setNote]         = useState("");
  const [notesList, setNotesList] = useState([]);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    const res = await getNotes();
    setNotesList(res.data);
  };

  const saveNote = async () => {
    if (note.trim() === "") return;
    if (editingId) {
      await updateNote(editingId, { content: note });
      setEditingId(null);
    } else {
      await addNote({ content: note, tags: [] });
    }
    setNote("");
    fetchNotes();
  };

  const handleDelete = async (id) => {
    await deleteNote(id);
    fetchNotes();
  };

  const handleEdit = (n) => {
    setNote(n.content);
    setEditingId(n._id);
  };

  return (
    <div className="grid grid-cols-3 gap-4">

      {/* LEFT SIDE */}
      <div className="col-span-2 bg-white rounded-xl shadow p-4">

        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold">Match & Training Notes</h3>
          <button
            onClick={saveNote}
            className="bg-green-700 text-white px-3 py-1 rounded text-sm"
          >
            {editingId ? "Update" : "Save"}
          </button>
        </div>

        <textarea
          className="w-full border rounded p-3 text-sm"
          rows="8"
          placeholder="Write your notes here..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />

        <div className="mt-3 flex gap-2 flex-wrap text-xs">
          <span className="bg-blue-100 text-blue-600 px-2 py-1 rounded">#Batting</span>
          <span className="bg-green-100 text-green-600 px-2 py-1 rounded">#Fitness</span>
          <span className="bg-red-100 text-red-600 px-2 py-1 rounded">#Injury</span>
          <span className="bg-yellow-100 text-yellow-600 px-2 py-1 rounded">#MatchPrep</span>
        </div>

        {/* ✅ AI Note Formatter ADDED below tags */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-xs font-medium text-gray-500 mb-2">AI Note Formatter</p>
          <NoteFormatterAI rawNote={note} squadContext={squadContext} />
        </div>

      </div>

      {/* RIGHT SIDE — unchanged */}
      <div className="space-y-4">

        <div className="bg-white rounded-xl shadow p-4">
          <h3 className="font-semibold mb-2 text-sm">Recent Notes</h3>
          <div className="text-sm space-y-2 text-gray-600">
            {notesList.map((n) => (
              <div key={n._id} className="flex justify-between items-center">
                <p>• {n.content}</p>
                <div className="flex gap-2 text-xs">
                  <button onClick={() => handleEdit(n)} className="text-blue-500">Edit</button>
                  <button onClick={() => handleDelete(n._id)} className="text-red-500">Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-4">
          <h3 className="font-semibold mb-2 text-sm">Pre-Match Checklist</h3>
          <div className="space-y-2 text-sm">
            <label className="flex items-center gap-2"><input type="checkbox" /> Team selection finalized</label>
            <label className="flex items-center gap-2"><input type="checkbox" /> Pitch analysis done</label>
            <label className="flex items-center gap-2"><input type="checkbox" /> Equipment ready</label>
            <label className="flex items-center gap-2"><input type="checkbox" /> Player fitness checked</label>
            <label className="flex items-center gap-2"><input type="checkbox" /> Strategy briefing done</label>
          </div>
        </div>

      </div>
    </div>
  );
};

export default CoachNotes;