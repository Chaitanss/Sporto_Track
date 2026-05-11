import { useState } from "react";
import useAI from "../../hooks/useAI";
import { aiTrainingPlan } from "../../Services/api";

const intensityStyle = {
  High:   { bg: "bg-red-100",    text: "text-red-700"    },
  Medium: { bg: "bg-yellow-100", text: "text-yellow-700" },
  Low:    { bg: "bg-green-100",  text: "text-green-700"  },
};

const TrainingPlanAI = ({ squadContext }) => {
  const [plan, setPlan]            = useState(null);
  const { loading, error, callAI } = useAI();

  const handleGenerate = async () => {
    const data = await callAI(aiTrainingPlan, squadContext);
    if (data?.sessions) setPlan(data);
  };

  return (
    <div>
      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="text-xs border border-green-700 text-green-700 px-3 py-1 rounded-lg hover:bg-green-50 disabled:opacity-60 disabled:cursor-not-allowed transition-colors font-medium"
      >
        {loading ? "Generating..." : "✨ AI Generate Plan"}
      </button>

      {error && <p className="text-red-500 text-xs mt-2">{error}</p>}

      {/* Loading */}
      {loading && (
        <div className="flex items-center gap-2 mt-3">
          <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-gray-400">Building session plan...</p>
        </div>
      )}

      {/* Plan Result */}
      {plan && !loading && (
        <div className="mt-3 border border-gray-200 rounded-xl overflow-hidden">

          {/* Plan Header */}
          <div className="bg-green-700 text-white px-4 py-2 flex justify-between items-center">
            <div>
              <p className="font-semibold text-sm">{plan.sessionTitle}</p>
              <p className="text-xs text-green-200">
                {plan.totalDuration} · Focus: {plan.focusArea}
              </p>
            </div>
          </div>

          {/* Sessions */}
          <div className="divide-y divide-gray-100">
            {plan.sessions?.map((s, i) => {
              const style = intensityStyle[s.intensity] || intensityStyle["Medium"];
              return (
                <div key={i} className="px-4 py-3 flex items-start gap-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 mt-0.5 ${style.bg} ${style.text}`}>
                    {s.intensity}
                  </span>
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <p className="font-medium text-sm">{s.activity}</p>
                      <span className="text-xs text-gray-400">{s.duration}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{s.description}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Coach Tip */}
          {plan.coachTip && (
            <div className="bg-yellow-50 border-t border-yellow-100 px-4 py-2">
              <p className="text-xs text-yellow-800">
                💡 <span className="font-medium">Coach Tip:</span> {plan.coachTip}
              </p>
            </div>
          )}

        </div>
      )}
    </div>
  );
};

export default TrainingPlanAI;