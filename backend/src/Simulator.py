
import math
from src.PhysicsEngine import PhysicsEngine
from src.SensorSimulator import SensorSimulator
from src.NavigationEngine import NavigationEngine
from src.MissionSimulator import MissionSimulator


class Simulator:
    
    def __init__(self):
        self.physics = PhysicsEngine()
        self.sensors = SensorSimulator()
        self.navigation = NavigationEngine()
        self.mission = MissionSimulator()
        
        self.physics.set_state(x=0.0, y=0.0, z=5.0, vx=0.0, vy=0.0, vz=0.0, heading=0.0)
        self.navigation.set_state(x=0.0, y=0.0, vx=0.0, vy=0.0)
        
        self.time = 0.0
        self.dt = 0.1
        
        first_waypoint = self.mission.get_current_waypoint()
        self.physics.set_waypoint(first_waypoint)
        
        self.trajectory_data = []
        self.current_state = {}
        
    def step(self):
        true_x = self.physics.position_x
        true_y = self.physics.position_y
        true_z = self.physics.altitude
        true_vx = self.physics.velocity_x
        true_vy = self.physics.velocity_y
        true_vz = self.physics.velocity_z
        true_heading = self.physics.heading
        
        self.navigation.predict()
        
        measurements = self.sensors.measure_all(
            true_x, true_y, true_z,
            true_vx, true_vy, true_vz,
            true_heading
        )
        
        
        if measurements['gps']['valid']:
            self.navigation.update_gps(
                measurements['gps']['x'],
                measurements['gps']['y'],
                measurements['gps']['z']
            )
            self.mission.navigation_mode = "GPS"
        else:
            self.mission.navigation_mode = "SENSOR"
        
        if measurements['optical_flow']['valid']:
            self.navigation.update_optical_flow(
                measurements['optical_flow']['vx'],
                measurements['optical_flow']['vy']
            )
        
        self.physics.step(self.dt)
        
        self.mission.update((true_x, true_y, true_z))
        
        estimated_state = self.navigation.get_state()
        
        error_x = estimated_state['x'] - true_x
        error_y = estimated_state['y'] - true_y
        error = math.sqrt(error_x**2 + error_y**2)
        
        self.mission.update_error(error)
        
        confidence = self.navigation.get_confidence()
        
        self.current_state = {
            'true_position': [round(true_x, 2), round(true_y, 2)],
            'estimated_position': [round(estimated_state['x'], 2), round(estimated_state['y'], 2)],
            'velocity': [round(true_vx, 2), round(true_vy, 2)],
            'heading': round(true_heading, 2),
            'altitude': round(true_z, 2),
            'gps_available': measurements['gps']['valid'],
            'navigation_mode': self.mission.navigation_mode,
            'error': round(error, 2),
            'confidence': round(confidence * 100, 2),  # As percentage
            'current_waypoint': list(self.mission.get_current_waypoint()[:2]),
            'mission_progress': round(self.mission.get_mission_progress() * 100, 2)  # As percentage
        }
        
        self.trajectory_data.append({
            'time': round(self.time, 1),
            'true_x': round(true_x, 2),
            'true_y': round(true_y, 2),
            'est_x': round(estimated_state['x'], 2),
            'est_y': round(estimated_state['y'], 2),
            'error': round(error, 2),
            'confidence': round(confidence * 100, 2),
            'gps_status': 'ACTIVE' if measurements['gps']['valid'] else 'JAMMED',
            'nav_mode': self.mission.navigation_mode
        })
        
        self.time += self.dt
    
    def run(self, duration: float = 90.0):
        num_steps = int(duration / self.dt)
        
        for i in range(num_steps):
            self.step()
            
            if not self.mission.mission_active:
                break
        
        return self.get_results()
    
    def get_results(self):
        metrics = {
            'waypoints_reached': self.mission.waypoints_reached,
            'total_waypoints': len(self.mission.waypoints),
            'mission_success_rate': round(self.mission.calculate_success_rate() * 100, 2),
            'max_position_error': round(self.mission.max_error, 2),
            'final_confidence': round(self.navigation.get_confidence() * 100, 2),
            'total_distance': round(self.mission.total_distance, 2)
        }
        
        jamming_analysis = {
            'jam_start_time': self.mission.jamming_start_time,
            'jam_end_time': self.mission.jamming_end_time,
            'error_before_jam': round(self.trajectory_data[int(self.mission.jamming_start_time / self.dt) - 1]['error'] if len(self.trajectory_data) > 0 else 0, 2),
            'peak_error_during_jam': round(self.mission.max_error, 2),
            'error_after_recovery': round(self.trajectory_data[-1]['error'] if len(self.trajectory_data) > 0 else 0, 2),
            'recovery_time': round(self.mission.get_recovery_time(), 2)
        }
        
        results = {
            'status': 'success' if self.mission.mission_complete else 'running',
            'trajectory_data': self.trajectory_data,
            'metrics': metrics,
            'jamming_analysis': jamming_analysis,
            'current_state': self.current_state,
            'mission_status': self.mission.get_mission_status()
        }
        
        return results
    
    def get_current_state(self):
        return self.current_state
    
    def get_trajectory_data(self):
        return self.trajectory_data
    
    def get_metrics(self):
        metrics = {
            'waypoints_reached': self.mission.waypoints_reached,
            'total_waypoints': len(self.mission.waypoints),
            'mission_success_rate': round(self.mission.calculate_success_rate() * 100, 2),
            'max_position_error': round(self.mission.max_error, 2),
            'final_confidence': round(self.navigation.get_confidence() * 100, 2),
            'total_distance': round(self.mission.total_distance, 2)
        }
        return metrics


# For testing
if __name__ == '__main__':
    print("STELLA - Where GPS Fails")
    print("=" * 60)
    
    sim = Simulator()
    results = sim.run(duration=90.0)
    
    print("\nCURRENT STATE:")
    print(results['current_state'])
    
    print("\n\nMISSION METRICS:")
    for key, value in results['metrics'].items():
        print(f"  {key}: {value}")
    
    print("\n\nGPS JAMMING ANALYSIS:")
    for key, value in results['jamming_analysis'].items():
        print(f"  {key}: {value}")
    
    print("\n\nTRAJECTORY DATA (first 10 points):")
    for point in results['trajectory_data'][:10]:
        print(f"  Time {point['time']}s: True=({point['true_x']}, {point['true_y']}) Est=({point['est_x']}, {point['est_y']}) Error={point['error']}m GPS={point['gps_status']}")

