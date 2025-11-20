import Teacher from '../models/Teacher.js';
import { generateToken, generateRefreshToken, verifyRefreshToken } from '../middleware/auth.js';

export const register = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Check if teacher already exists
    const existingTeacher = await Teacher.findByEmail(email);
    if (existingTeacher) {
      return res.status(400).json({
        error: 'Email already registered'
      });
    }

    // Create new teacher
    const teacher = await Teacher.create({ email, password, name });

    // Generate tokens
    const token = generateToken(teacher);
    const refreshToken = generateRefreshToken(teacher);

    res.status(201).json({
      message: 'Registration successful',
      token,
      refreshToken,
      user: {
        id: teacher.id,
        email: teacher.email,
        name: teacher.name
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: 'Registration failed',
      details: error.message
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find teacher
    const teacher = await Teacher.findByEmail(email);
    if (!teacher) {
      return res.status(401).json({
        error: 'Invalid email or password'
      });
    }

    // Verify password
    const isValidPassword = await Teacher.verifyPassword(password, teacher.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Invalid email or password'
      });
    }

    // Generate tokens
    const token = generateToken(teacher);
    const refreshToken = generateRefreshToken(teacher);

    res.json({
      message: 'Login successful',
      token,
      refreshToken,
      user: {
        id: teacher.id,
        email: teacher.email,
        name: teacher.name
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Login failed',
      details: error.message
    });
  }
};

export const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        error: 'Refresh token required'
      });
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);

    // Get teacher
    const teacher = await Teacher.findById(decoded.teacherId);
    if (!teacher) {
      return res.status(401).json({
        error: 'Invalid refresh token'
      });
    }

    // Generate new access token
    const newToken = generateToken(teacher);

    res.json({
      token: newToken
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({
      error: 'Invalid or expired refresh token'
    });
  }
};

export const getProfile = async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.teacher.id);

    if (!teacher) {
      return res.status(404).json({
        error: 'Teacher not found'
      });
    }

    res.json({
      user: {
        id: teacher.id,
        email: teacher.email,
        name: teacher.name,
        created_at: teacher.created_at
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      error: 'Failed to get profile'
    });
  }
};
