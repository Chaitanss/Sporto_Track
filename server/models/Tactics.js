import mongoose from "mongoose";

const tacticsSchema = new mongoose.Schema(
  {
    coach: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    formation: String,
    positions: Object,
    notes: String,
  },
  { timestamps: true }
);

export default mongoose.model("Tactics", tacticsSchema);