"use client";

import { forwardRef, type SelectHTMLAttributes } from "react";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, placeholder, className = "", id, ...props }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={selectId}
            className="text-sm font-medium text-dark-200"
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={`
            h-[52px] px-4 rounded-lg appearance-none
            bg-dark-700 border border-border text-foreground
            focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500/50
            transition-colors duration-150
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error ? "border-danger focus:border-danger focus:ring-danger/50" : ""}
            ${className}
          `}
          {...props}
        >
          {placeholder && (
            <option value="" className="text-muted">
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="text-sm text-danger">{error}</p>}
      </div>
    );
  }
);

Select.displayName = "Select";
