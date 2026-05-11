import express from "express";
import { protect, authorize } from "../middleware/auth.js";
import {
  addOrUpdateFitness,
  getMyFitness,
  getFitnessReports,
  getFitnessSummary,
  addCoachFeedback,
} from "../controllers/fitnessController.js";

const router = express.Router();

// 🔥 Player routes — must be before /:id
router.get("/my",  protect, authorize("player"), getMyFitness);
router.post("/",   protect, authorize("player"), addOrUpdateFitness);

// Coach routes
router.get("/",         protect, authorize("coach"), getFitnessReports);
router.get("/summary",  protect, authorize("coach"), getFitnessSummary);
router.put("/:id/feedback", protect, authorize("coach"), addCoachFeedback);

export default router;