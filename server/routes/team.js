import express from "express";
import {
  createTeam,
  addPlayer,
  getTeam,
  getTeamAnalytics,
  getClubName,
  updateClubName,
} from "../controllers/teamController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// ── Club name (all roles can read, only coach can update) ──
router.get("/club-name", protect, getClubName);
router.patch("/club-name", protect, updateClubName);

// ── Existing routes (unchanged) ──
router.post("/create", protect, createTeam);
router.post("/add-player", protect, addPlayer);
router.get("/analytics", protect, getTeamAnalytics);

// ── Must be last (has :coachId param) ──
router.get("/:coachId", protect, getTeam);

export default router;