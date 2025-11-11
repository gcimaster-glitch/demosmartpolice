import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import type { User as AuthenticatedUser } from './types.ts';
import { authAPI, handleAPIError } from './services/apiClient';

interface AuthContextType {
  user: AuthenticatedUser | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Check if user is already logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          // Verify token and get user info
          const response = await authAPI.getMe();
          if (response.success && response.data.user) {
            const userData = response.data.user;
            const authenticatedUser: AuthenticatedUser = {
              email: userData.email,
              name: userData.name,
              company: '', // Will be loaded from client data if needed
              role: userData.role,
            };
            setUser(authenticatedUser);
          } else {
            // Invalid token, clear it
            localStorage.removeItem('token');
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('token');
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, []);
  
  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      localStorage.removeItem('token');
      localStorage.removeItem('smartpolice_user');
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    setError(null);
    setIsLoading(true);
    
    try {
      const response = await authAPI.login(email, password);
      
      if (response.success && response.data) {
        const userData = response.data.user;
        const token = response.data.token;
        
        // Store token
        localStorage.setItem('token', token);
        
        // Set user data
        const authenticatedUser: AuthenticatedUser = {
          email: userData.email,
          name: userData.name,
          company: '', // Will be loaded from client data if needed
          role: userData.role as any, // Type assertion for UserRole
        };
        
        setUser(authenticatedUser);
        localStorage.setItem('smartpolice_user', JSON.stringify(authenticatedUser));
        
        return true;
      } else {
        setError('ログインに失敗しました');
        return false;
      }
    } catch (error: any) {
      const errorMessage = handleAPIError(error);
      setError(errorMessage);
      console.error('Login error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout, isLoading, error }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
