import React, { useState, useMemo, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Cell,
  RadialBarChart, RadialBar
} from 'recharts';
import { 
  Users, Star, Zap, MessageSquare, Filter, Activity, BarChart2, 
  Layers, HelpCircle, X, Info, Loader2, AlertCircle, TrendingUp, Quote,
  ThumbsUp, AlertTriangle, Lightbulb, Rocket, Sparkles
} from 'lucide-react';

// ==========================================
// 設定區域
// ==========================================
const GAS_API_URL = "https://script.google.com/macros/s/AKfycbz4YSi0cs7cV8dM3Sm70MMTXbov6FvQk5ZvnmyEkrOrZiwaqhgxeyaf0uMdkqizU0n-/exec"; 

const SATISFACTION_LABELS = [
  "內容實用性", "難易度適中", "講師表達", "互動氣氛", 
  "時間掌控", "教材品質", "行政安排", "整體推薦"
];

const COLORS = {
  primary: '#38bdf8',     // Sky-400
  secondary: '#818cf8',   // Indigo-400
  accent: '#f472b6',      // Pink-400
  success: '#34d399',     // Emerald-400
  warning: '#fbbf24',     // Amber-400
  danger: '#fb7185',      // Rose-400
  bg: '#0f172a',
  roles: {
    '醫師': '#38bdf8',
    '護理人員': '#f472b6',
    '醫事人員': '#10b981',
    '行政人員': '#fbbf24',
    '資訊與研究': '#a78bfa',
    '學生': '#fb923c',
    '其他': '#94a3b8'
  }
};

const METRIC_DEFINITIONS = {
  learning_effectiveness: {
    title: "學習成效",
    desc: "包含：國家健康藍圖、AI醫療趨勢、學習型照護理解。",
    simple: "懂不懂？"
  },
  self_efficacy: {
    title: "自我效能",
    desc: "包含：操作 AI 工具的信心、解決問題的能力感。",
    simple: "敢不敢用？"
  },
  transformative_learning: {
    title: "轉化學習",
    desc: "包含：反思舊有工作模式、產生新的觀點與想法。",
    simple: "有無啟發？"
  },
  behavioral_intention: {
    title: "行為意圖",
    desc: "包含：未來實際應用意願、向同事推廣的意願。",
    simple: "想不想用？"
  },
  nps: {
    title: "淨推薦分數",
    desc: "反映學員的忠誠度與口碑傳播意願。",
    simple: "推不推薦？"
  }
};

// --- UI Components ---

// 修正：移除 overflow-hidden，避免 Tooltip 被切掉
const Card = ({ children, className = "" }) => (
  <div className={`bg-slate-800/60 backdrop-blur-md border border-slate-700/50 rounded-2xl p-5 shadow-lg transition-all hover:border-sky-500/30 hover:shadow-sky-500/10 relative ${className}`}>
    {children}
  </div>
);

