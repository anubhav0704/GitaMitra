"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { API_BASE, getAuthHeaders, removeAuthToken, setAuthToken } from '../lib/api';

export interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
  is_active?: boolean;
  avatar_url?: string | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (user: User, token?: string) => void;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
  updateProfilePicture: (avatarUrl: string | null) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window !== "undefined") {
      const savedUser = localStorage.getItem("gitamitra_user");
      if (savedUser) {
        try {
          return JSON.parse(savedUser);
        } catch {
          return null;
        }
      }
    }
    return null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Proactively warm up backend if it's sleeping on Render free tier
    fetch(`${API_BASE}/health`, { mode: "cors" }).catch(() => {});

    const token = typeof window !== "undefined" ? (localStorage.getItem("gitamitra_token") || localStorage.getItem("token")) : null;
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    // Verify token with backend, but don't log out if it's a transient server error
    fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    })
      .then(res => {
        if (res.ok) {
          return res.json().then(data => {
            setUser(data);
            if (typeof window !== "undefined") {
              localStorage.setItem("gitamitra_user", JSON.stringify(data));
            }
          });
        } else if (res.status === 401 || res.status === 403) {
          // Token is invalid/expired -> log out
          setUser(null);
          removeAuthToken();
          if (typeof window !== "undefined") {
            localStorage.removeItem("gitamitra_user");
          }
        }
        // If 500, 502, 503, network error, etc., KEEP local user state!
      })
      .catch((err) => {
        console.warn("[AuthContext] Unable to reach /auth/me, keeping local session:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const login = (userData: User, token?: string) => {
    if (token) {
      setAuthToken(token);
    }
    setUser(userData);
    if (typeof window !== "undefined") {
      localStorage.setItem("gitamitra_user", JSON.stringify(userData));
    }
  };

  const logout = () => {
    setUser(null);
    removeAuthToken();
    if (typeof window !== "undefined") {
      localStorage.removeItem("gitamitra_user");
    }
  };

  const updateUser = (data: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...data };
      if (typeof window !== "undefined") {
        localStorage.setItem("gitamitra_user", JSON.stringify(updated));
      }
      return updated;
    });
  };

  const updateProfilePicture = async (avatarUrl: string | null) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, avatar_url: avatarUrl };
      if (typeof window !== "undefined") {
        localStorage.setItem("gitamitra_user", JSON.stringify(updated));
      }
      return updated;
    });

    try {
      if (avatarUrl) {
        await fetch(`${API_BASE}/auth/profile-picture`, {
          method: "POST",
          headers: {
            ...getAuthHeaders(),
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ avatar_url: avatarUrl }),
          credentials: "include",
        });
      } else {
        await fetch(`${API_BASE}/auth/profile-picture`, {
          method: "DELETE",
          headers: getAuthHeaders(),
          credentials: "include",
        });
      }
    } catch (err) {
      console.warn("[AuthContext] Profile picture backend sync warning:", err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser, updateProfilePicture }}>
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
