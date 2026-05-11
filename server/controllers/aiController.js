import Groq from "groq-sdk";
import dotenv from "dotenv";
dotenv.config();

console.log("Groq Key loaded:", process.env.GROQ_API_KEY ? "YES ✅" : "NO ❌");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const MODEL = "llama-3.3-70b-versatile";

// ─── POST /api/ai/chat ────────────────────────────────────────────
export const playerChat = async (req, res) => {
  try {
    const { message, playerContext } = req.body;
    if (!message) return res.status(400).json({ error: "Message is required" });

    const completion = await groq.chat.completions.create({
      model: MODEL,
      max_tokens: 300,
      messages: [
        {
          role: "system",
          content: `
You are a professional cricket coach AI assistant inside a sports tracking app called SportTrack.
You are talking directly to a player. Be encouraging, specific, and concise (max 3-4 sentences).

Player Profile:
- Name: ${playerContext?.name || "Player"}
- Position: ${playerContext?.position || "Unknown"}
- Runs This Season: ${playerContext?.runs || 0}
- Wickets: ${playerContext?.wickets || 0}
- Fitness Level: ${playerContext?.fitness || 0}%
- Coach Rating: ${playerContext?.coachRating || 0}/10
- Matches Played: ${playerContext?.matches || 0}
- Strike Rate: ${playerContext?.strikeRate || 0}%

Answer the player's question using their actual stats above. Be personal, helpful and motivating.
          `.trim(),
        },
        { role: "user", content: message },
      ],
    });

    const reply = completion.choices[0]?.message?.content || "No response.";
    res.json({ reply });
  } catch (error) {
    console.error("Groq chat error:", error.message);
    res.status(500).json({ error: "AI service failed. Try again." });
  }
};

// ─── POST /api/ai/drill ───────────────────────────────────────────
export const suggestDrill = async (req, res) => {
  try {
    const { playerContext } = req.body;

    const completion = await groq.chat.completions.create({
      model: MODEL,
      max_tokens: 400,
      messages: [
        {
          role: "system",
          content: "You are a cricket coach AI. Respond ONLY in valid JSON. No markdown, no backticks, no extra text before or after the JSON object.",
        },
        {
          role: "user",
          content: `
Based on this player's stats, suggest ONE specific training drill for today.

Player:
- Name: ${playerContext?.name || "Player"}
- Fitness: ${playerContext?.fitness || 0}%
- Runs This Season: ${playerContext?.runs || 0}
- Strike Rate: ${playerContext?.strikeRate || 0}%
- Matches Played: ${playerContext?.matches || 0}

Respond ONLY in this exact JSON format:
{
  "drillName": "Name of drill",
  "duration": "e.g. 20 mins",
  "focus": "Skill it improves",
  "instructions": "3 simple steps as one string",
  "reason": "One sentence why this player needs this"
}
          `.trim(),
        },
      ],
    });

    const text = completion.choices[0]?.message?.content || "{}";
    const cleaned = text.replace(/```json|```/g, "").trim();
    const drill = JSON.parse(cleaned);
    res.json({ drill });
  } catch (error) {
    console.error("Groq drill error:", error.message);
    res.status(500).json({ error: "Could not generate drill. Try again." });
  }
};

// ─── POST /api/ai/fitness ─────────────────────────────────────────
export const predictFitness = async (req, res) => {
  try {
    const { playerContext } = req.body;

    const completion = await groq.chat.completions.create({
      model: MODEL,
      max_tokens: 400,
      messages: [
        {
          role: "system",
          content: "You are a sports fitness AI. Respond ONLY in valid JSON. No markdown, no backticks, no extra text before or after the JSON object.",
        },
        {
          role: "user",
          content: `
Predict this cricket player's match readiness.

Player:
- Name: ${playerContext?.name || "Player"}
- Current Fitness: ${playerContext?.fitness || 0}%
- Matches Played: ${playerContext?.matches || 0}
- Strike Rate: ${playerContext?.strikeRate || 0}%
- Coach Rating: ${playerContext?.coachRating || 0}/10

Respond ONLY in this exact JSON format:
{
  "readinessScore": 87,
  "status": "Match Ready",
  "summary": "One sentence summary",
  "tips": ["tip 1", "tip 2", "tip 3"]
}
Status must be exactly one of: "Match Ready", "Needs Rest", "At Risk"
          `.trim(),
        },
      ],
    });

    const text = completion.choices[0]?.message?.content || "{}";
    const cleaned = text.replace(/```json|```/g, "").trim();
    const prediction = JSON.parse(cleaned);
    res.json({ prediction });
  } catch (error) {
    console.error("Groq fitness error:", error.message);
    res.status(500).json({ error: "Could not predict fitness. Try again." });
  }
};

