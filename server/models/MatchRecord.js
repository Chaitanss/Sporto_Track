import mongoose from "mongoose";

const playerPerformanceSchema = new mongoose.Schema({
  playerId: { type: mongoose.Schema.Types.ObjectId, ref: "Player" },
  playerName: { type: String, required: true },
  jerseyNumber: { type: Number, default: 0 },
  position: { type: String, default: "Batsman" },

  // BATTING
  runs: { type: Number, default: 0 },
  balls: { type: Number, default: 0 },
  fours: { type: Number, default: 0 },
  sixes: { type: Number, default: 0 },
  strikeRate: { type: Number, default: 0 },
  dismissal: { type: String, default: "not out" }, // "not out", "bowled", "caught", etc.

  // BOWLING
  overs: { type: Number, default: 0 },
  maidens: { type: Number, default: 0 },
  runsConceded: { type: Number, default: 0 },
  wickets: { type: Number, default: 0 },
  economy: { type: Number, default: 0 },

  // FIELDING
  catches: { type: Number, default: 0 },
  runOuts: { type: Number, default: 0 },
});

const matchRecordSchema = new mongoose.Schema(
  {
    // Who created this record (coach or analyst)
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    createdByRole: {
      type: String,
      enum: ["coach", "analyst"],
      required: true,
    },

    // Match Info
    matchTitle: { type: String, required: true }, // e.g. "T20 5 of 70"
    matchDate: { type: Date, required: true },
    venue: { type: String, default: "" },
    matchType: {
      type: String,
      enum: ["T20", "ODI", "Test", "Other"],
      default: "T20",
    },

    // Teams
    teamA: { type: String, required: true },
    teamAScore: { type: String, default: "" }, // e.g. "185/6 (20)"
    teamB: { type: String, required: true },
    teamBScore: { type: String, default: "" },

    // Result
    result: { type: String, default: "" }, // "Team A won by 25 runs"
    winningTeam: { type: String, default: "" },

    // Playing 11 performances
    playing11: [playerPerformanceSchema],

    // Extra notes
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("MatchRecord", matchRecordSchema);