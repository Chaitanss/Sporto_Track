import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import "dotenv/config";
import http from "http";
import { Server } from "socket.io";
import dns from "dns";

import teamRoutes from "./routes/team.js";
import playerRoutes from "./routes/player.js";
import drillRoutes from "./routes/drill.js";
import tacticsRoutes from "./routes/tactics.js";
import eventRoutes from "./routes/event.js";
import seasonRoutes from "./routes/season.js";
import fitnessRoutes from "./routes/fitness.js";
import noteRoutes from "./routes/note.js";
import chatMessageRoutes from "./routes/chatMessage.js";
import matchRecordRoutes from "./routes/matchRecord.js";
import notificationRoutes from "./routes/notifications.js";
import scoutRoutes from "./routes/scout.js";
import aiRoutes from "./routes/ai.js";
import authRoutes from "./routes/auth.js";
import testRoutes from "./routes/test.js";
import userRoutes from "./routes/user.js";

import User from "./models/User.js";

dns.setServers(["1.1.1.1", "8.8.8.8"]);

const app = express();

app.use(cors());
app.use(express.json());

// ROUTES
app.get("/", (req, res) => res.send("API Running 🚀"));

app.use("/api/auth", authRoutes);
app.use("/api/test", testRoutes);
app.use("/api/team", teamRoutes);
app.use("/api/players", playerRoutes);
app.use("/api/drills", drillRoutes);
app.use("/api/tactics", tacticsRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/season", seasonRoutes);
app.use("/api/fitness", fitnessRoutes);
app.use("/api/notes", noteRoutes);
app.use("/api/chat", chatMessageRoutes);
app.use("/api/match-records", matchRecordRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/scouts", scoutRoutes);
app.use("/api/users", userRoutes);

// DB
const connectDB = async () => {
  await mongoose.connect(process.env.MONGO_URL);
  console.log("MongoDB Connected ✅");
};

// SOCKET
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "https://sporto-track.vercel.app"
  },
});

// userId -> socketId map — exported so controllers can use it
export const users = {};
export { io };

io.on("connection", (socket) => {
  console.log("🟢 Connected:", socket.id);

  // REGISTER USER
  socket.on("register", async (userId) => {
    users[userId] = socket.id;

    await User.findByIdAndUpdate(userId, {
      isOnline: true,
      socketId: socket.id,
    });

    socket.broadcast.emit("userOnline", { userId });
    console.log("✅ Registered:", userId);
  });

  // SEND MESSAGE
  socket.on("sendMessage", ({ senderId, receiverId, message, messageId, tempId }) => {
    const receiverSocket = users[receiverId];

    if (receiverSocket) {
      io.to(receiverSocket).emit("receiveMessage", {
        senderId,
        receiverId,
        message,
        messageId,
        tempId,
        timestamp: new Date().toISOString(),
      });

      socket.emit("messageDelivered", { messageId, tempId, receiverId });
    }
  });

  // READ RECEIPT
  socket.on("messagesRead", ({ readerId, senderId }) => {
    const senderSocket = users[senderId];
    if (senderSocket) {
      io.to(senderSocket).emit("messagesReadBy", { readerId });
    }
  });

  // EDIT MESSAGE
  socket.on("editMessage", ({ messageId, newText, senderId, receiverId }) => {
    const receiverSocket = users[receiverId];
    if (receiverSocket) {
      io.to(receiverSocket).emit("messageEdited", { messageId, newText });
    }
  });

  // DELETE MESSAGE
  socket.on("deleteMessage", ({ messageId, deleteFor, senderId, receiverId }) => {
    const receiverSocket = users[receiverId];
    if (receiverSocket && deleteFor === "everyone") {
      io.to(receiverSocket).emit("messageDeleted", { messageId });
    }
  });

  // TYPING INDICATOR
  socket.on("typing", ({ senderId, receiverId }) => {
    const receiverSocket = users[receiverId];
    if (receiverSocket) {
      io.to(receiverSocket).emit("userTyping", { senderId });
    }
  });

  socket.on("stopTyping", ({ senderId, receiverId }) => {
    const receiverSocket = users[receiverId];
    if (receiverSocket) {
      io.to(receiverSocket).emit("userStoppedTyping", { senderId });
    }
  });

  // DISCONNECT
  socket.on("disconnect", async () => {
    console.log("🔴 Disconnected:", socket.id);

    for (let id in users) {
      if (users[id] === socket.id) {
        delete users[id];

        await User.findByIdAndUpdate(id, {
          isOnline: false,
          lastSeen: new Date(),
          socketId: null,
        });

        socket.broadcast.emit("userOffline", { userId: id, lastSeen: new Date().toISOString() });
        break;
      }
    }
  });
});

// ─── HELPER: Push real-time notification to a user if they're online ──────────
// Call this from ANY controller: emitNotification(userId, notifObject)
export const emitNotification = (userId, notif) => {
  const socketId = users[userId?.toString()];
  if (socketId) {
    io.to(socketId).emit("newNotification", notif);
  }
};

// START
const startServer = async () => {
  await connectDB();

  server.listen(5000, () => {
    console.log("🚀 Server running on 5000");
  });
};

startServer();