// ─── POST /api/ai/weekly-plan ─────────────────────────────────────
export const weeklyDrillPlan = async (req, res) => {
  try {
    const { playerContext } = req.body;

    const completion = await groq.chat.completions.create({
      model: MODEL,
      max_tokens: 1200,
      messages: [
        {
          role: "system",
          content: "You are a cricket coach AI. Respond ONLY in valid JSON. No markdown, no backticks, no extra text before or after the JSON object.",
        },
        {
          role: "user",
          content: `
Create a 7-day cricket training plan with 2 sessions per day for this player.

Player:
- Name: ${playerContext?.name || "Player"}
- Fitness: ${playerContext?.fitness || 0}%
- Runs This Season: ${playerContext?.runs || 0}
- Strike Rate: ${playerContext?.strikeRate || 0}%
- Wickets: ${playerContext?.wickets || 0}
- Matches Played: ${playerContext?.matches || 0}
- Coach Rating: ${playerContext?.coachRating || 0}/10

Respond ONLY in this exact JSON format, 7 days exactly:
{
  "plan": [
    {
      "day": "Monday",
      "focus": "One word theme e.g. Batting",
      "sessions": [
        {
          "time": "Morning",
          "drill": "Drill name",
          "duration": "30 mins",
          "description": "One sentence what to do"
        },
        {
          "time": "Evening",
          "drill": "Drill name",
          "duration": "20 mins",
          "description": "One sentence what to do"
        }
      ]
    }
  ],
  "weekGoal": "One sentence overall goal for this week based on player stats"
}
          `.trim(),
        },
      ],
    });

    const text = completion.choices[0]?.message?.content || "{}";
    const cleaned = text.replace(/```json|```/g, "").trim();
    const plan = JSON.parse(cleaned);
    res.json(plan);
  } catch (error) {
    console.error("Groq weekly plan error:", error.message);
    res.status(500).json({ error: "Could not generate weekly plan. Try again." });
  }
};

// ─── POST /api/ai/explain-stat ────────────────────────────────────
export const explainStat = async (req, res) => {
  try {
    const { statName, statValue, playerContext } = req.body;
    if (!statName) return res.status(400).json({ error: "Stat name is required" });

    const completion = await groq.chat.completions.create({
      model: MODEL,
      max_tokens: 300,
      messages: [
        {
          role: "system",
          content: "You are a friendly cricket coach explaining stats to a player. Be simple, clear and encouraging. Max 3 sentences.",
        },
        {
          role: "user",
          content: `
Explain what "${statName}" means in cricket and how the player's value of ${statValue} compares to good performance.

Player context:
- Name: ${playerContext?.name || "Player"}
- Matches: ${playerContext?.matches || 0}
- Runs: ${playerContext?.runs || 0}
- Wickets: ${playerContext?.wickets || 0}
- Rating: ${playerContext?.coachRating || 0}/10

Give a simple 2-3 sentence explanation a young player would understand. End with one motivational tip.
          `.trim(),
        },
      ],
    });

    const explanation = completion.choices[0]?.message?.content || "No explanation available.";
    res.json({ explanation });
  } catch (error) {
    console.error("Groq explain stat error:", error.message);
    res.status(500).json({ error: "Could not explain stat. Try again." });
  }
};

