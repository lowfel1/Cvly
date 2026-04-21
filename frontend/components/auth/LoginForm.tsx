"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

// Client-side email format check.
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateForm(email: string, password: string): string | null {
  if (!email.trim()) {
    return "Email is required";
  }

  if (!EMAIL_REGEX.test(email.trim())) {
    return "Invalid email address";
  }

  if (!password) {
    return "Password is required";
  }

  if (password.length < 6) {
    return "Password must be at least 6 characters";
  }

  return null;
}

export default function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);

    const validationError = validateForm(email, password);
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setIsLoading(true);

    try {
      const result = await login(email.trim(), password);

      if (result.success) {
        router.push("/dashboard");
      } else {
        setFormError(result.error ?? "Sign in failed. Please try again.");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Sign in failed. Please try again.";
      setFormError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const inputClassName =
    "w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600";

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Welcome Back!</h1>
      <p className="mt-1 mb-8 text-sm text-gray-500">
        Sign in to access your dashboard and continue optimizing your job applications.
      </p>

      <form onSubmit={handleSubmit} className="space-y-0">
        {/* Email */}
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
            Email
          </label>
          <div className="relative">
            <Mail
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
              aria-hidden="true"
            />
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              disabled={isLoading}
              className={inputClassName}
            />
          </div>
        </div>

        {/* Password + forgot link */}
        <div className="mt-4">
          <div className="mb-1 flex items-center justify-between">
            <label htmlFor="password" className="text-sm font-medium text-gray-700">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-sm font-medium text-teal-700 hover:text-teal-800"
            >
              Forgot Password?
            </Link>
          </div>
          <div className="relative">
            <Lock
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
              aria-hidden="true"
            />
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              className={`${inputClassName} pr-10`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              disabled={isLoading}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {formError && (
          <div className="mt-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
            {formError}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="mt-4 w-full rounded-lg bg-teal-700 py-2.5 text-sm font-medium text-white transition-colors hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? (
            <span className="inline-flex items-center justify-center gap-2">
              <svg
                className="h-4 w-4 animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Signing in...
            </span>
          ) : (
            "Sign In"
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="my-4 flex items-center gap-3">
        <hr className="flex-1 border-gray-200" />
        <span className="text-xs text-gray-400">OR</span>
        <hr className="flex-1 border-gray-200" />
      </div>

      {/* Social sign-in (UI only; wire OAuth when backend is ready) */}
      <div className="space-y-3">
        <button
          type="button"
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-50"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continue with Google
        </button>

        <button
          type="button"
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-50"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
            <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
          </svg>
          Continue with Apple
        </button>
      </div>

      <p className="mt-6 text-center text-sm text-gray-500">
        Don&apos;t have an Account?{" "}
        <Link href="/register" className="font-medium text-teal-700 hover:text-teal-800">
          Sign Up
        </Link>
      </p>
    </div>
  );
}
