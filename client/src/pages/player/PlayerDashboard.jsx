// src/pages/player/PlayerDashboard.jsx
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { getMyNotifications } from "../../Services/api";
import ChatbotWidget from "../../components/AI/ChatbotWidget";

const PlayerLogo = () => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
    <defs>
      <linearGradient id="pl1" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#60a5fa"/>
        <stop offset="100%" stopColor="#1d4ed8"/>
      </linearGradient>
    </defs>
    <rect width="40" height="40" rx="12" fill="url(#pl1)"/>
    {/* Soccer ball simplified */}
    <circle cx="20" cy="20" r="10" fill="white" fillOpacity="0.92"/>
    <polygon points="20,11 23.5,14.5 22,19 18,19 16.5,14.5" fill="#1d4ed8" fillOpacity="0.7"/>
    <polygon points="29,17 25.5,14.5 23.5,18.5 26,22.5 29.5,21" fill="#1d4ed8" fillOpacity="0.5"/>
    <polygon points="11,17 14.5,14.5 16.5,18.5 14,22.5 10.5,21" fill="#1d4ed8" fillOpacity="0.5"/>
    <polygon points="20,29 16.5,25.5 18,21 22,21 23.5,25.5" fill="#1d4ed8" fillOpacity="0.6"/>
    {/* Jersey number */}
    <text x="20" y="22" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#1d4ed8" fontFamily="sans-serif">9</text>
  </svg>
);

const IC = {
  overview:  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  messages:  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  drill:     <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>,
  schedule:  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  stats:     <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  fitness:   <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
  bell:      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  user:      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  chevL:     <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>,
  chevR:     <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>,
  chat:      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  profile:   <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
};

const NAV_DATA = (unreadCount) => [
  { label:"Dashboard", items:[
    { text:"Overview", icon:IC.overview, path:"/player" },
    { text:"Messages", icon:IC.messages, path:"/player/messages" },
  ]},
  { label:"Training", items:[
    { text:"My Drills",   icon:IC.drill,    path:"/player/drills" },
    { text:"My Schedule", icon:IC.schedule, path:"/player/schedule" },
  ]},
  { label:"Performance", items:[
    { text:"My Stats",   icon:IC.stats,   path:"/player/stats" },
    { text:"My Fitness", icon:IC.fitness, path:"/player/fitness" },
  ]},
  { label:"Alerts", items:[
    { text:"Notifications", icon:IC.bell, path:"/player/notifications", badge:unreadCount>0?String(unreadCount):null, red:true },
  ]},
];

const TITLE_MAP = {
  "/player/profile":"My Profile","/player/messages":"Messages",
  "/player/drills":"My Drills","/player/schedule":"My Schedule",
  "/player/stats":"My Stats","/player/fitness":"My Fitness",
  "/player/notifications":"Notifications",
};