// ─── POST /api/ai/coach-chat ──────────────────────────────────────
export const coachChat = async (req, res) => {
  try {
    const { message, squadContext } = req.body;
    if (!message) return res.status(400).json({ error: "Message is required" });

    const playersText = (squadContext?.players || [])
      .map((p) => `- ${p.name} (${p.position}, Fitness: ${p.fitness}%)`)
      .join("\n");

    const completion = await groq.chat.completions.create({
      model: MODEL,
      max_tokens: 350,
      messages: [
        {
          role: "system",
          content: `
You are an expert cricket AI assistant for a coach inside SportTrack app.
You have full knowledge of the squad. Be concise, tactical and data-driven (max 4 sentences).

Coach: ${squadContext?.coachName || "Coach"}
Club: ${squadContext?.clubName || "Grassroot Club"}
Upcoming Match: ${squadContext?.nextMatch || "Unknown"}
Squad Fitness Average: ${squadContext?.avgFitness || 0}%
Win Rate: ${squadContext?.winRate || 0}%

Squad Players:
${playersText || "No squad data available"}

Answer the coach's question with tactical insight based on squad data above.
          `.trim(),
        },
        { role: "user", content: message },
      ],
    });

    const reply = completion.choices[0]?.message?.content || "No response.";
    res.json({ reply });
  } catch (error) {
    console.error("Groq coach chat error:", error.message);
    res.status(500).json({ error: "AI service failed. Try again." });
  }
};

// ─── POST /api/ai/team-selection ─────────────────────────────────
export const teamSelectionAI = async (req, res) => {
  try {
    const { squadContext } = req.body;

    const playersText = (squadContext?.players || [])
      .map((p) => `- ${p.name}: Position=${p.position}, Fitness=${p.fitness}%, Age=${p.age || "?"}`)
      .join("\n");

    const completion = await groq.chat.completions.create({
      model: MODEL,
      max_tokens: 800,
      messages: [
        {
          role: "system",
          content: "You are a cricket team selection AI. Respond ONLY in valid JSON. No markdown, no backticks, no extra text.",
        },
        {
          role: "user",
          content: `
Select the best playing XI from this squad for the upcoming match.

Upcoming Match: ${squadContext?.nextMatch || "Next Match"}
Squad:
${playersText || "No players available"}

Respond ONLY in this exact JSON format:
{
  "selectedXI": [
    {
      "name": "Player Name",
      "role": "e.g. Opener / Bowler / All-Rounder",
      "reason": "One sentence why selected"
    }
  ],
  "captain": "Player Name",
  "viceCaptain": "Player Name",
  "teamStrategy": "One sentence overall team strategy for this match",
  "warnings": ["Any player at risk or concern — one sentence each"]
}
          `.trim(),
        },
      ],
    });

    const text = completion.choices[0]?.message?.content || "{}";
    const cleaned = text.replace(/```json|```/g, "").trim();
    const result = JSON.parse(cleaned);
    res.json(result);
  } catch (error) {
    console.error("Groq team selection error:", error.message);
    res.status(500).json({ error: "Could not generate team selection. Try again." });
  }
};

// ─── POST /api/ai/training-plan ───────────────────────────────────
export const trainingPlanAI = async (req, res) => {
  try {
    const { squadContext } = req.body;

    const completion = await groq.chat.completions.create({
      model: MODEL,
      max_tokens: 800,
      messages: [
        {
          role: "system",
          content: "You are a cricket training plan AI for a coach. Respond ONLY in valid JSON. No markdown, no backticks, no extra text.",
        },
        {
          role: "user",
          content: `
Generate a full today's training session plan for this cricket squad.

Upcoming Match: ${squadContext?.nextMatch || "Next Match"}
Days to Match: ${squadContext?.daysToMatch || 3}
Squad Avg Fitness: ${squadContext?.avgFitness || 80}%
Squad Size: ${squadContext?.squadSize || 14}

Respond ONLY in this exact JSON format:
{
  "sessionTitle": "e.g. Pre-Match Intensive",
  "totalDuration": "e.g. 2 hours 30 mins",
  "focusArea": "e.g. Batting + Fielding",
  "sessions": [
    {
      "activity": "Activity name",
      "duration": "e.g. 30 mins",
      "intensity": "Low / Medium / High",
      "description": "One sentence what to do and why"
    }
  ],
  "coachTip": "One overall coaching tip for this session"
}
          `.trim(),
        },
      ],
    });

    const text = completion.choices[0]?.message?.content || "{}";
    const cleaned = text.replace(/```json|```/g, "").trim();
    const plan = JSON.parse(cleaned);
    res.json(plan);
  } catch (error) {
    console.error("Groq training plan error:", error.message);
    res.status(500).json({ error: "Could not generate training plan. Try again." });
  }
};

