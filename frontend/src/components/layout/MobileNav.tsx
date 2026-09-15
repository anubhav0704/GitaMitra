"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageSquare, BookOpen, Shield, Settings as SettingsIcon } from "lucide-react";

export const MobileNav: React.FC = () => {
  const pathname = usePathname();

  const navItems = [
    { href: "/chat", label: "Dialogue", icon: MessageSquare, active: pathname === "/chat" },
    { href: "/gita", label: "Gita", icon: BookOpen, active: pathname?.startsWith("/gita") },
    { href: "/memory", label: "Memory", icon: Shield, active: pathname === "/memory" },
    { href: "/settings", label: "Sanctuary", icon: SettingsIcon, active: pathname === "/settings" }
  ];

  return (
    <nav
      aria-label="Mobile navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#faf6ee]/95 dark:bg-[#0c091a]/95 backdrop-blur-xl border-t border-amber-500/25 px-2 flex items-center justify-around select-none h-14 shadow-lg safe-area-pb"
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all cursor-pointer ${
              item.active
                ? "text-amber-600 dark:text-amber-400 font-bold scale-105"
                : "text-stone-500 dark:text-stone-400 hover:text-amber-600 dark:hover:text-amber-300"
            }`}
          >
            <Icon className="w-4 h-4" />
            <span className="font-serif text-[10px] mt-0.5 tracking-wide">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};
