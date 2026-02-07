import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, Brush, Legend
} from 'recharts';
import { 
  History, TrendingUp, ShieldAlert, Map as MapIcon, Clock, Filter, Download
} from 'lucide-react';

// --- MAIN ANALYTICS PAGE ---
const Analytics = ({ missionData }) => {
  const [history] = useState(missionData || generateDummyData());
  const [activeModule, setActiveModule] = useState('ALL');
  const [scrubTime, setScrubTime] = useState(null); // Timeline scrubbing

  return (
    <div className="min-h-screen bg-[#060b13] text-[#94a3b8] font-mono p-4 uppercase text-[10px] tracking-wider">

      {/* HEADER */}
      <header className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-cyan-500/10 rounded">
            <History className="text-cyan-500" size={18} />
          </div>
          <div>
            <h1 className="text-white font-bold text-sm tracking-tighter">POST_MISSION_ANALYTICS</h1>
            <p className="opacity-50 text-[8px]">LOG_ID: STELLA-77-ALPHA // 2026-02-07</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
            <Download size={14}/> EXPORT_CSV
          </button>
        </div>
      </header>

      <div className="grid grid-cols-12 gap-6 h-[calc(100vh-120px)]">

        {/* LEFT PANEL: PATH HEATMAP */}
        <div className="col-span-4 flex flex-col gap-4">
          <PathHeatmap history={history} scrubTime={scrubTime} />
        </div>

        {/* CENTER PANEL: TREND CHARTS */}
        <div className="col-span-5 flex flex-col gap-4">
          <ErrorChart history={history} scrubTime={scrubTime} />
          <ConfidenceChart history={history} scrubTime={scrubTime} />
        </div>

        {/* RIGHT PANEL: TIMELINE */}
        <div className="col-span-3 flex flex-col gap-4">
          <Timeline events={history.map(d => d.event).filter(Boolean)} setScrubTime={setScrubTime} />
          <div className="bg-cyan-500/5 border border-cyan-500/10 p-4 rounded-sm">
            <div className="text-[8px] opacity-40 mb-2">ANALYTICS_SUMMARY</div>
            <p className="text-[9px] leading-relaxed italic uppercase">
              Kalman Gain (K) successfully attenuated signal noise by 68% during non-jamming phases. Error residuals remained within acceptable safety margins (±2.5m).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- PATH HEATMAP ---
const PathHeatmap = ({ history, scrubTime }) => {
  const latest = scrubTime !== null 
    ? history.find(h => h.t >= scrubTime) || history[history.length - 1] 
    : history[history.length - 1];

  return (
    <div className="bg-[#0c1420] border border-white/10 p-4 rounded-sm flex-grow relative overflow-hidden">
      <div className="flex justify-between items-center mb-4">
        <span className="text-white font-bold flex items-center gap-2">
          <MapIcon size={14} className="text-cyan-500"/> PATH_DIVERGENCE
        </span>
      </div>
      <div className="w-full h-64 border border-white/5 relative bg-[#080e16] rounded-sm">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#ffffff 0.5px, transparent 0.5px)', backgroundSize: '20px 20px' }} />
        <svg className="w-full h-full p-4">
          <path d="M 20 200 Q 150 50 300 180" fill="none" stroke="white" strokeWidth="1" strokeDasharray="4,2" opacity="0.3" />
          <path d="M 20 200 Q 140 30 280 210" fill="none" stroke="#22d3ee" strokeWidth="1.5" />
          {/* Animated UAV marker */}
          <motion.circle 
            cx={150} 
            cy={latest?.error * 10 || 200} 
            r="6" 
            fill="#10b981" 
            animate={{ cx: 150 + latest?.t * 5, cy: 200 - latest?.error * 5 }}
            transition={{ type: 'spring', stiffness: 100 }}
          />
          <circle cx="150" cy="85" r="20" fill="#ef444410" stroke="#ef444450" strokeWidth="1" strokeDasharray="2,2" />
        </svg>
        <div className="absolute top-4 right-4 text-[8px] text-red-400 flex items-center gap-1">
          <ShieldAlert size={10}/> JAMMING_ZONE_A
        </div>
      </div>
      <div className="mt-4 space-y-3">
        <div className="text-[9px] opacity-40">DIVERGENCE_METRICS</div>
        <MetricRow label="MAX_DRIFT" value="14.22" unit="m" />
        <MetricRow label="AVG_RESIDUAL" value="1.84" unit="m" />
        <MetricRow label="KF_CONVERGENCE" value="0.44" unit="s" />
      </div>
    </div>
  );
};

// --- ERROR CHART ---
const ErrorChart = ({ history }) => (
  <div className="bg-[#0c1420] border border-white/10 p-4 rounded-sm h-1/2">
    <div className="flex items-center gap-2 mb-6 text-white font-bold">
      <TrendingUp size={14} className="text-cyan-500"/> POSITION_ERROR_RESIDUAL
    </div>
    <ResponsiveContainer width="100%" height="80%">
      <AreaChart data={history}>
        <defs>
          <linearGradient id="colorError" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" />
        <XAxis dataKey="t" stroke="#475569" fontSize={8} />
        <YAxis stroke="#475569" fontSize={8} />
        <Tooltip contentStyle={{ backgroundColor: '#0c1420', border: '1px solid #ffffff10', fontSize: '10px' }} itemStyle={{ color: '#22d3ee' }} />
        <Area type="monotone" dataKey="error" stroke="#22d3ee" fillOpacity={1} fill="url(#colorError)" />
        <Brush dataKey="t" height={20} stroke="#22d3ee"/>
      </AreaChart>
    </ResponsiveContainer>
  </div>
);

// --- CONFIDENCE CHART ---
const ConfidenceChart = ({ history }) => (
  <div className="bg-[#0c1420] border border-white/10 p-4 rounded-sm h-1/2">
    <div className="flex items-center gap-2 mb-6 text-white font-bold uppercase tracking-widest">
      ESTIMATION_CONFIDENCE
    </div>
    <ResponsiveContainer width="100%" height="80%">
      <LineChart data={history}>
        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" />
        <XAxis dataKey="t" stroke="#475569" fontSize={8} />
        <YAxis domain={[0, 100]} stroke="#475569" fontSize={8} />
        <Tooltip contentStyle={{ backgroundColor: '#0c1420', border: '1px solid #ffffff10', fontSize: '10px' }} />
        <Line type="stepAfter" dataKey="confidence" stroke="#10b981" strokeWidth={2} dot={false} />
        <Brush dataKey="t" height={20} stroke="#10b981"/>
      </LineChart>
    </ResponsiveContainer>
  </div>
);

// --- TIMELINE ---
const Timeline = ({ events, setScrubTime }) => (
  <div className="bg-[#0c1420] border border-white/10 p-4 rounded-sm flex-grow">
    <div className="flex justify-between items-center mb-6">
      <span className="text-white font-bold flex items-center gap-2"><Clock size={14} className="text-cyan-500"/> MISSION_TIMELINE</span>
      <Filter size={14} className="opacity-40 cursor-pointer hover:text-white transition-all"/>
    </div>
    <div className="space-y-6 relative border-l border-white/5 ml-2 pl-4">
      {events.map((e, idx) => (
        <TimelineEvent key={idx} {...e} onClick={() => setScrubTime(e.t)} />
      ))}
    </div>
  </div>
);

// --- METRIC ROW ---
const MetricRow = ({ label, value, unit }) => (
  <div className="flex justify-between border-b border-white/5 pb-1">
    <span className="opacity-40">{label}</span>
    <div className="text-white font-bold">
      {value} <span className="text-[8px] opacity-30">{unit}</span>
    </div>
  </div>
);

// --- TIMELINE EVENT ---
const TimelineEvent = ({ time, title, status, color, active = false, onClick }) => (
  <div className="relative cursor-pointer" onClick={onClick}>
    <div className={`absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-[#060b13] border-2 ${active ? 'border-red-500 shadow-[0_0_8px_#ef4444]' : 'border-white/20'}`} />
    <div className="text-[8px] opacity-30 mb-1">{time}s</div>
    <div className="text-[10px] text-white font-bold mb-1 tracking-tighter">{title}</div>
    <div className={`text-[8px] font-bold ${color}`}>{status}</div>
  </div>
);

// --- DUMMY DATA GENERATOR ---
function generateDummyData() {
  return Array.from({ length: 50 }, (_, i) => ({
    t: i * 0.5,
    error: Math.random() * (i > 20 && i < 35 ? 15 : 2),
    confidence: i > 20 && i < 35 ? 40 + Math.random() * 10 : 95 + Math.random() * 5,
    load: 40 + Math.random() * 20,
    event: i % 10 === 0 ? { t: i * 0.5, title: `WP_${i}_REACHED`, status: 'SUCCESS', color: 'text-emerald-500' } : null
  }));
}

export default Analytics;