// ─── POST /api/ai/format-note ─────────────────────────────────────
export const noteFormatterAI = async (req, res) => {
  try {
    const { rawNote, squadContext } = req.body;
    if (!rawNote) return res.status(400).json({ error: "Note content is required" });

    const completion = await groq.chat.completions.create({
      model: MODEL,
      max_tokens: 600,
      messages: [
        {
          role: "system",
          content: "You are a cricket coach report formatter AI. Respond ONLY in valid JSON. No markdown, no backticks, no extra text.",
        },
        {
          role: "user",
          content: `
Convert this rough coach note into a professional session report.

Coach: ${squadContext?.coachName || "Coach Rivera"}
Club: ${squadContext?.clubName || "Grassroot Club"}
Date: ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}

Raw Note:
"${rawNote}"

Respond ONLY in this exact JSON format:
{
  "title": "Professional report title",
  "summary": "2-3 sentence professional summary of the session",
  "keyPoints": ["Point 1", "Point 2", "Point 3"],
  "playerHighlights": "One sentence about standout players or performances",
  "actionItems": ["Action 1", "Action 2"],
  "recommendation": "One sentence forward-looking recommendation"
}
          `.trim(),
        },
      ],
    });

    const text = completion.choices[0]?.message?.content || "{}";
    const cleaned = text.replace(/```json|```/g, "").trim();
    const report = JSON.parse(cleaned);
    res.json({ report });
  } catch (error) {
    console.error("Groq note formatter error:", error.message);
    res.status(500).json({ error: "Could not format note. Try again." });
  }
};

// ─── POST /api/ai/injury-risk ─────────────────────────────────────
export const injuryRiskAI = async (req, res) => {
  try {
    const { players } = req.body;
    if (!players || players.length === 0) {
      return res.status(400).json({ error: "Players data is required" });
    }

    const playersText = players
      .map((p) => `- ${p.name}: Position=${p.position || "?"}, Fitness=${p.fitness || 0}%, Matches=${p.matches || 0}, Rating=${p.rating || 0}/10`)
      .join("\n");

    const completion = await groq.chat.completions.create({
      model: MODEL,
      max_tokens: 800,
      messages: [
        {
          role: "system",
          content: "You are a sports medicine and injury risk AI for cricket. Respond ONLY in valid JSON. No markdown, no backticks, no extra text.",
        },
        {
          role: "user",
          content: `
Analyse this squad's injury risk based on fitness levels and match load.

Players:
${playersText}

Respond ONLY in this exact JSON format:
{
  "riskSummary": "One sentence overall squad injury risk assessment",
  "players": [
    {
      "name": "Player Name",
      "riskLevel": "High / Medium / Low",
      "reason": "One sentence why",
      "prevention": "One specific prevention tip"
    }
  ],
  "squadRecommendation": "One overall recommendation for the coach"
}

Include ALL players in the response, sorted by risk level (High first).
          `.trim(),
        },
      ],
    });

    const text = completion.choices[0]?.message?.content || "{}";
    const cleaned = text.replace(/```json|```/g, "").trim();
    const result = JSON.parse(cleaned);
    res.json(result);
  } catch (error) {
    console.error("Groq injury risk error:", error.message);
    res.status(500).json({ error: "Could not assess injury risk. Try again." });
  }
};

