"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

interface AuthUser {
  userId: number;
  name: string;
  phoneNumber: string;
  role: string;
  token: string;
  refreshToken: string;
}

interface AuthContextType {
  user: AuthUser | null;
  login: (phoneNumber: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateTokens: (token: string, refreshToken: string) => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = "foodstore_auth";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const router = useRouter();

  // Load user from localStorage on mount
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const authData = JSON.parse(stored);
        setUser(authData);
      }
    } catch (error) {
      console.error("Failed to load auth data:", error);
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (phoneNumber: string, password: string) => {
    try {
      const response = await fetch("http://api.yenhafood.site/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phoneNumber, password }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return { 
          success: false, 
          error: `Login failed: ${response.status} ${errorText || response.statusText}` 
        };
      }

      const data = await response.json();

      // Save user data
      const authUser: AuthUser = {
        userId: data.userId,
        name: data.name,
        phoneNumber: data.phoneNumber,
        role: data.role,
        token: data.token,
        refreshToken: data.refreshToken,
      };

      setUser(authUser);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authUser));

      return { success: true };
    } catch (error) {
      console.error("Login error:", error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Network error occurred" 
      };
    }
  };

  const logout = async () => {
    try {
      // Call logout API
      const token = user?.token;
      if (token) {
        await fetch("http://api.yenhafood.site:8080/api/auth/logout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        });
      }
    } catch (error) {
      console.error("Logout API error:", error);
      // Continue with logout even if API call fails
    } finally {
      // Clear local state and storage
      setUser(null);
      localStorage.removeItem(AUTH_STORAGE_KEY);
      router.push("/login");
    }
  };

  const updateTokens = (token: string, refreshToken: string) => {
    if (user) {
      const updatedUser = { ...user, token, refreshToken };
      setUser(updatedUser);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updatedUser));
    }
  };

  const value = {
    user,
    login,
    logout,
    updateTokens,
    isAuthenticated: !!user,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Helper function to get token for API calls
export function getAuthToken(): string | null {
  try {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (stored) {
      const authData = JSON.parse(stored);
      return authData.token;
    }
  } catch (error) {
    console.error("Failed to get auth token:", error);
  }
  return null;
}

