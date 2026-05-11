import Tactics from "../models/Tactics.js";

// SAVE
export const saveTactics = async (req, res) => {
  try {
    const tactics = await Tactics.create({
      ...req.body,
      coach: req.user.id,
    });
    res.json(tactics);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET ALL
export const getTactics = async (req, res) => {
  try {
    const data = await Tactics.find({ coach: req.user.id }).sort({ createdAt: -1 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE
export const deleteTactics = async (req, res) => {
  try {
    await Tactics.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// UPDATE
export const updateTactics = async (req, res) => {
  try {
    const updated = await Tactics.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};