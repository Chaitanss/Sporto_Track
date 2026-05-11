import express from "express";
import { registerUser, loginUser, updateProfile } from "../controllers/authController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);

// 🔥 NEW ROUTE
router.put("/update-profile", protect, updateProfile);

export default router;