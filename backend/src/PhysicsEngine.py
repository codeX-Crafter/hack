

import math
from typing import Tuple, List


class PhysicsEngine:
    
    def __init__(self):
        self.position_x = 0.0  # meters
        self.position_y = 0.0  # meters
        self.altitude = 0.0    # meters
        
        self.velocity_x = 0.0  # m/s
        self.velocity_y = 0.0  # m/s
        self.velocity_z = 0.0  # m/s (vertical)
        
        self.acceleration_x = 0.0  # m/s^2
        self.acceleration_y = 0.0  # m/s^2
        self.acceleration_z = 0.0  # m/s^2
        
        self.heading = 0.0  # radians
        self.pitch = 0.0    # radians
        self.roll = 0.0     # radians
        
        self.mass = 2.0  # kg (typical small quadcopter)
        self.max_acceleration = 15.0  # m/s^2
        self.max_velocity = 20.0  # m/s
        self.max_angular_velocity = 3.0  # rad/s
        
        self.target_waypoint = None
        self.autopilot_active = True
        
        self.gravity = 9.81  # m/s^2
        self.air_resistance = 0.01  # damping coefficient
        
    def set_state(self, x: float, y: float, z: float, vx: float, vy: float, vz: float, heading: float):
        self.position_x = x
        self.position_y = y
        self.altitude = z
        self.velocity_x = vx
        self.velocity_y = vy
        self.velocity_z = vz
        self.heading = heading
    
    def set_waypoint(self, waypoint: Tuple[float, float, float] = None):
        self.target_waypoint = waypoint
    
    def get_state(self) -> dict:
        return {
            'position': (self.position_x, self.position_y, self.altitude),
            'velocity': (self.velocity_x, self.velocity_y, self.velocity_z),
            'acceleration': (self.acceleration_x, self.acceleration_y, self.acceleration_z),
            'heading': self.heading
        }
    
    def calculate_heading_to_waypoint(self, waypoint: Tuple[float, float, float]) -> float:
        dx = waypoint[0] - self.position_x
        dy = waypoint[1] - self.position_y
        
        heading = math.atan2(dy, dx)
        return heading
    
    def calculate_distance_to_waypoint(self, waypoint: Tuple[float, float, float]) -> float:
        dx = waypoint[0] - self.position_x
        dy = waypoint[1] - self.position_y
        dz = waypoint[2] - self.altitude
        
        distance = math.sqrt(dx**2 + dy**2 + dz**2)
        return distance
    
    def compute_autopilot_control(self, waypoint: Tuple[float, float, float] = None) -> Tuple[float, float, float]:

        if waypoint is None:
            waypoint = self.target_waypoint
        
        if waypoint is None:
            return 0.0, 0.0, 0.0
        
        dx = waypoint[0] - self.position_x
        dy = waypoint[1] - self.position_y
        dz = waypoint[2] - self.altitude
        
        distance_xy = math.sqrt(dx**2 + dy**2)
        
        kp_position = 2.0  # position control gain
        kp_velocity = 0.5  # velocity damping gain
        
        desired_velocity_x = kp_position * dx - kp_velocity * self.velocity_x
        desired_velocity_y = kp_position * dy - kp_velocity * self.velocity_y
        desired_velocity_z = kp_position * dz - kp_velocity * self.velocity_z
        
        desired_velocity_x = max(-self.max_velocity, min(self.max_velocity, desired_velocity_x))
        desired_velocity_y = max(-self.max_velocity, min(self.max_velocity, desired_velocity_y))
        desired_velocity_z = max(-self.max_velocity, min(self.max_velocity, desired_velocity_z))
        
        acceleration_x = (desired_velocity_x - self.velocity_x) * 2.0
        acceleration_y = (desired_velocity_y - self.velocity_y) * 2.0
        acceleration_z = (desired_velocity_z - self.velocity_z) * 2.0
        
        acceleration_x = max(-self.max_acceleration, min(self.max_acceleration, acceleration_x))
        acceleration_y = max(-self.max_acceleration, min(self.max_acceleration, acceleration_y))
        acceleration_z = max(-self.max_acceleration, min(self.max_acceleration, acceleration_z))
        
        force_x = acceleration_x * self.mass
        force_y = acceleration_y * self.mass
        force_z = acceleration_z * self.mass + self.mass * self.gravity  # Add gravity compensation
        
        return force_x, force_y, force_z
    
    def update(self, dt: float, force_x: float = 0.0, force_y: float = 0.0, force_z: float = 0.0):

        self.acceleration_x = force_x / self.mass
        self.acceleration_y = force_y / self.mass
        self.acceleration_z = (force_z / self.mass) - self.gravity  # Remove gravity (already in force_z)
        
        self.acceleration_x -= self.air_resistance * self.velocity_x
        self.acceleration_y -= self.air_resistance * self.velocity_y
        
        self.velocity_x += self.acceleration_x * dt
        self.velocity_y += self.acceleration_y * dt
        self.velocity_z += self.acceleration_z * dt
        
        speed = math.sqrt(self.velocity_x**2 + self.velocity_y**2)
        if speed > self.max_velocity:
            scale = self.max_velocity / speed
            self.velocity_x *= scale
            self.velocity_y *= scale
        
        self.position_x += self.velocity_x * dt
        self.position_y += self.velocity_y * dt
        self.altitude += self.velocity_z * dt
        
        if self.altitude < 0.0:
            self.altitude = 0.0
            self.velocity_z = max(0.0, self.velocity_z)  # Stop downward velocity
        
        if math.sqrt(self.velocity_x**2 + self.velocity_y**2) > 0.1:
            self.heading = math.atan2(self.velocity_y, self.velocity_x)
    
    def step(self, dt: float = 0.1):

        if self.autopilot_active and self.target_waypoint:
            force_x, force_y, force_z = self.compute_autopilot_control()
            self.update(dt, force_x, force_y, force_z)
        else:
            self.update(dt)
    
    def get_position_vector(self) -> Tuple[float, float]:
        return (self.position_x, self.position_y)
    
    def get_velocity_vector(self) -> Tuple[float, float]:
        return (self.velocity_x, self.velocity_y)
    
    def get_speed(self) -> float:
        return math.sqrt(self.velocity_x**2 + self.velocity_y**2 + self.velocity_z**2)

