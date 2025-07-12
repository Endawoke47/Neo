// Secure Authentication Routes
// User: Endawoke47
// Date: 2025-07-12 21:00:00 UTC

import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.middleware';
import { logger } from '../config/logger';

const router = Router();

// Environment configuration
const JWT_SECRET = process.env.JWT_SECRET || (() => {
  throw new Error('JWT_SECRET environment variable is required');
})();

const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || (() => {
  throw new Error('JWT_REFRESH_SECRET environment variable is required');
})();

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
const BCRYPT_SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12');

// Validation schemas
const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

const RegisterSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  firstName: z.string().min(1, 'First name is required').max(50, 'First name too long'),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name too long'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Rate limiting map for login attempts
const loginAttempts = new Map<string, { count: number; lastAttempt: Date; lockedUntil?: Date }>();
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutes

// Helper functions
const generateTokens = (user: any) => {
  const accessToken = jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    { 
      expiresIn: JWT_EXPIRES_IN,
      issuer: 'CounselFlow',
      audience: process.env.APP_URL || 'http://localhost:3000'
    } as jwt.SignOptions
  );

  const refreshToken = jwt.sign(
    { id: user.id },
    JWT_REFRESH_SECRET,
    { 
      expiresIn: JWT_REFRESH_EXPIRES_IN,
      issuer: 'CounselFlow',
      audience: process.env.APP_URL || 'http://localhost:3000'
    } as jwt.SignOptions
  );

  return { accessToken, refreshToken };
};

const checkRateLimit = (identifier: string): boolean => {
  const record = loginAttempts.get(identifier);
  if (!record) return true;

  // Check if account is locked
  if (record.lockedUntil && record.lockedUntil > new Date()) {
    return false;
  }

  // Reset if lockout period has passed
  if (record.lockedUntil && record.lockedUntil <= new Date()) {
    loginAttempts.delete(identifier);
    return true;
  }

  return record.count < MAX_LOGIN_ATTEMPTS;
};

const recordFailedAttempt = (identifier: string): void => {
  const record = loginAttempts.get(identifier) || { count: 0, lastAttempt: new Date() };
  record.count++;
  record.lastAttempt = new Date();

  if (record.count >= MAX_LOGIN_ATTEMPTS) {
    record.lockedUntil = new Date(Date.now() + LOCKOUT_TIME);
  }

  loginAttempts.set(identifier, record);
};

const recordSuccessfulLogin = (identifier: string): void => {
  loginAttempts.delete(identifier);
};

// Hash password
const hashPassword = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
};

// Compare password
const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return await bcrypt.compare(password, hash);
};

// Demo user for development (remove in production)
const isDevelopment = process.env.NODE_ENV !== 'production';
const DEMO_USER = isDevelopment ? {
  id: 'demo-user-id',
  email: 'demo@counselflow.com',
  firstName: 'Demo',
  lastName: 'User',
  role: 'ADMIN',
  status: 'ACTIVE',
  passwordHash: '$2b$12$demo.hash.for.development.only', // This would be a real hash in development
} : null;

// Login endpoint
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = LoginSchema.parse(req.body);
    const { email, password, rememberMe } = validatedData;

    // Check rate limiting
    if (!checkRateLimit(email)) {
      return res.status(429).json({
        success: false,
        message: 'Too many login attempts. Account temporarily locked.',
      });
    }

    // Development-only demo authentication
    if (isDevelopment && DEMO_USER && email === DEMO_USER.email && password === 'demo') {
      const tokens = generateTokens(DEMO_USER);
      recordSuccessfulLogin(email);

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
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: 24 * 60 * 60, // 24 hours in seconds
      });
    }

    // TODO: Implement database user lookup and password verification
    // const user = await getUserByEmail(email);
    // if (!user || !await comparePassword(password, user.passwordHash)) {
    //   recordFailedAttempt(email);
    //   return res.status(401).json({
    //     success: false,
    //     message: 'Invalid email or password'
    //   });
    // }

    recordFailedAttempt(email);
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password'
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.flatten().fieldErrors,
      });
    }
    next(error);
  }
});

// Register endpoint
router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = RegisterSchema.parse(req.body);
    const { email, password, firstName, lastName } = validatedData;

    // Check if registration is enabled
    if (!process.env.ENABLE_REGISTRATION || process.env.ENABLE_REGISTRATION === 'false') {
      return res.status(403).json({
        success: false,
        message: 'Registration is currently disabled'
      });
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // TODO: Implement user creation in database
    // const user = await createUser({
    //   email,
    //   passwordHash,
    //   firstName,
    //   lastName,
    // });

    return res.status(501).json({
      success: false,
      message: 'Registration not implemented yet'
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.flatten().fieldErrors,
      });
    }
    next(error);
  }
});

// Get current user
router.get('/me', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    // For demo purposes, return the demo user
    if (isDevelopment && DEMO_USER && req.user?.id === 'demo-user-id') {
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
    // const user = await getUserById(req.user?.id);
    // if (!user) {
    //   return res.status(404).json({
    //     success: false,
    //     message: 'User not found'
    //   });
    // }

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

    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET, {
      issuer: 'CounselFlow',
      audience: process.env.APP_URL || 'http://localhost:3000'
    }) as any;

    // For demo purposes
    if (isDevelopment && DEMO_USER && decoded.id === 'demo-user-id') {
      const tokens = generateTokens(DEMO_USER);
      return res.json({
        success: true,
        token: tokens.accessToken,
        expiresIn: 24 * 60 * 60, // 24 hours in seconds
      });
    }

    // TODO: Verify user exists in database
    // const user = await getUserById(decoded.id);
    // if (!user) {
    //   return res.status(401).json({
    //     success: false,
    //     message: 'Invalid refresh token'
    //   });
    // }

    return res.status(401).json({
      success: false,
      message: 'Invalid refresh token'
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid refresh token'
    });
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
      message: 'If an account with that email exists, a password reset link has been sent.',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
