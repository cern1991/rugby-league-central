import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useLocation } from "wouter";

interface User {
  id: string;
  email: string;
  twoFactorEnabled: boolean;
  subscriptionStatus: string;
  favoriteTeams: string[];
  themePreference: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ requiresTwoFactor?: boolean; userId?: string }>;
  register: (email: string, password: string) => Promise<{ isNewUser: boolean }>;
  logout: () => Promise<void>;
  verify2FA: (userId: string, token: string) => Promise<void>;
  setup2FA: () => Promise<{ secret: string; qrCode: string }>;
  enable2FA: (token: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  updatePreferences: (favoriteTeams: string[], themePreference: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [, setLocation] = useLocation();

  const refreshUser = async () => {
    try {
      const res = await fetch("/api/auth/user", {
        credentials: "include",
      });
      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
      } else {
        setUser(null);
      }
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const register = async (email: string, password: string) => {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "Registration failed");
    }

    const userData = await res.json();
    setUser(userData);
    return { isNewUser: true };
  };

  const login = async (email: string, password: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "Login failed");
    }

    const data = await res.json();

    if (data.requiresTwoFactor) {
      return { requiresTwoFactor: true, userId: data.userId };
    }

    setUser(data);
    setLocation("/");
    return {};
  };

  const verify2FA = async (userId: string, token: string) => {
    const res = await fetch("/api/auth/verify-2fa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ userId, token }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "2FA verification failed");
    }

    const userData = await res.json();
    setUser(userData);
    setLocation("/");
  };

  const logout = async () => {
    const res = await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });

    if (res.ok) {
      setUser(null);
      setLocation("/");
    }
  };

  const setup2FA = async () => {
    const res = await fetch("/api/auth/setup-2fa", {
      method: "POST",
      credentials: "include",
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "Failed to setup 2FA");
    }

    return await res.json();
  };

  const enable2FA = async (token: string) => {
    const res = await fetch("/api/auth/enable-2fa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ token }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "Failed to enable 2FA");
    }

    await refreshUser();
  };

  const updatePreferences = async (favoriteTeams: string[], themePreference: string) => {
    const res = await fetch("/api/auth/preferences", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ favoriteTeams, themePreference }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "Failed to update preferences");
    }

    const userData = await res.json();
    setUser(userData);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        verify2FA,
        setup2FA,
        enable2FA,
        refreshUser,
        updatePreferences,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
