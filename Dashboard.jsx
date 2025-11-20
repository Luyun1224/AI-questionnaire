import React, { useState, useMemo, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Cell,
  RadialBarChart, RadialBar
} from 'recharts';
import { 
  Users, Star, Zap, MessageSquare, Filter, Activity, BarChart2, 
  Layers, HelpCircle, X, Info, Loader2, AlertCircle, TrendingUp, Quote,
  ThumbsUp, AlertTriangle, Lightbulb, Rocket, Sparkles, ExternalLink, Image as ImageIcon
} from 'lucide-react';
import logoImg from './assets/logo.png';
import chimeiImg from './assets/Chimei.png';

// ==========================================
// 設定區域
// ==========================================
const GAS_API_URL = "https://script.google.com/macros/s/AKfycbz4YSi0cs7cV8dM3Sm70MMTXbov6FvQk5ZvnmyEkrOrZiwaqhgxeyaf0uMdkqizU0n-/exec"; 

const SATISFACTION_LABELS = [
  "內容實用性", "難易度適中", "講師表達", "互動氣氛", 
  "時間掌控", "教材品質", "行政安排", "整體推薦"
];

const COLORS = {
  primary: '#144679',     // Dark Blue (Custom)
  secondary: '#FAB346',   // Yellow (Custom)
  accent: '#D6604A',      // Red (Custom)
  success: '#34d399',     // Emerald-400 (Keep for positive trends)
  warning: '#CC9337',     // Gold (Custom)
  danger: '#fb7185',      // Rose-400
  bg: '#f8fafc',          // Light Mode Background
  cardBg: '#ffffff',      // White Card
  text: '#1e293b',        // Slate-800
  subText: '#64748b',     // Slate-500
  roles: {
    '醫師': '#144679',
    '護理人員': '#D6604A',
    '醫事人員': '#FAB346',
    '行政人員': '#CC9337',
    '資訊與研究': '#64748b',
    '學生': '#0ea5e9',
    '其他': '#94a3b8'
  }
};

const METRIC_DEFINITIONS = {
  learning_effectiveness: {
    title: "學習成效",
    desc: "這是學員對課程核心知識吸收程度的自我評估，而非對講師的滿意度。\n\n計算方式：取問卷前三題（國家健康藍圖、AI醫療趨勢、學習型照護理解）的平均分數。\n\n意義：分數越高，代表學員認為自己對 AI 趨勢與政策的理解越深入，知識轉化率越高。",
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
    desc: "NPS 是反映學員忠誠度與口碑擴散力的關鍵指標。\n\n計算公式：(推薦者% - 批評者%) × 100\n\n邏輯：\n1. 推薦者 (滿意度 ≥ 4.5)：會積極推廣的鐵粉。\n2. 批評者 (滿意度 ≤ 3.0)：可能給予負評的人。\n\n為什麼這樣算？因為負評的殺傷力往往大於好評。NPS 算出的是扣除負面雜訊後，真正能帶來成長的『淨』口碑值。",
    simple: "推不推薦？"
  }
};

// --- UI Components ---

// 修正：移除 overflow-hidden，避免 Tooltip 被切掉
const Card = ({ children, className = "" }) => (
  <div className={`bg-white border border-slate-200 rounded-2xl p-6 shadow-lg transition-all hover:shadow-xl relative ${className}`}>
    {children}
  </div>
);

