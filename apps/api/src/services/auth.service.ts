// Authentication Service
// Centralized authentication logic and user management

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

const prisma = new PrismaClient();

// Types and interfaces
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  firm?: string | null;
  specialization?: string | null;
  barNumber?: string | null;
  phone?: string | null;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: Date;
  lastLoginAt?: Date | null;
}

export interface CreateUserData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: 'ADMIN' | 'PARTNER' | 'ASSOCIATE' | 'PARALEGAL' | 'CLIENT';
  firm?: string;
  specialization?: string;
  barNumber?: string;
  phone?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResult {
  user: User;
  tokens: TokenPair;
}

// Validation schemas
export const createUserSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
           'Password must contain uppercase, lowercase, number, and special character'),
  role: z.enum(['ADMIN', 'PARTNER', 'ASSOCIATE', 'PARALEGAL', 'CLIENT']),
  firm: z.string().optional(),
  specialization: z.string().optional(),
  barNumber: z.string().optional(),
  phone: z.string().optional()
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required')
});

export class AuthService {
  private readonly jwtSecret: string;
  private readonly jwtRefreshSecret: string;
  private readonly jwtExpiresIn: string;
  private readonly refreshTokenExpiresIn: string;
  private readonly bcryptRounds: number;

  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
    this.jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '24h';
    this.refreshTokenExpiresIn = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';
    this.bcryptRounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
  }

  // User registration
  async register(userData: CreateUserData): Promise<AuthResult> {
    try {
      // Validate input data
      const validatedData = createUserSchema.parse(userData);

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: validatedData.email }
      });

      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      // Hash password
      const hashedPassword = await this.hashPassword(validatedData.password);

      // Create user
      const user = await prisma.user.create({
        data: {
          firstName: validatedData.firstName,
          lastName: validatedData.lastName,
          email: validatedData.email,
          password: hashedPassword,
          role: validatedData.role,
          firm: validatedData.firm,
          specialization: validatedData.specialization,
          barNumber: validatedData.barNumber,
          phone: validatedData.phone,
          isActive: true,
          emailVerified: false
        },
        select: this.userSelectFields()
      });

      // Generate tokens
      const tokens = this.generateTokens(user);

      // Store refresh token
      await this.storeRefreshToken(tokens.refreshToken, user.id);

      return { user, tokens };

    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  // User login
  async login(credentials: LoginCredentials): Promise<AuthResult> {
    try {
      // Validate input
      const validatedCredentials = loginSchema.parse(credentials);

      // Find user
      const user = await prisma.user.findUnique({
        where: { email: validatedCredentials.email },
        select: {
          ...this.userSelectFields(),
          password: true
        }
      });

      if (!user) {
        throw new Error('Invalid email or password');
      }

      if (!user.isActive) {
        throw new Error('Account is deactivated');
      }

      // Verify password
      const isPasswordValid = await this.verifyPassword(
        validatedCredentials.password, 
        user.password
      );

      if (!isPasswordValid) {
        throw new Error('Invalid email or password');
      }

      // Remove password from user object
      const { password: _, ...userWithoutPassword } = user;

      // Generate tokens
      const tokens = this.generateTokens(userWithoutPassword);

      // Store refresh token
      await this.storeRefreshToken(tokens.refreshToken, user.id);

      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() }
      });

      return { user: userWithoutPassword, tokens };

    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  // Token refresh
  async refreshTokens(refreshToken: string): Promise<TokenPair> {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, this.jwtRefreshSecret) as any;

      // Check if token exists in database and is valid
      const storedToken = await prisma.refreshToken.findFirst({
        where: {
          token: refreshToken,
          userId: decoded.id,
          expiresAt: { gt: new Date() }
        },
        include: {
          user: {
            select: this.userSelectFields()
          }
        }
      });

      if (!storedToken || !storedToken.user.isActive) {
        throw new Error('Invalid or expired refresh token');
      }

      // Generate new tokens
      const tokens = this.generateTokens(storedToken.user);

      // Delete old refresh token and store new one
      await prisma.refreshToken.delete({
        where: { id: storedToken.id }
      });

      await this.storeRefreshToken(tokens.refreshToken, storedToken.user.id);

      return tokens;

    } catch (error) {
      console.error('Token refresh error:', error);
      throw new Error('Token refresh failed');
    }
  }

  // User logout
  async logout(refreshToken: string, userId: string): Promise<void> {
    try {
      // Delete refresh token from database
      await prisma.refreshToken.deleteMany({
        where: {
          token: refreshToken,
          userId: userId
        }
      });
    } catch (error) {
      console.error('Logout error:', error);
      throw new Error('Logout failed');
    }
  }

  // Get user by ID
  async getUserById(userId: string): Promise<User | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: this.userSelectFields()
      });

      return user;
    } catch (error) {
      console.error('Get user error:', error);
      throw new Error('Failed to get user');
    }
  }

  // Update user profile
  async updateProfile(userId: string, updateData: Partial<User>): Promise<User> {
    try {
      const allowedFields = [
        'firstName', 'lastName', 'firm', 'specialization', 
        'barNumber', 'phone'
      ];

      const filteredData = Object.keys(updateData)
        .filter(key => allowedFields.includes(key))
        .reduce((obj, key) => {
          obj[key] = updateData[key as keyof User];
          return obj;
        }, {} as any);

      const user = await prisma.user.update({
        where: { id: userId },
        data: filteredData,
        select: this.userSelectFields()
      });

      return user;
    } catch (error) {
      console.error('Update profile error:', error);
      throw new Error('Failed to update profile');
    }
  }

  // Change password
  async changePassword(
    userId: string, 
    currentPassword: string, 
    newPassword: string
  ): Promise<void> {
    try {
      // Get user with password
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, password: true }
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Verify current password
      const isCurrentPasswordValid = await this.verifyPassword(
        currentPassword, 
        user.password
      );

      if (!isCurrentPasswordValid) {
        throw new Error('Current password is incorrect');
      }

      // Hash new password
      const hashedNewPassword = await this.hashPassword(newPassword);

      // Update password
      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedNewPassword }
      });

      // Invalidate all refresh tokens for this user
      await prisma.refreshToken.deleteMany({
        where: { userId: userId }
      });

    } catch (error) {
      console.error('Change password error:', error);
      throw error;
    }
  }

  // Password reset request
  async requestPasswordReset(email: string): Promise<string> {
    try {
      const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true, email: true }
      });

      if (!user) {
        // Don't reveal if email exists
        throw new Error('If an account with that email exists, a reset link has been sent');
      }

      // Generate reset token
      const resetToken = this.generateResetToken();

      // Store reset token
      await prisma.passwordReset.create({
        data: {
          token: resetToken,
          userId: user.id,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000) // 1 hour
        }
      });

      return resetToken;
    } catch (error) {
      console.error('Password reset request error:', error);
      throw error;
    }
  }

  // Reset password
  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      // Verify and find reset token
      const resetRecord = await prisma.passwordReset.findFirst({
        where: {
          token,
          expiresAt: { gt: new Date() }
        },
        include: {
          user: { select: { id: true } }
        }
      });

      if (!resetRecord) {
        throw new Error('Invalid or expired reset token');
      }

      // Hash new password
      const hashedPassword = await this.hashPassword(newPassword);

      // Update password
      await prisma.user.update({
        where: { id: resetRecord.user.id },
        data: { password: hashedPassword }
      });

      // Delete used reset token
      await prisma.passwordReset.delete({
        where: { id: resetRecord.id }
      });

      // Invalidate all refresh tokens
      await prisma.refreshToken.deleteMany({
        where: { userId: resetRecord.user.id }
      });

    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  }

  // Verify email
  async verifyEmail(userId: string): Promise<void> {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { emailVerified: true }
      });
    } catch (error) {
      console.error('Email verification error:', error);
      throw new Error('Failed to verify email');
    }
  }

  // Deactivate user account
  async deactivateUser(userId: string): Promise<void> {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { isActive: false }
      });

      // Invalidate all refresh tokens
      await prisma.refreshToken.deleteMany({
        where: { userId }
      });
    } catch (error) {
      console.error('Deactivate user error:', error);
      throw new Error('Failed to deactivate user');
    }
  }

  // Activate user account
  async activateUser(userId: string): Promise<void> {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { isActive: true }
      });
    } catch (error) {
      console.error('Activate user error:', error);
      throw new Error('Failed to activate user');
    }
  }

  // Utility methods
  private async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, this.bcryptRounds);
  }

  private async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
  }

  private generateTokens(user: any): TokenPair {
    const accessToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      this.jwtSecret,
      { expiresIn: this.jwtExpiresIn }
    );

    const refreshToken = jwt.sign(
      { id: user.id },
      this.jwtRefreshSecret,
      { expiresIn: this.refreshTokenExpiresIn }
    );

    return { accessToken, refreshToken };
  }

  private generateResetToken(): string {
    return jwt.sign(
      { type: 'password_reset', timestamp: Date.now() },
      this.jwtSecret,
      { expiresIn: '1h' }
    );
  }

  private async storeRefreshToken(refreshToken: string, userId: string): Promise<void> {
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: userId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      }
    });
  }

  private userSelectFields() {
    return {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      firm: true,
      specialization: true,
      barNumber: true,
      phone: true,
      isActive: true,
      emailVerified: true,
      createdAt: true,
      lastLoginAt: true
    };
  }

  // Verify JWT token
  verifyAccessToken(token: string): any {
    try {
      return jwt.verify(token, this.jwtSecret);
    } catch (error) {
      throw new Error('Invalid access token');
    }
  }

  // Get users with pagination and filtering
  async getUsers(options: {
    page?: number;
    limit?: number;
    role?: string;
    search?: string;
    isActive?: boolean;
  } = {}): Promise<{ users: User[]; total: number; page: number; totalPages: number }> {
    try {
      const {
        page = 1,
        limit = 10,
        role,
        search,
        isActive
      } = options;

      const skip = (page - 1) * limit;

      const where: any = {};

      if (role) {
        where.role = role;
      }

      if (isActive !== undefined) {
        where.isActive = isActive;
      }

      if (search) {
        where.OR = [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } }
        ];
      }

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          select: this.userSelectFields(),
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' }
        }),
        prisma.user.count({ where })
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        users,
        total,
        page,
        totalPages
      };
    } catch (error) {
      console.error('Get users error:', error);
      throw new Error('Failed to get users');
    }
  }
}