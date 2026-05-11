import express from "express";
import User from "../models/User.js";

const router = express.Router();

// GET ALL USERS
router.get("/", async (req, res) => {
  try {
    const users = await User.find().select(
      "_id name role isOnline lastSeen"
    );

    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;