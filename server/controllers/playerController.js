import Player from "../models/Player.js";
import User from "../models/User.js";

// ================= GET COACH'S SQUAD =================
// Returns only players assigned to this coach
export const getPlayers = async (req, res) => {
  try {
    const players = await Player.find({ coachId: req.user.id });
    res.json(players);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ================= GET SQUAD FOR ANALYST =================
// 🔥 Analyst uses this — returns ALL players assigned to ANY coach
export const getSquadForAnalyst = async (req, res) => {
  try {
    const players = await Player.find({ coachId: { $ne: null } }).select(
      "_id name email position age fitness jerseyNumber userId coachId"
    );
    res.json(players);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ================= GET ALL REGISTERED PLAYERS =================
// 🔥 Coach uses this in Squad to see who they can add
export const getRegisteredPlayers = async (req, res) => {
  try {
    const players = await Player.find({
      $or: [{ coachId: null }, { coachId: req.user.id }],
    }).select(
      "_id name email position age fitness jerseyNumber userId coachId"
    );
    res.json(players);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ================= ADD PLAYER TO SQUAD =================
// 🔥 Coach picks a registered player — just sets coachId on existing Player record
export const addPlayerToSquad = async (req, res) => {
  try {
    const { playerId, position, age, fitness, jersey } = req.body;

    if (!playerId) {
      return res.status(400).json({ message: "Player ID required" });
    }

    const player = await Player.findById(playerId);
    if (!player) {
      return res.status(404).json({ message: "Player not found" });
    }

    const updated = await Player.findByIdAndUpdate(
      playerId,
      {
        coachId: req.user.id,
        ...(position && { position }),
        ...(age && { age: Number(age) }),
        ...(fitness && { fitness: Number(fitness) }),
        ...(jersey && { jerseyNumber: Number(jersey) }),
      },
      { new: true }
    );

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ================= UPDATE PLAYER IN SQUAD =================
export const updatePlayer = async (req, res) => {
  try {
    const { position, age, fitness, jersey } = req.body;

    const updated = await Player.findOneAndUpdate(
      { _id: req.params.id, coachId: req.user.id },
      {
        ...(position && { position }),
        ...(age !== undefined && { age: Number(age) }),
        ...(fitness !== undefined && { fitness: Number(fitness) }),
        ...(jersey !== undefined && { jerseyNumber: Number(jersey) }),
      },
      { new: true }
    );

    if (!updated) {
      return res
        .status(404)
        .json({ message: "Player not found in your squad" });
    }

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ================= REMOVE FROM SQUAD =================
// 🔥 Does NOT delete the player — just removes them from this coach's squad
export const removePlayerFromSquad = async (req, res) => {
  try {
    const updated = await Player.findOneAndUpdate(
      { _id: req.params.id, coachId: req.user.id },
      { coachId: null },
      { new: true }
    );

    if (!updated) {
      return res
        .status(404)
        .json({ message: "Player not found in your squad" });
    }

    res.json({ message: "Player removed from squad ✅" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ================= GET ALL PLAYERS (for drills/stats dropdowns) =================
export const getAllPlayers = async (req, res) => {
  try {
    const players = await Player.find({ coachId: req.user.id }).select(
      "_id name position userId"
    );
    res.json(players);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};