// 修正：StatCard 內部獨立處理裝飾圖示的裁切
const StatCard = ({ title, value, icon: Icon, trend, trendUp, sub, colorClass, footerLabel, tooltip }) => (
  <Card className="group">
    {/* 裝飾層：獨立裁切，不影響內容 */}
    <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
        <div className={`absolute -top-4 -right-4 opacity-[0.05] group-hover:opacity-[0.1] transition-opacity transform group-hover:scale-110 duration-500 text-slate-900`}>
        <Icon size={160} />
        </div>
    </div>

    {/* 內容層：z-10 確保在裝飾之上 */}
    <div className="flex justify-between items-start relative z-10">
      <div>
        <div className="flex items-center gap-2 mb-3">
          <h3 className="text-slate-600 text-lg font-extrabold uppercase tracking-wider">{title}</h3>
          {tooltip && <InfoTooltip text={tooltip} />}
        </div>
        <div className="text-6xl font-black text-[#144679] tracking-tight mt-3 drop-shadow-sm">{value}</div>
      </div>
      <div className={`p-4 rounded-xl shadow-sm bg-[#CBDFDF] bg-opacity-50 border border-slate-100`}>
        <Icon size={32} className="text-[#144679]" />
      </div>
    </div>
    <div className="mt-6 pt-5 border-t border-slate-100 flex justify-between items-center relative z-10">
      <span className="text-base text-slate-500 font-bold">{footerLabel || "即時數據"}</span>
      <div className={`flex items-center gap-1 font-bold text-lg ${trendUp ? 'text-[#D6604A]' : 'text-slate-400'}`}>
         {trend === 'Live' && <div className="w-3 h-3 rounded-full bg-[#D6604A] animate-pulse mr-1.5"></div>}
         {trend}
         <span className="text-sm text-slate-400 font-medium ml-1 normal-case opacity-90">({sub})</span>
      </div>
    </div>
  </Card>
);

// 修正：InfoTooltip 支援點擊 (Click) 與 懸停 (Hover)，並調整位置避免被遮擋
const InfoTooltip = ({ text }) => {
  const [visible, setVisible] = useState(false);
  return (
    <div 
      className="relative flex items-center z-50 cursor-pointer"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onClick={(e) => { e.stopPropagation(); setVisible(!visible); }}
    >
      <Info size={14} className={`text-slate-400 hover:text-[#144679] transition-colors ${visible ? 'text-[#144679]' : ''}`} />
      
      {/* Tooltip Popup - 改為顯示在下方 (top-full) 並增加寬度 */}
      <div 
        className={`absolute top-full left-1/2 transform -translate-x-1/2 mt-3 w-80 p-4 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-600 shadow-2xl transition-all duration-200 z-[9999] leading-relaxed whitespace-pre-line ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'}`}
        style={{ backgroundColor: '#ffffff' }}
      >
        {text}
        {/* 箭頭 - 指向上方 */}
        <div className="absolute -top-1.5 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-white border-l border-t border-slate-200 rotate-45" style={{ backgroundColor: '#ffffff' }}></div>
      </div>
    </div>
  );
};

const HeatmapCell = ({ value, isBold }) => {
  const num = parseFloat(value);
  let colorClass = 'text-slate-400';
  if (num >= 4.5) colorClass = 'text-[#144679]'; // Dark Blue
  else if (num >= 4.0) colorClass = 'text-[#FAB346]'; // Yellow
  else if (num >= 3.5) colorClass = 'text-[#CC9337]'; // Gold
  else if (num > 0) colorClass = 'text-[#D6604A]'; // Red
  
  const fontClass = isBold ? 'text-2xl font-extrabold' : 'text-lg font-bold';

  return (
    <td className={`px-6 py-5 align-middle transition-colors hover:bg-slate-50 ${isBold ? 'text-right' : 'text-center'}`}>
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
        fill="#475569"
        fontSize={15}
        fontWeight={700}
        className={`transition-colors select-none ${visible ? 'fill-[#144679]' : 'group-hover:fill-[#144679]'}`}
      >
        {payload.value}
      </text>
      {def && (
        <foreignObject x={x - 80} y={y + 10} width="160" height="100" className={`overflow-visible transition-opacity duration-200 pointer-events-none z-50 ${visible ? 'opacity-100' : 'opacity-0'}`}>
          <div className="bg-white border border-slate-200 text-slate-600 text-xs p-2.5 rounded-lg shadow-xl relative mt-1 text-center" style={{ backgroundColor: '#ffffff' }}>
            <div className="font-bold text-[#144679] mb-1">{def.simple}</div>
            <div className="leading-relaxed text-[10px] text-slate-500">{def.desc}</div>
            <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-l border-t border-slate-200 rotate-45" style={{ backgroundColor: '#ffffff' }}></div>
          </div>
        </foreignObject>
      )}
    </g>
  );
};


