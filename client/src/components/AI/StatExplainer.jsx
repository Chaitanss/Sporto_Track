import { useState } from "react";
import useAI from "../../hooks/useAI";
import API from "../../Services/api";

const StatExplainer = ({ stats, playerContext }) => {
  const [selected, setSelected]     = useState(null);
  const [explanation, setExplanation] = useState("");
  const { loading, error, callAI }  = useAI();

  const statItems = [
    { label: "Runs per Match",      value: stats.runsPerMatch       },
    { label: "Batting Accuracy",    value: `${stats.battingAccuracy}%` },
    { label: "Bowling Accuracy",    value: `${stats.bowlingAccuracy}%` },
    { label: "Strike Rate",         value: `${stats.strikeRate}%`   },
    { label: "Fielding Efficiency", value: `${stats.fieldingEfficiency}%` },
    { label: "Fitness Level",       value: `${stats.fitnessLevel}%` },
  ];

  const handleExplain = async (item) => {
    if (selected?.label === item.label && explanation) return;
    setSelected(item);
    setExplanation("");

    const apiCall = () =>
      API.post("/ai/explain-stat", {
        statName: item.label,
        statValue: item.value,
        playerContext,
      });

    const data = await callAI(apiCall);
    if (data?.explanation) setExplanation(data.explanation);
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow">
      <h2 className="font-semibold mb-1">Stat Explainer</h2>
      <p className="text-xs text-gray-400 mb-3">
        Tap any stat below to get an AI explanation
      </p>

      {/* Stat Pills */}
      <div className="flex flex-wrap gap-2 mb-3">
        {statItems.map((item, i) => (
          <button
            key={i}
            onClick={() => handleExplain(item)}
            disabled={loading}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              selected?.label === item.label
                ? "bg-green-700 text-white border-green-700"
                : "bg-gray-50 text-gray-700 border-gray-200 hover:border-green-400 hover:bg-green-50"
            } disabled:opacity-60`}
          >
            {item.label}: <span className="font-bold">{item.value}</span>
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center gap-2 py-3">
          <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-gray-400">Explaining {selected?.label}...</p>
        </div>
      )}

      {/* Error */}
      {error && <p className="text-red-500 text-xs">{error}</p>}

      {/* Explanation Card */}
      {explanation && selected && !loading && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-bold text-green-700">{selected.label}</span>
            <span className="text-xs bg-green-700 text-white px-1.5 py-0.5 rounded">
              {selected.value}
            </span>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed">{explanation}</p>
        </div>
      )}

      {/* Empty state */}
      {!selected && !loading && (
        <div className="text-center py-3">
          <p className="text-xs text-gray-400">
            👆 Tap a stat above to understand what it means
          </p>
        </div>
      )}
    </div>
  );
};

export default StatExplainer;