import SeasonPerformance from "../models/SeasonPerformance.js";
import Player from "../models/Player.js";
import User from "../models/User.js";

// ================= ADD (Coach adds stats) =================
export const addSeasonPerformance = async (req, res) => {
  try {
    const { playerId, matches, runs, wickets, impactRate, rating } = req.body;

    const player = await Player.findById(playerId);
    if (!player) {
      return res.status(404).json({ message: "Player not found" });
    }

    const existing = await SeasonPerformance.findOne({
      player: playerId,
      createdBy: req.user.id,
    });

    if (existing) {
      return res.status(400).json({ message: "Stats already exist. Use update." });
    }

    const newStats = new SeasonPerformance({
      player: playerId,
      userId: player.userId,
      matches,
      runs,
      wickets,
      impactRate: impactRate || "Medium",
      rating,
      createdBy: req.user.id,
    });

    await newStats.save();
    res.status(201).json(newStats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ================= GET ALL (Coach sees his players stats) =================
export const getSeasonPerformance = async (req, res) => {
  try {
    const data = await SeasonPerformance.find({
      createdBy: req.user.id,
    }).populate("player", "name role position fitness userId");

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ================= GET ALL FOR ANALYST =================
// 🔥 NEW — Analyst sees ALL season performances across ALL coaches
// Used by PlayerAnalysis.jsx and TeamAnalytics.jsx
export const getSeasonPerformanceForAnalyst = async (req, res) => {
  try {
    const data = await SeasonPerformance.find()
      .populate("player", "name role position fitness userId")
      .sort({ runs: -1 }); // sorted by runs descending (top performers first)

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ================= GET MY STATS (Player fetches own stats) =================
export const getMySeasonStats = async (req, res) => {
  try {
    const player = await Player.findOne({ userId: req.user.id });

    if (!player) {
      return res.status(404).json({
        message: "Your account is not linked to any player profile yet.",
      });
    }

    const stats = await SeasonPerformance.findOne({
      player: player._id,
    }).populate("player", "name role position");

    if (!stats) {
      return res.status(404).json({
        message: "No stats yet. Your coach hasn't added your stats yet.",
      });
    }

    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ================= UPDATE =================
export const updateSeasonPerformance = async (req, res) => {
  try {
    if (req.body.playerId) {
      const player = await Player.findById(req.body.playerId);
      if (player?.userId) {
        req.body.userId = player.userId;
      }
    }

    const updated = await SeasonPerformance.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user.id },
      req.body,
      { new: true }
    );

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ================= DELETE =================
export const deleteSeasonPerformance = async (req, res) => {
  try {
    await SeasonPerformance.findOneAndDelete({
      _id: req.params.id,
      createdBy: req.user.id,
    });
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ================= SUMMARY (Coach) =================
export const getSeasonSummary = async (req, res) => {
  try {
    const stats = await SeasonPerformance.find({ createdBy: req.user.id });

    const totalRuns = stats.reduce((s, p) => s + (p.runs || 0), 0);
    const totalWickets = stats.reduce((s, p) => s + (p.wickets || 0), 0);

    res.json({
      totalRuns,
      totalWickets,
      avgStrikeRate: 0,
      avgRating: (
        stats.reduce((s, p) => s + (p.rating || 0), 0) / (stats.length || 1)
      ).toFixed(1),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};