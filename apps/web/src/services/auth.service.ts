// Authentication Service
// User: Endawoke47
// Date: 2025-07-11 20:46:45 UTC

import { apiClient } from '@/lib/api-client';
import { User } from '@/types';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
}

export interface LoginResponse {
  user: User;
  token: string;
  refreshToken: string;
}

export interface AuthError {
  message: string;
  code: string;
}

// Demo user for testing
const DEMO_USER: User = {
  id: 'demo-user-id',
  email: 'endawoke47@counselflow.com',
  name: 'Yadel Endawoke',
  position: 'Legal AI Expert & CounselFlow Architect',
  department: 'Technology',
  phone: '+254-700-123456',
  bio: 'Legal AI Expert & CounselFlow Architect',
  avatar: '/avatars/endawoke47.png',
  barNumber: 'LSK001234',
  jurisdictions: ['Kenya', 'East Africa'],
  specializations: ['Legal Technology', 'AI Law', 'Corporate Law'],
  role: 'ADMIN',
  isActive: true,
  emailVerified: true,
  twoFactorEnabled: false,
  lastLogin: new Date(),
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date(),
};

class AuthService {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const { email, password } = credentials;
    
    // For demo mode, handle special credentials
    if (email === 'endawoke47@counselflow.com' && password === 'demo') {
      return {
        user: DEMO_USER,
        token: 'demo-jwt-token-' + Date.now(),
        refreshToken: 'demo-refresh-token-' + Date.now(),
      };
    }

    try {
      const response = await apiClient.post<LoginResponse>('/auth/login', credentials);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  }

  async register(data: RegisterData): Promise<LoginResponse> {
    try {
      const response = await apiClient.post<LoginResponse>('/auth/register', data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
  }

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('counselflow_token');
      localStorage.removeItem('counselflow_refresh_token');
      sessionStorage.removeItem('counselflow_token');
    }
  }

  async getCurrentUser(): Promise<User> {
    try {
      const response = await apiClient.get<{ user: User }>('/auth/me');
      return response.data.user;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to get user');
    }
  }

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

  async forgotPassword(email: string): Promise<void> {
    try {
      await apiClient.post('/auth/forgot-password', { email });
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Password reset request failed');
    }
  }

  async resetPassword(token: string, password: string): Promise<void> {
    try {
      await apiClient.post('/auth/reset-password', { token, password });
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Password reset failed');
    }
  }

  async updateProfile(data: Partial<User>): Promise<User> {
    try {
      const response = await apiClient.patch<{ user: User }>('/auth/profile', data);
      return response.data.user;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Profile update failed');
    }
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      await apiClient.post('/auth/change-password', {
        currentPassword,
        newPassword,
      });
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Password change failed');
    }
  }

  async verifyEmail(token: string): Promise<void> {
    try {
      await apiClient.post('/auth/verify-email', { token });
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Email verification failed');
    }
  }

  async resendVerificationEmail(): Promise<void> {
    try {
      await apiClient.post('/auth/resend-verification');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to resend verification email');
    }
  }

  // MFA methods
  async enableMfa(): Promise<{ qrCode: string; secret: string }> {
    try {
      const response = await apiClient.post<{ qrCode: string; secret: string }>('/auth/mfa/enable');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to enable MFA');
    }
  }

  async verifyMfa(token: string): Promise<void> {
    try {
      await apiClient.post('/auth/mfa/verify', { token });
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'MFA verification failed');
    }
  }

  async disableMfa(token: string): Promise<void> {
    try {
      await apiClient.post('/auth/mfa/disable', { token });
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to disable MFA');
    }
  }
}

export const authService = new AuthService();