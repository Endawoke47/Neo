// Authentication Provider
// User: Endawoke47
// Date: 2025-07-11 20:46:45 UTC

'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthService, User } from '../services/api.service';

interface AuthUser extends User {
  name: string; // Computed from firstName + lastName
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (credentials: { email: string; password: string }, rememberMe?: boolean) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateUser: (user: AuthUser) => void;
  register: (userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role?: string;
    firm?: string;
    specialization?: string;
    barNumber?: string;
    phone?: string;
  }) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const transformUser = (apiUser: User): AuthUser => ({
    ...apiUser,
    name: `${apiUser.firstName} ${apiUser.lastName}`
  });

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('counselflow_token');
      if (token) {
        const response = await AuthService.getCurrentUser();
        if (response.success && response.data) {
          setUser(transformUser(response.data.user));
        } else {
          throw new Error('Failed to get user data');
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('counselflow_token');
      localStorage.removeItem('counselflow_refresh_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials: { email: string; password: string }, rememberMe?: boolean) => {
    try {
      setLoading(true);
      const response = await AuthService.login(credentials.email, credentials.password);
      
      if (response.success && response.data) {
        const { user: apiUser, tokens } = response.data;
        
        // Store tokens
        if (rememberMe) {
          localStorage.setItem('counselflow_token', tokens.accessToken);
          localStorage.setItem('counselflow_refresh_token', tokens.refreshToken);
        } else {
          sessionStorage.setItem('counselflow_token', tokens.accessToken);
          sessionStorage.setItem('counselflow_refresh_token', tokens.refreshToken);
        }
        
        setUser(transformUser(apiUser));
        return { success: true };
      } else {
        return { success: false, error: response.error || 'Login failed' };
      }
    } catch (error: any) {
      console.error('Login failed:', error);
      return { 
        success: false, 
        error: error?.response?.data?.error || error?.message || 'Login failed' 
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem('counselflow_refresh_token') || 
                          sessionStorage.getItem('counselflow_refresh_token');
      
      if (refreshToken) {
        await AuthService.logout(refreshToken);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear tokens regardless of API call success
      localStorage.removeItem('counselflow_token');
      localStorage.removeItem('counselflow_refresh_token');
      sessionStorage.removeItem('counselflow_token');
      sessionStorage.removeItem('counselflow_refresh_token');
      setUser(null);
      router.push('/login');
    }
  };

  const updateUser = (updatedUser: AuthUser) => {
    setUser(updatedUser);
  };

  const register = async (userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role?: string;
    firm?: string;
    specialization?: string;
    barNumber?: string;
    phone?: string;
  }) => {
    try {
      setLoading(true);
      const response = await AuthService.register(userData);
      
      if (response.success && response.data) {
        const { user: apiUser, tokens } = response.data;
        
        // Store tokens
        localStorage.setItem('counselflow_token', tokens.accessToken);
        localStorage.setItem('counselflow_refresh_token', tokens.refreshToken);
        
        setUser(transformUser(apiUser));
        return { success: true };
      } else {
        return { success: false, error: response.error || 'Registration failed' };
      }
    } catch (error: any) {
      console.error('Registration failed:', error);
      return { 
        success: false, 
        error: error?.response?.data?.error || error?.message || 'Registration failed' 
      };
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated: !!user, login, logout, updateUser, register }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
