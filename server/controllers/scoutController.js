import ScoutPlayer from "../models/Scout.js";
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

/* ── overall rating helper ── */
const calcOverall = (p) => {
  const role = (p.role || "").toLowerCase();
  let scores = [];

  if (role.includes("bat")) {
    if (p.battingAvg)   scores.push(Math.min((p.battingAvg / 60) * 100, 100));
    if (p.strikeRate)   scores.push(Math.min((p.strikeRate / 150) * 100, 100));
    if (p.fitnessScore) scores.push(p.fitnessScore);
  } else if (role.includes("bowl")) {
    if (p.wickets)      scores.push(Math.min((p.wickets / 30) * 100, 100));
    if (p.economy)      scores.push(Math.max(100 - (p.economy / 12) * 100, 0));
    if (p.fitnessScore) scores.push(p.fitnessScore);
  } else if (role.includes("all")) {
    if (p.battingAvg)   scores.push(Math.min((p.battingAvg / 50) * 100, 100));
    if (p.wickets)      scores.push(Math.min((p.wickets / 25) * 100, 100));
    if (p.fitnessScore) scores.push(p.fitnessScore);
  } else if (role.includes("keep") || role.includes("wk")) {
    if (p.battingAvg)   scores.push(Math.min((p.battingAvg / 40) * 100, 100));
    if (p.stumpings)    scores.push(Math.min((p.stumpings / 10) * 100, 100));
    if (p.catches)      scores.push(Math.min((p.catches / 20) * 100, 100));
    if (p.fitnessScore) scores.push(p.fitnessScore);
  }

  const numFields = ["battingAvg","strikeRate","wickets","economy","fitnessScore","speed","stamina","agility","catches"];
  if (scores.length === 0) {
    numFields.forEach((k) => {
      if (p[k] && p[k] > 0) scores.push(Math.min((p[k] / 100) * 100, 100));
    });
  }

  if (!scores.length) return 0;
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
};

// ================= GET ALL SCOUT PLAYERS =================
export const getScoutPlayers = async (req, res) => {
  try {
    const players = await ScoutPlayer.find()
      .populate("createdBy", "name email role")
      .sort({ overall: -1 });
    res.json(players);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ================= GET SINGLE SCOUT PLAYER =================
export const getScoutPlayer = async (req, res) => {
  try {
    const player = await ScoutPlayer.findById(req.params.id).populate("createdBy", "name email role");
    if (!player) return res.status(404).json({ message: "Scout player not found" });
    res.json(player);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ================= CREATE SCOUT PLAYER =================
export const createScoutPlayer = async (req, res) => {
  try {
    const data = { ...req.body, createdBy: req.user.id };
    data.overall = calcOverall(data);

    const player = await ScoutPlayer.create(data);
    const populated = await player.populate("createdBy", "name email role");
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ================= BULK IMPORT FROM EXCEL =================
export const bulkImportScoutPlayers = async (req, res) => {
  try {
    const { players } = req.body;

    if (!Array.isArray(players) || players.length === 0) {
      return res.status(400).json({ message: "No players data provided" });
    }

    const enriched = players.map((p) => ({
      ...p,
      createdBy: req.user.id,
      importedFrom: "excel",
      overall: calcOverall(p),
    }));

    enriched.forEach((p) => delete p._id);

    const saved = await ScoutPlayer.insertMany(enriched);

    res.status(201).json({
      message: `✅ ${saved.length} players imported successfully`,
      count: saved.length,
      players: saved,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ================= UPDATE SCOUT PLAYER =================
export const updateScoutPlayer = async (req, res) => {
  try {
    const player = await ScoutPlayer.findById(req.params.id);
    if (!player) return res.status(404).json({ message: "Scout player not found" });

    if (player.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const updated = { ...req.body };
    updated.overall = calcOverall({ ...player.toObject(), ...updated });

    const result = await ScoutPlayer.findByIdAndUpdate(req.params.id, updated, { new: true })
      .populate("createdBy", "name email role");
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ================= DELETE SCOUT PLAYER =================
export const deleteScoutPlayer = async (req, res) => {
  try {
    const player = await ScoutPlayer.findById(req.params.id);
    if (!player) return res.status(404).json({ message: "Scout player not found" });

    if (player.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await ScoutPlayer.findByIdAndDelete(req.params.id);
    res.json({ message: "Scout player deleted ✅" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ================= RECOMMEND PLAYER → Notify all coaches =================
export const recommendPlayer = async (req, res) => {
  try {
    const player = await ScoutPlayer.findByIdAndUpdate(
      req.params.id,
      { recommended: true },
      { new: true }
    ).populate("createdBy", "name email role");

    if (!player) return res.status(404).json({ message: "Scout player not found" });

    const coaches = await User.find({ role: "coach" }).select("_id");
    for (const coach of coaches) {
      await pushNotif(coach._id, {
        from: req.user.id,
        type: "scout_recommend",
        title: `⭐ Player Recommended: ${player.playerName}`,
        message: `${player.role} · Age ${player.age || "N/A"} · ${player.currentTeam || "Unknown"} · Overall: ${player.overall}/100`,
        data: { playerId: player._id, playerName: player.playerName, overall: player.overall },
        read: false,
        createdAt: new Date(),
      });
    }

    res.json({ message: "Player recommended for main team ✅", player });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ================= GET RECOMMENDED PLAYERS =================
export const getRecommendedPlayers = async (req, res) => {
  try {
    const players = await ScoutPlayer.find({ recommended: true })
      .populate("createdBy", "name email role")
      .sort({ overall: -1 });
    res.json(players);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ================= PUSH SHORTLIST TO COACH → Notify all coaches =================
export const pushShortlistToCoach = async (req, res) => {
  try {
    const { playerIds, customMessage } = req.body;

    let players;
    if (playerIds && playerIds.length > 0) {
      players = await ScoutPlayer.find({ _id: { $in: playerIds } });
    } else {
      players = await ScoutPlayer.find({ recommended: true });
    }

    if (!players.length) {
      return res.status(400).json({ message: "No recommended players to push" });
    }

    const coaches = await User.find({ role: "coach" }).select("_id name");
    if (!coaches.length) return res.status(404).json({ message: "No coaches found" });

    const summaryMsg =
      customMessage ||
      `Shortlist of ${players.length} players: ` +
        players.map((p) => `${p.playerName} (${p.role}, ${p.overall}/100)`).join(" | ");

    for (const coach of coaches) {
      await pushNotif(coach._id, {
        from: req.user.id,
        type: "scout_shortlist",
        title: `📋 Scout Shortlist: ${players.length} Players for Main Team`,
        message: summaryMsg,
        data: {
          shortlist: players.map((p) => ({
            _id: p._id,
            playerName: p.playerName,
            role: p.role,
            overall: p.overall,
          })),
        },
        read: false,
        createdAt: new Date(),
      });
    }

    await ScoutPlayer.updateMany(
      { _id: { $in: players.map((p) => p._id) } },
      { sentToCoach: true }
    );

    res.json({
      message: `✅ Shortlist pushed to ${coaches.length} coach(es)`,
      notifiedCoaches: coaches.map((c) => c.name),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};