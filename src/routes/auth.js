import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../config/database.js';
import rateLimit from 'express-rate-limit';
import { AuthService } from '../services/authService.js';

const router = express.Router();
const authService = new AuthService();

// Rate limiting middleware - only enable in production
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'test' ? 10 : 5, // Lower limit for tests
  message: { message: 'Too many requests' },
  statusCode: 429
});

// Input validation middleware
const validateLoginInput = (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: 'Invalid email format' });
  }

  // Validate password length
  if (password.length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters' });
  }

  next();
};

// Token verification middleware
const verifyToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      res.status(401).json({ message: 'Token expired' });
    } else {
      res.status(401).json({ message: 'Invalid token' });
    }
  }
};

// Login route
router.post('/login', loginLimiter, validateLoginInput, async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await authService.login(email, password);
    res.status(200).json(result);
  } catch (error) {
    if (error.message === 'Invalid credentials') {
      res.status(401).json({ message: error.message });
    } else {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
});

// Logout route
router.post('/logout', (req, res) => {
  // Since we're using JWT, we don't need to do anything server-side
  // The client will handle removing the token
  res.json({ message: 'Logged out successfully' });
});

// Verify token route
router.get('/verify', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, name, role FROM users WHERE id = $1',
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    const user = result.rows[0];
    res.json({ user });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Change password route
router.post('/change-password', verifyToken, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Current and new passwords are required' });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters' });
  }

  try {
    const result = await authService.changePassword(req.user.userId, currentPassword, newPassword);
    res.json({ 
      message: 'Password updated successfully',
      updated_at: result.updated_at
    });
  } catch (error) {
    if (error.message === 'User not found') {
      res.status(401).json({ message: error.message });
    } else if (error.message === 'Invalid current password') {
      res.status(401).json({ message: error.message });
    } else {
      console.error('Change password error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
});

export default router;