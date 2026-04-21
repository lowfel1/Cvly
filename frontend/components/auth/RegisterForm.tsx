"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Mail, Lock, User, Eye, EyeOff } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"

// Password strength calculator
function getPasswordStrength(password: string): {
  score: number
  label: string
  color: string
} {
  let score = 0
  if (password.length >= 8) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++

  if (score <= 1) return { score, label: "Weak", color: "bg-red-500" }
  if (score === 2) return { score, label: "Fair", color: "bg-orange-500" }
  if (score === 3) return { score, label: "Good", color: "bg-yellow-500" }
  return { score, label: "Strong", color: "bg-emerald-500" }
}

export default function RegisterForm() {
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<{
    fullName?: string
    email?: string
    password?: string
    confirmPassword?: string
  }>({})
  const [isLoading, setIsLoading] = useState(false)

  const { register } = useAuth()
  const router = useRouter()

  const strength = getPasswordStrength(password)

  // Validate all form fields before submission
  function validateForm(): boolean {
    const errors: typeof fieldErrors = {}

    if (!fullName.trim()) {
      errors.fullName = "Full name is required"
    } else if (fullName.trim().length < 2) {
      errors.fullName = "Full name must be at least 2 characters"
    }

    if (!email.trim()) {
      errors.email = "Email is required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Invalid email address"
    }

    if (!password) {
      errors.password = "Password is required"
    } else if (password.length < 8) {
      errors.password = "Password must be at least 8 characters"
    } else if (!/[A-Z]/.test(password)) {
      errors.password = "Password must contain at least one uppercase letter"
    } else if (!/[0-9]/.test(password)) {
      errors.password = "Password must contain at least one number"
    }

    if (!confirmPassword) {
      errors.confirmPassword = "Please confirm your password"
    } else if (confirmPassword !== password) {
      errors.confirmPassword = "Passwords do not match"
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)

    if (!validateForm()) return

    setIsLoading(true)

    try {
      const result = await register(fullName.trim(), email.trim(), password)

      if (result.success) {
        router.push("/dashboard")
      } else {
        setFormError(result.error ?? "Registration failed. Please try again.")
      }
    } catch {
      setFormError("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      {/* Header */}
      <h1 className="text-2xl font-bold text-slate-900 mb-1">
        Create Account
      </h1>
      <p className="text-sm text-gray-500 mb-8">
        Start automating your job applications today.
      </p>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">

        {/* Full name field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Full Name
          </label>
          <div className="relative">
            <User
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              width={16}
              height={16}
            />
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="John Doe"
              className={`w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm
                focus:outline-none focus:ring-1 transition-colors
                ${fieldErrors.fullName
                  ? "border-red-400 focus:border-red-500 focus:ring-red-500"
                  : "border-gray-200 focus:border-teal-600 focus:ring-teal-600"
                }`}
            />
          </div>
          {fieldErrors.fullName && (
            <p className="text-red-500 text-xs mt-1">{fieldErrors.fullName}</p>
          )}
        </div>

        {/* Email field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <div className="relative">
            <Mail
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              width={16}
              height={16}
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className={`w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm
                focus:outline-none focus:ring-1 transition-colors
                ${fieldErrors.email
                  ? "border-red-400 focus:border-red-500 focus:ring-red-500"
                  : "border-gray-200 focus:border-teal-600 focus:ring-teal-600"
                }`}
            />
          </div>
          {fieldErrors.email && (
            <p className="text-red-500 text-xs mt-1">{fieldErrors.email}</p>
          )}
        </div>

        {/* Password field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <div className="relative">
            <Lock
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              width={16}
              height={16}
            />
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a password"
              className={`w-full pl-10 pr-10 py-2.5 border rounded-lg text-sm
                focus:outline-none focus:ring-1 transition-colors
                ${fieldErrors.password
                  ? "border-red-400 focus:border-red-500 focus:ring-red-500"
                  : "border-gray-200 focus:border-teal-600 focus:ring-teal-600"
                }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
            >
              {showPassword
                ? <EyeOff width={16} height={16} />
                : <Eye width={16} height={16} />
              }
            </button>
          </div>

          {/* Password strength bar */}
          {password.length > 0 && (
            <div className="mt-2">
              <div className="flex gap-1 mb-1">
                {[1, 2, 3, 4].map((level) => (
                  <div
                    key={level}
                    className={`h-1 flex-1 rounded-full transition-colors ${
                      level <= strength.score
                        ? strength.color
                        : "bg-gray-200"
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs text-gray-500">
                Password strength:
                <span className={`ml-1 font-medium ${
                  strength.score <= 1 ? "text-red-500" :
                  strength.score === 2 ? "text-orange-500" :
                  strength.score === 3 ? "text-yellow-600" :
                  "text-emerald-600"
                }`}>
                  {strength.label}
                </span>
              </p>
            </div>
          )}

          {fieldErrors.password && (
            <p className="text-red-500 text-xs mt-1">{fieldErrors.password}</p>
          )}
        </div>

        {/* Confirm password field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Confirm Password
          </label>
          <div className="relative">
            <Lock
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              width={16}
              height={16}
            />
            <input
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
              className={`w-full pl-10 pr-10 py-2.5 border rounded-lg text-sm
                focus:outline-none focus:ring-1 transition-colors
                ${fieldErrors.confirmPassword
                  ? "border-red-400 focus:border-red-500 focus:ring-red-500"
                  : "border-gray-200 focus:border-teal-600 focus:ring-teal-600"
                }`}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
            >
              {showConfirmPassword
                ? <EyeOff width={16} height={16} />
                : <Eye width={16} height={16} />
              }
            </button>
          </div>
          {fieldErrors.confirmPassword && (
            <p className="text-red-500 text-xs mt-1">
              {fieldErrors.confirmPassword}
            </p>
          )}
        </div>

        {/* Global error message */}
        {formError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-600 text-sm">{formError}</p>
          </div>
        )}

        {/* Submit button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-teal-700 hover:bg-teal-800 disabled:opacity-60
            disabled:cursor-not-allowed text-white font-medium py-2.5
            rounded-lg transition-colors text-sm flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <svg
                className="animate-spin h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12" cy="12" r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Creating account...
            </>
          ) : (
            "Create Account"
          )}
        </button>

      </form>

      {/* Login link */}
      <p className="text-center text-sm text-gray-500 mt-6">
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-teal-700 font-medium hover:text-teal-800 transition-colors"
        >
          Sign In
        </Link>
      </p>
    </div>
  )
}