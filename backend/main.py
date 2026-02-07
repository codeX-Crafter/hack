"""
main.py
=======

STELLA - When GPS Fails
Real-time physics-based UAV navigation simulation with Kalman filter sensor fusion

FastAPI server with WebSocket support for real-time updates
"""

from fastapi import FastAPI, HTTPException, Query, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import json
import asyncio

from src.Simulator import Simulator

# ============================================================
# FastAPI App Setup
# ============================================================

app = FastAPI(
    title="STELLA - When GPS Fails",
    description="Real-time physics-based UAV navigation simulation with Kalman filter sensor fusion",
    version="1.0.0"
)

# ============================================================
# CORS Configuration
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "https://yourdomain.com",
        "https://www.yourdomain.com"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# ============================================================
# Pydantic Models
# ============================================================

class SimulationRequest(BaseModel):
    duration: float = 9.0
    dt: float = 0.01

class StateResponse(BaseModel):
    true_position: Dict[str, float]
    estimated_position: Dict[str, float]
    velocity: Dict[str, float]
    heading: float
    altitude: float
    gps_available: bool
    error: float
    confidence: float
    time: float

# ============================================================
# Global Simulator Instance
# ============================================================

simulator: Optional[Simulator] = None

def init_simulator():
    """Initialize simulator instance"""
    global simulator
    simulator = Simulator()
    return simulator

# ============================================================
# Startup Event
# ============================================================

@app.on_event("startup")
async def startup_event():
    """Initialize simulator on startup"""
    init_simulator()
    print("✓ STELLA Backend initialized successfully")

# ============================================================
# REST API ENDPOINTS
# ============================================================

@app.get("/")
async def root():
    """Root endpoint with service information"""
    return {
        "service": "STELLA - When GPS Fails",
        "version": "1.0.0",
        "message": "Welcome to STELLA Backend API",
        "documentation": "http://localhost:8000/docs",
        "websocket": "ws://localhost:8000/ws",
        "quick_start": {
            "1": "POST to /run-simulation to run complete simulation",
            "2": "GET /current-state to see current state",
            "3": "GET /trajectory to see all trajectory points",
            "4": "GET /metrics to see mission results",
            "5": "WebSocket /ws for real-time updates"
        }
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "STELLA Navigation Engine",
        "version": "1.0.0",
        "simulator_ready": simulator is not None
    }

