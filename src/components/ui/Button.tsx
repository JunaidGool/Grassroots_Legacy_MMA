"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "gold-gradient text-dark-900 font-semibold hover:brightness-110 active:brightness-95",
  secondary:
    "bg-transparent border border-gold-500 text-gold-400 hover:bg-gold-500/10 active:bg-gold-500/20",
  danger:
    "bg-danger text-white hover:bg-red-600 active:bg-red-700",
  ghost:
    "bg-transparent text-muted hover:text-foreground hover:bg-dark-600 active:bg-dark-500",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-10 px-3 text-sm rounded-md",
  md: "h-[52px] px-5 text-base rounded-lg",
  lg: "h-14 px-6 text-lg rounded-lg",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", loading, className = "", children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`
          inline-flex items-center justify-center gap-2 font-body font-medium
          transition-all duration-150 cursor-pointer
          disabled:opacity-50 disabled:cursor-not-allowed
          min-w-[48px]
          ${variantClasses[variant]}
          ${sizeClasses[size]}
          ${className}
        `}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
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
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
