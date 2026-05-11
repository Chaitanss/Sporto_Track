// src/pages/coach/CoachDashboard.jsx
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { getMyNotifications } from "../../Services/api";
import CoachChatbotWidget from "../../components/AI/CoachChatbotWidget";
import API from "../../Services/api";

const CoachLogo = () => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
    <defs>
      <linearGradient id="cl1" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#4ade80"/>
        <stop offset="100%" stopColor="#166534"/>
      </linearGradient>
    </defs>
    <rect width="40" height="40" rx="12" fill="url(#cl1)"/>
    <rect x="18" y="7" width="5" height="17" rx="2.5" fill="white" fillOpacity="0.95"/>
    <ellipse cx="20" cy="26" rx="5.5" ry="3.5" fill="white" fillOpacity="0.8"/>
    <rect x="10" y="21" width="2.2" height="10" rx="1.1" fill="white" fillOpacity="0.65"/>
    <rect x="14" y="21" width="2.2" height="10" rx="1.1" fill="white" fillOpacity="0.65"/>
    <rect x="9" y="20" width="8.5" height="2" rx="1" fill="white" fillOpacity="0.85"/>
  </svg>
);

const IC = {
  overview:  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  squad:     <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  drill:     <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>,
  tactics:   <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  schedule:  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  records:   <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  stats:     <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  fitness:   <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
  notes:     <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  messages:  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  bell:      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  user:      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  chevL:     <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>,
  chevR:     <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>,
  plus:      <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  settings:  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
};

// ── ONLY CHANGE: removed badge:"14" from My Squad and badge:"2" from Schedule ──
const NAV_DATA = (unreadCount, unreadMessages) => [
  { label:"Main", items:[
    { text:"Overview",      icon:IC.overview, path:"/coach" },
    { text:"My Squad",      icon:IC.squad,    path:"/coach/squad" },
  ]},
  { label:"Training", items:[
    { text:"Drill Library", icon:IC.drill,    path:"/coach/drills" },
    { text:"Tactics Board", icon:IC.tactics,  path:"/coach/tactics" },
    { text:"Schedule",      icon:IC.schedule, path:"/coach/schedule" },
    { text:"Match Records", icon:IC.records,  path:"/coach/match-records" },
  ]},
  { label:"Performance", items:[
    { text:"Player Stats",    icon:IC.stats,   path:"/coach/stats" },
    { text:"Fitness Reports", icon:IC.fitness, path:"/coach/fitness" },
  ]},
  { label:"Comms", items:[
    { text:"Coach Notes",   icon:IC.notes,    path:"/coach/notes" },
    { text:"Messages",      icon:IC.messages, path:"/coach/messages",      badge: unreadMessages>0?String(unreadMessages):null },
    { text:"Notifications", icon:IC.bell,     path:"/coach/notifications", badge: unreadCount>0?String(unreadCount):null, red:true },
  ]},
];

const TITLE_MAP = {
  "/coach/profile":"My Profile","/coach/squad":"My Squad",
  "/coach/drills":"Drill Library","/coach/tactics":"Tactics Board",
  "/coach/schedule":"Schedule","/coach/stats":"Player Stats",
  "/coach/fitness":"Fitness Reports","/coach/notes":"Coach Notes",
  "/coach/messages":"Messages","/coach/match-records":"Match Records",
  "/coach/notifications":"Notifications",
};

