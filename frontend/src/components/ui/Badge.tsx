"use client";

import React from "react";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "gold" | "saffron" | "stone" | "success" | "danger" | "verse";
  size?: "sm" | "md";
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  className = "",
  variant = "gold",
  size = "md",
  ...props
}) => {
  const sizeStyles = size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs";

  const variantStyles = {
    gold: "bg-amber-500/15 text-amber-900 dark:text-amber-200 border border-amber-500/30",
    saffron:
      "bg-gradient-to-r from-amber-600/20 to-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30",
    stone: "bg-stone-200/70 dark:bg-stone-800/80 text-stone-700 dark:text-stone-300 border border-stone-300/40 dark:border-stone-700/40",
    success: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30",
    danger: "bg-rose-500/15 text-rose-800 dark:text-rose-300 border border-rose-500/30",
    verse: "bg-gradient-to-r from-amber-500/25 to-yellow-500/25 text-amber-900 dark:text-amber-100 border border-amber-500/40 font-semibold"
  }[variant];

  return (
    <span
      className={`inline-flex items-center gap-1 font-serif rounded-full font-medium ${sizeStyles} ${variantStyles} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};
