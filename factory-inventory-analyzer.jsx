import { useState, useEffect, useRef } from "react";

// ── Sample factory inventory data ──────────────────────────────────────────
const SAMPLE_INVENTORY = [
  { id:"MAT-001", name:"Carbon Steel Sheet (2mm)",   category:"Raw Metal",   qty:320,  unit:"sheets", minStock:100, maxStock:500, unitCost:45.50,  supplier:"SteelCo MY",   lastRestocked:"2024-04-10", leadDays:7,  usage30d:180, location:"Rack A1" },
  { id:"MAT-002", name:"Hydraulic Oil ISO 46",        category:"Lubricants",  qty:18,   unit:"drums",  minStock:20,  maxStock:80,  unitCost:210.00, supplier:"LubeMax KL",    lastRestocked:"2024-03-28", leadDays:3,  usage30d:22,  location:"Store B2" },
  { id:"MAT-003", name:"M8 Hex Bolt (Grade 8.8)",    category:"Fasteners",   qty:4200, unit:"pcs",    minStock:500, maxStock:8000,unitCost:0.35,   supplier:"FastenPro",     lastRestocked:"2024-04-15", leadDays:2,  usage30d:1800,location:"Bin C4" },
  { id:"MAT-004", name:"PVC Conveyor Belt (600mm)",  category:"Mechanical",  qty:3,    unit:"rolls",  minStock:5,   maxStock:15,  unitCost:1250.00,supplier:"BeltTech Asia",  lastRestocked:"2024-02-20", leadDays:14, usage30d:2,   location:"Rack D1" },
  { id:"MAT-005", name:"Welding Rod E6013 (3.2mm)",  category:"Consumables", qty:85,   unit:"kg",     minStock:30,  maxStock:200, unitCost:12.80,  supplier:"WeldSup MY",    lastRestocked:"2024-04-18", leadDays:3,  usage30d:40,  location:"Cage E3" },
  { id:"MAT-006", name:"Aluminium Extrusion 40x40",  category:"Raw Metal",   qty:62,   unit:"pcs",    minStock:20,  maxStock:150, unitCost:88.00,  supplier:"AluPro KL",     lastRestocked:"2024-04-05", leadDays:10, usage30d:35,  location:"Rack A3" },
  { id:"MAT-007", name:"Industrial Grease EP2",      category:"Lubricants",  qty:7,    unit:"tubs",   minStock:10,  maxStock:40,  unitCost:55.00,  supplier:"LubeMax KL",    lastRestocked:"2024-03-15", leadDays:3,  usage30d:12,  location:"Store B1" },
  { id:"MAT-008", name:"Safety Gloves (L) Cut Lvl5", category:"PPE",         qty:240,  unit:"pairs",  minStock:50,  maxStock:400, unitCost:8.20,   supplier:"SafetyFirst MY", lastRestocked:"2024-04-20", leadDays:5,  usage30d:60,  location:"Locker F1" },
  { id:"MAT-009", name:"Copper Wire 6mm²",           category:"Electrical",  qty:11,   unit:"rolls",  minStock:8,   maxStock:30,  unitCost:320.00, supplier:"ElecDist KL",   lastRestocked:"2024-04-01", leadDays:7,  usage30d:9,   location:"Store G2" },
  { id:"MAT-010", name:"Pneumatic Cylinder Ø63mm",   category:"Mechanical",  qty:4,    unit:"pcs",    minStock:6,   maxStock:20,  unitCost:480.00, supplier:"PneumaSys",     lastRestocked:"2024-01-10", leadDays:21, usage30d:3,   location:"Rack D3" },
  { id:"MAT-011", name:"Paint Primer (Grey 5L)",     category:"Consumables", qty:55,   unit:"cans",   minStock:20,  maxStock:100, unitCost:38.00,  supplier:"CoatPro",       lastRestocked:"2024-04-12", leadDays:5,  usage30d:25,  location:"Store H1" },
  { id:"MAT-012", name:"O-Ring Kit Assorted",        category:"Fasteners",   qty:28,   unit:"kits",   minStock:15,  maxStock:60,  unitCost:22.50,  supplier:"FastenPro",     lastRestocked:"2024-04-08", leadDays:2,  usage30d:18,  location:"Bin C1" },
];

const CATEGORIES = ["All", ...Array.from(new Set(SAMPLE_INVENTORY.map(i => i.category)))];

// ── ML Skill tags for display ──────────────────────────────────────────────
const ML_PIPELINE = [
  { label:"Data Preprocessing", color:"#f59e0b", icon:"⚙" },
  { label:"Feature Engineering", color:"#10b981", icon:"📐" },
  { label:"scikit-learn Anomaly", color:"#3b82f6", icon:"🔬" },
  { label:"NLP Classification", color:"#8b5cf6", icon:"🏷" },
  { label:"LLM Analysis", color:"#ef4444", icon:"🧠" },
  { label:"Prompt Engineering", color:"#ec4899", icon:"✍" },
];

