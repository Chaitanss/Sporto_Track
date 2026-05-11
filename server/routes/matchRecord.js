import express from "express";
import { protect, authorize } from "../middleware/auth.js";
import {
  getMatchRecords,
  getMatchRecord,
  createMatchRecord,
  updateMatchRecord,
  deleteMatchRecord,
} from "../controllers/matchRecordController.js";

const router = express.Router();

// Both coach and analyst can GET all records
router.get("/", protect, authorize("coach", "analyst"), getMatchRecords);

// Get single record
router.get("/:id", protect, authorize("coach", "analyst"), getMatchRecord);

// Both coach and analyst can CREATE
router.post("/", protect, authorize("coach", "analyst"), createMatchRecord);

// Update — only creator
router.put("/:id", protect, authorize("coach", "analyst"), updateMatchRecord);

// Delete — only creator
router.delete("/:id", protect, authorize("coach", "analyst"), deleteMatchRecord);

export default router;