// ─── POST /api/ai/analyst-chat ────────────────────────────────────
export const analystChat = async (req, res) => {
  try {
    const { message, analystContext } = req.body;
    if (!message) return res.status(400).json({ error: "Message is required" });

    const matchSummary = (analystContext?.recentMatches || [])
      .slice(0, 5)
      .map(
        (m) =>
          `- ${m.matchTitle || "Match"}: ${m.teamA} vs ${m.teamB}, Score: ${m.teamAScore || "?"} vs ${m.teamBScore || "?"}, Result: ${m.result || "?"}`
      )
      .join("\n");

    const playerSummary = (analystContext?.players || [])
      .slice(0, 10)
      .map(
        (p) =>
          `- ${p.name || p.playerName} (${p.position || p.role || "Player"}): Runs=${p.runs || 0}, Wickets=${p.wickets || 0}, Fitness=${p.fitness || 0}%, Rating=${p.rating || 0}/10`
      )
      .join("\n");

    const completion = await groq.chat.completions.create({
      model: MODEL,
      max_tokens: 400,
      messages: [
        {
          role: "system",
          content: `
You are a cricket data analyst AI inside SportTrack app. You are talking to a lead analyst.
Be precise, data-driven, and concise (max 4 sentences). Use actual numbers from the data below.

Club: ${analystContext?.clubName || "FC Thunder"}
Season: ${analystContext?.season || "2025"}
Total Matches: ${analystContext?.totalMatches || 0}
Win Rate: ${analystContext?.winRate || 0}%
Squad Size: ${analystContext?.squadSize || 0}

Recent Match Data:
${matchSummary || "No match data available"}

Player Stats:
${playerSummary || "No player data available"}

Answer the analyst's question using actual stats above. Be analytical and specific.
          `.trim(),
        },
        { role: "user", content: message },
      ],
    });

    const reply = completion.choices[0]?.message?.content || "No response.";
    res.json({ reply });
  } catch (error) {
    console.error("Groq analyst chat error:", error.message);
    res.status(500).json({ error: "AI service failed. Try again." });
  }
};

// ─── POST /api/ai/match-report-writer ────────────────────────────
export const matchReportWriter = async (req, res) => {
  try {
    const { matchData } = req.body;
    if (!matchData) return res.status(400).json({ error: "Match data is required" });

    const playerRatingsText = (matchData.playerRatings || [])
      .map((p) => `- ${p.name}: ${p.rating}/10`)
      .join("\n");

    const completion = await groq.chat.completions.create({
      model: MODEL,
      max_tokens: 800,
      messages: [
        {
          role: "system",
          content: "You are a professional cricket match report writer AI. Respond ONLY in valid JSON. No markdown, no backticks, no extra text.",
        },
        {
          role: "user",
          content: `
Write a full professional narrative match report from this data.

Match: ${matchData.matchTitle || "Match"}
Teams: ${matchData.teamA || "Team A"} vs ${matchData.teamB || "Team B"}
Final Score: ${matchData.finalScore || "N/A"}
Result: ${matchData.result || "N/A"}
Date: ${matchData.matchDate ? new Date(matchData.matchDate).toLocaleDateString("en-IN") : "N/A"}
Analyst Summary: ${matchData.matchSummary || "N/A"}

Player Ratings:
${playerRatingsText || "Not provided"}

Respond ONLY in this exact JSON format:
{
  "headline": "Punchy match headline (max 10 words)",
  "narrative": "3-4 sentence professional match narrative covering performance, key moments, and result",
  "manOfMatch": "Best rated player name and why in one sentence",
  "keyStats": ["Stat insight 1", "Stat insight 2", "Stat insight 3"],
  "trends": "One sentence about team trend or pattern",
  "recommendation": "One tactical recommendation for next match"
}
          `.trim(),
        },
      ],
    });

    const text = completion.choices[0]?.message?.content || "{}";
    const cleaned = text.replace(/```json|```/g, "").trim();
    const report = JSON.parse(cleaned);
    res.json({ report });
  } catch (error) {
    console.error("Groq match report writer error:", error.message);
    res.status(500).json({ error: "Could not generate report. Try again." });
  }
};

