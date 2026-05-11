import express from "express";
import { protect, authorize } from "../middleware/auth.js";
import {
  getScoutPlayers,
  getScoutPlayer,
  createScoutPlayer,
  bulkImportScoutPlayers,
  updateScoutPlayer,
  deleteScoutPlayer,
  recommendPlayer,
  getRecommendedPlayers,
  pushShortlistToCoach,
} from "../controllers/scoutController.js";

const router = express.Router();

// ── GET all scout players (coach + analyst can view)
router.get("/", protect, authorize("coach", "analyst"), getScoutPlayers);

// ── GET recommended players only
router.get("/recommended", protect, authorize("coach", "analyst"), getRecommendedPlayers);

// ── GET single scout player
router.get("/:id", protect, authorize("coach", "analyst"), getScoutPlayer);

// ── CREATE scout player manually
router.post("/", protect, authorize("analyst"), createScoutPlayer);

// ── BULK IMPORT from Excel (analyst parses Excel client-side, sends array)
router.post("/bulk-import", protect, authorize("analyst"), bulkImportScoutPlayers);

// ── UPDATE scout player
router.put("/:id", protect, authorize("analyst"), updateScoutPlayer);

// ── DELETE scout player
router.delete("/:id", protect, authorize("analyst"), deleteScoutPlayer);

// ── RECOMMEND player for main team + notify coaches
router.put("/:id/recommend", protect, authorize("analyst"), recommendPlayer);

// ── PUSH full shortlist to coach as notification
router.post("/push-shortlist", protect, authorize("analyst"), pushShortlistToCoach);

export default router;