/**
 * Auth Service Tests
 * Tests for the authentication service
 */

import { authService } from '../auth.service';
import { apiClient } from '../../lib/api-client';

// Mock the API client
jest.mock('../../lib/api-client', () => ({
  apiClient: {
    post: jest.fn(),
    get: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('authService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockClear();
    mockLocalStorage.setItem.mockClear();
    mockLocalStorage.removeItem.mockClear();
    mockLocalStorage.clear.mockClear();
  });

  describe('login', () => {
    const loginData = {
      email: 'test@example.com',
      password: 'password123',
      rememberMe: false,
    };

    it('should login successfully', async () => {
      const mockResponse = {
        data: {
          user: {
            id: '1',
            email: 'test@example.com',
            firstName: 'John',
            lastName: 'Doe',
            role: 'USER',
          },
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
          expiresIn: 3600,
        },
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await authService.login(loginData);

      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/login', loginData);
      expect(result).toEqual(mockResponse.data);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('accessToken', 'access-token');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('refreshToken', 'refresh-token');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify(mockResponse.data.user));
    });

    it('should handle login failure', async () => {
      const mockError = {
        response: {
          status: 401,
          data: { message: 'Invalid credentials' },
        },
      };

      mockApiClient.post.mockRejectedValue(mockError);

      await expect(authService.login(loginData)).rejects.toThrow(mockError);
      expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network error');
      mockApiClient.post.mockRejectedValue(networkError);

      await expect(authService.login(loginData)).rejects.toThrow(networkError);
      expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
    });

    it('should handle remember me option', async () => {
      const mockResponse = {
        data: {
          user: { id: '1', email: 'test@example.com' },
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
          expiresIn: 3600,
        },
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      await authService.login({ ...loginData, rememberMe: true });

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('rememberMe', 'true');
    });
  });

  describe('register', () => {
    const registerData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      password: 'password123',
      confirmPassword: 'password123',
    };

    it('should register successfully', async () => {
      const mockResponse = {
        data: {
          user: {
            id: '1',
            email: 'john.doe@example.com',
            firstName: 'John',
            lastName: 'Doe',
            role: 'USER',
          },
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
          expiresIn: 3600,
        },
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await authService.register(registerData);

      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/register', registerData);
      expect(result).toEqual(mockResponse.data);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('accessToken', 'access-token');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('refreshToken', 'refresh-token');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify(mockResponse.data.user));
    });

    it('should handle registration failure', async () => {
      const mockError = {
        response: {
          status: 400,
          data: { message: 'Email already exists' },
        },
      };

      mockApiClient.post.mockRejectedValue(mockError);

      await expect(authService.register(registerData)).rejects.toThrow(mockError);
      expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
    });

    it('should handle validation errors', async () => {
      const validationError = {
        response: {
          status: 422,
          data: { 
            message: 'Validation failed',
            errors: ['Password too weak'] 
          },
        },
      };

      mockApiClient.post.mockRejectedValue(validationError);

      await expect(authService.register(registerData)).rejects.toThrow(validationError);
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      mockApiClient.post.mockResolvedValue({ data: { success: true } });

      await authService.logout();

      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/logout');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('accessToken');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('refreshToken');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('user');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('rememberMe');
    });

    it('should clear local storage even if API call fails', async () => {
      mockApiClient.post.mockRejectedValue(new Error('API error'));

      await authService.logout();

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('accessToken');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('refreshToken');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('user');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('rememberMe');
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      const mockResponse = {
        data: {
          accessToken: 'new-access-token',
          refreshToken: 'new-refresh-token',
          expiresIn: 3600,
        },
      };

      mockLocalStorage.getItem.mockReturnValue('old-refresh-token');
      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await authService.refreshToken();

      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/refresh', {
        refreshToken: 'old-refresh-token',
      });
      expect(result).toEqual(mockResponse.data);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('accessToken', 'new-access-token');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('refreshToken', 'new-refresh-token');
    });

    it('should handle missing refresh token', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      await expect(authService.refreshToken()).rejects.toThrow('No refresh token available');
    });

    it('should handle invalid refresh token', async () => {
      const mockError = {
        response: {
          status: 401,
          data: { message: 'Invalid refresh token' },
        },
      };

      mockLocalStorage.getItem.mockReturnValue('invalid-token');
      mockApiClient.post.mockRejectedValue(mockError);

      await expect(authService.refreshToken()).rejects.toThrow(mockError);
    });
  });

  describe('getCurrentUser', () => {
    it('should return current user from localStorage', () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'USER',
      };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockUser));

      const result = authService.getCurrentUser();

      expect(result).toEqual(mockUser);
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('user');
    });

    it('should return null if no user in localStorage', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const result = authService.getCurrentUser();

      expect(result).toBeNull();
    });

    it('should handle malformed user data', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid-json');

      const result = authService.getCurrentUser();

      expect(result).toBeNull();
    });
  });

  describe('getAccessToken', () => {
    it('should return access token from localStorage', () => {
      mockLocalStorage.getItem.mockReturnValue('access-token');

      const result = authService.getAccessToken();

      expect(result).toBe('access-token');
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('accessToken');
    });

    it('should return null if no access token', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const result = authService.getAccessToken();

      expect(result).toBeNull();
    });
  });

  describe('isAuthenticated', () => {
    it('should return true if access token exists', () => {
      mockLocalStorage.getItem.mockReturnValue('access-token');

      const result = authService.isAuthenticated();

      expect(result).toBe(true);
    });

    it('should return false if no access token', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const result = authService.isAuthenticated();

      expect(result).toBe(false);
    });
  });

  describe('forgotPassword', () => {
    it('should send forgot password request', async () => {
      const mockResponse = {
        data: { message: 'Password reset email sent' },
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await authService.forgotPassword('test@example.com');

      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/forgot-password', {
        email: 'test@example.com',
      });
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle forgot password errors', async () => {
      const mockError = {
        response: {
          status: 404,
          data: { message: 'User not found' },
        },
      };

      mockApiClient.post.mockRejectedValue(mockError);

      await expect(authService.forgotPassword('test@example.com')).rejects.toThrow(mockError);
    });
  });

  describe('resetPassword', () => {
    it('should reset password successfully', async () => {
      const mockResponse = {
        data: { message: 'Password reset successful' },
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await authService.resetPassword('reset-token', 'new-password');

      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/reset-password', {
        token: 'reset-token',
        password: 'new-password',
      });
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle invalid reset token', async () => {
      const mockError = {
        response: {
          status: 400,
          data: { message: 'Invalid or expired reset token' },
        },
      };

      mockApiClient.post.mockRejectedValue(mockError);

      await expect(authService.resetPassword('invalid-token', 'new-password')).rejects.toThrow(mockError);
    });
  });

  describe('updateProfile', () => {
    it('should update profile successfully', async () => {
      const updateData = {
        firstName: 'Jane',
        lastName: 'Smith',
      };

      const mockResponse = {
        data: {
          id: '1',
          email: 'test@example.com',
          firstName: 'Jane',
          lastName: 'Smith',
          role: 'USER',
        },
      };

      mockApiClient.put.mockResolvedValue(mockResponse);

      const result = await authService.updateProfile(updateData);

      expect(mockApiClient.put).toHaveBeenCalledWith('/auth/profile', updateData);
      expect(result).toEqual(mockResponse.data);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify(mockResponse.data));
    });

    it('should handle profile update errors', async () => {
      const mockError = {
        response: {
          status: 400,
          data: { message: 'Invalid profile data' },
        },
      };

      mockApiClient.put.mockRejectedValue(mockError);

      await expect(authService.updateProfile({})).rejects.toThrow(mockError);
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      const passwordData = {
        currentPassword: 'old-password',
        newPassword: 'new-password',
      };

      const mockResponse = {
        data: { message: 'Password changed successfully' },
      };

      mockApiClient.put.mockResolvedValue(mockResponse);

      const result = await authService.changePassword(passwordData);

      expect(mockApiClient.put).toHaveBeenCalledWith('/auth/change-password', passwordData);
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle incorrect current password', async () => {
      const mockError = {
        response: {
          status: 400,
          data: { message: 'Current password is incorrect' },
        },
      };

      mockApiClient.put.mockRejectedValue(mockError);

      await expect(authService.changePassword({
        currentPassword: 'wrong-password',
        newPassword: 'new-password',
      })).rejects.toThrow(mockError);
    });
  });
});