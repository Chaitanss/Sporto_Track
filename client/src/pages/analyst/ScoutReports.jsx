import React, { useState, useRef } from "react";
import * as XLSX from "xlsx";
import API from "../../Services/api";
import useAI from "../../hooks/useAI";
import { aiScoutReport } from "../../Services/api";

// ── Parameter configs (unchanged from original) ──────────────────
const BATTING_PARAMS  = ["battingAvg","strikeRate","runs","fifties","hundreds","fours","sixes"];
const BOWLING_PARAMS  = ["wickets","economy","bowlingAvg","maidens","fiveWickets"];
const FIELDING_PARAMS = ["catches","runOuts","stumpings"];
const FITNESS_PARAMS  = ["fitnessScore","speed","stamina","agility"];
const PARAM_META = {
  battingAvg:{label:"Batting Avg",max:100,cat:"batting"},strikeRate:{label:"Strike Rate",max:200,cat:"batting"},runs:{label:"Total Runs",max:1000,cat:"batting"},
  fifties:{label:"Fifties",max:20,cat:"batting"},hundreds:{label:"Hundreds",max:10,cat:"batting"},fours:{label:"Fours",max:100,cat:"batting"},sixes:{label:"Sixes",max:50,cat:"batting"},
  wickets:{label:"Wickets",max:50,cat:"bowling"},economy:{label:"Economy",max:12,cat:"bowling",invert:true},bowlingAvg:{label:"Bowling Avg",max:60,cat:"bowling",invert:true},
  maidens:{label:"Maidens",max:20,cat:"bowling"},fiveWickets:{label:"5-Wicket Haul",max:5,cat:"bowling"},
  catches:{label:"Catches",max:30,cat:"fielding"},runOuts:{label:"Run Outs",max:10,cat:"fielding"},stumpings:{label:"Stumpings",max:10,cat:"fielding"},
  fitnessScore:{label:"Fitness Score",max:100,cat:"fitness"},speed:{label:"Speed",max:100,cat:"fitness"},stamina:{label:"Stamina",max:100,cat:"fitness"},agility:{label:"Agility",max:100,cat:"fitness"},
};
const ALL_PARAMS = [...BATTING_PARAMS,...BOWLING_PARAMS,...FIELDING_PARAMS,...FITNESS_PARAMS];
const COL_MAP = {
  "batting avg":"battingAvg","batting average":"battingAvg","avg":"battingAvg","strike rate":"strikeRate","sr":"strikeRate","strikerate":"strikeRate",
  "runs":"runs","total runs":"runs","50s":"fifties","fifties":"fifties","half centuries":"fifties","100s":"hundreds","hundreds":"hundreds","centuries":"hundreds",
  "4s":"fours","fours":"fours","6s":"sixes","sixes":"sixes","wickets":"wickets","wkts":"wickets","economy":"economy","eco":"economy","economy rate":"economy",
  "bowling avg":"bowlingAvg","bowling average":"bowlingAvg","maidens":"maidens","maiden overs":"maidens","5 wicket":"fiveWickets","5w":"fiveWickets","five wickets":"fiveWickets",
  "catches":"catches","catch":"catches","run outs":"runOuts","runouts":"runOuts","run out":"runOuts","stumpings":"stumpings","stumping":"stumpings",
  "fitness":"fitnessScore","fitness score":"fitnessScore","speed":"speed","pace":"speed","stamina":"stamina","endurance":"stamina","agility":"agility",
  "name":"playerName","player name":"playerName","player":"playerName","role":"role","position":"role","type":"role","age":"age","team":"currentTeam","current team":"currentTeam","club":"currentTeam",
};
const calcOverall = (p) => {
  const role=(p.role||"").toLowerCase();let scores=[];
  if(role.includes("bat")){if(p.battingAvg)scores.push(Math.min((p.battingAvg/60)*100,100));if(p.strikeRate)scores.push(Math.min((p.strikeRate/150)*100,100));if(p.fitnessScore)scores.push(p.fitnessScore);}
  else if(role.includes("bowl")){if(p.wickets)scores.push(Math.min((p.wickets/30)*100,100));if(p.economy)scores.push(Math.max(100-(p.economy/12)*100,0));if(p.fitnessScore)scores.push(p.fitnessScore);}
  else if(role.includes("all")){if(p.battingAvg)scores.push(Math.min((p.battingAvg/50)*100,100));if(p.wickets)scores.push(Math.min((p.wickets/25)*100,100));if(p.fitnessScore)scores.push(p.fitnessScore);}
  else if(role.includes("keep")||role.includes("wk")){if(p.battingAvg)scores.push(Math.min((p.battingAvg/40)*100,100));if(p.stumpings)scores.push(Math.min((p.stumpings/10)*100,100));if(p.catches)scores.push(Math.min((p.catches/20)*100,100));if(p.fitnessScore)scores.push(p.fitnessScore);}
  if(scores.length===0){ALL_PARAMS.forEach((k)=>{const v=p[k];if(v!=null&&v!==""&&PARAM_META[k]){const meta=PARAM_META[k];scores.push(meta.invert?Math.max(100-(v/meta.max)*100,0):Math.min((v/meta.max)*100,100));}});}
  if(scores.length===0)return 0;
  return Math.round(scores.reduce((a,b)=>a+b,0)/scores.length);
};
const getPotential=(overall)=>{if(overall>=85)return{label:"Elite",color:"#7C3AED",bg:"rgba(124,58,237,0.10)"};if(overall>=75)return{label:"High",color:"#6D28D9",bg:"rgba(109,40,217,0.08)"};if(overall>=60)return{label:"Good",color:"#8B5CF6",bg:"rgba(139,92,246,0.08)"};return{label:"Developing",color:"#A78BFA",bg:"rgba(167,139,250,0.10)"};};
const ROLE_COLORS={batsman:{bg:"#EDE9FE",text:"#5B21B6",border:"#C4B5FD"},bowler:{bg:"#FCE7F3",text:"#9D174D",border:"#F9A8D4"},allrounder:{bg:"#D1FAE5",text:"#065F46",border:"#6EE7B7"},"all-rounder":{bg:"#D1FAE5",text:"#065F46",border:"#6EE7B7"},"wk-batsman":{bg:"#EDE9FE",text:"#5B21B6",border:"#C4B5FD"},wicketkeeper:{bg:"#EDE9FE",text:"#5B21B6",border:"#C4B5FD"}};
const getRoleStyle=(role="")=>{const key=role.toLowerCase().replace(/\s+/g,"");return ROLE_COLORS[key]||{bg:"#F3F4F6",text:"#6B7280",border:"#D1D5DB"};};
const barColor=(pct)=>{if(pct>=80)return"linear-gradient(90deg,#7C3AED,#6D28D9)";if(pct>=60)return"linear-gradient(90deg,#8B5CF6,#7C3AED)";if(pct>=40)return"linear-gradient(90deg,#A78BFA,#8B5CF6)";return"linear-gradient(90deg,#C4B5FD,#A78BFA)";};
const parseExcel=(file)=>new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=(e)=>{try{const wb=XLSX.read(e.target.result,{type:"binary"});const ws=wb.Sheets[wb.SheetNames[0]];const raw=XLSX.utils.sheet_to_json(ws,{defval:""});const players=raw.map((row,idx)=>{const p={_id:`excel_${idx}_${Date.now()}`};Object.entries(row).forEach(([col,val])=>{const mapped=COL_MAP[col.trim().toLowerCase()];if(mapped)p[mapped]=isNaN(val)||val===""?val:Number(val);});if(!p.playerName)p.playerName=`Player ${idx+1}`;if(!p.role)p.role="Batsman";p.overall=calcOverall(p);p.recommended=false;return p;});resolve(players);}catch(err){reject(err);}};reader.onerror=reject;reader.readAsBinaryString(file);});

