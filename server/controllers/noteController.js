import Note from "../models/Note.js";

// ================= CREATE NOTE =================
export const createNote = async (req, res) => {
  try {
    const { content, tags } = req.body;

    const note = await Note.create({
      content,
      tags,
      createdBy: req.user.id // 🔥 IMPORTANT (no null)
    });

    res.status(201).json(note);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ================= GET NOTES (FIXED) =================
export const getNotes = async (req, res) => {
  try {
    const notes = await Note.find({
      createdBy: req.user.id // 🔥 MAIN FIX
    }).sort({ createdAt: -1 });

    res.json(notes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ================= UPDATE NOTE =================
export const updateNote = async (req, res) => {
  try {
    const note = await Note.findOneAndUpdate(
      {
        _id: req.params.id,
        createdBy: req.user.id // 🔥 SECURITY
      },
      { content: req.body.content },
      { new: true }
    );

    res.json(note);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ================= DELETE NOTE =================
export const deleteNote = async (req, res) => {
  try {
    await Note.findOneAndDelete({
      _id: req.params.id,
      createdBy: req.user.id // 🔥 FIX
    });

    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};