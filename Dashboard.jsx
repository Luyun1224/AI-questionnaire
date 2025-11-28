import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Cell,
  ScatterChart, Scatter, ZAxis, ReferenceLine
} from 'recharts';
import { 
  Users, Star, Zap, Filter, Activity, BarChart2, 
  Layers, HelpCircle, X, Info, Loader2, AlertCircle, TrendingUp,
  ThumbsUp, AlertTriangle, Lightbulb, Rocket, Sparkles, ExternalLink, Image as ImageIcon,
  BrainCircuit, ArrowRight, Target, ClipboardCheck, Monitor, UserCog,
  UserCheck, Briefcase, GraduationCap, Scale, Divide, RefreshCw, Quote, MessageSquare,
  CheckCircle2, AlertOctagon, FileText
} from 'lucide-react';

// ==========================================
// Constants & Configuration
// ==========================================

// Google Apps Script API URL
const GAS_API_URL = "https://script.google.com/macros/s/AKfycbz4YSi0cs7cV8dM3Sm70MMTXbov6FvQk5ZvnmyEkrOrZiwaqhgxeyaf0uMdkqizU0n-/exec"; 
const TOTAL_PARTICIPANTS = 61;

const LOGO_IMG = "/logo.png";  // Changed from placeholder to actual logo
const CHIMEI_IMG = "/Chimei.png";  // Changed from placeholder to actual image

const SATISFACTION_LABELS = [
  "內容實用性", "難易度適中", "講師表達", "互動氣氛", 
  "時間掌控", "教材品質", "行政安排", "整體推薦"
];

const COLORS = {
  primary: '#144679',     // Dark Blue
  secondary: '#FAB346',   // Yellow
  accent: '#D6604A',      // Red
  success: '#34d399',     // Emerald
  warning: '#CC9337',     // Gold
  bg: '#f8fafc',          // Light Mode Background
  itInstructor: '#0ea5e9', // Sky Blue for IT
  adminInstructor: '#FAB346', // Yellow for Admin
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
    desc: "這是學員對課程核心知識吸收程度的自我評估。\n計算方式：取問卷前三題平均分數。",
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
    desc: "計算公式：(推薦者% - 批評者%) × 100",
    simple: "推不推薦？"
  }
};

// Mock Data for Fallback (Only used if fetch fails)
const MOCK_DATA = Array.from({ length: 60 }, (_, i) => {
  const roles = Object.keys(COLORS.roles);
  const role = roles[Math.floor(Math.random() * roles.length)];
  
  // MATCHING THE REAL LOGIC: Indices 17, 18, 22, 25, 30, 39 are IT
  const IT_INDICES_MOCK = [17, 18, 22, 25, 30, 39];
  const isITSession = IT_INDICES_MOCK.includes(i);
  
  const baseScore = isITSession ? 3.8 : 4.5; 
  const genScore = () => Math.min(5, Math.max(1, baseScore + (Math.random() - 0.5) * 1.2));
  
  const post_scores = Array(9).fill(0).map(genScore);
  const sat_scores = Array(8).fill(0).map(genScore);

  return {
    role,
    post_scores,
    sat_scores,
    feedback: {
      harvest: isITSession ? "學會了 Python 基礎與 API 串接，雖然有點難但很有用。" : "了解 AI 對行政效率的幫助，這對我寫公文很有幫助。",
      plan: "嘗試導入日常業務流程",
      suggestion: isITSession ? "程式碼部分太難了，跟不上，希望有講義。" : "希望能多一點實作時間，時間有點趕。",
      link: Math.random() > 0.8 ? "https://example.com/project" : ""
    }
  };
});

// ==========================================
// Sub-Components
// ==========================================

const Card = ({ children, className = "" }) => (
  <div className={`bg-white border border-slate-200 rounded-2xl p-6 shadow-lg transition-all hover:shadow-xl relative ${className}`}>
    {children}
  </div>
);

