'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  handle?: string;
  roles?: string[];
  role?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  handle: string;
  logout: () => void;
  setUserSession: (token: string, user: UserProfile) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  handle: '',
  logout: () => {},
  setUserSession: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('baseline_token');
      const storedUser = localStorage.getItem('baseline_user');

      if (storedToken && storedUser) {
        setToken(storedToken);
        const parsed = JSON.parse(storedUser);
        setUser(parsed);
      }
    } catch (e) {
      console.error('Error hydrating auth state:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const setUserSession = (newToken: string, newUser: UserProfile) => {
    localStorage.setItem('baseline_token', newToken);
    localStorage.setItem('baseline_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('baseline_token');
    localStorage.removeItem('baseline_user');
    setUser(null);
    setToken(null);
    router.push('/auth/login');
  };

  const userHandle = user?.handle || (user?.email ? `@${user.email.split('@')[0]}` : '@user');

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isLoading,
        handle: userHandle,
        logout,
        setUserSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
