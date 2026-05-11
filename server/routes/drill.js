import express from "express";
import { protect } from "../middleware/auth.js";
import {
  addDrill,
  shareDrill,
  getAllCoaches,
  getAllPlayers,
  getDrillsByCoach,
  getPlayerDrills,
  updateDrill,
  deleteDrill,
} from "../controllers/drillController.js";

const router = express.Router();

// 🔥 Named routes MUST come before /:id
router.get("/coaches", protect, getAllCoaches);
router.get("/players", protect, getAllPlayers);
router.get("/player", protect, getPlayerDrills);
router.get("/coach/:coachId", protect, getDrillsByCoach);

router.post("/", protect, addDrill);
router.put("/share/:id", protect, shareDrill);
router.put("/:id", protect, updateDrill);
router.delete("/:id", protect, deleteDrill);

export default router;