import { useEffect, useState } from "react";
import { getAllCoachesForSchedule, getEventsByCoach } from "../../Services/api";

const MySchedule = () => {
  const [coaches, setCoaches] = useState([]);
  const [selectedCoach, setSelectedCoach] = useState(null);
  const [events, setEvents] = useState([]);
  const [loadingCoaches, setLoadingCoaches] = useState(true);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [startDate, setStartDate] = useState(new Date());

  // 🔥 Load all coaches on mount
  useEffect(() => {
    const fetchCoaches = async () => {
      setLoadingCoaches(true);
      const data = await getAllCoachesForSchedule();
      setCoaches(data);
      setLoadingCoaches(false);
    };
    fetchCoaches();
  }, []);

  // 🔥 When player picks a coach
  const handleSelectCoach = async (e) => {
    const coachId = e.target.value;
    if (!coachId) {
      setSelectedCoach(null);
      setEvents([]);
      return;
    }
    const coach = coaches.find((c) => c._id === coachId);
    setSelectedCoach(coach);
    setLoadingEvents(true);
    const data = await getEventsByCoach(coachId);
    setEvents(data);
    setLoadingEvents(false);
  };

  // 🔥 7 days for calendar
  const getDays = () => {
    const arr = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      arr.push({
        day: d.toLocaleDateString("en-US", { weekday: "short" }),
        date: d.getDate(),
        full: d.toISOString().split("T")[0],
      });
    }
    return arr;
  };

  const days = getDays();

  const nextWeek = () => {
    const next = new Date(startDate);
    next.setDate(startDate.getDate() + 7);
    setStartDate(next);
  };

  const prevWeek = () => {
    const prev = new Date(startDate);
    prev.setDate(startDate.getDate() - 7);
    setStartDate(prev);
  };

  // 🔥 get status for calendar day
  const getDayStatus = (fullDate) => {
    const event = events.find((e) => e.date?.slice(0, 10) === fullDate);
    if (!event) return "Rest";
    if (event.type === "TRAINING") return "Training";
    if (event.type === "MATCH") return "Match";
    if (event.type === "TOURNAMENT") return "Tournament";
    return "Event";
  };

  const getDayStatusColor = (status) => {
    if (status === "Training") return "text-green-600";
    if (status === "Match") return "text-blue-600";
    if (status === "Tournament") return "text-purple-600";
    return "text-gray-400";
  };

  // 🔥 type badge color
  const getTypeBadge = (type) => {
    if (type === "MATCH") return "bg-blue-100 text-blue-700";
    if (type === "TRAINING") return "bg-green-100 text-green-700";
    if (type === "TOURNAMENT") return "bg-purple-100 text-purple-700";
    return "bg-gray-100 text-gray-700";
  };

  // 🔥 availability state per event
  const [availability, setAvailability] = useState({});

  const markAvailability = (eventId, status) => {
    setAvailability((prev) => ({ ...prev, [eventId]: status }));
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <h1 className="text-2xl font-bold">My Schedule</h1>

      {/* 🔥 COACH DROPDOWN */}
      <div className="bg-white rounded-xl shadow p-4">
        <h2 className="font-semibold mb-3 text-sm">Select Your Coach</h2>
        {loadingCoaches ? (
          <p className="text-sm text-gray-400">Loading coaches...</p>
        ) : coaches.length === 0 ? (
          <p className="text-sm text-gray-400">No coaches registered yet.</p>
        ) : (
          <select
            onChange={handleSelectCoach}
            defaultValue=""
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500"
          >
            <option value="">-- Select a Coach --</option>
            {coaches.map((coach) => (
              <option key={coach._id} value={coach._id}>
                {coach.name} ({coach.email})
              </option>
            ))}
          </select>
        )}
      </div>

      {/* 🔥 WEEK CALENDAR */}
      <div className="flex items-center gap-2">
        <button onClick={prevWeek} className="px-3 py-1 border rounded text-sm">←</button>

        <div className="grid grid-cols-7 gap-3 flex-1">
          {days.map((item, i) => {
            const status = getDayStatus(item.full);
            const isToday = item.full === today;

            return (
              <div
                key={i}
                className={`p-3 rounded-xl text-center border-2 transition-all ${
                  isToday
                    ? "border-green-600 bg-green-50"
                    : status !== "Rest"
                    ? "border-gray-200 bg-white"
                    : "bg-white border-transparent"
                }`}
              >
                <p className="text-xs text-gray-500">{item.day}</p>
                <p className="text-lg font-bold">{item.date}</p>
                <p className={`text-xs mt-1 ${getDayStatusColor(status)}`}>
                  {status}
                </p>
              </div>
            );
          })}
        </div>

        <button onClick={nextWeek} className="px-3 py-1 border rounded text-sm">→</button>
      </div>

      {/* 🔥 UPCOMING EVENTS */}
      <div className="bg-white rounded-xl shadow">
        <div className="p-4 border-b">
          <h2 className="font-semibold">Upcoming Events</h2>
          <p className="text-xs text-gray-500">
            {selectedCoach
              ? `Coach: ${selectedCoach.name} · Mark your availability`
              : "Select a coach to see events"}
          </p>
        </div>

        <div className="divide-y">
          {!selectedCoach ? (
            <div className="p-6 text-center text-gray-400 text-sm">
              👆 Select a coach from the dropdown above to see events
            </div>
          ) : loadingEvents ? (
            <div className="p-6 text-center text-gray-400 text-sm">
              Loading events...
            </div>
          ) : events.length === 0 ? (
            <div className="p-6 text-center text-gray-400 text-sm">
              No events added by this coach yet.
            </div>
          ) : (
            events.map((event) => {
              const eventDate = new Date(event.date);
              const day = eventDate.getDate();
              const month = eventDate.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
              const myStatus = availability[event._id];

              return (
                <div key={event._id} className="p-4 flex justify-between items-center">
                  <div className="flex gap-4 items-center">
                    <div className="bg-gray-100 rounded-lg p-2 text-center min-w-[48px]">
                      <p className="font-bold text-sm">{day}</p>
                      <p className="text-xs text-gray-500">{month}</p>
                    </div>
                    <div>
                      <p className="font-medium">{event.title}</p>
                      <p className="text-xs text-gray-500">{event.details}</p>
                      {/* 🔥 Coach name visible */}
                      {event.coach?.name && (
                        <p className="text-xs text-green-600 mt-0.5">
                          Coach: {event.coach.name}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded ${getTypeBadge(event.type)}`}>
                      {event.type}
                    </span>
                    <button
                      onClick={() => markAvailability(event._id, "going")}
                      className={`px-2 py-1 rounded text-xs transition-all ${
                        myStatus === "going"
                          ? "bg-green-600 text-white"
                          : "bg-green-100 text-green-700 hover:bg-green-600 hover:text-white"
                      }`}
                    >
                      Going
                    </button>
                    <button
                      onClick={() => markAvailability(event._id, "cant")}
                      className={`px-2 py-1 rounded text-xs transition-all ${
                        myStatus === "cant"
                          ? "bg-red-500 text-white"
                          : "bg-red-100 text-red-600 hover:bg-red-500 hover:text-white"
                      }`}
                    >
                      Can't
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

    </div>
  );
};

export default MySchedule;