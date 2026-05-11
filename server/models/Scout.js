import mongoose from "mongoose";

const scoutPlayerSchema = new mongoose.Schema(
  {
    // Added by
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Basic info
    playerName:   { type: String, required: true },
    role:         { type: String, default: "Batsman" }, // Batsman, Bowler, All-Rounder, WK-Batsman
    age:          { type: Number, default: null },
    currentTeam:  { type: String, default: "" },

    // ── BATTING ──
    battingAvg:   { type: Number, default: 0 },
    strikeRate:   { type: Number, default: 0 },
    runs:         { type: Number, default: 0 },
    fifties:      { type: Number, default: 0 },
    hundreds:     { type: Number, default: 0 },
    fours:        { type: Number, default: 0 },
    sixes:        { type: Number, default: 0 },

    // ── BOWLING ──
    wickets:      { type: Number, default: 0 },
    economy:      { type: Number, default: 0 },
    bowlingAvg:   { type: Number, default: 0 },
    maidens:      { type: Number, default: 0 },
    fiveWickets:  { type: Number, default: 0 },

    // ── FIELDING ──
    catches:      { type: Number, default: 0 },
    runOuts:      { type: Number, default: 0 },
    stumpings:    { type: Number, default: 0 },

    // ── FITNESS ──
    fitnessScore: { type: Number, default: 0 },
    speed:        { type: Number, default: 0 },
    stamina:      { type: Number, default: 0 },
    agility:      { type: Number, default: 0 },

    // Computed
    overall:      { type: Number, default: 0 },

    // Status
    recommended:  { type: Boolean, default: false }, // shortlisted for main team
    sentToCoach:  { type: Boolean, default: false },

    // Source
    importedFrom: { type: String, default: "manual" }, // "excel" | "manual"
    notes:        { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("ScoutPlayer", scoutPlayerSchema);