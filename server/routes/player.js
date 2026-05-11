import express from "express";
import { protect, authorize } from "../middleware/auth.js";
import {
  getPlayers,
  getSquadForAnalyst,
  getRegisteredPlayers,
  addPlayerToSquad,
  updatePlayer,
  removePlayerFromSquad,
  getAllPlayers,
} from "../controllers/playerController.js";

const router = express.Router();

// 🔥 Analyst uses this — returns ALL players assigned to any coach
// MUST be before /:id routes to avoid route conflict
router.get("/squad", protect, authorize("analyst"), getSquadForAnalyst);

// 🔥 Coach uses this — see all registered players to add to squad
// MUST be before /:id routes
router.get("/registered", protect, authorize("coach"), getRegisteredPlayers);

// For drills/stats dropdowns
// MUST be before /:id routes
router.get("/all", protect, getAllPlayers);

// Get this coach's own squad
router.get("/", protect, authorize("coach"), getPlayers);

// Add a registered player to squad (coach only)
router.post("/", protect, authorize("coach"), addPlayerToSquad);

// Update player details in squad (coach only)
router.put("/:id", protect, authorize("coach"), updatePlayer);

// Remove player from squad (coach only)
router.delete("/:id", protect, authorize("coach"), removePlayerFromSquad);

export default router;