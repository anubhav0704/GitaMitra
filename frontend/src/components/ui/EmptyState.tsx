"use client";

import React from "react";
import { Sparkles, LucideIcon } from "lucide-react";
import { Button } from "./Button";

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Sparkles,
  title,
  description,
  actionLabel,
  onAction,
  className = ""
}) => {
  return (
    <div
      className={`temple-card p-8 sm:p-12 text-center space-y-3 flex flex-col items-center justify-center max-w-md mx-auto ${className}`}
    >
      <div className="w-12 h-12 rounded-full bg-amber-500/15 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-1">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="font-serif text-base sm:text-lg font-bold text-stone-900 dark:text-white">
        {title}
      </h3>
      <p className="font-sans text-xs text-stone-600 dark:text-stone-400 leading-relaxed max-w-xs">
        {description}
      </p>
      {actionLabel && onAction && (
        <div className="pt-2">
          <Button size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
};
