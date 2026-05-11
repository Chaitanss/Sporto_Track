import mongoose from "mongoose";

const fitnessSchema = new mongoose.Schema(
  {
    // Link to Player record
    player: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Player",
      required: true,
    },

    // 🔥 Direct link to User — player finds their own record by this
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Daily fitness score 0-100
    fitness: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      default: 100,
    },

    // 🔥 Fitness history — last 7 days stored as array
    history: {
      type: [Number],
      default: [],
    },

    // 🔥 Injury report fields
    injury: {
      type: String,
      default: "None", // None | Hamstring | Shoulder | Knee | Back | Ankle | Other
    },

    injuryOther: {
      type: String,
      default: "", // filled when injury = "Other"
    },

    severity: {
      type: String,
      enum: ["None", "Mild (can train)", "Moderate", "Severe"],
      default: "None",
    },

    description: {
      type: String,
      default: "",
    },

    // 🔥 Has player reported to coach today?
    reportedToCoach: {
      type: Boolean,
      default: false,
    },

    // Coach's feedback text
    coachFeedback: {
      type: String,
      default: "",
    },

    // Last date player reported fitness
    lastReported: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Fitness", fitnessSchema);