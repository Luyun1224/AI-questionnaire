import React, { useState, useMemo, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  LineChart, Line
} from 'recharts';
import { Users, Star, Zap, MessageSquare, Filter, Download, Activity, BarChart2, Layers, HelpCircle, X, Info, Loader2, AlertCircle } from 'lucide-react';

// ==========================================
// 設定區域
// ==========================================
// 已填入您的 Google Apps Script Web App URL
const GAS_API_URL = "https://script.google.com/macros/s/AKfycbz4YSi0cs7cV8dM3Sm70MMTXbov6FvQk5ZvnmyEkrOrZiwaqhgxeyaf0uMdkqizU0n-/exec"; 

const COLORS = {
  primary: '#38bdf8', 
  secondary: '#818cf8',
  accent: '#f472b6',
  bg: '#0f172a',
  card: '#1e293b', 
  text: '#f8fafc',
  grid: '#334155',
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

// --- 定義說明字典 (Dictionary) ---
const METRIC_DEFINITIONS = {
  learning_effectiveness: {
    title: "學習成效 (Learning)",
    desc: "對應後測 Q1-Q3：國家健康藍圖、AI醫療趨勢、學習型照護的理解程度。",
    simple: "懂不懂？"
  },
  self_efficacy: {
    title: "自我效能 (Self-Efficacy)",
    desc: "對應後測 Q4-Q5：操作 AI 工具的信心與應用能力。",
    simple: "敢不敢用？"
  },
  transformative_learning: {
    title: "轉化學習 (Transformative)",
    desc: "對應後測 Q6-Q7：是否反思舊有模式並產生新觀點。",
    simple: "有無啟發？"
  },
  behavioral_intention: {
    title: "行為意圖 (Intention)",
    desc: "對應後測 Q8-Q9：未來實際應用與推廣的意願。",
    simple: "想不想用？"
  },
  nps: {
    title: "淨推薦分數 (NPS)",
    desc: "反映學員的忠誠度與口碑傳播意願 (基於滿意度推算)。",
    simple: "推不推薦？"
  }
};

const Dashboard = () => {
  const [viewMode, setViewMode] = useState('overview'); 
  const [selectedRole, setSelectedRole] = useState('All');
  const [showGuide, setShowGuide] = useState(false);
  
  // Data States
  const [rawData, setRawData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- 資料獲取與處理 ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        if(!GAS_API_URL) throw new Error("請先在程式碼中設定 GAS_API_URL");

        const response = await fetch(GAS_API_URL);
        if (!response.ok) throw new Error('網路回應不正常');
        
        const json = await response.json();
        const processed = processSheetData(json);
        setRawData(processed);
        setLoading(false);
      } catch (err) {
        console.error("Fetch error:", err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // 資料轉換邏輯：將 GAS 回傳的格式轉為 Dashboard 需要的格式
  const processSheetData = (data) => {
    if (!Array.isArray(data)) return [];

    return data.map((row, index) => {
      // 確保分數是數字
      const posts = (row.post_scores || []).map(Number); // 9 題後測
      const sats = (row.sat_scores || []).map(Number);   // 8 題滿意度

      // 計算四大構面平均分數 (依據一般問卷結構假設，可依實際題目調整 index)
      // 假設：Q1-3=學習, Q4-5=效能, Q6-7=轉化, Q8-9=意圖
      const avg = (arr) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

      return {
        id: index,
        role: row.role || '其他',
        // 構面計算
        learning_effectiveness: avg(posts.slice(0, 3)), // Index 0-2
        self_efficacy: avg(posts.slice(3, 5)),          // Index 3-4
        transformative_learning: avg(posts.slice(5, 7)),// Index 5-6
        behavioral_intention: avg(posts.slice(7, 9)),   // Index 7-8
        
        // 滿意度計算
        // 假設前 4 題是整體滿意度，後 4 題是課程設計/講師
        satisfaction_overall: avg(sats.slice(0, 8)), // 取全部平均作為整體
        satisfaction_design: avg(sats.slice(4, 8)),  // 取後四題作為設計構面
        
        // 回饋文字 (優先取「建議改善」，若無則取「最有收穫」)
        feedback: row.feedback?.suggestion || row.feedback?.harvest || "無文字回饋"
      };
    });
  };

  // --- 資料聚合計算 (Memoized) ---
  const filteredData = useMemo(() => {
    return selectedRole === 'All' 
      ? rawData 
      : rawData.filter(d => d.role === selectedRole);
  }, [selectedRole, rawData]);

  const kpi = useMemo(() => {
    const count = filteredData.length;
    if (count === 0) return { count: 0, avgSat: 0, avgLearn: 0, nps: 0 };

    const avgSat = filteredData.reduce((acc, cur) => acc + cur.satisfaction_overall, 0) / count;
    const avgLearn = filteredData.reduce((acc, cur) => acc + cur.learning_effectiveness, 0) / count;
    
    // NPS 模擬計算：滿意度 >= 4.5 視為推薦者(Promoters)，<= 3 視為批評者(Detractors)
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
         ['醫師', '護理人員', '醫事人員', '行政人員', '資訊與研究', '學生', '其他'].forEach(r => {
            const roleData = rawData.filter(d => d.role === r);
            if (roleData.length > 0) {
                item[r] = (roleData.reduce((acc, cur) => acc + cur[dim.key], 0) / roleData.length).toFixed(2);
            } else {
                item[r] = 0;
            }
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

  const roleComparisonData = useMemo(() => {
     if (rawData.length === 0) return [];
     return ['醫師', '護理人員', '醫事人員', '行政人員', '資訊與研究', '學生', '其他'].map(r => {
       const roleData = rawData.filter(d => d.role === r);
       const count = roleData.length;
       if (count === 0) return { name: r, '整體滿意度': 0, '課程設計': 0, '學習成效': 0 };
       return {
         name: r,
         '整體滿意度': (roleData.reduce((acc, cur) => acc + cur.satisfaction_overall, 0) / count).toFixed(2),
         '課程設計': (roleData.reduce((acc, cur) => acc + cur.satisfaction_design, 0) / count).toFixed(2),
         '學習成效': (roleData.reduce((acc, cur) => acc + cur.learning_effectiveness, 0) / count).toFixed(2),
       };
     });
  }, [rawData]);

  // --- Loading & Error Views ---
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="w-12 h-12 animate-spin text-sky-500 mb-4" />
        <p>正在連線至 Google Sheets 資料庫...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-rose-400">
        <AlertCircle className="w-12 h-12 mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">讀取資料失敗</h3>
        <p className="mb-4 text-center max-w-md">{error}</p>
        <button onClick={() => window.location.reload()} className="px-4 py-2 bg-slate-800 rounded hover:bg-slate-700 text-white">
          重新整理
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-[#0f172a] to-[#0b1121] text-slate-50 font-sans selection:bg-sky-500 selection:text-white pb-12 relative overflow-x-hidden">
      
      {/* 背景裝飾光暈 */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-sky-500/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px]"></div>
      </div>

      {/* --- Modal: 導引指南 --- */}
      {showGuide && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-sky-500/40 rounded-2xl max-w-2xl w-full shadow-[0_0_50px_rgba(14,165,233,0.15)] overflow-hidden relative">
            <button onClick={() => setShowGuide(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors p-2">
              <X size={24} />
            </button>
            
            <div className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-sky-500/20 rounded-full text-sky-400 border border-sky-500/30">
                  <HelpCircle size={32} />
                </div>
                <div>
                  <h2 className="text-2xl font-extrabold text-white">儀表板閱讀指南</h2>
                  <p className="text-slate-400 text-sm font-medium">如何解讀 AI 工作坊的成效數據？</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                   <h3 className="text-sky-400 font-bold border-b border-slate-700 pb-2">四大成效指標解碼</h3>
                   {Object.entries(METRIC_DEFINITIONS).slice(0, 4).map(([key, def]) => (
                     <div key={key} className="bg-slate-800/80 p-3 rounded-lg border border-slate-700">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-slate-200 text-sm">{def.title}</span>
                          <span className="text-xs bg-sky-900 text-sky-200 px-2 py-0.5 rounded-full font-bold">{def.simple}</span>
                        </div>
                        <p className="text-xs text-slate-300 font-medium leading-relaxed">{def.desc}</p>
                     </div>
                   ))}
                </div>
                
                <div className="space-y-4">
                   <h3 className="text-yellow-400 font-bold border-b border-slate-700 pb-2">滿意度與 NPS</h3>
                   <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700">
                      <div className="font-bold text-slate-200 text-sm mb-1">淨推薦分數 (NPS)</div>
                      <p className="text-xs text-slate-300 font-medium leading-relaxed">
                        計算公式：(推薦者% - 批評者%)。<br/>
                        <span className="text-emerald-400 font-bold">+30以上</span> 為優秀，代表口碑效應強。<br/>
                        <span className="text-rose-400 font-bold">0以下</span> 代表需立即改善。
                      </p>
                   </div>
                   <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700 mt-4">
                      <div className="font-bold text-slate-200 text-sm mb-1">解讀建議</div>
                      <ul className="list-disc list-inside text-xs text-slate-300 font-medium space-y-1">
                        <li>若「學習成效」高但「行為意圖」低 → 需增加實作練習。</li>
                        <li>若「醫療人員」滿意度低 → 需檢查案例是否不符臨床需求。</li>
                      </ul>
                   </div>
                </div>
              </div>

              <button onClick={() => setShowGuide(false)} className="w-full mt-8 bg-sky-600 hover:bg-sky-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg">
                我瞭解了，開始查看數據
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="border-b border-slate-700/60 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col space-y-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-sky-500/10 rounded-xl border border-sky-500/30 shadow-[0_0_20px_rgba(56,189,248,0.3)]">
              <Activity className="w-10 h-10 text-sky-400" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-sky-200 via-sky-400 to-blue-500 bg-clip-text text-transparent tracking-wide leading-tight drop-shadow-sm">
                2025 奇美月｜AI 數位賦能工作坊
                <span className="block md:inline md:ml-2 text-2xl md:text-3xl text-white">學員回饋分析儀表板</span>
              </h1>
              <p className="text-xs text-slate-400 uppercase tracking-[0.2em] mt-1 font-bold">Post-Workshop Data Analytics Center</p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center justify-start gap-4 border-t border-slate-700/60 pt-4">
             <button onClick={() => setShowGuide(true)} className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-sky-100 bg-sky-600/20 border border-sky-500/30 rounded-lg hover:bg-sky-500/30 transition-all duration-300 group shadow-lg shadow-sky-900/20">
               <HelpCircle size={18} className="text-sky-400 group-hover:text-sky-200 transition-colors" />
               <span>指標定義說明</span>
             </button>

             <div className="h-8 w-px bg-slate-700 hidden sm:block mx-2"></div>

             <div className="bg-slate-800 p-1 rounded-lg flex border border-slate-700/60 shadow-inner">
                <button onClick={() => setViewMode('overview')} className={`px-4 py-2 text-sm font-bold rounded-md transition-all flex items-center gap-2 ${viewMode === 'overview' ? 'bg-sky-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'}`}>
                  <BarChart2 size={16} /> 總覽模式
                </button>
                <button onClick={() => setViewMode('deep-dive')} className={`px-4 py-2 text-sm font-bold rounded-md transition-all flex items-center gap-2 ${viewMode === 'deep-dive' ? 'bg-sky-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'}`}>
                  <Layers size={16} /> 深度比較
                </button>
             </div>

             {viewMode === 'overview' && (
               <div className="flex items-center space-x-3 bg-slate-800 px-4 py-2 rounded-lg border border-slate-700/80 shadow-lg ml-0 sm:ml-auto group hover:border-sky-500/30 transition-colors">
                  <span className="text-slate-400 text-xs uppercase font-extrabold tracking-wider">FILTER:</span>
                  <div className="flex items-center relative">
                    <Filter className="w-4 h-4 text-sky-400 mr-2" />
                    <select 
                      value={selectedRole} 
                      onChange={(e) => setSelectedRole(e.target.value)}
                      className="bg-slate-800 text-white border-none text-sm font-bold focus:ring-0 py-1 pr-8 cursor-pointer hover:text-sky-300 transition-colors outline-none appearance-none"
                      style={{ backgroundColor: '#1e293b', color: '#ffffff' }}
                    >
                      <option value="All" className="bg-slate-800 text-white">全部角色 (All Roles)</option>
                      {Object.keys(COLORS.roles).map(role => (
                         <option key={role} value={role} className="bg-slate-800 text-white">{role}</option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                    </div>
                  </div>
               </div>
             )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 relative z-10">
        
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KPICard title="總回收份數" value={kpi.count} icon={Users} trend={kpi.count > 0 ? "Live" : "-"} trendUp={true} sub="即時數據" />
          <KPICard title="平均滿意度" value={kpi.avgSat} icon={Star} trend={kpi.avgSat >= 4 ? "優異" : "一般"} trendUp={true} sub="滿分 5.0" color="text-yellow-400" />
          
          <KPICard 
            title="學習成效指數" 
            value={kpi.avgLearn} 
            icon={Zap} 
            trend={kpi.avgLearn >= 4 ? "高成效" : "需加強"} 
            trendUp={kpi.avgLearn >= 4} 
            sub="認知與理解程度" 
            color="text-sky-400"
            tooltip={METRIC_DEFINITIONS.learning_effectiveness.desc} 
          />
          
          <KPICard 
            title="淨推薦分數 (NPS)" 
            value={kpi.nps} 
            icon={Activity} 
            trend={kpi.nps > 0 ? "+正向" : "-負向"} 
            trendUp={kpi.nps > 0} 
            sub="口碑傳播意願" 
            color="text-emerald-400" 
            tooltip={METRIC_DEFINITIONS.nps.desc}
          />
        </div>

        {/* ================= OVERVIEW MODE ================= */}
        {viewMode === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fadeIn">
            
            <div className="lg:col-span-2 bg-slate-800/40 border border-white/10 rounded-2xl p-8 backdrop-blur-md shadow-xl flex flex-col md:flex-row">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="text-xl font-bold text-white">學習成效構面分析</h3>
                  <InfoTooltip text="此圖表顯示學員在四個不同維度上的平均得分 (滿分5分)。" />
                </div>
                <div className="h-[350px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                      <PolarGrid stroke="#475569" strokeDasharray="4 4" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#e2e8f0', fontSize: 14, fontWeight: 700 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 5]} tick={{ fill: '#94a3b8', fontWeight: 600 }} />
                      <Radar name={selectedRole} dataKey="A" stroke={COLORS.primary} strokeWidth={4} fill={COLORS.primary} fillOpacity={0.3} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#38bdf8', color: '#f8fafc', borderRadius: '8px', fontWeight: 'bold' }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="md:w-64 md:border-l border-white/10 md:pl-8 mt-6 md:mt-0 flex flex-col justify-center space-y-6">
                <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-2 border-b border-white/10 pb-2">維度快速解讀</h4>
                {['learning_effectiveness', 'self_efficacy', 'transformative_learning', 'behavioral_intention'].map(key => (
                  <div key={key} className="group cursor-help">
                    <div className="text-base font-bold text-sky-300 group-hover:text-white transition-colors">{METRIC_DEFINITIONS[key].title.split(' (')[0]}</div>
                    <div className="text-xs text-slate-400 font-medium group-hover:text-slate-300 mt-1">{METRIC_DEFINITIONS[key].simple}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-8">
              <div className="bg-slate-800/40 border border-white/10 rounded-2xl p-6 backdrop-blur-md shadow-xl h-[280px]">
                 <h3 className="text-xl font-bold text-white mb-4">滿意度細項</h3>
                 <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                        { name: '整體滿意', score: kpi.avgSat }, 
                        { name: '課程設計', score: (filteredData.reduce((acc, cur) => acc + cur.satisfaction_design, 0) / (filteredData.length || 1)).toFixed(2) }
                      ]} layout="vertical" margin={{ top: 0, right: 40, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" />
                      <XAxis type="number" domain={[0, 5]} hide />
                      <YAxis dataKey="name" type="category" tick={{ fill: '#e2e8f0', fontWeight: 700, fontSize: 13 }} width={70} />
                      <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{ backgroundColor: '#0f172a', borderColor: '#818cf8', color: '#f8fafc', borderRadius: '8px' }} />
                      <Bar dataKey="score" fill={COLORS.secondary} radius={[0, 4, 4, 0]} barSize={36} label={{ position: 'right', fill: '#fff', fontWeight: 'bold' }} />
                    </BarChart>
                 </ResponsiveContainer>
              </div>

              <div className="bg-slate-800/40 border border-white/10 rounded-2xl p-6 backdrop-blur-md shadow-xl flex flex-col h-[350px]">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-white">最新回饋</h3>
                  <span className="px-2 py-1 bg-slate-700/50 rounded text-xs text-slate-300 font-bold border border-white/10">Live</span>
                </div>
                <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                  {filteredData.slice(0, 6).map((item) => (
                    <div key={item.id} className="bg-slate-900/60 p-4 rounded-xl border border-white/5 text-sm text-slate-200 hover:border-sky-500/30 transition-all shadow-sm">
                      <div className="flex justify-between items-center mb-2">
                         <span className="text-sky-400 font-extrabold text-xs uppercase tracking-wider bg-sky-900/20 px-2 py-0.5 rounded">{item.role}</span>
                         <div className="flex text-yellow-500">
                           {[...Array(Math.round(item.satisfaction_overall))].map((_, i) => <Star key={i} size={10} fill="currentColor" />)}
                         </div>
                      </div>
                      <p className="font-medium leading-relaxed">"{item.feedback}"</p>
                    </div>
                  ))}
                  {filteredData.length === 0 && <p className="text-slate-500 text-center py-4">目前尚無回饋資料</p>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= DEEP DIVE MODE ================= */}
        {viewMode === 'deep-dive' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-slate-800/40 border border-white/10 rounded-2xl p-6 backdrop-blur-md shadow-xl">
                <div className="flex items-center gap-2 mb-2">
                   <h3 className="text-xl font-bold text-white">角色間滿意度差異</h3>
                   <InfoTooltip text="比較不同職類在「整體滿意度」與「課程設計」上的評分差異。" />
                </div>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={roleComparisonData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                      <XAxis dataKey="name" tick={{ fill: '#e2e8f0', fontWeight: 700 }} />
                      <YAxis domain={[0, 5]} tick={{ fill: '#94a3b8', fontWeight: 600 }} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }} />
                      <Legend />
                      <Bar dataKey="整體滿意度" fill={COLORS.roles['醫療人員']} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="課程設計" fill={COLORS.roles['醫療行政']} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-slate-800/40 border border-white/10 rounded-2xl p-6 backdrop-blur-md shadow-xl">
                 <div className="flex items-center gap-2 mb-2">
                   <h3 className="text-xl font-bold text-white">學習成效 - 角色交叉比對</h3>
                 </div>
                 <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                      <PolarGrid stroke="#475569" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#e2e8f0', fontWeight: 700, fontSize: 12 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 5]} tick={{ fill: '#94a3b8' }} />
                      <Radar name="醫師" dataKey="醫師" stroke={COLORS.roles['醫師']} strokeWidth={3} fill="transparent" />
                      <Radar name="護理人員" dataKey="護理人員" stroke={COLORS.roles['護理人員']} strokeWidth={3} fill="transparent" />
                      <Radar name="醫事人員" dataKey="醫事人員" stroke={COLORS.roles['醫事人員']} strokeWidth={3} fill="transparent" />
                      <Radar name="行政人員" dataKey="行政人員" stroke={COLORS.roles['行政人員']} strokeWidth={3} fill="transparent" />
                      <Radar name="資訊與研究" dataKey="資訊與研究" stroke={COLORS.roles['資訊與研究']} strokeWidth={3} fill="transparent" />
                      <Radar name="學生" dataKey="學生" stroke={COLORS.roles['學生']} strokeWidth={3} fill="transparent" />
                      <Radar name="其他" dataKey="其他" stroke={COLORS.roles['其他']} strokeWidth={3} fill="transparent" />
                      <Legend />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/40 border border-white/10 rounded-2xl p-8 backdrop-blur-md shadow-xl overflow-hidden">
              <h3 className="text-xl font-bold text-white mb-6">各構面得分熱力矩陣</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-300">
                  <thead className="text-xs text-slate-400 uppercase bg-slate-900/60 border-b border-slate-700">
                    <tr>
                      <th className="px-6 py-4 font-extrabold">角色</th>
                      <th className="px-6 py-4 font-extrabold">學習成效</th>
                      <th className="px-6 py-4 font-extrabold">自我效能</th>
                      <th className="px-6 py-4 font-extrabold">轉化學習</th>
                      <th className="px-6 py-4 font-extrabold">行為意圖</th>
                      <th className="px-6 py-4 text-right font-extrabold">滿意度</th>
                    </tr>
                  </thead>
                  <tbody className="font-medium">
                    {['醫師', '護理人員', '醫事人員', '行政人員', '資訊與研究', '學生', '其他'].map((role) => {
                      const roleData = rawData.filter(d => d.role === role);
                      const getAvg = (key) => roleData.length ? (roleData.reduce((acc, cur) => acc + cur[key], 0) / roleData.length).toFixed(2) : '-';
                      return (
                        <tr key={role} className="border-b border-slate-700/50 hover:bg-white/5 transition-colors">
                          <td className="px-6 py-5 font-bold text-white flex items-center gap-3">
                            <span className="w-3 h-3 rounded-full shadow-[0_0_10px_currentColor]" style={{backgroundColor: COLORS.roles[role], color: COLORS.roles[role]}}></span>
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
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

// Helper: Heatmap Cell
const HeatmapCell = ({ value, isBold }) => {
  const num = parseFloat(value);
  let colorClass = 'text-slate-400';
  if (num >= 4.5) colorClass = 'text-emerald-400 font-extrabold drop-shadow-sm';
  else if (num >= 4.0) colorClass = 'text-sky-300 font-bold';
  else if (num >= 3.5) colorClass = 'text-yellow-400 font-bold';
  else colorClass = 'text-rose-400 font-bold';

  return (
    <td className={`px-6 py-5 ${isBold ? 'text-right' : ''}`}>
      <span className={`${colorClass} ${isBold ? 'text-xl' : 'text-base'}`}>{value === '-' ? value : num}</span>
    </td>
  );
};

// Helper: Tooltip Icon Component
const InfoTooltip = ({ text }) => (
  <div className="group relative flex items-center">
    <Info size={18} className="text-slate-400 hover:text-sky-400 cursor-help transition-colors" />
    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-56 p-3 bg-slate-900 border border-slate-600 rounded-lg text-xs font-medium text-slate-200 shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10 leading-relaxed">
      {text}
    </div>
  </div>
);

const KPICard = ({ title, value, icon: Icon, trend, trendUp, sub, color = "text-white", tooltip }) => (
  <div className="bg-slate-800/60 border border-white/10 rounded-2xl p-6 backdrop-blur-md hover:bg-slate-800/80 hover:border-sky-500/30 transition-all duration-300 group relative shadow-lg hover:shadow-sky-900/20">
    <div className="flex items-start justify-between">
      <div>
        <div className="flex items-center gap-2 mb-2">
           <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">{title}</p>
           {tooltip && <InfoTooltip text={tooltip} />}
        </div>
        <h3 className={`text-4xl font-extrabold ${color} tracking-tight drop-shadow-sm`}>{value}</h3>
      </div>
      <div className={`p-3.5 rounded-xl bg-slate-900/60 border border-white/5 group-hover:scale-110 group-hover:bg-slate-900 transition-transform duration-300 shadow-inner`}>
        <Icon className={`w-7 h-7 ${color}`} />
      </div>
    </div>
    <div className="mt-4 flex items-center justify-between text-sm">
      <span className={`flex items-center font-bold ${trendUp ? 'text-emerald-400' : 'text-rose-400'}`}>
        {trend}
      </span>
      <span className="text-slate-400 font-medium">{sub}</span>
    </div>
  </div>
);

export default Dashboard;
