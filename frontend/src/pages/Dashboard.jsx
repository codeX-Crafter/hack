import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wifi, Navigation2, Target, AlertTriangle, 
  Activity, Clock, Cpu, ShieldAlert 
} from 'lucide-react';

const Dashboard = () => {
  // --- CORE ENGINE STATE ---
  const [t, setT] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  
  // Module 2: Ground Truth
  const [trueState, setTrueState] = useState({ x: 200, y: 300, vx: 0, vy: 0, theta: 45 });
  // Module 4: Navigation Estimate
  const [estState, setEstState] = useState({ x: 200, y: 300, vx: 0, vy: 0, theta: 45 });
  const [confidence, setConfidence] = useState(100);
  const [isJammed, setIsJammed] = useState(false);

  const dt = 0.05;
  const waypoint = { x: 500, y: 150 };

  // --- ENGINE LOOP ---
  useEffect(() => {
    let timer;
    if (isRunning) {
      timer = setInterval(() => {
        setT(prev => prev + dt);
        runSimulationLoop();
      }, 50);
    }
    return () => clearInterval(timer);
  }, [isRunning, trueState, estState]);

  const runSimulationLoop = () => {
    // 1. Mission Logic (Module 1)
    const jamActive = t >= 3 && t <= 8; // GPS unavailable 3s ≤ t ≤ 6s logic
    setIsJammed(jamActive);
    
    const dx = waypoint.x - trueState.x;
    const dy = waypoint.y - trueState.y;
    const dist = Math.sqrt(dx**2 + dy**2);
    const k_acc = 4.0; 
    const ax_cmd = dist > 5 ? (dx/dist) * k_acc : 0;
    const ay_cmd = dist > 5 ? (dy/dist) * k_acc : 0;

    // 2. Physics Engine Ground Truth (Module 2)
    const nextTrue = {
      vx: trueState.vx + ax_cmd * dt,
      vy: trueState.vy + ay_cmd * dt,
      x: trueState.x + (trueState.vx + ax_cmd * dt) * dt,
      y: trueState.y + (trueState.vy + ay_cmd * dt) * dt,
      theta: Math.atan2(trueState.vy, trueState.vx) * (180/Math.PI)
    };

    // 3. Sensor Simulator (Module 3)
    const noise = () => (Math.random() - 0.5) * 1.5;
    const gps = { x: nextTrue.x + noise(), y: nextTrue.y + noise() };
    const imu = { ax: ax_cmd + noise() * 0.1, ay: ay_cmd + noise() * 0.1 };

    // 4. Navigation Engine (Module 4: Kalman Prediction & Update)
    let predX = estState.x + estState.vx * dt;
    let predY = estState.y + estState.vy * dt;
    let predVx = estState.vx + imu.ax * dt;
    let predVy = estState.vy + imu.ay * dt;

    let finalX = predX;
    let finalY = predY;
    if (!jamActive) {
      const K = 0.15; // Simplified Kalman Gain
      finalX += K * (gps.x - predX);
      finalY += K * (gps.y - predY);
    }

    const driftError = Math.sqrt((nextTrue.x - finalX)**2 + (nextTrue.y - finalY)**2);
    const confScore = Math.max(5, Math.floor(100 * Math.exp(-0.05 * driftError)));

    setTrueState(nextTrue);
    setEstState({ x: finalX, y: finalY, vx: predVx, vy: predVy, theta: nextTrue.theta });
    setConfidence(confScore);
  };

  return (
    <div className="min-h-screen bg-[#060b13] text-[#94a3b8] font-mono p-4 select-none uppercase text-[11px] tracking-wider">
      
      {/* TOP BAR / NAVIGATION */}
      <header className="flex justify-between items-center mb-6 border-b border-white/5 pb-2">
        <div className="flex items-center gap-8">
          <div className="text-white font-bold italic text-sm">Dashboard <span className="text-cyan-500/50 font-light ml-1">v1.0</span></div>
          <div className="flex items-center gap-2 italic text-cyan-500"><Activity size={14}/> STATUS: OPERATIONAL</div>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsRunning(!isRunning)}
            className={`h-8 px-6 border font-bold transition-all ${isRunning ? 'border-red-500/50 text-red-500 hover:bg-red-500/10' : 'border-cyan-500/50 text-cyan-400 hover:bg-cyan-400/10'}`}
          >
            {isRunning ? 'TERMINATE MISSION' : 'ENGAGE SYSTEM'}
          </button>
        </div>
      </header>

      <div className="grid grid-cols-12 gap-4 h-[calc(100vh-120px)]">
        
        {/* LEFT PANEL: PRIMARY TELEMETRY */}
        <aside className="col-span-3 space-y-4">
          <TelemetryCard label="T+ SECONDS" value={t.toFixed(2)} unit="s" />
          <TelemetryCard label="VELOCITY" value={Math.sqrt(estState.vx**2 + estState.vy**2).toFixed(1)} unit="m/s" />
          
          <div className="bg-[#0c1420] border border-white/10 p-4 rounded-sm">
            <div className="flex justify-between items-center mb-4">
              <span className="text-[9px] opacity-50 uppercase">Nav Confidence</span>
              <span className={confidence > 70 ? 'text-cyan-400' : 'text-red-500'}>{confidence}%</span>
            </div>
            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
              <motion.div 
                className={`h-full ${confidence > 70 ? 'bg-cyan-500' : 'bg-red-500'}`}
                animate={{ width: `${confidence}%` }}
              />
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <StatusRow label="GPS_RECEIVER" active={!isJammed} />
            <StatusRow label="IMU_ARRAY" active={true} />
            <StatusRow label="KALMAN_ENGINE" active={isRunning} />
            <StatusRow label="COMMS_RELAY" active={true} />
          </div>
        </aside>

        {/* CENTER PANEL: TACTICAL MAP */}
        <main className="col-span-6 bg-[#0c1420] border border-white/10 rounded-sm relative overflow-hidden">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#ffffff 0.5px, transparent 0.5px)', backgroundSize: '30px 30px' }} />
          
          {/* Jamming Overlay */}
          <AnimatePresence>
            {isJammed && (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 z-50 bg-red-950/20 backdrop-blur-[2px] flex items-center justify-center pointer-events-none"
              >
                <div className="flex flex-col items-center gap-2">
                  <ShieldAlert className="text-red-500 animate-pulse" size={48} />
                  <span className="text-red-500 font-bold tracking-[0.5em]">GPS JAMMED</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Waypoint */}
          <div className="absolute w-8 h-8 flex items-center justify-center" style={{ left: waypoint.x, top: waypoint.y, transform: 'translate(-50%, -50%)' }}>
            <Target className="text-yellow-500 animate-pulse" size={24} />
          </div>

          {/* Ground Truth Ghost (Module 2) */}
          <div className="absolute w-4 h-4 border border-white/20 rounded-full" style={{ left: trueState.x, top: trueState.y, transform: 'translate(-50%, -50%)' }} />

          {/* Estimated UAV (Module 4) */}
          <motion.div 
            className="absolute z-20"
            animate={{ left: estState.x, top: estState.y }}
            style={{ transform: `translate(-50%, -50%) rotate(${estState.theta - 45}deg)` }}
          >
            <Navigation2 className="text-cyan-400 fill-cyan-400" size={24} />
          </motion.div>

          {/* HUD HUD Overlay */}
          <div className="absolute bottom-4 left-4 p-2 bg-black/60 border border-white/10 text-[9px] text-cyan-500 space-y-1">
            <div>POS_X: {estState.x.toFixed(2)}</div>
            <div>POS_Y: {estState.y.toFixed(2)}</div>
            <div>HDG: {estState.theta.toFixed(1)}°</div>
          </div>
        </main>

        {/* RIGHT PANEL: LOGS & GRAPHS */}
        <aside className="col-span-3 flex flex-col gap-4">
          <div className="bg-[#0c1420] border border-white/10 p-4 rounded-sm flex-grow overflow-hidden">
            <div className="text-white font-bold mb-4 flex items-center gap-2"><Cpu size={14}/> SYSTEM_LOG</div>
            <div className="space-y-3 text-[9px] opacity-70">
              <LogEntry time={t.toFixed(1)} msg="Module 1: Mission Target Active" />
              <LogEntry time={t.toFixed(1)} msg="Module 2: Kinematics Stable" />
              <LogEntry time={t.toFixed(1)} msg={isJammed ? "Module 3: GPS Link Lost" : "Module 3: Sensors Nominal"} color={isJammed ? "text-red-400" : ""} />
              <LogEntry time={t.toFixed(1)} msg="Module 4: KF Prediction Step" />
            </div>
          </div>

          <div className="bg-[#0c1420] border border-white/10 p-4 rounded-sm">
            <div className="text-[9px] mb-3 opacity-50 tracking-widest uppercase font-bold">Processing Load</div>
            <div className="flex items-end gap-1 h-12">
              {[40, 70, 45, 90, 60, 80].map((h, i) => (
                <div key={i} className="flex-1 bg-cyan-500/20 border-t border-cyan-500/40" style={{ height: `${h}%` }} />
              ))}
            </div>
          </div>

          <div className="bg-red-500/5 border border-red-500/20 p-3 rounded-sm text-[9px] text-red-400 leading-tight">
            <span className="font-bold block mb-1">SYSTEM_WARNING:</span>
            OVERRIDE DISABLED WHILE KALMAN FILTER IS IN ACTIVE FILTERING MODE.
          </div>
        </aside>

      </div>
    </div>
  );
};

// --- HELPER COMPONENTS ---
const TelemetryCard = ({ label, value, unit }) => (
  <div className="bg-[#0c1420] border border-white/10 p-4 rounded-sm">
    <div className="text-[9px] opacity-40 mb-1">{label}</div>
    <div className="flex items-baseline gap-2">
      <span className="text-2xl font-bold text-white tracking-tighter tabular-nums">{value}</span>
      <span className="text-[9px] opacity-20">{unit}</span>
    </div>
  </div>
);

const StatusRow = ({ label, active }) => (
  <div className="flex items-center justify-between px-2 py-1 border-l border-white/10">
    <span className="text-[9px] opacity-50 uppercase">{label}</span>
    <div className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-cyan-500 shadow-[0_0_8px_#06b6d4]' : 'bg-white/10'}`} />
  </div>
);

const LogEntry = ({ time, msg, color = "" }) => (
  <div className={`flex gap-3 border-l border-white/5 pl-2 ${color}`}>
    <span className="opacity-30">[{time}]</span>
    <span>{msg}</span>
  </div>
);

export default Dashboard;