const CustomDropdown = ({ options, value, onChange, label, icon: Icon }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = React.useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 bg-white px-6 py-2.5 rounded-full border border-slate-200 shadow-sm group hover:border-[#144679]/30 transition-colors min-w-[240px] justify-between"
      >
        <div className="flex items-center">
          <span className="text-slate-400 text-xs uppercase font-extrabold tracking-wider whitespace-nowrap mr-3">{label}:</span>
          <div className="flex items-center text-slate-700 font-bold text-sm">
            {Icon && <Icon className="w-4 h-4 text-[#144679] mr-2" />}
            {value === 'All' ? '全部角色 (All Roles)' : value}
          </div>
        </div>
        <div className="text-slate-400">
          <svg className={`fill-current h-4 w-4 transform transition-transform ${isOpen ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
        </div>
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-full bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden z-50 animate-fadeIn">
          <div className="max-h-64 overflow-y-auto custom-scrollbar">
            <div 
              className={`px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors flex items-center justify-between ${value === 'All' ? 'bg-slate-50 text-[#144679]' : 'text-slate-700'}`}
              onClick={() => { onChange('All'); setIsOpen(false); }}
            >
              <span className="font-bold text-sm">全部角色 (All Roles)</span>
              {value === 'All' && <div className="w-2 h-2 rounded-full bg-[#144679]"></div>}
            </div>
            {options.map(role => (
              <div 
                key={role} 
                className={`px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors flex items-center justify-between ${value === role ? 'bg-slate-50 text-[#144679]' : 'text-slate-700'}`}
                onClick={() => { onChange(role); setIsOpen(false); }}
              >
                <span className="font-bold text-sm">{role}</span>
                {value === role && <div className="w-2 h-2 rounded-full bg-[#144679]"></div>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
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

      let feedbackObj = { harvest: "", suggestion: "", application: "", link: "" };
      if (row.feedback) {
         if (typeof row.feedback === 'object') {
            feedbackObj.harvest = row.feedback.harvest || row.feedback.q1 || "";
            feedbackObj.suggestion = row.feedback.suggestion || row.feedback.q2 || "";
            feedbackObj.application = row.feedback.application || row.feedback.q3 || "";
            feedbackObj.link = row.feedback.link || row.feedback.open_4 || row.feedback.q4 || "";
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
      application: [],
      links: []
    };
    
    filteredData.forEach(item => {
      if (item.feedback.harvest && item.feedback.harvest.length > 2) 
        result.harvest.push({ id: item.id, role: item.role, text: item.feedback.harvest });
        
      if (item.feedback.suggestion && item.feedback.suggestion.length > 2) 
        result.suggestion.push({ id: item.id, role: item.role, text: item.feedback.suggestion });
        
      if (item.feedback.application && item.feedback.application.length > 2) 
        result.application.push({ id: item.id, role: item.role, text: item.feedback.application });

      if (item.feedback.link && item.feedback.link.length > 5)
        result.links.push({ id: item.id, role: item.role, url: item.feedback.link });
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

  if (loading) return <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-500"><Loader2 className="w-12 h-12 animate-spin text-[#144679] mb-4" /><p className="font-bold text-sm tracking-wide">正在連線至資料庫...</p></div>;
  if (error) return <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-[#D6604A]"><AlertCircle className="w-12 h-12 mb-4" /><h3 className="text-xl font-bold text-slate-800 mb-2">讀取資料失敗</h3><p className="mb-4 text-center max-w-md text-sm">{error}</p><button onClick={() => window.location.reload()} className="px-6 py-2 bg-white rounded-full hover:bg-slate-100 text-slate-800 font-bold text-sm transition-colors border border-slate-300 shadow-md">重新整理</button></div>;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans selection:bg-[#FAB346]/30 pb-12 relative overflow-x-hidden">
      
      {/* Background Layers */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 opacity-40 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#CBDFDF] rounded-full blur-[120px] opacity-50"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#FAB346] rounded-full blur-[120px] opacity-20"></div>
        <div className="absolute inset-0 bg-[url('https://uibucket.s3.amazonaws.com/grid-pattern.svg')] opacity-[0.02]"></div>
      </div>

      {/* Modal: Guide */}
      {showGuide && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn" onClick={() => setShowGuide(false)}>
          <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowGuide(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors p-2 rounded-full hover:bg-slate-100">
              <X size={20} />
            </button>
            <div className="p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-[#144679]/10 rounded-xl text-[#144679] border border-[#144679]/20"><HelpCircle size={28} /></div>
                <div>
                  <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">儀表板閱讀指南</h2>
                  <p className="text-slate-500 text-sm font-medium">如何解讀 AI 工作坊的成效數據？</p>
                </div>
              </div>
              <div className="space-y-4">
                 {Object.entries(METRIC_DEFINITIONS).slice(0, 4).map(([key, def]) => (
                   <div key={key} className="bg-slate-50 p-5 rounded-xl border border-slate-200 flex justify-between items-center shadow-sm hover:bg-white transition-colors">
                      <div>
                        <span className="font-extrabold text-[#144679] text-xl block mb-1.5">{def.title}</span>
                        <span className="text-base text-slate-600 font-medium leading-relaxed">{def.desc}</span>
                      </div>
                      <span className="text-base bg-[#144679] text-white px-4 py-2 rounded-lg font-bold shadow-md whitespace-nowrap ml-4">{def.simple}</span>
                   </div>
                 ))}
              </div>
              <button onClick={() => setShowGuide(false)} className="w-full mt-6 bg-[#144679] hover:bg-[#0f355a] text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-900/20">我瞭解了</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur-md sticky top-0 z-50 relative shadow-sm">
        <div className="max-w-[95%] mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col space-y-6">
          <div className="flex items-center space-x-4">
            <div className="p-2 bg-white rounded-xl shadow-lg shadow-blue-900/10 border border-slate-100">
              <img src={logoImg} alt="Logo" className="w-12 h-12 object-contain" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-[#144679] tracking-wide leading-tight">
                2025 奇美月｜AI 數位賦能工作坊
                <span className="block md:inline md:ml-2 text-2xl md:text-3xl text-slate-600">學員回饋分析儀表板</span>
              </h1>
              <p className="text-xs text-slate-400 uppercase tracking-[0.2em] mt-1 font-bold">Post-Workshop Data Analytics Center</p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center justify-start gap-4 border-t border-slate-100 pt-4">
             <button onClick={() => setShowGuide(true)} className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-[#144679] bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-all duration-300 group shadow-sm">
               <HelpCircle size={18} className="text-[#144679] group-hover:scale-110 transition-transform" />
               <span>指標定義說明</span>
             </button>

             <div className="h-8 w-px bg-slate-200 hidden sm:block mx-2"></div>

             <div className="bg-slate-100 p-1 rounded-lg flex border border-slate-200 shadow-inner">
                <button onClick={() => setViewMode('overview')} className={`px-4 py-2 text-sm font-bold rounded-md transition-all flex items-center gap-2 ${viewMode === 'overview' ? 'bg-white text-[#144679] shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}>
                  <BarChart2 size={16} /> 總覽模式
                </button>
                <button onClick={() => setViewMode('deep-dive')} className={`px-4 py-2 text-sm font-bold rounded-md transition-all flex items-center gap-2 ${viewMode === 'deep-dive' ? 'bg-white text-[#144679] shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}>
                  <Layers size={16} /> 深度比較
                </button>
             </div>

             {viewMode === 'overview' && (
               <div className="flex flex-col items-end ml-0 sm:ml-auto gap-2">
                  <img src={chimeiImg} alt="Chimei" className="h-8 object-contain" />
                  <CustomDropdown 
                    options={Object.keys(COLORS.roles)} 
                    value={selectedRole} 
                    onChange={setSelectedRole} 
                    label="FILTER"
                    icon={Filter}
                  />
               </div>
             )}
          </div>
        </div>
      </header>

      <main className="max-w-[95%] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 relative z-10">
        
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard title="總回收份數" value={kpi.count} icon={Users} trend="Live" trendUp={true} sub="即時填答" colorClass="bg-[#144679]" footerLabel="目前回收狀況" />
          <StatCard title="平均滿意度" value={kpi.avgSat} icon={Star} trend={kpi.avgSat >= 4.5 ? "優異" : "良好"} trendUp={true} sub="滿分 5.0" colorClass="bg-[#FAB346]" footerLabel="整體滿意度指標" />
          <StatCard title="學習成效指數" value={kpi.avgLearn} icon={Zap} trend={kpi.avgLearn >= 4 ? "高成效" : "需加強"} trendUp={kpi.avgLearn >= 4} sub="認知程度" colorClass="bg-[#0ea5e9]" footerLabel="知識吸收狀況" tooltip={METRIC_DEFINITIONS.learning_effectiveness.desc} />
          <StatCard title="淨推薦分數 (NPS)" value={kpi.nps} icon={TrendingUp} trend={kpi.nps > 30 ? "+極佳" : kpi.nps > 0 ? "+正向" : "-需改善"} trendUp={kpi.nps > 0} sub="口碑意願" colorClass="bg-[#D6604A]" footerLabel="推薦意願計算" tooltip={METRIC_DEFINITIONS.nps.desc} />
        </div>

        {viewMode === 'overview' && (
          <div className="space-y-8 animate-fadeIn">
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left: Radar Chart - Layout 6/12 */}
              <Card className="lg:col-span-6 flex flex-col min-h-[500px]">
                 <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-[#144679]/10 rounded border border-[#144679]/20"><Activity size={16} className="text-[#144679]" /></div>
                      <h3 className="text-lg font-bold text-slate-800">學習成效構面分析</h3>
                      <InfoTooltip text="滑鼠停留在各個構面文字上，可查看詳細定義與包含內容。" />
                    </div>
                    <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-1 rounded border border-slate-200">Role: {selectedRole}</span>
                 </div>
                 <div className="flex-1 flex flex-col md:flex-row">
                    <div className="flex-1 min-h-[350px] relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                          <PolarGrid stroke="#cbd5e1" strokeDasharray="3 3" />
                          <PolarAngleAxis dataKey="subject" tick={<CustomRadarTick />} />
                          <PolarRadiusAxis angle={30} domain={[0, 5]} tick={false} axisLine={false} />
                          <Radar name={selectedRole} dataKey="A" stroke={COLORS.primary} strokeWidth={3} fill={COLORS.primary} fillOpacity={0.2} />
                          <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#1e293b', borderRadius: '8px', fontWeight: 'bold', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="md:w-40 md:border-l border-slate-200 md:pl-4 mt-6 md:mt-0 flex flex-col justify-center gap-4">
                       <h4 className="text-sm font-extrabold text-slate-400 uppercase tracking-widest mb-2">維度快速解讀</h4>
                       {radarData.map((item, idx) => {
                         const defKey = ['learning_effectiveness', 'self_efficacy', 'transformative_learning', 'behavioral_intention'][idx];
                         // Changed 4th color to Teal (#0D9488) for better visibility
                         const colors = ['#144679', '#FAB346', '#D6604A', '#0D9488'];
                         const colorCode = colors[idx];
                         return (
                           <div key={item.subject} className="group">
                              <div className="flex justify-between items-end mb-1">
                                <span className="font-bold text-sm" style={{ color: colorCode }}>{item.subject}</span>
                                <span className="text-slate-800 font-mono font-bold text-lg">{item.A}</span>
                              </div>
                              <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                                 <div className="h-full rounded-full opacity-80" style={{ width: `${(item.A / 5) * 100}%`, backgroundColor: colorCode }}></div>
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
                          <Star size={16} className="text-[#FAB346]" />
                          <h3 className="text-lg font-bold text-slate-800">滿意度細項分析</h3>
                       </div>
                       <InfoTooltip text="顯示各個滿意度維度的平均分數，包含難易度、實用性等8大面向。" />
                    </div>
                    
                    <div className="flex flex-col md:flex-row gap-6 h-full">
                       <div className="flex-1 min-h-[250px]">
                         <ResponsiveContainer width="100%" height="100%">
                            <BarChart layout="vertical" data={satisfactionDetailedData.chartData} margin={{ top: 0, right: 40, left: 20, bottom: 0 }} barCategoryGap={12}>
                               <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                               <XAxis type="number" domain={[0, 5]} hide />
                               <YAxis dataKey="name" type="category" tick={{ fill: '#475569', fontWeight: 700, fontSize: 15 }} width={90} axisLine={false} tickLine={false} />
                               <Tooltip cursor={{fill: 'rgba(0,0,0,0.05)'}} contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#1e293b', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                               <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24} label={{ position: 'right', fill: '#1e293b', fontSize: 14, fontWeight: '800' }}>
                                  {satisfactionDetailedData.chartData?.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.fill} />))}
                               </Bar>
                            </BarChart>
                         </ResponsiveContainer>
                       </div>
                       <div className="md:w-48 flex flex-col justify-center gap-4 pl-4 md:border-l border-slate-200">
                          <h4 className="text-sm font-extrabold text-slate-400 uppercase tracking-widest">重點分析 Insights</h4>
                          <div className="bg-[#CBDFDF]/30 border border-[#CBDFDF] p-4 rounded-lg">
                             <div className="flex items-center gap-2 mb-1"><ThumbsUp size={16} className="text-[#144679]" /><span className="text-xs font-bold text-[#144679] uppercase">表現最佳 Strengths</span></div>
                             <div className="text-2xl font-extrabold text-slate-800">{satisfactionDetailedData.highest?.value}</div>
                             <div className="text-sm text-slate-500 mt-0.5">{satisfactionDetailedData.highest?.name}</div>
                          </div>
                          <div className={`border p-4 rounded-lg ${satisfactionDetailedData.lowest?.value < 4.0 ? 'bg-[#FAB346]/10 border-[#FAB346]/30' : 'bg-slate-50 border-slate-200'}`}>
                             <div className="flex items-center gap-2 mb-1"><AlertTriangle size={16} className={satisfactionDetailedData.lowest?.value < 4.0 ? "text-[#FAB346]" : "text-slate-400"} /><span className={`text-xs font-bold uppercase ${satisfactionDetailedData.lowest?.value < 4.0 ? "text-[#CC9337]" : "text-slate-400"}`}>需注意 Weaknesses</span></div>
                             <div className="text-2xl font-extrabold text-slate-800">{satisfactionDetailedData.lowest?.value}</div>
                             <div className="text-sm text-slate-500 mt-0.5">{satisfactionDetailedData.lowest?.name}</div>
                          </div>
                       </div>
                    </div>
                 </Card>
              </div>
            </div>

            {/* --- Qualitative Feedback Section (3 Columns) --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Column 1: Harvest */}
              <Card className="flex flex-col h-[400px] bg-white border-slate-200">
                 <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
                    <Sparkles size={20} className="text-[#144679]" />
                    <h3 className="text-lg font-bold text-slate-800">學習收穫</h3>
                    <span className="text-xs text-slate-400 ml-auto font-mono">{qualitativeFeedbacks.harvest.length} 則</span>
                 </div>
                 <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
                    {qualitativeFeedbacks.harvest.map((item, i) => (
                      <div key={i} className="bg-slate-50 p-4 rounded-2xl rounded-tl-none relative border border-slate-200 shadow-sm">
                        <div className="absolute -left-2 top-0 w-4 h-4 bg-slate-50 transform skew-x-12 z-0 border-l border-t border-slate-200"></div>
                        <div className="relative z-10">
                          <p className="text-base text-slate-700 leading-relaxed mb-2">{item.text}</p>
                          <div className="flex justify-end items-center gap-2">
                            <span className="text-xs font-bold text-[#144679] bg-[#144679]/10 px-2 py-1 rounded uppercase">{item.role}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                    {qualitativeFeedbacks.harvest.length === 0 && <div className="text-center text-slate-400 text-sm mt-10">尚無此類別回饋</div>}
                 </div>
              </Card>

              {/* Column 2: Suggestion */}
              <Card className="flex flex-col h-[400px] bg-white border-slate-200">
                 <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
                    <Lightbulb size={20} className="text-[#FAB346]" />
                    <h3 className="text-lg font-bold text-slate-800">建議改善</h3>
                    <span className="text-xs text-slate-400 ml-auto font-mono">{qualitativeFeedbacks.suggestion.length} 則</span>
                 </div>
                 <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
                    {qualitativeFeedbacks.suggestion.map((item, i) => (
                      <div key={i} className="bg-slate-50 p-4 rounded-2xl rounded-tl-none relative border border-slate-200 shadow-sm">
                         <div className="absolute -left-2 top-0 w-4 h-4 bg-slate-50 transform skew-x-12 z-0 border-l border-t border-slate-200"></div>
                         <div className="relative z-10">
                          <p className="text-base text-slate-700 leading-relaxed mb-2">{item.text}</p>
                          <div className="flex justify-end items-center gap-2">
                            <span className="text-xs font-bold text-[#CC9337] bg-[#FAB346]/10 px-2 py-1 rounded uppercase">{item.role}</span>
                          </div>
                         </div>
                      </div>
                    ))}
                    {qualitativeFeedbacks.suggestion.length === 0 && <div className="text-center text-slate-400 text-sm mt-10">尚無此類別回饋</div>}
                 </div>
              </Card>

              {/* Column 3: Application / Reflection */}
              <Card className="flex flex-col h-[400px] bg-white border-slate-200">
                 <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
                    <Rocket size={20} className="text-[#D6604A]" />
                    <h3 className="text-lg font-bold text-slate-800">應用與反思</h3>
                    <span className="text-xs text-slate-400 ml-auto font-mono">{qualitativeFeedbacks.application.length} 則</span>
                 </div>
                 <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
                    {qualitativeFeedbacks.application.map((item, i) => (
                      <div key={i} className="bg-slate-50 p-4 rounded-2xl rounded-tl-none relative border border-slate-200 shadow-sm">
                        <div className="absolute -left-2 top-0 w-4 h-4 bg-slate-50 transform skew-x-12 z-0 border-l border-t border-slate-200"></div>
                        <div className="relative z-10">
                          <p className="text-base text-slate-700 leading-relaxed mb-2">{item.text}</p>
                          <div className="flex justify-end items-center gap-2">
                            <span className="text-xs font-bold text-[#D6604A] bg-[#D6604A]/10 px-2 py-1 rounded uppercase">{item.role}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                    {qualitativeFeedbacks.application.length === 0 && <div className="text-center text-slate-400 text-sm mt-10">尚無此類別回饋</div>}
                 </div>
              </Card>
            </div>

            {/* --- Student Works Gallery --- */}
            <div className="mt-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-[#144679] rounded-lg shadow-md">
                  <ImageIcon size={24} className="text-white" />
                </div>
                <h2 className="text-2xl font-extrabold text-[#144679]">學員作品展示 Gallery</h2>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {qualitativeFeedbacks.links.map((item, i) => (
                  <a 
                    key={i} 
                    href={item.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="group block bg-white rounded-xl overflow-hidden border border-slate-200 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                  >
                    <div className="h-48 bg-slate-100 relative overflow-hidden">
                      {/* Try to use Microlink for preview, fallback to icon */}
                      <img 
                        src={`https://api.microlink.io/?url=${encodeURIComponent(item.url)}&screenshot=true&meta=false&embed=screenshot.url`} 
                        alt="Website Preview" 
                        className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                        onError={(e) => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-slate-100 text-slate-300 hidden">
                        <ExternalLink size={48} />
                      </div>
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors"></div>
                    </div>
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-[#144679] bg-[#CBDFDF] px-2 py-1 rounded uppercase">{item.role}</span>
                        <ExternalLink size={14} className="text-slate-400 group-hover:text-[#144679]" />
                      </div>
                      <h4 className="font-bold text-slate-800 text-sm line-clamp-1 mb-1">{item.url.replace(/^https?:\/\//, '')}</h4>
                      <p className="text-xs text-slate-500">點擊查看學員作品</p>
                    </div>
                  </a>
                ))}
                {qualitativeFeedbacks.links.length === 0 && (
                  <div className="col-span-full py-12 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                    <ImageIcon size={48} className="mx-auto mb-3 opacity-20" />
                    <p>目前尚無學員提交作品連結</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {viewMode === 'deep-dive' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <div className="flex items-center gap-2 mb-4">
                   <BarChart2 size={18} className="text-[#FAB346]" />
                   <h3 className="text-lg font-bold text-slate-800">角色間滿意度差異</h3>
                   <InfoTooltip text="比較不同職類在「整體滿意度」與「課程設計」上的評分差異。" />
                </div>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={roleComparisonData} margin={{top: 20, right: 30, left: 20, bottom: 5}}>
                      <XAxis dataKey="name" tick={{ fill: '#475569', fontWeight: 700 }} />
                      <YAxis domain={[0, 5]} tick={{ fill: '#94a3b8', fontWeight: 600 }} />
                      <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', color: '#1e293b' }} />
                      <Legend />
                      <Bar dataKey="整體滿意度" fill={COLORS.primary} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="課程設計" fill={COLORS.accent} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
              <Card>
                 <div className="flex items-center gap-2 mb-4">
                   <Layers size={18} className="text-[#144679]" />
                   <h3 className="text-lg font-bold text-slate-800">學習成效 - 角色交叉比對</h3>
                 </div>
                 <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                      <PolarGrid stroke="#cbd5e1" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontWeight: 700, fontSize: 12 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 5]} tick={false} axisLine={false} />
                      {Object.keys(COLORS.roles).map((role) => (<Radar key={role} name={role} dataKey={role} stroke={COLORS.roles[role]} strokeWidth={2} fill="transparent" />))}
                      <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} iconType="circle" />
                      <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', color: '#1e293b' }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>
            <Card className="overflow-hidden p-0 border-none shadow-lg">
              <div className="p-6 border-b border-slate-200 bg-slate-50">
                 <h3 className="text-lg font-bold text-slate-800">各構面得分熱力矩陣</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-600">
                  <thead className="text-sm text-slate-500 uppercase bg-slate-100">
                    <tr>
                      <th className="px-6 py-4 font-extrabold tracking-wider">角色 Role</th>
                      <th className="px-6 py-4 font-extrabold text-center">學習成效</th>
                      <th className="px-6 py-4 font-extrabold text-center">自我效能</th>
                      <th className="px-6 py-4 font-extrabold text-center">轉化學習</th>
                      <th className="px-6 py-4 font-extrabold text-center">行為意圖</th>
                      <th className="px-6 py-4 text-right font-extrabold">滿意度</th>
                    </tr>
                  </thead>
                  <tbody className="font-medium divide-y divide-slate-100">
                    {Object.keys(COLORS.roles).map((role) => {
                      const roleData = rawData.filter(d => d.role === role);
                      const getAvg = (key) => roleData.length ? (roleData.reduce((acc, cur) => acc + cur[key], 0) / roleData.length).toFixed(2) : '-';
                      return (
                        <tr key={role} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 font-bold text-slate-800 flex items-center gap-3 text-base">
                            <div className="w-3 h-3 rounded-sm shadow-sm" style={{backgroundColor: COLORS.roles[role]}}></div>
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
      
      <footer className="text-center py-8 text-slate-400 text-sm font-medium border-t border-slate-200 mt-12 relative z-10 bg-white">
        © 2025 奇美醫院教學部
      </footer>

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
