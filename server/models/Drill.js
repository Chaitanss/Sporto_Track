import mongoose from "mongoose";

const drillSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    type: { type: String, required: true },
    duration: { type: Number, required: true },

    coach: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // 🔥 AUTO ASSIGN
    assignedTo: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("Drill", drillSchema);