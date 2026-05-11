// src/pages/analyst/AnalystDashboard.jsx
import React, { useState, useRef, useEffect } from "react";
import { useNavigate, Outlet, useLocation } from "react-router-dom";
import { getMyNotifications } from "../../Services/api";
import useAI from "../../hooks/useAI";
import { aiAnalystChat } from "../../Services/api";
import API from "../../Services/api";

const AnalystLogo = () => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
    <defs>
      <linearGradient id="al1" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#a78bfa"/>
        <stop offset="100%" stopColor="#6d28d9"/>
      </linearGradient>
    </defs>
    <rect width="40" height="40" rx="12" fill="url(#al1)"/>
    <rect x="8" y="22" width="5" height="11" rx="1.5" fill="white" fillOpacity="0.9"/>
    <rect x="15" y="16" width="5" height="17" rx="1.5" fill="white" fillOpacity="0.75"/>
    <rect x="22" y="11" width="5" height="22" rx="1.5" fill="white" fillOpacity="0.95"/>
    <polyline points="10,20 17,14 24,9 32,6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" strokeOpacity="0.6"/>
    <circle cx="32" cy="6" r="2.5" fill="white" fillOpacity="0.9"/>
  </svg>
);

const IC = {
  overview:  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  records:   <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  team:      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  player:    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  compare:   <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>,
  report:    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><circle cx="10" cy="14" r="2"/><path d="M20 17h-7"/><path d="M20 21h-7"/></svg>,
  scout:     <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  comms:     <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  broadcast: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13 19.79 19.79 0 0 1 1.61 4.39 2 2 0 0 1 3.6 2.21h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.18 6.18l1.28-1.28a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
  bell:      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  user:      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  chevL:     <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>,
  chevR:     <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>,
  upload:    <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>,
};

const NAV_DATA = (unreadCount) => [
  { label:"Analytics", items:[
    { text:"Overview",        icon:IC.overview, path:"/analyst" },
    { text:"Match Records",   icon:IC.records,  path:"/analyst/matches" },
    { text:"Team Analytics",  icon:IC.team,     path:"/analyst/team" },
    { text:"Player Analysis", icon:IC.player,   path:"/analyst/players" },
    { text:"Compare Players", icon:IC.compare,  path:"/analyst/compare" },
  ]},
  { label:"Reports", items:[
    { text:"Match Reports", icon:IC.report, path:"/analyst/reports", badge:"2" },
    { text:"Scout Reports", icon:IC.scout,  path:"/analyst/scout" },
  ]},
  { label:"Connect", items:[
    { text:"Communications", icon:IC.comms,     path:"/analyst/communications", badge:"4" },
    { text:"Broadcast",      icon:IC.broadcast, path:"/analyst/broadcast" },
    { text:"Notifications",  icon:IC.bell,      path:"/analyst/notifications", badge:unreadCount>0?String(unreadCount):null, red:true },
  ]},
];

const TITLE_MAP = {
  "/analyst/profile":"My Profile","/analyst/matches":"Match Records",
  "/analyst/team":"Team Analytics","/analyst/players":"Player Analysis",
  "/analyst/compare":"Compare Players","/analyst/reports":"Match Reports",
  "/analyst/scout":"Scout Reports","/analyst/communications":"Communications",
  "/analyst/broadcast":"Broadcast","/analyst/notifications":"Notifications",
};

