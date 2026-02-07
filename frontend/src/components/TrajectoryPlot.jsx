
import React, { useState, useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import './TrajectoryPlot.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);


const TrajectoryPlot = ({ trajectoryData, isRunning }) => {
  const [chartData, setChartData] = useState(null);
  const chartRef = useRef(null);


  useEffect(() => {
    if (!trajectoryData || trajectoryData.length === 0) {
      return;
    }

    const labels = trajectoryData.map((p) => p.time?.toFixed(1) || '0');
    const trueXData = trajectoryData.map((p) => p.true_position?.x || 0);
    const trueYData = trajectoryData.map((p) => p.true_position?.y || 0);
    const estXData = trajectoryData.map((p) => p.estimated_position?.x || 0);
    const estYData = trajectoryData.map((p) => p.estimated_position?.y || 0);
    const errorData = trajectoryData.map((p) => p.error || 0);
    const confidenceData = trajectoryData.map((p) => p.confidence || 0);
    const gpsStatusData = trajectoryData.map((p) =>
      p.gps_status === 'JAMMED' ? 1 : 0
    );

    const trajectoryChartData = {
      labels: labels,
      datasets: [
        {
          label: 'True Trajectory',
          data: trueXData.map((x, i) => ({ x, y: trueYData[i] })),
          borderColor: 'rgb(0, 212, 255)',
          backgroundColor: 'rgba(0, 212, 255, 0.1)',
          borderWidth: 3,
          pointRadius: 0,
          pointHoverRadius: 5,
          tension: 0.4,
          fill: false,
          borderDash: [],
        },
        {
          label: 'Estimated Trajectory',
          data: estXData.map((x, i) => ({ x, y: estYData[i] })),
          borderColor: 'rgb(0, 255, 0)',
          backgroundColor: 'rgba(0, 255, 0, 0.05)',
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 5,
          tension: 0.4,
          fill: false,
          borderDash: [5, 5],
        },
      ],
    };

    const trajectoryOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: 'UAV Trajectory (2D View)',
          font: { size: 16, weight: 'bold' },
          color: '#00d4ff',
        },
        legend: {
          display: true,
          position: 'top',
          labels: {
            usePointStyle: true,
            padding: 15,
            color: '#fff',
          },
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: '#00d4ff',
          bodyColor: '#fff',
          borderColor: '#00d4ff',
          borderWidth: 1,
        },
      },
      scales: {
        x: {
          type: 'linear',
          position: 'bottom',
          title: {
            display: true,
            text: 'X Position (meters)',
            color: '#aaa',
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.1)',
          },
          ticks: {
            color: '#aaa',
          },
        },
        y: {
          title: {
            display: true,
            text: 'Y Position (meters)',
            color: '#aaa',
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.1)',
          },
          ticks: {
            color: '#aaa',
          },
        },
      },
    };

    setChartData({
      trajectory: {
        data: trajectoryChartData,
        options: trajectoryOptions,
      },
    });
  }, [trajectoryData]);

  if (!chartData) {
    return (
      <div className="trajectory-plot loading">
        <div className="spinner"></div>
        <p>Loading trajectory data...</p>
      </div>
    );
  }

  return (
    <div className="trajectory-plot-container">
      <div className="trajectory-chart-wrapper">
        <Line
          ref={chartRef}
          data={chartData.trajectory.data}
          options={chartData.trajectory.options}
          height={300}
        />
      </div>

      <div className="trajectory-info">
        <h3>Trajectory Information</h3>
        <div className="info-grid">
          <div className="info-item">
            <span className="info-label">Total Points:</span>
            <span className="info-value">
              {trajectoryData.length}
            </span>
          </div>
          <div className="info-item">
            <span className="info-label">Max X:</span>
            <span className="info-value">
              {Math.max(...trajectoryData.map((p) => p.true_position?.x || 0)).toFixed(1)}m
            </span>
          </div>
          <div className="info-item">
            <span className="info-label">Max Y:</span>
            <span className="info-value">
              {Math.max(...trajectoryData.map((p) => p.true_position?.y || 0)).toFixed(1)}m
            </span>
          </div>
          <div className="info-item">
            <span className="info-label">Status:</span>
            <span className={`info-value ${isRunning ? 'running' : 'complete'}`}>
              {isRunning ? 'Running...' : 'Complete'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrajectoryPlot;

