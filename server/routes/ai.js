import express from "express";
import {
  playerChat,
  suggestDrill,
  predictFitness,
  weeklyDrillPlan,
  explainStat,
  coachChat,
  teamSelectionAI,
  trainingPlanAI,
  noteFormatterAI,
  injuryRiskAI,
  analystChat,
  matchReportWriter,
  playerComparisonAI,
  scoutReportAI,
} from "../controllers/aiController.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// ── Player AI ──────────────────────────────────────────────────────
router.post("/chat",         auth, playerChat);
router.post("/drill",        auth, suggestDrill);
router.post("/fitness",      auth, predictFitness);
router.post("/weekly-plan",  auth, weeklyDrillPlan);
router.post("/explain-stat", auth, explainStat);

// ── Coach AI ───────────────────────────────────────────────────────
router.post("/coach-chat",      auth, coachChat);
router.post("/team-selection",  auth, teamSelectionAI);
router.post("/training-plan",   auth, trainingPlanAI);
router.post("/format-note",     auth, noteFormatterAI);
router.post("/injury-risk",     auth, injuryRiskAI);

// ── Analyst AI ─────────────────────────────────────────────────────
router.post("/analyst-chat",        auth, analystChat);
router.post("/match-report-writer", auth, matchReportWriter);
router.post("/player-comparison",   auth, playerComparisonAI);
router.post("/scout-report",        auth, scoutReportAI);

export default router;