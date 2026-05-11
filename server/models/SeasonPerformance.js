import mongoose from "mongoose";

const seasonPerformanceSchema = new mongoose.Schema(
  {
    player: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Player",
      required: true,
    },

    // 🔥 Direct link to the User who IS this player
    // Copied from Player.userId when coach saves stats
    // This is what getMySeasonStats() uses — player fetches by their userId
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    matches: { type: Number, default: 0 },
    runs: { type: Number, default: 0 },
    wickets: { type: Number, default: 0 },

    impactRate: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
    },

    rating: { type: Number, default: 0 },

    // Coach who entered these stats
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("SeasonPerformance", seasonPerformanceSchema);