import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { User, UserRole, AuthResponse } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (authData: AuthResponse) => void;
  logout: () => void;
  updateUser: (updatedUser: Partial<User>) => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        // Verify token with backend
        api.get<User>('/auth/me')
          .then((res) => {
            setUser(res.data);
            localStorage.setItem('user', JSON.stringify(res.data));
          })
          .catch(() => {
            logout();
          })
          .finally(() => {
            setIsLoading(false);
          });
      } catch (e) {
        logout();
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = (authData: AuthResponse) => {
    localStorage.setItem('token', authData.access_token);
    localStorage.setItem('refresh_token', authData.refresh_token);
    const userData: User = {
      id: authData.user_id,
      email: authData.email,
      full_name: authData.full_name,
      role: authData.role,
      semester_id: authData.semester_id,
      is_active: true,
    };
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(authData.access_token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  const updateUser = (updatedUser: Partial<User>) => {
    if (user) {
      const merged = { ...user, ...updatedUser };
      setUser(merged);
      localStorage.setItem('user', JSON.stringify(merged));
    }
  };

  const refreshProfile = async () => {
    try {
      const res = await api.get<User>('/auth/me');
      setUser(res.data);
      localStorage.setItem('user', JSON.stringify(res.data));
    } catch (e) {
      console.error('Failed to refresh user profile', e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role: user?.role || null,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        logout,
        updateUser,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

