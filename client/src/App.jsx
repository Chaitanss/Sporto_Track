// src/App.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";

import PlayerDashboard from "./pages/player/PlayerDashboard";
import CoachDashboard from "./pages/coach/CoachDashboard";
import AnalystDashboard from "./pages/analyst/AnalystDashboard";

/* ─── COACH PAGES ─── */
import Overview from "./pages/coach/Overview";
import Squad from "./pages/coach/Squad";
import CoachMatchRecords from "./pages/coach/CoachMatchRecords";
import DrillLibrary from "./pages/coach/DrillLibrary";
import TacticsBoard from "./pages/coach/TacticsBoard";
import Schedule from "./pages/coach/Schedule";
import PlayerStats from "./pages/coach/PlayerStats";
import FitnessReports from "./pages/coach/FitnessReports";
import CoachNotes from "./pages/coach/CoachNotes";
import CoachMessages from "./pages/coach/CoachMessages.jsx";
import CoachProfile from "./pages/coach/CoachProfile";
import CoachNotifications from "./pages/coach/CoachNotifications";

/* ─── PLAYER PAGES ─── */
import MyStats from "./pages/player/MyStats";
import MyFitness from "./pages/player/MyFitness";
import MySchedule from "./pages/player/MySchedule";
import MyDrills from "./pages/player/MyDrills";
import Messages from "./pages/player/Messages";
import Notifications from "./pages/player/Notifications";
import PlayerOverview from "./pages/player/PlayerOverview";
import PlayerProfile from "./pages/player/PlayerProfile"; // ✅ NEW

/* ─── ANALYST PAGES ─── */
import AnalystOverview from "./pages/analyst/Overview";
import MatchRecords from "./pages/analyst/MatchRecords";
import TeamAnalytics from "./pages/analyst/TeamAnalytics";
import PlayerAnalysis from "./pages/analyst/PlayerAnalysis";
import ComparePlayers from "./pages/analyst/ComparePlayers";
import MatchReports from "./pages/analyst/MatchReports";
import ScoutReports from "./pages/analyst/ScoutReports";
import Communications from "./pages/analyst/Communications";
import Broadcast from "./pages/analyst/Broadcast";
import AnalystNotifications from "./pages/analyst/Notifications";
import AnalystProfile from "./pages/analyst/AnalystProfile"; // ✅ NEW

import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* AUTH */}
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/profile" element={<Profile />} />

        {/* ══════════ PLAYER ══════════ */}
        <Route
          path="/player"
          element={
            <ProtectedRoute role="player">
              <PlayerDashboard />
            </ProtectedRoute>
          }
        >
          <Route index element={<PlayerOverview />} />
          <Route path="profile" element={<PlayerProfile />} /> {/* ✅ NEW */}
          <Route path="stats" element={<MyStats />} />
          <Route path="fitness" element={<MyFitness />} />
          <Route path="schedule" element={<MySchedule />} />
          <Route path="drills" element={<MyDrills />} />
          <Route path="messages" element={<Messages />} />
          <Route path="notifications" element={<Notifications />} />
        </Route>

        {/* ══════════ COACH ══════════ */}
        <Route
          path="/coach"
          element={
            <ProtectedRoute role="coach">
              <CoachDashboard />
            </ProtectedRoute>
          }
        >
          <Route index element={<Overview />} />
          <Route path="profile" element={<CoachProfile />} />
          <Route path="squad" element={<Squad />} />
          <Route path="match-records" element={<CoachMatchRecords />} />
          <Route path="drills" element={<DrillLibrary />} />
          <Route path="tactics" element={<TacticsBoard />} />
          <Route path="schedule" element={<Schedule />} />
          <Route path="stats" element={<PlayerStats />} />
          <Route path="fitness" element={<FitnessReports />} />
          <Route path="notes" element={<CoachNotes />} />
          <Route path="messages" element={<CoachMessages />} />
          <Route path="notifications" element={<CoachNotifications />} />
        </Route>

        {/* ══════════ ANALYST ══════════ */}
        <Route
          path="/analyst"
          element={
            <ProtectedRoute role="analyst">
              <AnalystDashboard />
            </ProtectedRoute>
          }
        >
          <Route index element={<AnalystOverview />} />
          <Route path="profile" element={<AnalystProfile />} /> {/* ✅ NEW */}
          <Route path="matches" element={<MatchRecords />} />
          <Route path="team" element={<TeamAnalytics />} />
          <Route path="players" element={<PlayerAnalysis />} />
          <Route path="compare" element={<ComparePlayers />} />
          <Route path="reports" element={<MatchReports />} />
          <Route path="scout" element={<ScoutReports />} />
          <Route path="communications" element={<Communications />} />
          <Route path="broadcast" element={<Broadcast />} />
          <Route path="notifications" element={<AnalystNotifications />} />
        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;