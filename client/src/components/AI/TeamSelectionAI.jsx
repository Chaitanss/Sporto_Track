import { useState } from "react";
import useAI from "../../hooks/useAI";
import { aiTeamSelection } from "../../Services/api";

const riskBadge = {
  High:   "bg-red-100 text-red-700",
  Medium: "bg-yellow-100 text-yellow-700",
  Low:    "bg-green-100 text-green-700",
};

const TeamSelectionAI = ({ squadContext }) => {
  const [result, setResult]     = useState(null);
  const { loading, error, callAI } = useAI();

  const handleGenerate = async () => {
    const data = await callAI(aiTeamSelection, squadContext);
    if (data?.selectedXI) setResult(data);
  };

  return (
    <div className="bg-white rounded-xl shadow">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b">
        <div>
          <h3 className="font-semibold">AI Team Selection</h3>
          <p className="text-xs text-gray-400">
            Best XI for {squadContext?.nextMatch || "next match"}
          </p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="bg-green-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-green-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Analysing..." : "🏏 Select Best XI"}
        </button>
      </div>

      {error && <p className="text-red-500 text-xs p-4">{error}</p>}

      {/* Empty state */}
      {!result && !loading && (
        <div className="p-8 text-center text-gray-400">
          <p className="text-3xl mb-2">🏏</p>
          <p className="text-sm">Click "Select Best XI" to get AI team recommendation</p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-10">
          <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin mb-2" />
          <p className="text-xs text-gray-400">Analysing squad fitness & form...</p>
        </div>
      )}

      {/* Result */}
      {result && !loading && (
        <div className="p-4 space-y-4">

          {/* Strategy Banner */}
          {result.teamStrategy && (
            <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-sm text-green-800">
              🎯 <span className="font-medium">Strategy:</span> {result.teamStrategy}
            </div>
          )}

          {/* Captain & VC */}
          <div className="flex gap-3">
            {result.captain && (
              <div className="flex-1 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2 text-center">
                <p className="text-xs text-yellow-600 font-medium">Captain</p>
                <p className="font-bold text-sm text-yellow-800">⭐ {result.captain}</p>
              </div>
            )}
            {result.viceCaptain && (
              <div className="flex-1 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-center">
                <p className="text-xs text-blue-600 font-medium">Vice Captain</p>
                <p className="font-bold text-sm text-blue-800">🔵 {result.viceCaptain}</p>
              </div>
            )}
          </div>

          {/* Selected XI */}
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
              Selected XI
            </p>
            <div className="space-y-2">
              {result.selectedXI?.map((player, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 bg-gray-50 rounded-lg px-3 py-2"
                >
                  <span className="w-6 h-6 rounded-full bg-green-700 text-white text-xs flex items-center justify-center font-bold flex-shrink-0">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{player.name}</p>
                      <span className="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded">
                        {player.role}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{player.reason}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Warnings */}
          {result.warnings?.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-xs font-semibold text-red-700 mb-1.5">⚠️ Warnings</p>
              {result.warnings.map((w, i) => (
                <p key={i} className="text-xs text-red-600">• {w}</p>
              ))}
            </div>
          )}

        </div>
      )}
    </div>
  );
};

export default TeamSelectionAI;