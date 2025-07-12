// Authentication Provider
// User: Endawoke47
// Date: 2025-07-11 20:46:45 UTC

'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (credentials: { email: string; password: string }, rememberMe?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('counselflow_token');
      if (token) {
        // Mock user data for demo
        const userData: User = {
          id: '1',
          email: 'demo@counselflow.com',
          name: 'Demo User',
          role: 'admin',
          avatar: undefined
        };
        setUser(userData);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('counselflow_token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials: { email: string; password: string }, rememberMe?: boolean) => {
    // Mock login for demo
    const user: User = {
      id: '1',
      email: credentials.email,
      name: 'Demo User',
      role: 'admin'
    };
    
    const token = 'mock-jwt-token';
    
    if (rememberMe) {
      localStorage.setItem('counselflow_token', token);
    } else {
      sessionStorage.setItem('counselflow_token', token);
    }
    
    setUser(user);
  };

  const logout = async () => {
    localStorage.removeItem('counselflow_token');
    sessionStorage.removeItem('counselflow_token');
    setUser(null);
    router.push('/login');
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated: !!user, login, logout, updateUser }}>
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
