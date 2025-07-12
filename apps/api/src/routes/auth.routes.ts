// Authentication Routes
// User: Endawoke47
// Date: 2025-07-12 21:00:00 UTC

import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.middleware';
import { logger } from '../config/logger';

const router = Router();

// Demo user for testing
const DEMO_USER = {
  id: 'demo-user-id',
  email: 'endawoke47@counselflow.com',
  firstName: 'Yadel',
  lastName: 'Endawoke',
  role: 'ADMIN',
  status: 'ACTIVE',
  passwordHash: '$2b$10$demo.hash.for.testing.purposes.only',
};

// Helper function to generate JWT token
const generateToken = (user: any) => {
  const secret = process.env.JWT_SECRET || 'your-secret-key';
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    secret,
    { expiresIn: '24h' }
  );
};

// Login endpoint
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Demo authentication
    if (email === 'endawoke47@counselflow.com' && password === 'demo') {
      const token = generateToken(DEMO_USER);
      const refreshToken = jwt.sign(
        { id: DEMO_USER.id },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '7d' }
      );

      logger.info('Demo user login successful', { email });

      return res.json({
        success: true,
        user: {
          id: DEMO_USER.id,
          email: DEMO_USER.email,
          firstName: DEMO_USER.firstName,
          lastName: DEMO_USER.lastName,
          role: DEMO_USER.role,
          status: DEMO_USER.status,
        },
        token,
        refreshToken,
      });
    }

    // TODO: Implement actual user authentication with database
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password'
    });
  } catch (error) {
    next(error);
  }
});

// Register endpoint
router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // TODO: Implement user registration with database
    return res.status(501).json({
      success: false,
      message: 'Registration not implemented yet'
    });
  } catch (error) {
    next(error);
  }
});

// Get current user
router.get('/me', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    // For demo purposes, return the demo user
    if (req.user?.id === 'demo-user-id') {
      return res.json({
        success: true,
        user: {
          id: DEMO_USER.id,
          email: DEMO_USER.email,
          firstName: DEMO_USER.firstName,
          lastName: DEMO_USER.lastName,
          role: DEMO_USER.role,
          status: DEMO_USER.status,
        },
      });
    }

    // TODO: Fetch user from database
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  } catch (error) {
    next(error);
  }
});

// Refresh token
router.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required'
      });
    }

    const secret = process.env.JWT_SECRET || 'your-secret-key';
    const decoded = jwt.verify(refreshToken, secret) as any;

    // For demo purposes
    if (decoded.id === 'demo-user-id') {
      const newToken = generateToken(DEMO_USER);
      return res.json({
        success: true,
        token: newToken,
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid refresh token'
    });
  } catch (error) {
    next(error);
  }
});

// Logout endpoint
router.post('/logout', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    // TODO: Implement token blacklisting or session management
    logger.info('User logout', { userId: req.user?.id });
    
    return res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
});

// Forgot password
router.post('/forgot-password', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // TODO: Implement password reset email functionality
    logger.info('Password reset requested', { email });

    return res.json({
      success: true,
      message: 'Password reset email sent',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
