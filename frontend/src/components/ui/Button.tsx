"use client";

import React from "react";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "temple" | "outline";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className = "",
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-serif font-medium transition-all duration-200 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-40 disabled:cursor-not-allowed select-none active:scale-[0.98]";

    const sizeStyles = {
      sm: "px-3 py-1.5 text-xs rounded-xl gap-1.5",
      md: "px-4 py-2 text-sm rounded-2xl gap-2",
      lg: "px-6 py-3 text-base rounded-2xl gap-2.5",
      icon: "p-2 rounded-full w-9 h-9 sm:w-10 sm:h-10 aspect-square"
    }[size];

    const variantStyles = {
      primary:
        "bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-white shadow-md shadow-amber-500/20 hover:opacity-95 hover:shadow-lg hover:shadow-amber-500/30 border border-amber-400/30",
      secondary:
        "bg-amber-500/10 dark:bg-amber-500/15 text-amber-900 dark:text-amber-200 border border-amber-500/25 hover:bg-amber-500/20 dark:hover:bg-amber-500/25",
      ghost:
        "bg-transparent text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800/60",
      danger:
        "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-900/60 hover:bg-rose-100 dark:hover:bg-rose-950/70",
      temple:
        "temple-card text-stone-900 dark:text-white hover:border-amber-500/60",
      outline:
        "border border-amber-500/30 dark:border-amber-500/30 text-amber-900 dark:text-amber-200 hover:border-amber-500 hover:bg-amber-500/5"
    }[variant];

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${sizeStyles} ${variantStyles} ${className}`}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-current" />
        ) : (
          leftIcon
        )}
        {children}
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = "Button";
