// src/context/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from "react";
import api from "../api/client";

type User = {
  id: number;
  uuid: string;
  name: string;
  email: string;
  role: "user" | "admin";
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("finanzapp_token")
  );
  const [loading, setLoading] = useState<boolean>(!!token);

  // Cargar /auth/me si hay token guardado
  useEffect(() => {
    const loadMe = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await api.get("/api/auth/me");
        setUser(res.data);
      } catch (err) {
        console.error("Failed to load me", err);
        localStorage.removeItem("finanzapp_token");
        setToken(null);
      } finally {
        setLoading(false);
      }
    };
    loadMe();
  }, [token]);

  const login = async (email: string, password: string) => {
    const res = await api.post("/api/auth/login", { email, password });
    const { user, token } = res.data;
    setUser(user);
    setToken(token);
    localStorage.setItem("finanzapp_token", token);
  };

  const register = async (name: string, email: string, password: string) => {
    const res = await api.post("/api/auth/register", { name, email, password });
    const { user, token } = res.data;
    setUser(user);
    setToken(token);
    localStorage.setItem("finanzapp_token", token);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("finanzapp_token");
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
};
