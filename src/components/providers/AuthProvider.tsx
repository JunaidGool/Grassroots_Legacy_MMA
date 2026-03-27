"use client";

import { useState, useCallback, useEffect, type ReactNode } from "react";
import { AuthContext } from "@/hooks/useAuth";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);

  const checkSession = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/session");
      const data = await res.json();
      setIsAdmin(data.authenticated === true);
    } catch {
      setIsAdmin(false);
    }
  }, []);

  const login = useCallback(async (pin: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      if (res.ok) {
        setIsAdmin(true);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      setIsAdmin(false);
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  return (
    <AuthContext value={{ isAdmin, login, logout, checkSession }}>
      {children}
    </AuthContext>
  );
}
