"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface InputProps {
  type: "text" | "email" | "password";
  label: string;
  placeholder?: string;
  error?: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  disabled: boolean;
  name: string;
  id?: string;
  required: boolean;
}

export default function Input({
  type,
  label,
  placeholder,
  error,
  value,
  onChange,
  disabled,
  name,
  id,
  required,
}: InputProps) {
  const [showPassword, setShowPassword] = useState(false);

  const resolvedId = id ?? name;
  const isPassword = type === "password";
  const inputType = isPassword && showPassword ? "text" : type;

  const baseClasses =
    "block w-full rounded-lg border px-3 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 transition-colors duration-200";
  const normalClasses = "border-gray-300 focus:border-violet-500 focus:ring-violet-500";
  const errorClasses = "border-red-500 focus:border-red-500 focus:ring-red-500";
  const disabledClasses = "bg-gray-50 cursor-not-allowed opacity-60";
  const passwordClasses = isPassword ? "pr-10" : "";

  return (
    <div>
      <label htmlFor={resolvedId} className="mb-1 block text-sm font-medium text-gray-700">
        {label}
      </label>

      <div className="relative">
        <input
          id={resolvedId}
          name={name}
          type={inputType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={[
            baseClasses,
            error ? errorClasses : normalClasses,
            disabled ? disabledClasses : "",
            passwordClasses,
          ]
            .filter(Boolean)
            .join(" ")}
        />

        {isPassword && (
          // Toggle password visibility for better usability.
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            disabled={disabled}
            className="absolute inset-y-0 right-0 pr-3 text-gray-500 hover:text-gray-700 focus:outline-none"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>

      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
}
