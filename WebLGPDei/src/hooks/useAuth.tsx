"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { apiFetch, getApiErrorMessage } from "@/lib/api";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    name: string,
    email: string,
    password: string,
    consent: boolean,
  ) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateProfile: (profile: { name: string; email: string }) => Promise<void>;
  deleteAccount: (password: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const data = await apiFetch<{ user: AuthUser }>("/auth/me");
      setUser(data.user);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        await refreshUser();
      } finally {
        setLoading(false);
      }
    })();
  }, [refreshUser]);

  const signIn = useCallback(async (email: string, password: string) => {
    const data = await apiFetch<{ user: AuthUser }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setUser(data.user);
  }, []);

  const signUp = useCallback(
    async (name: string, email: string, password: string, consent: boolean) => {
      const data = await apiFetch<{ user: AuthUser }>("/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password, consent }),
      });
      setUser(data.user);
    },
    [],
  );

  const signOut = useCallback(async () => {
    await apiFetch("/auth/logout", { method: "POST" });
    setUser(null);
  }, []);

  const updateProfile = useCallback(
    async (profile: { name: string; email: string }) => {
      const data = await apiFetch<{ user: AuthUser }>("/auth/me", {
        method: "PATCH",
        body: JSON.stringify(profile),
      });
      setUser(data.user);
    },
    [],
  );

  const deleteAccount = useCallback(async (password: string) => {
    await apiFetch("/auth/me", {
      method: "DELETE",
      body: JSON.stringify({ password }),
    });
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      signIn,
      signUp,
      signOut,
      refreshUser,
      updateProfile,
      deleteAccount,
    }),
    [user, loading, signIn, signUp, signOut, refreshUser, updateProfile, deleteAccount],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

export { getApiErrorMessage };
