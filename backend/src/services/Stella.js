```javascript
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  }
});

export const navdenAPI = {
  // Run complete simulation
  runSimulation: async (duration = 90.0, dt = 0.1) => {
    const response = await api.post('/run-simulation', {
      duration,
      dt
    });
    return response.data;
  },

  // Get current state (YOUR EXACT JSON FORMAT)
  getCurrentState: async () => {
    const response = await api.get('/current-state');
    return response.data.state;
  },

  // Get trajectory data
  getTrajectory: async (limit = 100) => {
    const response = await api.get(`/trajectory?limit=${limit}`);
    return response.data.trajectory;
  },

  // Get mission metrics
  getMetrics: async () => {
    const response = await api.get('/metrics');
    return response.data.metrics;
  },

  // Get jamming analysis
  getJammingAnalysis: async () => {
    const response = await api.get('/jamming-analysis');
    return response.data.analysis;
  },

  // Execute one step
  stepSimulation: async () => {
    const response = await api.post('/step-simulation');
    return response.data;
  },

  // Reset simulation
  resetSimulation: async () => {
    const response = await api.post('/reset');
    return response.data;
  },

  // Health check
  healthCheck: async () => {
    const response = await api.get('/health');
    return response.data;
  }
};

export default navdenAPI;
```
