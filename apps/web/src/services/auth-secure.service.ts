/**
 * Secure Authentication Service
 * Handles authentication with proper security measures
 */

import { apiClient } from '../lib/api-client';
import { 
  LoginCredentials, 
  RegisterData, 
  PasswordResetData,
  LoginSchema,
  RegisterSchema,
  PasswordResetSchema,
} from '../lib/auth-security';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  status: string;
  name?: string;
  position?: string;
  department?: string;
  phone?: string;
  bio?: string;
  avatar?: string;
  barNumber?: string;
  jurisdictions?: string[];
  specializations?: string[];
  isActive?: boolean;
  emailVerified?: boolean;
  twoFactorEnabled?: boolean;
  lastLogin?: Date;
  createdAt?: Date;
}

export interface AuthResponse {
  success: boolean;
  user: User;
  token: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthError {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}

class AuthService {
  private readonly storageKey = 'counselflow_token';
  private readonly refreshStorageKey = 'counselflow_refresh_token';

  /**
   * Login user with credentials
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      // Validate input
      const validatedCredentials = LoginSchema.parse(credentials);

      const response = await apiClient.post<AuthResponse>('/auth/login', validatedCredentials);
      
      if (response.data.success) {
        // Store tokens securely
        this.storeTokens(
          response.data.token, 
          response.data.refreshToken, 
          credentials.rememberMe || false
        );
      }
      
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        throw error.response.data;
      }
      throw {
        success: false,
        message: error.message || 'Login failed',
      } as AuthError;
    }
  }

  /**
   * Register new user
   */
  async register(userData: RegisterData): Promise<AuthResponse> {
    try {
      // Validate input
      const validatedData = RegisterSchema.parse(userData);

      const response = await apiClient.post<AuthResponse>('/auth/register', validatedData);
      
      if (response.data.success) {
        // Store tokens securely
        this.storeTokens(response.data.token, response.data.refreshToken, false);
      }
      
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        throw error.response.data;
      }
      throw {
        success: false,
        message: error.message || 'Registration failed',
      } as AuthError;
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      // Call logout endpoint to invalidate token server-side
      await apiClient.post('/auth/logout');
    } catch (error) {
      // Continue with local logout even if server request fails
      console.warn('Server logout failed:', error);
    } finally {
      // Always clear local storage
      this.clearTokens();
    }
  }

  /**
   * Refresh authentication token
   */
  async refreshToken(refreshToken: string): Promise<string> {
    try {
      const response = await apiClient.post<{ token: string }>('/auth/refresh', {
        refreshToken,
      });
      return response.data.token;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Token refresh failed');
    }
  }

  /**
   * Request password reset
   */
  async forgotPassword(email: string): Promise<void> {
    try {
      // Validate input
      const validatedData = PasswordResetSchema.parse({ email });

      await apiClient.post('/auth/forgot-password', validatedData);
    } catch (error: any) {
      if (error.response?.data) {
        throw error.response.data;
      }
      throw {
        success: false,
        message: error.message || 'Password reset request failed',
      } as AuthError;
    }
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, password: string, confirmPassword: string): Promise<void> {
    try {
      await apiClient.post('/auth/reset-password', {
        token,
        password,
        confirmPassword,
      });
    } catch (error: any) {
      if (error.response?.data) {
        throw error.response.data;
      }
      throw {
        success: false,
        message: error.message || 'Password reset failed',
      } as AuthError;
    }
  }

  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<User> {
    try {
      const response = await apiClient.get<{ success: boolean; user: User }>('/auth/me');
      return response.data.user;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to get user profile');
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const token = this.getStoredToken();
    return !!token;
  }

  /**
   * Get stored authentication token
   */
  getStoredToken(): string | null {
    if (typeof window === 'undefined') return null;
    
    return localStorage.getItem(this.storageKey) || 
           sessionStorage.getItem(this.storageKey);
  }

  /**
   * Get stored refresh token
   */
  getStoredRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    
    return localStorage.getItem(this.refreshStorageKey) ||
           sessionStorage.getItem(this.refreshStorageKey);
  }

  /**
   * Store authentication tokens
   */
  private storeTokens(token: string, refreshToken: string, rememberMe: boolean): void {
    if (typeof window === 'undefined') return;

    if (rememberMe) {
      // Persistent storage
      localStorage.setItem(this.storageKey, token);
      localStorage.setItem(this.refreshStorageKey, refreshToken);
    } else {
      // Session storage
      sessionStorage.setItem(this.storageKey, token);
      sessionStorage.setItem(this.refreshStorageKey, refreshToken);
    }
  }

  /**
   * Clear stored tokens
   */
  private clearTokens(): void {
    if (typeof window === 'undefined') return;

    localStorage.removeItem(this.storageKey);
    localStorage.removeItem(this.refreshStorageKey);
    sessionStorage.removeItem(this.storageKey);
    sessionStorage.removeItem(this.refreshStorageKey);
  }
}

export const authService = new AuthService();
