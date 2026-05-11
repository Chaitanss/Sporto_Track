import Event from "../models/Event.js";
import User from "../models/User.js";

// ✅ ADD EVENT
export const addEvent = async (req, res) => {
  try {
    console.log("BODY:", req.body);
    console.log("USER:", req.user);

    const userId = req.user?.id || req.user?._id;

    if (!userId) {
      return res.status(401).json({ message: "User not found ❌" });
    }

    const event = await Event.create({
      title: req.body.title,
      details: req.body.details,
      type: req.body.type,
      date: new Date(req.body.date),
      coach: userId,
    });

    res.status(201).json(event);
  } catch (err) {
    console.log("ADD EVENT ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

// ✅ GET EVENTS (coach sees own events)
export const getEvents = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const events = await Event.find({ coach: userId }).sort({ date: 1 });
    res.json(events);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });
  }
};

// 🔥 GET ALL COACHES (for player dropdown)
export const getAllCoachesForSchedule = async (req, res) => {
  try {
    const coaches = await User.find({ role: "coach" }).select("_id name email");
    console.log("🔥 COACHES FOR SCHEDULE:", coaches);
    res.json(coaches);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 🔥 GET EVENTS BY COACH ID (player selects coach)
export const getEventsByCoach = async (req, res) => {
  try {
    const { coachId } = req.params;
    console.log("🔥 FETCHING EVENTS FOR COACH:", coachId);

    const events = await Event.find({ coach: coachId })
      .populate("coach", "name email") // 🔥 attach coach name
      .sort({ date: 1 });

    console.log("🔥 EVENTS FOUND:", events);
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ DELETE
export const deleteEvent = async (req, res) => {
  try {
    await Event.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ UPDATE
export const updateEvent = async (req, res) => {
  try {
    const updated = await Event.findByIdAndUpdate(
      req.params.id,
      { ...req.body, date: new Date(req.body.date) },
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};