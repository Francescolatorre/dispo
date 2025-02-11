import express from 'express';
import rateLimit from 'express-rate-limit';
import { AuthService } from '../services/authService.js';
import { logger } from '../utils/logger.js';
import { AuthorizationError, ValidationError } from '../errors/index.js';
import { loginSchema, changePasswordSchema, validateSchema } from '../middleware/validation/auth.schema.js';

const router = express.Router();
const authService = new AuthService();

// Rate limiting middleware
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'test' ? 10 : 5,
  message: { error: 'Too many login attempts, please try again later' },
  statusCode: 429
});

// Token verification middleware
const verifyToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    throw new AuthorizationError('No token provided');
  }

  try {
    const isValid = await authService.validateToken(token);
    if (!isValid) {
      throw new AuthorizationError('Invalid token');
    }
    next();
  } catch (error) {
    if (error instanceof AuthorizationError) {
      throw error;
    }
    throw new AuthorizationError(
      error.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token'
    );
  }
};

// Login route
router.post(
  '/login',
  loginLimiter,
  validateSchema(loginSchema),
  async (req, res) => {
    const { email, password } = req.body;

    logger.info('Login attempt', {
      context: {
        email,
        ip: req.ip,
        userAgent: req.get('user-agent')
      }
    });

    try {
      const result = await authService.login(email, password);
      
      logger.info('Login successful', {
        context: {
          userId: result.user.id,
          email: result.user.email,
          role: result.user.role
        }
      });

      res.json(result);
    } catch (error) {
      if (error instanceof AuthorizationError) {
        logger.warn('Login failed', {
          error,
          context: {
            email,
            reason: 'invalid_credentials'
          }
        });
        res.status(401).json({ error: error.message });
      } else {
        logger.error('Login error', {
          error,
          context: {
            email
          }
        });
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }
);

// Logout route
router.post('/logout', verifyToken, (req, res) => {
  const userId = req.user.userId;
  
  logger.info('User logged out', {
    context: {
      userId,
      email: req.user.email
    }
  });

  res.json({ message: 'Logged out successfully' });
});

// Verify token route
router.get('/verify', verifyToken, async (req, res) => {
  const userId = req.user.userId;

  try {
    const user = await authService.findUserById(userId);
    res.json({ user });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      logger.warn('Token verification failed', {
        error,
        context: {
          userId,
          reason: 'invalid_token'
        }
      });
      res.status(401).json({ error: error.message });
    } else {
      logger.error('Token verification error', {
        error,
        context: {
          userId
        }
      });
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Change password route
router.post(
  '/change-password',
  verifyToken,
  validateSchema(changePasswordSchema),
  async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.userId;

    logger.info('Password change attempt', {
      context: {
        userId,
        email: req.user.email
      }
    });

    try {
      const result = await authService.changePassword(
        userId,
        currentPassword,
        newPassword
      );

      logger.info('Password changed successfully', {
        context: {
          userId,
          email: req.user.email
        }
      });

      res.json({
        message: 'Password updated successfully',
        updated_at: result.updated_at
      });
    } catch (error) {
      if (error instanceof ValidationError) {
        logger.warn('Password change failed', {
          error,
          context: {
            userId,
            reason: 'invalid_current_password'
          }
        });
        res.status(400).json({ error: error.message });
      } else if (error instanceof AuthorizationError) {
        logger.warn('Password change failed', {
          error,
          context: {
            userId,
            reason: 'unauthorized'
          }
        });
        res.status(401).json({ error: error.message });
      } else {
        logger.error('Password change error', {
          error,
          context: {
            userId
          }
        });
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }
);

export default router;