"use client";

import React from "react";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "text" | "circular" | "rectangular" | "card";
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = "",
  variant = "rectangular",
  ...props
}) => {
  const variantStyles = {
    text: "h-4 rounded-md w-3/4",
    circular: "rounded-full aspect-square",
    rectangular: "rounded-2xl",
    card: "h-32 rounded-2xl temple-card"
  }[variant];

  return (
    <div
      className={`animate-pulse bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/15 ${variantStyles} ${className}`}
      {...props}
    />
  );
};
