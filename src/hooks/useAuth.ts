"use client";

import { createContext, useContext } from "react";

interface AuthContextType {
  isAdmin: boolean;
  login: (pin: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  isAdmin: false,
  login: async () => false,
  logout: async () => {},
  checkSession: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}
