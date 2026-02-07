"""
FastAPI Server: Main application for GPS-denied UAV navigation simulation
Exposes REST API endpoints for React frontend integration
"""

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any
import json

from src_Simulator import Simulator

# ===== FASTAPI APP SETUP =====
app = FastAPI(
    title="NAVDEN - GPS-Denied UAV Navigation",
    description="Real-time physics-based UAV navigation simulation with Kalman filter sensor fusion",
    version="1.0.0"
)

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change to your frontend URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ===== PYDANTIC MODELS =====
class SimulationRequest(BaseModel):
    """Request model for simulation"""
    duration: float = 90.0
    dt: float = 0.1

class StateResponse(BaseModel):
    """Response model for current state"""
    true_position: List[float]
    estimated_position: List[float]
    velocity: List[float]
    heading: float
    altitude: float
    gps_available: bool
    navigation_mode: str
    error: float
    confidence: float
    current_waypoint: List[float]
    mission_progress: float

# ===== GLOBAL SIMULATOR INSTANCE =====
simulator = None

def init_simulator():
    """Initialize simulator"""
    global simulator
    simulator = Simulator()
    return simulator

# ===== API ENDPOINTS =====

@app.on_event("startup")
async def startup_event():
    """Initialize simulator on startup"""
    init_simulator()
    print("✓ NAVDEN Backend initialized")

@app.get("/health")
async def health_check():
    """
    Health check endpoint
    Returns server status
    """
    return {
        "status": "healthy",
        "service": "NAVDEN Navigation Engine",
        "version": "1.0.0"
    }

@app.get("/info")
async def backend_info():
    """
    Get backend information
    Returns system info and capabilities
    """
    return {
        "service": "NAVDEN - GPS-Denied UAV Navigation System",
        "version": "1.0.0",
        "capabilities": [
            "Physics-based UAV simulation",
            "Kalman filter sensor fusion",
            "6 realistic sensors (GPS, IMU, Magnetometer, Barometer, Optical Flow)",
            "GPS jamming scenario",
            "Real-time trajectory visualization",
            "Mission planning and execution"
        ],
        "algorithms": [
            "Kalman Filter (optimal sensor fusion)",
            "Dead Reckoning (accelerometer integration)",
            "Optical Flow (vision-based navigation)",
            "PID Autopilot Control"
        ],
        "sensors_simulated": [
            "GPS (with jamming support)",
            "Accelerometer (IMU)",
            "Gyroscope (angular velocity)",
            "Magnetometer (compass)",
            "Barometer (altitude)",
            "Optical Flow (camera velocity)"
        ]
    }

@app.post("/run-simulation")
async def run_simulation(request: SimulationRequest = None):
    """
    Run complete simulation
    
    Request body:
    {
        "duration": 90.0,  # seconds
        "dt": 0.1         # time step
    }
    
    Returns: Complete simulation results with trajectory, metrics, and analysis
    """
    try:
        if request is None:
            request = SimulationRequest()
        
        # Validate duration
        if request.duration <= 0:
            raise HTTPException(status_code=400, detail="Duration must be positive")
        
        if request.duration > 300:
            raise HTTPException(status_code=400, detail="Duration cannot exceed 300 seconds")
        
        # Create fresh simulator
        global simulator
        simulator = Simulator()
        simulator.dt = request.dt
        
        # Run simulation
        results = simulator.run(duration=request.duration)
        
        return results
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Simulation error: {str(e)}")

