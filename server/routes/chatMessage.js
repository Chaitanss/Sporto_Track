import express from "express";
const router = express.Router();

import {
  sendMessage,
  getMessages,
  editMessage,
  deleteMessage,
  getAllowedUsers,
  getConversations,
  markAsRead,
} from "../controllers/chatMessageController.js";

import auth from "../middleware/auth.js";

// GET ALLOWED USERS TO CHAT WITH (based on role + squad)
router.get("/allowed-users", auth, getAllowedUsers);

// GET ALL CONVERSATIONS (sidebar - last message per user)
router.get("/conversations", auth, getConversations);

// SEND
router.post("/send", auth, sendMessage);

// GET MESSAGES WITH A USER
router.get("/:userId", auth, getMessages);

// EDIT MESSAGE
router.put("/:id/edit", auth, editMessage);

// DELETE MESSAGE
router.delete("/:id", auth, deleteMessage);

// MARK AS READ
router.put("/:userId/read", auth, markAsRead);

export default router;