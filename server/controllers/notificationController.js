import User from "../models/User.js";
import Player from "../models/Player.js";
import { emitNotification } from "../server.js";

// ─── Helper: save notif to DB + emit real-time via socket ──────────────────
const pushNotif = async (userId, notif) => {
  const saved = await User.findByIdAndUpdate(
    userId,
    { $push: { notifications: notif } },
    { new: true }
  ).select("notifications");

  // Get the newly pushed notification (last item)
  const newNotif = saved?.notifications?.[saved.notifications.length - 1];
  if (newNotif) {
    emitNotification(userId.toString(), newNotif);
  }
};

// ================= BROADCAST (Analyst → Coach / Players / Both) =================
// POST /api/notifications/broadcast
export const broadcastMessage = async (req, res) => {
  try {
    const { sendTo, messageType, subject, message } = req.body;

    if (!subject || !message) {
      return res.status(400).json({ message: "Subject and message are required" });
    }

    const notified = [];

    const buildNotif = (type) => ({
      from: req.user.id,
      type: type || "broadcast",
      title: subject,
      message: message,
      meta: { messageType: messageType || "General", sentBy: "analyst" },
      read: false,
      createdAt: new Date(),
    });

    // Notify coaches
    if (sendTo.includes("coach")) {
      const coaches = await User.find({ role: "coach" }).select("_id name");
      for (const coach of coaches) {
        await pushNotif(coach._id, buildNotif("broadcast_coach"));
        notified.push(coach.name);
      }
    }

    // Notify all squad players
    if (sendTo.includes("players")) {
      const squadPlayers = await Player.find({ coachId: { $ne: null } }).select("userId name");
      const playerUserIds = squadPlayers.map((p) => p.userId).filter(Boolean);
      const players = await User.find({ _id: { $in: playerUserIds } }).select("_id name");
      for (const player of players) {
        await pushNotif(player._id, buildNotif("broadcast_player"));
        notified.push(player.name);
      }
    }

    res.json({
      message: `✅ Broadcast sent to ${notified.length} recipient(s)`,
      recipients: notified,
    });
  } catch (err) {
    console.error("Broadcast error:", err.message);
    res.status(500).json({ message: err.message });
  }
};

// ================= PUSH TO COACH (Analyst pushes analytics / match reports) =================
export const pushToCoach = async (req, res) => {
  try {
    const { type, title, message, data } = req.body;

    const coaches = await User.find({ role: "coach" }).select("_id name");
    if (!coaches.length) return res.status(404).json({ message: "No coaches found" });

    for (const coach of coaches) {
      await pushNotif(coach._id, {
        from: req.user.id,
        type: type || "analytics_push",
        title: title || "📊 Analytics Report",
        message: message || "Analyst pushed new analytics data.",
        data: data || null,
        read: false,
        createdAt: new Date(),
      });
    }

    res.json({
      message: `✅ Pushed to ${coaches.length} coach(es) successfully`,
      notifiedCoaches: coaches.map((c) => c.name),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ================= SEND ANALYSIS NOTE =================
export const sendAnalysisNote = async (req, res) => {
  try {
    const { title, message, playerName, noteType } = req.body;

    const coaches = await User.find({ role: "coach" }).select("_id name");
    if (!coaches.length) return res.status(404).json({ message: "No coaches found" });

    for (const coach of coaches) {
      await pushNotif(coach._id, {
        from: req.user.id,
        type: "analysis_note",
        title: title || `📋 Analysis Note: ${playerName}`,
        message: message,
        meta: { playerName, noteType },
        read: false,
        createdAt: new Date(),
      });
    }

    res.json({
      message: `✅ Analysis note sent to ${coaches.length} coach(es)`,
      notifiedCoaches: coaches.map((c) => c.name),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ================= GET MY NOTIFICATIONS =================
export const getMyNotifications = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("notifications");
    const notifs = (user?.notifications || []).sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
    res.json(notifs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ================= MARK AS READ =================
export const markAsRead = async (req, res) => {
  try {
    await User.updateOne(
      { _id: req.user.id, "notifications._id": req.params.notifId },
      { $set: { "notifications.$.read": true } }
    );
    res.json({ message: "Marked as read" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ================= MARK ALL AS READ =================
export const markAllAsRead = async (req, res) => {
  try {
    await User.updateOne(
      { _id: req.user.id },
      { $set: { "notifications.$[].read": true } }
    );
    res.json({ message: "All marked as read" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ================= GET BROADCAST HISTORY (Analyst) =================
export const getBroadcastHistory = async (req, res) => {
  try {
    const allUsers = await User.find({}).select("notifications name role");
    const history = [];
    const seen = new Set();

    for (const user of allUsers) {
      for (const n of user.notifications || []) {
        if (
          n.from?.toString() === req.user.id &&
          (n.type === "broadcast_coach" || n.type === "broadcast_player" || n.type === "broadcast")
        ) {
          const key = n.title + "|" + n.createdAt;
          if (!seen.has(key)) {
            seen.add(key);
            history.push({
              _id: n._id,
              title: n.title,
              message: n.message,
              messageType: n.meta?.messageType || "General",
              sentTo:
                n.type === "broadcast_coach"
                  ? "Coach"
                  : n.type === "broadcast_player"
                  ? "Players"
                  : "All",
              createdAt: n.createdAt,
            });
          }
        }
      }
    }

    history.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(history);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};