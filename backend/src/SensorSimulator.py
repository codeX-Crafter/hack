
import math
import random
from typing import Tuple, List, Dict


class SensorSimulator:
    
    def __init__(self):
        self.gps_noise_std = 0.5  # meters (1-sigma standard deviation)
        self.gps_bias = (0.0, 0.0, 0.0)  # systematic error
        
        self.accel_noise_std = 0.05  # m/s^2
        self.accel_bias_x = 0.01  # m/s^2
        self.accel_bias_y = 0.01
        self.accel_bias_z = 0.01
        self.accel_scale_factor = 1.0  # calibration factor
        
        self.gyro_noise_std = 0.01  # rad/s
        self.gyro_bias_x = 0.001  # rad/s (drift)
        self.gyro_bias_y = 0.001
        self.gyro_bias_z = 0.001
        self.gyro_scale_factor = 1.0
        
        self.mag_noise_std = 0.1  # Gauss
        self.mag_declination = 0.0  # radians (local variation)
        self.magnetic_interference = 0.0  # external field
        
        self.baro_noise_std = 0.5  # meters
        self.baro_bias = 0.0  # systematic error
        
        self.flow_noise_std = 0.1  # m/s
        self.flow_scale_factor = 1.0  # calibration
        self.flow_works_without_gps = True  # Important: works during GPS denial
        
        self.gps_jammed = False
        self.gps_jamming_strength = 0.0  # 0.0 to 1.0
        
        self.gyro_integral_x = 0.0  # Accumulated rotation X
        self.gyro_integral_y = 0.0
        self.gyro_integral_z = 0.0
        
        self.last_accel = (0.0, 0.0, 0.0)
    
    def set_gps_jamming(self, jammed: bool, strength: float = 0.0):
        self.gps_jammed = jammed
        self.gps_jamming_strength = max(0.0, min(1.0, strength))  # 0.0 to 1.0
    
    def add_gaussian_noise(self, value: float, std: float) -> float:
        noise = random.gauss(0.0, std)
        return value + noise
    
    def measure_gps(self, true_x: float, true_y: float, true_z: float) -> Tuple[float, float, float, bool]:

        if self.gps_jammed:
            if random.random() < self.gps_jamming_strength:
                return None, None, None, False  # No GPS signal
            else:
                bad_x = true_x + random.gauss(0, 50.0)  # Large error
                bad_y = true_y + random.gauss(0, 50.0)
                bad_z = true_z + random.gauss(0, 20.0)
                return bad_x, bad_y, bad_z, False
        
        gps_x = self.add_gaussian_noise(true_x, self.gps_noise_std)
        gps_y = self.add_gaussian_noise(true_y, self.gps_noise_std)
        gps_z = self.add_gaussian_noise(true_z, self.gps_noise_std)
        
        return gps_x, gps_y, gps_z, True
    
    def measure_accelerometer(self, true_accel_x: float, true_accel_y: float, 
                            true_accel_z: float, gravity: float = 9.81) -> Tuple[float, float, float]:

       
        accel_x = true_accel_x * self.accel_scale_factor + self.accel_bias_x
        accel_y = true_accel_y * self.accel_scale_factor + self.accel_bias_y
        accel_z = (true_accel_z - gravity) * self.accel_scale_factor + self.accel_bias_z
        
        accel_x = self.add_gaussian_noise(accel_x, self.accel_noise_std)
        accel_y = self.add_gaussian_noise(accel_y, self.accel_noise_std)
        accel_z = self.add_gaussian_noise(accel_z, self.accel_noise_std)
        
        self.last_accel = (accel_x, accel_y, accel_z)
        return accel_x, accel_y, accel_z
    
    def measure_gyroscope(self, true_angular_vel_x: float, true_angular_vel_y: float, 
                         true_angular_vel_z: float) -> Tuple[float, float, float]:

        gyro_x = true_angular_vel_x * self.gyro_scale_factor + self.gyro_bias_x
        gyro_y = true_angular_vel_y * self.gyro_scale_factor + self.gyro_bias_y
        gyro_z = true_angular_vel_z * self.gyro_scale_factor + self.gyro_bias_z
        
        gyro_x = self.add_gaussian_noise(gyro_x, self.gyro_noise_std)
        gyro_y = self.add_gaussian_noise(gyro_y, self.gyro_noise_std)
        gyro_z = self.add_gaussian_noise(gyro_z, self.gyro_noise_std)
        
        dt = 0.1  # Assuming 0.1s time step
        self.gyro_integral_x += gyro_x * dt
        self.gyro_integral_y += gyro_y * dt
        self.gyro_integral_z += gyro_z * dt
        
        return gyro_x, gyro_y, gyro_z
    
    def measure_magnetometer(self, true_heading: float) -> float:

        measured_heading = true_heading + self.mag_declination + self.magnetic_interference
        
        measured_heading = self.add_gaussian_noise(measured_heading, self.mag_noise_std * 0.01745)  # Convert to radians
        
        while measured_heading > math.pi:
            measured_heading -= 2 * math.pi
        while measured_heading < -math.pi:
            measured_heading += 2 * math.pi
        
        return measured_heading
    
    def measure_barometer(self, true_altitude: float) -> float:

        measured_altitude = true_altitude + self.baro_bias
        
        measured_altitude = self.add_gaussian_noise(measured_altitude, self.baro_noise_std)
        
        measured_altitude = max(0.0, measured_altitude)
        
        return measured_altitude
    
    def measure_optical_flow(self, true_velocity_x: float, true_velocity_y: float,
                           altitude: float) -> Tuple[float, float, bool]:
     
        altitude_factor = min(1.0, altitude / 100.0)  # Less noisy at lower altitudes
        
        noise_std = self.flow_noise_std * (1.0 + altitude_factor)
        
        flow_x = self.add_gaussian_noise(true_velocity_x, noise_std)
        flow_y = self.add_gaussian_noise(true_velocity_y, noise_std)
        
        valid = True
        
        return flow_x, flow_y, valid
    
    def measure_all(self, true_x: float, true_y: float, true_z: float,
                   true_vx: float, true_vy: float, true_vz: float,
                   true_heading: float) -> Dict:

        gps_x, gps_y, gps_z, gps_valid = self.measure_gps(true_x, true_y, true_z)
        
        accel_x, accel_y, accel_z = self.measure_accelerometer(0.0, 0.0, true_vz)
        gyro_x, gyro_y, gyro_z = self.measure_gyroscope(0.0, 0.0, 0.0)
        
        mag_heading = self.measure_magnetometer(true_heading)
        
        baro_z = self.measure_barometer(true_z)
        
        flow_x, flow_y, flow_valid = self.measure_optical_flow(true_vx, true_vy, true_z)
        
        measurements = {
            'gps': {
                'x': gps_x,
                'y': gps_y,
                'z': gps_z,
                'valid': gps_valid
            },
            'accelerometer': {
                'x': accel_x,
                'y': accel_y,
                'z': accel_z
            },
            'gyroscope': {
                'x': gyro_x,
                'y': gyro_y,
                'z': gyro_z
            },
            'magnetometer': {
                'heading': mag_heading
            },
            'barometer': {
                'altitude': baro_z
            },
            'optical_flow': {
                'vx': flow_x,
                'vy': flow_y,
                'valid': flow_valid
            }
        }
        
        return measurements

