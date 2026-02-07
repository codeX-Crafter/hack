import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  Zap, 
  Microscope, 
  Radio, 
  Wind, 
  Cpu, 
  RefreshCcw,
  Save
} from 'lucide-react';

const Settings = () => {
  // --- CONFIGURATION STATE ---
  const [config, setConfig] = useState({
    dt: 0.05,
    maxVel: 25.0,
    gpsJamStart: 3.0,
    gpsJamDuration: 5.0,
    imuNoise: 0.2,
    gpsNoise: 1.5,
    kalmanQ: 0.01,
    kalmanR: 0.1,
    enableOpticalFlow: true,
    enableCompass: true
  });

  const handleChange = (key, val) => {
    setConfig(prev => ({ ...prev, [key]: parseFloat(val) || val }));
  };

  return (
    <div className="min-h-screen bg-[#060b13] text-[#94a3b8] font-mono p-4 uppercase text-[10px] tracking-wider">
      
      {/* HEADER */}
      <header className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-cyan-500/10 rounded">
            <SettingsIcon className="text-cyan-500" size={18} />
          </div>
          <div>
            <h1 className="text-white font-bold text-sm tracking-tighter">SYSTEM_CONFIGURATION</h1>
            <p className="opacity-50 text-[8px]">CORE_ENGINE_v4 // PARAMETER_TUNING</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 border border-white/10 hover:bg-white/5 transition-all">
            <RefreshCcw size={14}/> RESET_DEFAULTS
          </button>
          <button className="flex items-center gap-2 px-6 py-2 bg-cyan-600 text-black font-bold hover:bg-cyan-400 transition-all">
            <Save size={14}/> APPLY_CHANGES
          </button>
        </div>
      </header>

      <div className="grid grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: PHYSICS & MISSION */}
        <div className="col-span-4 space-y-4">
          <SectionHeader icon={<Zap size={14}/>} title="Simulation_Dynamics" />
          <div className="bg-[#0c1420] border border-white/10 p-6 rounded-sm space-y-6">
            <Slider 
              label="Timestep (dt)" 
              min="0.01" max="0.2" step="0.01" 
              value={config.dt} 
              onChange={(v) => handleChange('dt', v)} 
            />
            <Slider 
              label="Max Velocity" 
              min="5" max="50" step="1" 
              value={config.maxVel} 
              onChange={(v) => handleChange('maxVel', v)} 
            />
            <div className="pt-4 border-t border-white/5">
              <label className="text-[9px] opacity-40 block mb-4">Jamming Schedule (Seconds)</label>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Start T+" value={config.gpsJamStart} onChange={(v) => handleChange('gpsJamStart', v)} />
                <Input label="Duration" value={config.gpsJamDuration} onChange={(v) => handleChange('gpsJamDuration', v)} />
              </div>
            </div>
          </div>
        </div>

        {/* CENTER COLUMN: SENSOR NOISE (σ) */}
        <div className="col-span-4 space-y-4">
          <SectionHeader icon={<Microscope size={14}/>} title="Sensor_Noise_Models" />
          <div className="bg-[#0c1420] border border-white/10 p-6 rounded-sm space-y-6">
            <Slider 
              label="IMU Noise (σ_a)" 
              min="0.05" max="1.0" step="0.05" 
              value={config.imuNoise} 
              onChange={(v) => handleChange('imuNoise', v)} 
            />
            <Slider 
              label="GPS Noise (σ_g)" 
              min="0.1" max="5.0" step="0.1" 
              value={config.gpsNoise} 
              onChange={(v) => handleChange('gpsNoise', v)} 
            />
            
            <div className="pt-4 border-t border-white/5 space-y-4">
              <Toggle 
                label="OPTICAL_FLOW_FUSION" 
                enabled={config.enableOpticalFlow} 
                onToggle={() => handleChange('enableOpticalFlow', !config.enableOpticalFlow)} 
              />
              <Toggle 
                label="COMPASS_HEADING" 
                enabled={config.enableCompass} 
                onToggle={() => handleChange('enableCompass', !config.enableCompass)} 
              />
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: KALMAN GAIN & MATRICES */}
        <div className="col-span-4 space-y-4">
          <SectionHeader icon={<Cpu size={14}/>} title="Kalman_Filter_Tuning" />
          <div className="bg-[#0c1420] border border-white/10 p-6 rounded-sm space-y-6">
            <div className="p-3 bg-cyan-500/5 border border-cyan-500/10 text-[9px] leading-relaxed italic">
              Adjusting Q (Process Noise) and R (Measurement Noise) influences the Kalman Gain (K). A higher R relative to Q makes the filter trust the IMU prediction more than sensors.
            </div>
            
            <Slider 
              label="Process Noise (Q)" 
              min="0.001" max="0.1" step="0.001" 
              value={config.kalmanQ} 
              onChange={(v) => handleChange('kalmanQ', v)} 
            />
            <Slider 
              label="Measurement Noise (R)" 
              min="0.01" max="1.0" step="0.01" 
              value={config.kalmanR} 
              onChange={(v) => handleChange('kalmanR', v)} 
            />

            <div className="mt-6">
              <div className="text-[8px] opacity-30 mb-2">Predicted Kalman Gain (K)</div>
              <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-cyan-500" 
                  style={{ width: `${(config.kalmanQ / (config.kalmanQ + config.kalmanR)) * 100}%` }} 
                />
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

// --- SUB-COMPONENTS ---

const SectionHeader = ({ icon, title }) => (
  <div className="flex items-center gap-2 text-white font-bold tracking-tighter">
    <span className="text-cyan-500">{icon}</span>
    <span>{title}</span>
  </div>
);

const Slider = ({ label, min, max, step, value, onChange }) => (
  <div className="space-y-2">
    <div className="flex justify-between items-center text-[9px]">
      <span className="opacity-50">{label}</span>
      <span className="text-white font-bold">{value}</span>
    </div>
    <input 
      type="range" min={min} max={max} step={step} value={value} 
      onChange={(e) => onChange(e.target.value)}
      className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-500"
    />
  </div>
);

const Input = ({ label, value, onChange }) => (
  <div className="space-y-1">
    <span className="text-[8px] opacity-30">{label}</span>
    <input 
      type="number" value={value} 
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-white/5 border border-white/10 p-2 text-white text-xs outline-none focus:border-cyan-500/50"
    />
  </div>
);

const Toggle = ({ label, enabled, onToggle }) => (
  <div className="flex justify-between items-center group cursor-pointer" onClick={onToggle}>
    <span className={`text-[9px] transition-colors ${enabled ? 'text-white' : 'opacity-30'}`}>{label}</span>
    <div className={`w-8 h-4 rounded-full p-1 transition-all ${enabled ? 'bg-cyan-600' : 'bg-white/10'}`}>
      <div className={`w-2 h-2 bg-white rounded-full transition-all ${enabled ? 'translate-x-4' : 'translate-x-0'}`} />
    </div>
  </div>
);

export default Settings;