import { useState } from "react";
import useAI from "../../hooks/useAI";
import API from "../../Services/api";

const focusColor = {
  Batting:   { bg: "bg-blue-50",   border: "border-blue-200",   badge: "bg-blue-100 text-blue-700",   dot: "bg-blue-500"   },
  Bowling:   { bg: "bg-purple-50", border: "border-purple-200", badge: "bg-purple-100 text-purple-700", dot: "bg-purple-500" },
  Fielding:  { bg: "bg-orange-50", border: "border-orange-200", badge: "bg-orange-100 text-orange-700", dot: "bg-orange-500" },
  Fitness:   { bg: "bg-green-50",  border: "border-green-200",  badge: "bg-green-100 text-green-700",  dot: "bg-green-500"  },
  Rest:      { bg: "bg-gray-50",   border: "border-gray-200",   badge: "bg-gray-100 text-gray-500",    dot: "bg-gray-400"   },
  Recovery:  { bg: "bg-yellow-50", border: "border-yellow-200", badge: "bg-yellow-100 text-yellow-700", dot: "bg-yellow-500" },
};

const getTheme = (focus) => focusColor[focus] || focusColor["Fitness"];

const WeeklyDrillPlan = ({ playerContext }) => {
  const [plan, setPlan]         = useState(null);
  const [weekGoal, setWeekGoal] = useState("");
  const [activeDay, setActiveDay] = useState(0);
  const { loading, error, callAI } = useAI();

  const handleGenerate = async () => {
    const apiCall = (ctx) => API.post("/ai/weekly-plan", { playerContext: ctx });
    const data = await callAI(apiCall, playerContext);
    if (data?.plan) {
      setPlan(data.plan);
      setWeekGoal(data.weekGoal || "");
      setActiveDay(0);
    }
  };

  return (
    <div className="mt-4">
      {/* ── Generate Button ── */}
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? "Generating 7-day plan..." : "📅 Generate Weekly Plan"}
      </button>

      {error && <p className="text-red-500 text-xs mt-2">{error}</p>}

      {plan && (
        <div className="mt-4 border border-gray-200 rounded-xl overflow-hidden">

          {/* Week Goal Banner */}
          {weekGoal && (
            <div className="bg-green-700 text-white px-4 py-2 text-sm">
              🎯 <span className="font-medium">Week Goal:</span> {weekGoal}
            </div>
          )}

          {/* Day Tabs */}
          <div className="flex overflow-x-auto border-b border-gray-200 bg-white">
            {plan.map((dayObj, i) => {
              const theme = getTheme(dayObj.focus);
              return (
                <button
                  key={i}
                  onClick={() => setActiveDay(i)}
                  className={`flex-shrink-0 px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
                    activeDay === i
                      ? "border-green-600 text-green-700 bg-green-50"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <span className="block">{dayObj.day.slice(0, 3)}</span>
                  <span className={`inline-block mt-0.5 px-1.5 py-0.5 rounded text-xs ${theme.badge}`}>
                    {dayObj.focus}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Active Day Sessions */}
          {plan[activeDay] && (() => {
            const dayObj = plan[activeDay];
            const theme  = getTheme(dayObj.focus);
            return (
              <div className={`p-4 ${theme.bg}`}>
                <div className="flex items-center gap-2 mb-3">
                  <span className={`w-2 h-2 rounded-full ${theme.dot}`} />
                  <h3 className="font-semibold text-sm text-gray-800">
                    {dayObj.day} — {dayObj.focus} Day
                  </h3>
                </div>

                <div className="space-y-3">
                  {dayObj.sessions.map((session, si) => (
                    <div
                      key={si}
                      className={`bg-white border ${theme.border} rounded-lg p-3`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400 font-medium w-14">
                            {session.time}
                          </span>
                          <span className="font-semibold text-sm text-gray-800">
                            {session.drill}
                          </span>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${theme.badge}`}>
                          {session.duration}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 ml-16">
                        {session.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};

export default WeeklyDrillPlan;