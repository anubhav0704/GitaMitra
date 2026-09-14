"use client";

import React from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, leftIcon, rightIcon, className = "", id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block font-serif text-xs font-semibold text-stone-800 dark:text-stone-200"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3.5 flex items-center pointer-events-none text-stone-400 dark:text-stone-500">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`w-full rounded-2xl border px-3.5 py-2.5 text-sm transition-all duration-200 bg-white/80 dark:bg-[#15102a]/85 backdrop-blur-md text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 ${
              leftIcon ? "pl-10" : ""
            } ${rightIcon ? "pr-10" : ""} ${
              error
                ? "border-rose-400 dark:border-rose-800 focus:border-rose-500"
                : "border-amber-500/30 dark:border-amber-500/25 focus:border-amber-500"
            } ${className}`}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3.5 flex items-center text-stone-400 dark:text-stone-500">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p className="font-serif text-[11px] text-rose-600 dark:text-rose-400 animate-in fade-in">
            {error}
          </p>
        )}
        {!error && hint && (
          <p className="font-serif text-[11px] text-stone-500 dark:text-stone-400">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
