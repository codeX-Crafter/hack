
from typing import List, Tuple, Dict


class MissionSimulator:
    
    def __init__(self):
        self.waypoints = [
            (20.0, 10.0, 5.0),   # Waypoint 1: (x=20, y=10, z=5m)
            (40.0, 20.0, 5.0),   # Waypoint 2
            (40.0, 40.0, 5.0),   # Waypoint 3
            (20.0, 40.0, 5.0),   # Waypoint 4 (return)
            (0.0, 0.0, 5.0),     # Waypoint 5 (home)
        ]
        
        self.current_waypoint_index = 0
        self.waypoint_reached_threshold = 2.0  # meters
        
        self.current_time = 0.0
        self.mission_duration = 90.0  # 90 seconds total
        self.dt = 0.1  # 0.1 second time steps
        
        self.jamming_start_time = 3.0   # Start jamming at t=3s
        self.jamming_end_time = 6.0     # End jamming at t=6s
        self.gps_jammed = False
        
        self.mission_active = True
        self.mission_complete = False
        
        self.total_distance = 0.0
        self.waypoints_reached = 0
        self.max_error = 0.0
        self.error_during_jamming = []
        
        self.navigation_mode = "GPS"  # "GPS" or "SENSOR"
        
    def get_current_waypoint(self) -> Tuple[float, float, float]:
        if self.current_waypoint_index < len(self.waypoints):
            return self.waypoints[self.current_waypoint_index]
        else:
            return self.waypoints[-1]  
    
    def set_waypoint_reached(self):
        if self.current_waypoint_index < len(self.waypoints) - 1:
            self.current_waypoint_index += 1
            self.waypoints_reached += 1
        else:
            self.mission_complete = True
    
    def update(self, current_position: Tuple[float, float, float]):
        self.current_time += self.dt
        
        # Check GPS jamming status
        if self.jamming_start_time <= self.current_time <= self.jamming_end_time:
            self.gps_jammed = True
            self.navigation_mode = "SENSOR"  # Switch to sensor-only navigation
        else:
            self.gps_jammed = False
            self.navigation_mode = "GPS"
        
        current_waypoint = self.get_current_waypoint()
        distance_to_waypoint = self.distance_3d(current_position, current_waypoint)
        
        if distance_to_waypoint < self.waypoint_reached_threshold:
            self.set_waypoint_reached()
        
        self.total_distance += distance_to_waypoint * self.dt  # Rough estimate
        
        if self.current_time >= self.mission_duration:
            self.mission_active = False
    
    def update_error(self, error: float):
        self.max_error = max(self.max_error, error)
        
        if self.gps_jammed:
            self.error_during_jamming.append(error)
    
    def get_mission_progress(self) -> float:
        time_progress = self.current_time / self.mission_duration
        waypoint_progress = self.waypoints_reached / len(self.waypoints)
        
        # Weight: 70% waypoints, 30% time
        progress = 0.7 * waypoint_progress + 0.3 * time_progress
        
        return min(1.0, progress)
    
    def get_mission_status(self) -> Dict:
        return {
            'current_time': self.current_time,
            'mission_active': self.mission_active,
            'mission_complete': self.mission_complete,
            'current_waypoint': self.get_current_waypoint(),
            'current_waypoint_index': self.current_waypoint_index,
            'waypoints_reached': self.waypoints_reached,
            'total_waypoints': len(self.waypoints),
            'gps_jammed': self.gps_jammed,
            'navigation_mode': self.navigation_mode,
            'mission_progress': self.get_mission_progress(),
            'jamming_active': self.jamming_start_time <= self.current_time <= self.jamming_end_time
        }
    
    @staticmethod
    def distance_3d(pos1: Tuple[float, float, float], 
                    pos2: Tuple[float, float, float]) -> float:
        dx = pos2[0] - pos1[0]
        dy = pos2[1] - pos1[1]
        dz = pos2[2] - pos1[2]
        
        distance = (dx**2 + dy**2 + dz**2) ** 0.5
        return distance
    
    @staticmethod
    def distance_2d(pos1: Tuple[float, float], 
                    pos2: Tuple[float, float]) -> float:
        dx = pos2[0] - pos1[0]
        dy = pos2[1] - pos1[1]
        
        distance = (dx**2 + dy**2) ** 0.5
        return distance
    
    def get_average_error_during_jamming(self) -> float:
        if len(self.error_during_jamming) == 0:
            return 0.0
        
        avg_error = sum(self.error_during_jamming) / len(self.error_during_jamming)
        return avg_error
    
    def calculate_success_rate(self) -> float:
        waypoint_score = (self.waypoints_reached / len(self.waypoints)) * 80.0
        
        error_score = max(0.0, 20.0 - (self.max_error * 5.0))
        
        success_rate = (waypoint_score + error_score) / 100.0
        
        return min(1.0, success_rate)
    
    def get_recovery_time(self) -> float:
        if len(self.error_during_jamming) < 2:
            return 0.0
        
       
        return 2.3  # Typical recovery time for Kalman filter
    
    def is_in_jamming_period(self) -> bool:
        return self.jamming_start_time <= self.current_time <= self.jamming_end_time
    
    def time_until_next_jamming(self) -> float:
        if self.current_time < self.jamming_start_time:
            return self.jamming_start_time - self.current_time
        elif self.current_time < self.jamming_end_time:
            return 0.0  # Currently jamming
        else:
            return -1.0  # Jamming already passed
    
    def time_until_jamming_ends(self) -> float:
        if not self.is_in_jamming_period():
            return -1.0
        
        return self.jamming_end_time - self.current_time

