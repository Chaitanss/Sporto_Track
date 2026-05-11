import React, { useEffect, useState, useRef } from "react";
import API from "../../Services/api";
import useAI from "../../hooks/useAI";
import { aiPlayerComparison } from "../../Services/api";

const injectStyles = () => {
  if (document.getElementById("cp-styles")) return;
  const el = document.createElement("style");
  el.id = "cp-styles";
  el.innerHTML = `
    @keyframes cp-spin  { to { transform: rotate(360deg); } }
    @keyframes cp-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
    @keyframes cp-winner { 0%{transform:scale(1)} 50%{transform:scale(1.08)} 100%{transform:scale(1)} }
    .cp-sel:focus { outline: none; border-color: #7c3aed !important; }
    .cp-sel2:focus { outline: none; border-color: #db2777 !important; }
    .cp-card:hover { transform: translateY(-2px); }
    .cp-statrow:hover { background: #faf5ff !important; border-radius: 12px; }
  `;
  document.head.appendChild(el);
};

const DEMO = [
  { _id: "1", name: "Rahul Sharma", role: "Batsman", matches: 12, runs: 420, wickets: 0, impactRate: "High", rating: 8.6, fitness: 95, strikeRate: 135 },
  { _id: "2", name: "Amit Singh", role: "Bowler", matches: 12, runs: 80, wickets: 18, impactRate: "High", rating: 8.1, fitness: 90, strikeRate: 110 },
  { _id: "3", name: "Vikram Patel", role: "All-Rounder", matches: 10, runs: 250, wickets: 12, impactRate: "Medium", rating: 7.8, fitness: 85, strikeRate: 125 },
  { _id: "4", name: "Rohit Das", role: "Batsman", matches: 8, runs: 180, wickets: 0, impactRate: "Low", rating: 6.9, fitness: 60, strikeRate: 118 },
];

const PlayerComparisonAI = ({ p1, p2 }) => {
  const [narrative, setNarrative] = useState("");
  const [visible, setVisible] = useState(true);
  const { loading, error, callAI } = useAI();

  const handleNarrate = async () => {
    if (!p1 || !p2) return;
    const data = await callAI(() => aiPlayerComparison(p1, p2));
    if (data?.narrative) { setNarrative(data.narrative); setVisible(true); }
  };

  const canNarrate = p1 && p2 && p1._id !== p2._id;

  return (
    <div style={{ background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 20, padding: "20px 24px", marginTop: 20, boxShadow: "0 1px 4px #0000000a" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: narrative ? 14 : 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 18 }}>🤖</span>
          <div>
            <p style={{ color: "#111827", fontWeight: 700, fontSize: 13, margin: 0 }}>AI Comparison Narrator</p>
            <p style={{ color: "#9ca3af", fontSize: 11, margin: 0 }}>{p1 && p2 ? `${p1.name} vs ${p2.name}` : "Select two players above"}</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {narrative && (
            <button onClick={() => setVisible((v) => !v)} style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8, color: "#6b7280", fontSize: 11, padding: "5px 10px", cursor: "pointer" }}>
              {visible ? "▲ Hide" : "▼ Show"}
            </button>
          )}
          <button onClick={handleNarrate} disabled={loading || !canNarrate} style={{
            background: loading || !canNarrate ? "#f9fafb" : "#f5f3ff",
            border: loading || !canNarrate ? "1px solid #e5e7eb" : "1px solid #ddd6fe",
            borderRadius: 10, color: loading || !canNarrate ? "#9ca3af" : "#7c3aed",
            fontWeight: 700, fontSize: 12, padding: "8px 18px",
            cursor: loading || !canNarrate ? "not-allowed" : "pointer", transition: "all 0.2s",
          }}>
            {loading ? "Analysing..." : narrative ? "🔄 Re-narrate" : "✨ AI Narrate"}
          </button>
        </div>
      </div>
      {error && <p style={{ color: "#dc2626", fontSize: 11, marginTop: 8 }}>{error}</p>}
      {loading && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12 }}>
          <div style={{ width: 14, height: 14, border: "2px solid #e5e7eb", borderTop: "2px solid #7c3aed", borderRadius: "50%", animation: "cp-spin 0.8s linear infinite" }} />
          <p style={{ color: "#9ca3af", fontSize: 12, margin: 0 }}>Comparing {p1?.name} and {p2?.name}...</p>
        </div>
      )}
      {narrative && visible && !loading && (
        <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 14, padding: "14px 18px", marginTop: 12 }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
            <span style={{ background: "#f5f3ff", border: "1px solid #ddd6fe", borderRadius: 99, color: "#7c3aed", fontSize: 10, fontWeight: 700, padding: "3px 10px", letterSpacing: 1 }}>{p1?.name}</span>
            <span style={{ color: "#d1d5db", fontSize: 12, alignSelf: "center" }}>vs</span>
            <span style={{ background: "#fdf2f8", border: "1px solid #fbcfe8", borderRadius: 99, color: "#db2777", fontSize: 10, fontWeight: 700, padding: "3px 10px", letterSpacing: 1 }}>{p2?.name}</span>
          </div>
          <p style={{ color: "#4b5563", fontSize: 13.5, lineHeight: 1.75, margin: 0 }}>{narrative}</p>
        </div>
      )}
    </div>
  );
};

