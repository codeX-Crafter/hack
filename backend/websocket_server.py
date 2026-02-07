
from fastapi import WebSocket, WebSocketDisconnect
import asyncio
import json
from src.Simulator import Simulator


class ConnectionManager:

    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        print(f"[WebSocket] Client connected. Total: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)
        print(f"[WebSocket] Client disconnected. Total: {len(self.active_connections)}")

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                print(f"[WebSocket] Broadcast error: {e}")

    async def send_personal(self, websocket: WebSocket, message: dict):
        try:
            await websocket.send_json(message)
        except Exception as e:
            print(f"[WebSocket] Send error: {e}")


manager = ConnectionManager()


async def run_simulation_stream(websocket: WebSocket):

    simulator = Simulator()

    try:
        await manager.send_personal(
            websocket,
            {
                "type": "start",
                "message": "Simulation started",
                "total_duration": 9.0,
                "dt": 0.01,
                "total_steps": 900,
            },
        )

        step = 0
        total_steps = 900

        while simulator.time < 9.0:
            simulator.step()

            if step % 10 == 0:
                progress = (simulator.time / 9.0) * 100

                message = {
                    "type": "update",
                    "time": round(simulator.time, 2),
                    "progress": round(progress, 1),
                    "step": step,
                    "total_steps": total_steps,
                    "data": {
                        "true_position": {
                            "x": round(simulator.physics.position.x, 2),
                            "y": round(simulator.physics.position.y, 2),
                            "z": round(simulator.physics.position.z, 2),
                        },
                        "estimated_position": {
                            "x": round(
                                simulator.navigation.X[0], 2
                            ),
                            "y": round(
                                simulator.navigation.X[1], 2
                            ),
                            "z": round(
                                simulator.navigation.X[2], 2
                            ),
                        },
                        "confidence": round(
                            simulator.navigation.confidence, 1
                        ),
                        "error": round(
                            ((simulator.physics.position.x - simulator.navigation.X[0]) ** 2
                             + (simulator.physics.position.y - simulator.navigation.X[1]) ** 2) ** 0.5,
                            2,
                        ),
                        "gps_status": "JAMMED"
                        if simulator.mission.mission_state == "JAMMED"
                        else "ACTIVE",
                    },
                    "metrics": {
                        "waypoints_reached": simulator.waypoints_reached,
                        "max_error": round(simulator.navigation.max_error, 2),
                        "total_distance": round(simulator.total_distance, 1),
                    },
                }

                await manager.broadcast(message)

                await asyncio.sleep(0.01)

            step += 1

        mission_data = simulator.mission.update(9.0)

        await manager.broadcast(
            {
                "type": "complete",
                "message": "Simulation completed",
                "final_metrics": {
                    "waypoints_reached": simulator.waypoints_reached,
                    "mission_success_rate": (
                        simulator.waypoints_reached / 4
                    ) * 100,
                    "max_position_error": simulator.navigation.max_error,
                    "final_confidence": simulator.navigation.confidence,
                    "total_distance": simulator.total_distance,
                },
                "trajectory_data": simulator.data,
            }
        )

    except Exception as e:
        await manager.send_personal(
            websocket, {"type": "error", "message": str(e)}
        )
        print(f"[WebSocket] Error: {e}")


__all__ = ["manager", "run_simulation_stream", "ConnectionManager"]
