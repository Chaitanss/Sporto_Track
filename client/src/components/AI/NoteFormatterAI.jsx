import { useState } from "react";
import useAI from "../../hooks/useAI";
import { aiFormatNote } from "../../Services/api";

const NoteFormatterAI = ({ rawNote, squadContext }) => {
  const [report, setReport]        = useState(null);
  const [copied, setCopied]        = useState(false);
  const { loading, error, callAI } = useAI();

  const handleFormat = async () => {
    if (!rawNote?.trim()) return;
    setReport(null);
    const data = await callAI(aiFormatNote, rawNote, squadContext);
    if (data?.report) setReport(data.report);
  };

  const handleCopy = () => {
    if (!report) return;
    const text = `
${report.title}

Summary:
${report.summary}

Key Points:
${report.keyPoints?.map((p) => `• ${p}`).join("\n")}

Player Highlights:
${report.playerHighlights}

Action Items:
${report.actionItems?.map((a) => `→ ${a}`).join("\n")}

Recommendation:
${report.recommendation}
    `.trim();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mt-3">
      {/* Format Button */}
      <button
        onClick={handleFormat}
        disabled={loading || !rawNote?.trim()}
        className="bg-green-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-green-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? "Formatting..." : "✨ AI Format Note"}
      </button>

      {!rawNote?.trim() && (
        <p className="text-xs text-gray-400 mt-1">Write a note above first</p>
      )}

      {error && <p className="text-red-500 text-xs mt-2">{error}</p>}

      {/* Loading */}
      {loading && (
        <div className="flex items-center gap-2 mt-3">
          <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-gray-400">Converting to professional report...</p>
        </div>
      )}

      {/* Report */}
      {report && !loading && (
        <div className="mt-3 border border-green-200 rounded-xl overflow-hidden">

          {/* Report Header */}
          <div className="bg-green-700 text-white px-4 py-2.5 flex justify-between items-center">
            <div>
              <p className="font-semibold text-sm">{report.title}</p>
              <p className="text-xs text-green-200">
                {new Date().toLocaleDateString("en-IN", {
                  day: "numeric", month: "short", year: "numeric"
                })}
              </p>
            </div>
            <button
              onClick={handleCopy}
              className="text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded transition-colors"
            >
              {copied ? "✅ Copied" : "📋 Copy"}
            </button>
          </div>

          <div className="p-4 space-y-3 bg-white">

            {/* Summary */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Summary</p>
              <p className="text-sm text-gray-700 leading-relaxed">{report.summary}</p>
            </div>

            {/* Key Points */}
            {report.keyPoints?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Key Points</p>
                <ul className="space-y-1">
                  {report.keyPoints.map((pt, i) => (
                    <li key={i} className="flex gap-2 text-sm text-gray-700">
                      <span className="text-green-600 flex-shrink-0">•</span>
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Player Highlights */}
            {report.playerHighlights && (
              <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                <p className="text-xs font-semibold text-blue-700 mb-0.5">⭐ Player Highlights</p>
                <p className="text-sm text-blue-800">{report.playerHighlights}</p>
              </div>
            )}

            {/* Action Items */}
            {report.actionItems?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Action Items</p>
                <ul className="space-y-1">
                  {report.actionItems.map((a, i) => (
                    <li key={i} className="flex gap-2 text-sm text-gray-700">
                      <span className="text-orange-500 flex-shrink-0">→</span>
                      <span>{a}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommendation */}
            {report.recommendation && (
              <div className="bg-yellow-50 border border-yellow-100 rounded-lg px-3 py-2">
                <p className="text-xs font-semibold text-yellow-700 mb-0.5">💡 Recommendation</p>
                <p className="text-sm text-yellow-800">{report.recommendation}</p>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
};

export default NoteFormatterAI;