export default function PlayerDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [collapsed, setCollapsed] = useState(false);

  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const userName = storedUser?.name || "Player";
  const initials = userName.split(" ").map(n=>n[0]).join("").toUpperCase().slice(0,2);

  const playerContext = { name:userName, position:"FWD #9", runs:320, wickets:12, fitness:95, coachRating:8.4, matches:15, strikeRate:88 };

  const isA = (p) => p==="/player" ? location.pathname==="/player" : location.pathname.startsWith(p);
  const title = TITLE_MAP[location.pathname] || "Overview";

  useEffect(()=>{ getMyNotifications().then(r=>{const d=r.data||[];setUnreadCount(d.filter(n=>!n.read).length)}).catch(()=>{}) },[location.pathname]);

  // Blue palette
  const A = "#3b82f6";

  return (
    <div style={{display:"flex",minHeight:"100vh",fontFamily:"'Outfit','DM Sans','Segoe UI',sans-serif",background:"#eff6ff"}}>

      {/* ──────── SIDEBAR ──────── */}
      <aside style={{
        width:collapsed?70:258, flexShrink:0,
        background:"linear-gradient(175deg,#0f172a 0%,#1e3a8a 35%,#1d4ed8 70%,#2563eb 100%)",
        display:"flex",flexDirection:"column",
        transition:"width 0.26s cubic-bezier(.4,0,.2,1)",overflow:"hidden",
        boxShadow:"8px 0 40px rgba(15,23,42,0.35)",position:"relative",zIndex:20,
      }}>
        <div style={{position:"absolute",top:-80,right:-50,width:220,height:220,borderRadius:"50%",background:"radial-gradient(circle,rgba(96,165,250,0.18) 0%,transparent 70%)",pointerEvents:"none"}}/>
        <div style={{position:"absolute",bottom:60,left:-60,width:180,height:180,borderRadius:"50%",background:"radial-gradient(circle,rgba(59,130,246,0.12) 0%,transparent 70%)",pointerEvents:"none"}}/>

        {/* Logo */}
        <div style={{padding:collapsed?"17px 15px":"17px 18px",borderBottom:"1px solid rgba(255,255,255,0.07)",display:"flex",alignItems:"center",gap:11,minHeight:70}}>
          <div style={{flexShrink:0,filter:"drop-shadow(0 4px 10px rgba(0,0,0,0.35))"}}><PlayerLogo/></div>
          {!collapsed&&<div style={{overflow:"hidden",flex:1}}>
            <div style={{fontWeight:800,fontSize:14.5,color:"#fff",whiteSpace:"nowrap"}}>Grassroot Club</div>
            <div style={{fontSize:9,fontWeight:700,letterSpacing:"0.16em",textTransform:"uppercase",background:"linear-gradient(90deg,#93c5fd,#bfdbfe)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>Player Portal</div>
          </div>}
          <button onClick={()=>setCollapsed(!collapsed)} style={{marginLeft:"auto",background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:8,width:26,height:26,cursor:"pointer",color:"rgba(255,255,255,0.6)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all 0.15s"}}
            onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.14)"}
            onMouseLeave={e=>e.currentTarget.style.background="rgba(255,255,255,0.07)"}>
            {collapsed?IC.chevR:IC.chevL}
          </button>
        </div>

        {/* Nav */}
        <div style={{flex:1,overflowY:"auto",padding:"8px 8px"}}>
          {NAV_DATA(unreadCount).map(sec=>(
            <div key={sec.label} style={{marginBottom:4}}>
              {!collapsed&&<div style={{fontSize:9,fontWeight:700,color:"rgba(147,197,253,0.5)",letterSpacing:"0.15em",textTransform:"uppercase",padding:"11px 10px 4px"}}>{sec.label}</div>}
              {sec.items.map(item=>{
                const active=isA(item.path);
                return (
                  <button key={item.path} onClick={()=>navigate(item.path)} title={collapsed?item.text:""}
                    style={{width:"100%",display:"flex",alignItems:"center",gap:9,padding:collapsed?"10px 0":"9px 11px",justifyContent:collapsed?"center":"flex-start",borderRadius:10,border:"none",cursor:"pointer",background:active?"linear-gradient(135deg,rgba(96,165,250,0.22),rgba(59,130,246,0.12))":"transparent",color:active?"#93c5fd":"rgba(255,255,255,0.5)",fontWeight:active?700:500,fontSize:13.5,marginBottom:2,boxShadow:active?"inset 0 0 0 1px rgba(96,165,250,0.3)":"none",transition:"all 0.15s ease",position:"relative"}}
                    onMouseEnter={e=>{if(!active){e.currentTarget.style.background="rgba(255,255,255,0.07)";e.currentTarget.style.color="rgba(255,255,255,0.88)"}}}
                    onMouseLeave={e=>{if(!active){e.currentTarget.style.background="transparent";e.currentTarget.style.color="rgba(255,255,255,0.5)"}}}>
                    <span style={{flexShrink:0,opacity:active?1:0.7}}>{item.icon}</span>
                    {!collapsed&&<><span style={{flex:1,textAlign:"left"}}>{item.text}</span>
                    {item.badge&&<span style={{background:item.red?"linear-gradient(135deg,#ef4444,#dc2626)":"linear-gradient(135deg,#60a5fa,#2563eb)",color:"#fff",fontSize:10,fontWeight:800,padding:"2px 8px",borderRadius:20,boxShadow:item.red?"0 2px 8px rgba(239,68,68,0.45)":"0 2px 8px rgba(59,130,246,0.45)"}}>{item.badge}</span>}</>}
                    {collapsed&&item.badge&&<span style={{position:"absolute",top:5,right:6,width:8,height:8,borderRadius:"50%",background:item.red?"#ef4444":"#60a5fa",border:"2px solid #1e3a8a"}}/>}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Profile footer */}
        <div onClick={()=>navigate("/player/profile")} style={{padding:collapsed?"13px 10px":"13px 15px",borderTop:"1px solid rgba(255,255,255,0.07)",display:"flex",alignItems:"center",gap:10,cursor:"pointer",transition:"background 0.15s",background:isA("/player/profile")?"rgba(96,165,250,0.12)":"transparent",justifyContent:collapsed?"center":"flex-start"}}
          onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.07)"}
          onMouseLeave={e=>e.currentTarget.style.background=isA("/player/profile")?"rgba(96,165,250,0.12)":"transparent"}>
          <div style={{width:36,height:36,borderRadius:10,flexShrink:0,background:"linear-gradient(135deg,#60a5fa,#2563eb)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:800,fontSize:13,boxShadow:"0 4px 14px rgba(59,130,246,0.5)"}}>
            {initials}
          </div>
          {!collapsed&&<div style={{overflow:"hidden",flex:1}}>
            <div style={{fontSize:13,fontWeight:700,color:"#fff",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{userName}</div>
            <div style={{fontSize:10,color:"rgba(147,197,253,0.65)",display:"flex",alignItems:"center",gap:4}}>{IC.user}<span>View Profile</span></div>
          </div>}
        </div>
      </aside>

      {/* ──────── MAIN ──────── */}
      <div style={{flex:1,display:"flex",flexDirection:"column",minWidth:0}}>
        <header style={{height:62,flexShrink:0,background:"linear-gradient(105deg,#fff 0%,#eff6ff 60%,#dbeafe 100%)",borderBottom:"1px solid rgba(37,99,235,0.12)",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 28px",boxShadow:"0 2px 20px rgba(37,99,235,0.08)"}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:4,height:30,borderRadius:3,background:"linear-gradient(180deg,#60a5fa,#2563eb)",boxShadow:"0 0 10px rgba(96,165,250,0.6)"}}/>
            <div>
              <div style={{fontSize:9.5,color:"#93c5fd",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase"}}>Player Portal</div>
              <div style={{fontSize:17,fontWeight:800,color:"#0f172a",letterSpacing:"-0.01em",lineHeight:1.1}}>{title}</div>
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            {/* Bell */}
            <button onClick={()=>navigate("/player/notifications")} style={{position:"relative",width:40,height:40,background:"linear-gradient(135deg,#eff6ff,#dbeafe)",border:"1px solid rgba(37,99,235,0.16)",borderRadius:12,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#2563eb",transition:"all 0.15s",boxShadow:"0 2px 10px rgba(37,99,235,0.1)"}}
              onMouseEnter={e=>e.currentTarget.style.boxShadow="0 4px 18px rgba(37,99,235,0.28)"}
              onMouseLeave={e=>e.currentTarget.style.boxShadow="0 2px 10px rgba(37,99,235,0.1)"}>
              {IC.bell}
              {unreadCount>0&&<span style={{position:"absolute",top:-3,right:-3,background:"linear-gradient(135deg,#ef4444,#dc2626)",color:"#fff",fontSize:8,fontWeight:800,borderRadius:"50%",width:16,height:16,display:"flex",alignItems:"center",justifyContent:"center",border:"2px solid #fff"}}>{unreadCount}</span>}
            </button>

            {/* Profile button */}
            <button
              onClick={()=>navigate("/player/profile")}
              style={{
                display:"flex",alignItems:"center",gap:6,
                height:40,padding:"0 16px",borderRadius:12,
                border:"1px solid rgba(37,99,235,0.16)",
                background: isA("/player/profile")
                  ? "linear-gradient(135deg,#dbeafe,#bfdbfe)"
                  : "linear-gradient(135deg,#fff,#eff6ff)",
                color:"#1d4ed8",fontWeight:700,fontSize:13,
                cursor:"pointer",transition:"all 0.15s",
                boxShadow: isA("/player/profile")
                  ? "0 4px 16px rgba(37,99,235,0.22)"
                  : "0 2px 8px rgba(37,99,235,0.08)",
              }}
              onMouseEnter={e=>e.currentTarget.style.boxShadow="0 4px 16px rgba(37,99,235,0.22)"}
              onMouseLeave={e=>e.currentTarget.style.boxShadow=isA("/player/profile")?"0 4px 16px rgba(37,99,235,0.22)":"0 2px 8px rgba(37,99,235,0.08)"}>
              {/* Mini avatar */}
              <div style={{width:22,height:22,borderRadius:7,background:"linear-gradient(135deg,#60a5fa,#2563eb)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:800,fontSize:9,flexShrink:0}}>
                {initials}
              </div>
              Profile
            </button>

            {/* Message Coach */}
            <button onClick={()=>navigate("/player/messages")} style={{display:"flex",alignItems:"center",gap:6,padding:"0 18px",height:40,borderRadius:12,border:"none",background:"linear-gradient(135deg,#60a5fa 0%,#3b82f6 50%,#2563eb 100%)",color:"#fff",fontWeight:700,fontSize:13,cursor:"pointer",boxShadow:"0 4px 16px rgba(37,99,235,0.42)",transition:"all 0.15s"}}
              onMouseEnter={e=>e.currentTarget.style.boxShadow="0 6px 24px rgba(37,99,235,0.58)"}
              onMouseLeave={e=>e.currentTarget.style.boxShadow="0 4px 16px rgba(37,99,235,0.42)"}>
              {IC.chat} Message Coach
            </button>
          </div>
        </header>
        <main style={{flex:1,overflowY:"auto",padding:28}}><Outlet/></main>
      </div>

      <ChatbotWidget playerContext={playerContext}/>
    </div>
  );
}