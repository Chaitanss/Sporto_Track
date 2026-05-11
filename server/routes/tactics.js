import express from "express";
import {
  saveTactics,
  getTactics,
  deleteTactics,
  updateTactics,
} from "../controllers/tacticsController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.post("/", protect, saveTactics);
router.get("/", protect, getTactics);
router.delete("/:id", protect, deleteTactics);
router.put("/:id", protect, updateTactics);

export default router;