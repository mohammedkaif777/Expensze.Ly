"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { api, tokenStore, userStore, ApiError } from "@/lib/api";
import type { User } from "@/lib/types";

interface AuthResponse {
  token: string;
  user: User;
}

interface RegisterInput {
  name: string;
  email: string;
  password: string;
  defaultCurrency?: string;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => userStore.get());
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const validate = async () => {
      if (!tokenStore.get()) {
        setLoading(false);
        return;
      }
      try {
        const res = await api<{ user: User }>("/auth/me");
        setUser(res.user);
        userStore.set(res.user);
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          tokenStore.clear();
          userStore.clear();
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
    };
    validate();
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await api<AuthResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      tokenStore.set(res.token);
      userStore.set(res.user);
      setUser(res.user);
      router.push("/dashboard");
    },
    [router]
  );

  const register = useCallback(
    async (input: RegisterInput) => {
      const res = await api<AuthResponse>("/auth/register", {
        method: "POST",
        body: JSON.stringify(input),
      });
      tokenStore.set(res.token);
      userStore.set(res.user);
      setUser(res.user);
      router.push("/dashboard");
    },
    [router]
  );

  const logout = useCallback(() => {
    tokenStore.clear();
    userStore.clear();
    setUser(null);
    router.push("/login");
  }, [router]);

  const updateUser = useCallback((next: User) => {
    setUser(next);
    userStore.set(next);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, register, logout, updateUser }),
    [user, loading, login, register, logout, updateUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}