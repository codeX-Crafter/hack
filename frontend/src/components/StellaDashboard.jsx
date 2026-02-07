import React, { useState, useEffect, useRef } from 'react';
import TrajectoryPlot from './TrajectoryPlot';
import navdenAPI from '../services/navdenApi';

export default function NavdenDashboard() {
  const [trajectoryData, setTrajectoryData] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [running, setRunning] = useState(false);
  const ws = useRef(null);

  useEffect(() => {
    connectWebSocket();
  }, []);

  const connectWebSocket = () => {
    ws.current = new WebSocket('ws://localhost:8000/ws');
    
    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'update') {
        // Add to trajectory data
        setTrajectoryData(prev => [
          ...prev,
          {
            time: data.time,
            true_position: data.data.true_position,
            estimated_position: data.data.estimated_position,
            confidence: data.data.confidence,
            error: data.data.error,
            gps_status: data.data.gps_status,
          }
        ]);
      } 
      else if (data.type === 'complete') {
        setMetrics(data.final_metrics);
        setRunning(false);
      }
    };
  };

  return (
    <div className="navden-dashboard">
      {/* Header and controls */}
      <header className="navden-header">
        <h1>🛸 NAVDEN Dashboard</h1>
      </header>

      {/* Main content */}
      <main className="navden-content">
        {/* Left panel - metrics */}
        <section className="left-panel">
          {/* Your existing metrics code */}
        </section>

        {/* Right panel - visualization */}
        <section className="right-panel">
          <h2>Trajectory Visualization</h2>
          
          {/* Chart.js visualization */}
          <TrajectoryPlot 
            trajectoryData={trajectoryData} 
            isRunning={running} 
          />

          {/* Show metrics when complete */}
          {metrics && (
            <div className="metrics-summary">
              <h3>Final Results</h3>
              <p>Success Rate: {metrics.mission_success_rate?.toFixed(1)}%</p>
              <p>Max Error: {metrics.max_position_error?.toFixed(2)}m</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