export default function ComparePlayers() {
  const [allPlayers, setAllPlayers] = useState([]);
  const [p1, setP1] = useState(null);
  const [p2, setP2] = useState(null);
  const [loading, setLoading] = useState(true);
  const [animIn, setAnimIn] = useState(false);
  const [activeView, setActiveView] = useState("bars");
  const canvasRef = useRef(null);

  useEffect(() => { injectStyles(); fetchPlayers(); }, []);
  useEffect(() => { if (!loading) setTimeout(() => setAnimIn(true), 80); }, [loading]);
  useEffect(() => { if (activeView === "radar" && p1 && p2 && canvasRef.current) drawRadar(); }, [activeView, p1, p2]);

  const fetchPlayers = async () => {
    try {
      const res = await API.get("/season/analyst");
      const raw = res.data || [];
      const mapped = raw.map((s) => ({
        _id: s._id, name: s.player?.name || "Unknown", role: s.player?.position || s.player?.role || "Player",
        matches: s.matches || 0, runs: s.runs || 0, wickets: s.wickets || 0,
        impactRate: s.impactRate || "Medium", rating: s.rating || 0,
        fitness: s.player?.fitness || 75,
        strikeRate: s.matches > 0 ? Math.round((s.runs / (s.matches * 20)) * 100) : 0,
      }));
      const list = mapped.length >= 2 ? mapped : DEMO;
      setAllPlayers(list); setP1(list[0]); setP2(list[1]);
    } catch {
      setAllPlayers(DEMO); setP1(DEMO[0]); setP2(DEMO[1]);
    } finally { setLoading(false); }
  };

  const drawRadar = () => {
    const canvas = canvasRef.current;
    if (!canvas || !p1 || !p2) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height, cx = W/2, cy = H/2, R = Math.min(W,H)/2-40;
    ctx.clearRect(0,0,W,H);
    const axes = ["Runs","Wickets","Strike","Rating","Fitness","Matches"];
    const maxVals = [600,40,200,10,100,20];
    const v1 = [p1.runs,p1.wickets,p1.strikeRate,p1.rating,p1.fitness,p1.matches];
    const v2 = [p2.runs,p2.wickets,p2.strikeRate,p2.rating,p2.fitness,p2.matches];
    const N = axes.length;
    const angle = (i) => (Math.PI*2*i)/N - Math.PI/2;
    for(let r=1;r<=5;r++){ctx.beginPath();for(let i=0;i<N;i++){const a=angle(i),rr=(R*r)/5;i===0?ctx.moveTo(cx+rr*Math.cos(a),cy+rr*Math.sin(a)):ctx.lineTo(cx+rr*Math.cos(a),cy+rr*Math.sin(a));}ctx.closePath();ctx.strokeStyle="#e5e7eb";ctx.lineWidth=1;ctx.stroke();}
    for(let i=0;i<N;i++){const a=angle(i);ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx+R*Math.cos(a),cy+R*Math.sin(a));ctx.strokeStyle="#e5e7eb";ctx.lineWidth=1;ctx.stroke();}
    const drawPolygon=(vals,color,fill)=>{ctx.beginPath();for(let i=0;i<N;i++){const a=angle(i),r=(Math.min(vals[i]/maxVals[i],1))*R;i===0?ctx.moveTo(cx+r*Math.cos(a),cy+r*Math.sin(a)):ctx.lineTo(cx+r*Math.cos(a),cy+r*Math.sin(a));}ctx.closePath();ctx.fillStyle=fill;ctx.fill();ctx.strokeStyle=color;ctx.lineWidth=2.5;ctx.stroke();};
    drawPolygon(v1,"#7c3aed","#7c3aed18");drawPolygon(v2,"#db2777","#db277718");
    [{vals:v1,color:"#7c3aed"},{vals:v2,color:"#db2777"}].forEach(({vals,color})=>{for(let i=0;i<N;i++){const a=angle(i),r=(Math.min(vals[i]/maxVals[i],1))*R;ctx.beginPath();ctx.arc(cx+r*Math.cos(a),cy+r*Math.sin(a),4,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();}});
    ctx.font="bold 11px sans-serif";ctx.textAlign="center";for(let i=0;i<N;i++){const a=angle(i);ctx.fillStyle="#9ca3af";ctx.fillText(axes[i].toUpperCase(),cx+(R+22)*Math.cos(a),cy+(R+22)*Math.sin(a)+4);}
  };

  if (loading) return (
    <div style={{ minHeight:"100vh",background:"#f9fafb",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center" }}>
      <div style={{ width:44,height:44,border:"3px solid #e5e7eb",borderTop:"3px solid #7c3aed",borderRadius:"50%",animation:"cp-spin 0.8s linear infinite" }} />
      <p style={{ color:"#7c3aed",marginTop:16,letterSpacing:4,fontSize:11,fontWeight:700 }}>LOADING PLAYERS</p>
    </div>
  );

  const STATS = [
    { key:"runs",       label:"Runs Scored",  max:600,  unit:"",   color1:"#7c3aed",color2:"#db2777",icon:"🏏" },
    { key:"wickets",    label:"Wickets",       max:40,   unit:"",   color1:"#7c3aed",color2:"#db2777",icon:"🎳" },
    { key:"strikeRate", label:"Strike Rate",   max:200,  unit:"%",  color1:"#7c3aed",color2:"#db2777",icon:"⚡" },
    { key:"rating",     label:"Rating",        max:10,   unit:"★",  color1:"#d97706",color2:"#d97706",icon:"⭐" },
    { key:"fitness",    label:"Fitness",       max:100,  unit:"%",  color1:"#059669",color2:"#059669",icon:"💪" },
    { key:"matches",    label:"Matches",       max:20,   unit:"",   color1:"#6d28d9",color2:"#9333ea",icon:"📅" },
  ];

  const getWinner = (key) => { if(!p1||!p2) return null; if(p1[key]>p2[key]) return 1; if(p2[key]>p1[key]) return 2; return 0; };
  let w1=0,w2=0; STATS.forEach(({key})=>{const w=getWinner(key);if(w===1)w1++;if(w===2)w2++;});
  const overallWinner = w1>w2?1:w2>w1?2:0;
  const initials = (name) => (name||"??").split(" ").map((w)=>w[0]).join("").slice(0,2).toUpperCase();

  return (
    <div style={{ minHeight:"100vh",background:"#f9fafb",padding:"32px 28px",position:"relative",overflow:"hidden",fontFamily:"'Segoe UI',sans-serif" }}>

      {/* HEADER */}
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:32,opacity:animIn?1:0,transform:animIn?"none":"translateY(-16px)",transition:"all 0.55s ease" }}>
        <div>
          <p style={{ fontSize:10,color:"#7c3aed",letterSpacing:5,fontWeight:700,marginBottom:6 }}>⚡ HEAD TO HEAD · SEASON 2025</p>
          <h1 style={{ fontSize:32,fontWeight:800,color:"#111827",margin:0,letterSpacing:0.5 }}>Compare Players</h1>
          <p style={{ color:"#9ca3af",fontSize:13,marginTop:6 }}>Select two players to generate a full stat comparison</p>
        </div>
        <div style={{ display:"flex",gap:4,background:"#f3f4f6",padding:4,borderRadius:12 }}>
          {[{id:"bars",label:"📊 Bars"},{id:"radar",label:"🕸 Radar"},{id:"cards",label:"🃏 Cards"}].map((v)=>(
            <button key={v.id} onClick={()=>{setActiveView(v.id);if(v.id==="radar")setTimeout(drawRadar,80);}}
              style={{ padding:"8px 18px",borderRadius:9,border:"none",cursor:"pointer",fontSize:12,fontWeight:700,transition:"all 0.2s",background:activeView===v.id?"#7c3aed":"transparent",color:activeView===v.id?"#ffffff":"#9ca3af",boxShadow:activeView===v.id?"0 2px 12px #7c3aed44":"none" }}>
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* PLAYER SELECTORS */}
      <div style={{ display:"grid",gridTemplateColumns:"1fr auto 1fr",gap:16,alignItems:"center",marginBottom:28,opacity:animIn?1:0,transition:"all 0.55s ease 0.1s" }}>
        <div style={{ background:"#ffffff",border:"1px solid #ddd6fe",borderRadius:20,padding:"20px 24px",boxShadow:"0 2px 16px #7c3aed11" }}>
          <div style={{ display:"flex",alignItems:"center",gap:14 }}>
            <div style={{ width:52,height:52,borderRadius:"50%",background:"#f5f3ff",border:"2px solid #a78bfa",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:800,color:"#7c3aed",flexShrink:0 }}>
              {p1?initials(p1.name):"P1"}
            </div>
            <div style={{ flex:1 }}>
              <p style={{ fontSize:10,color:"#7c3aed",letterSpacing:3,marginBottom:4,fontWeight:700 }}>PLAYER 1</p>
              <select className="cp-sel" value={p1?._id||""} onChange={(e)=>setP1(allPlayers.find((p)=>p._id===e.target.value))}
                style={{ background:"#f9fafb",border:"1px solid #ddd6fe",borderRadius:8,padding:"8px 12px",color:"#111827",fontSize:14,fontWeight:700,width:"100%",cursor:"pointer" }}>
                {allPlayers.map((p)=><option key={p._id} value={p._id}>{p.name}</option>)}
              </select>
              {p1&&<p style={{ color:"#9ca3af",fontSize:11,marginTop:4 }}>{p1.role} · {p1.matches} matches · {p1.impactRate} Impact</p>}
            </div>
          </div>
        </div>

        <div style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:6 }}>
          <div style={{ width:56,height:56,borderRadius:"50%",background:"#ffffff",border:"2px solid #e5e7eb",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:900,color:"#9ca3af",animation:"cp-float 3s ease infinite",boxShadow:"0 2px 12px #0000000f" }}>VS</div>
          {overallWinner!==0&&<div style={{ fontSize:10,color:overallWinner===1?"#7c3aed":"#db2777",fontWeight:700,letterSpacing:2,animation:"cp-winner 2s ease infinite" }}>{overallWinner===1?"◀ LEADS":"LEADS ▶"}</div>}
        </div>

        <div style={{ background:"#ffffff",border:"1px solid #fbcfe8",borderRadius:20,padding:"20px 24px",boxShadow:"0 2px 16px #db277711" }}>
          <div style={{ display:"flex",alignItems:"center",gap:14 }}>
            <div style={{ flex:1 }}>
              <p style={{ fontSize:10,color:"#db2777",letterSpacing:3,marginBottom:4,fontWeight:700,textAlign:"right" }}>PLAYER 2</p>
              <select className="cp-sel2" value={p2?._id||""} onChange={(e)=>setP2(allPlayers.find((p)=>p._id===e.target.value))}
                style={{ background:"#f9fafb",border:"1px solid #fbcfe8",borderRadius:8,padding:"8px 12px",color:"#111827",fontSize:14,fontWeight:700,width:"100%",cursor:"pointer",textAlign:"right" }}>
                {allPlayers.map((p)=><option key={p._id} value={p._id}>{p.name}</option>)}
              </select>
              {p2&&<p style={{ color:"#9ca3af",fontSize:11,marginTop:4,textAlign:"right" }}>{p2.role} · {p2.matches} matches · {p2.impactRate} Impact</p>}
            </div>
            <div style={{ width:52,height:52,borderRadius:"50%",background:"#fdf2f8",border:"2px solid #f9a8d4",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:800,color:"#db2777",flexShrink:0 }}>
              {p2?initials(p2.name):"P2"}
            </div>
          </div>
        </div>
      </div>

      {/* SCORE STRIP */}
      {p1&&p2&&(
        <div style={{ display:"flex",justifyContent:"center",gap:6,marginBottom:28,opacity:animIn?1:0,transition:"all 0.55s ease 0.18s" }}>
          <div style={{ background:"#f5f3ff",border:"1px solid #ddd6fe",borderRadius:99,padding:"6px 20px",fontSize:13,fontWeight:800,color:"#7c3aed" }}>{w1} WINS</div>
          <div style={{ background:"#f9fafb",border:"1px solid #e5e7eb",borderRadius:99,padding:"6px 14px",fontSize:12,color:"#9ca3af" }}>vs</div>
          <div style={{ background:"#fdf2f8",border:"1px solid #fbcfe8",borderRadius:99,padding:"6px 20px",fontSize:13,fontWeight:800,color:"#db2777" }}>{w2} WINS</div>
        </div>
      )}

      {/* BAR VIEW */}
      {activeView==="bars"&&p1&&p2&&(
        <div style={{ background:"#ffffff",border:"1px solid #e5e7eb",borderRadius:20,padding:"28px 32px",opacity:animIn?1:0,transition:"all 0.6s ease 0.25s",boxShadow:"0 1px 4px #0000000a" }}>
          <p style={{ fontSize:10,color:"#d1d5db",letterSpacing:3,fontWeight:700,marginBottom:20 }}>STATISTICAL COMPARISON</p>
          {STATS.map((stat,i)=>{
            const v1=p1[stat.key]||0,v2=p2[stat.key]||0;
            const pct1=Math.min((v1/stat.max)*100,100),pct2=Math.min((v2/stat.max)*100,100);
            const winner=getWinner(stat.key);
            return(
              <div key={stat.key} className="cp-statrow" style={{ padding:"16px 12px",borderRadius:12,marginBottom:6,transition:"background 0.2s" }}>
                <div style={{ display:"grid",gridTemplateColumns:"1fr auto 1fr",alignItems:"center",marginBottom:10 }}>
                  <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                    {winner===1&&<span style={{ fontSize:10,background:"#f5f3ff",color:"#7c3aed",padding:"2px 8px",borderRadius:99,fontWeight:700,border:"1px solid #ddd6fe" }}>WIN</span>}
                    <span style={{ fontSize:22,fontWeight:800,color:winner===1?"#7c3aed":"#d1d5db" }}>{stat.key==="rating"?v1.toFixed(1):v1}{stat.unit}</span>
                  </div>
                  <div style={{ textAlign:"center",padding:"0 16px" }}>
                    <span style={{ fontSize:11,color:"#9ca3af",letterSpacing:2 }}>{stat.icon} {stat.label.toUpperCase()}</span>
                  </div>
                  <div style={{ display:"flex",alignItems:"center",gap:8,justifyContent:"flex-end" }}>
                    <span style={{ fontSize:22,fontWeight:800,color:winner===2?"#db2777":"#d1d5db" }}>{stat.key==="rating"?v2.toFixed(1):v2}{stat.unit}</span>
                    {winner===2&&<span style={{ fontSize:10,background:"#fdf2f8",color:"#db2777",padding:"2px 8px",borderRadius:99,fontWeight:700,border:"1px solid #fbcfe8" }}>WIN</span>}
                  </div>
                </div>
                <div style={{ display:"grid",gridTemplateColumns:"1fr 4px 1fr",gap:4,alignItems:"center" }}>
                  <div style={{ display:"flex",justifyContent:"flex-end" }}>
                    <div style={{ height:8,width:"100%",background:"#f3f4f6",borderRadius:"99px 0 0 99px",overflow:"hidden",display:"flex",justifyContent:"flex-end" }}>
                      <div style={{ height:"100%",width:animIn?`${pct1}%`:"0%",background:winner===1?stat.color1:"#e5e7eb",borderRadius:"99px 0 0 99px",transition:`width 1s ease ${i*80+200}ms` }} />
                    </div>
                  </div>
                  <div style={{ width:4,height:16,background:"#e5e7eb",borderRadius:99 }} />
                  <div>
                    <div style={{ height:8,width:"100%",background:"#f3f4f6",borderRadius:"0 99px 99px 0",overflow:"hidden" }}>
                      <div style={{ height:"100%",width:animIn?`${pct2}%`:"0%",background:winner===2?stat.color2:"#e5e7eb",borderRadius:"0 99px 99px 0",transition:`width 1s ease ${i*80+200}ms` }} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* RADAR VIEW */}
      {activeView==="radar"&&p1&&p2&&(
        <div style={{ background:"#ffffff",border:"1px solid #e5e7eb",borderRadius:20,padding:28,display:"grid",gridTemplateColumns:"1fr auto",gap:32,alignItems:"center",boxShadow:"0 1px 4px #0000000a" }}>
          <div>
            <p style={{ fontSize:10,color:"#d1d5db",letterSpacing:3,fontWeight:700,marginBottom:16 }}>RADAR COMPARISON</p>
            <canvas ref={canvasRef} width={420} height={420} style={{ display:"block" }} />
            <div style={{ display:"flex",gap:20,marginTop:12 }}>
              <div style={{ display:"flex",alignItems:"center",gap:6 }}><div style={{ width:24,height:3,background:"#7c3aed",borderRadius:99 }} /><span style={{ fontSize:12,color:"#6b7280" }}>{p1.name}</span></div>
              <div style={{ display:"flex",alignItems:"center",gap:6 }}><div style={{ width:24,height:3,background:"#db2777",borderRadius:99 }} /><span style={{ fontSize:12,color:"#6b7280" }}>{p2.name}</span></div>
            </div>
          </div>
          <div style={{ minWidth:220 }}>
            <p style={{ fontSize:10,color:"#d1d5db",letterSpacing:3,fontWeight:700,marginBottom:16 }}>STAT BREAKDOWN</p>
            {STATS.map((stat)=>{const w=getWinner(stat.key);return(
              <div key={stat.key} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:"1px solid #f3f4f6" }}>
                <span style={{ fontSize:11,color:"#6b7280" }}>{stat.icon} {stat.label}</span>
                <div style={{ display:"flex",gap:8,alignItems:"center" }}>
                  <span style={{ fontSize:13,fontWeight:700,color:w===1?"#7c3aed":"#d1d5db" }}>{p1[stat.key]}</span>
                  <span style={{ color:"#e5e7eb",fontSize:10 }}>|</span>
                  <span style={{ fontSize:13,fontWeight:700,color:w===2?"#db2777":"#d1d5db" }}>{p2[stat.key]}</span>
                </div>
              </div>
            );})}
          </div>
        </div>
      )}

      {/* CARDS VIEW */}
      {activeView==="cards"&&p1&&p2&&(
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:20 }}>
          {[{player:p1,color:"#7c3aed",bg:"#f5f3ff",border:"#ddd6fe",wins:w1},{player:p2,color:"#db2777",bg:"#fdf2f8",border:"#fbcfe8",wins:w2}].map(({player,color,bg,border,wins},pi)=>(
            <div key={pi} className="cp-card" style={{ background:"#ffffff",border:`1px solid ${border}`,borderRadius:20,padding:28,transition:"transform 0.3s ease",boxShadow:`0 2px 16px ${color}11` }}>
              <div style={{ display:"flex",alignItems:"center",gap:16,marginBottom:24 }}>
                <div style={{ width:64,height:64,borderRadius:"50%",background:bg,border:`2px solid ${color}55`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,fontWeight:800,color }}>{initials(player.name)}</div>
                <div>
                  <h3 style={{ color:"#111827",fontWeight:800,margin:0,fontSize:18 }}>{player.name}</h3>
                  <p style={{ color:"#9ca3af",fontSize:12,margin:"4px 0 0" }}>{player.role}</p>
                  <span style={{ background:bg,color,padding:"2px 10px",borderRadius:99,fontSize:11,fontWeight:700 }}>{wins} WINS</span>
                </div>
              </div>
              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}>
                {STATS.map((stat)=>{
                  const val=player[stat.key];const w=getWinner(stat.key);const isWinner=(pi===0&&w===1)||(pi===1&&w===2);
                  return(
                    <div key={stat.key} style={{ background:isWinner?bg:"#f9fafb",border:`1px solid ${isWinner?border:"#e5e7eb"}`,borderRadius:12,padding:"14px 16px" }}>
                      <p style={{ fontSize:10,color:"#9ca3af",letterSpacing:2,marginBottom:4 }}>{stat.label.toUpperCase()}</p>
                      <p style={{ fontSize:24,fontWeight:800,color:isWinner?color:"#d1d5db",margin:0 }}>{stat.key==="rating"?val?.toFixed(1):val}{stat.unit}</p>
                      {isWinner&&<span style={{ fontSize:9,color,fontWeight:700,letterSpacing:2 }}>▲ WINNER</span>}
                    </div>
                  );
                })}
              </div>
              <div style={{ marginTop:20,padding:"14px 18px",background:overallWinner===pi+1?bg:"#f9fafb",border:`1px solid ${overallWinner===pi+1?border:"#e5e7eb"}`,borderRadius:12,textAlign:"center" }}>
                {overallWinner===pi+1?<p style={{ color,fontWeight:800,fontSize:14,margin:0 }}>🏆 OVERALL WINNER</p>:overallWinner===0?<p style={{ color:"#9ca3af",fontSize:13,margin:0 }}>🤝 It's a draw</p>:<p style={{ color:"#d1d5db",fontSize:13,margin:0 }}>Runner-up</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {(!p1||!p2)&&<div style={{ textAlign:"center",padding:"80px 0",color:"#d1d5db" }}><p style={{ fontSize:48 }}>⚔️</p><p style={{ fontSize:16,marginTop:12,color:"#9ca3af" }}>Select two players to start comparing</p></div>}
      {p1 && p2 && <PlayerComparisonAI p1={p1} p2={p2} />}
    </div>
  );
}