import Drill from "../models/Drill.js";
import User from "../models/User.js";
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

// ➕ ADD DRILL
export const addDrill = async (req, res) => {
  try {
    const { name, type, duration } = req.body;

    const drill = await Drill.create({
      name,
      type,
      duration,
      coach: req.user.id,
      assignedTo: [],
    });

    console.log("🔥 CREATED DRILL:", drill);
    res.json(drill);
  } catch (err) {
    console.log("❌ ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

// 🔥 GET ALL COACHES (for player dropdown in MyDrills)
export const getAllCoaches = async (req, res) => {
  try {
    const coaches = await User.find({ role: "coach" }).select("_id name email");
    res.json(coaches);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 🔥 GET ALL PLAYERS (for coach dropdown in DrillLibrary)
export const getAllPlayers = async (req, res) => {
  try {
    const players = await User.find({ role: "player" }).select("_id name email");
    res.json(players);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 🔥 GET DRILLS BY COACH ID (player selects coach → sees their drills)
export const getDrillsByCoach = async (req, res) => {
  try {
    const { coachId } = req.params;
    const drills = await Drill.find({ coach: coachId });
    res.json(drills);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 🔥 SHARE / SEND DRILL TO SPECIFIC PLAYER(S) → Notifies each player
export const shareDrill = async (req, res) => {
  try {
    const { userIds } = req.body;

    const drill = await Drill.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { assignedTo: { $each: userIds } } },
      { new: true }
    );

    if (!drill) return res.status(404).json({ message: "Drill not found" });

    // Get coach name for notification
    const coach = await User.findById(req.user.id).select("name");

    // Notify each assigned player
    for (const playerId of userIds) {
      await pushNotif(playerId, {
        from: req.user.id,
        type: "drill_assigned",
        title: `🎯 New Drill Assigned: ${drill.name}`,
        message: `Coach ${coach?.name || "Coach"} assigned you a new drill — ${drill.type || ""} · ${drill.duration || ""} mins`,
        data: { drillId: drill._id, drillName: drill.name },
        read: false,
        createdAt: new Date(),
      });
    }

    console.log("🔥 SHARED DRILL:", drill);
    res.json(drill);
  } catch (err) {
    console.log("❌ SHARE ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

// 👤 GET PLAYER DRILLS (drills assigned to logged-in player)
export const getPlayerDrills = async (req, res) => {
  try {
    const drills = await Drill.find({ assignedTo: req.user.id });
    res.json(drills);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✏️ UPDATE DRILL
export const updateDrill = async (req, res) => {
  try {
    const updated = await Drill.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ❌ DELETE DRILL
export const deleteDrill = async (req, res) => {
  try {
    await Drill.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};