// ─── POST /api/ai/player-comparison ──────────────────────────────
export const playerComparisonAI = async (req, res) => {
  try {
    const { player1, player2 } = req.body;
    if (!player1 || !player2)
      return res.status(400).json({ error: "Both players are required" });

    const completion = await groq.chat.completions.create({
      model: MODEL,
      max_tokens: 400,
      messages: [
        {
          role: "system",
          content: "You are a cricket analyst AI. Write a sharp, narrative player comparison. Be specific with numbers. Max 4 sentences total.",
        },
        {
          role: "user",
          content: `
Compare these two cricket players and write a narrative analysis.

Player 1: ${player1.name}
- Role: ${player1.role || "Player"}
- Runs: ${player1.runs || 0}
- Wickets: ${player1.wickets || 0}
- Strike Rate: ${player1.strikeRate || 0}%
- Rating: ${player1.rating || 0}/10
- Fitness: ${player1.fitness || 0}%
- Matches: ${player1.matches || 0}

Player 2: ${player2.name}
- Role: ${player2.role || "Player"}
- Runs: ${player2.runs || 0}
- Wickets: ${player2.wickets || 0}
- Strike Rate: ${player2.strikeRate || 0}%
- Rating: ${player2.rating || 0}/10
- Fitness: ${player2.fitness || 0}%
- Matches: ${player2.matches || 0}

Write a 3-4 sentence narrative comparing them. Mention specific numbers. State who has the edge and why. End with a tactical recommendation for which scenario each player is better suited.
          `.trim(),
        },
      ],
    });

    const narrative = completion.choices[0]?.message?.content || "Could not generate comparison.";
    res.json({ narrative });
  } catch (error) {
    console.error("Groq player comparison error:", error.message);
    res.status(500).json({ error: "Could not compare players. Try again." });
  }
};

// ─── POST /api/ai/scout-report ────────────────────────────────────
export const scoutReportAI = async (req, res) => {
  try {
    const { oppositionData } = req.body;
    if (!oppositionData)
      return res.status(400).json({ error: "Opposition data is required" });

    const completion = await groq.chat.completions.create({
      model: MODEL,
      max_tokens: 700,
      messages: [
        {
          role: "system",
          content: "You are a cricket opposition analyst AI. Respond ONLY in valid JSON. No markdown, no backticks, no extra text.",
        },
        {
          role: "user",
          content: `
Generate a professional opposition scouting report.

Opponent: ${oppositionData.opponentName || "Opposition Team"}
Known Weakness: ${oppositionData.weakness || "Not specified"}
Our Recommended Tactic: ${oppositionData.tactic || "Not specified"}
Additional Notes: ${oppositionData.notes || "None"}
Match Type: ${oppositionData.matchType || "T20"}

Respond ONLY in this exact JSON format:
{
  "opponentSummary": "2 sentence professional summary of the opposition",
  "keyThreats": ["Threat 1", "Threat 2", "Threat 3"],
  "exploitableWeaknesses": ["Weakness 1", "Weakness 2"],
  "recommendedTactics": [
    { "phase": "Powerplay", "tactic": "One sentence tactic" },
    { "phase": "Middle Overs", "tactic": "One sentence tactic" },
    { "phase": "Death Overs", "tactic": "One sentence tactic" }
  ],
  "playerMatchups": "One sentence about key player matchups to target",
  "overallVerdict": "One punchy sentence — our chances and what will decide it"
}
          `.trim(),
        },
      ],
    });

    const text = completion.choices[0]?.message?.content || "{}";
    const cleaned = text.replace(/```json|```/g, "").trim();
    const report = JSON.parse(cleaned);
    res.json({ report });
  } catch (error) {
    console.error("Groq scout report error:", error.message);
    res.status(500).json({ error: "Could not generate scout report. Try again." });
  }
};