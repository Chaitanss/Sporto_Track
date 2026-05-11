import express from "express";
import { protect } from "../middleware/auth.js";
import {
  addEvent,
  getEvents,
  deleteEvent,
  updateEvent,
  getAllCoachesForSchedule,
  getEventsByCoach,
} from "../controllers/eventController.js";

const router = express.Router();

// 🔥 Named routes BEFORE /:id
router.get("/coaches", protect, getAllCoachesForSchedule);     // 🔥 all coaches for player dropdown
router.get("/coach/:coachId", protect, getEventsByCoach);     // 🔥 events by coach

router.post("/", protect, addEvent);
router.get("/", protect, getEvents);
router.delete("/:id", protect, deleteEvent);
router.put("/:id", protect, updateEvent);

export default router;