/* ── Chatbot ── */
const AnalystChatbotWidget = ({ analystContext }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([{ role:"ai", text:"Hey! I'm your Data AI. Ask me anything — \"What's our average score in away matches?\" or \"Who has the best strike rate this season?\"" }]);
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);
  const { loading, callAI } = useAI();

  useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:"smooth"}) },[messages,isOpen]);

  const handleSend = async () => {
    const trimmed=input.trim(); if(!trimmed||loading) return;
    setMessages(p=>[...p,{role:"user",text:trimmed}]); setInput("");
    const data=await callAI(msg=>aiAnalystChat(msg,analystContext),trimmed);
    setMessages(p=>[...p,{role:"ai",text:data?.reply||"Sorry, I couldn't respond right now."}]);
  };
  const handleKeyDown=(e)=>{ if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();handleSend()} };
  const QUICK=["Average score in away matches?","Who has the best strike rate?","Our win rate this season?","Lowest fitness player?"];

  return (
    <>
      <button onClick={()=>setIsOpen(o=>!o)} style={{position:"fixed",bottom:28,right:28,width:54,height:54,borderRadius:"50%",background:isOpen?"linear-gradient(135deg,#6d28d9,#4c1d95)":"linear-gradient(135deg,#a78bfa,#7c3aed)",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 4px 24px rgba(124,58,237,0.45)",zIndex:9999,transition:"all 0.3s ease"}} title="Data AI Assistant">
        <svg width="22" height="22" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
      </button>
      {isOpen&&(
        <div style={{position:"fixed",bottom:96,right:28,width:340,height:480,background:"#fff",border:"1px solid #ede9fe",borderRadius:20,display:"flex",flexDirection:"column",zIndex:9998,boxShadow:"0 20px 60px rgba(124,58,237,0.2)",overflow:"hidden"}}>
          <div style={{padding:"14px 18px",background:"linear-gradient(135deg,#7c3aed,#6d28d9)",display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:32,height:32,borderRadius:"50%",background:"rgba(255,255,255,0.18)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <svg width="14" height="14" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
            </div>
            <div>
              <p style={{color:"#fff",fontWeight:700,fontSize:13,margin:0}}>Data Q&A AI</p>
              <p style={{color:"#ddd6fe",fontSize:10,margin:0,letterSpacing:1}}>● Powered by Groq</p>
            </div>
          </div>
          <div style={{flex:1,overflowY:"auto",padding:"12px 14px",display:"flex",flexDirection:"column",gap:8,background:"#faf9ff"}}>
            {messages.map((msg,i)=>(
              <div key={i} style={{display:"flex",justifyContent:msg.role==="user"?"flex-end":"flex-start"}}>
                <div style={{maxWidth:"82%",padding:"9px 13px",borderRadius:msg.role==="user"?"14px 14px 2px 14px":"14px 14px 14px 2px",background:msg.role==="user"?"linear-gradient(135deg,#7c3aed,#6d28d9)":"#fff",border:msg.role==="user"?"none":"1px solid #ede9fe",color:msg.role==="user"?"#fff":"#374151",fontSize:12.5,lineHeight:1.55,fontWeight:msg.role==="user"?600:400,boxShadow:msg.role!=="user"?"0 1px 4px rgba(0,0,0,0.06)":"none"}}>{msg.text}</div>
              </div>
            ))}
            {loading&&<div style={{display:"flex",justifyContent:"flex-start"}}><div style={{background:"#fff",border:"1px solid #ede9fe",borderRadius:"14px 14px 14px 2px",padding:"9px 14px",display:"flex",gap:4,alignItems:"center"}}>{[0,1,2].map(i=><div key={i} style={{width:6,height:6,borderRadius:"50%",background:"#7c3aed",opacity:0.4+i*0.2}}/>)}</div></div>}
            <div ref={bottomRef}/>
          </div>
          {messages.length===1&&<div style={{padding:"0 12px 10px",display:"flex",flexWrap:"wrap",gap:5,background:"#faf9ff"}}>{QUICK.map(q=><button key={q} onClick={()=>setInput(q)} style={{background:"#fff",border:"1px solid #ede9fe",borderRadius:8,color:"#7c3aed",fontSize:10,padding:"4px 9px",cursor:"pointer",fontWeight:600}}>{q}</button>)}</div>}
          <div style={{padding:"10px 12px",borderTop:"1px solid #ede9fe",display:"flex",gap:8,background:"#fff"}}>
            <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder="Ask about stats, players, matches..." disabled={loading} style={{flex:1,background:"#faf9ff",border:"1px solid #ede9fe",borderRadius:10,padding:"8px 12px",color:"#374151",fontSize:12,outline:"none"}}/>
            <button onClick={handleSend} disabled={loading||!input.trim()} style={{background:loading||!input.trim()?"#f5f3ff":"linear-gradient(135deg,#7c3aed,#6d28d9)",border:"none",borderRadius:10,padding:"8px 14px",color:loading||!input.trim()?"#c4b5fd":"#fff",fontWeight:700,fontSize:12,cursor:loading||!input.trim()?"not-allowed":"pointer"}}>Send</button>
          </div>
        </div>
      )}
    </>
  );
};

export default function AnalystDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [collapsed, setCollapsed] = useState(false);

  // ── Club name fetched from API ──────────────────────────────
  const [clubName, setClubName] = useState("FC Thunder");

  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const userName = storedUser?.name || "Analyst";
  const initials = userName.split(" ").map(n=>n[0]).join("").toUpperCase().slice(0,2);

  const isA = (p) => p==="/analyst" ? location.pathname==="/analyst" : location.pathname.startsWith(p);
  const title = TITLE_MAP[location.pathname] || "Overview";

  // ── Fetch club name on mount ────────────────────────────────
  useEffect(() => {
    API.get("/team/club-name")
      .then(r => { if (r.data?.clubName) setClubName(r.data.clubName); })
      .catch(() => {});
  }, []);

  useEffect(()=>{
    getMyNotifications()
      .then(r=>{ const d=r.data||[]; setUnreadCount(d.filter(n=>!n.read).length); })
      .catch(()=>{});
  },[location.pathname]);

  return (
    <div style={{display:"flex",minHeight:"100vh",fontFamily:"'Outfit','DM Sans','Segoe UI',sans-serif",background:"#f5f3ff"}}>

      {/* ──────── SIDEBAR ──────── */}
      <aside style={{
        width:collapsed?70:258, flexShrink:0,
        background:"linear-gradient(175deg,#1e0a3c 0%,#3b0764 30%,#5b21b6 65%,#7c3aed 100%)",
        display:"flex",flexDirection:"column",
        transition:"width 0.26s cubic-bezier(.4,0,.2,1)",overflow:"hidden",
        boxShadow:"8px 0 40px rgba(30,10,60,0.4)",position:"relative",zIndex:20,
      }}>
        <div style={{position:"absolute",top:-80,right:-50,width:220,height:220,borderRadius:"50%",background:"radial-gradient(circle,rgba(167,139,250,0.2) 0%,transparent 70%)",pointerEvents:"none"}}/>
        <div style={{position:"absolute",bottom:80,left:-60,width:180,height:180,borderRadius:"50%",background:"radial-gradient(circle,rgba(124,58,237,0.15) 0%,transparent 70%)",pointerEvents:"none"}}/>

        {/* Logo — shows live club name */}
        <div style={{padding:collapsed?"17px 15px":"17px 18px",borderBottom:"1px solid rgba(255,255,255,0.07)",display:"flex",alignItems:"center",gap:11,minHeight:70}}>
          <div style={{flexShrink:0,filter:"drop-shadow(0 4px 10px rgba(0,0,0,0.4))"}}><AnalystLogo/></div>
          {!collapsed&&<div style={{overflow:"hidden",flex:1}}>
            <div style={{fontWeight:800,fontSize:14.5,color:"#fff",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{clubName}</div>
            <div style={{fontSize:9,fontWeight:700,letterSpacing:"0.16em",textTransform:"uppercase",background:"linear-gradient(90deg,#c4b5fd,#ddd6fe)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>Analyst Hub</div>
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
              {!collapsed&&<div style={{fontSize:9,fontWeight:700,color:"rgba(196,181,253,0.5)",letterSpacing:"0.15em",textTransform:"uppercase",padding:"11px 10px 4px"}}>{sec.label}</div>}
              {sec.items.map(item=>{
                const active=isA(item.path);
                return (
                  <button key={item.path} onClick={()=>navigate(item.path)} title={collapsed?item.text:""}
                    style={{width:"100%",display:"flex",alignItems:"center",gap:9,padding:collapsed?"10px 0":"9px 11px",justifyContent:collapsed?"center":"flex-start",borderRadius:10,border:"none",cursor:"pointer",background:active?"linear-gradient(135deg,rgba(167,139,250,0.22),rgba(124,58,237,0.12))":"transparent",color:active?"#c4b5fd":"rgba(255,255,255,0.5)",fontWeight:active?700:500,fontSize:13.5,marginBottom:2,boxShadow:active?"inset 0 0 0 1px rgba(167,139,250,0.3)":"none",transition:"all 0.15s ease",position:"relative"}}
                    onMouseEnter={e=>{if(!active){e.currentTarget.style.background="rgba(255,255,255,0.07)";e.currentTarget.style.color="rgba(255,255,255,0.88)"}}}
                    onMouseLeave={e=>{if(!active){e.currentTarget.style.background="transparent";e.currentTarget.style.color="rgba(255,255,255,0.5)"}}}>
                    <span style={{flexShrink:0,opacity:active?1:0.7}}>{item.icon}</span>
                    {!collapsed&&<><span style={{flex:1,textAlign:"left"}}>{item.text}</span>
                    {item.badge&&<span style={{background:item.red?"linear-gradient(135deg,#ef4444,#dc2626)":"linear-gradient(135deg,#a78bfa,#7c3aed)",color:"#fff",fontSize:10,fontWeight:800,padding:"2px 8px",borderRadius:20,boxShadow:item.red?"0 2px 8px rgba(239,68,68,0.45)":"0 2px 8px rgba(124,58,237,0.45)"}}>{item.badge}</span>}</>}
                    {collapsed&&item.badge&&<span style={{position:"absolute",top:5,right:6,width:8,height:8,borderRadius:"50%",background:item.red?"#ef4444":"#a78bfa",border:"2px solid #3b0764"}}/>}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Profile footer */}
        <div onClick={()=>navigate("/analyst/profile")} style={{padding:collapsed?"13px 10px":"13px 15px",borderTop:"1px solid rgba(255,255,255,0.07)",display:"flex",alignItems:"center",gap:10,cursor:"pointer",transition:"background 0.15s",background:isA("/analyst/profile")?"rgba(167,139,250,0.12)":"transparent",justifyContent:collapsed?"center":"flex-start"}}
          onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.07)"}
          onMouseLeave={e=>e.currentTarget.style.background=isA("/analyst/profile")?"rgba(167,139,250,0.12)":"transparent"}>
          <div style={{width:36,height:36,borderRadius:10,flexShrink:0,background:"linear-gradient(135deg,#a78bfa,#7c3aed)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:800,fontSize:13,boxShadow:"0 4px 14px rgba(124,58,237,0.5)"}}>
            {initials}
          </div>
          {!collapsed&&<div style={{overflow:"hidden",flex:1}}>
            <div style={{fontSize:13,fontWeight:700,color:"#fff",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{userName}</div>
            <div style={{fontSize:10,color:"rgba(196,181,253,0.65)",display:"flex",alignItems:"center",gap:4}}>{IC.user}<span>View Profile</span></div>
          </div>}
        </div>
      </aside>

      {/* ──────── MAIN ──────── */}
      <div style={{flex:1,display:"flex",flexDirection:"column",minWidth:0}}>
        <header style={{height:62,flexShrink:0,background:"linear-gradient(105deg,#fff 0%,#f5f3ff 60%,#ede9fe 100%)",borderBottom:"1px solid rgba(124,58,237,0.12)",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 28px",boxShadow:"0 2px 20px rgba(124,58,237,0.08)"}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:4,height:30,borderRadius:3,background:"linear-gradient(180deg,#a78bfa,#7c3aed)",boxShadow:"0 0 10px rgba(167,139,250,0.6)"}}/>
            <div>
              <div style={{fontSize:9.5,color:"#a78bfa",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase"}}>Analyst Hub</div>
              <div style={{fontSize:17,fontWeight:800,color:"#1e0a3c",letterSpacing:"-0.01em",lineHeight:1.1}}>{title}</div>
            </div>
          </div>

          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <button onClick={()=>navigate("/analyst/notifications")} style={{position:"relative",width:40,height:40,background:"linear-gradient(135deg,#f5f3ff,#ede9fe)",border:"1px solid rgba(124,58,237,0.16)",borderRadius:12,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#7c3aed",transition:"all 0.15s",boxShadow:"0 2px 10px rgba(124,58,237,0.1)"}}
              onMouseEnter={e=>e.currentTarget.style.boxShadow="0 4px 18px rgba(124,58,237,0.28)"}
              onMouseLeave={e=>e.currentTarget.style.boxShadow="0 2px 10px rgba(124,58,237,0.1)"}>
              {IC.bell}
              {unreadCount>0&&<span style={{position:"absolute",top:-3,right:-3,background:"linear-gradient(135deg,#ef4444,#dc2626)",color:"#fff",fontSize:8,fontWeight:800,borderRadius:"50%",width:16,height:16,display:"flex",alignItems:"center",justifyContent:"center",border:"2px solid #fff"}}>{unreadCount}</span>}
            </button>

            <button
              onClick={()=>navigate("/analyst/profile")}
              style={{display:"flex",alignItems:"center",gap:6,height:40,padding:"0 16px",borderRadius:12,border:"1px solid rgba(124,58,237,0.16)",background:isA("/analyst/profile")?"linear-gradient(135deg,#ede9fe,#ddd6fe)":"linear-gradient(135deg,#fff,#f5f3ff)",color:"#6d28d9",fontWeight:700,fontSize:13,cursor:"pointer",transition:"all 0.15s",boxShadow:isA("/analyst/profile")?"0 4px 16px rgba(124,58,237,0.22)":"0 2px 8px rgba(124,58,237,0.08)"}}
              onMouseEnter={e=>e.currentTarget.style.boxShadow="0 4px 16px rgba(124,58,237,0.22)"}
              onMouseLeave={e=>e.currentTarget.style.boxShadow=isA("/analyst/profile")?"0 4px 16px rgba(124,58,237,0.22)":"0 2px 8px rgba(124,58,237,0.08)"}>
              <div style={{width:22,height:22,borderRadius:7,background:"linear-gradient(135deg,#a78bfa,#7c3aed)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:800,fontSize:9,flexShrink:0}}>
                {initials}
              </div>
              Profile
            </button>

            <button
              onClick={()=>navigate("/analyst/reports")}
              style={{display:"flex",alignItems:"center",gap:6,padding:"0 18px",height:40,borderRadius:12,border:"none",background:"linear-gradient(135deg,#a78bfa 0%,#7c3aed 50%,#6d28d9 100%)",color:"#fff",fontWeight:700,fontSize:13,cursor:"pointer",boxShadow:"0 4px 16px rgba(124,58,237,0.42)",transition:"all 0.15s"}}
              onMouseEnter={e=>e.currentTarget.style.boxShadow="0 6px 24px rgba(124,58,237,0.58)"}
              onMouseLeave={e=>e.currentTarget.style.boxShadow="0 4px 16px rgba(124,58,237,0.42)"}>
              {IC.upload} Push to Coach
            </button>
          </div>
        </header>

        <main style={{flex:1,overflowY:"auto",padding:28}}><Outlet/></main>
      </div>

      <AnalystChatbotWidget analystContext={{clubName, season:"2025", analystName:userName}}/>
    </div>
  );
}