"""
Physics Engine: Simulates true UAV motion and dynamics
Handles kinematics, autopilot control, and state propagation
"""

import math
from typing import Tuple, List


class PhysicsEngine:
    """Simulates realistic UAV physics and motion"""
    
    def __init__(self):
        """Initialize physics engine with UAV parameters"""
        # State variables
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
        
        # UAV parameters
        self.mass = 2.0  # kg (typical small quadcopter)
        self.max_acceleration = 15.0  # m/s^2
        self.max_velocity = 20.0  # m/s
        self.max_angular_velocity = 3.0  # rad/s
        
        # Control parameters
        self.target_waypoint = None
        self.autopilot_active = True
        
        # Physics constants
        self.gravity = 9.81  # m/s^2
        self.air_resistance = 0.01  # damping coefficient
        
    def set_state(self, x: float, y: float, z: float, vx: float, vy: float, vz: float, heading: float):
        """Set current state directly"""
        self.position_x = x
        self.position_y = y
        self.altitude = z
        self.velocity_x = vx
        self.velocity_y = vy
        self.velocity_z = vz
        self.heading = heading
    
    def set_waypoint(self, waypoint: Tuple[float, float, float] = None):
        """Set target waypoint for autopilot"""
        self.target_waypoint = waypoint
    
    def get_state(self) -> dict:
        """Get current state as dictionary"""
        return {
            'position': (self.position_x, self.position_y, self.altitude),
            'velocity': (self.velocity_x, self.velocity_y, self.velocity_z),
            'acceleration': (self.acceleration_x, self.acceleration_y, self.acceleration_z),
            'heading': self.heading
        }
    
    def calculate_heading_to_waypoint(self, waypoint: Tuple[float, float, float]) -> float:
        """Calculate heading angle to waypoint"""
        dx = waypoint[0] - self.position_x
        dy = waypoint[1] - self.position_y
        
        heading = math.atan2(dy, dx)
        return heading
    
    def calculate_distance_to_waypoint(self, waypoint: Tuple[float, float, float]) -> float:
        """Calculate distance to waypoint"""
        dx = waypoint[0] - self.position_x
        dy = waypoint[1] - self.position_y
        dz = waypoint[2] - self.altitude
        
        distance = math.sqrt(dx**2 + dy**2 + dz**2)
        return distance
    
    def compute_autopilot_control(self, waypoint: Tuple[float, float, float] = None) -> Tuple[float, float, float]:
        """
        Compute autopilot control forces
        Simple PID-like control to reach waypoint
        Returns: (force_x, force_y, force_z)
        """
        if waypoint is None:
            waypoint = self.target_waypoint
        
        if waypoint is None:
            return 0.0, 0.0, 0.0
        
        # Distance and heading to waypoint
        dx = waypoint[0] - self.position_x
        dy = waypoint[1] - self.position_y
        dz = waypoint[2] - self.altitude
        
        distance_xy = math.sqrt(dx**2 + dy**2)
        
        # Proportional control gains
        kp_position = 2.0  # position control gain
        kp_velocity = 0.5  # velocity damping gain
        
        # Desired velocity (proportional to error)
        desired_velocity_x = kp_position * dx - kp_velocity * self.velocity_x
        desired_velocity_y = kp_position * dy - kp_velocity * self.velocity_y
        desired_velocity_z = kp_position * dz - kp_velocity * self.velocity_z
        
        # Limit desired velocity
        desired_velocity_x = max(-self.max_velocity, min(self.max_velocity, desired_velocity_x))
        desired_velocity_y = max(-self.max_velocity, min(self.max_velocity, desired_velocity_y))
        desired_velocity_z = max(-self.max_velocity, min(self.max_velocity, desired_velocity_z))
        
        # Compute accelerations to reach desired velocity
        acceleration_x = (desired_velocity_x - self.velocity_x) * 2.0
        acceleration_y = (desired_velocity_y - self.velocity_y) * 2.0
        acceleration_z = (desired_velocity_z - self.velocity_z) * 2.0
        
        # Limit accelerations
        acceleration_x = max(-self.max_acceleration, min(self.max_acceleration, acceleration_x))
        acceleration_y = max(-self.max_acceleration, min(self.max_acceleration, acceleration_y))
        acceleration_z = max(-self.max_acceleration, min(self.max_acceleration, acceleration_z))
        
        # Convert to forces
        force_x = acceleration_x * self.mass
        force_y = acceleration_y * self.mass
        force_z = acceleration_z * self.mass + self.mass * self.gravity  # Add gravity compensation
        
        return force_x, force_y, force_z
    
    def update(self, dt: float, force_x: float = 0.0, force_y: float = 0.0, force_z: float = 0.0):
        """
        Update physics for time step dt
        Newton's second law: F = ma
        
        Args:
            dt: time step in seconds
            force_x, force_y, force_z: applied forces in Newtons
        """
        # Apply gravity to force_z (if not already included)
        # force_z already includes gravity compensation from autopilot
        
        # Calculate accelerations from forces (F = ma, a = F/m)
        self.acceleration_x = force_x / self.mass
        self.acceleration_y = force_y / self.mass
        self.acceleration_z = (force_z / self.mass) - self.gravity  # Remove gravity (already in force_z)
        
        # Apply air resistance damping
        self.acceleration_x -= self.air_resistance * self.velocity_x
        self.acceleration_y -= self.air_resistance * self.velocity_y
        
        # Update velocities (v = v0 + a*t)
        self.velocity_x += self.acceleration_x * dt
        self.velocity_y += self.acceleration_y * dt
        self.velocity_z += self.acceleration_z * dt
        
        # Limit velocities
        speed = math.sqrt(self.velocity_x**2 + self.velocity_y**2)
        if speed > self.max_velocity:
            scale = self.max_velocity / speed
            self.velocity_x *= scale
            self.velocity_y *= scale
        
        # Update positions (x = x0 + v*t)
        self.position_x += self.velocity_x * dt
        self.position_y += self.velocity_y * dt
        self.altitude += self.velocity_z * dt
        
        # Prevent going below ground
        if self.altitude < 0.0:
            self.altitude = 0.0
            self.velocity_z = max(0.0, self.velocity_z)  # Stop downward velocity
        
        # Update heading based on velocity direction (yaw from horizontal velocity)
        if math.sqrt(self.velocity_x**2 + self.velocity_y**2) > 0.1:
            self.heading = math.atan2(self.velocity_y, self.velocity_x)
    
    def step(self, dt: float = 0.1):
        """
        Execute one physics step with autopilot control
        """
        if self.autopilot_active and self.target_waypoint:
            force_x, force_y, force_z = self.compute_autopilot_control()
            self.update(dt, force_x, force_y, force_z)
        else:
            self.update(dt)
    
    def get_position_vector(self) -> Tuple[float, float]:
        """Get current 2D position"""
        return (self.position_x, self.position_y)
    
    def get_velocity_vector(self) -> Tuple[float, float]:
        """Get current 2D velocity"""
        return (self.velocity_x, self.velocity_y)
    
    def get_speed(self) -> float:
        """Get current speed magnitude"""
        return math.sqrt(self.velocity_x**2 + self.velocity_y**2 + self.velocity_z**2)

