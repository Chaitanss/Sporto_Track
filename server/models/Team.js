import mongoose from "mongoose";

const teamSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    clubName: {
      type: String,
      default: ""
    },
    coachId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    players: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ]
  },
  { timestamps: true }
);

export default mongoose.model("Team", teamSchema);