"use client";

import type { ReactNode } from "react";

interface ButtonProps {
  variant?: "primary" | "secondary" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  children: ReactNode;
  type?: "button" | "submit" | "reset";
  className?: string;
}

const variantClasses: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary: "bg-violet-600 text-white hover:bg-violet-700",
  secondary: "border border-violet-600 text-violet-600 hover:bg-violet-50",
  danger: "bg-red-600 text-white hover:bg-red-700",
};

const sizeClasses: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "text-sm px-3 py-1.5 rounded-md",
  md: "text-base px-4 py-2 rounded-lg",
  lg: "text-lg px-6 py-3 rounded-lg",
};

const commonClasses =
  "inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2";

export default function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  onClick,
  children,
  type = "button",
  className,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={[
        commonClasses,
        variantClasses[variant],
        sizeClasses[size],
        isDisabled ? "opacity-50 cursor-not-allowed" : "",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {loading && (
        // Show a spinner when the button is in loading state.
        <svg
          className="mr-2 h-4 w-4 animate-spin"
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
      )}
      <span>{children}</span>
    </button>
  );
}
