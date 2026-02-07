"""
Matrix utility class for Kalman filter operations
Handles all linear algebra operations needed for sensor fusion
"""

import math
from typing import List, Tuple


class Matrix:
    """Simple matrix class for Kalman filter calculations"""
    
    def __init__(self, rows: int, cols: int, initial_value: float = 0.0):
        """Initialize matrix with given dimensions"""
        self.rows = rows
        self.cols = cols
        self.data = [[initial_value for _ in range(cols)] for _ in range(rows)]
    
    def set(self, row: int, col: int, value: float):
        """Set value at position"""
        self.data[row][col] = value
    
    def get(self, row: int, col: int) -> float:
        """Get value at position"""
        return self.data[row][col]
    
    def copy(self) -> 'Matrix':
        """Return deep copy of matrix"""
        new_matrix = Matrix(self.rows, self.cols)
        for i in range(self.rows):
            for j in range(self.cols):
                new_matrix.set(i, j, self.data[i][j])
        return new_matrix
    
    @staticmethod
    def identity(size: int) -> 'Matrix':
        """Create identity matrix"""
        matrix = Matrix(size, size)
        for i in range(size):
            matrix.set(i, i, 1.0)
        return matrix
    
    @staticmethod
    def multiply(A: 'Matrix', B: 'Matrix') -> 'Matrix':
        """Multiply two matrices A * B"""
        if A.cols != B.rows:
            raise ValueError(f"Cannot multiply {A.rows}x{A.cols} by {B.rows}x{B.cols}")
        
        result = Matrix(A.rows, B.cols)
        for i in range(A.rows):
            for j in range(B.cols):
                sum_val = 0.0
                for k in range(A.cols):
                    sum_val += A.get(i, k) * B.get(k, j)
                result.set(i, j, sum_val)
        
        return result
    
    @staticmethod
    def add(A: 'Matrix', B: 'Matrix') -> 'Matrix':
        """Add two matrices A + B"""
        if A.rows != B.rows or A.cols != B.cols:
            raise ValueError("Matrices must have same dimensions for addition")
        
        result = Matrix(A.rows, A.cols)
        for i in range(A.rows):
            for j in range(A.cols):
                result.set(i, j, A.get(i, j) + B.get(i, j))
        
        return result
    
    @staticmethod
    def subtract(A: 'Matrix', B: 'Matrix') -> 'Matrix':
        """Subtract two matrices A - B"""
        if A.rows != B.rows or A.cols != B.cols:
            raise ValueError("Matrices must have same dimensions for subtraction")
        
        result = Matrix(A.rows, A.cols)
        for i in range(A.rows):
            for j in range(A.cols):
                result.set(i, j, A.get(i, j) - B.get(i, j))
        
        return result
    
    @staticmethod
    def transpose(A: 'Matrix') -> 'Matrix':
        """Return transpose of matrix"""
        result = Matrix(A.cols, A.rows)
        for i in range(A.rows):
            for j in range(A.cols):
                result.set(j, i, A.get(i, j))
        return result
    
    @staticmethod
    def invert_2x2(A: 'Matrix') -> 'Matrix':
        """Invert a 2x2 matrix"""
        if A.rows != 2 or A.cols != 2:
            raise ValueError("Can only invert 2x2 matrices with this method")
        
        a = A.get(0, 0)
        b = A.get(0, 1)
        c = A.get(1, 0)
        d = A.get(1, 1)
        
        det = a * d - b * c
        if abs(det) < 1e-10:
            raise ValueError("Matrix is singular (determinant is zero)")
        
        result = Matrix(2, 2)
        result.set(0, 0, d / det)
        result.set(0, 1, -b / det)
        result.set(1, 0, -c / det)
        result.set(1, 1, a / det)
        
        return result
    
    @staticmethod
    def invert_3x3(A: 'Matrix') -> 'Matrix':
        """Invert a 3x3 matrix"""
        if A.rows != 3 or A.cols != 3:
            raise ValueError("Can only invert 3x3 matrices with this method")
        
        # Get all elements
        a00 = A.get(0, 0)
        a01 = A.get(0, 1)
        a02 = A.get(0, 2)
        a10 = A.get(1, 0)
        a11 = A.get(1, 1)
        a12 = A.get(1, 2)
        a20 = A.get(2, 0)
        a21 = A.get(2, 1)
        a22 = A.get(2, 2)
        
        # Calculate determinant
        det = (a00 * (a11 * a22 - a12 * a21) -
               a01 * (a10 * a22 - a12 * a20) +
               a02 * (a10 * a21 - a11 * a20))
        
        if abs(det) < 1e-10:
            raise ValueError("Matrix is singular (determinant is zero)")
        
        # Create inverse matrix
        result = Matrix(3, 3)
        
        result.set(0, 0, (a11 * a22 - a12 * a21) / det)
        result.set(0, 1, -(a01 * a22 - a02 * a21) / det)
        result.set(0, 2, (a01 * a12 - a02 * a11) / det)
        
        result.set(1, 0, -(a10 * a22 - a12 * a20) / det)
        result.set(1, 1, (a00 * a22 - a02 * a20) / det)
        result.set(1, 2, -(a00 * a12 - a02 * a10) / det)
        
        result.set(2, 0, (a10 * a21 - a11 * a20) / det)
        result.set(2, 1, -(a00 * a21 - a01 * a20) / det)
        result.set(2, 2, (a00 * a11 - a01 * a10) / det)
        
        return result
    
    def invert(self) -> 'Matrix':
        """Invert this matrix"""
        if self.rows == 2 and self.cols == 2:
            return Matrix.invert_2x2(self)
        elif self.rows == 3 and self.cols == 3:
            return Matrix.invert_3x3(self)
        else:
            raise ValueError(f"Cannot invert {self.rows}x{self.cols} matrix")
    
    def print_matrix(self):
        """Print matrix in readable format"""
        for row in self.data:
            print(" ".join(f"{val:8.4f}" for val in row))
        print()