// ═══════════════════════════════════════════════
// AI SCOUT REPORT GENERATOR
// ═══════════════════════════════════════════════
const ScoutReportAI = () => {
  const [form, setForm] = useState({ opponentName:"",weakness:"",tactic:"",notes:"",matchType:"T20" });
  const [report, setReport] = useState(null);
  const [expanded, setExpanded] = useState(true);
  const { loading, error, callAI } = useAI();

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleGenerate = async () => {
    if (!form.opponentName.trim()) return;
    const data = await callAI(() => aiScoutReport(form));
    if (data?.report) { setReport(data.report); setExpanded(true); }
  };

  return (
    <div style={{ background:"#fff",border:"1.5px solid #DDD6FE",borderRadius:16,overflow:"hidden",marginTop:20,boxShadow:"0 2px 16px rgba(124,58,237,0.06)" }}>
      <div style={{ padding:"14px 20px",background:"rgba(124,58,237,0.04)",borderBottom:"1.5px solid #DDD6FE",display:"flex",alignItems:"center",justifyContent:"space-between" }}>
        <div style={{ display:"flex",alignItems:"center",gap:10 }}>
          <span style={{ fontSize:18 }}>🔍</span>
          <div>
            <p style={{ color:"#3B0764",fontWeight:700,fontSize:13,margin:0 }}>AI Scout Report Generator</p>
            <p style={{ color:"#A78BFA",fontSize:10,margin:0 }}>Paste opposition info — AI generates full scouting report</p>
          </div>
        </div>
        {report && <button onClick={()=>setExpanded((e)=>!e)} style={{ background:"#F5F3FF",border:"1px solid #DDD6FE",borderRadius:8,color:"#7C3AED",fontSize:11,padding:"5px 10px",cursor:"pointer" }}>{expanded?"▲ Collapse":"▼ Expand"}</button>}
      </div>

      <div style={{ padding:"16px 20px" }}>
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12 }}>
          <div>
            <p style={{ fontSize:9,color:"#7C3AED",letterSpacing:3,fontWeight:700,marginBottom:5 }}>OPPONENT NAME *</p>
            <input name="opponentName" value={form.opponentName} onChange={handleChange} placeholder="e.g. Mumbai Strikers"
              style={{ width:"100%",background:"#F9F8FF",border:"1.5px solid #DDD6FE",borderRadius:10,padding:"8px 12px",color:"#3B0764",fontSize:12,outline:"none",boxSizing:"border-box" }} />
          </div>
          <div>
            <p style={{ fontSize:9,color:"#7C3AED",letterSpacing:3,fontWeight:700,marginBottom:5 }}>MATCH TYPE</p>
            <select name="matchType" value={form.matchType} onChange={handleChange}
              style={{ width:"100%",background:"#F9F8FF",border:"1.5px solid #DDD6FE",borderRadius:10,padding:"8px 12px",color:"#3B0764",fontSize:12,outline:"none" }}>
              {["T20","ODI","Test","T10"].map((t)=><option key={t} value={t} style={{ background:"#fff" }}>{t}</option>)}
            </select>
          </div>
        </div>
        <div style={{ marginBottom:10 }}>
          <p style={{ fontSize:9,color:"#7C3AED",letterSpacing:3,fontWeight:700,marginBottom:5 }}>THEIR WEAKNESS (optional)</p>
          <textarea name="weakness" value={form.weakness} onChange={handleChange} rows={2}
            placeholder="e.g. Struggles against left-arm pace in the powerplay..."
            style={{ width:"100%",background:"#F9F8FF",border:"1.5px solid #DDD6FE",borderRadius:10,padding:"8px 12px",color:"#3B0764",fontSize:12,outline:"none",resize:"none",boxSizing:"border-box" }} />
        </div>
        <div style={{ marginBottom:10 }}>
          <p style={{ fontSize:9,color:"#7C3AED",letterSpacing:3,fontWeight:700,marginBottom:5 }}>OUR TACTIC (optional)</p>
          <textarea name="tactic" value={form.tactic} onChange={handleChange} rows={2}
            placeholder="e.g. Open with spinners, target their top order early..."
            style={{ width:"100%",background:"#F9F8FF",border:"1.5px solid #DDD6FE",borderRadius:10,padding:"8px 12px",color:"#3B0764",fontSize:12,outline:"none",resize:"none",boxSizing:"border-box" }} />
        </div>
        <div style={{ marginBottom:14 }}>
          <p style={{ fontSize:9,color:"#7C3AED",letterSpacing:3,fontWeight:700,marginBottom:5 }}>EXTRA NOTES (optional)</p>
          <input name="notes" value={form.notes} onChange={handleChange} placeholder="e.g. Playing at home ground, key player injured..."
            style={{ width:"100%",background:"#F9F8FF",border:"1.5px solid #DDD6FE",borderRadius:10,padding:"8px 12px",color:"#3B0764",fontSize:12,outline:"none",boxSizing:"border-box" }} />
        </div>
        <button onClick={handleGenerate} disabled={loading||!form.opponentName.trim()} style={{
          width:"100%",background:loading||!form.opponentName.trim()?"#F3F4F6":"linear-gradient(135deg,#7C3AED,#6D28D9)",
          border:loading||!form.opponentName.trim()?"1.5px solid #E5E7EB":"none",borderRadius:12,
          color:loading||!form.opponentName.trim()?"#9CA3AF":"#fff",fontWeight:700,fontSize:13,padding:"11px 0",
          cursor:loading||!form.opponentName.trim()?"not-allowed":"pointer",transition:"all 0.2s",
        }}>
          {loading?"⏳ Generating Scout Report...":report?"🔄 Regenerate Report":"🔍 Generate AI Scout Report"}
        </button>
        {error&&<p style={{ color:"#DC2626",fontSize:11,marginTop:8 }}>{error}</p>}
      </div>

      {report&&expanded&&!loading&&(
        <div style={{ borderTop:"1.5px solid #DDD6FE",padding:"16px 20px",display:"flex",flexDirection:"column",gap:14 }}>
          <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:2 }}>
            <div style={{ width:4,height:36,background:"linear-gradient(180deg,#7C3AED,#A78BFA)",borderRadius:99,flexShrink:0 }} />
            <div>
              <p style={{ fontSize:9,color:"#7C3AED",letterSpacing:3,fontWeight:700,margin:0 }}>SCOUTING REPORT</p>
              <h3 style={{ color:"#3B0764",fontSize:16,fontWeight:800,margin:0 }}>{form.opponentName}</h3>
            </div>
          </div>
          {report.opponentSummary&&<div style={{ background:"#F9F8FF",border:"1.5px solid #DDD6FE",borderRadius:12,padding:"12px 14px" }}><p style={{ fontSize:9,color:"#7C3AED",letterSpacing:3,fontWeight:700,marginBottom:6 }}>OPPOSITION OVERVIEW</p><p style={{ color:"#4B5563",fontSize:13,lineHeight:1.65,margin:0 }}>{report.opponentSummary}</p></div>}
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10 }}>
            {report.keyThreats?.length>0&&(
              <div style={{ background:"#FFF1F2",border:"1.5px solid #FECDD3",borderRadius:12,padding:"12px 14px" }}>
                <p style={{ fontSize:9,color:"#BE123C",letterSpacing:3,fontWeight:700,marginBottom:8 }}>⚠️ KEY THREATS</p>
                {report.keyThreats.map((t,i)=><div key={i} style={{ display:"flex",gap:6,marginBottom:5 }}><span style={{ color:"#BE123C",fontSize:10,fontWeight:700,flexShrink:0 }}>•</span><p style={{ color:"#6B7280",fontSize:11,margin:0,lineHeight:1.5 }}>{t}</p></div>)}
              </div>
            )}
            {report.exploitableWeaknesses?.length>0&&(
              <div style={{ background:"#F5F3FF",border:"1.5px solid #DDD6FE",borderRadius:12,padding:"12px 14px" }}>
                <p style={{ fontSize:9,color:"#5B21B6",letterSpacing:3,fontWeight:700,marginBottom:8 }}>🎯 EXPLOIT THESE</p>
                {report.exploitableWeaknesses.map((w,i)=><div key={i} style={{ display:"flex",gap:6,marginBottom:5 }}><span style={{ color:"#7C3AED",fontSize:10,fontWeight:700,flexShrink:0 }}>•</span><p style={{ color:"#6B7280",fontSize:11,margin:0,lineHeight:1.5 }}>{w}</p></div>)}
              </div>
            )}
          </div>
          {report.recommendedTactics?.length>0&&(
            <div>
              <p style={{ fontSize:9,color:"#7C3AED",letterSpacing:3,fontWeight:700,marginBottom:8 }}>📋 TACTICAL GAMEPLAN</p>
              <div style={{ display:"flex",flexDirection:"column",gap:6 }}>
                {report.recommendedTactics.map((t,i)=>{const colors=[["#EDE9FE","#7C3AED","#DDD6FE"],["#FEF9C3","#92400E","#FDE68A"],["#FFF1F2","#BE123C","#FECDD3"]];const[bg,tc,bc]=colors[i]||["#F3F4F6","#374151","#D1D5DB"];return(
                  <div key={i} style={{ display:"flex",gap:12,background:"#F9F8FF",border:"1.5px solid #EDE9FE",borderRadius:10,padding:"10px 14px",alignItems:"flex-start" }}>
                    <span style={{ background:bg,border:`1px solid ${bc}`,borderRadius:6,color:tc,fontSize:9,fontWeight:700,padding:"3px 7px",whiteSpace:"nowrap",flexShrink:0,letterSpacing:1 }}>{t.phase?.toUpperCase()}</span>
                    <p style={{ color:"#4B5563",fontSize:12,margin:0,lineHeight:1.5 }}>{t.tactic}</p>
                  </div>
                );})}
              </div>
            </div>
          )}
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10 }}>
            {report.playerMatchups&&<div style={{ background:"#F5F3FF",border:"1.5px solid #DDD6FE",borderRadius:10,padding:"10px 12px" }}><p style={{ fontSize:9,color:"#7C3AED",letterSpacing:2,fontWeight:700,marginBottom:4 }}>🤝 MATCHUPS</p><p style={{ color:"#4B5563",fontSize:11,margin:0,lineHeight:1.5 }}>{report.playerMatchups}</p></div>}
            {report.overallVerdict&&<div style={{ background:"#FFFBEB",border:"1.5px solid #FDE68A",borderRadius:10,padding:"10px 12px" }}><p style={{ fontSize:9,color:"#92400E",letterSpacing:2,fontWeight:700,marginBottom:4 }}>⚖️ VERDICT</p><p style={{ color:"#4B5563",fontSize:11,margin:0,lineHeight:1.5,fontWeight:600 }}>{report.overallVerdict}</p></div>}
          </div>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════
