"use client";

import { forwardRef, type InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-dark-200"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`
            h-[52px] px-4 rounded-lg
            bg-dark-700 border border-border text-foreground
            placeholder:text-muted
            focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500/50
            transition-colors duration-150
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error ? "border-danger focus:border-danger focus:ring-danger/50" : ""}
            ${className}
          `}
          {...props}
        />
        {error && <p className="text-sm text-danger">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