@app.post("/step-simulation")
async def step_simulation():
    """
    Execute one simulation step and return current state
    
    Returns: Current state in your exact JSON format
    """
    try:
        global simulator
        if simulator is None:
            simulator = init_simulator()
        
        simulator.step()
        
        return {
            "success": True,
            "time": round(simulator.time, 2),
            "state": simulator.get_current_state(),
            "metrics": {
                "mission_progress": round(simulator.mission.get_mission_progress() * 100, 2),
                "waypoints_reached": simulator.mission.waypoints_reached,
                "gps_jammed": simulator.mission.gps_jammed
            }
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Step error: {str(e)}")

@app.get("/current-state")
async def get_current_state():
    """
    Get current simulation state (your exact JSON format)
    
    Returns the most recent state snapshot
    """
    try:
        global simulator
        if simulator is None:
            return {
                "error": "Simulator not initialized. Call /run-simulation first.",
                "state": None
            }
        
        return {
            "success": True,
            "time": round(simulator.time, 2),
            "state": simulator.get_current_state()
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@app.get("/trajectory")
async def get_trajectory(
    limit: int = Query(100, description="Number of latest trajectory points to return")
):
    """
    Get trajectory data
    
    Returns: List of trajectory points
    """
    try:
        global simulator
        if simulator is None:
            return {
                "error": "Simulator not initialized",
                "trajectory": []
            }
        
        trajectory = simulator.get_trajectory_data()
        
        # Return last 'limit' points
        if len(trajectory) > limit:
            trajectory = trajectory[-limit:]
        
        return {
            "success": True,
            "total_points": len(simulator.get_trajectory_data()),
            "returned_points": len(trajectory),
            "trajectory": trajectory
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@app.get("/metrics")
async def get_metrics():
    """
    Get current mission metrics
    
    Returns: Mission statistics and performance metrics
    """
    try:
        global simulator
        if simulator is None:
            return {
                "error": "Simulator not initialized",
                "metrics": None
            }
        
        metrics = {
            "waypoints_reached": simulator.mission.waypoints_reached,
            "total_waypoints": len(simulator.mission.waypoints),
            "mission_progress": round(simulator.mission.get_mission_progress() * 100, 2),
            "mission_success_rate": round(simulator.mission.calculate_success_rate() * 100, 2),
            "max_position_error": round(simulator.mission.max_error, 2),
            "final_confidence": round(simulator.navigation.get_confidence() * 100, 2),
            "total_distance": round(simulator.mission.total_distance, 2),
            "current_time": round(simulator.time, 2),
            "gps_jammed": simulator.mission.gps_jammed,
            "navigation_mode": simulator.mission.navigation_mode
        }
        
        return {
            "success": True,
            "metrics": metrics
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@app.get("/jamming-analysis")
async def get_jamming_analysis():
    """
    Get GPS jamming analysis
    
    Returns: Detailed analysis of jamming impact
    """
    try:
        global simulator
        if simulator is None:
            return {
                "error": "Simulator not initialized",
                "analysis": None
            }
        
        # Get trajectory data
        trajectory = simulator.get_trajectory_data()
        
        # Find jamming period data
        jamming_start_idx = int(simulator.mission.jamming_start_time / simulator.dt)
        jamming_end_idx = int(simulator.mission.jamming_end_time / simulator.dt)
        
        errors_before = []
        errors_during = []
        errors_after = []
        
        if len(trajectory) > 0:
            for idx, point in enumerate(trajectory):
                if idx < jamming_start_idx:
                    errors_before.append(point['error'])
                elif idx < jamming_end_idx:
                    errors_during.append(point['error'])
                else:
                    errors_after.append(point['error'])
        
        # Calculate averages
        avg_before = sum(errors_before) / len(errors_before) if errors_before else 0
        avg_during = sum(errors_during) / len(errors_during) if errors_during else 0
        avg_after = sum(errors_after) / len(errors_after) if errors_after else 0
        
        peak_error = max(errors_during) if errors_during else 0
        
        analysis = {
            'jam_start_time': simulator.mission.jamming_start_time,
            'jam_end_time': simulator.mission.jamming_end_time,
            'jam_duration': simulator.mission.jamming_end_time - simulator.mission.jamming_start_time,
            'error_before_jam': round(avg_before, 2),
            'peak_error_during_jam': round(peak_error, 2),
            'error_after_recovery': round(avg_after, 2),
            'recovery_time': round(simulator.mission.get_recovery_time(), 2),
            'error_increase_factor': round(peak_error / avg_before if avg_before > 0 else 1, 2)
        }
        
        return {
            "success": True,
            "analysis": analysis
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@app.post("/reset")
async def reset_simulation():
    """
    Reset simulation to initial state
    
    Returns: Confirmation of reset
    """
    try:
        global simulator
        simulator = Simulator()
        
        return {
            "success": True,
            "message": "Simulation reset to initial state",
            "state": simulator.get_current_state()
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

# ===== ROOT ENDPOINT =====
@app.get("/")
async def root():
    """Root endpoint with API documentation"""
    return {
        "service": "NAVDEN - GPS-Denied UAV Navigation System",
        "message": "Welcome to NAVDEN Backend API",
        "documentation": "/docs",
        "endpoints": {
            "health": "GET /health - Health check",
            "info": "GET /info - Backend information",
            "run_simulation": "POST /run-simulation - Run complete simulation",
            "step_simulation": "POST /step-simulation - Execute one step",
            "current_state": "GET /current-state - Get current state (YOUR JSON FORMAT)",
            "trajectory": "GET /trajectory - Get trajectory data",
            "metrics": "GET /metrics - Get mission metrics",
            "jamming_analysis": "GET /jamming-analysis - Get jamming impact analysis",
            "reset": "POST /reset - Reset simulation"
        },
        "quick_start": {
            "1": "POST to /run-simulation with duration",
            "2": "GET /current-state to see your exact JSON format",
            "3": "GET /trajectory to see all trajectory points",
            "4": "GET /metrics to see mission results",
            "5": "GET /jamming-analysis to see GPS jamming impact"
        }
    }

# ===== ERROR HANDLERS =====
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return {
        "error": True,
        "status_code": exc.status_code,
        "detail": exc.detail
    }

# ===== FOR DEVELOPMENT =====
if __name__ == "__main__":
    import uvicorn
    
    print("Starting NAVDEN Backend Server...")
    print("=" * 60)
    print("Service: NAVDEN - GPS-Denied UAV Navigation")
    print("Version: 1.0.0")
    print("=" * 60)
    print("\nStarting server on http://localhost:8000")
    print("API Docs: http://localhost:8000/docs")
    print("\nEndpoints:")
    print("  - POST /run-simulation - Run simulation")
    print("  - GET /current-state - Your exact JSON format")
    print("  - GET /trajectory - All trajectory data")
    print("  - GET /metrics - Mission metrics")
    print("  - GET /jamming-analysis - Jamming analysis")
    print("=" * 60)
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )

