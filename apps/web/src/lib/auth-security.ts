/**
 * Secure Authentication Utilities
 * Provides password hashing, JWT token generation, and validation
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { env } from './environment';

// Validation schemas using Zod
export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

export const RegisterSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(env.PASSWORD_MIN_LENGTH, `Password must be at least ${env.PASSWORD_MIN_LENGTH} characters`)
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  firstName: z.string().min(1, 'First name is required').max(50, 'First name too long'),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name too long'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const PasswordResetSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const PasswordUpdateSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z.string()
    .min(env.PASSWORD_MIN_LENGTH, `Password must be at least ${env.PASSWORD_MIN_LENGTH} characters`)
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Types
export type LoginCredentials = z.infer<typeof LoginSchema>;
export type RegisterData = z.infer<typeof RegisterSchema>;
export type PasswordResetData = z.infer<typeof PasswordResetSchema>;
export type PasswordUpdateData = z.infer<typeof PasswordUpdateSchema>;

export interface TokenPayload {
  id: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/**
 * Hash password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    const salt = await bcrypt.genSalt(env.BCRYPT_SALT_ROUNDS);
    return await bcrypt.hash(password, salt);
  } catch (error) {
    throw new Error('Failed to hash password');
  }
}

/**
 * Compare password with hash
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    throw new Error('Failed to compare password');
  }
}

/**
 * Generate JWT access token
 */
export function generateAccessToken(payload: Omit<TokenPayload, 'iat' | 'exp'>): string {
  try {
    return jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN,
      issuer: env.APP_NAME,
      audience: env.APP_URL,
    } as jwt.SignOptions);
  } catch (error) {
    throw new Error('Failed to generate access token');
  }
}

/**
 * Generate JWT refresh token
 */
export function generateRefreshToken(userId: string): string {
  try {
    return jwt.sign({ id: userId }, env.JWT_REFRESH_SECRET, {
      expiresIn: env.JWT_REFRESH_EXPIRES_IN,
      issuer: env.APP_NAME,
      audience: env.APP_URL,
    } as jwt.SignOptions);
  } catch (error) {
    throw new Error('Failed to generate refresh token');
  }
}

/**
 * Generate both access and refresh tokens
 */
export function generateTokens(user: { id: string; email: string; role: string }): AuthTokens {
  const accessToken = generateAccessToken({
    id: user.id,
    email: user.email,
    role: user.role,
  });
  
  const refreshToken = generateRefreshToken(user.id);
  
  // Calculate expiration time (in seconds)
  const expiresIn = getTokenExpirationTime(env.JWT_EXPIRES_IN);
  
  return {
    accessToken,
    refreshToken,
    expiresIn,
  };
}

/**
 * Verify JWT access token
 */
export function verifyAccessToken(token: string): TokenPayload {
  try {
    return jwt.verify(token, env.JWT_SECRET, {
      issuer: env.APP_NAME,
      audience: env.APP_URL,
    }) as TokenPayload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Access token expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid access token');
    }
    throw new Error('Token verification failed');
  }
}

/**
 * Verify JWT refresh token
 */
export function verifyRefreshToken(token: string): { id: string } {
  try {
    return jwt.verify(token, env.JWT_REFRESH_SECRET, {
      issuer: env.APP_NAME,
      audience: env.APP_URL,
    }) as { id: string };
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Refresh token expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid refresh token');
    }
    throw new Error('Refresh token verification failed');
  }
}

/**
 * Extract token from Authorization header
 */
export function extractTokenFromHeader(authHeader?: string): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

/**
 * Generate secure random password reset token
 */
export function generatePasswordResetToken(email: string): string {
  try {
    return jwt.sign({ email, type: 'password_reset' }, env.JWT_SECRET, {
      expiresIn: '1h', // Password reset tokens expire in 1 hour
      issuer: env.APP_NAME,
      audience: env.APP_URL,
    } as jwt.SignOptions);
  } catch (error) {
    throw new Error('Failed to generate password reset token');
  }
}

/**
 * Verify password reset token
 */
export function verifyPasswordResetToken(token: string): { email: string; type: string } {
  try {
    const payload = jwt.verify(token, env.JWT_SECRET, {
      issuer: env.APP_NAME,
      audience: env.APP_URL,
    }) as { email: string; type: string };
    
    if (payload.type !== 'password_reset') {
      throw new Error('Invalid token type');
    }
    
    return payload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Password reset token expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid password reset token');
    }
    throw new Error('Password reset token verification failed');
  }
}

/**
 * Convert JWT expiration string to seconds
 */
function getTokenExpirationTime(expiresIn: string): number {
  // Simple parser for common JWT expiration formats
  const match = expiresIn.match(/^(\d+)([smhd])$/);
  if (!match) {
    throw new Error('Invalid expiration format');
  }
  
  const value = parseInt(match[1], 10);
  const unit = match[2];
  
  switch (unit) {
    case 's': return value;
    case 'm': return value * 60;
    case 'h': return value * 60 * 60;
    case 'd': return value * 60 * 60 * 24;
    default: throw new Error('Invalid expiration unit');
  }
}

/**
 * Rate limiting helper for login attempts
 */
export class LoginAttemptTracker {
  private attempts: Map<string, { count: number; lastAttempt: Date; lockedUntil?: Date }> = new Map();
  
  canAttemptLogin(identifier: string): boolean {
    const record = this.attempts.get(identifier);
    if (!record) {
      return true;
    }
    
    // Check if account is locked
    if (record.lockedUntil && record.lockedUntil > new Date()) {
      return false;
    }
    
    // Reset if lockout period has passed
    if (record.lockedUntil && record.lockedUntil <= new Date()) {
      this.attempts.delete(identifier);
      return true;
    }
    
    return record.count < env.MAX_LOGIN_ATTEMPTS;
  }
  
  recordFailedAttempt(identifier: string): void {
    const record = this.attempts.get(identifier) || { count: 0, lastAttempt: new Date() };
    record.count++;
    record.lastAttempt = new Date();
    
    // Lock account if max attempts reached
    if (record.count >= env.MAX_LOGIN_ATTEMPTS) {
      record.lockedUntil = new Date(Date.now() + env.LOCKOUT_TIME * 60 * 1000);
    }
    
    this.attempts.set(identifier, record);
  }
  
  recordSuccessfulLogin(identifier: string): void {
    this.attempts.delete(identifier);
  }
  
  getRemainingLockoutTime(identifier: string): number {
    const record = this.attempts.get(identifier);
    if (!record?.lockedUntil) {
      return 0;
    }
    
    const remaining = record.lockedUntil.getTime() - Date.now();
    return Math.max(0, Math.floor(remaining / 1000));
  }
}

// Export singleton instance
export const loginAttemptTracker = new LoginAttemptTracker();
