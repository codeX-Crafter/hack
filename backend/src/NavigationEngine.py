
import math
from src.Matrix import Matrix


class NavigationEngine:
    
    def __init__(self):
        self.state = Matrix(4, 1)  # Column vector
        self.state.set(0, 0, 0.0)  # x position
        self.state.set(1, 0, 0.0)  # y position
        self.state.set(2, 0, 0.0)  # x velocity
        self.state.set(3, 0, 0.0)  # y velocity
        
        self.P = Matrix(4, 4)
        self.P.set(0, 0, 100.0)   # x uncertainty
        self.P.set(1, 1, 100.0)   # y uncertainty
        self.P.set(2, 2, 10.0)    # vx uncertainty
        self.P.set(3, 3, 10.0)    # vy uncertainty
        
        self.dt = 0.1
        self.F = Matrix(4, 4)
        self._update_F_matrix()
        
        self.Q = Matrix(4, 4)
        q_noise = 0.1  # Process noise level
        self.Q.set(0, 0, q_noise * 0.01)
        self.Q.set(1, 1, q_noise * 0.01)
        self.Q.set(2, 2, q_noise * 0.1)
        self.Q.set(3, 3, q_noise * 0.1)
        
        self.gps_available = True
        self.last_gps_time = 0.0
        self.time_since_gps = 0.0
        
        self.dead_reckoning_drift = 0.0
        
    def _update_F_matrix(self):
        self.F = Matrix(4, 4)
        self.F.set(0, 0, 1.0)      # x_new = x_old
        self.F.set(0, 2, self.dt)  # + vx * dt
        self.F.set(1, 1, 1.0)      # y_new = y_old
        self.F.set(1, 3, self.dt)  # + vy * dt
        self.F.set(2, 2, 1.0)      # vx_new = vx_old (constant velocity)
        self.F.set(3, 3, 1.0)      # vy_new = vy_old
    
    def predict(self):
        self.state = Matrix.multiply(self.F, self.state)
        
        F_T = Matrix.transpose(self.F)
        temp = Matrix.multiply(self.F, self.P)
        P_pred = Matrix.multiply(temp, F_T)
        self.P = Matrix.add(P_pred, self.Q)
        
        self.time_since_gps += self.dt
    
    def update_gps(self, gps_x: float, gps_y: float, gps_z: float):
        z = Matrix(2, 1)
        z.set(0, 0, gps_x)
        z.set(1, 0, gps_y)
        
        H = Matrix(2, 4)
        H.set(0, 0, 1.0)
        H.set(1, 1, 1.0)
        
        R = Matrix(2, 2)
        gps_noise = 0.5  # 0.5 meter standard deviation
        R.set(0, 0, gps_noise ** 2)
        R.set(1, 1, gps_noise ** 2)
        
        H_T = Matrix.transpose(H)
        temp1 = Matrix.multiply(H, self.P)
        temp2 = Matrix.multiply(temp1, H_T)
        temp3 = Matrix.add(temp2, R)
        temp3_inv = temp3.invert()
        temp4 = Matrix.multiply(self.P, H_T)
        K = Matrix.multiply(temp4, temp3_inv)
        
        temp_hx = Matrix.multiply(H, self.state)
        y = Matrix.subtract(z, temp_hx)
        
        temp_ky = Matrix.multiply(K, y)
        self.state = Matrix.add(self.state, temp_ky)
        
        K_H = Matrix.multiply(K, H)
        I_minus_KH = Matrix(4, 4)
        for i in range(4):
            for j in range(4):
                if i == j:
                    I_minus_KH.set(i, j, 1.0 - K_H.get(i, j))
                else:
                    I_minus_KH.set(i, j, -K_H.get(i, j))
        self.P = Matrix.multiply(I_minus_KH, self.P)
        
        self.gps_available = True
        self.time_since_gps = 0.0
    
    def update_dead_reckoning(self, accel_x: float, accel_y: float):        
        vx_current = self.state.get(2, 0)
        vy_current = self.state.get(3, 0)
        
        vx_new = vx_current + accel_x * self.dt
        vy_new = vy_current + accel_y * self.dt
        
        dx = vx_current * self.dt + 0.5 * accel_x * (self.dt ** 2)
        dy = vy_current * self.dt + 0.5 * accel_y * (self.dt ** 2)
        
        x_current = self.state.get(0, 0)
        y_current = self.state.get(1, 0)
        
        self.state.set(0, 0, x_current + dx)
        self.state.set(1, 0, y_current + dy)
        self.state.set(2, 0, vx_new)
        self.state.set(3, 0, vy_new)
        
        for i in range(4):
            current_var = self.P.get(i, i)
            self.P.set(i, i, current_var * 1.01)  # 1% increase per step
    
    def update_optical_flow(self, flow_x: float, flow_y: float):
        z = Matrix(2, 1)
        z.set(0, 0, flow_x)
        z.set(1, 0, flow_y)
        

        H = Matrix(2, 4)
        H.set(0, 2, 1.0)
        H.set(1, 3, 1.0)
        
        R = Matrix(2, 2)
        flow_noise = 0.2  # 0.2 m/s standard deviation
        R.set(0, 0, flow_noise ** 2)
        R.set(1, 1, flow_noise ** 2)
        
        H_T = Matrix.transpose(H)
        temp1 = Matrix.multiply(H, self.P)
        temp2 = Matrix.multiply(temp1, H_T)
        temp3 = Matrix.add(temp2, R)
        try:
            temp3_inv = temp3.invert()
        except:
            return  # Skip update if inversion fails
        
        temp4 = Matrix.multiply(self.P, H_T)
        K = Matrix.multiply(temp4, temp3_inv)
        
        temp_hx = Matrix.multiply(H, self.state)
        y = Matrix.subtract(z, temp_hx)
        
        temp_ky = Matrix.multiply(K, y)
        self.state = Matrix.add(self.state, temp_ky)
        
        K_H = Matrix.multiply(K, H)
        I_minus_KH = Matrix(4, 4)
        for i in range(4):
            for j in range(4):
                if i == j:
                    I_minus_KH.set(i, j, 1.0 - K_H.get(i, j))
                else:
                    I_minus_KH.set(i, j, -K_H.get(i, j))
        self.P = Matrix.multiply(I_minus_KH, self.P)
    
    def get_state(self):
        return {
            'x': self.state.get(0, 0),
            'y': self.state.get(1, 0),
            'vx': self.state.get(2, 0),
            'vy': self.state.get(3, 0)
        }
    
    def get_confidence(self):
        trace = sum(self.P.get(i, i) for i in range(4))

        confidence = max(0.0, 1.0 - (trace / 100.0))
        
        return confidence
    
    def get_error(self):
        x_var = self.P.get(0, 0)
        y_var = self.P.get(1, 1)
        
        rmse = math.sqrt((x_var + y_var) / 2.0)
        
        return rmse
    
    def set_state(self, x: float, y: float, vx: float, vy: float):
        self.state.set(0, 0, x)
        self.state.set(1, 0, y)
        self.state.set(2, 0, vx)
        self.state.set(3, 0, vy)


import math