@app.get("/info")
async def backend_info():
    """Get backend information and capabilities"""
    return {
        "service": "STELLA - When GPS Fails",
        "version": "1.0.0",
        "capabilities": [
            "Physics-based UAV simulation",
            "Kalman filter sensor fusion",
            "6 realistic sensors (GPS, IMU, Magnetometer, Barometer, Optical Flow)",
            "GPS jamming scenario",
            "Real-time trajectory visualization",
            "Mission planning and execution",
            "WebSocket streaming"
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
async def run_simulation(request: Optional[SimulationRequest] = None):
    """
    Run complete simulation and return all results
    
    Args:
        request: SimulationRequest with duration and dt
    
    Returns:
        Complete simulation results with trajectory and metrics
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
        print(f"Running simulation for {request.duration} seconds...")
        results = simulator.run(duration=request.duration)
        
        return {
            "status": "success",
            "results": results
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Simulation error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Simulation error: {str(e)}")

@app.post("/step-simulation")
async def step_simulation():
    """
    Execute one simulation step
    
    Returns:
        Current state after step
    """
    try:
        global simulator
        if simulator is None:
            simulator = init_simulator()
        
        simulator.step()
        
        return {
            "success": True,
            "time": round(simulator.time, 3),
            "state": simulator.get_current_state(),
            "metrics": {
                "mission_progress": round(simulator.mission.get_mission_progress() * 100, 2),
                "waypoints_reached": simulator.mission.waypoints_reached,
                "gps_jammed": simulator.mission.gps_jammed
            }
        }
    
    except Exception as e:
        print(f"Step error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Step error: {str(e)}")

@app.get("/current-state")
async def get_current_state():
    """
    Get current simulation state
    
    Returns:
        Current state in exact JSON format
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
            "time": round(simulator.time, 3),
            "state": simulator.get_current_state()
        }
    
    except Exception as e:
        print(f"Error getting state: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@app.get("/trajectory")
async def get_trajectory(limit: int = Query(100, description="Number of latest trajectory points")):
    """
    Get trajectory data
    
    Args:
        limit: Maximum number of points to return
    
    Returns:
        List of trajectory points
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
        print(f"Error getting trajectory: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@app.get("/metrics")
async def get_metrics():
    """
    Get mission metrics and performance data
    
    Returns:
        Mission metrics (success rate, errors, confidence, etc.)
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
            "max_position_error": round(simulator.mission.max_error, 3),
            "final_confidence": round(simulator.navigation.get_confidence() * 100, 2),
            "total_distance": round(simulator.mission.total_distance, 2),
            "current_time": round(simulator.time, 3),
            "gps_jammed": simulator.mission.gps_jammed,
            "navigation_mode": simulator.mission.navigation_mode
        }
        
        return {
            "success": True,
            "metrics": metrics
        }
    
    except Exception as e:
        print(f"Error getting metrics: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@app.get("/jamming-analysis")
async def get_jamming_analysis():
    """
    Get GPS jamming impact analysis
    
    Returns:
        Analysis of how GPS jamming affected navigation
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
                    errors_before.append(point.get('error', 0))
                elif idx < jamming_end_idx:
                    errors_during.append(point.get('error', 0))
                else:
                    errors_after.append(point.get('error', 0))
        
        # Calculate statistics
        avg_before = sum(errors_before) / len(errors_before) if errors_before else 0
        avg_during = sum(errors_during) / len(errors_during) if errors_during else 0
        avg_after = sum(errors_after) / len(errors_after) if errors_after else 0
        peak_error = max(errors_during) if errors_during else 0
        
        analysis = {
            'jam_start_time': simulator.mission.jamming_start_time,
            'jam_end_time': simulator.mission.jamming_end_time,
            'jam_duration': simulator.mission.jamming_end_time - simulator.mission.jamming_start_time,
            'error_before_jam': round(avg_before, 3),
            'peak_error_during_jam': round(peak_error, 3),
            'error_after_recovery': round(avg_after, 3),
            'recovery_time': round(simulator.mission.get_recovery_time(), 3),
            'error_increase_factor': round(peak_error / avg_before if avg_before > 0.01 else 1, 2)
        }
        
        return {
            "success": True,
            "analysis": analysis
        }
    
    except Exception as e:
        print(f"Error in jamming analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@app.post("/reset")
async def reset_simulation():
    """
    Reset simulation to initial state
    
    Returns:
        Fresh simulator state
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
        print(f"Error resetting simulation: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

# ============================================================
# WEBSOCKET ENDPOINT (Real-Time Streaming)
# ============================================================

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for real-time simulation streaming
    
    Message flow:
        1. Client connects
        2. Server starts simulation
        3. Every 0.1s, server sends update with:
           - Current position
           - Confidence
           - Error
           - GPS status
           - Progress
        4. Client receives and updates UI
    """
    await websocket.accept()
    print("✓ WebSocket client connected")
    
    try:
        # Initialize simulator for WebSocket
        global simulator
        simulator = Simulator()
        
        # Send start message
        await websocket.send_json({
            "type": "start",
            "message": "Simulation started",
            "duration": 9.0
        })
        
        # Run simulation and stream updates
        step_count = 0
        max_steps = int(9.0 / simulator.dt)  # 900 steps for 9 seconds at 0.01 dt
        
        while simulator.time < 9.0 and step_count < max_steps:
            # Execute step
            simulator.step()
            step_count += 1
            
            # Send update every 10 steps (0.1 seconds)
            if step_count % 10 == 0:
                progress = (simulator.time / 9.0) * 100
                state = simulator.get_current_state()
                
                update_message = {
                    "type": "update",
                    "progress": round(progress, 1),
                    "time": round(simulator.time, 3),
                    "step": step_count,
                    "total_steps": max_steps,
                    "data": {
                        "true_position": state.get("true_position", {}),
                        "estimated_position": state.get("estimated_position", {}),
                        "confidence": round(state.get("confidence", 0) * 100, 1),
                        "error": round(state.get("error", 0), 3),
                        "gps_status": "JAMMED" if simulator.mission.gps_jammed else "ACTIVE"
                    }
                }
                
                await websocket.send_json(update_message)
                
                # Small delay to prevent overwhelming clients
                await asyncio.sleep(0.01)
        
        # Send completion message with final metrics
        metrics = {
            "waypoints_reached": simulator.mission.waypoints_reached,
            "mission_success_rate": round(simulator.mission.calculate_success_rate() * 100, 2),
            "max_position_error": round(simulator.mission.max_error, 3),
            "final_confidence": round(simulator.navigation.get_confidence() * 100, 2),
            "total_distance": round(simulator.mission.total_distance, 2)
        }
        
        await websocket.send_json({
            "type": "complete",
            "message": "Simulation completed",
            "metrics": metrics
        })
        
        print("✓ WebSocket simulation completed")
    
    except WebSocketDisconnect:
        print("❌ WebSocket client disconnected")
    
    except Exception as e:
        print(f"❌ WebSocket error: {str(e)}")
        try:
            await websocket.send_json({
                "type": "error",
                "message": str(e)
            })
        except:
            pass

# ============================================================
# Exception Handler
# ============================================================

@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    """Handle HTTP exceptions"""
    return {
        "error": True,
        "status_code": exc.status_code,
        "detail": exc.detail
    }

# ============================================================
# Main Entry Point
# ============================================================

if __name__ == "__main__":
    import uvicorn
    
    print("\n" + "=" * 70)
    print("🚀 STELLA - When GPS Fails")
    print("=" * 70)
    print("\nService: STELLA Navigation Engine")
    print("Version: 1.0.0")
    print("\nStarting server on http://localhost:8000")
    print("API Documentation: http://localhost:8000/docs")
    print("WebSocket: ws://localhost:8000/ws")
    print("\nEndpoints:")
    print("  REST API:")
    print("    - GET  /               → Service information")
    print("    - GET  /health         → Health check")
    print("    - GET  /info           → Backend capabilities")
    print("    - POST /run-simulation → Run complete simulation")
    print("    - POST /step-simulation → Execute one step")
    print("    - GET  /current-state  → Get current state")
    print("    - GET  /trajectory     → Get trajectory data")
    print("    - GET  /metrics        → Get mission metrics")
    print("    - GET  /jamming-analysis → Get jamming impact")
    print("    - POST /reset          → Reset simulator")
    print("\n  WebSocket:")
    print("    - WS   /ws             → Real-time streaming")
    print("\n" + "=" * 70 + "\n")
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