// MAIN SCOUT REPORTS PAGE
// ═══════════════════════════════════════════════
export default function ScoutReports() {
  const [players,setPlayers]=useState([]);const [recommended,setRecommended]=useState([]);const [detailPlayer,setDetailPlayer]=useState(null);
  const [filterRole,setFilterRole]=useState("All");const [sortBy,setSortBy]=useState("overall");const [search,setSearch]=useState("");
  const [toast,setToast]=useState({msg:"",type:"success"});const [loading,setLoading]=useState(false);const [importing,setImporting]=useState(false);
  const [activeTab,setActiveTab]=useState("scouts");const fileRef=useRef();

  const showToast=(msg,type="success")=>{setToast({msg,type});setTimeout(()=>setToast({msg:"",type:"success"}),3500);};

  const handleFileChange=async(e)=>{const file=e.target.files[0];if(!file)return;setImporting(true);try{const parsed=await parseExcel(file);setPlayers(parsed);showToast(`✅ Imported ${parsed.length} players from Excel!`);}catch{showToast("❌ Failed to parse Excel. Check format.","error");}finally{setImporting(false);e.target.value="";}};

  const handleRecommend=(player)=>{if(recommended.find((r)=>r._id===player._id)){showToast(`${player.playerName} already shortlisted.`,"error");return;}setRecommended((prev)=>[...prev,{...player,recommended:true}]);setPlayers((prev)=>prev.map((p)=>p._id===player._id?{...p,recommended:true}:p));showToast(`⭐ ${player.playerName} shortlisted!`);};
  const handleRemoveRecommend=(id)=>{setRecommended((prev)=>prev.filter((r)=>r._id!==id));setPlayers((prev)=>prev.map((p)=>p._id===id?{...p,recommended:false}:p));};

  const handleSendToCoach=async(player)=>{setLoading(true);try{await API.post("/notifications/push-to-coach",{type:"scout_report",title:`🏏 Scout Report: ${player.playerName}`,message:`${player.role} · Age ${player.age||"N/A"} · Overall: ${player.overall}/100`,data:player});showToast(`✅ ${player.playerName}'s report sent to Coach!`);}catch(err){showToast(err.response?.data?.message||"Send failed ❌","error");}finally{setLoading(false);};};
  const handlePushAllToCoach=async()=>{if(!recommended.length)return showToast("No players shortlisted yet.","error");setLoading(true);try{await API.post("/notifications/push-to-coach",{type:"scout_shortlist",title:`📋 Scout Shortlist: ${recommended.length} Players`,message:recommended.map((r)=>`${r.playerName} (${r.role}, ${r.overall}/100)`).join(" | "),data:{shortlist:recommended}});showToast(`✅ Shortlist of ${recommended.length} players pushed to Coach!`);}catch(err){showToast(err.response?.data?.message||"Push failed ❌","error");}finally{setLoading(false);};};

  const roles=["All",...new Set(players.map((p)=>p.role).filter(Boolean))];
  const filtered=players.filter((p)=>filterRole==="All"||p.role===filterRole).filter((p)=>!search||p.playerName?.toLowerCase().includes(search.toLowerCase())||p.currentTeam?.toLowerCase().includes(search.toLowerCase())).sort((a,b)=>{if(sortBy==="overall")return b.overall-a.overall;if(sortBy==="name")return(a.playerName||"").localeCompare(b.playerName||"");if(sortBy==="age")return(a.age||99)-(b.age||99);return 0;});

  const avgOverall=players.length?Math.round(players.reduce((s,p)=>s+p.overall,0)/players.length):0;
  const elitePlayers=players.filter((p)=>p.overall>=85);
  const topBatsman=[...players].filter((p)=>p.role?.toLowerCase().includes("bat")).sort((a,b)=>(b.battingAvg||0)-(a.battingAvg||0))[0];
  const topBowler=[...players].filter((p)=>p.role?.toLowerCase().includes("bowl")).sort((a,b)=>(b.wickets||0)-(a.wickets||0))[0];
  const roleBreakdown=players.reduce((acc,p)=>{const r=p.role||"Unknown";acc[r]=(acc[r]||0)+1;return acc;},{});

  return (
    <div style={{ minHeight:"100vh",background:"#F5F3FF",fontFamily:"'Inter','Segoe UI',sans-serif" }}>
      {toast.msg&&<div style={{ position:"fixed",top:20,right:20,zIndex:999,padding:"12px 20px",borderRadius:12,fontSize:13,fontWeight:600,border:"1.5px solid",background:toast.type==="error"?"#FFF1F2":"#F5F3FF",borderColor:toast.type==="error"?"#FECDD3":"#DDD6FE",color:toast.type==="error"?"#BE123C":"#5B21B6",boxShadow:"0 4px 20px rgba(0,0,0,0.1)" }}>{toast.msg}</div>}

      {/* HEADER */}
      <div style={{ padding:"28px 32px 20px",borderBottom:"1.5px solid #DDD6FE",background:"#fff" }}>
        <div style={{ display:"flex",flexWrap:"wrap",alignItems:"center",justifyContent:"space-between",gap:16 }}>
          <div>
            <div style={{ display:"flex",alignItems:"center",gap:12,marginBottom:4 }}>
              <span style={{ fontSize:24 }}>🏏</span>
              <h1 style={{ fontSize:26,fontWeight:800,color:"#3B0764",margin:0,letterSpacing:"-0.5px" }}>Scout Reports</h1>
              <span style={{ fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:20,background:"#EDE9FE",color:"#5B21B6",border:"1px solid #DDD6FE" }}>ANALYST</span>
            </div>
            <p style={{ color:"#A78BFA",fontSize:13,margin:"0 0 0 36px" }}>Import Excel · Classify players · Shortlist for main team</p>
          </div>
          <div style={{ display:"flex",alignItems:"center",gap:10 }}>
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" style={{ display:"none" }} onChange={handleFileChange} />
            <button onClick={()=>fileRef.current.click()} disabled={importing} style={{ display:"flex",alignItems:"center",gap:8,padding:"9px 16px",borderRadius:10,fontSize:13,fontWeight:600,background:"#F5F3FF",border:"1.5px solid #DDD6FE",color:"#7C3AED",cursor:"pointer" }}>
              {importing?"⏳ Importing…":"📥 Import Excel"}
            </button>
            <button onClick={handlePushAllToCoach} disabled={loading||!recommended.length} style={{ display:"flex",alignItems:"center",gap:8,padding:"9px 18px",borderRadius:10,fontSize:13,fontWeight:700,background:"linear-gradient(135deg,#7C3AED,#6D28D9)",color:"#fff",border:"none",cursor:loading||!recommended.length?"not-allowed":"pointer",opacity:loading||!recommended.length?0.5:1 }}>
              ⬆ Push to Coach {recommended.length>0&&`(${recommended.length})`}
            </button>
          </div>
        </div>
        <div style={{ display:"flex",gap:4,marginTop:20 }}>
          {[["scouts","Scout Cards"],["insights","Team Insights"],["ai-scout","🔍 AI Scout Report"]].map(([id,label])=>(
            <button key={id} onClick={()=>setActiveTab(id)} style={{ padding:"8px 18px",borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer",transition:"all 0.15s",
              background:activeTab===id?"#EDE9FE":"transparent",
              color:activeTab===id?"#5B21B6":"#A78BFA",
              border:activeTab===id?"1.5px solid #DDD6FE":"1.5px solid transparent" }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding:"24px 32px" }}>

        {/* AI SCOUT REPORT TAB */}
        {activeTab==="ai-scout"&&<ScoutReportAI />}

        {/* EMPTY STATE */}
        {players.length===0&&activeTab!=="ai-scout"&&(
          <div style={{ textAlign:"center",padding:"80px 0" }}>
            <div style={{ fontSize:56,marginBottom:16 }}>📊</div>
            <p style={{ color:"#7C3AED",fontSize:18,fontWeight:600,margin:"0 0 8px" }}>No players imported yet</p>
            <p style={{ color:"#A78BFA",fontSize:14,margin:"0 0 20px" }}>Import an Excel file with player data to get started</p>
            <button onClick={()=>fileRef.current.click()} style={{ display:"inline-flex",alignItems:"center",gap:8,padding:"12px 24px",borderRadius:12,fontWeight:700,fontSize:14,background:"linear-gradient(135deg,#7C3AED,#6D28D9)",color:"#fff",border:"none",cursor:"pointer" }}>📥 Import Excel File</button>
          </div>
        )}

        {players.length>0&&activeTab==="scouts"&&(
          <>
            <div style={{ display:"flex",flexWrap:"wrap",alignItems:"center",gap:10,marginBottom:20 }}>
              <input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="🔍 Search player or club…"
                style={{ background:"#fff",border:"1.5px solid #DDD6FE",borderRadius:10,padding:"8px 14px",fontSize:13,color:"#3B0764",outline:"none",width:200 }} />
              <div style={{ display:"flex",gap:6,flexWrap:"wrap" }}>
                {roles.map((r)=><button key={r} onClick={()=>setFilterRole(r)} style={{ padding:"6px 12px",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer",
                  background:filterRole===r?"#EDE9FE":"#fff",color:filterRole===r?"#5B21B6":"#A78BFA",border:filterRole===r?"1.5px solid #DDD6FE":"1.5px solid #EDE9FE" }}>{r}</button>)}
              </div>
              <select value={sortBy} onChange={(e)=>setSortBy(e.target.value)} style={{ marginLeft:"auto",background:"#fff",border:"1.5px solid #DDD6FE",color:"#7C3AED",borderRadius:10,padding:"8px 12px",fontSize:12,outline:"none" }}>
                <option value="overall">Sort: Overall</option>
                <option value="name">Sort: Name</option>
                <option value="age">Sort: Age</option>
              </select>
              <span style={{ color:"#A78BFA",fontSize:12 }}>{filtered.length} players</span>
            </div>
            <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:20 }}>
              {filtered.map((player)=>(<ScoutCard key={player._id} player={player} onView={()=>setDetailPlayer(player)} onRecommend={()=>handleRecommend(player)} onSendToCoach={()=>handleSendToCoach(player)} />))}
            </div>
          </>
        )}

        {players.length>0&&activeTab==="insights"&&(
          <InsightsTab players={players} avgOverall={avgOverall} elitePlayers={elitePlayers} topBatsman={topBatsman} topBowler={topBowler} roleBreakdown={roleBreakdown} />
        )}

        {recommended.length>0&&(
          <div style={{ marginTop:28,borderRadius:16,overflow:"hidden",background:"#fff",border:"1.5px solid #DDD6FE",boxShadow:"0 2px 16px rgba(124,58,237,0.06)" }}>
            <div style={{ padding:"16px 24px",borderBottom:"1.5px solid #EDE9FE",background:"rgba(124,58,237,0.03)",display:"flex",alignItems:"center",justifyContent:"space-between" }}>
              <div><h2 style={{ fontWeight:700,color:"#3B0764",fontSize:15,margin:0 }}>⭐ Recommended for Main Team</h2><p style={{ color:"#A78BFA",fontSize:12,margin:"4px 0 0" }}>Shortlisted players for squad inclusion</p></div>
              <div style={{ display:"flex",alignItems:"center",gap:12 }}>
                <span style={{ fontSize:12,color:"#A78BFA" }}>{recommended.length} player{recommended.length!==1?"s":""} shortlisted</span>
                <button onClick={handlePushAllToCoach} disabled={loading} style={{ fontSize:12,fontWeight:700,padding:"8px 16px",borderRadius:10,background:"linear-gradient(135deg,#7C3AED,#6D28D9)",color:"#fff",border:"none",cursor:"pointer",opacity:loading?0.6:1 }}>⬆ Push All to Coach</button>
              </div>
            </div>
            <div>
              {recommended.map((player)=>{const pot=getPotential(player.overall);const rs=getRoleStyle(player.role);return(
                <div key={player._id} style={{ display:"flex",alignItems:"center",gap:16,padding:"14px 24px",borderBottom:"1px solid #F5F3FF",transition:"background 0.15s" }}
                  onMouseEnter={e=>e.currentTarget.style.background="#FAFAFA"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <div style={{ width:40,height:40,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:800,flexShrink:0,background:"#EDE9FE",color:"#5B21B6",border:"1.5px solid #DDD6FE" }}>{player.playerName?.split(" ").map((n)=>n[0]).join("").slice(0,2).toUpperCase()}</div>
                  <div style={{ flex:1,minWidth:0 }}>
                    <div style={{ display:"flex",alignItems:"center",gap:8 }}><p style={{ fontWeight:700,color:"#3B0764",fontSize:14,margin:0 }}>{player.playerName}</p><span style={{ fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:6,background:rs.bg,color:rs.text,border:`1px solid ${rs.border}` }}>{player.role}</span></div>
                    <p style={{ fontSize:12,color:"#A78BFA",margin:"2px 0 0" }}>{player.age?`Age ${player.age} · `:""}{player.currentTeam||"Club N/A"}</p>
                  </div>
                  <div style={{ display:"flex",alignItems:"center",gap:12 }}>
                    <div style={{ textAlign:"center" }}><p style={{ fontSize:22,fontWeight:800,margin:0,color:pot.color }}>{player.overall}</p><p style={{ fontSize:9,fontWeight:600,margin:0,color:pot.color }}>{pot.label}</p></div>
                    <button onClick={()=>handleRemoveRecommend(player._id)} style={{ fontSize:11,color:"#BE123C",padding:"6px 10px",borderRadius:8,background:"#FFF1F2",border:"1px solid #FECDD3",cursor:"pointer" }}>Remove</button>
                  </div>
                </div>
              );})}
            </div>
          </div>
        )}
      </div>

      {detailPlayer&&<PlayerDetailModal player={detailPlayer} onClose={()=>setDetailPlayer(null)} onRecommend={()=>{handleRecommend(detailPlayer);setDetailPlayer(null);}} onSendToCoach={()=>{handleSendToCoach(detailPlayer);setDetailPlayer(null);}} />}
    </div>
  );
}

function ScoutCard({player,onView,onRecommend,onSendToCoach}){
  const pot=getPotential(player.overall);const rs=getRoleStyle(player.role);
  const topParams=ALL_PARAMS.filter((k)=>player[k]!=null&&player[k]!==""&&player[k]>0&&PARAM_META[k]).slice(0,4);
  return(
    <div onClick={onView} style={{ borderRadius:16,overflow:"hidden",background:"#fff",border:`1.5px solid ${player.recommended?"#C4B5FD":"#EDE9FE"}`,boxShadow:player.recommended?"0 0 0 2px #DDD6FE,0 4px 20px rgba(124,58,237,0.12)":"0 2px 12px rgba(124,58,237,0.06)",cursor:"pointer",transition:"box-shadow 0.2s,transform 0.2s" }}
      onMouseEnter={e=>{e.currentTarget.style.boxShadow="0 6px 24px rgba(124,58,237,0.14)";e.currentTarget.style.transform="translateY(-2px)"}}
      onMouseLeave={e=>{e.currentTarget.style.boxShadow=player.recommended?"0 0 0 2px #DDD6FE,0 4px 20px rgba(124,58,237,0.12)":"0 2px 12px rgba(124,58,237,0.06)";e.currentTarget.style.transform="translateY(0)"}}>
      <div style={{ padding:"20px 20px 16px" }}>
        <div style={{ display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:14 }}>
          <div style={{ display:"flex",alignItems:"center",gap:12 }}>
            <div style={{ width:44,height:44,borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:800,flexShrink:0,background:"#EDE9FE",color:"#5B21B6",border:"1.5px solid #DDD6FE" }}>{player.playerName?.split(" ").map((n)=>n[0]).join("").slice(0,2).toUpperCase()}</div>
            <div><p style={{ fontWeight:700,color:"#3B0764",fontSize:14,margin:0 }}>{player.playerName}</p><p style={{ fontSize:11,color:"#A78BFA",margin:"2px 0 0" }}>{player.age?`Age ${player.age} · `:""}{player.currentTeam||"—"}</p></div>
          </div>
          <div style={{ display:"flex",alignItems:"flex-start",gap:6 }}>
            {player.recommended&&<span style={{ fontSize:9,fontWeight:700,padding:"2px 6px",borderRadius:4,background:"#EDE9FE",color:"#5B21B6",border:"1px solid #DDD6FE" }}>★ LISTED</span>}
            <span style={{ fontSize:10,fontWeight:700,padding:"4px 8px",borderRadius:8,background:rs.bg,color:rs.text,border:`1px solid ${rs.border}` }}>{player.role?.toUpperCase()}</span>
          </div>
        </div>
        <div style={{ display:"flex",alignItems:"center",gap:14,marginBottom:16 }}>
          <div style={{ fontSize:40,fontWeight:800,color:pot.color,lineHeight:1 }}>{player.overall}</div>
          <div>
            <div style={{ fontSize:10,color:"#A78BFA",fontWeight:600,textTransform:"uppercase",letterSpacing:2 }}>Overall</div>
            <div style={{ fontSize:11,fontWeight:700,marginTop:2,padding:"2px 8px",borderRadius:6,background:pot.bg,color:pot.color,display:"inline-block" }}>{pot.label}</div>
          </div>
          <div style={{ marginLeft:"auto" }}>
            <svg width="44" height="44" viewBox="0 0 44 44">
              <circle cx="22" cy="22" r="18" fill="none" stroke="#EDE9FE" strokeWidth="4"/>
              <circle cx="22" cy="22" r="18" fill="none" stroke={pot.color} strokeWidth="4" strokeLinecap="round" strokeDasharray={`${(player.overall/100)*113} 113`} transform="rotate(-90 22 22)"/>
            </svg>
          </div>
        </div>
        <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
          {topParams.map((key)=>{const meta=PARAM_META[key];const val=player[key];const pct=meta.invert?Math.max(100-(val/meta.max)*100,0):Math.min((val/meta.max)*100,100);return(
            <div key={key}>
              <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4 }}>
                <span style={{ fontSize:11,color:"#6B7280" }}>{meta.label}</span>
                <span style={{ fontSize:11,fontWeight:700,color:"#3B0764" }}>{val}</span>
              </div>
              <div style={{ height:6,borderRadius:99,overflow:"hidden",background:"#F3F4F6" }}>
                <div style={{ height:"100%",borderRadius:99,width:`${pct}%`,background:barColor(pct) }}/>
              </div>
            </div>
          );})}
        </div>
      </div>
      <div style={{ padding:"12px 20px",display:"flex",gap:8,borderTop:"1.5px solid #F5F3FF" }} onClick={(e)=>e.stopPropagation()}>
        <button onClick={onSendToCoach} style={{ flex:1,fontSize:12,fontWeight:700,padding:"8px 0",borderRadius:10,background:"#F5F3FF",color:"#7C3AED",border:"1.5px solid #DDD6FE",cursor:"pointer" }}>⬆ Send to Coach</button>
        <button onClick={onRecommend} disabled={player.recommended} style={{ flex:1,fontSize:12,fontWeight:700,padding:"8px 0",borderRadius:10,cursor:player.recommended?"not-allowed":"pointer",opacity:player.recommended?0.5:1,background:player.recommended?"#F9FAFB":"#FFFBEB",color:player.recommended?"#9CA3AF":"#92400E",border:`1.5px solid ${player.recommended?"#E5E7EB":"#FDE68A"}` }}>{player.recommended?"✓ Shortlisted":"⭐ Shortlist"}</button>
      </div>
    </div>
  );
}

