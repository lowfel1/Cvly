// JWT token management utilities

// JWT token management utilities
import type { User } from "@/types/index";

const TOKEN_KEY = "cvly_token";
const COOKIE_NAME = "cvly_token";
const COOKIE_MAX_AGE_SECONDS = 86400;

interface JwtPayload {
  exp?: number;
  sub?: string;
  id?: string;
  full_name?: string;
  email?: string;
  created_at?: string;
}

function isClient(): boolean {
  return typeof window !== "undefined";
}

function decodeTokenPayload(token: string): JwtPayload | null {
  try {
    const parts = token.split(".");

    if (parts.length < 2) {
      return null;
    }

    // JWT uses base64url encoding, so we normalize it before decoding.
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    const decoded = atob(padded);

    return JSON.parse(decoded) as JwtPayload;
  } catch {
    return null;
  }
}

export function saveToken(token: string): void {
  if (!isClient()) {
    return;
  }

  localStorage.setItem(TOKEN_KEY, token);
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(token)}; path=/; max-age=${COOKIE_MAX_AGE_SECONDS}; SameSite=strict`;
}

export function getToken(): string | null {
  if (!isClient()) {
    return null;
  }

  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function removeToken(): void {
  if (!isClient()) {
    return;
  }

  localStorage.removeItem(TOKEN_KEY);
  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0; SameSite=strict`;
}

export function isAuthenticated(): boolean {
  try {
    const token = getToken();

    if (!token) {
      return false;
    }

    const payload = decodeTokenPayload(token);

    if (!payload || typeof payload.exp !== "number") {
      removeToken();
      return false;
    }

    const nowInSeconds = Date.now() / 1000;

    if (payload.exp <= nowInSeconds) {
      removeToken();
      return false;
    }

    return true;
  } catch {
    removeToken();
    return false;
  }
}

export function getUserFromToken(): User | null {
  try {
    const token = getToken();

    if (!token) {
      return null;
    }

    const payload = decodeTokenPayload(token);

    if (!payload) {
      return null;
    }

    const id = payload.id ?? payload.sub;

    if (!id || !payload.full_name) {
      return null;
    }

    return {
      id,
      email: payload.email ?? "",
      full_name: payload.full_name,
      created_at: payload.created_at ?? "",
    };
  } catch {
    return null;
  }
}