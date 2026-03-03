// src/AuthContext.tsx
import React, { createContext, useState, useEffect, ReactNode } from "react";
import { User } from "./types/types";

export interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  role: string | null;
  login: (email: string, password: string) => Promise<User>;
  signup: (name: string, email: string, password: string, role: string) => Promise<User>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));

  const normalizeUser = (raw: any): User => {
    const id = raw?._id || raw?.id;
    return {
      _id: id,
      name: raw?.name || "",
      email: raw?.email || "",
      role: raw?.role || "brand",
      avatar: raw?.avatar,
      createdAt: raw?.createdAt || new Date().toISOString(),
    };
  };

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (storedToken) {
      setToken(storedToken);
      if (storedUser) {
        try {
          const parsedUser = normalizeUser(JSON.parse(storedUser));
          setUser(parsedUser);
          setIsAuthenticated(true);
        } catch (err) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setToken(null);
          setUser(null);
          setIsAuthenticated(false);
        }
      }
    }
  }, []);

  // Load user if token exists
  useEffect(() => {
    if (token) {
      fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/auth/me`, {
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data) {
            const normalizedUser = normalizeUser(data);
            setUser(normalizedUser);
            localStorage.setItem('user', JSON.stringify(normalizedUser));
            setIsAuthenticated(true);
          } else {
            // Token is invalid, clear it
            localStorage.removeItem("token");
            localStorage.removeItem('user');
            setToken(null);
            setUser(null);
            setIsAuthenticated(false);
          }
        })
        .catch(() => {
          setToken(null);
          setUser(null);
          localStorage.removeItem("token");
          localStorage.removeItem('user');
          setIsAuthenticated(false);
        });
    }
  }, [token]);

  // 🔑 Login
  const login = async (email: string, password: string) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.msg || "Login failed");
      }

      const normalizedUser = normalizeUser(data.user);
      setToken(data.token);
      localStorage.setItem("token", data.token);
      setUser(normalizedUser);
      localStorage.setItem("user", JSON.stringify(normalizedUser));
      setIsAuthenticated(true);
      return normalizedUser;
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error("Request timeout - please check your connection");
      }

      if (error instanceof TypeError && error.message.includes("fetch")) {
        throw new Error("Network error - please check your connection");
      }

      throw error;
    }
  };

  // 🔑 Signup
  const signup = async (name: string, email: string, password: string, role: string) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ name, email, password, role }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.msg || data.errors?.[0]?.msg || "Signup failed");
      }

      const normalizedUser = normalizeUser(data.user);
      setToken(data.token);
      localStorage.setItem("token", data.token);
      setUser(normalizedUser);
      localStorage.setItem("user", JSON.stringify(normalizedUser));
      setIsAuthenticated(true);

      return normalizedUser;
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error("Request timeout - please check your connection");
      }

      if (error instanceof TypeError && error.message.includes("fetch")) {
        throw new Error("Network error - please check your connection");
      }

      throw error;
    }
  };

  // 🚪 Logout
  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, token, role: user ? user.role : null, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
