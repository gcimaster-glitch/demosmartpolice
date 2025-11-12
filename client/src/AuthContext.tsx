import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import type { User as AuthenticatedUser } from './types.ts';

// NOTE: In a real application, this would be a backend service.
const mockUsers = {
  'admin@client.com': { password: 'password', name: '田中 太郎', company: '○○ホールディングス株式会社', role: 'CLIENTADMIN' as const, email: 'admin@client.com' },
  'user@client.com': { password: 'password', name: '佐藤 花子', company: '○○ホールディングス株式会社', role: 'CLIENT' as const, email: 'user@client.com' },
  'superadmin@smartpolice.jp': { password: 'password', name: '最高管理者', company: 'スマートポリス本部', role: 'SUPERADMIN' as const, email: 'superadmin@smartpolice.jp' },
  'admin@smartpolice.jp': { password: 'password', name: '管理者 鈴木', company: 'スマートポリス', role: 'ADMIN' as const, email: 'admin@smartpolice.jp' },
  'staff@smartpolice.jp': { password: 'password', name: '担当者 高橋', company: 'スマートポリス', role: 'STAFF' as const, email: 'staff@smartpolice.jp' },
};

const mockAffiliates = {
  'yamada@referral.com': { password: 'password', name: '山田 紹介', company: 'アフィリエイトパートナー', role: 'AFFILIATE' as const, email: 'yamada@referral.com' },
};


interface AuthContextType {
  user: AuthenticatedUser | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('smartpolice_user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Failed to parse user from localStorage", error);
      localStorage.removeItem('smartpolice_user');
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const logout = () => {
      setUser(null);
      localStorage.removeItem('smartpolice_user');
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    return new Promise(resolve => {
      setTimeout(() => {
        let foundUser: any = mockUsers[email as keyof typeof mockUsers];
        if (!foundUser) {
            foundUser = mockAffiliates[email as keyof typeof mockAffiliates];
        }

        if (foundUser && foundUser.password === password) {
          const authenticatedUser: AuthenticatedUser = {
            email,
            name: foundUser.name,
            company: foundUser.company,
            role: foundUser.role,
          };
          setUser(authenticatedUser);
          localStorage.setItem('smartpolice_user', JSON.stringify(authenticatedUser));
          resolve(true);
        } else {
          resolve(false);
        }
      }, 500);
    });
  };

  const isAuthenticated = !!user;

  return (
      <AuthContext.Provider value={{ user, isAuthenticated, login, logout, isLoading }}>
          {children}
      </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
