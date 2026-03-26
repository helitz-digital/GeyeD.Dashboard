"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { AuthResult, UserInfoRm, LoginApiRequest, RegisterApiRequest } from "@/lib/api/types";
import { apiClient, setTokens, clearTokens, getAccessToken } from "@/lib/api/client";

interface AuthContextValue {
  user: UserInfoRm | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginApiRequest) => Promise<AuthResult>;
  register: (data: RegisterApiRequest) => Promise<AuthResult>;
  logout: () => void;
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
      clearTokens();
    }
  }, []);

  useEffect(() => {
    const token = getAccessToken();
    if (token) {
      fetchCurrentUser().finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [fetchCurrentUser]);

  const login = useCallback(async (data: LoginApiRequest): Promise<AuthResult> => {
    const result = await apiClient<AuthResult>("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    });
    setTokens(result.accessToken, result.refreshToken);
    setUser(result.user);
    return result;
  }, []);

  const register = useCallback(async (data: RegisterApiRequest): Promise<AuthResult> => {
    const result = await apiClient<AuthResult>("/api/v1/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
    setTokens(result.accessToken, result.refreshToken);
    setUser(result.user);
    return result;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    clearTokens();
    window.location.href = "/login";
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
