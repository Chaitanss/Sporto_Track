import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    from: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    type: { type: String, default: "general" },
    title: { type: String, required: true },
    message: { type: String, default: "" },
    data: { type: mongoose.Schema.Types.Mixed, default: null },
    meta: { type: mongoose.Schema.Types.Mixed, default: null },
    read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },

    coachId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    role: {
      type: String,
      enum: ["player", "coach", "analyst"],
      required: true,
    },

    phone: { type: String, required: true },

    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      default: null,
    },

    // 🔔 NOTIFICATIONS INBOX — THIS WAS MISSING, NOTHING SAVED WITHOUT THIS
    notifications: {
      type: [notificationSchema],
      default: [],
    },

    // 💬 CHAT FIELDS
    avatar: { type: String, default: "" },
    isOnline: { type: Boolean, default: false },
    lastSeen: { type: Date, default: null },
    socketId: { type: String, default: null },
    unreadCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);