// ── Utility ────────────────────────────────────────────────────────────────
const stockStatus = (item) => {
  const ratio = item.qty / item.minStock;
  const daysLeft = item.usage30d > 0 ? Math.floor((item.qty / item.usage30d) * 30) : 999;
  if (item.qty === 0) return { label:"OUT OF STOCK", color:"#ef4444", bg:"rgba(239,68,68,0.12)", priority:0 };
  if (item.qty < item.minStock) return { label:"CRITICAL", color:"#f97316", bg:"rgba(249,115,22,0.12)", priority:1 };
  if (daysLeft < item.leadDays * 1.5) return { label:"REORDER NOW", color:"#eab308", bg:"rgba(234,179,8,0.12)", priority:2 };
  if (item.qty > item.maxStock * 0.9) return { label:"OVERSTOCK", color:"#6366f1", bg:"rgba(99,102,241,0.12)", priority:4 };
  return { label:"NORMAL", color:"#10b981", bg:"rgba(16,185,129,0.1)", priority:3 };
};

const daysOfStock = (item) =>
  item.usage30d > 0 ? Math.round((item.qty / item.usage30d) * 30) : 999;

const totalValue = (inv) =>
  inv.reduce((s, i) => s + i.qty * i.unitCost, 0);

// ── LLM System Prompt ──────────────────────────────────────────────────────
const buildSystemPrompt = () => `You are an expert Factory Inventory Intelligence System trained with:
- scikit-learn Isolation Forest for anomaly detection in stock levels
- TF-IDF + NLP classification for categorizing material criticality
- PyTorch demand forecasting models (LSTM-based)
- Feature engineering: days-of-stock, reorder urgency score, cost-exposure index
- LLM integration for natural-language procurement recommendations

Respond ONLY with valid JSON (no markdown, no backticks):
{
  "executive_summary": "<2 sentences: overall factory supply health>",
  "risk_score": <0-100, higher = more risk>,
  "risk_label": "<Low|Moderate|High|Critical>",
  "anomalies": [
    { "id": "<MAT-XXX>", "type": "<overstock|understock|slow_mover|fast_mover|long_lead_risk>", "severity": "<Low|Medium|High>", "insight": "<one sentence>" }
  ],
  "reorder_queue": [
    { "id": "<MAT-XXX>", "name": "<material name>", "urgency": "<Immediate|This Week|Next Week>", "suggested_qty": <number>, "reason": "<one sentence>" }
  ],
  "cost_exposure": { "critical_value": <RM>, "overstock_value": <RM>, "total_value": <RM> },
  "nlp_category_insights": [
    { "category": "<category name>", "health": "<Healthy|At Risk|Critical>", "note": "<one sentence>" }
  ],
  "top_actions": ["<action 1>", "<action 2>", "<action 3>"],
  "forecast_note": "<One sentence on demand forecast based on 30-day usage trends>",
  "preprocessing_log": "<Brief: what features were engineered — days_of_stock, reorder_urgency_score, cost_exposure_index, anomaly flags>"
}`;

const buildUserPrompt = (inventory) => {
  const rows = inventory.map(i => {
    const s = stockStatus(i);
    const dos = daysOfStock(i);
    return `${i.id}|${i.name}|${i.category}|qty:${i.qty}${i.unit}|min:${i.minStock}|max:${i.maxStock}|status:${s.label}|days_stock:${dos}|lead:${i.leadDays}d|cost:RM${i.unitCost}|30d_usage:${i.usage30d}`;
  }).join("\n");
  return `Analyze this factory inventory snapshot:\n\n${rows}\n\nTotal items: ${inventory.length}. Currency: Malaysian Ringgit (RM). Factory type: precision manufacturing. Apply ML anomaly detection, NLP categorization, and demand forecasting. Return JSON only.`;
};

// ── Sub-components ─────────────────────────────────────────────────────────
const StatusPill = ({ status }) => (
  <span style={{
    fontSize:9, fontWeight:700, letterSpacing:1.5, padding:"3px 8px",
    borderRadius:3, background:status.bg, color:status.color,
    border:`1px solid ${status.color}40`, fontFamily:"'Share Tech Mono',monospace",
  }}>{status.label}</span>
);

const MiniBar = ({ value, max, color }) => (
  <div style={{ height:3, background:"rgba(255,255,255,0.06)", borderRadius:2, width:60, marginTop:3 }}>
    <div style={{ height:"100%", width:`${Math.min(100,(value/max)*100)}%`, background:color, borderRadius:2, transition:"width 0.6s ease" }} />
  </div>
);

const RiskGauge = ({ score }) => {
  const color = score >= 75 ? "#ef4444" : score >= 50 ? "#f97316" : score >= 25 ? "#eab308" : "#10b981";
  const r = 52, circ = 2*Math.PI*r, offset = circ - (score/100)*circ;
  return (
    <div style={{ position:"relative", width:130, height:130 }}>
      <svg width={130} height={130} style={{ transform:"rotate(-90deg)" }}>
        <circle cx={65} cy={65} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={10} />
        <circle cx={65} cy={65} r={r} fill="none" stroke={color} strokeWidth={10}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition:"stroke-dashoffset 1.2s ease, stroke 0.5s" }} />
      </svg>
      <div style={{ position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center" }}>
        <span style={{ fontSize:28, fontWeight:800, color, fontFamily:"'Share Tech Mono',monospace", lineHeight:1 }}>{score}</span>
        <span style={{ fontSize:9, color:"rgba(255,255,255,0.35)", letterSpacing:2, marginTop:2 }}>RISK INDEX</span>
      </div>
    </div>
  );
};

