
class StellaAPI {
  constructor() {
    // Change 'localhost' to your server IP if running remotely
    this.baseURL = 'http://localhost:8000';
  }

  async health() {
    try {
      const response = await fetch(`${this.baseURL}/health`);
      return await response.json();
    } catch (error) {
      console.error('Health check failed:', error);
      throw error;
    }
  }

  async getInfo() {
    try {
      const response = await fetch(`${this.baseURL}/info`);
      return await response.json();
    } catch (error) {
      console.error('Failed to get info:', error);
      throw error;
    }
  }


  async runSimulation(duration = 9.0) {
    try {
      const response = await fetch(`${this.baseURL}/run-simulation?duration=${duration}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.status !== 'success') {
        throw new Error(data.message || 'Simulation failed');
      }

      return data;
    } catch (error) {
      console.error('Simulation failed:', error);
      throw error;
    }
  }


  parseTrajectoryData(trajectoryData, maxPoints = 100) {
    if (!trajectoryData || trajectoryData.length === 0) {
      return [];
    }

    const step = Math.max(1, Math.floor(trajectoryData.length / maxPoints));
    const sampled = [];

    for (let i = 0; i < trajectoryData.length; i += step) {
      sampled.push(trajectoryData[i]);
    }

    return sampled;
  }

  getMetrics(simulationResult) {
    if (!simulationResult || !simulationResult.metrics) {
      return null;
    }

    return {
      waypointsReached: simulationResult.metrics.waypoints_reached,
      totalWaypoints: simulationResult.metrics.total_waypoints,
      successRate: simulationResult.metrics.mission_success_rate,
      maxError: simulationResult.metrics.max_position_error,
      finalConfidence: simulationResult.metrics.final_confidence,
      totalDistance: simulationResult.metrics.total_distance,
    };
  }

  getJammingAnalysis(simulationResult) {
    if (!simulationResult || !simulationResult.jamming_analysis) {
      return null;
    }

    return simulationResult.jamming_analysis;
  }


  formatTrajectoryChart(trajectoryData) {
    if (!trajectoryData || trajectoryData.length === 0) {
      return {
        labels: [],
        datasets: [],
      };
    }

    return {
      labels: trajectoryData.map((d) => d.time.toFixed(1)),
      datasets: [
        {
          label: 'True Trajectory (X-Y)',
          data: trajectoryData.map((d) => ({
            x: d.true_x,
            y: d.true_y,
          })),
          borderColor: 'rgba(0, 212, 255, 1)',
          backgroundColor: 'rgba(0, 212, 255, 0.1)',
          fill: false,
          pointRadius: 0,
          borderWidth: 2,
          tension: 0.1,
        },
        {
          label: 'Estimated Trajectory (X-Y)',
          data: trajectoryData.map((d) => ({
            x: d.est_x,
            y: d.est_y,
          })),
          borderColor: 'rgba(0, 255, 0, 1)',
          backgroundColor: 'rgba(0, 255, 0, 0.1)',
          fill: false,
          pointRadius: 0,
          borderWidth: 2,
          borderDash: [5, 5],
          tension: 0.1,
        },
      ],
    };
  }


  formatErrorChart(trajectoryData) {
    if (!trajectoryData || trajectoryData.length === 0) {
      return {
        labels: [],
        datasets: [],
      };
    }

    return {
      labels: trajectoryData.map((d) => d.time.toFixed(1)),
      datasets: [
        {
          label: 'Position Error (m)',
          data: trajectoryData.map((d) => d.error),
          borderColor: 'rgba(255, 107, 107, 1)',
          backgroundColor: 'rgba(255, 107, 107, 0.1)',
          fill: true,
          pointRadius: 0,
          borderWidth: 2,
          tension: 0.3,
        },
      ],
    };
  }


  formatConfidenceChart(trajectoryData) {
    if (!trajectoryData || trajectoryData.length === 0) {
      return {
        labels: [],
        datasets: [],
      };
    }

    return {
      labels: trajectoryData.map((d) => d.time.toFixed(1)),
      datasets: [
        {
          label: 'Navigation Confidence (%)',
          data: trajectoryData.map((d) => d.confidence),
          borderColor: 'rgba(0, 255, 0, 1)',
          backgroundColor: 'rgba(0, 255, 0, 0.2)',
          fill: true,
          pointRadius: 0,
          borderWidth: 2,
          tension: 0.3,
        },
      ],
    };
  }


  formatGPSStatus(trajectoryData) {
    if (!trajectoryData || trajectoryData.length === 0) {
      return {
        jammed: false,
        duration: 0,
        startTime: 0,
        endTime: 0,
      };
    }

    const jammedSegments = trajectoryData.filter((d) => d.gps_status === 'JAMMED');

    if (jammedSegments.length === 0) {
      return {
        jammed: false,
        duration: 0,
        startTime: 0,
        endTime: 0,
      };
    }

    return {
      jammed: true,
      duration: jammedSegments.length * 0.1, // 0.1s per data point
      startTime: jammedSegments[0].time,
      endTime: jammedSegments[jammedSegments.length - 1].time,
      segments: jammedSegments,
    };
  }
}

const StellaAPI = new StellaAPI();

export default StellaAPI;
