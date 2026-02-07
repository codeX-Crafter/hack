import React from 'react';
import StellaDashboard from './components/StellaDashboard';
import './App.css';

function App() {
  return (
    <div className="App">
      <StellaDashboard />
    </div>
  );
}

export default App;








// // import { useState } from "react";
// // import reactLogo from "./assets/react.svg";
// // import viteLogo from "/vite.svg";
// // import "./App.css";
// // import Dashboard from "./pages/Dashboard";
// // import MissionPlanner from "./pages/MissionPlanner";
// // import Analytics from "./pages/Analytics";
// // import Settings from "./pages/Settings";
// // import { Settings } from "lucide-react";

// // export default function App() {
// //   return (
// //     <div>
// //       {/* <Dashboard /> */}
// //       {/* <MissionPlanner /> */}
// //       {/* <Analytics/> */}
// //       <Settings />
// //     </div>
// //   );
// // }
// import React, { useState } from "react";
// import {
//   LayoutDashboard,
//   Map as MapIcon,
//   BarChart3,
//   Settings as SettingsIcon,
//   Terminal,
//   Activity,
// } from "lucide-react";

// // Import your components here
// import Dashboard from "./pages/Dashboard";
// import MissionPlanner from "./pages/MissionPlanner";
// import Analytics from "./pages/Analytics";
// import Settings from "./pages/Settings";

// const App = () => {
//   const [activeTab, setActiveTab] = useState("DASHBOARD");

//   const renderContent = () => {
//     switch (activeTab) {
//       case "DASHBOARD":
//         return <Dashboard />;
//       case "PLANNER":
//         return <MissionPlanner />;
//       case "ANALYTICS":
//         return <Analytics />;
//       case "SETTINGS":
//         return <Settings />;
//       default:
//         return <Dashboard />;
//     }
//   };

//   return (
// <div className="grid grid-cols-[80px_1fr] lg:grid-cols-[288px_1fr] h-screen bg-[#060b13] overflow-hidden">
//       {/* PERSISTENT SIDEBAR */}
//       <nav className="w-20 lg:w-72 border-r border-white/5 flex flex-col bg-[#0a0f18] z-50">
//         <div className="p-6  flex items-center gap-0 border-b border-white/5">
//           <div className="pl-6 flex flex-col items-center border-b border-white/5">
//             {/* LOGO */}
//             <img
//               src="/logoBlack.png"
//               alt="STELLA"
//               className="w-14 lg:w-20 h-auto object-contain"
//             />

//             {/* TAGLINE */}
//             <span className="text-[10px]  text-white/60 uppercase">
//               WHEN GPS FAILS
//             </span>
//           </div>
//         </div>

//         <div className="flex-grow px-3 space-y-2">
//           <NavItem
//             icon={<LayoutDashboard size={20} />}
//             label="DASHBOARD"
//             active={activeTab === "DASHBOARD"}
//             onClick={() => setActiveTab("DASHBOARD")}
//           />
//           <NavItem
//             icon={<MapIcon size={20} />}
//             label="PLAN MISSION"
//             active={activeTab === "PLANNER"}
//             onClick={() => setActiveTab("PLANNER")}
//           />
//           <NavItem
//             icon={<BarChart3 size={20} />}
//             label="ANALYTICS"
//             active={activeTab === "ANALYTICS"}
//             onClick={() => setActiveTab("ANALYTICS")}
//           />
//           <NavItem
//             icon={<SettingsIcon size={20} />}
//             label="CONFIG"
//             active={activeTab === "SETTINGS"}
//             onClick={() => setActiveTab("SETTINGS")}
//           />
//         </div>

//         {/* SYSTEM STATUS FOOTER */}
//         <div className="p-6 border-t border-white/5 hidden lg:block">
//           <div className="flex items-center gap-2 mb-2">
//             <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
//             <span className="text-[9px] font-bold text-white tracking-widest">
//               CORE_STABLE
//             </span>
//           </div>
//           <div className="text-[8px] opacity-30 leading-tight uppercase">
//             Uplink Secure // 256-bit Encrypted
//           </div>
//         </div>
//       </nav>

//       {/* MAIN VIEWPORT */}
//       <main className="flex-grow overflow-y-auto custom-scrollbar relative">
//         {/* Dynamic Scanline Effect (Aesthetic) */}
//         <div className="absolute inset-0 pointer-events-none opacity-[0.03] z-[100] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />

//         {renderContent()}
//       </main>
//     </div>
//   );
// };

// const NavItem = ({ icon, label, active, onClick }) => (
//   <button
//     onClick={onClick}
//     className={`w-full flex items-center gap-4 px-4 py-3 rounded-sm transition-all duration-200 group ${
//       active
//         ? "bg-cyan-500/10 text-cyan-400 border-r-2 border-cyan-500"
//         : "hover:bg-white/5 text-slate-500 hover:text-slate-300"
//     }`}
//   >
//     <span
//       className={`${active ? "text-cyan-400" : "group-hover:text-cyan-400/70"}`}
//     >
//       {icon}
//     </span>
//     <span className="hidden lg:block text-[10px] font-bold tracking-[0.2em]">
//       {label}
//     </span>
//   </button>
// );

// export default App;
