import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
  {
    coach: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    title: {
      type: String,
      required: true,
    },

    details: String,

    type: {
      type: String,
      enum: ["MATCH", "TRAINING", "TOURNAMENT"],
      default: "MATCH",
    },

    date: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Event", eventSchema);