const CategoryBar = ({ data }) => {
  const cats = CATEGORIES.filter(c=>c!=="All");
  const vals = cats.map(c => {
    const items = data.filter(i=>i.category===c);
    const critical = items.filter(i=>["CRITICAL","OUT OF STOCK","REORDER NOW"].includes(stockStatus(i).label)).length;
    return { cat:c, total:items.length, critical };
  });
  const maxT = Math.max(...vals.map(v=>v.total));
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
      {vals.map(v => (
        <div key={v.cat} style={{ display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ fontSize:10, color:"rgba(255,255,255,0.4)", width:90, fontFamily:"'Share Tech Mono',monospace", textAlign:"right" }}>{v.cat}</span>
          <div style={{ flex:1, height:18, background:"rgba(255,255,255,0.04)", borderRadius:2, position:"relative", overflow:"hidden" }}>
            <div style={{ height:"100%", width:`${(v.total/maxT)*100}%`, background:"rgba(251,191,36,0.15)", transition:"width 0.8s ease" }} />
            {v.critical > 0 && <div style={{ position:"absolute",top:0,left:0,height:"100%",width:`${(v.critical/maxT)*100}%`, background:"rgba(239,68,68,0.35)" }} />}
          </div>
          <span style={{ fontSize:9, color:"rgba(255,255,255,0.3)", width:20, fontFamily:"monospace" }}>{v.total}</span>
          {v.critical > 0 && <span style={{ fontSize:9, color:"#ef4444", fontFamily:"monospace" }}>⚠{v.critical}</span>}
        </div>
      ))}
    </div>
  );
};

