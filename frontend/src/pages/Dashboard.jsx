import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Navigation2,
  Target,
  Activity,
  Cpu,
  ShieldAlert
} from 'lucide-react';

const Dashboard = () => {
  // --- CORE ENGINE STATE ---
  const [t, setT] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  const [trueState, setTrueState] = useState({ x: 200, y: 300, vx: 0, vy: 0, theta: 45 });
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
    const jamActive = t >= 3 && t <= 8;
    setIsJammed(jamActive);

    const dx = waypoint.x - trueState.x;
    const dy = waypoint.y - trueState.y;
    const dist = Math.sqrt(dx ** 2 + dy ** 2);
    const k = 4.0;

    const ax = dist > 5 ? (dx / dist) * k : 0;
    const ay = dist > 5 ? (dy / dist) * k : 0;

    const nextTrue = {
      vx: trueState.vx + ax * dt,
      vy: trueState.vy + ay * dt,
      x: trueState.x + (trueState.vx + ax * dt) * dt,
      y: trueState.y + (trueState.vy + ay * dt) * dt,
      theta: Math.atan2(trueState.vy, trueState.vx) * (180 / Math.PI)
    };

    const noise = () => (Math.random() - 0.5) * 1.5;
    const gps = { x: nextTrue.x + noise(), y: nextTrue.y + noise() };
    const imu = { ax: ax + noise() * 0.1, ay: ay + noise() * 0.1 };

    let predX = estState.x + estState.vx * dt;
    let predY = estState.y + estState.vy * dt;
    let predVx = estState.vx + imu.ax * dt;
    let predVy = estState.vy + imu.ay * dt;

    let finalX = predX;
    let finalY = predY;
    if (!jamActive) {
      const K = 0.15;
      finalX += K * (gps.x - predX);
      finalY += K * (gps.y - predY);
    }

    const drift = Math.sqrt((nextTrue.x - finalX) ** 2 + (nextTrue.y - finalY) ** 2);
    setConfidence(Math.max(5, Math.floor(100 * Math.exp(-0.05 * drift))));

    setTrueState(nextTrue);
    setEstState({ x: finalX, y: finalY, vx: predVx, vy: predVy, theta: nextTrue.theta });
  };

  return (
    <div className="min-h-screen bg-[#060b13] text-slate-400 font-mono p-4 uppercase text-[10px] tracking-wider select-none">

      {/* HEADER */}
      <header className="flex justify-between items-center mb-4 border-b border-white/5 pb-2">
        <div className="flex items-center gap-6">
          <div className="text-white font-bold flex items-center gap-2">
            <Activity size={14} className="text-cyan-500" />
            DASHBOARD
            <span className="text-cyan-500/40">V1.0</span>
          </div>
          <div className="h-4 w-[1px] bg-white/10" />
          <div>
            STATUS:{' '}
            <span className={isRunning ? 'text-emerald-400' : 'text-yellow-500'}>
              {isRunning ? 'MISSION_ACTIVE' : 'STANDBY'}
            </span>
          </div>
        </div>

        <button
          onClick={() => setIsRunning(!isRunning)}
          className={`px-6 py-3 font-bold transition-all flex items-center gap-2 ${
            isRunning
              ? 'bg-red-500/10 text-red-500 border border-red-500/20'
              : 'bg-cyan-500/10 text-cyan-500 border border-cyan-500/20 hover:bg-cyan-500/20'
          }`}
        >
          {isRunning ? 'TERMINATE' : 'ENGAGE'}
        </button>
      </header>

      <div className="grid grid-cols-12 gap-4 h-[calc(100vh-100px)]">

        {/* LEFT: TELEMETRY */}
        <aside className="col-span-3 space-y-4">
          <TelemetryCard label="T_PLUS" value={t.toFixed(2)} unit="s" />
          <TelemetryCard
            label="SPEED"
            value={Math.sqrt(estState.vx ** 2 + estState.vy ** 2).toFixed(1)}
            unit="m/s"
          />

          <Panel>
            <div className="flex justify-between mb-2">
              <span className="text-[9px] opacity-40">CONFIDENCE</span>
              <span className={confidence > 70 ? 'text-cyan-400' : 'text-red-500'}>
                {confidence}%
              </span>
            </div>
            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-cyan-500"
                animate={{ width: `${confidence}%` }}
              />
            </div>
          </Panel>
        </aside>

        {/* CENTER: MAP */}
        <main className="col-span-6 bg-[#0c1420] border border-white/10 rounded-sm relative overflow-hidden">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                'linear-gradient(#ffffff05 1px, transparent 1px), linear-gradient(90deg, #ffffff05 1px, transparent 1px)',
              backgroundSize: '40px 40px'
            }}
          />

          <AnimatePresence>
            {isJammed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-50 bg-red-950/20 backdrop-blur-sm flex items-center justify-center"
              >
                <div className="flex flex-col items-center gap-2">
                  <ShieldAlert size={40} className="text-red-500 animate-pulse" />
                  <span className="text-red-500 font-bold tracking-[0.3em]">
                    GPS_JAMMED
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div
            className="absolute"
            style={{ left: waypoint.x, top: waypoint.y, transform: 'translate(-50%, -50%)' }}
          >
            <Target className="text-yellow-500 animate-pulse" size={20} />
          </div>

          <motion.div
            className="absolute z-20"
            animate={{ left: estState.x, top: estState.y }}
            style={{ transform: `translate(-50%, -50%) rotate(${estState.theta - 45}deg)` }}
          >
            <Navigation2 className="text-cyan-400 fill-cyan-400" size={22} />
          </motion.div>
        </main>

        {/* RIGHT: LOGS */}
        <aside className="col-span-3 flex flex-col gap-4">
          <Panel className="flex-grow">
            <span className="text-white font-bold text-xs mb-4 flex items-center gap-2">
              <Cpu size={14} className="text-cyan-500" />
              SYSTEM_LOG
            </span>

            <div className="space-y-3 text-[9px]">
              <LogEntry time={t.toFixed(1)} msg="MODULE_1 ACTIVE" />
              <LogEntry time={t.toFixed(1)} msg="KINEMATICS STABLE" />
              <LogEntry
                time={t.toFixed(1)}
                msg={isJammed ? 'GPS_LINK_LOST' : 'SENSORS_NOMINAL'}
                color={isJammed ? 'text-red-400' : ''}
              />
              <LogEntry time={t.toFixed(1)} msg="KF_UPDATE_COMPLETE" />
            </div>
          </Panel>
        </aside>
      </div>
    </div>
  );
};

/* ---------- SHARED UI ---------- */

const Panel = ({ children, className = '' }) => (
  <div className={`bg-[#0c1420] border border-white/10 p-4 rounded-sm ${className}`}>
    {children}
  </div>
);

const TelemetryCard = ({ label, value, unit }) => (
  <Panel>
    <span className="text-[9px] opacity-40">{label}</span>
    <div className="flex items-baseline gap-2">
      <span className="text-2xl font-bold text-white tracking-tighter tabular-nums">
        {value}
      </span>
      <span className="text-[8px] opacity-20">{unit}</span>
    </div>
  </Panel>
);

const LogEntry = ({ time, msg, color = '' }) => (
  <div className={`flex gap-3 border-l border-white/5 pl-2 ${color}`}>
    <span className="text-cyan-500/40">{time}</span>
    <span className="text-white/80">{msg}</span>
  </div>
);

export default Dashboard;
