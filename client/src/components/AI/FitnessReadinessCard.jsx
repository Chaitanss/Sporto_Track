import { useState } from "react";
import useAI from "../../hooks/useAI";
import API from "../../Services/api";

const statusConfig = {
  "Match Ready": {
    bg: "bg-green-50",
    border: "border-green-200",
    scoreColor: "text-green-700",
    badgeBg: "bg-green-100",
    badgeText: "text-green-700",
    icon: "✅",
    ringColor: "border-green-500",
  },
  "Needs Rest": {
    bg: "bg-yellow-50",
    border: "border-yellow-200",
    scoreColor: "text-yellow-600",
    badgeBg: "bg-yellow-100",
    badgeText: "text-yellow-700",
    icon: "⚠️",
    ringColor: "border-yellow-500",
  },
  "At Risk": {
    bg: "bg-red-50",
    border: "border-red-200",
    scoreColor: "text-red-600",
    badgeBg: "bg-red-100",
    badgeText: "text-red-700",
    icon: "🚨",
    ringColor: "border-red-500",
  },
};

const FitnessReadinessCard = ({ playerContext }) => {
  const [prediction, setPrediction] = useState(null);
  const { loading, error, callAI }  = useAI();

  const handlePredict = async () => {
    const apiCall = (ctx) => API.post("/ai/fitness", { playerContext: ctx });
    const data = await callAI(apiCall, playerContext);
    if (data?.prediction) setPrediction(data.prediction);
  };

  const cfg = prediction
    ? statusConfig[prediction.status] || statusConfig["Match Ready"]
    : null;

  return (
    <div className="bg-white p-5 rounded-xl shadow">

      {/* Header */}
      <div className="flex justify-between items-center mb-3">
        <div>
          <h2 className="font-semibold text-base">AI Match Readiness</h2>
          <p className="text-xs text-gray-400">Predict your fitness for next match</p>
        </div>
        <button
          onClick={handlePredict}
          disabled={loading}
          className="bg-green-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-green-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Analysing..." : "⚡ Predict Now"}
        </button>
      </div>

      {error && <p className="text-red-500 text-xs mb-2">{error}</p>}

      {/* Empty state */}
      {!prediction && !loading && (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <div className="w-16 h-16 rounded-full border-4 border-gray-200 flex items-center justify-center mb-3">
            <span className="text-2xl">⚡</span>
          </div>
          <p className="text-sm text-gray-400">
            Tap "Predict Now" to get your AI match readiness score
          </p>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-6">
          <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mb-2" />
          <p className="text-xs text-gray-400">Analysing your fitness data...</p>
        </div>
      )}

      {/* Result */}
      {prediction && cfg && (
        <div className={`border rounded-xl p-4 ${cfg.bg} ${cfg.border}`}>

          {/* Score Row */}
          <div className="flex items-center gap-4 mb-3">
            <div className={`w-16 h-16 rounded-full border-4 ${cfg.ringColor} flex items-center justify-center flex-shrink-0`}>
              <span className={`text-xl font-extrabold ${cfg.scoreColor}`}>
                {prediction.readinessScore}%
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{cfg.icon}</span>
                <span className={`text-sm font-bold ${cfg.scoreColor}`}>
                  {prediction.status}
                </span>
              </div>
              <p className="text-xs text-gray-500">{prediction.summary}</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-3">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Readiness</span>
              <span>{prediction.readinessScore}%</span>
            </div>
            <div className="bg-gray-200 h-2 rounded-full">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${
                  prediction.status === "Match Ready"
                    ? "bg-green-500"
                    : prediction.status === "Needs Rest"
                    ? "bg-yellow-500"
                    : "bg-red-500"
                }`}
                style={{ width: `${prediction.readinessScore}%` }}
              />
            </div>
          </div>

          {/* Tips */}
          {prediction.tips?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-1.5">AI Tips:</p>
              <ul className="space-y-1">
                {prediction.tips.map((tip, i) => (
                  <li key={i} className="flex gap-2 text-xs text-gray-600">
                    <span className="text-green-500 flex-shrink-0">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

        </div>
      )}
    </div>
  );
};

export default FitnessReadinessCard;