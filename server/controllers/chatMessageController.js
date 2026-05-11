import ChatMessage from "../models/ChatMessage.js";
import User from "../models/User.js";
import Player from "../models/Player.js";
import { emitNotification } from "../server.js";

// ─── Shared helper ────────────────────────────────────────────────────────────
const pushNotif = async (userId, notif) => {
  const saved = await User.findByIdAndUpdate(
    userId,
    { $push: { notifications: notif } },
    { new: true }
  ).select("notifications");

  const newNotif = saved?.notifications?.[saved.notifications.length - 1];
  if (newNotif) emitNotification(userId.toString(), newNotif);
};

// SEND MESSAGE — also pushes a notification to the receiver
export const sendMessage = async (req, res) => {
  try {
    const { receiverId, message } = req.body;

    const newMessage = await ChatMessage.create({
      sender: req.user.id,
      receiver: receiverId,
      message,
      status: "sent",
    });

    const populated = await newMessage.populate([
      { path: "sender", select: "name role" },
      { path: "receiver", select: "name role" },
    ]);

    // ── Notify receiver ────────────────────────────────────────────────────
    const senderName = populated.sender?.name || "Someone";
    await pushNotif(receiverId, {
      from: req.user.id,
      type: "message",
      title: `💬 New Message from ${senderName}`,
      message: message.length > 80 ? message.slice(0, 80) + "…" : message,
      data: { senderId: req.user.id, senderName },
      read: false,
      createdAt: new Date(),
    });

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET MESSAGES BETWEEN TWO USERS
export const getMessages = async (req, res) => {
  try {
    const { userId } = req.params;

    const messages = await ChatMessage.find({
      $or: [
        { sender: req.user.id, receiver: userId },
        { sender: userId, receiver: req.user.id },
      ],
      deletedFor: { $nin: [req.user.id] },
    })
      .sort({ createdAt: 1 })
      .populate("sender", "name role")
      .populate("receiver", "name role");

    // Mark messages as read
    await ChatMessage.updateMany(
      { sender: userId, receiver: req.user.id, status: { $ne: "read" } },
      { status: "read" }
    );

    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// EDIT MESSAGE
export const editMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;

    const msg = await ChatMessage.findOne({ _id: id, sender: req.user.id });
    if (!msg) return res.status(404).json({ error: "Message not found" });

    msg.message = message;
    msg.edited = true;
    await msg.save();

    const populated = await msg.populate([
      { path: "sender", select: "name role" },
      { path: "receiver", select: "name role" },
    ]);

    res.json(populated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE MESSAGE (for me or for everyone)
export const deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { deleteFor } = req.body;

    const msg = await ChatMessage.findById(id);
    if (!msg) return res.status(404).json({ error: "Message not found" });

    if (deleteFor === "everyone" && msg.sender.toString() === req.user.id) {
      msg.deletedForEveryone = true;
      msg.message = "This message was deleted";
      await msg.save();
    } else {
      if (!msg.deletedFor) msg.deletedFor = [];
      msg.deletedFor.push(req.user.id);
      await msg.save();
    }

    res.json({ success: true, messageId: id, deleteFor });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET ALLOWED CHAT USERS
export const getAllowedUsers = async (req, res) => {
  try {
    const me = await User.findById(req.user.id).select("role");

    let allowedUsers = [];

    if (me.role === "coach") {
      const squadPlayers = await Player.find({ coachId: req.user.id }).select("userId name");
      const playerUserIds = squadPlayers.map((p) => p.userId).filter(Boolean);

      const analysts = await User.find({ role: "analyst" }).select("_id name role isOnline lastSeen");
      const players = await User.find({ _id: { $in: playerUserIds } }).select("_id name role isOnline lastSeen");

      allowedUsers = [...analysts, ...players];
    } else if (me.role === "analyst") {
      const coaches = await User.find({ role: "coach" }).select("_id name role isOnline lastSeen");
      const allSquadPlayers = await Player.find({ coachId: { $ne: null } }).select("userId name");
      const playerUserIds = allSquadPlayers.map((p) => p.userId).filter(Boolean);
      const players = await User.find({ _id: { $in: playerUserIds } }).select("_id name role isOnline lastSeen");

      allowedUsers = [...coaches, ...players];
    } else if (me.role === "player") {
      const playerRecord = await Player.findOne({ userId: req.user.id }).select("coachId");

      let coaches = [];
      if (playerRecord?.coachId) {
        const coach = await User.findById(playerRecord.coachId).select("_id name role isOnline lastSeen");
        if (coach) coaches = [coach];
      } else {
        coaches = await User.find({ role: "coach" }).select("_id name role isOnline lastSeen");
      }

      const analysts = await User.find({ role: "analyst" }).select("_id name role isOnline lastSeen");
      allowedUsers = [...coaches, ...analysts];
    }

    res.json(allowedUsers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET LAST MESSAGE FOR EACH CONVERSATION
export const getConversations = async (req, res) => {
  try {
    const myId = req.user.id;

    const messages = await ChatMessage.find({
      $or: [{ sender: myId }, { receiver: myId }],
      deletedFor: { $nin: [myId] },
    })
      .sort({ createdAt: -1 })
      .populate("sender", "name role isOnline lastSeen")
      .populate("receiver", "name role isOnline lastSeen");

    const seen = new Set();
    const conversations = [];

    for (const msg of messages) {
      const other = msg.sender._id.toString() === myId ? msg.receiver : msg.sender;
      const otherId = other._id.toString();

      if (!seen.has(otherId)) {
        seen.add(otherId);
        const unread = await ChatMessage.countDocuments({
          sender: otherId,
          receiver: myId,
          status: { $ne: "read" },
        });
        conversations.push({ user: other, lastMessage: msg, unreadCount: unread });
      }
    }

    res.json(conversations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// MARK MESSAGES AS READ
export const markAsRead = async (req, res) => {
  try {
    const { userId } = req.params;
    await ChatMessage.updateMany(
      { sender: userId, receiver: req.user.id, status: { $ne: "read" } },
      { status: "read" }
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};