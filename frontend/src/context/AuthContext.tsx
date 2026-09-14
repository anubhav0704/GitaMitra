"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { API_BASE, getAuthHeaders, getAuthToken, removeAuthToken, setAuthToken } from '../lib/api';

export interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
  is_active?: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (user: User, token?: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function getSavedUser(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const saved = localStorage.getItem("gitamitra_user");
    if (saved) return JSON.parse(saved);
  } catch { /* ignore */ }
  return null;
}

function saveUser(user: User | null) {
  if (typeof window === "undefined") return;
  if (user) {
    localStorage.setItem("gitamitra_user", JSON.stringify(user));
  } else {
    localStorage.removeItem("gitamitra_user");
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // Instantly restore user from localStorage (no loading spinner if cached)
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getAuthToken();
    const cachedUser = getSavedUser();
    
    // If no token stored, user is definitely not logged in
    if (!token) {
      setUser(null);
      saveUser(null);
      setLoading(false);
      return;
    }

    // Instantly restore cached user so UI doesn't flash
    if (cachedUser) {
      setUser(cachedUser);
      setLoading(false);
    }

    // Validate token in the background with /auth/me
    fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    })
      .then(res => {
        if (res.ok) {
          return res.json();
        }
        // Only clear token on explicit auth rejection (401/403)
        if (res.status === 401 || res.status === 403) {
          removeAuthToken();
          saveUser(null);
          setUser(null);
        }
        // For 502/503/network errors, keep the cached user — backend is sleeping
        throw new Error(`Auth check: ${res.status}`);
      })
      .then(data => {
        setUser(data);
        saveUser(data);
      })
      .catch((err) => {
        // Don't remove token/user on network errors (backend cold start)
        console.warn('[GitaMitra] Auth check failed (backend may be waking up):', err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const login = (user: User, token?: string) => {
    if (token) {
      setAuthToken(token);
    }
    setUser(user);
    saveUser(user);
  };

  const logout = () => {
    setUser(null);
    saveUser(null);
    removeAuthToken();
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
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
