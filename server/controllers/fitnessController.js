import Fitness from "../models/Fitness.js";
import Player from "../models/Player.js";

// ================= PLAYER: REPORT FITNESS DAILY =================
// Player calls this when they click "Report to Coach"
export const addOrUpdateFitness = async (req, res) => {
  try {
    const { fitness, injury, injuryOther, severity, description } = req.body;

    // Find the Player record linked to this logged-in user
    const player = await Player.findOne({ userId: req.user.id });
    if (!player) {
      return res.status(404).json({
        message: "No player profile linked to your account.",
      });
    }

    // Find existing fitness record for this player
    let existing = await Fitness.findOne({ userId: req.user.id });

    if (existing) {
      // 🔥 Push today's old fitness into history (keep last 7)
      const updatedHistory = [...(existing.history || []), existing.fitness]
        .slice(-7);

      existing.fitness        = fitness;
      existing.history        = updatedHistory;
      existing.injury         = injury || "None";
      existing.injuryOther    = injuryOther || "";
      existing.severity       = severity || "None";
      existing.description    = description || "";
      existing.reportedToCoach = true;
      existing.lastReported   = new Date();

      await existing.save();
      return res.json(existing);
    }

    // First time — create new record
    const newFitness = new Fitness({
      player:          player._id,
      userId:          req.user.id,
      fitness:         fitness,
      history:         [],
      injury:          injury || "None",
      injuryOther:     injuryOther || "",
      severity:        severity || "None",
      description:     description || "",
      reportedToCoach: true,
      lastReported:    new Date(),
    });

    await newFitness.save();
    res.status(201).json(newFitness);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ================= PLAYER: GET OWN FITNESS =================
export const getMyFitness = async (req, res) => {
  try {
    const record = await Fitness.findOne({ userId: req.user.id })
      .populate("player", "name position");

    if (!record) {
      return res.status(404).json({ message: "No fitness record yet." });
    }

    res.json(record);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ================= COACH: GET ALL PLAYERS' FITNESS =================
// Only shows players from this coach's squad
export const getFitnessReports = async (req, res) => {
  try {
    // Get all players in this coach's squad
    const squadPlayers = await Player.find({ coachId: req.user.id });
    const playerIds = squadPlayers.map((p) => p._id);

    // Get fitness records for those players only
    const data = await Fitness.find({
      player: { $in: playerIds },
    }).populate("player", "name position jerseyNumber");

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ================= COACH: SUMMARY CARDS =================
export const getFitnessSummary = async (req, res) => {
  try {
    const squadPlayers = await Player.find({ coachId: req.user.id });
    const playerIds = squadPlayers.map((p) => p._id);

    const data = await Fitness.find({ player: { $in: playerIds } });

    let fit = 0;
    let monitor = 0;
    let injured = 0;

    data.forEach((p) => {
      if (p.fitness >= 85) fit++;
      else if (p.fitness >= 60) monitor++;
      else injured++;
    });

    const avg =
      data.length > 0
        ? (data.reduce((sum, p) => sum + p.fitness, 0) / data.length).toFixed(1)
        : "0.0";

    res.json({ fit, monitor, injured, avg });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ================= COACH: ADD FEEDBACK =================
export const addCoachFeedback = async (req, res) => {
  try {
    const { feedback } = req.body;

    const updated = await Fitness.findByIdAndUpdate(
      req.params.id,
      { coachFeedback: feedback },
      { new: true }
    ).populate("player", "name position");

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};