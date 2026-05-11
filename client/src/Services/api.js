import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
});

// ================= TOKEN =================
API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) {
    req.headers.authorization = `Bearer ${token}`;
  }
  return req;
});

// ================= DRILL APIs =================
export const getDrills = () => API.get("/drills");
export const addDrill = (data) => API.post("/drills", data);
export const updateDrill = (id, data) => API.put(`/drills/${id}`, data);
export const deleteDrill = (id) => API.delete(`/drills/${id}`);
export const shareDrill = (id, userIds) => API.put(`/drills/share/${id}`, { userIds });

export const getAllCoaches = async () => {
  try { const res = await API.get("/drills/coaches"); return res.data; }
  catch { return []; }
};
export const getAllPlayers = async () => {
  try { const res = await API.get("/drills/players"); return res.data; }
  catch { return []; }
};
export const getDrillsByCoach = async (coachId) => {
  try { const res = await API.get(`/drills/coach/${coachId}`); return res.data; }
  catch { return []; }
};
export const getPlayerDrills = async () => {
  try { const res = await API.get("/drills/player"); return res.data; }
  catch { return []; }
};

// ================= EVENT APIs =================
export const getEvents = () => API.get("/events");
export const addEvent = (data) => API.post("/events", data);
export const updateEvent = (id, data) => API.put(`/events/${id}`, data);
export const deleteEvent = (id) => API.delete(`/events/${id}`);

export const getAllCoachesForSchedule = async () => {
  try { const res = await API.get("/events/coaches"); return res.data; }
  catch { return []; }
};
export const getEventsByCoach = async (coachId) => {
  try { const res = await API.get(`/events/coach/${coachId}`); return res.data; }
  catch { return []; }
};

// ================= SEASON STATS =================
export const getSeasonStats = () => API.get("/season");
export const addSeasonStats = (data) => API.post("/season", data);
export const updateSeasonStats = (id, data) => API.put(`/season/${id}`, data);
export const deleteSeasonStats = (id) => API.delete(`/season/${id}`);
export const getSeasonSummary = () => API.get("/season/summary");
export const getMyStats = () => API.get("/season/my");
export const getAnalystSeasonStats = () => API.get("/season/analyst");

// ================= FITNESS APIs =================
export const getFitnessReports = () => API.get("/fitness");
export const getFitnessSummary = () => API.get("/fitness/summary");
export const addOrUpdateFitness = (data) => API.post("/fitness", data);
export const getMyFitness = () => API.get("/fitness/my");

// ================= NOTES APIs =================
export const getNotes = () => API.get("/notes");
export const addNote = (data) => API.post("/notes", data);
export const updateNote = (id, data) => API.put(`/notes/${id}`, data);
export const deleteNote = (id) => API.delete(`/notes/${id}`);

// ================= CHAT APIs =================
export const sendChatMessage = (data) => API.post("/chat/send", data);
export const getChatMessages = (userId) => API.get(`/chat/${userId}`);
export const editChatMessage = (id, message) => API.put(`/chat/${id}/edit`, { message });
export const deleteChatMessage = (id, deleteFor) => API.delete(`/chat/${id}`, { data: { deleteFor } });
export const getAllowedChatUsers = () => API.get("/chat/allowed-users");
export const getChatConversations = () => API.get("/chat/conversations");
export const markMessagesRead = (userId) => API.put(`/chat/${userId}/read`);
export const getUsers = () => API.get("/users");

// ================= PLAYERS =================
export const getPlayers = async () => {
  const res = await axios.get("/api/player", {
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });
  return res.data;
};

// ================= MATCH RECORD APIs =================
export const getMatchRecords = () => API.get("/match-records");
export const getMatchRecord = (id) => API.get(`/match-records/${id}`);
export const createMatchRecord = (data) => API.post("/match-records", data);
export const updateMatchRecord = (id, data) => API.put(`/match-records/${id}`, data);
export const deleteMatchRecord = (id) => API.delete(`/match-records/${id}`);

// ================= TEAM ANALYTICS =================
export const getTeamAnalytics = () => API.get("/team/analytics");

// ================= SCOUT REPORT APIs =================
export const getScoutPlayers = () => API.get("/scouts");
export const getRecommendedScoutPlayers = () => API.get("/scouts/recommended");
export const getScoutPlayer = (id) => API.get(`/scouts/${id}`);
export const createScoutPlayer = (data) => API.post("/scouts", data);
export const bulkImportScoutPlayers = (players) => API.post("/scouts/bulk-import", { players });
export const updateScoutPlayer = (id, data) => API.put(`/scouts/${id}`, data);
export const deleteScoutPlayer = (id) => API.delete(`/scouts/${id}`);
export const recommendScoutPlayer = (id) => API.put(`/scouts/${id}/recommend`);
export const pushShortlistToCoach = (data) => API.post("/scouts/push-shortlist", data);

// ================= NOTIFICATIONS APIs =================
export const getMyNotifications = () => API.get("/notifications");
export const markNotificationRead = (id) => API.put(`/notifications/${id}/read`);
export const markAllNotificationsRead = () => API.put("/notifications/mark-all-read");
export const broadcastMessage = (data) => API.post("/notifications/broadcast", data);
export const pushAnalyticsToCoach = (data) => API.post("/notifications/push-to-coach", data);
export const sendAnalysisNote = (data) => API.post("/notifications/send-analysis", data);
export const getBroadcastHistory = () => API.get("/notifications/broadcast-history");

// ================= AI APIs — PLAYER =================
export const aiChat = (message, playerContext) =>
  API.post("/ai/chat", { message, playerContext });

export const aiDrillSuggest = (playerContext) =>
  API.post("/ai/drill", { playerContext });

export const aiFitnessPredict = (playerContext) =>
  API.post("/ai/fitness", { playerContext });

export const aiWeeklyPlan = (playerContext) =>
  API.post("/ai/weekly-plan", { playerContext });

export const aiExplainStat = (statName, statValue, playerContext) =>
  API.post("/ai/explain-stat", { statName, statValue, playerContext });

// ================= AI APIs — COACH =================
export const aiCoachChat = (message, squadContext) =>
  API.post("/ai/coach-chat", { message, squadContext });

export const aiTeamSelection = (squadContext) =>
  API.post("/ai/team-selection", { squadContext });

export const aiTrainingPlan = (squadContext) =>
  API.post("/ai/training-plan", { squadContext });

export const aiFormatNote = (rawNote, squadContext) =>
  API.post("/ai/format-note", { rawNote, squadContext });

export const aiInjuryRisk = (players) =>
  API.post("/ai/injury-risk", { players });

// ── Analyst AI ──────────────────────────────────────────────────────
export const aiAnalystChat       = (message, analystContext) =>
  API.post("/ai/analyst-chat", { message, analystContext });

export const aiMatchReportWriter = (matchData) =>
  API.post("/ai/match-report-writer", { matchData });

export const aiPlayerComparison  = (player1, player2) =>
  API.post("/ai/player-comparison", { player1, player2 });

export const aiScoutReport       = (oppositionData) =>
  API.post("/ai/scout-report", { oppositionData });

export default API;