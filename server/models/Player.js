import mongoose from "mongoose";

const playerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, default: null },

    role: { type: String, default: "" },
    position: { type: String, default: "Batsman" },
    age: { type: Number, default: 0 },
    fitness: { type: Number, default: 0 },
    jerseyNumber: { type: Number, default: 0 },

    // 🔥 Set at registration — links this Player to their User account
    // This is what MyStats uses to find the right stats
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Set when coach adds this player to their squad
    // null means player registered but no coach has claimed them yet
    coachId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Player", playerSchema);