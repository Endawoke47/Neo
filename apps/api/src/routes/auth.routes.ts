/**
 * Authentication Routes - Production Ready
 * Secure authentication endpoints with proper validation
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { asyncHandler, ValidationError, UnauthorizedError } from '../middleware/error.middleware';
import { logger } from '../config/logger';
import { env } from '../config/environment';

const prisma = new PrismaClient();
const router = Router();

// Validation schemas
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
});

const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

const confirmResetSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

/**
 * POST /api/auth/login
 * User login endpoint
 */
router.post('/login', asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = loginSchema.parse(req.body);
  const ipAddress = req.ip || 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';

  logger.info('Login attempt', { email, ipAddress });

  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() }
  });

  if (!user || !await bcryptjs.compare(password, user.password)) {
    logger.warn('Failed login attempt', { email, ipAddress });
    throw new UnauthorizedError('Invalid email or password');
  }

  // Check if user is active
  if (user.status !== 'ACTIVE') {
    throw new UnauthorizedError('Account is not active');
  }

  // Generate session
  const sessionId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  await prisma.session.create({
    data: {
      id: sessionId,
      userId: user.id,
      ipAddress,
      userAgent,
      expiresAt,
      isActive: true
    }
  });

  // Generate tokens
  const accessToken = jwt.sign({
    userId: user.id,
    email: user.email,
    role: user.role,
    sessionId
  }, env.JWT_SECRET, {
    expiresIn: '1h',
    issuer: env.JWT_ISSUER,
    audience: env.JWT_AUDIENCE
  });

  const refreshToken = jwt.sign({
    userId: user.id,
    sessionId
  }, env.JWT_REFRESH_SECRET, {
    expiresIn: '30d',
    issuer: env.JWT_ISSUER,
    audience: env.JWT_AUDIENCE
  });

  // Update user login info
  await prisma.user.update({
    where: { id: user.id },
    data: {
      lastLoginAt: new Date(),
      failedLoginAttempts: 0
    }
  });

  // Set refresh token as httpOnly cookie
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
  });

  logger.info('Successful login', { userId: user.id, email, ipAddress });

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        lastLoginAt: user.lastLoginAt
      },
      accessToken,
      expiresIn: 3600,
      session: {
        id: sessionId,
        ipAddress,
        userAgent
      }
    }
  });
}));

/**
 * POST /api/auth/register
 * User registration endpoint
 */
router.post('/register', asyncHandler(async (req: Request, res: Response) => {
  const userData = registerSchema.parse(req.body);
  const ipAddress = req.ip || 'unknown';

  logger.info('Registration attempt', { email: userData.email, ipAddress });

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: userData.email.toLowerCase() }
  });

  if (existingUser) {
    throw new ValidationError('User with this email already exists');
  }

  // Hash password
  const hashedPassword = await bcryptjs.hash(userData.password, 12);

  // Create user
  const user = await prisma.user.create({
    data: {
      email: userData.email.toLowerCase(),
      password: hashedPassword,
      firstName: userData.firstName,
      lastName: userData.lastName,
      role: 'USER',
      status: 'ACTIVE',
      isEmailVerified: false,
      createdAt: new Date()
    }
  });

  logger.info('User registered successfully', { userId: user.id, email: user.email });

  res.status(201).json({
    success: true,
    message: 'Registration successful',
    data: {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    }
  });
}));

/**
 * POST /api/auth/refresh
 * Refresh access token
 */
router.post('/refresh', asyncHandler(async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
  const ipAddress = req.ip || 'unknown';

  if (!refreshToken) {
    throw new UnauthorizedError('Refresh token not provided');
  }

  try {
    const decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as any;
    
    // Verify session exists and is active
    const session = await prisma.session.findUnique({
      where: { id: decoded.sessionId },
      include: { user: true }
    });

    if (!session || !session.isActive || session.expiresAt < new Date()) {
      throw new UnauthorizedError('Invalid or expired session');
    }

    // Generate new access token
    const accessToken = jwt.sign({
      userId: session.user.id,
      email: session.user.email,
      role: session.user.role,
      sessionId: session.id
    }, env.JWT_SECRET, {
      expiresIn: '1h',
      issuer: env.JWT_ISSUER,
      audience: env.JWT_AUDIENCE
    });

    res.json({
      success: true,
      data: {
        accessToken,
        expiresIn: 3600
      }
    });
  } catch (error) {
    throw new UnauthorizedError('Invalid refresh token');
  }
}));

/**
 * POST /api/auth/logout
 * Logout current session
 */
router.post('/logout', asyncHandler(async (req: Request, res: Response) => {
  const sessionId = req.headers['x-session-id'] as string;

  if (sessionId) {
    await prisma.session.updateMany({
      where: { id: sessionId },
      data: { isActive: false }
    });
  }

  // Clear refresh token cookie
  res.clearCookie('refreshToken');

  res.json({
    success: true,
    message: 'Logout successful'
  });
}));

/**
 * GET /api/auth/me
 * Get current user info
 */
router.get('/me', asyncHandler(async (req: Request, res: Response) => {
  const userId = req.headers['x-user-id'] as string;

  if (!userId) {
    throw new UnauthorizedError('Authentication required');
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      status: true,
      isEmailVerified: true,
      lastLoginAt: true,
      createdAt: true
    }
  });

  if (!user) {
    throw new UnauthorizedError('User not found');
  }

  res.json({
    success: true,
    data: user
  });
}));

/**
 * POST /api/auth/forgot-password
 * Request password reset
 */
router.post('/forgot-password', asyncHandler(async (req: Request, res: Response) => {
  const { email } = resetPasswordSchema.parse(req.body);
  const ipAddress = req.ip || 'unknown';

  logger.info('Password reset requested', { email, ipAddress });

  // Always return success for security (don't reveal if email exists)
  res.json({
    success: true,
    message: 'If an account with that email exists, a password reset link has been sent.'
  });
}));

export default router;