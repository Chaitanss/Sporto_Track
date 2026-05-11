import React, { useEffect, useState } from "react";
import { getMyStats } from "../../Services/api";
import StatExplainer from "../../components/AI/StatExplainer";

const MyStats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchMyStats = async () => {
      try {
        const res = await getMyStats();
        setStats(res.data);
      } catch (err) {
        setError(err.response?.data?.message || "Could not load stats");
      } finally {
        setLoading(false);
      }
    };
    fetchMyStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">My Stats</h1>
        <div className="bg-white p-10 rounded-2xl shadow text-center">
          <p className="text-4xl mb-3">📊</p>
          <p className="text-gray-500 font-medium">
            {error || "No stats available yet."}
          </p>
          <p className="text-sm text-gray-400 mt-1">
            Your coach will add your stats soon.
          </p>
        </div>
      </div>
    );
  }

  // ── Derived values from real data ──────────────────────────
  const runs       = stats.runs     || 0;
  const wickets    = stats.wickets  || 0;
  const matches    = stats.matches  || 1;
  const rating     = stats.rating   || 0;

  const runsPerMatch       = Math.round(runs / matches);
  const battingAccuracy    = Math.min(Math.round((rating / 10) * 80 + 10), 99);
  const bowlingAccuracy    = Math.min(Math.round((wickets / matches) * 10 + 40), 99);
  const strikeRate         = Math.min(Math.round((runs / matches) * 2), 99);
  const fieldingEfficiency = Math.min(Math.round(rating * 8), 99);
  const fitnessLevel       = 85;

  const ratingStars = Math.min(Math.round(rating / 2), 5);

  const impactColor = {
    High: "text-green-600",
    Medium: "text-yellow-600",
    Low: "text-red-500",
  }[stats.impactRate] || "text-gray-600";

  const feedbackMsg = {
    High: "Strong all-round performance. Keep it up!",
    Medium: "Good batting performance. Improve bowling consistency.",
    Low: "Focus on improving batting and bowling accuracy.",
  }[stats.impactRate] || "Keep working hard!";

  const performerLabel = {
    High: "Top Performer",
    Medium: "Consistent Performer",
    Low: "Developing Player",
  }[stats.impactRate] || "";

  // ── Context for AI stat explainer ─────────────────────────
  const playerContext = {
    name:        stats.name        || "Player",
    runs,
    wickets,
    matches,
    coachRating: rating,
    strikeRate,
    fitness:     fitnessLevel,
  };

  const derivedStats = {
    runsPerMatch,
    battingAccuracy,
    bowlingAccuracy,
    strikeRate,
    fieldingEfficiency,
    fitnessLevel,
  };

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <h1 className="text-2xl font-bold">My Stats</h1>

      {/* TOP CARDS — unchanged */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow">
          <h2 className="text-2xl font-bold">{runs}</h2>
          <p className="text-sm text-gray-500">Runs</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow">
          <h2 className="text-2xl font-bold">{wickets}</h2>
          <p className="text-sm text-gray-500">Wickets</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow">
          <h2 className="text-2xl font-bold">{rating}</h2>
          <p className="text-sm text-gray-500">Performance Rating</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow">
          <h2 className={`text-2xl font-bold ${impactColor}`}>
            {stats.impactRate || "—"}
          </h2>
          <p className="text-sm text-gray-500">Impact Rate</p>
        </div>
      </div>

      {/* MAIN GRID — unchanged */}
      <div className="grid grid-cols-3 gap-4">

        {/* PERFORMANCE BARS */}
        <div className="col-span-2 bg-white p-4 rounded-xl shadow">
          <h2 className="font-semibold mb-4">Performance Breakdown</h2>
          {[
            { label: "Runs per Match",    value: runsPerMatch,       width: `${Math.min(runsPerMatch, 99)}%` },
            { label: "Batting Accuracy",  value: `${battingAccuracy}%`,  width: `${battingAccuracy}%` },
            { label: "Bowling Accuracy",  value: `${bowlingAccuracy}%`,  width: `${bowlingAccuracy}%` },
            { label: "Strike Rate",       value: `${strikeRate}%`,       width: `${Math.min(strikeRate, 99)}%` },
            { label: "Fielding Efficiency", value: `${fieldingEfficiency}%`, width: `${fieldingEfficiency}%` },
            { label: "Fitness Level",     value: `${fitnessLevel}%`,    width: `${fitnessLevel}%` },
          ].map((item, i) => (
            <div key={i} className="mb-3">
              <div className="flex justify-between text-sm mb-1">
                <span>{item.label}</span>
                <span>{item.value}</span>
              </div>
              <div className="bg-gray-200 h-2 rounded">
                <div
                  className="bg-green-500 h-2 rounded"
                  style={{ width: item.width }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* OVERALL RATING — unchanged */}
        <div className="bg-white p-4 rounded-xl shadow text-center">
          <h2 className="font-semibold mb-2">Overall Rating</h2>
          <p className="text-4xl font-bold text-green-600">{rating}</p>
          <p className="text-yellow-500 text-lg">
            {"★".repeat(ratingStars)}{"☆".repeat(5 - ratingStars)}
          </p>
          <p className="text-xs text-gray-500 mt-2">{performerLabel}</p>
          <div className="mt-4 bg-yellow-100 p-3 rounded text-sm text-left">
            {feedbackMsg}
          </div>
        </div>
      </div>

      {/* SEASON SUMMARY — unchanged */}
      <div className="bg-white p-4 rounded-xl shadow">
        <h2 className="font-semibold mb-2">Season Summary</h2>
        <div className="flex gap-6 text-sm text-gray-600 flex-wrap">
          <span>🏏 <strong>{matches}</strong> Matches Played</span>
          <span>🏃 <strong>{runs}</strong> Total Runs</span>
          <span>🎯 <strong>{wickets}</strong> Total Wickets</span>
          <span>⭐ <strong>{rating}/10</strong> Rating</span>
        </div>
      </div>

      {/* VS TEAM AVERAGE — unchanged */}
      <div className="bg-white p-4 rounded-xl shadow">
        <h2 className="font-semibold mb-2">vs Team Average</h2>
        {[
          { label: "Runs",    me: runs,    avg: 320, max: 600 },
          { label: "Wickets", me: wickets, avg: 10,  max: 30  },
          { label: "Rating",  me: rating,  avg: 7.2, max: 10  },
        ].map((item, i) => (
          <div key={i} className="mb-3">
            <div className="flex justify-between text-sm">
              <span>{item.label}</span>
              <span>Me: {item.me} | Avg: {item.avg}</span>
            </div>
            <div className="bg-gray-200 h-2 rounded">
              <div
                className="bg-green-500 h-2 rounded"
                style={{ width: `${Math.min((item.me / item.max) * 100, 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* ✅ AI STAT EXPLAINER (ADDED AT BOTTOM) */}
      <StatExplainer stats={derivedStats} playerContext={playerContext} />

    </div>
  );
};

export default MyStats;