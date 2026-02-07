import React, { useState, useEffect, useRef } from 'react';
import { motion, Reorder, AnimatePresence } from 'framer-motion';
import { 
  Map as MapIcon, 
  Play, 
  Square, 
  Trash2, 
  Plus, 
  Navigation, 
  GripVertical,
  Target,
  Send,
  Activity
} from 'lucide-react';

const MissionPlanner = () => {
  // --- MISSION STATE ---
  const [waypoints, setWaypoints] = useState([
    { id: '1', x: 100, y: 100 },
    { id: '2', x: 400, y: 150 },
    { id: '3', x: 500, y: 400 }
  ]);
  const [activeWPIndex, setActiveWPIndex] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [t, setT] = useState(0);

  // --- UAV STATE (Est only for Planner) ---
  const [uav, setUav] = useState({ x: 50, y: 450, vx: 0, vy: 0, theta: 0 });
  const [confidence, setConfidence] = useState(100);
  const [logs, setLogs] = useState([{ time: '00:00', msg: 'SYSTEM READY' }]);

  const dt = 0.05;
  const mapRef = useRef(null);

  // --- ENGINE LOOP ---
  useEffect(() => {
    let timer;
    if (isRunning && waypoints.length > 0) {
      timer = setInterval(() => {
        setT(prev => prev + dt);
        processFlight();
      }, 50);
    }
    return () => clearInterval(timer);
  }, [isRunning, uav, waypoints, activeWPIndex]);

  const processFlight = () => {
    const target = waypoints[activeWPIndex];
    if (!target) return;

    const dx = target.x - uav.x;
    const dy = target.y - uav.y;
    const dist = Math.sqrt(dx**2 + dy**2);

    // Waypoint Reached Logic
    if (dist < 10) {
      if (activeWPIndex < waypoints.length - 1) {
        addLog(`WAYPOINT ${activeWPIndex + 1} REACHED`);
        setActiveWPIndex(prev => prev + 1);
      } else {
        addLog("MISSION COMPLETE");
        setIsRunning(false);
      }
      return;
    }

    // Simplified Navigation Physics (Module 2/4 Integration)
    const k = 4.0;
    const ax = (dx / dist) * k;
    const ay = (dy / dist) * k;

    setUav(prev => ({
      vx: prev.vx + ax * dt,
      vy: prev.vy + ay * dt,
      x: prev.x + prev.vx * dt,
      y: prev.y + prev.vy * dt,
      theta: Math.atan2(prev.vy, prev.vx)
    }));
  };

  const addLog = (msg) => {
    const time = new Date().toLocaleTimeString([], { hour12: false, minute: '2-digit', second: '2-digit' });
    setLogs(prev => [{ time, msg }, ...prev].slice(0, 5));
  };

  const handleMapClick = (e) => {
    if (isRunning) return;
    const rect = mapRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setWaypoints([...waypoints, { id: Date.now().toString(), x, y }]);
    addLog(`WP ADDED: ${Math.round(x)}, ${Math.round(y)}`);
  };

  const clearMission = () => {
    setWaypoints([]);
    setActiveWPIndex(0);
    setIsRunning(false);
    addLog("MISSION CLEARED");
  };

  return (
    <div className="min-h-screen bg-[#060b13] text-slate-400 font-mono p-4 uppercase text-[10px] tracking-wider">
      
      {/* HEADER */}
      <header className="flex justify-between items-center mb-4 border-b border-white/5 pb-2">
        <div className="flex items-center gap-6">
          <div className="text-white font-bold flex items-center gap-2">
            <MapIcon size={16} className="text-cyan-500" /> MISSION_PLANNER <span className="text-cyan-500/40">V1.0</span>
          </div>
          <div className="h-4 w-[1px] bg-white/10" />
          <div className="flex items-center gap-2">
            STATUS: <span className={isRunning ? "text-emerald-400" : "text-yellow-500"}>
              {isRunning ? "EXECUTING_MISSION" : "PLANNING_PHASE"}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-1 border border-white/10 hover:bg-white/5 transition-colors">UPLOAD_TO_UAV</button>
          <button className="px-4 py-1 bg-cyan-600 text-black font-bold hover:bg-cyan-400 transition-colors flex items-center gap-2">
            <Send size={12}/> EXPORT_PATH
          </button>
        </div>
      </header>

      <div className="grid grid-cols-12 gap-4 h-[calc(100vh-100px)]">
        
        {/* LEFT PANEL: WAYPOINT LIST */}
        <aside className="col-span-3 flex flex-col gap-4">
          <div className="bg-[#0c1420] border border-white/10 p-4 rounded-sm flex flex-col h-full">
            <div className="flex justify-between items-center mb-4">
              <span className="text-white font-bold tracking-tighter text-xs">WAYPOINT_SEQUENCE</span>
              <button onClick={clearMission} className="p-1 hover:text-red-500 transition-colors"><Trash2 size={14}/></button>
            </div>

            <Reorder.Group axis="y" values={waypoints} onReorder={setWaypoints} className="space-y-2 overflow-y-auto pr-2 custom-scrollbar">
              {waypoints.map((wp, index) => (
                <Reorder.Item 
                  key={wp.id} 
                  value={wp}
                  className={`p-3 border flex items-center justify-between group transition-all cursor-move ${
                    index === activeWPIndex && isRunning ? 'border-cyan-500 bg-cyan-500/10' : 'border-white/5 bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <GripVertical size={14} className="opacity-20" />
                    <span className="text-[9px] opacity-40">{String(index + 1).padStart(2, '0')}</span>
                    <span className="text-white text-xs font-bold">{Math.round(wp.x)}, {Math.round(wp.y)}</span>
                  </div>
                  {index === activeWPIndex && isRunning && <Activity size={12} className="text-cyan-400 animate-pulse" />}
                </Reorder.Item>
              ))}
            </Reorder.Group>

            <button 
              onClick={() => setIsRunning(!isRunning)}
              className={`mt-4 py-3 font-bold transition-all flex items-center justify-center gap-2 ${
                isRunning ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/20'
              }`}
            >
              {isRunning ? <><Square size={14}/> TERMINATE</> : <><Play size={14}/> START_MISSION</>}
            </button>
          </div>
        </aside>

        {/* CENTER PANEL: INTERACTIVE GRID */}
        <main className="col-span-6 bg-[#0c1420] border border-white/10 rounded-sm relative overflow-hidden flex flex-col group">
          <div 
            ref={mapRef}
            onClick={handleMapClick}
            className="flex-grow relative cursor-crosshair"
            style={{ 
              backgroundImage: 'linear-gradient(#ffffff05 1px, transparent 1px), linear-gradient(90deg, #ffffff05 1px, transparent 1px)',
              backgroundSize: '40px 40px' 
            }}
          >
            {/* SVG PATHS */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              {waypoints.length > 1 && (
                <polyline 
                  points={waypoints.map(w => `${w.x},${w.y}`).join(' ')}
                  fill="none"
                  stroke="rgba(34, 211, 238, 0.2)"
                  strokeWidth="1"
                  strokeDasharray="4,4"
                />
              )}
              {/* Active Segment */}
              {isRunning && waypoints[activeWPIndex] && (
                <line 
                  x1={uav.x} y1={uav.y} 
                  x2={waypoints[activeWPIndex].x} y2={waypoints[activeWPIndex].y} 
                  stroke="#22d3ee" strokeWidth="1" strokeDasharray="5,2"
                />
              )}
            </svg>

            {/* Waypoint Markers */}
            {waypoints.map((wp, idx) => (
              <div 
                key={wp.id}
                className="absolute w-4 h-4 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
                style={{ left: wp.x, top: wp.y }}
              >
                <div className={`w-2 h-2 rounded-full ${idx === activeWPIndex ? 'bg-cyan-400 shadow-[0_0_10px_#22d3ee]' : 'bg-white/20'}`} />
                <span className="absolute -top-4 text-[8px] whitespace-nowrap opacity-50">WP_{idx+1}</span>
              </div>
            ))}

            {/* UAV Position */}
            <motion.div 
              className="absolute z-20"
              animate={{ left: uav.x, top: uav.y }}
              transition={{ type: "tween", ease: "linear", duration: 0.1 }}
              style={{ transform: `translate(-50%, -50%) rotate(${uav.theta * (180/Math.PI) - 45}deg)` }}
            >
              <Navigation className="text-white fill-white" size={20} />
            </motion.div>

            <div className="absolute bottom-4 right-4 text-[8px] opacity-20 pointer-events-none">
              LEFT_CLICK TO ADD WAYPOINT // DRAG TO REORDER
            </div>
          </div>
        </main>

        {/* RIGHT PANEL: TELEMETRY & LOGS */}
        <aside className="col-span-3 flex flex-col gap-4">
          <div className="bg-[#0c1420] border border-white/10 p-4 rounded-sm">
            <span className="text-white font-bold text-xs block mb-4 tracking-tighter">NAV_DATA</span>
            <div className="space-y-4">
              <DataRow label="CUR_SPEED" value={`${Math.sqrt(uav.vx**2 + uav.vy**2).toFixed(1)}`} unit="m/s" />
              <DataRow label="HEADING" value={`${(uav.theta * 180/Math.PI).toFixed(0)}`} unit="DEG" />
              <DataRow label="TARGET_WP" value={waypoints[activeWPIndex] ? `WP_${activeWPIndex + 1}` : 'N/A'} unit="" />
              
              <div className="pt-2 border-t border-white/5">
                <div className="flex justify-between mb-1 opacity-50">
                  <span>CONFIDENCE</span>
                  <span>{confidence}%</span>
                </div>
                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-cyan-500"
                    animate={{ width: `${confidence}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#0c1420] border border-white/10 p-4 rounded-sm flex-grow">
            <span className="text-white font-bold text-xs block mb-4 tracking-tighter flex items-center gap-2">
              <Activity size={14} className="text-cyan-500"/> MISSION_LOG
            </span>
            <div className="space-y-3">
              <AnimatePresence initial={false}>
                {logs.map((log, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex gap-3 text-[9px] border-l border-white/5 pl-2"
                  >
                    <span className="text-cyan-500/50">{log.time}</span>
                    <span className="text-white/80">{log.msg}</span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

const DataRow = ({ label, value, unit }) => (
  <div className="flex justify-between items-baseline border-b border-white/5 pb-1">
    <span className="text-[9px] opacity-40">{label}</span>
    <div className="flex items-baseline gap-1">
      <span className="text-white font-bold">{value}</span>
      <span className="text-[8px] opacity-20">{unit}</span>
    </div>
  </div>
);

export default MissionPlanner;