// Adjusted InfoTooltip to display BELOW the icon to avoid clipping
const InfoTooltip = ({ text }) => {
  const [visible, setVisible] = useState(false);
  return (
    <div 
      className="relative flex items-center z-50 cursor-pointer inline-block ml-1"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onClick={(e) => { e.stopPropagation(); setVisible(!visible); }}
    >
      <Info size={14} className={`text-slate-400 hover:text-[#144679] transition-colors ${visible ? 'text-[#144679]' : ''}`} />
      <div 
        className={`absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-72 p-4 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 shadow-2xl transition-all duration-200 z-[9999] leading-relaxed whitespace-pre-line ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'}`}
      >
        {text}
        {/* Triangle pointing up */}
        <div className="absolute -top-1.5 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-white border-t border-l border-slate-200 rotate-45"></div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, trend, trendUp, sub, colorClass, footerLabel, tooltip }) => (
  <Card className="group hover:z-30 overflow-visible"> 
    {/* overflow-visible allows tooltip to escape if needed, though we moved it down */}
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
        <div className={`absolute -top-4 -right-4 opacity-[0.05] group-hover:opacity-[0.1] transition-opacity transform group-hover:scale-110 duration-500 text-slate-900`}>
        <Icon size={160} />
        </div>
    </div>
    <div className="flex justify-between items-start relative z-20">
      <div>
        <div className="flex items-center gap-2 mb-3">
          <h3 className="text-slate-600 text-sm font-extrabold uppercase tracking-wider">{title}</h3>
          {tooltip && <InfoTooltip text={tooltip} />}
        </div>
        <div className="text-5xl lg:text-6xl font-black text-[#144679] tracking-tight mt-1 drop-shadow-sm">{value}</div>
      </div>
      <div className={`p-3 rounded-xl shadow-sm bg-[#CBDFDF] bg-opacity-50 border border-slate-100`}>
        <Icon size={28} className="text-[#144679]" />
      </div>
    </div>
    <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center relative z-10">
      <span className="text-xs text-slate-500 font-bold">{footerLabel || "即時數據"}</span>
      <div className={`flex items-center gap-1 font-bold text-sm ${trendUp ? 'text-[#D6604A]' : 'text-slate-400'}`}>
         {trend === 'Live' && <div className="w-2 h-2 rounded-full bg-[#D6604A] animate-pulse mr-1"></div>}
         {trend}
         <span className="text-xs text-slate-400 font-medium ml-1 normal-case opacity-90">({sub})</span>
      </div>
    </div>
  </Card>
);

const HeatmapCell = ({ value, isBold }) => {
  const num = parseFloat(value);
  let colorClass = 'text-slate-400';
  if (num >= 4.5) colorClass = 'text-[#144679]'; 
  else if (num >= 4.0) colorClass = 'text-[#FAB346]'; 
  else if (num >= 3.5) colorClass = 'text-[#CC9337]'; 
  else if (num > 0) colorClass = 'text-[#D6604A]'; 
  
  const fontClass = isBold ? 'text-xl font-extrabold' : 'text-lg font-bold';

  return (
    <td className={`px-4 py-4 align-middle transition-colors hover:bg-slate-50 ${isBold ? 'text-right' : 'text-center'}`}>
      <span className={`${colorClass} ${fontClass}`}>{value === '-' ? '-' : num}</span>
    </td>
  );
};

const CustomRadarTick = ({ payload, x, y, textAnchor }) => {
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
        fontSize={12}
        fontWeight={700}
        className={`transition-colors select-none ${visible ? 'fill-[#144679]' : 'group-hover:fill-[#144679]'}`}
      >
        {payload.value}
      </text>
      {def && visible && (
        <foreignObject x={x - 75} y={y + 10} width="150" height="100" className="overflow-visible z-50">
          <div className="bg-white border border-slate-200 text-slate-600 text-[10px] p-2 rounded-lg shadow-xl text-center">
            <div className="font-bold text-[#144679] mb-1">{def.simple}</div>
          </div>
        </foreignObject>
      )}
    </g>
  );
};

const InsightCard = ({ title, children, icon: Icon, className }) => (
  <div className={`p-6 rounded-2xl border border-slate-700/30 backdrop-blur-sm ${className}`}>
    <div className="flex items-center gap-3 mb-4">
      {Icon && <Icon size={24} className="text-[#FAB346]" />}
      <h3 className="text-xl font-bold text-white tracking-wide">{title}</h3>
    </div>
    <div className="text-slate-300 text-base leading-relaxed space-y-3">
      {children}
    </div>
  </div>
);

