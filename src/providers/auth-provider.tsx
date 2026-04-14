"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { AuthResult, UserInfoRm, LoginApiRequest, RegisterApiRequest } from "@/lib/api/types";
import { apiClient } from "@/lib/api/client";

interface AuthContextValue {
  user: UserInfoRm | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginApiRequest) => Promise<AuthResult>;
  register: (data: RegisterApiRequest) => Promise<AuthResult>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserInfoRm | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCurrentUser = useCallback(async () => {
    try {
      const data = await apiClient<UserInfoRm>("/api/v1/auth/me");
      setUser(data);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser().finally(() => setIsLoading(false));
  }, [fetchCurrentUser]);

  const login = useCallback(async (data: LoginApiRequest): Promise<AuthResult> => {
    const result = await apiClient<AuthResult>("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    });
    setUser(result.user);
    return result;
  }, []);

  const register = useCallback(async (data: RegisterApiRequest): Promise<AuthResult> => {
    const result = await apiClient<AuthResult>("/api/v1/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
    setUser(result.user);
    return result;
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiClient("/api/v1/auth/logout", { method: "POST" });
    } catch {
      // Best-effort — redirect regardless.
    }
    setUser(null);
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        refreshUser: fetchCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
