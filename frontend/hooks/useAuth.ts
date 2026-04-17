"use client";

import { useEffect, useState } from "react";
import { getToken, isAuthenticated, removeToken, saveToken } from "@/lib/auth";
import { getMe, loginUser, registerUser } from "@/lib/api";
import type { User } from "@/types/index";

interface AuthActionResult {
  success: boolean;
  error?: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAuth, setIsAuth] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const hasValidToken = isAuthenticated();

        if (!hasValidToken) {
          removeToken();
          setIsAuth(false);
          setUser(null);
          return;
        }

        const token = getToken();

        if (!token) {
          removeToken();
          setIsAuth(false);
          setUser(null);
          return;
        }

        const me = await getMe(token);
        setUser(me);
        setIsAuth(true);
      } catch {
        removeToken();
        setIsAuth(false);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    void initializeAuth();
  }, []);

  const login = async (email: string, password: string): Promise<AuthActionResult> => {
    setLoading(true);
    setError(null);

    try {
      const tokenResponse = await loginUser(email, password);
      saveToken(tokenResponse.access_token);

      const me = await getMe(tokenResponse.access_token);
      setUser(me);
      setIsAuth(true);

      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed.";
      setError(message);
      setIsAuth(false);
      setUser(null);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const register = async (
    fullName: string,
    email: string,
    password: string
  ): Promise<AuthActionResult> => {
    setLoading(true);
    setError(null);

    try {
      const tokenResponse = await registerUser(fullName, email, password);
      saveToken(tokenResponse.access_token);

      const me = await getMe(tokenResponse.access_token);
      setUser(me);
      setIsAuth(true);

      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Registration failed.";
      setError(message);
      setIsAuth(false);
      setUser(null);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    removeToken();
    setUser(null);
    setIsAuth(false);
    setError(null);
  };

  return { user, loading, isAuth, error, login, register, logout };
}
