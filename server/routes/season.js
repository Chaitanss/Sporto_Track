import express from "express";
import { protect, authorize } from "../middleware/auth.js";
import {
  addSeasonPerformance,
  getSeasonPerformance,
  getSeasonPerformanceForAnalyst,
  getMySeasonStats,
  updateSeasonPerformance,
  deleteSeasonPerformance,
  getSeasonSummary,
} from "../controllers/seasonController.js";

const router = express.Router();

// ── MUST be before /:id routes ──

// 🔥 Analyst fetches ALL stats (for PlayerAnalysis + TeamAnalytics pages)
// GET /api/season/analyst
router.get("/analyst", protect, authorize("analyst"), getSeasonPerformanceForAnalyst);

// 🔥 Player fetches their OWN stats
// GET /api/season/my
router.get("/my", protect, authorize("player"), getMySeasonStats);

// Summary for coach dashboard
// GET /api/season/summary
router.get("/summary", protect, authorize("coach"), getSeasonSummary);

// ── Coach CRUD routes ──
router.get("/", protect, authorize("coach"), getSeasonPerformance);
router.post("/", protect, authorize("coach"), addSeasonPerformance);
router.put("/:id", protect, authorize("coach"), updateSeasonPerformance);
router.delete("/:id", protect, authorize("coach"), deleteSeasonPerformance);

export default router;