function PlayerDetailModal({player,onClose,onRecommend,onSendToCoach}){
  const[activeTab,setActiveTab]=useState("batting");const pot=getPotential(player.overall);const rs=getRoleStyle(player.role);
  const renderParams=(keys)=>keys.filter((k)=>player[k]!=null&&player[k]!==""&&PARAM_META[k]).map((key)=>{const meta=PARAM_META[key];const val=player[key];const pct=meta.invert?Math.max(100-(val/meta.max)*100,0):Math.min((val/meta.max)*100,100);return(
    <div key={key} style={{ marginBottom:16 }}>
      <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6 }}>
        <span style={{ fontSize:13,color:"#6B7280" }}>{meta.label}</span>
        <span style={{ fontSize:13,fontWeight:700,color:"#3B0764" }}>{val}</span>
      </div>
      <div style={{ height:8,borderRadius:99,overflow:"hidden",background:"#F3F4F6" }}>
        <div style={{ height:"100%",borderRadius:99,width:`${pct}%`,background:barColor(pct) }}/>
      </div>
    </div>
  );});
  return(
    <div style={{ position:"fixed",inset:0,background:"rgba(59,7,100,0.35)",backdropFilter:"blur(4px)",zIndex:50,display:"flex",alignItems:"center",justifyContent:"center",padding:16,overflowY:"auto" }}>
      <div style={{ width:"100%",maxWidth:580,borderRadius:20,overflow:"hidden",background:"#fff",border:"1.5px solid #DDD6FE",boxShadow:"0 20px 60px rgba(124,58,237,0.18)" }}>
        <div style={{ padding:"24px 28px",borderBottom:"1.5px solid #EDE9FE" }}>
          <div style={{ display:"flex",alignItems:"flex-start",justifyContent:"space-between" }}>
            <div style={{ display:"flex",alignItems:"center",gap:16 }}>
              <div style={{ width:56,height:56,borderRadius:16,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:800,background:"#EDE9FE",color:"#5B21B6",border:"1.5px solid #DDD6FE" }}>{player.playerName?.split(" ").map((n)=>n[0]).join("").slice(0,2).toUpperCase()}</div>
              <div>
                <h2 style={{ fontSize:20,fontWeight:800,color:"#3B0764",margin:0 }}>{player.playerName}</h2>
                <div style={{ display:"flex",alignItems:"center",gap:8,marginTop:4 }}>
                  <span style={{ fontSize:11,fontWeight:700,padding:"2px 8px",borderRadius:8,background:rs.bg,color:rs.text,border:`1px solid ${rs.border}` }}>{player.role}</span>
                  {player.age&&<span style={{ fontSize:12,color:"#A78BFA" }}>Age {player.age}</span>}
                  {player.currentTeam&&<span style={{ fontSize:12,color:"#A78BFA" }}>· {player.currentTeam}</span>}
                </div>
              </div>
            </div>
            <div style={{ display:"flex",alignItems:"center",gap:16 }}>
              <div style={{ textAlign:"center" }}>
                <p style={{ fontSize:36,fontWeight:800,margin:0,color:pot.color }}>{player.overall}</p>
                <p style={{ fontSize:10,fontWeight:600,margin:0,color:pot.color }}>{pot.label}</p>
              </div>
              <button onClick={onClose} style={{ background:"#F5F3FF",border:"1.5px solid #DDD6FE",borderRadius:8,color:"#7C3AED",width:32,height:32,cursor:"pointer",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center" }}>×</button>
            </div>
          </div>
        </div>
        <div style={{ display:"flex",gap:4,padding:"16px 28px 0" }}>
          {[["batting","🏏 Batting"],["bowling","⚾ Bowling"],["fielding","🤸 Fielding"],["fitness","💪 Fitness"]].map(([id,label])=>(
            <button key={id} onClick={()=>setActiveTab(id)} style={{ padding:"6px 14px",borderRadius:8,fontSize:12,fontWeight:700,cursor:"pointer",background:activeTab===id?"#EDE9FE":"transparent",color:activeTab===id?"#5B21B6":"#A78BFA",border:activeTab===id?"1.5px solid #DDD6FE":"1.5px solid transparent" }}>{label}</button>
          ))}
        </div>
        <div style={{ padding:"20px 28px",minHeight:200 }}>
          {activeTab==="batting"&&(renderParams(BATTING_PARAMS).length?renderParams(BATTING_PARAMS):<p style={{ color:"#A78BFA",fontSize:13,textAlign:"center",padding:"40px 0" }}>No batting data</p>)}
          {activeTab==="bowling"&&(renderParams(BOWLING_PARAMS).length?renderParams(BOWLING_PARAMS):<p style={{ color:"#A78BFA",fontSize:13,textAlign:"center",padding:"40px 0" }}>No bowling data</p>)}
          {activeTab==="fielding"&&(renderParams(FIELDING_PARAMS).length?renderParams(FIELDING_PARAMS):<p style={{ color:"#A78BFA",fontSize:13,textAlign:"center",padding:"40px 0" }}>No fielding data</p>)}
          {activeTab==="fitness"&&(renderParams(FITNESS_PARAMS).length?renderParams(FITNESS_PARAMS):<p style={{ color:"#A78BFA",fontSize:13,textAlign:"center",padding:"40px 0" }}>No fitness data</p>)}
        </div>
        <div style={{ padding:"16px 28px",borderTop:"1.5px solid #EDE9FE",display:"flex",gap:10 }}>
          <button onClick={onSendToCoach} style={{ flex:1,padding:"12px 0",borderRadius:12,fontSize:13,fontWeight:700,background:"#F5F3FF",color:"#7C3AED",border:"1.5px solid #DDD6FE",cursor:"pointer" }}>⬆ Send to Coach</button>
          <button onClick={onRecommend} disabled={player.recommended} style={{ flex:1,padding:"12px 0",borderRadius:12,fontSize:13,fontWeight:700,cursor:player.recommended?"not-allowed":"pointer",opacity:player.recommended?0.5:1,background:player.recommended?"#F9FAFB":"#FFFBEB",color:player.recommended?"#9CA3AF":"#92400E",border:`1.5px solid ${player.recommended?"#E5E7EB":"#FDE68A"}` }}>{player.recommended?"✓ Already Shortlisted":"⭐ Shortlist for Main Team"}</button>
          <button onClick={onClose} style={{ padding:"12px 20px",borderRadius:12,fontSize:13,fontWeight:600,color:"#A78BFA",background:"#fff",border:"1.5px solid #EDE9FE",cursor:"pointer" }}>Close</button>
        </div>
      </div>
    </div>
  );
}

function InsightsTab({players,avgOverall,elitePlayers,topBatsman,topBowler,roleBreakdown}){
  return(
    <div style={{ display:"flex",flexDirection:"column",gap:20 }}>
      <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14 }}>
        {[{label:"Total Scouted",value:players.length,color:"#5B21B6",bg:"#EDE9FE",border:"#DDD6FE",icon:"👥"},{label:"Avg Overall",value:avgOverall,color:"#3B0764",bg:"#F5F3FF",border:"#DDD6FE",icon:"📊"},{label:"Elite Players",value:elitePlayers.length,color:"#92400E",bg:"#FFFBEB",border:"#FDE68A",icon:"⭐"},{label:"Roles Covered",value:Object.keys(roleBreakdown).length,color:"#065F46",bg:"#D1FAE5",border:"#6EE7B7",icon:"🎯"}].map((stat)=>(
          <div key={stat.label} style={{ borderRadius:14,padding:"20px",textAlign:"center",background:"#fff",border:`1.5px solid ${stat.border}`,boxShadow:"0 2px 8px rgba(124,58,237,0.06)" }}>
            <div style={{ fontSize:28,marginBottom:4 }}>{stat.icon}</div>
            <div style={{ fontSize:30,fontWeight:800,color:stat.color }}>{stat.value}</div>
            <div style={{ fontSize:11,color:"#A78BFA",marginTop:4,fontWeight:500 }}>{stat.label}</div>
          </div>
        ))}
      </div>
      <div style={{ borderRadius:14,padding:"20px 24px",background:"#fff",border:"1.5px solid #EDE9FE" }}>
        <h3 style={{ fontWeight:700,color:"#3B0764",marginBottom:16,fontSize:15 }}>Role Breakdown</h3>
        <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
          {Object.entries(roleBreakdown).map(([role,count])=>{const pct=Math.round((count/players.length)*100);const rs=getRoleStyle(role);return(
            <div key={role}>
              <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6 }}>
                <span style={{ fontSize:11,fontWeight:700,padding:"2px 8px",borderRadius:6,background:rs.bg,color:rs.text,border:`1px solid ${rs.border}` }}>{role}</span>
                <span style={{ fontSize:12,color:"#A78BFA" }}>{count} · {pct}%</span>
              </div>
              <div style={{ height:6,borderRadius:99,overflow:"hidden",background:"#F3F4F6" }}>
                <div style={{ height:"100%",borderRadius:99,width:`${pct}%`,background:rs.text }}/>
              </div>
            </div>
          );})}
        </div>
      </div>
    </div>
  );
}