export default function CoachDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount]         = useState(0);
  const [unreadMessages, setUnreadMessages]   = useState(0);
  const [collapsed, setCollapsed]             = useState(false);

  // ── Club name state ─────────────────────────────────────────
  const [clubName, setClubName]               = useState("Grassroot Club");
  const [showClubModal, setShowClubModal]     = useState(false);
  const [clubNameInput, setClubNameInput]     = useState("");
  const [clubSaving, setClubSaving]           = useState(false);
  const [clubToast, setClubToast]             = useState("");

  // ── Add Player modal state ──────────────────────────────────
  const [showAddModal, setShowAddModal]       = useState(false);
  const [registeredPlayers, setRegisteredPlayers] = useState([]);
  const [squadPlayers, setSquadPlayers]       = useState([]);
  const [addForm, setAddForm]                 = useState({ playerId:"", position:"Batsman", age:"", fitness:"", jersey:"" });
  const [addToast, setAddToast]               = useState("");
  const [addSaving, setAddSaving]             = useState(false);

  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const userName   = storedUser?.name || "Coach";
  const initials   = userName.split(" ").map(n=>n[0]).join("").toUpperCase().slice(0,2);

  const squadContext = {
    coachName:"Coach", clubName, nextMatch:"vs City Club",
    daysToMatch:3, avgFitness:89, winRate:72,
    players:[
      {name:"Rohit Sharma",position:"Batsman",fitness:95},
      {name:"Hardik Pandya",position:"All-Rounder",fitness:70},
      {name:"Bumrah",position:"Bowler",fitness:45},
    ],
  };

  const isA = (p) => p==="/coach" ? location.pathname==="/coach" : location.pathname.startsWith(p);
  const title = TITLE_MAP[location.pathname] || "Overview";

  // ── Fetch club name on mount ────────────────────────────────
  useEffect(() => {
    API.get("/team/club-name")
      .then(r => { if (r.data?.clubName) setClubName(r.data.clubName); })
      .catch(() => {});
  }, []);

  // ── Fetch unread notifications AND messages count ───────────
  useEffect(()=>{
    getMyNotifications()
      .then(r=>{ const d=r.data||[]; setUnreadCount(d.filter(n=>!n.read).length); })
      .catch(()=>{});

    API.get("/chat/unread-count")
      .then(r=>{ setUnreadMessages(r.data?.count || 0); })
      .catch(()=>{});
  },[location.pathname]);

  // ── Toast auto-clear ────────────────────────────────────────
  useEffect(()=>{
    if(addToast){ const t=setTimeout(()=>setAddToast(""),3000); return()=>clearTimeout(t); }
  },[addToast]);

  useEffect(()=>{
    if(clubToast){ const t=setTimeout(()=>setClubToast(""),3000); return()=>clearTimeout(t); }
  },[clubToast]);

  // ── Club name save ──────────────────────────────────────────
  const openClubModal = () => {
    setClubNameInput(clubName);
    setShowClubModal(true);
  };

  const handleClubNameSave = async () => {
    if (!clubNameInput.trim()) return setClubToast("Club name cannot be empty ❌");
    setClubSaving(true);
    try {
      const res = await API.patch("/team/club-name", { clubName: clubNameInput.trim() });
      setClubName(res.data.clubName);
      setShowClubModal(false);
      setClubToast("Club name updated ✅");
    } catch (err) {
      setClubToast(err.response?.data?.message || "Failed to update ❌");
    } finally {
      setClubSaving(false);
    }
  };

  // ── Squad helpers ───────────────────────────────────────────
  const fetchSquad = async () => {
    try { const r = await API.get("/players"); setSquadPlayers(r.data); } catch{}
  };
  const fetchRegistered = async () => {
    try { const r = await API.get("/players/registered"); setRegisteredPlayers(r.data); } catch{}
  };

  const openAddModal = async () => {
    await Promise.all([fetchSquad(), fetchRegistered()]);
    setAddForm({ playerId:"", position:"Batsman", age:"", fitness:"", jersey:"" });
    setShowAddModal(true);
  };

  const availableToAdd = registeredPlayers.filter(
    rp => !squadPlayers.some(sp => sp._id === rp._id)
  );

  const handleAddSave = async () => {
    if(!addForm.playerId) return setAddToast("Please select a player");
    setAddSaving(true);
    try {
      await API.post("/players", {
        playerId: addForm.playerId,
        position: addForm.position,
        age:      Number(addForm.age),
        fitness:  Number(addForm.fitness),
        jersey:   Number(addForm.jersey),
      });
      setAddToast("Player Added to Squad ✅");
      setShowAddModal(false);
    } catch(err) {
      setAddToast(err.response?.data?.message || "Error adding player ❌");
    } finally {
      setAddSaving(false);
    }
  };

  return (
    <div style={{display:"flex",minHeight:"100vh",fontFamily:"'Outfit','DM Sans','Segoe UI',sans-serif",background:"#f0fdf4"}}>

      {/* ── TOASTS ── */}
      {(addToast || clubToast) && (
        <div style={{position:"fixed",top:20,right:20,zIndex:9999,background:"#1a1a1a",color:"#fff",padding:"10px 20px",borderRadius:12,fontWeight:600,fontSize:13,boxShadow:"0 4px 20px rgba(0,0,0,0.3)"}}>
          {addToast || clubToast}
        </div>
      )}

      {/* ──────── SIDEBAR ──────── */}
      <aside style={{
        width:collapsed?70:258, flexShrink:0,
        background:"linear-gradient(175deg,#052e16 0%,#14532d 35%,#166534 65%,#15803d 100%)",
        display:"flex",flexDirection:"column",
        transition:"width 0.26s cubic-bezier(.4,0,.2,1)",overflow:"hidden",
        boxShadow:"8px 0 40px rgba(5,46,22,0.3)",position:"relative",zIndex:20,
      }}>
        <div style={{position:"absolute",top:-80,left:-40,width:220,height:220,borderRadius:"50%",background:"radial-gradient(circle,rgba(74,222,128,0.15) 0%,transparent 70%)",pointerEvents:"none"}}/>
        <div style={{position:"absolute",bottom:80,right:-60,width:180,height:180,borderRadius:"50%",background:"radial-gradient(circle,rgba(34,197,94,0.1) 0%,transparent 70%)",pointerEvents:"none"}}/>

        {/* Logo — click pencil icon to edit club name */}
        <div style={{padding:collapsed?"17px 15px":"17px 18px",borderBottom:"1px solid rgba(255,255,255,0.07)",display:"flex",alignItems:"center",gap:11,minHeight:70,position:"relative"}}>
          <div style={{flexShrink:0,filter:"drop-shadow(0 4px 10px rgba(0,0,0,0.35))"}}>
            <CoachLogo/>
          </div>
          {!collapsed && (
            <div style={{overflow:"hidden",flex:1}}>
              <div style={{display:"flex",alignItems:"center",gap:5}}>
                <div style={{fontWeight:800,fontSize:14.5,color:"#fff",whiteSpace:"nowrap",letterSpacing:"0.005em",overflow:"hidden",textOverflow:"ellipsis",maxWidth:130}}>{clubName}</div>
                {/* ✏️ Edit club name — coach only */}
                <button
                  onClick={openClubModal}
                  title="Edit club name"
                  style={{background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:5,width:18,height:18,cursor:"pointer",color:"rgba(255,255,255,0.7)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,padding:0,transition:"all 0.15s"}}
                  onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.22)"}
                  onMouseLeave={e=>e.currentTarget.style.background="rgba(255,255,255,0.1)"}>
                  <svg width="9" height="9" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
              </div>
              <div style={{fontSize:9,fontWeight:700,letterSpacing:"0.16em",textTransform:"uppercase",background:"linear-gradient(90deg,#4ade80,#86efac)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>Coach Portal</div>
            </div>
          )}
          <button onClick={()=>setCollapsed(!collapsed)} style={{marginLeft:"auto",background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:8,width:26,height:26,cursor:"pointer",color:"rgba(255,255,255,0.6)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all 0.15s"}}
            onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.14)"}
            onMouseLeave={e=>e.currentTarget.style.background="rgba(255,255,255,0.07)"}>
            {collapsed?IC.chevR:IC.chevL}
          </button>
        </div>

        {/* Nav */}
        <div style={{flex:1,overflowY:"auto",padding:"8px 8px"}}>
          {NAV_DATA(unreadCount, unreadMessages).map(sec=>(
            <div key={sec.label} style={{marginBottom:4}}>
              {!collapsed&&<div style={{fontSize:9,fontWeight:700,color:"rgba(134,239,172,0.5)",letterSpacing:"0.15em",textTransform:"uppercase",padding:"11px 10px 4px"}}>{sec.label}</div>}
              {sec.items.map(item=>{
                const active=isA(item.path);
                return (
                  <button key={item.path} onClick={()=>navigate(item.path)} title={collapsed?item.text:""}
                    style={{width:"100%",display:"flex",alignItems:"center",gap:9,padding:collapsed?"10px 0":"9px 11px",justifyContent:collapsed?"center":"flex-start",borderRadius:10,border:"none",cursor:"pointer",background:active?"linear-gradient(135deg,rgba(74,222,128,0.2),rgba(34,197,94,0.1))":"transparent",color:active?"#4ade80":"rgba(255,255,255,0.52)",fontWeight:active?700:500,fontSize:13.5,marginBottom:2,boxShadow:active?"inset 0 0 0 1px rgba(74,222,128,0.28)":"none",transition:"all 0.15s ease",position:"relative"}}
                    onMouseEnter={e=>{if(!active){e.currentTarget.style.background="rgba(255,255,255,0.07)";e.currentTarget.style.color="rgba(255,255,255,0.88)"}}}
                    onMouseLeave={e=>{if(!active){e.currentTarget.style.background="transparent";e.currentTarget.style.color="rgba(255,255,255,0.52)"}}}>
                    <span style={{flexShrink:0,opacity:active?1:0.7}}>{item.icon}</span>
                    {!collapsed&&<><span style={{flex:1,textAlign:"left"}}>{item.text}</span>
                    {item.badge&&<span style={{background:item.red?"linear-gradient(135deg,#ef4444,#dc2626)":"linear-gradient(135deg,#4ade80,#16a34a)",color:item.red?"#fff":"#052e16",fontSize:10,fontWeight:800,padding:"2px 8px",borderRadius:20,boxShadow:item.red?"0 2px 8px rgba(239,68,68,0.45)":"0 2px 8px rgba(74,222,128,0.45)"}}>{item.badge}</span>}</>}
                    {collapsed&&item.badge&&<span style={{position:"absolute",top:5,right:6,width:8,height:8,borderRadius:"50%",background:item.red?"#ef4444":"#4ade80",border:"2px solid #14532d"}}/>}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Profile footer */}
        <div onClick={()=>navigate("/coach/profile")} style={{padding:collapsed?"13px 10px":"13px 15px",borderTop:"1px solid rgba(255,255,255,0.07)",display:"flex",alignItems:"center",gap:10,cursor:"pointer",transition:"background 0.15s",background:isA("/coach/profile")?"rgba(74,222,128,0.1)":"transparent",justifyContent:collapsed?"center":"flex-start"}}
          onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.07)"}
          onMouseLeave={e=>e.currentTarget.style.background=isA("/coach/profile")?"rgba(74,222,128,0.1)":"transparent"}>
          <div style={{width:36,height:36,borderRadius:10,flexShrink:0,background:"linear-gradient(135deg,#4ade80,#16a34a)",display:"flex",alignItems:"center",justifyContent:"center",color:"#052e16",fontWeight:800,fontSize:13,boxShadow:"0 4px 14px rgba(74,222,128,0.45)"}}>
            {initials}
          </div>
          {!collapsed&&<div style={{overflow:"hidden",flex:1}}>
            <div style={{fontSize:13,fontWeight:700,color:"#fff",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{userName}</div>
            <div style={{fontSize:10,color:"rgba(134,239,172,0.65)",display:"flex",alignItems:"center",gap:4}}>{IC.user}<span>View Profile</span></div>
          </div>}
        </div>
      </aside>

      {/* ──────── MAIN ──────── */}
      <div style={{flex:1,display:"flex",flexDirection:"column",minWidth:0}}>

        {/* Topbar */}
        <header style={{height:62,flexShrink:0,background:"linear-gradient(105deg,#fff 0%,#f0fdf4 60%,#dcfce7 100%)",borderBottom:"1px solid rgba(22,163,74,0.13)",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 28px",boxShadow:"0 2px 20px rgba(22,163,74,0.09)"}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:4,height:30,borderRadius:3,background:"linear-gradient(180deg,#4ade80,#16a34a)",boxShadow:"0 0 10px rgba(74,222,128,0.6)"}}/>
            <div>
              <div style={{fontSize:9.5,color:"#86efac",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase"}}>Coach Portal</div>
              <div style={{fontSize:17,fontWeight:800,color:"#052e16",letterSpacing:"-0.01em",lineHeight:1.1}}>{title}</div>
            </div>
          </div>

          <div style={{display:"flex",alignItems:"center",gap:10}}>

            {/* Settings — edit club name shortcut */}
            <button
              onClick={openClubModal}
              title="Edit Club Name"
              style={{position:"relative",width:40,height:40,background:"linear-gradient(135deg,#f0fdf4,#dcfce7)",border:"1px solid rgba(22,163,74,0.18)",borderRadius:12,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#16a34a",transition:"all 0.15s",boxShadow:"0 2px 10px rgba(22,163,74,0.12)"}}
              onMouseEnter={e=>e.currentTarget.style.boxShadow="0 4px 18px rgba(22,163,74,0.28)"}
              onMouseLeave={e=>e.currentTarget.style.boxShadow="0 2px 10px rgba(22,163,74,0.12)"}>
              {IC.settings}
            </button>

            {/* Bell */}
            <button onClick={()=>navigate("/coach/notifications")} style={{position:"relative",width:40,height:40,background:"linear-gradient(135deg,#f0fdf4,#dcfce7)",border:"1px solid rgba(22,163,74,0.18)",borderRadius:12,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#16a34a",transition:"all 0.15s",boxShadow:"0 2px 10px rgba(22,163,74,0.12)"}}
              onMouseEnter={e=>e.currentTarget.style.boxShadow="0 4px 18px rgba(22,163,74,0.28)"}
              onMouseLeave={e=>e.currentTarget.style.boxShadow="0 2px 10px rgba(22,163,74,0.12)"}>
              {IC.bell}
              {unreadCount>0&&<span style={{position:"absolute",top:-3,right:-3,background:"linear-gradient(135deg,#ef4444,#dc2626)",color:"#fff",fontSize:8,fontWeight:800,borderRadius:"50%",width:16,height:16,display:"flex",alignItems:"center",justifyContent:"center",border:"2px solid #fff",boxShadow:"0 2px 6px rgba(239,68,68,0.5)"}}>{unreadCount}</span>}
            </button>

            {/* Profile button */}
            <button
              onClick={()=>navigate("/coach/profile")}
              style={{display:"flex",alignItems:"center",gap:6,height:40,padding:"0 16px",borderRadius:12,border:"1px solid rgba(22,163,74,0.18)",background:isA("/coach/profile")?"linear-gradient(135deg,#dcfce7,#bbf7d0)":"linear-gradient(135deg,#fff,#f0fdf4)",color:"#15803d",fontWeight:700,fontSize:13,cursor:"pointer",transition:"all 0.15s",boxShadow:isA("/coach/profile")?"0 4px 16px rgba(22,163,74,0.22)":"0 2px 8px rgba(22,163,74,0.08)"}}
              onMouseEnter={e=>e.currentTarget.style.boxShadow="0 4px 16px rgba(22,163,74,0.22)"}
              onMouseLeave={e=>e.currentTarget.style.boxShadow=isA("/coach/profile")?"0 4px 16px rgba(22,163,74,0.22)":"0 2px 8px rgba(22,163,74,0.08)"}>
              <div style={{width:22,height:22,borderRadius:7,background:"linear-gradient(135deg,#4ade80,#16a34a)",display:"flex",alignItems:"center",justifyContent:"center",color:"#052e16",fontWeight:800,fontSize:9,flexShrink:0}}>
                {initials}
              </div>
              Profile
            </button>

            {/* Add Player */}
            <button
              onClick={openAddModal}
              style={{display:"flex",alignItems:"center",gap:6,padding:"0 18px",height:40,borderRadius:12,border:"none",background:"linear-gradient(135deg,#4ade80 0%,#22c55e 50%,#16a34a 100%)",color:"#fff",fontWeight:700,fontSize:13,cursor:"pointer",boxShadow:"0 4px 16px rgba(22,163,74,0.42)",transition:"all 0.15s"}}
              onMouseEnter={e=>e.currentTarget.style.boxShadow="0 6px 24px rgba(22,163,74,0.58)"}
              onMouseLeave={e=>e.currentTarget.style.boxShadow="0 4px 16px rgba(22,163,74,0.42)"}>
              {IC.plus} Add Player
            </button>
          </div>
        </header>

        <main style={{flex:1,overflowY:"auto",padding:28}}><Outlet/></main>
      </div>

      <CoachChatbotWidget squadContext={squadContext}/>

      {/* ──────── CLUB NAME MODAL ──────── */}
      {showClubModal && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:9998,backdropFilter:"blur(4px)"}}>
          <div style={{background:"#fff",borderRadius:20,width:420,boxShadow:"0 24px 60px rgba(0,0,0,0.22)",overflow:"hidden"}}>

            {/* Header */}
            <div style={{background:"linear-gradient(135deg,#052e16,#166534)",padding:"20px 24px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div>
                <div style={{fontSize:10,fontWeight:700,color:"#86efac",letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:2}}>Coach Portal</div>
                <div style={{fontSize:16,fontWeight:800,color:"#fff"}}>Edit Club Name</div>
              </div>
              <button onClick={()=>setShowClubModal(false)} style={{width:32,height:32,borderRadius:9,background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.15)",color:"#fff",fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",lineHeight:1}}>×</button>
            </div>

            {/* Body */}
            <div style={{padding:"24px"}}>
              <p style={{fontSize:12.5,color:"#6b7280",marginBottom:16,lineHeight:1.6}}>
                This name will appear across all dashboards — Coach, Analyst, and Player portals. Only coaches can change it.
              </p>
              <label style={{fontSize:12,fontWeight:700,color:"#374151",display:"block",marginBottom:8}}>
                🏟️ Club / Team Name
              </label>
              <input
                type="text"
                value={clubNameInput}
                onChange={e=>setClubNameInput(e.target.value)}
                onKeyDown={e=>{ if(e.key==="Enter") handleClubNameSave(); }}
                placeholder="e.g. FC Thunder, Grassroot Club..."
                maxLength={50}
                style={{width:"100%",border:"1.5px solid #d1fae5",borderRadius:10,padding:"11px 14px",fontSize:14,color:"#1a1a1a",background:"#f0fdf4",outline:"none",boxSizing:"border-box",fontFamily:"inherit",fontWeight:600}}
                onFocus={e=>e.target.style.borderColor="#16a34a"}
                onBlur={e=>e.target.style.borderColor="#d1fae5"}
                autoFocus
              />
              <p style={{fontSize:11,color:"#9ca3af",marginTop:6}}>{clubNameInput.length}/50 characters</p>
            </div>

            {/* Footer */}
            <div style={{padding:"0 24px 22px",display:"flex",gap:10,justifyContent:"flex-end"}}>
              <button onClick={()=>setShowClubModal(false)} style={{height:40,padding:"0 20px",borderRadius:10,border:"1px solid #e5e7eb",background:"#f9fafb",color:"#374151",fontWeight:600,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>
                Cancel
              </button>
              <button
                onClick={handleClubNameSave}
                disabled={clubSaving}
                style={{height:40,padding:"0 24px",borderRadius:10,border:"none",background:"linear-gradient(135deg,#4ade80,#16a34a)",color:"#fff",fontWeight:700,fontSize:13,cursor:"pointer",boxShadow:"0 4px 14px rgba(22,163,74,0.38)",opacity:clubSaving?0.7:1,fontFamily:"inherit"}}>
                {clubSaving ? "Saving…" : "Save Club Name ✅"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ──────── ADD PLAYER MODAL ──────── */}
      {showAddModal && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:9998,backdropFilter:"blur(4px)"}}>
          <div style={{background:"#fff",borderRadius:20,width:440,boxShadow:"0 24px 60px rgba(0,0,0,0.22)",overflow:"hidden"}}>

            <div style={{background:"linear-gradient(135deg,#052e16,#166534)",padding:"20px 24px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div>
                <div style={{fontSize:10,fontWeight:700,color:"#86efac",letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:2}}>Coach Portal</div>
                <div style={{fontSize:16,fontWeight:800,color:"#fff"}}>Add Player to Squad</div>
              </div>
              <button onClick={()=>setShowAddModal(false)} style={{width:32,height:32,borderRadius:9,background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.15)",color:"#fff",fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",lineHeight:1}}>×</button>
            </div>

            <div style={{padding:"22px 24px",display:"flex",flexDirection:"column",gap:14}}>
              <div>
                <label style={{fontSize:11.5,fontWeight:700,color:"#374151",display:"block",marginBottom:6}}>Select Registered Player</label>
                <select value={addForm.playerId} onChange={e=>setAddForm({...addForm,playerId:e.target.value})} style={{width:"100%",border:"1px solid #d1fae5",borderRadius:10,padding:"9px 12px",fontSize:13,color:"#1a1a1a",background:"#f0fdf4",outline:"none",cursor:"pointer",fontFamily:"inherit"}}>
                  <option value="">— Choose a player —</option>
                  {availableToAdd.map(p=>(
                    <option key={p._id} value={p._id}>{p.name} ({p.email})</option>
                  ))}
                </select>
                {availableToAdd.length===0&&<p style={{fontSize:11,color:"#9ca3af",marginTop:5}}>No unassigned registered players found.</p>}
                <p style={{fontSize:11,color:"#16a34a",marginTop:5,fontWeight:600}}>💡 Only players registered in the app appear here.</p>
              </div>

              <div>
                <label style={{fontSize:11.5,fontWeight:700,color:"#374151",display:"block",marginBottom:6}}>Position</label>
                <select value={addForm.position} onChange={e=>setAddForm({...addForm,position:e.target.value})} style={{width:"100%",border:"1px solid #d1fae5",borderRadius:10,padding:"9px 12px",fontSize:13,color:"#1a1a1a",background:"#f0fdf4",outline:"none",fontFamily:"inherit"}}>
                  <option>Batsman</option><option>Bowler</option><option>All-Rounder</option>
                </select>
              </div>

              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
                {[{key:"age",label:"Age",placeholder:"Age"},{key:"fitness",label:"Fitness %",placeholder:"e.g. 85"},{key:"jersey",label:"Jersey #",placeholder:"e.g. 10"}].map(({key,label,placeholder})=>(
                  <div key={key}>
                    <label style={{fontSize:11,fontWeight:700,color:"#374151",display:"block",marginBottom:5}}>{label}</label>
                    <input type="number" value={addForm[key]} onChange={e=>setAddForm({...addForm,[key]:e.target.value})} placeholder={placeholder} style={{width:"100%",border:"1px solid #d1fae5",borderRadius:10,padding:"8px 10px",fontSize:13,color:"#1a1a1a",background:"#f0fdf4",outline:"none",boxSizing:"border-box",fontFamily:"inherit"}}/>
                  </div>
                ))}
              </div>
            </div>

            <div style={{padding:"0 24px 22px",display:"flex",gap:10,justifyContent:"flex-end"}}>
              <button onClick={()=>setShowAddModal(false)} style={{height:40,padding:"0 20px",borderRadius:10,border:"1px solid #e5e7eb",background:"#f9fafb",color:"#374151",fontWeight:600,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>Cancel</button>
              <button onClick={handleAddSave} disabled={addSaving} style={{height:40,padding:"0 24px",borderRadius:10,border:"none",background:"linear-gradient(135deg,#4ade80,#16a34a)",color:"#fff",fontWeight:700,fontSize:13,cursor:"pointer",boxShadow:"0 4px 14px rgba(22,163,74,0.38)",opacity:addSaving?0.7:1,fontFamily:"inherit"}}>
                {addSaving ? "Adding…" : "Add to Squad ✅"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}