// 修正：StatCard 內部獨立處理裝飾圖示的裁切
const StatCard = ({ title, value, icon: Icon, trend, trendUp, sub, colorClass, footerLabel, tooltip }) => (
  <Card className="group">
    {/* 裝飾層：獨立裁切，不影響內容 */}
    <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
        <div className={`absolute -top-2 -right-2 opacity-[0.08] group-hover:opacity-[0.15] transition-opacity transform group-hover:scale-110 duration-500 ${colorClass.replace('bg-', 'text-')}`}>
        <Icon size={100} />
        </div>
    </div>

    {/* 內容層：z-10 確保在裝飾之上 */}
    <div className="flex justify-between items-start relative z-10">
      <div>
        <div className="flex items-center gap-1.5 mb-1">
          <h3 className="text-slate-400 text-sm font-bold uppercase tracking-wider">{title}</h3>
          {tooltip && <InfoTooltip text={tooltip} />}
        </div>
        <div className="text-4xl font-extrabold text-white tracking-tight mt-2 drop-shadow-sm">{value}</div>
      </div>
      <div className={`p-3 rounded-xl shadow-inner ${colorClass} bg-opacity-20 border border-white/10`}>
        <Icon size={24} className="text-white" />
      </div>
    </div>
    <div className="mt-4 pt-3 border-t border-slate-700/50 flex justify-between items-center relative z-10">
      <span className="text-xs text-slate-500 font-medium">{footerLabel || "即時數據"}</span>
      <div className={`flex items-center gap-1 font-bold text-sm ${trendUp ? 'text-emerald-400' : 'text-rose-400'}`}>
         {trend === 'Live' && <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mr-1"></div>}
         {trend}
         <span className="text-[10px] text-slate-500 font-medium ml-1 normal-case opacity-80">({sub})</span>
      </div>
    </div>
  </Card>
);

// 修正：InfoTooltip 支援點擊 (Click) 與 懸停 (Hover)
const InfoTooltip = ({ text }) => {
  const [visible, setVisible] = useState(false);
  return (
    <div 
      className="relative flex items-center z-50 cursor-pointer"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onClick={(e) => { e.stopPropagation(); setVisible(!visible); }}
    >
      <Info size={14} className={`text-slate-500 hover:text-sky-400 transition-colors ${visible ? 'text-sky-400' : ''}`} />
      
      {/* Tooltip Popup */}
      <div className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 w-64 p-3 bg-slate-800/95 backdrop-blur-md border border-slate-600 rounded-xl text-xs font-medium text-slate-200 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] transition-all duration-200 z-[60] leading-relaxed ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'}`}>
        {text}
        {/* 箭頭 */}
        <div className="absolute -bottom-1.5 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-slate-800/95 border-r border-b border-slate-600 rotate-45"></div>
      </div>
    </div>
  );
};

const HeatmapCell = ({ value, isBold }) => {
  const num = parseFloat(value);
  let colorClass = 'text-slate-500';
  if (num >= 4.5) colorClass = 'text-emerald-400';
  else if (num >= 4.0) colorClass = 'text-sky-300';
  else if (num >= 3.5) colorClass = 'text-yellow-400';
  else if (num > 0) colorClass = 'text-rose-400';
  
  const fontClass = isBold ? 'text-lg font-extrabold' : 'text-base font-bold';

  return (
    <td className={`px-6 py-4 align-middle transition-colors hover:bg-white/5 ${isBold ? 'text-right' : 'text-center'}`}>
      <span className={`${colorClass} ${fontClass}`}>{value === '-' ? '-' : num}</span>
    </td>
  );
};

// Radar Chart Custom Tick with Tooltip
const CustomRadarTick = ({ payload, x, y, textAnchor, stroke, radius }) => {
  const defKey = Object.keys(METRIC_DEFINITIONS).find(k => METRIC_DEFINITIONS[k].title === payload.value);
  const def = METRIC_DEFINITIONS[defKey];
  const [visible, setVisible] = useState(false);

  return (
    <g 
      className="group cursor-help pointer-events-auto"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onClick={(e) => { e.stopPropagation(); setVisible(!visible); }}
    >
      <text
        x={x}
        y={y}
        textAnchor={textAnchor}
        fill="#94a3b8"
        fontSize={13}
        fontWeight={700}
        className={`transition-colors select-none ${visible ? 'fill-sky-400' : 'group-hover:fill-sky-400'}`}
      >
        {payload.value}
      </text>
      {def && (
        <foreignObject x={x - 80} y={y + 10} width="160" height="100" className={`overflow-visible transition-opacity duration-200 pointer-events-none z-50 ${visible ? 'opacity-100' : 'opacity-0'}`}>
          <div className="bg-slate-800/95 backdrop-blur border border-slate-600 text-slate-200 text-xs p-2.5 rounded-lg shadow-xl relative mt-1 text-center">
            <div className="font-bold text-sky-300 mb-1">{def.simple}</div>
            <div className="leading-relaxed text-[10px] text-slate-300">{def.desc}</div>
            <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-800 border-l border-t border-slate-600 rotate-45"></div>
          </div>
        </foreignObject>
      )}
    </g>
  );
};


