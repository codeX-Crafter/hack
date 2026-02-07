```javascript
import React, { useState, useEffect } from 'react';
import navdenAPI from '../services/navdenApi';

function Dashboard() {
  const [state, setState] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch data from backend
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Get current state (YOUR EXACT JSON FORMAT)
      const currentState = await navdenAPI.getCurrentState();
      setState(currentState);

      // Get metrics
      const metricsData = await navdenAPI.getMetrics();
      setMetrics(metricsData);
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  // Run simulation
  const handleRunSimulation = async () => {
    try {
      setLoading(true);
      const results = await navdenAPI.runSimulation(90.0, 0.1);
      
      // After simulation runs, fetch updated state
      const currentState = await navdenAPI.getCurrentState();
      setState(currentState);
      
      setLoading(false);
    } catch (error) {
      console.error('Error running simulation:', error);
      setLoading(false);
    }
  };

  // Fetch on component mount
  useEffect(() => {
    fetchData();
    
    // Refresh data every 1 second
    const interval = setInterval(fetchData, 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div>Loading...</div>;
  if (!state) return <div>No data available</div>;

  return (
    <div className="dashboard">
      <h1>NAVDEN - GPS-Denied UAV Navigation</h1>

      {/* YOUR EXACT JSON FORMAT */}
      <div className="state-card">
        <h2>Current State</h2>
        
        <div className="state-grid">
          <div>
            <label>True Position:</label>
            <value>
              X: {state.true_position[0]} m, Y: {state.true_position[1]} m
            </value>
          </div>

          <div>
            <label>Estimated Position:</label>
            <value>
              X: {state.estimated_position[0]} m, Y: {state.estimated_position[1]} m
            </value>
          </div>

          <div>
            <label>Velocity:</label>
            <value>
              VX: {state.velocity[0]} m/s, VY: {state.velocity[1]} m/s
            </value>
          </div>

          <div>
            <label>Heading:</label>
            <value>{state.heading} rad ({(state.heading * 180 / Math.PI).toFixed(1)}°)</value>
          </div>

          <div>
            <label>Altitude:</label>
            <value>{state.altitude} m</value>
          </div>

          <div>
            <label>Error:</label>
            <value>{state.error} m</value>
          </div>

          <div>
            <label>Confidence:</label>
            <value>
              <progress value={state.confidence} max="100"></progress>
              {state.confidence}%
            </value>
          </div>

          <div>
            <label>GPS Status:</label>
            <value style={{color: state.gps_available ? 'green' : 'red'}}>
              {state.gps_available ? '✓ ACTIVE' : '✗ JAMMED'}
            </value>
          </div>

          <div>
            <label>Navigation Mode:</label>
            <value>{state.navigation_mode}</value>
          </div>

          <div>
            <label>Current Waypoint:</label>
            <value>
              X: {state.current_waypoint[0]} m, Y: {state.current_waypoint[1]} m
            </value>
          </div>

          <div>
            <label>Mission Progress:</label>
            <value>
              <progress value={state.mission_progress} max="100"></progress>
              {state.mission_progress}%
            </value>
          </div>
        </div>
      </div>

      {/* Metrics */}
      {metrics && (
        <div className="metrics-card">
          <h2>Mission Metrics</h2>
          
          <div className="metrics-grid">
            <div>
              <label>Success Rate:</label>
              <value>{metrics.mission_success_rate}%</value>
            </div>

            <div>
              <label>Waypoints Reached:</label>
              <value>{metrics.waypoints_reached}/{metrics.total_waypoints}</value>
            </div>

            <div>
              <label>Max Error:</label>
              <value>{metrics.max_position_error} m</value>
            </div>

            <div>
              <label>Final Confidence:</label>
              <value>{metrics.final_confidence}%</value>
            </div>

            <div>
              <label>Total Distance:</label>
              <value>{metrics.total_distance} m</value>
            </div>

            <div>
              <label>Current Time:</label>
              <value>{metrics.current_time.toFixed(1)} s</value>
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="controls">
        <button onClick={handleRunSimulation}>Run Simulation</button>
        <button onClick={fetchData}>Refresh</button>
      </div>
    </div>
  );
}

export default Dashboard;
```

### Step 4: Add Styles

Create `src/styles/dashboard.css`:

```css
.dashboard {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: Arial, sans-serif;
}

.dashboard h1 {
  text-align: center;
  color: #333;
  margin-bottom: 30px;
}

.state-card, .metrics-card {
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.state-card h2, .metrics-card h2 {
  margin-top: 0;
  color: #555;
  border-bottom: 2px solid #007bff;
  padding-bottom: 10px;
}

.state-grid, .metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 15px;
}

.state-grid > div, .metrics-grid > div {
  display: flex;
  flex-direction: column;
  padding: 10px;
  background: #f9f9f9;
  border-radius: 4px;
}

.state-grid label, .metrics-grid label {
  font-weight: bold;
  color: #555;
  margin-bottom: 5px;
  font-size: 0.9em;
}

.state-grid value, .metrics-grid value {
  color: #007bff;
  font-size: 1.1em;
  font-family: monospace;
}

progress {
  width: 100%;
  height: 20px;
  margin-bottom: 5px;
}

.controls {
  text-align: center;
  margin-top: 30px;
}

.controls button {
  background: #007bff;
  color: white;
  border: none;
  padding: 10px 20px;
  margin: 0 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1em;
}

.controls button:hover {
  background: #0056b3;
}
```
