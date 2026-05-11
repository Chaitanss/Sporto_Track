import express from "express";
import { protect, authorize } from "../middleware/auth.js";
import {
  broadcastMessage,
  pushToCoach,
  sendAnalysisNote,
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  getBroadcastHistory,
} from "../controllers/notificationController.js";

const router = express.Router();

// ===== ANALYST ROUTES =====

// 🔥 Broadcast to coach / players / both
router.post("/broadcast", protect, authorize("analyst"), broadcastMessage);

// 🔥 Get broadcast history (what analyst sent)
router.get("/broadcast-history", protect, authorize("analyst"), getBroadcastHistory);

// 🔥 Push full analytics report to all coaches
router.post("/push-to-coach", protect, authorize("analyst"), pushToCoach);

// 🔥 Send analysis note about a player
router.post("/send-analysis", protect, authorize("analyst"), sendAnalysisNote);

// ===== ALL ROLES =====

// Fetch own notifications inbox
router.get("/", protect, getMyNotifications);

// Mark a single notification as read
router.put("/:notifId/read", protect, markAsRead);

// Mark ALL notifications as read
router.put("/mark-all-read", protect, markAllAsRead);

export default router;