const Dashboard = () => {
  const [viewMode, setViewMode] = useState('overview'); 
  const [selectedRole, setSelectedRole] = useState('All');
  const [showGuide, setShowGuide] = useState(false);
  const [rawData, setRawData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if(!GAS_API_URL) throw new Error("請先在程式碼中設定 GAS_API_URL");
        const response = await fetch(GAS_API_URL);
        if (!response.ok) throw new Error('網路回應不正常');
        const json = await response.json();
        setRawData(processSheetData(json));
        setLoading(false);
      } catch (err) {
        console.error("Fetch error:", err);
        setError(err.message);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const processSheetData = (data) => {
    if (!Array.isArray(data)) return [];
    return data.map((row, index) => {
      const posts = Array.isArray(row.post_scores) ? row.post_scores.map(n => Number(n) || 0) : []; 
      const sats = Array.isArray(row.sat_scores) ? row.sat_scores.map(n => Number(n) || 0) : [];   
      const avg = (arr) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

      let feedbackObj = { harvest: "", suggestion: "", application: "" };
      if (row.feedback) {
         if (typeof row.feedback === 'object') {
            feedbackObj.harvest = row.feedback.harvest || row.feedback.q1 || "";
            feedbackObj.suggestion = row.feedback.suggestion || row.feedback.q2 || "";
            feedbackObj.application = row.feedback.application || row.feedback.q3 || "";
         } else {
            feedbackObj.harvest = String(row.feedback);
         }
      }

      return {
        id: index,
        role: row.role || '其他',
        learning_effectiveness: avg(posts.slice(0, 3)), 
        self_efficacy: avg(posts.slice(3, 5)),          
        transformative_learning: avg(posts.slice(5, 7)),
        behavioral_intention: avg(posts.slice(7, 9)),   
        satisfaction_items: sats, 
        satisfaction_overall: avg(sats), 
        feedback: feedbackObj
      };
    });
  };

  const filteredData = useMemo(() => {
    return selectedRole === 'All' ? rawData : rawData.filter(d => d.role === selectedRole);
  }, [selectedRole, rawData]);

  const qualitativeFeedbacks = useMemo(() => {
    const result = {
      harvest: [],
      suggestion: [],
      application: []
    };
    
    filteredData.forEach(item => {
      if (item.feedback.harvest && item.feedback.harvest.length > 2) 
        result.harvest.push({ id: item.id, role: item.role, text: item.feedback.harvest });
        
      if (item.feedback.suggestion && item.feedback.suggestion.length > 2) 
        result.suggestion.push({ id: item.id, role: item.role, text: item.feedback.suggestion });
        
      if (item.feedback.application && item.feedback.application.length > 2) 
        result.application.push({ id: item.id, role: item.role, text: item.feedback.application });
    });
    
    return result;
  }, [filteredData]);

  const kpi = useMemo(() => {
    const count = filteredData.length;
    if (count === 0) return { count: 0, avgSat: 0, avgLearn: 0, nps: 0 };
    const avgSat = filteredData.reduce((acc, cur) => acc + cur.satisfaction_overall, 0) / count;
    const avgLearn = filteredData.reduce((acc, cur) => acc + cur.learning_effectiveness, 0) / count;
    const promoters = filteredData.filter(d => d.satisfaction_overall >= 4.5).length;
    const detractors = filteredData.filter(d => d.satisfaction_overall <= 3).length;
    const nps = Math.round(((promoters - detractors) / count) * 100);
    return { count, avgSat: avgSat.toFixed(1), avgLearn: avgLearn.toFixed(1), nps };
  }, [filteredData]);

  const radarData = useMemo(() => {
    if (filteredData.length === 0) return [];
    const dimensions = [
      { key: 'learning_effectiveness', name: '學習成效' },
      { key: 'self_efficacy', name: '自我效能' },
      { key: 'transformative_learning', name: '轉化學習' },
      { key: 'behavioral_intention', name: '行為意圖' },
    ];
    if (viewMode === 'deep-dive') {
       return dimensions.map(dim => {
         const item = { subject: dim.name, fullMark: 5 };
         Object.keys(COLORS.roles).forEach(r => {
            const roleData = rawData.filter(d => d.role === r);
            item[r] = roleData.length > 0 ? (roleData.reduce((acc, cur) => acc + cur[dim.key], 0) / roleData.length).toFixed(2) : 0;
         });
         return item;
       });
    }
    return dimensions.map(dim => ({
      subject: dim.name,
      A: (filteredData.reduce((acc, cur) => acc + cur[dim.key], 0) / filteredData.length).toFixed(2),
      fullMark: 5
    }));
  }, [filteredData, rawData, viewMode]);

  const satisfactionDetailedData = useMemo(() => {
    if (filteredData.length === 0) return [];
    const dimScores = SATISFACTION_LABELS.map((label, idx) => {
        const total = filteredData.reduce((acc, cur) => {
            const val = cur.satisfaction_items && cur.satisfaction_items[idx] !== undefined ? cur.satisfaction_items[idx] : 0;
            return acc + val;
        }, 0);
        const avg = total / filteredData.length;
        return {
            name: label,
            value: parseFloat(avg.toFixed(2)),
            fill: avg >= 4.5 ? COLORS.success : avg >= 4.0 ? COLORS.secondary : COLORS.warning
        };
    });
    const sorted = [...dimScores].sort((a, b) => b.value - a.value);
    return { chartData: dimScores, highest: sorted[0], lowest: sorted[sorted.length - 1] };
  }, [filteredData]);

  const roleComparisonData = useMemo(() => {
     if (rawData.length === 0) return [];
     return Object.keys(COLORS.roles).map(r => {
       const roleData = rawData.filter(d => d.role === r);
       const count = roleData.length;
       if (count === 0) return { name: r, '整體滿意度': 0, '課程設計': 0, '學習成效': 0 };
       const satItems = roleData.map(d => d.satisfaction_items || []);
       const satDesign = satItems.reduce((acc, items) => {
           const subAvg = items.slice(0, 4).reduce((a, b) => a+b, 0) / 4;
           return acc + subAvg;
       }, 0) / count;
       return {
         name: r,
         '整體滿意度': (roleData.reduce((acc, cur) => acc + cur.satisfaction_overall, 0) / count).toFixed(2),
         '課程設計': satDesign.toFixed(2),
         '學習成效': (roleData.reduce((acc, cur) => acc + cur.learning_effectiveness, 0) / count).toFixed(2),
       };
     });
  }, [rawData]);

  if (loading) return <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-slate-400"><Loader2 className="w-12 h-12 animate-spin text-sky-500 mb-4" /><p className="font-bold text-sm tracking-wide">正在連線至資料庫...</p></div>;
  if (error) return <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-rose-400"><AlertCircle className="w-12 h-12 mb-4" /><h3 className="text-xl font-bold text-white mb-2">讀取資料失敗</h3><p className="mb-4 text-center max-w-md text-sm">{error}</p><button onClick={() => window.location.reload()} className="px-6 py-2 bg-slate-800 rounded-full hover:bg-slate-700 text-white font-bold text-sm transition-colors border border-slate-700">重新整理</button></div>;

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-50 font-sans selection:bg-sky-500/30 pb-12 relative overflow-x-hidden">
      
      {/* Background Layers */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-sky-600/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/10 rounded-full blur-[120px]"></div>
        <div className="absolute inset-0 bg-[url('https://uibucket.s3.amazonaws.com/grid-pattern.svg')] opacity-[0.03]"></div>
      </div>

      {/* Modal: Guide */}
      {showGuide && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/80 backdrop-blur-md animate-fadeIn" onClick={() => setShowGuide(false)}>
          <div className="bg-slate-900 border border-sky-500/40 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowGuide(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors p-2 rounded-full hover:bg-slate-800">
              <X size={20} />
            </button>
            <div className="p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-sky-500/10 rounded-xl text-sky-400 border border-sky-500/20"><HelpCircle size={28} /></div>
                <div>
                  <h2 className="text-2xl font-extrabold text-white tracking-tight">儀表板閱讀指南</h2>
                  <p className="text-slate-400 text-sm font-medium">如何解讀 AI 工作坊的成效數據？</p>
                </div>
              </div>
              <div className="space-y-4">
                 {Object.entries(METRIC_DEFINITIONS).slice(0, 4).map(([key, def]) => (
                   <div key={key} className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50 flex justify-between items-center">
                      <div><span className="font-bold text-slate-200 text-sm block">{def.title}</span><span className="text-xs text-slate-400">{def.desc}</span></div>
                      <span className="text-xs bg-sky-900/30 text-sky-300 px-2 py-1 rounded font-bold border border-sky-500/20 whitespace-nowrap ml-3">{def.simple}</span>
                   </div>
                 ))}
              </div>
              <button onClick={() => setShowGuide(false)} className="w-full mt-6 bg-sky-600 hover:bg-sky-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-sky-900/20">我瞭解了</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="border-b border-slate-700/60 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-br from-sky-500 to-blue-600 p-2.5 rounded-lg shadow-lg shadow-sky-500/20">
                <Activity className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-white tracking-tight">2025 奇美月 <span className="text-slate-600 mx-1">|</span> <span className="text-sky-400">AI 數位賦能工作坊</span></h1>
                <p className="text-xs text-slate-400 font-bold tracking-[0.15em] uppercase mt-0.5">Post-Workshop Analytics Center</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
               <button onClick={() => setShowGuide(true)} className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-300 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 hover:text-white transition-all"><HelpCircle size={14} />說明</button>
               <div className="h-6 w-px bg-slate-700 mx-1 hidden lg:block"></div>
               <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700/60">
                  <button onClick={() => setViewMode('overview')} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 ${viewMode === 'overview' ? 'bg-sky-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}><BarChart2 size={14} /> 總覽</button>
                  <button onClick={() => setViewMode('deep-dive')} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 ${viewMode === 'deep-dive' ? 'bg-sky-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}><Layers size={14} /> 深度比較</button>
               </div>
               {viewMode === 'overview' && (
                 <div className="relative group">
                    <div className="flex items-center gap-2 bg-slate-800 px-3 py-2 rounded-lg border border-slate-700 hover:border-sky-500/50 transition-colors cursor-pointer">
                      <Filter size={14} className="text-sky-400" />
                      <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)} className="bg-transparent text-white text-xs font-bold outline-none appearance-none cursor-pointer pr-4 min-w-[100px]">
                        <option value="All" className="bg-slate-800">全部角色 (All)</option>
                        {Object.keys(COLORS.roles).map(role => (<option key={role} value={role} className="bg-slate-800">{role}</option>))}
                      </select>
                    </div>
                 </div>
               )}
            </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 relative z-10">
        
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard title="總回收份數" value={kpi.count} icon={Users} trend="Live" trendUp={true} sub="即時填答" colorClass="bg-indigo-500" footerLabel="目前回收狀況" />
          <StatCard title="平均滿意度" value={kpi.avgSat} icon={Star} trend={kpi.avgSat >= 4.5 ? "優異" : "良好"} trendUp={true} sub="滿分 5.0" colorClass="bg-amber-500" footerLabel="整體滿意度指標" />
          <StatCard title="學習成效指數" value={kpi.avgLearn} icon={Zap} trend={kpi.avgLearn >= 4 ? "高成效" : "需加強"} trendUp={kpi.avgLearn >= 4} sub="認知程度" colorClass="bg-sky-500" footerLabel="知識吸收狀況" tooltip={METRIC_DEFINITIONS.learning_effectiveness.desc} />
          <StatCard title="淨推薦分數 (NPS)" value={kpi.nps} icon={TrendingUp} trend={kpi.nps > 30 ? "+極佳" : kpi.nps > 0 ? "+正向" : "-需改善"} trendUp={kpi.nps > 0} sub="口碑意願" colorClass="bg-emerald-500" footerLabel="推薦意願計算" tooltip={METRIC_DEFINITIONS.nps.desc} />
        </div>

        {viewMode === 'overview' && (
          <div className="space-y-8 animate-fadeIn">
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left: Radar Chart - Layout 6/12 */}
              <Card className="lg:col-span-6 flex flex-col min-h-[500px]">
                 <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-blue-500/10 rounded border border-blue-500/20"><Activity size={16} className="text-blue-400" /></div>
                      <h3 className="text-lg font-bold text-white">學習成效構面分析</h3>
                      <InfoTooltip text="滑鼠停留在各個構面文字上，可查看詳細定義與包含內容。" />
                    </div>
                    <span className="text-xs font-mono text-slate-500 bg-slate-800 px-2 py-1 rounded border border-slate-700">Role: {selectedRole}</span>
                 </div>
                 <div className="flex-1 flex flex-col md:flex-row">
                    <div className="flex-1 min-h-[350px] relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                          <PolarGrid stroke="#334155" strokeDasharray="3 3" />
                          <PolarAngleAxis dataKey="subject" tick={<CustomRadarTick />} />
                          <PolarRadiusAxis angle={30} domain={[0, 5]} tick={false} axisLine={false} />
                          <Radar name={selectedRole} dataKey="A" stroke={COLORS.primary} strokeWidth={3} fill={COLORS.primary} fillOpacity={0.2} />
                          <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#38bdf8', color: '#f8fafc', borderRadius: '8px', fontWeight: 'bold', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="md:w-40 md:border-l border-slate-700/50 md:pl-4 mt-6 md:mt-0 flex flex-col justify-center gap-4">
                       <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-widest mb-2">維度快速解讀</h4>
                       {radarData.map((item, idx) => {
                         const defKey = ['learning_effectiveness', 'self_efficacy', 'transformative_learning', 'behavioral_intention'][idx];
                         const color = ['text-sky-400', 'text-amber-400', 'text-emerald-400', 'text-purple-400'][idx];
                         return (
                           <div key={item.subject} className="group">
                              <div className="flex justify-between items-end mb-1">
                                <span className={`font-bold text-xs ${color}`}>{item.subject}</span>
                                <span className="text-white font-mono font-bold text-base">{item.A}</span>
                              </div>
                              <div className="h-1 w-full bg-slate-700/50 rounded-full overflow-hidden">
                                 <div className={`h-full rounded-full ${color.replace('text', 'bg')} opacity-80`} style={{ width: `${(item.A / 5) * 100}%` }}></div>
                              </div>
                           </div>
                         );
                       })}
                    </div>
                 </div>
              </Card>

              {/* Middle: Satisfaction Bar Chart - Layout 6/12 */}
              <div className="lg:col-span-6 flex flex-col gap-6">
                 <Card className="min-h-[280px] flex flex-col h-full">
                    <div className="flex items-center justify-between mb-4">
                       <div className="flex items-center gap-2">
                          <Star size={16} className="text-amber-400" />
                          <h3 className="text-lg font-bold text-white">滿意度細項分析</h3>
                       </div>
                       <InfoTooltip text="顯示各個滿意度維度的平均分數，包含難易度、實用性等8大面向。" />
                    </div>
                    
                    <div className="flex flex-col md:flex-row gap-6 h-full">
                       <div className="flex-1 min-h-[250px]">
                         <ResponsiveContainer width="100%" height="100%">
                            <BarChart layout="vertical" data={satisfactionDetailedData.chartData} margin={{ top: 0, right: 30, left: 20, bottom: 0 }} barCategoryGap={8}>
                               <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#334155" />
                               <XAxis type="number" domain={[0, 5]} hide />
                               <YAxis dataKey="name" type="category" tick={{ fill: '#cbd5e1', fontWeight: 700, fontSize: 12 }} width={80} axisLine={false} tickLine={false} />
                               <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{ backgroundColor: '#1e293b', borderColor: '#818cf8', color: '#f8fafc', borderRadius: '8px' }} />
                               <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={16} label={{ position: 'right', fill: '#fff', fontSize: 11, fontWeight: 'bold' }}>
                                  {satisfactionDetailedData.chartData?.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.fill} />))}
                               </Bar>
                            </BarChart>
                         </ResponsiveContainer>
                       </div>
                       <div className="md:w-48 flex flex-col justify-center gap-4 pl-4 md:border-l border-slate-700/50">
                          <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-widest">重點分析 Insights</h4>
                          <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-lg">
                             <div className="flex items-center gap-2 mb-1"><ThumbsUp size={14} className="text-emerald-400" /><span className="text-xs font-bold text-emerald-300 uppercase">表現最佳 Strengths</span></div>
                             <div className="text-lg font-extrabold text-white">{satisfactionDetailedData.highest?.value}</div>
                             <div className="text-xs text-slate-300 mt-0.5">{satisfactionDetailedData.highest?.name}</div>
                          </div>
                          <div className={`border p-3 rounded-lg ${satisfactionDetailedData.lowest?.value < 4.0 ? 'bg-amber-500/10 border-amber-500/20' : 'bg-slate-700/30 border-slate-600'}`}>
                             <div className="flex items-center gap-2 mb-1"><AlertTriangle size={14} className={satisfactionDetailedData.lowest?.value < 4.0 ? "text-amber-400" : "text-slate-400"} /><span className={`text-xs font-bold uppercase ${satisfactionDetailedData.lowest?.value < 4.0 ? "text-amber-300" : "text-slate-400"}`}>需注意 Weaknesses</span></div>
                             <div className="text-lg font-extrabold text-white">{satisfactionDetailedData.lowest?.value}</div>
                             <div className="text-xs text-slate-300 mt-0.5">{satisfactionDetailedData.lowest?.name}</div>
                          </div>
                       </div>
                    </div>
                 </Card>
              </div>
            </div>

            {/* --- Qualitative Feedback Section (3 Columns) --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Column 1: Harvest */}
              <Card className="flex flex-col h-[400px] bg-sky-900/10 border-sky-500/20">
                 <div className="flex items-center gap-2 mb-4 border-b border-sky-500/20 pb-3">
                    <Sparkles size={20} className="text-sky-400" />
                    <h3 className="text-lg font-bold text-white">✨ 學習收穫</h3>
                    <span className="text-xs text-sky-300/70 ml-auto font-mono">{qualitativeFeedbacks.harvest.length} 則</span>
                 </div>
                 <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
                    {qualitativeFeedbacks.harvest.map((item, i) => (
                      <div key={i} className="bg-slate-800 p-4 rounded-2xl rounded-tl-none relative border border-slate-700 shadow-sm">
                        <div className="absolute -left-2 top-0 w-4 h-4 bg-slate-800 transform skew-x-12 z-0"></div>
                        <div className="relative z-10">
                          <p className="text-sm text-slate-200 leading-relaxed mb-2">{item.text}</p>
                          <div className="flex justify-end items-center gap-2">
                            <span className="text-[10px] font-bold text-sky-400 bg-sky-900/30 px-1.5 py-0.5 rounded uppercase">{item.role}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                    {qualitativeFeedbacks.harvest.length === 0 && <div className="text-center text-slate-500 text-sm mt-10">尚無此類別回饋</div>}
                 </div>
              </Card>

              {/* Column 2: Suggestion */}
              <Card className="flex flex-col h-[400px] bg-amber-900/10 border-amber-500/20">
                 <div className="flex items-center gap-2 mb-4 border-b border-amber-500/20 pb-3">
                    <Lightbulb size={20} className="text-amber-400" />
                    <h3 className="text-lg font-bold text-white">💡 建議改善</h3>
                    <span className="text-xs text-amber-300/70 ml-auto font-mono">{qualitativeFeedbacks.suggestion.length} 則</span>
                 </div>
                 <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
                    {qualitativeFeedbacks.suggestion.map((item, i) => (
                      <div key={i} className="bg-slate-800 p-4 rounded-2xl rounded-tl-none relative border border-slate-700 shadow-sm">
                         <div className="absolute -left-2 top-0 w-4 h-4 bg-slate-800 transform skew-x-12 z-0"></div>
                         <div className="relative z-10">
                          <p className="text-sm text-slate-200 leading-relaxed mb-2">{item.text}</p>
                          <div className="flex justify-end items-center gap-2">
                            <span className="text-[10px] font-bold text-amber-400 bg-amber-900/30 px-1.5 py-0.5 rounded uppercase">{item.role}</span>
                          </div>
                         </div>
                      </div>
                    ))}
                    {qualitativeFeedbacks.suggestion.length === 0 && <div className="text-center text-slate-500 text-sm mt-10">尚無此類別回饋</div>}
                 </div>
              </Card>

              {/* Column 3: Application / Reflection */}
              <Card className="flex flex-col h-[400px] bg-emerald-900/10 border-emerald-500/20">
                 <div className="flex items-center gap-2 mb-4 border-b border-emerald-500/20 pb-3">
                    <Rocket size={20} className="text-emerald-400" />
                    <h3 className="text-lg font-bold text-white">🚀 應用與反思</h3>
                    <span className="text-xs text-emerald-300/70 ml-auto font-mono">{qualitativeFeedbacks.application.length} 則</span>
                 </div>
                 <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
                    {qualitativeFeedbacks.application.map((item, i) => (
                      <div key={i} className="bg-slate-800 p-4 rounded-2xl rounded-tl-none relative border border-slate-700 shadow-sm">
                        <div className="absolute -left-2 top-0 w-4 h-4 bg-slate-800 transform skew-x-12 z-0"></div>
                        <div className="relative z-10">
                          <p className="text-sm text-slate-200 leading-relaxed mb-2">{item.text}</p>
                          <div className="flex justify-end items-center gap-2">
                            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-900/30 px-1.5 py-0.5 rounded uppercase">{item.role}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                    {qualitativeFeedbacks.application.length === 0 && <div className="text-center text-slate-500 text-sm mt-10">尚無此類別回饋</div>}
                 </div>
              </Card>
            </div>
          </div>
        )}

        {viewMode === 'deep-dive' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <div className="flex items-center gap-2 mb-4">
                   <BarChart2 size={18} className="text-indigo-400" />
                   <h3 className="text-lg font-bold text-white">角色間滿意度差異</h3>
                   <InfoTooltip text="比較不同職類在「整體滿意度」與「課程設計」上的評分差異。" />
                </div>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={roleComparisonData} margin={{top: 20, right: 30, left: 20, bottom: 5}}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                      <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontWeight: 700, fontSize: 12 }} axisLine={{stroke: '#475569'}} tickLine={false} />
                      <YAxis domain={[0, 5]} tick={{ fill: '#64748b', fontWeight: 600 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }} cursor={{fill: 'rgba(255,255,255,0.05)'}} />
                      <Legend wrapperStyle={{ paddingTop: '10px' }} />
                      <Bar dataKey="整體滿意度" fill={COLORS.roles['醫師']} radius={[4, 4, 0, 0]} barSize={20} />
                      <Bar dataKey="課程設計" fill={COLORS.roles['行政人員']} radius={[4, 4, 0, 0]} barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
              <Card>
                 <div className="flex items-center gap-2 mb-4">
                   <Layers size={18} className="text-sky-400" />
                   <h3 className="text-lg font-bold text-white">學習成效 - 角色交叉比對</h3>
                 </div>
                 <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                      <PolarGrid stroke="#334155" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontWeight: 700, fontSize: 12 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 5]} tick={false} axisLine={false} />
                      {Object.keys(COLORS.roles).map((role) => (<Radar key={role} name={role} dataKey={role} stroke={COLORS.roles[role]} strokeWidth={2} fill="transparent" />))}
                      <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} iconType="circle" />
                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px' }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>
            <Card className="overflow-hidden p-0 border-none">
              <div className="p-6 border-b border-slate-700/50 bg-slate-800/40">
                 <h3 className="text-lg font-bold text-white">各構面得分熱力矩陣</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-300">
                  <thead className="text-xs text-slate-400 uppercase bg-slate-900/50">
                    <tr>
                      <th className="px-6 py-4 font-extrabold tracking-wider">角色 Role</th>
                      <th className="px-6 py-4 font-extrabold text-center">學習成效</th>
                      <th className="px-6 py-4 font-extrabold text-center">自我效能</th>
                      <th className="px-6 py-4 font-extrabold text-center">轉化學習</th>
                      <th className="px-6 py-4 font-extrabold text-center">行為意圖</th>
                      <th className="px-6 py-4 text-right font-extrabold">滿意度</th>
                    </tr>
                  </thead>
                  <tbody className="font-medium divide-y divide-slate-700/50">
                    {Object.keys(COLORS.roles).map((role) => {
                      const roleData = rawData.filter(d => d.role === role);
                      const getAvg = (key) => roleData.length ? (roleData.reduce((acc, cur) => acc + cur[key], 0) / roleData.length).toFixed(2) : '-';
                      return (
                        <tr key={role} className="hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4 font-bold text-white flex items-center gap-3">
                            <div className="w-2.5 h-2.5 rounded-sm shadow-[0_0_8px_currentColor]" style={{backgroundColor: COLORS.roles[role], color: COLORS.roles[role]}}></div>
                            {role}
                          </td>
                          <HeatmapCell value={getAvg('learning_effectiveness')} />
                          <HeatmapCell value={getAvg('self_efficacy')} />
                          <HeatmapCell value={getAvg('transformative_learning')} />
                          <HeatmapCell value={getAvg('behavioral_intention')} />
                          <HeatmapCell value={getAvg('satisfaction_overall')} isBold />
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

      </main>
      
      {/* Custom Styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #0f172a; 
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #334155; 
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #475569; 
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
