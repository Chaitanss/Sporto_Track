import { useState } from "react";
import useAI from "../../hooks/useAI";
import { aiDrillSuggest } from "../../Services/api";

const DrillSuggestion = ({ playerContext }) => {
  const [drill, setDrill] = useState(null);
  const { loading, error, callAI } = useAI();

  const handleGenerate = async () => {
    const data = await callAI(aiDrillSuggest, playerContext);
    if (data?.drill) setDrill(data.drill);
  };

  return (
    <div className="mt-4">
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? "Generating drill..." : "✨ Suggest Today's Drill"}
      </button>

      {error && (
        <p className="text-red-500 text-xs mt-2">{error}</p>
      )}

      {drill && (
        <div className="mt-3 p-4 bg-green-50 border border-green-200 rounded-xl">
          <p className="font-semibold text-green-800 text-sm">{drill.drillName}</p>
          <p className="text-xs text-gray-500 mt-1 mb-2">
            {drill.duration} · Focus: {drill.focus}
          </p>
          <p className="text-sm text-gray-700 mb-2">{drill.instructions}</p>
          <p className="text-xs text-green-600 italic">{drill.reason}</p>
        </div>
      )}
    </div>
  );
};

export default DrillSuggestion;