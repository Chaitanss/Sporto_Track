import { useState } from "react";
import useAI from "../../hooks/useAI";
import { aiFitnessPredict } from "../../Services/api";

const statusStyle = {
  "Match Ready": "text-green-700 bg-green-50 border-green-200",
  "Needs Rest":  "text-yellow-700 bg-yellow-50 border-yellow-200",
  "At Risk":     "text-red-700 bg-red-50 border-red-200",
};

const scoreColor = {
  "Match Ready": "text-green-700",
  "Needs Rest":  "text-yellow-600",
  "At Risk":     "text-red-600",
};

const FitnessPredictor = ({ playerContext }) => {
  const [prediction, setPrediction] = useState(null);
  const { loading, error, callAI } = useAI();

  const handlePredict = async () => {
    const data = await callAI(aiFitnessPredict, playerContext);
    if (data?.prediction) setPrediction(data.prediction);
  };

  return (
    <div className="mt-4">
      <button
        onClick={handlePredict}
        disabled={loading}
        className="bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? "Predicting..." : "⚡ Predict Match Readiness"}
      </button>

      {error && (
        <p className="text-red-500 text-xs mt-2">{error}</p>
      )}

      {prediction && (
        <div className={`mt-3 p-4 border rounded-xl ${statusStyle[prediction.status] || statusStyle["Match Ready"]}`}>

          {/* Score + Status */}
          <div className="flex items-center gap-3 mb-2">
            <span className={`text-3xl font-bold ${scoreColor[prediction.status] || "text-green-700"}`}>
              {prediction.readinessScore}%
            </span>
            <div>
              <p className="font-semibold text-sm">{prediction.status}</p>
              <p className="text-xs opacity-70">Match Readiness</p>
            </div>
          </div>

          {/* Summary */}
          <p className="text-sm mb-2">{prediction.summary}</p>

          {/* Tips */}
          <ul className="space-y-1">
            {prediction.tips?.map((tip, i) => (
              <li key={i} className="text-xs flex gap-2">
                <span>•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>

        </div>
      )}
    </div>
  );
};

export default FitnessPredictor;