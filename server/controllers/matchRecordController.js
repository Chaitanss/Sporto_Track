import MatchRecord from "../models/MatchRecord.js";
import User from "../models/User.js";
import Player from "../models/Player.js";
import { emitNotification } from "../server.js";

// ─── Shared helper ────────────────────────────────────────────────────────────
const pushNotif = async (userId, notif) => {
  const saved = await User.findByIdAndUpdate(
    userId,
    { $push: { notifications: notif } },
    { new: true }
  ).select("notifications");

  const newNotif = saved?.notifications?.[saved.notifications.length - 1];
  if (newNotif) emitNotification(userId.toString(), newNotif);
};

// ================= GET ALL MATCH RECORDS =================
export const getMatchRecords = async (req, res) => {
  try {
    const records = await MatchRecord.find()
      .populate("createdBy", "name email role")
      .sort({ matchDate: -1 });
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ================= GET SINGLE MATCH RECORD =================
export const getMatchRecord = async (req, res) => {
  try {
    const record = await MatchRecord.findById(req.params.id).populate(
      "createdBy",
      "name email role"
    );
    if (!record) return res.status(404).json({ message: "Match record not found" });
    res.json(record);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ================= CREATE MATCH RECORD =================
// Notifies: Coach (if analyst creates) | Analyst (if coach creates) | All Players
export const createMatchRecord = async (req, res) => {
  try {
    const {
      matchTitle,
      matchDate,
      venue,
      matchType,
      teamA,
      teamAScore,
      teamB,
      teamBScore,
      result,
      winningTeam,
      playing11,
      notes,
    } = req.body;

    const enrichedPlaying11 = (playing11 || []).map((p) => ({
      ...p,
      strikeRate: p.balls > 0 ? parseFloat(((p.runs / p.balls) * 100).toFixed(2)) : 0,
      economy: p.overs > 0 ? parseFloat((p.runsConceded / p.overs).toFixed(2)) : 0,
    }));

    const record = await MatchRecord.create({
      createdBy: req.user.id,
      createdByRole: req.user.role,
      matchTitle,
      matchDate,
      venue,
      matchType,
      teamA,
      teamAScore,
      teamB,
      teamBScore,
      result,
      winningTeam,
      playing11: enrichedPlaying11,
      notes,
    });

    const populated = await record.populate("createdBy", "name email role");

    // ── NOTIFICATIONS ──────────────────────────────────────────────────────
    const notifPayload = {
      from: req.user.id,
      type: "match_record",
      title: `📋 Match Record Added: ${matchTitle}`,
      message: `${teamA} vs ${teamB} • ${result} • ${venue || ""}`,
      data: { recordId: record._id, matchTitle, result },
      read: false,
      createdAt: new Date(),
    };

    // If analyst created → notify all coaches
    if (req.user.role === "analyst") {
      const coaches = await User.find({ role: "coach" }).select("_id");
      for (const coach of coaches) {
        await pushNotif(coach._id, { ...notifPayload });
      }
    }

    // If coach created → notify all analysts
    if (req.user.role === "coach") {
      const analysts = await User.find({ role: "analyst" }).select("_id");
      for (const analyst of analysts) {
        await pushNotif(analyst._id, { ...notifPayload });
      }
    }

    // Always notify all squad players
    const squadPlayers = await Player.find({ coachId: { $ne: null } }).select("userId");
    const playerUserIds = squadPlayers.map((p) => p.userId).filter(Boolean);
    const playerUsers = await User.find({ _id: { $in: playerUserIds } }).select("_id");
    for (const player of playerUsers) {
      await pushNotif(player._id, { ...notifPayload });
    }

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ================= UPDATE MATCH RECORD =================
export const updateMatchRecord = async (req, res) => {
  try {
    const record = await MatchRecord.findById(req.params.id);
    if (!record) return res.status(404).json({ message: "Match record not found" });

    if (record.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to update this record" });
    }

    const enrichedPlaying11 = (req.body.playing11 || record.playing11).map((p) => ({
      ...p,
      strikeRate: p.balls > 0 ? parseFloat(((p.runs / p.balls) * 100).toFixed(2)) : 0,
      economy: p.overs > 0 ? parseFloat((p.runsConceded / p.overs).toFixed(2)) : 0,
    }));

    const updated = await MatchRecord.findByIdAndUpdate(
      req.params.id,
      { ...req.body, playing11: enrichedPlaying11 },
      { new: true }
    ).populate("createdBy", "name email role");

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ================= DELETE MATCH RECORD =================
export const deleteMatchRecord = async (req, res) => {
  try {
    const record = await MatchRecord.findById(req.params.id);
    if (!record) return res.status(404).json({ message: "Match record not found" });

    if (record.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await MatchRecord.findByIdAndDelete(req.params.id);
    res.json({ message: "Match record deleted ✅" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};