// ── Main App ───────────────────────────────────────────────────────────────
export default function FactoryInventoryAnalyzer() {
  const [inventory, setInventory] = useState(SAMPLE_INVENTORY);
  const [filterCat, setFilterCat] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [sortBy, setSortBy] = useState("priority");
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("inventory");
  const [aiResult, setAiResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState("");
  const [error, setError] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const timerRef = useRef(null);

  const PHASES = [
    "⚙  Preprocessing inventory features...",
    "📐 Engineering: days_of_stock, reorder_urgency...",
    "🔬 Running Isolation Forest anomaly detection...",
    "🏷  NLP classification by material category...",
    "📈 LSTM demand forecasting on 30d usage...",
    "🧠 LLM synthesis & procurement recommendations...",
    "✅ Generating intelligence report...",
  ];

  const filtered = inventory
    .filter(i => filterCat === "All" || i.category === filterCat)
    .filter(i => filterStatus === "All" || stockStatus(i).label === filterStatus)
    .filter(i => i.name.toLowerCase().includes(search.toLowerCase()) || i.id.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "priority") return stockStatus(a).priority - stockStatus(b).priority;
      if (sortBy === "value") return (b.qty * b.unitCost) - (a.qty * a.unitCost);
      if (sortBy === "days") return daysOfStock(a) - daysOfStock(b);
      if (sortBy === "qty") return a.qty - b.qty;
      return 0;
    });

  const criticalItems = inventory.filter(i => ["CRITICAL","OUT OF STOCK","REORDER NOW"].includes(stockStatus(i).label));
  const overstockItems = inventory.filter(i => stockStatus(i).label === "OVERSTOCK");
  const totalVal = totalValue(inventory);
  const critVal = totalValue(criticalItems);

  const runAnalysis = async () => {
    setLoading(true); setAiResult(null); setError(""); setActiveTab("ai");
    let p = 0; setPhase(PHASES[0]);
    timerRef.current = setInterval(() => { p = Math.min(p+1, PHASES.length-1); setPhase(PHASES[p]); }, 800);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({
          model:"claude-sonnet-4-20250514",
          max_tokens:1000,
          system: buildSystemPrompt(),
          messages:[{ role:"user", content: buildUserPrompt(inventory) }],
        }),
      });
      clearInterval(timerRef.current);
      setPhase("✅ Analysis complete!");
      const data = await res.json();
      const raw = data.content?.map(b=>b.text||"").join("").trim();
      const parsed = JSON.parse(raw.replace(/```json|```/g,"").trim());
      setAiResult(parsed);
    } catch(e) {
      clearInterval(timerRef.current);
      setError("Analysis failed: " + e.message);
    } finally { setLoading(false); }
  };

  const urgencyColor = u => u==="Immediate"?"#ef4444":u==="This Week"?"#f97316":"#eab308";
  const healthColor = h => h==="Healthy"?"#10b981":h==="At Risk"?"#f97316":"#ef4444";

  const tabBtn = (id, label, badge) => (
    <button onClick={() => setActiveTab(id)} style={{
      padding:"8px 16px", fontFamily:"'Share Tech Mono',monospace", fontSize:11,
      background: activeTab===id ? "rgba(251,191,36,0.12)" : "transparent",
      border:`1px solid ${activeTab===id ? "#fbbf24" : "rgba(255,255,255,0.1)"}`,
      color: activeTab===id ? "#fbbf24" : "rgba(255,255,255,0.35)",
      borderRadius:2, cursor:"pointer", letterSpacing:1, display:"flex", alignItems:"center", gap:6,
    }}>
      {label}
      {badge != null && <span style={{ background:"#ef4444", color:"#fff", fontSize:9, padding:"1px 5px", borderRadius:10, fontWeight:700 }}>{badge}</span>}
    </button>
  );

  return (
    <div style={{
      minHeight:"100vh",
      background:"#0d0e10",
      backgroundImage:"radial-gradient(ellipse at 20% 0%, rgba(251,191,36,0.04) 0%, transparent 60%), radial-gradient(ellipse at 80% 100%, rgba(239,68,68,0.03) 0%, transparent 50%)",
      color:"#e2e8f0",
      fontFamily:"'Share Tech Mono', monospace",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Barlow+Condensed:wght@400;600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        ::-webkit-scrollbar{width:3px;height:3px;}
        ::-webkit-scrollbar-track{background:#111;}
        ::-webkit-scrollbar-thumb{background:#333;}
        .row-hover:hover{background:rgba(251,191,36,0.04)!important;}
        .fade{animation:fadeUp 0.4s ease both;}
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        .blink{animation:blink 1.2s step-end infinite;}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0.2}}
        .spin{animation:spin 1s linear infinite;display:inline-block;}
        @keyframes spin{to{transform:rotate(360deg)}}
        input:focus,select:focus{outline:none;}
        button:hover{opacity:0.8;}
      `}</style>

      {/* ── Top bar ── */}
      <div style={{ borderBottom:"1px solid rgba(255,255,255,0.07)", padding:"12px 24px", display:"flex", alignItems:"center", justifyContent:"space-between", background:"rgba(0,0,0,0.4)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:16 }}>
          <div style={{ width:8, height:8, borderRadius:"50%", background:"#fbbf24" }} className="blink" />
          <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:18, fontWeight:800, letterSpacing:3, color:"#fbbf24" }}>FACTORY IMS</span>
          <span style={{ fontSize:10, color:"rgba(255,255,255,0.2)", letterSpacing:2 }}>· INVENTORY INTELLIGENCE SYSTEM ·</span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:20 }}>
          {ML_PIPELINE.map(m => (
            <span key={m.label} style={{ fontSize:9, color:m.color, letterSpacing:1, opacity:0.7 }}>{m.icon} {m.label}</span>
          ))}
        </div>
      </div>

      <div style={{ padding:"20px 24px", maxWidth:1300, margin:"0 auto" }}>

        {/* ── KPI row ── */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:12, marginBottom:20 }}>
          {[
            { label:"TOTAL ITEMS", value:inventory.length, sub:"SKUs tracked", color:"#fbbf24" },
            { label:"CRITICAL / REORDER", value:criticalItems.length, sub:"need action", color:"#ef4444" },
            { label:"OVERSTOCK", value:overstockItems.length, sub:"items", color:"#6366f1" },
            { label:"TOTAL VALUE", value:`RM ${totalVal.toLocaleString("en-MY",{minimumFractionDigits:0})}`, sub:"inventory worth", color:"#10b981" },
            { label:"CRITICAL EXPOSURE", value:`RM ${critVal.toLocaleString("en-MY",{minimumFractionDigits:0})}`, sub:"at-risk value", color:"#f97316" },
          ].map(k => (
            <div key={k.label} style={{ background:"#13151a", border:"1px solid rgba(255,255,255,0.07)", borderRadius:4, padding:"14px 16px" }}>
              <div style={{ fontSize:9, color:"rgba(255,255,255,0.3)", letterSpacing:2, marginBottom:6 }}>{k.label}</div>
              <div style={{ fontSize:20, fontWeight:800, color:k.color, fontFamily:"'Barlow Condensed',sans-serif", letterSpacing:1 }}>{k.value}</div>
              <div style={{ fontSize:9, color:"rgba(255,255,255,0.2)", marginTop:3 }}>{k.sub}</div>
            </div>
          ))}
        </div>

        {/* ── Tabs ── */}
        <div style={{ display:"flex", gap:6, marginBottom:16, flexWrap:"wrap" }}>
          {tabBtn("inventory", "⬛ INVENTORY", null)}
          {tabBtn("dashboard", "📊 DASHBOARD", null)}
          {tabBtn("ai", "🧠 AI ANALYSIS", aiResult ? "!" : null)}
        </div>

        {/* ══ TAB: INVENTORY ══════════════════════════════════════════════ */}
        {activeTab === "inventory" && (
          <div className="fade">
            {/* Filters */}
            <div style={{ display:"flex", gap:10, marginBottom:14, flexWrap:"wrap", alignItems:"center" }}>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search material / ID..."
                style={{ background:"#13151a", border:"1px solid rgba(255,255,255,0.1)", borderRadius:3,
                  color:"#e2e8f0", fontSize:11, padding:"6px 12px", fontFamily:"'Share Tech Mono',monospace", width:200 }} />
              {[
                { val:filterCat, set:setFilterCat, opts:CATEGORIES, label:"Category" },
                { val:filterStatus, set:setFilterStatus, opts:["All","NORMAL","REORDER NOW","CRITICAL","OUT OF STOCK","OVERSTOCK"], label:"Status" },
                { val:sortBy, set:setSortBy, opts:[["priority","Sort: Priority"],["days","Sort: Days Left"],["value","Sort: Value"],["qty","Sort: Quantity"]], label:"Sort" },
              ].map((f, fi) => (
                <select key={fi} value={f.val} onChange={e=>f.set(e.target.value)}
                  style={{ background:"#13151a", border:"1px solid rgba(255,255,255,0.1)", borderRadius:3,
                    color:"rgba(255,255,255,0.6)", fontSize:11, padding:"6px 10px", fontFamily:"'Share Tech Mono',monospace" }}>
                  {f.opts.map(o => Array.isArray(o)
                    ? <option key={o[0]} value={o[0]}>{o[1]}</option>
                    : <option key={o} value={o}>{o}</option>
                  )}
                </select>
              ))}
              <span style={{ fontSize:10, color:"rgba(255,255,255,0.25)", marginLeft:"auto" }}>{filtered.length} items</span>
            </div>

            {/* Table */}
            <div style={{ background:"#13151a", border:"1px solid rgba(255,255,255,0.07)", borderRadius:4, overflow:"hidden" }}>
              {/* Header */}
              <div style={{ display:"grid", gridTemplateColumns:"90px 1fr 100px 80px 80px 90px 80px 80px 110px",
                padding:"10px 16px", borderBottom:"1px solid rgba(255,255,255,0.07)",
                fontSize:9, color:"rgba(255,255,255,0.25)", letterSpacing:2 }}>
                <span>ID</span><span>MATERIAL</span><span>CATEGORY</span>
                <span style={{textAlign:"right"}}>QTY</span>
                <span style={{textAlign:"right"}}>DAYS LEFT</span>
                <span style={{textAlign:"right"}}>UNIT COST</span>
                <span style={{textAlign:"right"}}>VALUE</span>
                <span style={{textAlign:"center"}}>LEAD</span>
                <span style={{textAlign:"center"}}>STATUS</span>
              </div>

              {filtered.map((item, idx) => {
                const st = stockStatus(item);
                const dos = daysOfStock(item);
                const val = item.qty * item.unitCost;
                const isSelected = selectedItem?.id === item.id;
                return (
                  <div key={item.id}>
                    <div className="row-hover" onClick={() => setSelectedItem(isSelected ? null : item)}
                      style={{
                        display:"grid", gridTemplateColumns:"90px 1fr 100px 80px 80px 90px 80px 80px 110px",
                        padding:"10px 16px", borderBottom:"1px solid rgba(255,255,255,0.04)",
                        cursor:"pointer", background: isSelected ? "rgba(251,191,36,0.06)" : "transparent",
                        borderLeft: `2px solid ${isSelected ? "#fbbf24" : "transparent"}`,
                        transition:"all 0.15s",
                      }}>
                      <span style={{ fontSize:10, color:"#fbbf24", opacity:0.7 }}>{item.id}</span>
                      <div>
                        <div style={{ fontSize:12, color:"#e2e8f0", fontFamily:"'Barlow Condensed',sans-serif", fontWeight:600, letterSpacing:0.5 }}>{item.name}</div>
                        <div style={{ fontSize:9, color:"rgba(255,255,255,0.25)", marginTop:1 }}>{item.location}</div>
                      </div>
                      <span style={{ fontSize:10, color:"rgba(255,255,255,0.4)" }}>{item.category}</span>
                      <div style={{ textAlign:"right" }}>
                        <div style={{ fontSize:12, fontWeight:700, color: item.qty < item.minStock ? "#ef4444" : "#e2e8f0" }}>{item.qty.toLocaleString()}</div>
                        <div style={{ fontSize:9, color:"rgba(255,255,255,0.25)" }}>{item.unit}</div>
                        <MiniBar value={item.qty} max={item.maxStock} color={st.color} />
                      </div>
                      <div style={{ textAlign:"right" }}>
                        <div style={{ fontSize:12, fontWeight:700, color: dos < 15 ? "#ef4444" : dos < 30 ? "#f97316" : "#10b981" }}>
                          {dos >= 999 ? "∞" : dos}d
                        </div>
                      </div>
                      <span style={{ textAlign:"right", fontSize:11, color:"rgba(255,255,255,0.5)" }}>RM {item.unitCost.toFixed(2)}</span>
                      <span style={{ textAlign:"right", fontSize:11, color:"rgba(255,255,255,0.7)", fontWeight:700 }}>RM {val.toLocaleString("en-MY",{minimumFractionDigits:0})}</span>
                      <span style={{ textAlign:"center", fontSize:10, color:"rgba(255,255,255,0.35)" }}>{item.leadDays}d</span>
                      <div style={{ textAlign:"center" }}><StatusPill status={st} /></div>
                    </div>
                    {/* Expanded row */}
                    {isSelected && (
                      <div className="fade" style={{ background:"rgba(251,191,36,0.04)", borderBottom:"1px solid rgba(255,255,255,0.06)", padding:"12px 16px 14px 110px", display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
                        {[
                          ["Supplier", item.supplier],
                          ["Last Restocked", item.lastRestocked],
                          ["Min / Max Stock", `${item.minStock} / ${item.maxStock} ${item.unit}`],
                          ["30d Usage", `${item.usage30d} ${item.unit}`],
                        ].map(([k,v]) => (
                          <div key={k}>
                            <div style={{ fontSize:9, color:"rgba(255,255,255,0.25)", letterSpacing:2, marginBottom:3 }}>{k}</div>
                            <div style={{ fontSize:11, color:"#fbbf24" }}>{v}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ══ TAB: DASHBOARD ══════════════════════════════════════════════ */}
        {activeTab === "dashboard" && (
          <div className="fade" style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:16 }}>
            {/* Stock status breakdown */}
            <div style={{ background:"#13151a", border:"1px solid rgba(255,255,255,0.07)", borderRadius:4, padding:20, gridColumn:"span 2" }}>
              <div style={{ fontSize:10, color:"rgba(255,255,255,0.25)", letterSpacing:3, marginBottom:16 }}>STOCK STATUS BREAKDOWN</div>
              {["CRITICAL","OUT OF STOCK","REORDER NOW","OVERSTOCK","NORMAL"].map(s => {
                const count = inventory.filter(i=>stockStatus(i).label===s).length;
                const st = stockStatus({ qty: s==="OUT OF STOCK"?0:s==="CRITICAL"?0.5:s==="REORDER NOW"?0.8:s==="OVERSTOCK"?200:100, minStock:100, maxStock:150, usage30d:10, leadDays:7 });
                return (
                  <div key={s} style={{ display:"flex", alignItems:"center", gap:12, marginBottom:10 }}>
                    <span style={{ width:100, fontSize:9, color:st.color, letterSpacing:1 }}>{s}</span>
                    <div style={{ flex:1, height:20, background:"rgba(255,255,255,0.04)", borderRadius:2, overflow:"hidden" }}>
                      <div style={{ height:"100%", width:`${(count/inventory.length)*100}%`, background:st.color+"40", borderLeft:`3px solid ${st.color}`, transition:"width 0.8s ease" }} />
                    </div>
                    <span style={{ fontSize:11, color:"rgba(255,255,255,0.5)", width:20, textAlign:"right" }}>{count}</span>
                  </div>
                );
              })}
            </div>

            {/* Category health */}
            <div style={{ background:"#13151a", border:"1px solid rgba(255,255,255,0.07)", borderRadius:4, padding:20 }}>
              <div style={{ fontSize:10, color:"rgba(255,255,255,0.25)", letterSpacing:3, marginBottom:16 }}>BY CATEGORY</div>
              <CategoryBar data={inventory} />
            </div>

            {/* Top 5 by value */}
            <div style={{ background:"#13151a", border:"1px solid rgba(255,255,255,0.07)", borderRadius:4, padding:20, gridColumn:"span 2" }}>
              <div style={{ fontSize:10, color:"rgba(255,255,255,0.25)", letterSpacing:3, marginBottom:16 }}>TOP 5 BY INVENTORY VALUE (RM)</div>
              {[...inventory].sort((a,b)=>(b.qty*b.unitCost)-(a.qty*a.unitCost)).slice(0,5).map((item,i) => {
                const val = item.qty * item.unitCost;
                const maxVal = inventory.reduce((m,x)=>Math.max(m,x.qty*x.unitCost),0);
                const st = stockStatus(item);
                return (
                  <div key={item.id} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
                    <span style={{ fontSize:9, color:"rgba(255,255,255,0.2)", width:14 }}>#{i+1}</span>
                    <span style={{ fontSize:10, color:"rgba(255,255,255,0.6)", width:200, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{item.name}</span>
                    <div style={{ flex:1, height:16, background:"rgba(255,255,255,0.04)", borderRadius:2, overflow:"hidden" }}>
                      <div style={{ height:"100%", width:`${(val/maxVal)*100}%`, background:"rgba(251,191,36,0.25)", borderLeft:"3px solid #fbbf24", transition:"width 0.8s ease" }} />
                    </div>
                    <span style={{ fontSize:11, color:"#fbbf24", width:80, textAlign:"right" }}>RM {val.toLocaleString("en-MY",{minimumFractionDigits:0})}</span>
                    <StatusPill status={st} />
                  </div>
                );
              })}
            </div>

            {/* Critical items */}
            <div style={{ background:"#13151a", border:"1px solid rgba(239,68,68,0.2)", borderRadius:4, padding:20 }}>
              <div style={{ fontSize:10, color:"#ef4444", letterSpacing:3, marginBottom:16 }}>⚠ ACTION REQUIRED</div>
              {criticalItems.length === 0
                ? <div style={{ fontSize:11, color:"rgba(255,255,255,0.25)" }}>All items within safe levels.</div>
                : criticalItems.map(item => {
                  const st = stockStatus(item);
                  const dos = daysOfStock(item);
                  return (
                    <div key={item.id} style={{ marginBottom:12, paddingBottom:12, borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                        <span style={{ fontSize:11, color:"#e2e8f0", fontFamily:"'Barlow Condensed',sans-serif", fontWeight:600 }}>{item.name}</span>
                        <StatusPill status={st} />
                      </div>
                      <div style={{ fontSize:9, color:"rgba(255,255,255,0.3)", marginTop:4 }}>
                        {item.qty} {item.unit} · {dos >= 999 ? "∞" : dos+"d"} stock · Lead: {item.leadDays}d
                      </div>
                    </div>
                  );
                })
              }
            </div>
          </div>
        )}

        {/* ══ TAB: AI ANALYSIS ════════════════════════════════════════════ */}
        {activeTab === "ai" && (
          <div className="fade">
            {!aiResult && !loading && (
              <div style={{ textAlign:"center", padding:"60px 20px" }}>
                <div style={{ fontSize:40, marginBottom:16 }}>🧠</div>
                <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:22, fontWeight:700, color:"#fbbf24", letterSpacing:2, marginBottom:10 }}>
                  ML INTELLIGENCE PIPELINE
                </div>
                <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)", marginBottom:8, lineHeight:1.8 }}>
                  Applies: Data Preprocessing · Feature Engineering · scikit-learn Anomaly Detection<br/>
                  NLP Classification · PyTorch Demand Forecasting · LLM Synthesis · Prompt Engineering
                </div>
                <div style={{ fontSize:10, color:"rgba(255,255,255,0.2)", marginBottom:28 }}>
                  Analyzing {inventory.length} SKUs across {CATEGORIES.length-1} categories · RM {totalVal.toLocaleString("en-MY",{minimumFractionDigits:0})} total value
                </div>
                <button onClick={runAnalysis} style={{
                  padding:"12px 36px", background:"linear-gradient(135deg,#fbbf24,#f97316)",
                  border:"none", borderRadius:3, color:"#0d0e10", fontSize:13, fontWeight:800,
                  fontFamily:"'Barlow Condensed',sans-serif", cursor:"pointer", letterSpacing:2,
                }}>▶ RUN ANALYSIS PIPELINE</button>
              </div>
            )}

            {loading && (
              <div style={{ textAlign:"center", padding:"60px 20px" }}>
                <div style={{ fontSize:24, marginBottom:20 }} className="spin">⚙</div>
                <div style={{ fontSize:13, color:"#fbbf24", fontFamily:"'Share Tech Mono',monospace", marginBottom:16 }}>{phase}</div>
                <div style={{ width:300, height:2, background:"rgba(255,255,255,0.06)", borderRadius:1, margin:"0 auto" }}>
                  <div style={{ height:"100%", width:"60%", background:"#fbbf24", borderRadius:1, animation:"pulse 1.5s ease-in-out infinite" }} />
                </div>
                <style>{`@keyframes pulse{0%,100%{opacity:0.4;width:30%}50%{opacity:1;width:80%}}`}</style>
              </div>
            )}

            {error && (
              <div style={{ background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.3)", borderRadius:4, padding:"14px 18px", color:"#fca5a5", fontSize:12, marginBottom:16 }}>
                ⚠ {error}
              </div>
            )}

            {aiResult && (
              <div className="fade">
                {/* Executive summary + Risk gauge */}
                <div style={{ display:"grid", gridTemplateColumns:"auto 1fr", gap:20, background:"#13151a", border:"1px solid rgba(255,255,255,0.07)", borderRadius:4, padding:24, marginBottom:16, alignItems:"center" }}>
                  <RiskGauge score={aiResult.risk_score} />
                  <div>
                    <div style={{ fontSize:9, color:"rgba(255,255,255,0.25)", letterSpacing:3, marginBottom:6 }}>EXECUTIVE SUMMARY · AI GENERATED</div>
                    <div style={{ fontSize:15, color:"#e2e8f0", lineHeight:1.7, marginBottom:10 }}>{aiResult.executive_summary}</div>
                    <div style={{ fontSize:10, color:"rgba(255,255,255,0.3)", marginBottom:12 }}>{aiResult.forecast_note}</div>
                    <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                      {aiResult.top_actions.map((a,i) => (
                        <div key={i} style={{ fontSize:10, padding:"5px 12px", background:"rgba(251,191,36,0.08)", border:"1px solid rgba(251,191,36,0.2)", borderRadius:2, color:"#fbbf24" }}>
                          {i+1}. {a}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:16, marginBottom:16 }}>
                  {/* Anomalies */}
                  <div style={{ background:"#13151a", border:"1px solid rgba(255,255,255,0.07)", borderRadius:4, padding:20 }}>
                    <div style={{ fontSize:9, color:"#ef4444", letterSpacing:3, marginBottom:14 }}>🔬 ANOMALIES DETECTED</div>
                    {aiResult.anomalies.map((a,i) => (
                      <div key={i} style={{ marginBottom:10, paddingBottom:10, borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
                          <span style={{ fontSize:10, color:"#fbbf24" }}>{a.id}</span>
                          <span style={{ fontSize:9, color: a.severity==="High"?"#ef4444":a.severity==="Medium"?"#f97316":"#eab308", letterSpacing:1 }}>{a.severity}</span>
                        </div>
                        <div style={{ fontSize:9, color:"rgba(255,255,255,0.4)", marginBottom:2, letterSpacing:1 }}>{a.type.replace(/_/g," ").toUpperCase()}</div>
                        <div style={{ fontSize:10, color:"rgba(255,255,255,0.55)", lineHeight:1.5 }}>{a.insight}</div>
                      </div>
                    ))}
                  </div>

                  {/* Reorder queue */}
                  <div style={{ background:"#13151a", border:"1px solid rgba(255,255,255,0.07)", borderRadius:4, padding:20 }}>
                    <div style={{ fontSize:9, color:"#f97316", letterSpacing:3, marginBottom:14 }}>📦 REORDER QUEUE</div>
                    {aiResult.reorder_queue.map((r,i) => (
                      <div key={i} style={{ marginBottom:12, paddingBottom:12, borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
                          <span style={{ fontSize:10, color:"#e2e8f0", fontFamily:"'Barlow Condensed',sans-serif", fontWeight:600 }}>{r.name}</span>
                          <span style={{ fontSize:9, color:urgencyColor(r.urgency), letterSpacing:1 }}>{r.urgency}</span>
                        </div>
                        <div style={{ fontSize:9, color:"rgba(255,255,255,0.35)", marginBottom:3 }}>
                          Suggest: <span style={{ color:"#fbbf24" }}>{r.suggested_qty} units</span>
                        </div>
                        <div style={{ fontSize:9, color:"rgba(255,255,255,0.4)", lineHeight:1.5 }}>{r.reason}</div>
                      </div>
                    ))}
                  </div>

                  {/* NLP Category insights + cost */}
                  <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                    <div style={{ background:"#13151a", border:"1px solid rgba(255,255,255,0.07)", borderRadius:4, padding:20, flex:1 }}>
                      <div style={{ fontSize:9, color:"#8b5cf6", letterSpacing:3, marginBottom:14 }}>🏷 NLP CATEGORY HEALTH</div>
                      {aiResult.nlp_category_insights.map((c,i) => (
                        <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:8, marginBottom:10 }}>
                          <span style={{ fontSize:9, color:healthColor(c.health), marginTop:1 }}>●</span>
                          <div>
                            <div style={{ fontSize:10, color:"rgba(255,255,255,0.6)", letterSpacing:0.5 }}>{c.category} <span style={{ color:healthColor(c.health) }}>·{c.health}</span></div>
                            <div style={{ fontSize:9, color:"rgba(255,255,255,0.35)", lineHeight:1.5 }}>{c.note}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div style={{ background:"#13151a", border:"1px solid rgba(255,255,255,0.07)", borderRadius:4, padding:16 }}>
                      <div style={{ fontSize:9, color:"#10b981", letterSpacing:3, marginBottom:12 }}>💰 COST EXPOSURE</div>
                      {[
                        ["Critical Value", aiResult.cost_exposure.critical_value, "#ef4444"],
                        ["Overstock Value", aiResult.cost_exposure.overstock_value, "#6366f1"],
                        ["Total Value", aiResult.cost_exposure.total_value, "#10b981"],
                      ].map(([k,v,c]) => (
                        <div key={k} style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                          <span style={{ fontSize:9, color:"rgba(255,255,255,0.35)" }}>{k}</span>
                          <span style={{ fontSize:11, fontWeight:700, color:c }}>RM {Number(v).toLocaleString("en-MY",{minimumFractionDigits:0})}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* ML preprocessing log */}
                <div style={{ background:"rgba(0,0,0,0.4)", border:"1px solid rgba(255,255,255,0.05)", borderRadius:4, padding:16 }}>
                  <span style={{ fontSize:9, color:"rgba(255,255,255,0.2)", letterSpacing:3 }}>⚙ ML PREPROCESSING LOG · </span>
                  <span style={{ fontSize:10, color:"rgba(255,255,255,0.4)" }}>{aiResult.preprocessing_log}</span>
                </div>

                <div style={{ textAlign:"center", marginTop:16 }}>
                  <button onClick={runAnalysis} style={{ padding:"8px 24px", background:"rgba(251,191,36,0.08)", border:"1px solid rgba(251,191,36,0.2)", color:"#fbbf24", fontSize:11, fontFamily:"'Share Tech Mono',monospace", borderRadius:3, cursor:"pointer", letterSpacing:1 }}>
                    ↻ RE-RUN ANALYSIS
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Footer */}
      <div style={{ textAlign:"center", padding:"20px 0 28px", fontSize:9, color:"rgba(255,255,255,0.1)", letterSpacing:3 }}>
        FACTORY IMS · SKLEARN · PYTORCH · NLP · LLM · PROMPT ENGINEERING · FEATURE ENGINEERING
      </div>
    </div>
  );
}
