import React, { useEffect, useState } from "react";
import API from "../../Services/api";
import FitnessReadinessCard from "../../components/AI/FitnessReadinessCard";

// ── playerContext for AI ──────────────────────────────────────────
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

const MyFitness = () => {
  const [fitnessVal, setFitnessVal]   = useState(80);
  const [history, setHistory]         = useState([]);
  const [injury, setInjury]           = useState("None");
  const [injuryOther, setInjuryOther] = useState("");
  const [severity, setSeverity]       = useState("None");
  const [description, setDescription] = useState("");
  const [coachFeedback, setCoachFeedback] = useState("");
  const [lastReported, setLastReported]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast]       = useState({ msg: "", type: "" });

  const playerContext = getPlayerContext();

  // ── Fetch existing record on mount ─────────────────────────
  useEffect(() => {
    const fetchMyFitness = async () => {
      try {
        const res = await API.get("/fitness/my");
        const d   = res.data;
        setFitnessVal(d.fitness || 80);
        setHistory(d.history  || []);
        setInjury(d.injury    || "None");
        setInjuryOther(d.injuryOther || "");
        setSeverity(d.severity || "None");
        setDescription(d.description || "");
        setCoachFeedback(d.coachFeedback || "");
        setLastReported(d.lastReported || null);
      } catch {
        // No record yet — defaults are fine
      } finally {
        setLoading(false);
      }
    };
    fetchMyFitness();
  }, []);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "" }), 3000);
  };

  // ── Fitness label & color ───────────────────────────────────
  const getFitnessLabel = (v) => {
    if (v >= 85) return { label: "Excellent", color: "text-green-600" };
    if (v >= 70) return { label: "Good",      color: "text-green-500" };
    if (v >= 50) return { label: "Moderate",  color: "text-yellow-500" };
    return              { label: "Low",        color: "text-red-500"   };
  };
  const { label: fitnessLabel, color: fitnessColor } = getFitnessLabel(fitnessVal);

  const getBarColor = (v) => {
    if (v >= 85) return "bg-green-500";
    if (v >= 70) return "bg-green-400";
    if (v >= 50) return "bg-yellow-500";
    return "bg-red-500";
  };

  // ── Submit daily report ─────────────────────────────────────
  const handleReport = async () => {
    setSubmitting(true);
    try {
      await API.post("/fitness", {
        fitness:      fitnessVal,
        injury:       injury,
        injuryOther:  injuryOther,
        severity:     injury === "None" ? "None" : severity,
        description:  description,
      });
      showToast("✅ Report sent to coach!");
      setLastReported(new Date().toISOString());
    } catch (err) {
      showToast(err.response?.data?.message || "❌ Error sending report", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Injury notify (same endpoint, just flags injury) ───────
  const handleNotifyCoach = async () => {
    if (injury === "None") {
      showToast("Please select an injury type first", "error");
      return;
    }
    setSubmitting(true);
    try {
      await API.post("/fitness", {
        fitness:     fitnessVal,
        injury:      injury,
        injuryOther: injuryOther,
        severity:    severity,
        description: description,
      });
      showToast("🚨 Injury reported to coach!");
      setLastReported(new Date().toISOString());
    } catch (err) {
      showToast(err.response?.data?.message || "❌ Error", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const matchReadiness =
    fitnessVal >= 85 ? "Ready" :
    fitnessVal >= 60 ? "Under Review" : "Not Ready";

  const matchReadinessColor =
    fitnessVal >= 85 ? "text-green-600" :
    fitnessVal >= 60 ? "text-yellow-500" : "text-red-500";

  const displayHistory = history.length > 0
    ? [...history, fitnessVal].slice(-6)
    : [fitnessVal];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* TOAST */}
      {toast.msg && (
        <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium transition-all
          ${toast.type === "error" ? "bg-red-500" : "bg-green-600"}`}>
          {toast.msg}
        </div>
      )}

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">My Fitness</h1>
        {lastReported && (
          <span className="text-xs text-gray-400">
            Last reported: {new Date(lastReported).toLocaleDateString("en-IN", {
              day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
            })}
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4">

        {/* ── LEFT SIDE — unchanged ──────────────────────────────────────── */}
        <div className="col-span-2 space-y-4">

          {/* SELF REPORT CARD */}
          <div className="bg-white p-6 rounded-xl shadow">
            <div className="flex justify-between items-start mb-1">
              <h2 className="font-semibold text-base">Self-Report Fitness</h2>
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                Updated daily • Visible to Coach
              </span>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl mt-3 text-center border border-green-100">
              <p className="text-sm text-gray-500 mb-3">How are you feeling today?</p>

              {/* Big fitness number */}
              <p className={`text-5xl font-extrabold mb-1 ${fitnessColor}`}>
                {fitnessVal}%
              </p>
              <p className={`text-sm font-semibold mb-4 ${fitnessColor}`}>
                {fitnessLabel}
              </p>

              {/* 🔥 WORKING SLIDER */}
              <input
                type="range"
                min="0"
                max="100"
                value={fitnessVal}
                onChange={(e) => setFitnessVal(Number(e.target.value))}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-green-600 mb-2"
              />

              {/* Color bar */}
              <div className="mt-2 bg-gray-200 h-3 rounded-full overflow-hidden">
                <div
                  className={`h-3 rounded-full transition-all duration-300 ${getBarColor(fitnessVal)}`}
                  style={{ width: `${fitnessVal}%` }}
                />
              </div>

              <div className="flex justify-between text-xs mt-2 text-gray-400">
                <span>Low</span>
                <span>Moderate</span>
                <span>Peak</span>
              </div>
            </div>

            <button
              onClick={handleReport}
              disabled={submitting}
              className={`w-full mt-4 py-3 rounded-xl text-white font-semibold transition
                ${submitting
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-green-700 hover:bg-green-800 active:scale-95"}`}
            >
              {submitting ? "Sending..." : "Report to Coach"}
            </button>
          </div>

          {/* FITNESS HISTORY */}
          <div className="bg-white p-5 rounded-xl shadow">
            <h2 className="font-semibold mb-4">Fitness History</h2>
            <div className="flex gap-3 items-end">
              {displayHistory.map((val, i) => (
                <div key={i} className="flex-1 text-center">
                  <div
                    className={`rounded-lg transition-all ${
                      val < 60 ? "bg-red-500" :
                      val < 85 ? "bg-orange-500" : "bg-green-500"
                    }`}
                    style={{ height: `${Math.max(val * 0.6, 20)}px` }}
                  />
                  <p className="text-xs mt-1 text-gray-500">{val}%</p>
                  {i === displayHistory.length - 1 && (
                    <p className="text-xs text-green-600 font-bold">Today</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* COACH FEEDBACK (if any) */}
          {coachFeedback && (
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl">
              <h2 className="font-semibold text-blue-800 mb-1 text-sm">
                💬 Coach's Feedback
              </h2>
              <p className="text-sm text-blue-700">{coachFeedback}</p>
            </div>
          )}

        </div>

        {/* ── RIGHT SIDE ─────────────────────────────────────── */}
        <div className="space-y-4">

          {/* ✅ AI FITNESS READINESS CARD (ADDED) */}
          <FitnessReadinessCard
            playerContext={{ ...playerContext, fitness: fitnessVal }}
          />

          {/* REPORT INJURY — unchanged */}
          <div className="bg-white p-5 rounded-xl shadow">
            <h2 className="font-semibold mb-3">Report Injury / Issue</h2>
            <p className="text-xs text-gray-400 mb-3">Optional — only fill if you have an injury</p>

            {/* Injury Type */}
            <select
              value={injury}
              onChange={(e) => setInjury(e.target.value)}
              className="w-full border rounded-lg p-2 mb-2 text-sm"
            >
              <option value="None">None</option>
              <option value="Hamstring">Hamstring</option>
              <option value="Shoulder">Shoulder</option>
              <option value="Knee">Knee</option>
              <option value="Back">Back</option>
              <option value="Ankle">Ankle</option>
              <option value="Other">Other</option>
            </select>

            {/* 🔥 "Other" text input — shows only when Other is selected */}
            {injury === "Other" && (
              <input
                type="text"
                placeholder="Specify injury..."
                value={injuryOther}
                onChange={(e) => setInjuryOther(e.target.value)}
                className="w-full border rounded-lg p-2 mb-2 text-sm"
              />
            )}

            {/* Severity — hidden when no injury */}
            {injury !== "None" && (
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                className="w-full border rounded-lg p-2 mb-2 text-sm"
              >
                <option value="Mild (can train)">Mild (can train)</option>
                <option value="Moderate">Moderate</option>
                <option value="Severe">Severe</option>
              </select>
            )}

            <textarea
              placeholder="Describe how it feels... (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full border rounded-lg p-2 mb-3 text-sm resize-none"
            />

            <button
              onClick={handleNotifyCoach}
              disabled={submitting || injury === "None"}
              className={`w-full border py-2 rounded-xl text-sm font-semibold transition
                ${injury === "None"
                  ? "border-gray-300 text-gray-400 cursor-not-allowed"
                  : "border-red-400 text-red-500 hover:bg-red-50 active:scale-95"}`}
            >
              🚨 Notify Coach Now
            </button>
          </div>

          {/* FITNESS STATUS — unchanged */}
          <div className="bg-white p-5 rounded-xl shadow">
            <h2 className="font-semibold mb-3">Fitness Status</h2>

            <div className="text-sm space-y-3">

              <div className="flex justify-between items-center">
                <span className="text-gray-500">Physical Fitness</span>
                <span className={`font-semibold ${fitnessColor}`}>
                  {fitnessVal}% • {fitnessLabel}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-500">Match Readiness</span>
                <span className={`font-semibold ${matchReadinessColor}`}>
                  {matchReadiness}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-500">Coach's Feedback</span>
                <span className="font-semibold text-green-600">
                  {coachFeedback || "Awaiting feedback"}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-500">Injuries</span>
                <span className={`font-semibold ${
                  injury === "None" ? "text-green-600" : "text-red-500"
                }`}>
                  {injury === "None"
                    ? "None"
                    : injury === "Other"
                    ? injuryOther || "Other"
                    : injury}
                </span>
              </div>

              {injury !== "None" && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Severity</span>
                  <span className={`font-semibold ${
                    severity === "Severe" ? "text-red-600" :
                    severity === "Moderate" ? "text-yellow-600" :
                    "text-green-600"
                  }`}>
                    {severity}
                  </span>
                </div>
              )}

            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default MyFitness;