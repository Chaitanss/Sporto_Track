import { useState } from "react";
import useAI from "../../hooks/useAI";
import { aiInjuryRisk } from "../../Services/api";

const riskConfig = {
  High:   { bg: "bg-red-50",    border: "border-red-200",    badge: "bg-red-100 text-red-700",    icon: "🚨", dot: "bg-red-500"    },
  Medium: { bg: "bg-yellow-50", border: "border-yellow-200", badge: "bg-yellow-100 text-yellow-700", icon: "⚠️", dot: "bg-yellow-500" },
  Low:    { bg: "bg-green-50",  border: "border-green-100",  badge: "bg-green-100 text-green-700",  icon: "✅", dot: "bg-green-500"  },
};

const InjuryRiskAI = ({ players }) => {
  const [result, setResult]        = useState(null);
  const { loading, error, callAI } = useAI();

  const handleAnalyse = async () => {
    if (!players || players.length === 0) return;
    const data = await callAI(aiInjuryRisk, players);
    if (data?.players) setResult(data);
  };

  const highRiskCount  = result?.players?.filter((p) => p.riskLevel === "High").length  || 0;
  const medRiskCount   = result?.players?.filter((p) => p.riskLevel === "Medium").length || 0;

  return (
    <div className="bg-white rounded-xl shadow">

      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b">
        <div>
          <h3 className="font-semibold">AI Injury Risk Predictor</h3>
          <p className="text-xs text-gray-400">
            Flags at-risk players before next match
          </p>
        </div>
        <button
          onClick={handleAnalyse}
          disabled={loading || !players?.length}
          className="bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Analysing..." : "🚨 Analyse Risk"}
        </button>
      </div>

      {error && <p className="text-red-500 text-xs p-4">{error}</p>}

      {/* Empty state */}
      {!result && !loading && (
        <div className="p-8 text-center text-gray-400">
          <p className="text-3xl mb-2">🏥</p>
          <p className="text-sm">Click "Analyse Risk" to predict injury risk for all players</p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-10">
          <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin mb-2" />
          <p className="text-xs text-gray-400">Scanning fitness data...</p>
        </div>
      )}

      {/* Results */}
      {result && !loading && (
        <div className="p-4 space-y-4">

          {/* Summary Banner */}
          <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
            <div className="text-center px-3 border-r border-gray-200">
              <p className="text-xl font-bold text-red-600">{highRiskCount}</p>
              <p className="text-xs text-gray-500">High Risk</p>
            </div>
            <div className="text-center px-3 border-r border-gray-200">
              <p className="text-xl font-bold text-yellow-600">{medRiskCount}</p>
              <p className="text-xs text-gray-500">Med Risk</p>
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-600 leading-relaxed">{result.riskSummary}</p>
            </div>
          </div>

          {/* Player Risk Cards */}
          <div className="space-y-2">
            {result.players?.map((player, i) => {
              const cfg = riskConfig[player.riskLevel] || riskConfig["Low"];
              return (
                <div
                  key={i}
                  className={`border rounded-lg p-3 ${cfg.bg} ${cfg.border}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{cfg.icon}</span>
                      <p className="font-semibold text-sm">{player.name}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.badge}`}>
                        {player.riskLevel} Risk
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 mt-1 ml-6">{player.reason}</p>
                  <p className="text-xs text-gray-500 mt-1 ml-6 italic">
                    💊 {player.prevention}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Squad Recommendation */}
          {result.squadRecommendation && (
            <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
              <p className="text-xs font-semibold text-blue-700 mb-0.5">📋 Coach Recommendation</p>
              <p className="text-sm text-blue-800">{result.squadRecommendation}</p>
            </div>
          )}

        </div>
      )}
    </div>
  );
};

export default InjuryRiskAI;