const CustomDropdown = ({ options, value, onChange, label, icon: Icon }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

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
        className="flex items-center space-x-3 bg-white px-4 py-2.5 rounded-full border border-slate-200 shadow-sm group hover:border-[#144679]/30 transition-colors min-w-[200px] justify-between"
      >
        <div className="flex items-center">
          <span className="text-slate-400 text-[10px] uppercase font-extrabold tracking-wider whitespace-nowrap mr-2 hidden sm:block">{label}:</span>
          <div className="flex items-center text-slate-700 font-bold text-sm">
            {Icon && <Icon className="w-4 h-4 text-[#144679] mr-2" />}
            {value === 'All' ? '全部角色' : value}
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
              <span className="font-bold text-sm">全部角色 (All)</span>
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

// ==========================================
// Main Application Component
// ==========================================

const App = () => {
  const [viewMode, setViewMode] = useState('overview'); 
  const [selectedRole, setSelectedRole] = useState('All');
  const [showGuide, setShowGuide] = useState(false);
  const [rawData, setRawData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isUsingMock, setIsUsingMock] = useState(false);

  // Data Processing Logic
  const processSheetData = (data) => {
    if (!Array.isArray(data)) return [];

    // STRICT IT INSTRUCTOR IDENTIFICATION
    // Based on user feedback: Indices 17, 18, 22, 25, 30, 39 are IT sessions.
    const IT_INDICES = [17, 18, 22, 25, 30, 39];

    return data.map((row, index) => {
      const posts = Array.isArray(row.post_scores) ? row.post_scores.map(n => Number(n) || 0) : []; 
      const sats = Array.isArray(row.sat_scores) ? row.sat_scores.map(n => Number(n) || 0) : [];   
      const avg = (arr) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

      let feedbackObj = { harvest: "", suggestion: "", application: "", link: "" };
      if (row.feedback) {
         if (typeof row.feedback === 'object') {
            feedbackObj.harvest = row.feedback.harvest || row.feedback.q1 || "";
            feedbackObj.application = row.feedback.plan || row.feedback.q2 || "";
            feedbackObj.suggestion = row.feedback.suggestion || row.feedback.q3 || "";
            feedbackObj.link = row.feedback.link || row.feedback.open_4 || row.feedback.q4 || "";
         } else {
            feedbackObj.harvest = String(row.feedback);
         }
      }

      // Identify Instructor Type
      const isIT = IT_INDICES.includes(index);
      const instructorType = isIT ? 'IT_Instructor' : 'Admin_Instructor';

      return {
        id: index,
        role: row.role || '其他',
        learning_effectiveness: avg(posts.slice(0, 3)), 
        self_efficacy: avg(posts.slice(3, 5)),          
        transformative_learning: avg(posts.slice(5, 7)),
        behavioral_intention: avg(posts.slice(7, 9)),   
        satisfaction_items: sats, 
        satisfaction_overall: avg(sats), 
        feedback: feedbackObj,
        isIT: isIT,
        instructorType: instructorType
      };
    });
  };

  // Fetch Data with Fallback
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch(GAS_API_URL);
        if (!response.ok) throw new Error('Network response was not ok');
        const json = await response.json();
        setRawData(processSheetData(json));
        setIsUsingMock(false);
        setLoading(false);
      } catch (err) {
        console.warn("API Fetch Failed, loading Mock Data:", err);
        setRawData(processSheetData(MOCK_DATA));
        setIsUsingMock(true);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Derived State Calculations
  const filteredData = useMemo(() => {
    return selectedRole === 'All' ? rawData : rawData.filter(d => d.role === selectedRole);
  }, [selectedRole, rawData]);

  // Instructor Analysis Data
  const instructorAnalysis = useMemo(() => {
      const itSessions = rawData.filter(d => d.instructorType === 'IT_Instructor');
      const adminSessions = rawData.filter(d => d.instructorType === 'Admin_Instructor');

      const calcNPS = (data) => {
          if (!data.length) return 0;
          const proms = data.filter(d => d.satisfaction_overall >= 4.5).length;
          const dets = data.filter(d => d.satisfaction_overall <= 3).length;
          return Math.round(((proms - dets) / data.length) * 100);
      };

      const calcAvg = (data, key) => data.length ? (data.reduce((acc, cur) => acc + cur[key], 0) / data.length) : 0;
      const calcSatItemAvg = (data, idx) => data.length ? (data.reduce((acc, cur) => acc + (cur.satisfaction_items[idx] || 0), 0) / data.length) : 0;

      return {
          it: {
              count: itSessions.length,
              nps: calcNPS(itSessions),
              sat: calcAvg(itSessions, 'satisfaction_overall'),
              learn: calcAvg(itSessions, 'learning_effectiveness'),
              efficacy: calcAvg(itSessions, 'self_efficacy'),
              difficulty: calcSatItemAvg(itSessions, 1) // 難易度適中
          },
          admin: {
              count: adminSessions.length,
              nps: calcNPS(adminSessions),
              sat: calcAvg(adminSessions, 'satisfaction_overall'),
              learn: calcAvg(adminSessions, 'learning_effectiveness'),
              efficacy: calcAvg(adminSessions, 'self_efficacy'),
              difficulty: calcSatItemAvg(adminSessions, 1) // 難易度適中
          }
      };
  }, [rawData]);

  const instructorGapData = useMemo(() => {
      // Changed to absolute values for Grouped Bar Chart instead of Difference
      const metrics = [
          { name: 'NPS', admin: instructorAnalysis.admin.nps, it: instructorAnalysis.it.nps },
          { name: '整體滿意度', admin: Number(instructorAnalysis.admin.sat.toFixed(2)), it: Number(instructorAnalysis.it.sat.toFixed(2)) },
          { name: '難易度適中', admin: Number(instructorAnalysis.admin.difficulty.toFixed(2)), it: Number(instructorAnalysis.it.difficulty.toFixed(2)) },
          { name: '自我效能(信心)', admin: Number(instructorAnalysis.admin.efficacy.toFixed(2)), it: Number(instructorAnalysis.it.efficacy.toFixed(2)) },
      ];
      return metrics;
  }, [instructorAnalysis]);

  const qualitativeFeedbacks = useMemo(() => {
    const result = { harvest: [], suggestion: [], application: [], links: [] };
    
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

  // --- Keyword Synthesis for Insights ---
  const synthesizeFeedback = (feedbacks, keywords) => {
      if (!feedbacks || feedbacks.length === 0) return [];
      
      const results = keywords.map(kw => {
          const count = feedbacks.filter(f => f.text.includes(kw.term)).length;
          return { ...kw, count };
      }).filter(r => r.count > 0).sort((a, b) => b.count - a.count);

      if (results.length === 0 && feedbacks.length > 0) {
          return [{ term: "一般回饋", desc: "學員提供了一般性的正面回饋", count: feedbacks.length }];
      }
      return results;
  };

  const satisfactionHighlights = useMemo(() => {
      const positiveKeywords = [
          { term: "實用", desc: "內容切合工作需求" },
          { term: "效率", desc: "提升行政/工作效率" },
          { term: "清楚", desc: "講師講解清晰易懂" },
          { term: "有趣", desc: "課程互動性佳" },
          { term: "學會", desc: "確實掌握技能" },
          { term: "感謝", desc: "感謝講師的用心" }
      ];
      return synthesizeFeedback(qualitativeFeedbacks.harvest, positiveKeywords).slice(0, 4);
  }, [qualitativeFeedbacks]);

  const improvementHighlights = useMemo(() => {
      const negativeKeywords = [
          { term: "快", desc: "教學節奏過快" },
          { term: "難", desc: "操作難度過高" },
          { term: "跟不上", desc: "實作時間不足" },
          { term: "時間", desc: "整體時程緊湊" },
          { term: "網路", desc: "硬體/網路問題" }
      ];
      return synthesizeFeedback(qualitativeFeedbacks.suggestion, negativeKeywords).slice(0, 4);
  }, [qualitativeFeedbacks]);

  const learningInsights = useMemo(() => {
      const quotes = qualitativeFeedbacks.harvest
        .filter(f => f.text.length > 10 && (f.text.includes("學會") || f.text.includes("了解")))
        .sort(() => 0.5 - Math.random())
        .slice(0, 2);
      return quotes;
  }, [qualitativeFeedbacks]);


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

  if (loading) return <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-500"><Loader2 className="w-12 h-12 animate-spin text-[#144679] mb-4" /><p className="font-bold text-sm tracking-wide">正在載入數據...</p></div>;
  if (error) return <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-[#D6604A]"><AlertCircle className="w-12 h-12 mb-4" /><h3 className="text-xl font-bold text-slate-800 mb-2">Error Loading Data</h3><p className="mb-4 text-center max-w-md text-sm">{error}</p></div>;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans selection:bg-[#FAB346]/30 pb-12 relative overflow-x-hidden">
      
      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#CBDFDF] rounded-full blur-[120px] opacity-50"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#FAB346] rounded-full blur-[120px] opacity-20"></div>
        <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px]"></div>
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
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                 {Object.entries(METRIC_DEFINITIONS).slice(0, 4).map(([key, def]) => (
                   <div key={key} className="bg-slate-50 p-5 rounded-xl border border-slate-200 flex justify-between items-center shadow-sm hover:bg-white transition-colors">
                     <div>
                       <span className="font-extrabold text-[#144679] text-xl block mb-1.5">{def.title}</span>
                       <span className="text-base text-slate-600 font-medium leading-relaxed whitespace-pre-line">{def.desc}</span>
                     </div>
                     <span className="text-base bg-[#144679] text-white px-4 py-2 rounded-lg font-bold shadow-md whitespace-nowrap ml-4 hidden sm:block">{def.simple}</span>
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
        <div className="max-w-[95%] mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
             <div className="flex items-center space-x-4">
               <div className="p-2 bg-white rounded-xl shadow-lg shadow-blue-900/10 border border-slate-100">
                 <img src={LOGO_IMG} alt="Logo" className="w-10 h-10 object-contain rounded-md" />
               </div>
               <div>
                 <h1 className="text-2xl md:text-3xl font-extrabold text-[#144679] tracking-wide leading-tight">
                   2025 奇美月｜AI 數位賦能工作坊
                 </h1>
                 <p className="text-[10px] text-slate-400 uppercase tracking-[0.2em] mt-1 font-bold">Post-Workshop Analytics</p>
               </div>
             </div>
             <div className="flex flex-col items-end">
                <img src={CHIMEI_IMG} alt="Chimei" className="h-8 object-contain hidden md:block" />
                {isUsingMock && (
                  <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold mt-1">
                    注意：無法連接資料庫，目前顯示範例資料
                  </span>
                )}
             </div>
          </div>
          
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-3">
              <div className="flex items-center gap-4">
                <button onClick={() => setShowGuide(true)} className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-[#144679] bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-all duration-300 group shadow-sm">
                  <HelpCircle size={16} className="text-[#144679] group-hover:scale-110 transition-transform" />
                  <span className="hidden sm:inline">指標說明</span>
                </button>

                <div className="bg-slate-100 p-1 rounded-lg flex border border-slate-200 shadow-inner overflow-x-auto">
                  <button onClick={() => setViewMode('overview')} className={`px-4 py-2 text-sm font-bold rounded-md transition-all flex items-center gap-2 whitespace-nowrap ${viewMode === 'overview' ? 'bg-white text-[#144679] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                    <BarChart2 size={16} /> <span className="hidden sm:inline">總覽</span>
                  </button>
                  <button onClick={() => setViewMode('deep-dive')} className={`px-4 py-2 text-sm font-bold rounded-md transition-all flex items-center gap-2 whitespace-nowrap ${viewMode === 'deep-dive' ? 'bg-white text-[#144679] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                    <Layers size={16} /> <span className="hidden sm:inline">深度比較</span>
                  </button>
                </div>
              </div>

              {viewMode === 'overview' && (
                 <CustomDropdown 
                   options={Object.keys(COLORS.roles)} 
                   value={selectedRole} 
                   onChange={setSelectedRole} 
                   label="FILTER"
                   icon={Filter}
                 />
              )}
          </div>
        </div>
      </header>

      <main className="max-w-[95%] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 relative z-10">
        
        {/* Top Stats - Always Visible */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard title="總回收份數" value={kpi.count} icon={Users} trend="Live" trendUp={true} sub={`回收率 ${((kpi.count / TOTAL_PARTICIPANTS) * 100).toFixed(1)}%`} colorClass="bg-[#144679]" footerLabel={`實到 ${TOTAL_PARTICIPANTS} 人`} />
          <StatCard title="平均滿意度" value={kpi.avgSat} icon={Star} trend={kpi.avgSat >= 4.5 ? "優異" : "良好"} trendUp={true} sub="滿分 5.0" colorClass="bg-[#FAB346]" footerLabel="整體滿意度指標" />
          <StatCard title="學習成效指數" value={kpi.avgLearn} icon={Zap} trend={kpi.avgLearn >= 4 ? "高成效" : "需加強"} trendUp={kpi.avgLearn >= 4} sub="認知程度" colorClass="bg-[#0ea5e9]" footerLabel="知識吸收狀況" tooltip={METRIC_DEFINITIONS.learning_effectiveness.desc} />
          <StatCard title="淨推薦分數 (NPS)" value={kpi.nps} icon={TrendingUp} trend={kpi.nps > 30 ? "+極佳" : kpi.nps > 0 ? "+正向" : "-需改善"} trendUp={kpi.nps > 0} sub="口碑意願" colorClass="bg-[#D6604A]" footerLabel="推薦意願計算" tooltip={METRIC_DEFINITIONS.nps.desc} />
        </div>

        {/* Instructor Analysis Section - Merged into Overview */}
        {viewMode === 'overview' && (
        <section className={`rounded-3xl p-6 lg:p-8 text-white relative overflow-hidden shadow-2xl animate-fadeIn bg-gradient-to-r from-[#1e293b] to-[#144679]`}>
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#FAB346] rounded-full blur-[150px] opacity-10 pointer-events-none -translate-y-1/2 translate-x-1/4"></div>
          
          <div className="relative z-10">
            <div className="mb-8 border-b border-white/10 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <BrainCircuit className="text-[#FAB346]" size={32} />
                  <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                    師資成效洞察與建議
                  </h2>
                </div>
                <p className="text-slate-300 text-sm md:text-lg font-light">
                  行政新手 vs IT 專家的教學風格分析
                </p>
              </div>
            </div>

            {/* Changed to Single Column / Larger Layout for clarity as requested */}
            <div className="flex flex-col gap-8">
                
                {/* 1. Teaching Gap & Acceptance */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InsightCard title="教學風格落差 Teaching Gap" icon={Scale} className="bg-white/5 h-full">
                      <p className="text-slate-300 mb-3 text-lg leading-relaxed">
                        數據顯示，<strong className="text-[#FAB346]">行政講師 (Admin)</strong> 在<span className="text-white font-bold">「難易度適中」</span>與<span className="text-white font-bold">「自我效能」</span>得分較高，顯示其作為新手過來人，較能降低學員的進入門檻。
                      </p>
                      <div className="h-px bg-white/10 my-4"></div>
                      <p className="text-slate-300 text-lg leading-relaxed">
                        相對地，<strong className="text-[#0ea5e9]">IT 講師</strong> 在<span className="text-white font-bold">「內容深度」</span>上具有優勢，但部分學員反饋操作跟不上。
                      </p>
                    </InsightCard>

                    <InsightCard title="學員接受度 Acceptance (NPS)" icon={UserCheck} className="bg-white/5 h-full">
                        <div className="flex flex-col gap-6 mt-2">
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-lg font-bold text-slate-300">Admin NPS (行政講師)</span>
                              <span className="text-[#FAB346] font-bold text-3xl">{instructorAnalysis.admin.nps}</span>
                            </div>
                            <div className="w-full bg-white/10 rounded-full h-4">
                              <div className="bg-[#FAB346] h-4 rounded-full transition-all duration-1000" style={{ width: `${Math.max(0, instructorAnalysis.admin.nps)}%` }}></div>
                            </div>
                          </div>
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-lg font-bold text-slate-300">IT NPS (資訊講師)</span>
                              <span className="text-[#0ea5e9] font-bold text-3xl">{instructorAnalysis.it.nps}</span>
                            </div>
                            <div className="w-full bg-white/10 rounded-full h-4">
                              <div className="bg-[#0ea5e9] h-4 rounded-full transition-all duration-1000" style={{ width: `${Math.max(0, instructorAnalysis.it.nps)}%` }}></div>
                            </div>
                          </div>
                        </div>
                    </InsightCard>
                </div>

                {/* 2. Role Summary & Co-teaching Strategy */}
                <InsightCard title="角色與教學成效總結 Summary" icon={Briefcase} className="bg-white/5">
                   <div className="space-y-6 text-base text-slate-300 leading-loose">
                       <div>
                          <strong className="text-[#FAB346] text-lg block mb-2">行政講師的優勢 (Primary Instructor - Empathy)：</strong> 
                          行政人員不僅是輔助，更是本次工作坊的<strong className="text-white">核心講師</strong>。由於自身也是從「非技術背景」跨入 AI 領域，因此在教學時更懂得如何拆解步驟，並給予學員（尤其是同樣非技術背景的行政/護理人員）更多的信心支持（自我效能分數較高），是降低技術門檻的關鍵推手。
                       </div>
                       <div>
                          <strong className="text-[#0ea5e9] text-lg block mb-2">IT 講師的挑戰 (Technical Depth)：</strong>
                          雖然在技術原理上解釋得更透徹（潛在學習成效高），但容易出現「知識詛咒 (Curse of Knowledge)」，誤以為學員都具備基礎電腦知識，導致教學節奏過快，學員挫折感較重（難易度適中分數較低）。
                       </div>
                       <div className="bg-slate-800/50 p-6 rounded-xl border-l-4 border-[#FAB346]">
                          <strong className="text-white text-lg block mb-2">雙師共教策略 (Co-Teaching Strategy)：</strong>
                          未來的 AI 課程應確立<strong className="text-[#FAB346]">「行政講師主導場景應用，IT 講師支援技術深度」</strong>的平等互補模式。由行政講師負責開場建立信心與操作引導，IT 講師負責解決突發技術問題與進階原理補充，兩者缺一不可。
                       </div>
                   </div>
                </InsightCard>

                {/* 3. PDCA */}
                <InsightCard title="PDCA 未來行動 Future Actions" icon={RefreshCw} className="bg-white/5">
                  <div className="space-y-4">
                    <div className="flex gap-4 items-start">
                      <div className="w-8 h-8 rounded-full bg-[#D6604A] flex items-center justify-center text-sm font-black text-white shrink-0 mt-1">P</div>
                      <div className="text-base text-slate-300 leading-relaxed"><strong className="text-white text-lg">Plan (計畫)：</strong>重新盤點教案，將技術門檻過高的環節進行拆解。規劃「雙師共教」標準流程，明確定義行政與 IT 講師在課堂中的分工與互動節點。</div>
                    </div>
                    <div className="flex gap-4 items-start">
                      <div className="w-8 h-8 rounded-full bg-[#FAB346] flex items-center justify-center text-sm font-black text-slate-800 shrink-0 mt-1">D</div>
                      <div className="text-base text-slate-300 leading-relaxed"><strong className="text-white text-lg">Do (執行)：</strong>於下場次工作坊正式執行優化後的雙師模式。行政講師主講應用，IT 講師作為技術後盾隨時支援，確保學員不卡關。</div>
                    </div>
                    <div className="flex gap-4 items-start">
                      <div className="w-8 h-8 rounded-full bg-[#34d399] flex items-center justify-center text-sm font-black text-slate-800 shrink-0 mt-1">C</div>
                      <div className="text-base text-slate-300 leading-relaxed"><strong className="text-white text-lg">Check (查核)：</strong>重點追蹤學員的<strong className="text-[#FAB346]">「自我效能」</strong>與<strong className="text-[#FAB346]">「難易度適中」</strong>評分是否提升，以此驗證雙師模式是否有效降低了學習焦慮。</div>
                    </div>
                    <div className="flex gap-4 items-start">
                      <div className="w-8 h-8 rounded-full bg-[#0ea5e9] flex items-center justify-center text-sm font-black text-white shrink-0 mt-1">A</div>
                      <div className="text-base text-slate-300 leading-relaxed"><strong className="text-white text-lg">Act (行動)：</strong>將此成功模式建立為標準化的「數位賦能教學 SOP」，並將行政講師的培訓經驗傳承，培育更多種子教師。</div>
                    </div>
                  </div>
                </InsightCard>
            </div>
          </div>
        </section>
        )}

        {viewMode === 'overview' && (
          <div className="space-y-8 animate-fadeIn">
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Radar Chart + Qualitative Insights */}
              <Card className="lg:col-span-6 flex flex-col min-h-[500px]">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-[#144679]/10 rounded border border-[#144679]/20"><Activity size={16} className="text-[#144679]" /></div>
                      <h3 className="text-lg font-bold text-slate-800">學習成效構面分析</h3>
                    </div>
                    <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-1 rounded border border-slate-200">Role: {selectedRole}</span>
                  </div>
                  <div className="flex-1 flex flex-col md:flex-row gap-6">
                    <div className="flex-1 w-full h-[350px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                          <PolarGrid stroke="#cbd5e1" strokeDasharray="3 3" />
                          <PolarAngleAxis dataKey="subject" tick={<CustomRadarTick />} />
                          <PolarRadiusAxis angle={30} domain={[0, 5]} tick={false} axisLine={false} />
                          <Radar name={selectedRole} dataKey="A" stroke={COLORS.primary} strokeWidth={3} fill={COLORS.primary} fillOpacity={0.2} />
                          <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#1e293b', borderRadius: '8px', fontWeight: 'bold' }} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="w-full md:w-56 md:border-l border-slate-200 md:pl-6 flex flex-col gap-4">
                       <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-2"><MessageSquare size={14}/> 數據背後的聲音</h4>
                       <div className="space-y-3">
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                             <div className="flex items-center gap-2 mb-2">
                                <CheckCircle2 size={14} className="text-[#34d399]" />
                                <span className="text-xs font-bold text-slate-700">學員收穫重點</span>
                             </div>
                             <p className="text-xs text-slate-600 leading-relaxed">
                               許多學員在回饋中提到<span className="text-[#144679] font-bold">「效率」</span>與<span className="text-[#144679] font-bold">「實用」</span>，顯示課程內容成功對接工作需求。特別是行政人員對於 AI 輔助文書處理最有感。
                             </p>
                          </div>
                          
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                             <div className="flex items-center gap-2 mb-2">
                                <AlertOctagon size={14} className="text-[#FAB346]" />
                                <span className="text-xs font-bold text-slate-700">學習痛點</span>
                             </div>
                             <p className="text-xs text-slate-600 leading-relaxed">
                               反思部分多集中於<span className="text-[#D6604A] font-bold">「操作速度」</span>與<span className="text-[#D6604A] font-bold">「跟不上」</span>，尤其是涉及程式碼或複雜指令時，新手容易感到挫折。
                             </p>
                          </div>
                       </div>
                       
                       <div className="mt-auto">
                          <p className="text-[10px] text-slate-400 font-mono text-center">
                            *Analysis based on {qualitativeFeedbacks.harvest.length + qualitativeFeedbacks.suggestion.length} qualitative feedbacks
                          </p>
                       </div>
                    </div>
                  </div>
              </Card>

              {/* Bar Chart + Synthesized Attribution Analysis */}
              <div className="lg:col-span-6 flex flex-col gap-6">
                  <Card className="min-h-[280px] flex flex-col h-full">
                     <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                           <Star size={16} className="text-[#FAB346]" />
                           <h3 className="text-lg font-bold text-slate-800">滿意度細項分析</h3>
                        </div>
                     </div>
                     
                     <div className="flex flex-col md:flex-row gap-6 h-full">
                        <div className="flex-1 min-h-[300px]">
                          <ResponsiveContainer width="100%" height="100%">
                             <BarChart layout="vertical" data={satisfactionDetailedData.chartData} margin={{ top: 0, right: 40, left: 20, bottom: 0 }} barCategoryGap={12}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                                <XAxis type="number" domain={[0, 5]} hide />
                                <YAxis dataKey="name" type="category" tick={{ fill: '#475569', fontWeight: 700, fontSize: 13 }} width={80} axisLine={false} tickLine={false} />
                                <Tooltip cursor={{fill: 'rgba(0,0,0,0.05)'}} contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#1e293b', borderRadius: '8px' }} />
                                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20} label={{ position: 'right', fill: '#1e293b', fontSize: 12, fontWeight: '800' }}>
                                   {satisfactionDetailedData.chartData?.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.fill} />))}
                                </Bar>
                             </BarChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="md:w-56 flex flex-col justify-center gap-4 pl-0 md:pl-6 md:border-l border-slate-200">
                           <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1"><Quote size={14}/> 滿意度歸因分析</h4>
                           
                           {/* Synthesized Positive Insights */}
                           <div className="bg-[#CBDFDF]/30 border border-[#CBDFDF] p-3 rounded-lg">
                              <div className="flex items-center gap-2 mb-2 border-b border-[#144679]/20 pb-1">
                                <ThumbsUp size={14} className="text-[#144679]" />
                                <span className="text-[10px] font-bold text-[#144679] uppercase">推薦原因 (Top Reasons)</span>
                              </div>
                              <ul className="space-y-1.5">
                                {satisfactionHighlights.map((h, i) => (
                                  <li key={i} className="flex justify-between items-center text-[10px] text-slate-700">
                                    <span>• {h.desc}</span>
                                    <span className="bg-white px-1.5 py-0.5 rounded text-[#144679] font-bold text-[9px] shadow-sm">{h.term} ({h.count})</span>
                                  </li>
                                ))}
                              </ul>
                           </div>

                           {/* Synthesized Constructive Insights */}
                           <div className={`border p-3 rounded-lg bg-slate-50 border-slate-200`}>
                              <div className="flex items-center gap-2 mb-2 border-b border-slate-200 pb-1">
                                <AlertTriangle size={14} className="text-[#CC9337]" />
                                <span className="text-[10px] font-bold uppercase text-[#CC9337]">待改進點 (Improvements)</span>
                              </div>
                              <ul className="space-y-1.5">
                                {improvementHighlights.map((h, i) => (
                                  <li key={i} className="flex justify-between items-center text-[10px] text-slate-700">
                                    <span>• {h.desc}</span>
                                    <span className="bg-white px-1.5 py-0.5 rounded text-[#CC9337] font-bold text-[9px] shadow-sm">{h.term} ({h.count})</span>
                                  </li>
                                ))}
                              </ul>
                           </div>
                        </div>
                     </div>
                  </Card>
              </div>
            </div>

            {/* Qualitative Feedback Section */}
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
                           <p className="text-sm text-slate-700 leading-relaxed mb-2">{item.text}</p>
                           <div className="flex justify-end items-center gap-2">
                             <span className="text-[10px] font-bold text-[#144679] bg-[#144679]/10 px-2 py-1 rounded uppercase">{item.role}</span>
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
                            <p className="text-sm text-slate-700 leading-relaxed mb-2">{item.text}</p>
                            <div className="flex justify-end items-center gap-2">
                              <span className="text-[10px] font-bold text-[#CC9337] bg-[#FAB346]/10 px-2 py-1 rounded uppercase">{item.role}</span>
                            </div>
                           </div>
                       </div>
                     ))}
                     {qualitativeFeedbacks.suggestion.length === 0 && <div className="text-center text-slate-400 text-sm mt-10">尚無此類別回饋</div>}
                  </div>
              </Card>

              {/* Column 3: Application */}
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
                           <p className="text-sm text-slate-700 leading-relaxed mb-2">{item.text}</p>
                           <div className="flex justify-end items-center gap-2">
                             <span className="text-[10px] font-bold text-[#D6604A] bg-[#D6604A]/10 px-2 py-1 rounded uppercase">{item.role}</span>
                           </div>
                         </div>
                       </div>
                     ))}
                     {qualitativeFeedbacks.application.length === 0 && <div className="text-center text-slate-400 text-sm mt-10">尚無此類別回饋</div>}
                  </div>
              </Card>
            </div>

            {/* Student Works Gallery */}
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
                    <div className="h-40 bg-slate-100 relative overflow-hidden flex items-center justify-center">
                      <img 
                        src={`https://api.microlink.io/?url=${encodeURIComponent(item.url)}&screenshot=true&meta=false&embed=screenshot.url`}
                        alt="Website Preview" 
                        className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                        onError={(e) => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-slate-50 text-slate-300 hidden">
                        <ExternalLink size={32} />
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-[#144679] bg-[#CBDFDF] px-2 py-1 rounded uppercase">{item.role}</span>
                        <ExternalLink size={12} className="text-slate-400 group-hover:text-[#144679]" />
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
                </div>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={roleComparisonData} margin={{top: 20, right: 30, left: 20, bottom: 5}}>
                      <XAxis dataKey="name" tick={{ fill: '#475569', fontWeight: 700, fontSize: 12 }} />
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
                  <thead className="text-xs text-slate-500 uppercase bg-slate-100">
                    <tr>
                      <th className="px-4 py-4 font-extrabold tracking-wider">角色 Role</th>
                      <th className="px-4 py-4 font-extrabold text-center">學習成效</th>
                      <th className="px-4 py-4 font-extrabold text-center">自我效能</th>
                      <th className="px-4 py-4 font-extrabold text-center">轉化學習</th>
                      <th className="px-4 py-4 font-extrabold text-center">行為意圖</th>
                      <th className="px-4 py-4 text-right font-extrabold">滿意度</th>
                    </tr>
                  </thead>
                  <tbody className="font-medium divide-y divide-slate-100">
                    {Object.keys(COLORS.roles).map((role) => {
                      const roleData = rawData.filter(d => d.role === role);
                      const getAvg = (key) => roleData.length ? (roleData.reduce((acc, cur) => acc + cur[key], 0) / roleData.length).toFixed(2) : '-';
                      return (
                        <tr key={role} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-4 font-bold text-slate-800 flex items-center gap-3 text-sm">
                            <div className="w-2 h-2 rounded-sm shadow-sm" style={{backgroundColor: COLORS.roles[role]}}></div>
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
            
            {/* Added: Qualitative Insights Summary for Deep Dive */}
            <Card className="bg-slate-50 border border-slate-200">
               <div className="flex items-center gap-2 mb-4">
                  <FileText className="text-[#144679]" size={20} />
                  <h3 className="text-lg font-bold text-slate-800">深度比較質性總結 (Deep Dive Summary)</h3>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-slate-600 leading-relaxed">
                  <div>
                     <strong className="text-[#144679] block mb-2">角色差異觀察：</strong>
                     <p className="mb-2">醫師與研究人員在「學習成效」與「轉化學習」分數普遍較高，顯示其對 AI 工具的理解與應用潛力最強。護理與行政人員則在「自我效能」上有較大提升空間，需更多實作引導以建立信心。</p>
                  </div>
                  <div>
                     <strong className="text-[#CC9337] block mb-2">共同回饋趨勢：</strong>
                     <p>跨職類學員皆對「能提升工作效率」的 AI 工具（如公文撰寫、簡報製作）反應最熱烈。操作難度過高（如程式碼）則是跨職類的共同痛點，建議未來課程設計應更聚焦於 Low-code/No-code 工具。</p>
                  </div>
               </div>
            </Card>
          </div>
        )}

      </main>
      
      <footer className="text-center py-8 text-slate-400 text-xs font-medium border-t border-slate-200 mt-12 relative z-10 bg-white">
        © 2025 AI Digital Empowerment Workshop Analytics
      </footer>

      {/* Styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.5s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default App;
