import { useEffect, useState } from "react";
import { getAllCoaches, getDrillsByCoach } from "../../Services/api";
import WeeklyDrillPlan from "../../components/AI/WeeklyDrillPlan";

// ── playerContext for AI — pulled from localStorage like your other pages ──
const getPlayerContext = () => {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return {
      name:        user.name        || "Player",
      position:    user.position    || "Unknown",
      runs:        user.runs        || 0,
      wickets:     user.wickets     || 0,
      fitness:     user.fitness     || 80,
      coachRating: user.coachRating || 0,
      matches:     user.matches     || 0,
      strikeRate:  user.strikeRate  || 0,
    };
  } catch {
    return { name: "Player", fitness: 80, runs: 0, wickets: 0, matches: 0, strikeRate: 0, coachRating: 0 };
  }
};

const MyDrills = () => {
  const [coaches, setCoaches] = useState([]);
  const [selectedCoach, setSelectedCoach] = useState(null);
  const [drills, setDrills] = useState([]);
  const [loadingCoaches, setLoadingCoaches] = useState(true);
  const [loadingDrills, setLoadingDrills] = useState(false);

  const playerContext = getPlayerContext();

  // 🔥 Load all coaches on mount using API instance (has token interceptor)
  useEffect(() => {
    const fetchCoaches = async () => {
      setLoadingCoaches(true);
      const data = await getAllCoaches();
      setCoaches(data);
      setLoadingCoaches(false);
    };
    fetchCoaches();
  }, []);

  // 🔥 When player picks a coach from dropdown
  const handleSelectCoach = async (e) => {
    const coachId = e.target.value;
    if (!coachId) {
      setSelectedCoach(null);
      setDrills([]);
      return;
    }
    const coach = coaches.find((c) => c._id === coachId);
    setSelectedCoach(coach);
    setLoadingDrills(true);
    const data = await getDrillsByCoach(coachId);
    const formatted = data.map((d) => ({ ...d, done: false }));
    setDrills(formatted);
    setLoadingDrills(false);
  };

  const toggleDone = (id) => {
    setDrills(drills.map((d) => (d._id === id ? { ...d, done: !d.done } : d)));
  };

  const totalDuration = drills.reduce((sum, d) => sum + d.duration, 0);

  const getInitials = (name) => {
    if (!name) return "?";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">My Drills</h1>

      <div className="grid grid-cols-3 gap-4">

        {/* LEFT SIDE */}
        <div className="col-span-2 space-y-4">

          {/* 🔥 COACH DROPDOWN */}
          <div className="bg-white rounded-xl shadow p-4">
            <h2 className="font-semibold mb-3 text-sm">Select Your Coach</h2>

            {loadingCoaches ? (
              <p className="text-sm text-gray-400">Loading coaches...</p>
            ) : coaches.length === 0 ? (
              <p className="text-sm text-gray-400">No coaches registered yet.</p>
            ) : (
              <select
                onChange={handleSelectCoach}
                defaultValue=""
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500"
              >
                <option value="">-- Select a Coach --</option>
                {coaches.map((coach) => (
                  <option key={coach._id} value={coach._id}>
                    {coach.name} ({coach.email})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* 🔥 DRILLS LIST */}
          <div className="bg-white rounded-xl shadow">

            <div className="p-4 border-b flex justify-between items-center">
              <div>
                <h2 className="font-semibold">Today's Practice Plan</h2>
                <p className="text-xs text-gray-500">
                  {selectedCoach
                    ? `Coach: ${selectedCoach.name} · ${totalDuration} min`
                    : "Net Session • 0 min"}
                </p>
              </div>
              <p className="text-sm text-green-600">
                {drills.filter((d) => d.done).length} / {drills.length} done
              </p>
            </div>

            <div className="divide-y">
              {!selectedCoach ? (
                <div className="p-6 text-center text-gray-400 text-sm">
                  👆 Select a coach from the dropdown above to see drills
                </div>
              ) : loadingDrills ? (
                <div className="p-6 text-center text-gray-400 text-sm">
                  Loading drills...
                </div>
              ) : drills.length === 0 ? (
                <div className="p-6 text-center text-gray-400 text-sm">
                  No drills added by this coach yet.
                </div>
              ) : (
                drills.map((d, index) => (
                  <div
                    key={d._id}
                    className="p-4 flex justify-between items-center hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-green-100 text-green-700 w-7 h-7 flex items-center justify-center rounded text-sm font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className={`font-medium ${d.done ? "line-through text-gray-400" : ""}`}>
                          {d.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {d.type} • {d.duration} min
                        </p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={d.done}
                      onChange={() => toggleDone(d._id)}
                      className="w-4 h-4 accent-green-600"
                    />
                  </div>
                ))
              )}
            </div>

            <div className="p-4 text-xs text-gray-500">
              ✔ Complete all drills and coach will be notified
            </div>
          </div>

          {/* ── ✅ AI WEEKLY DRILL PLAN (ADDED) ── */}
          <div className="bg-white rounded-xl shadow p-4">
            <h2 className="font-semibold mb-1">AI Weekly Drill Plan</h2>
            <p className="text-xs text-gray-400 mb-1">
              Get a personalized 7-day training plan with 2 sessions per day
            </p>
            <WeeklyDrillPlan playerContext={playerContext} />
          </div>

        </div>

        {/* RIGHT SIDE — unchanged */}
        <div className="space-y-4">

          <div className="bg-white p-4 rounded-xl shadow">
            <h2 className="font-semibold mb-2">Session Summary</h2>
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span>Total Duration</span>
                <span className="font-semibold text-green-700">{totalDuration} min</span>
              </div>
              <div className="flex justify-between">
                <span>Total Drills</span>
                <span>{drills.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Completed</span>
                <span className="text-green-600">{drills.filter((d) => d.done).length}</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow">
            <h2 className="font-semibold mb-2">Coach's Notes</h2>
            <div className="bg-yellow-100 p-3 rounded text-sm">
              {selectedCoach
                ? "Focus on your footwork while batting. Keep your head steady and watch the ball closely 🏏"
                : "Select a coach to see their notes."}
            </div>
          </div>

          {/* 🔥 Selected Coach Card */}
          {selectedCoach && (
            <div className="bg-white p-4 rounded-xl shadow">
              <h2 className="font-semibold mb-3 text-sm">Your Coach</h2>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold text-sm">
                  {getInitials(selectedCoach.name)}
                </div>
                <div>
                  <p className="font-medium text-sm">{selectedCoach.name}</p>
                  <p className="text-xs text-gray-400">{selectedCoach.email}</p>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default MyDrills;