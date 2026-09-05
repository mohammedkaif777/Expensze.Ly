"use client";

import type { User } from "@/lib/types";

const TOKEN_KEY = "expense_tracker_token";
const USER_KEY = "expense_tracker_user";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

export const userStore = {
  get: (): User | null => {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },
  set: (user: User) => localStorage.setItem(USER_KEY, JSON.stringify(user)),
  clear: () => localStorage.removeItem(USER_KEY),
};

export async function api<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = tokenStore.get();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  let finalPath = path;
  if (!finalPath.startsWith("http")) {
    finalPath = finalPath.startsWith("/api")
      ? finalPath
      : `/api/${finalPath.replace(/^\//, "")}`;
  }

  const res = await fetch(finalPath, { ...options, headers });

  if (!res.ok) {
    let message = "Something went wrong";
    try {
      const body = await res.json();
      message = body.message || message;
    } catch {
      // ignore
    }
    throw new ApiError(message, res.status);
  }

  if (res.status === 204) return undefined as T;
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) return res.json() as Promise<T>;
  return (await res.text()) as unknown as T;
}