"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import ProfileModal from "./ProfileModal";
import { 
  BookOpen, 
  MessageSquare, 
  Sun, 
  Moon, 
  User as UserIcon,
  Shield,
  Sparkles
} from "lucide-react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();

  const [profileModalOpen, setProfileModalOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: "POST",
        credentials: "include"
      });
    } catch (err) {
      console.error("Logout error", err);
    } finally {
      logout();
      router.push("/login");
    }
  };

  const isChatActive = pathname?.startsWith("/chat");
  const isGitaActive = pathname?.startsWith("/gita");
  const isSettingsActive = pathname?.startsWith("/settings");

  // On full-screen chat page, sidebar manages workspace navigation
  if (isChatActive) {
    return null;
  }

  return (
    <>
      <header className="bg-white/80 dark:bg-[#0c0919]/85 backdrop-blur-xl border-b border-amber-500/20 sticky top-0 z-40 transition-colors duration-200 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            {/* Sacred Brand Identity */}
            <div className="flex items-center space-x-6">
              <Link href={user ? "/chat" : "/"} className="flex items-center space-x-3 group">
                <div className="relative">
                  <div className="absolute inset-0 rounded-2xl bg-amber-500/30 blur-md group-hover:blur-lg transition-all duration-300"></div>
                  <div className="relative w-9 h-9 rounded-2xl bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-400 flex items-center justify-center text-white font-serif font-bold text-lg shadow-md shadow-amber-500/25 border border-amber-300/40 group-hover:scale-105 transition-all">
                    ॐ
                  </div>
                </div>
                <div className="flex items-baseline space-x-2">
                  <span className="text-xl font-bold tracking-tight text-stone-900 dark:text-stone-100 font-serif">
                    Gita<span className="text-amber-600 dark:text-amber-400">Mitra</span>
                  </span>
                  <span className="hidden md:inline-block text-[10px] tracking-wider uppercase font-semibold text-amber-800 dark:text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 font-serif">
                    गीतामित्र
                  </span>
                </div>
              </Link>

              {/* Devotional Navigation Links */}
              <nav className="hidden lg:flex items-center space-x-1.5 text-xs font-medium">
                <Link
                  href="/chat"
                  className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full transition-all duration-150 ${
                    isChatActive
                      ? "bg-amber-500/15 text-amber-900 dark:text-amber-200 font-bold border border-amber-500/30"
                      : "text-stone-600 dark:text-stone-300 hover:text-amber-700 dark:hover:text-amber-300 hover:bg-amber-500/10"
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>Spiritual Dialogue</span>
                </Link>

                <Link
                  href={user ? "/gita" : "/login"}
                  className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full transition-all duration-150 ${
                    isGitaActive
                      ? "bg-amber-500/15 text-amber-900 dark:text-amber-200 font-bold border border-amber-500/30"
                      : "text-stone-600 dark:text-stone-300 hover:text-amber-700 dark:hover:text-amber-300 hover:bg-amber-500/10"
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>Gita Explorer</span>
                </Link>

                {user && (
                  <Link
                    href="/settings"
                    className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full transition-all duration-150 ${
                      isSettingsActive
                        ? "bg-amber-500/15 text-amber-900 dark:text-amber-200 font-bold border border-amber-500/30"
                        : "text-stone-600 dark:text-stone-300 hover:text-amber-700 dark:hover:text-amber-300 hover:bg-amber-500/10"
                    }`}
                  >
                    <Shield className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span>Sanctuary</span>
                  </Link>
                )}

                {user?.role === "admin" && (
                  <Link
                    href="/admin"
                    className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full bg-amber-500/20 text-amber-900 dark:text-amber-200 font-bold border border-amber-500/40 hover:bg-amber-500/30 transition-all duration-150"
                  >
                    <Shield className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span>Admin Portal</span>
                  </Link>
                )}
              </nav>
            </div>

            {/* Right Controls */}
            <div className="flex items-center space-x-2.5">
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                aria-label="Toggle theme"
                className="w-9 h-9 rounded-full border border-amber-500/25 bg-amber-500/5 hover:bg-amber-500/15 flex items-center justify-center text-amber-600 dark:text-amber-400 transition-colors"
                title={`Switch to ${theme === "dark" ? "Light" : "Dark"} mode`}
              >
                {theme === "dark" ? (
                  <Sun className="w-4 h-4 text-amber-400" />
                ) : (
                  <Moon className="w-4 h-4 text-amber-700" />
                )}
              </button>

              {user ? (
                <div className="flex items-center space-x-2 text-xs">
                  <button
                    onClick={() => setProfileModalOpen(true)}
                    className="flex items-center space-x-2 px-3.5 py-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200 hover:bg-amber-500/20 transition-colors"
                  >
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                    <span className="font-serif max-w-[110px] truncate">{user.name || user.email?.split("@")[0]}</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-2 text-xs font-medium">
                  <Link
                    href="/login"
                    className="px-3.5 py-1.5 text-stone-700 dark:text-stone-300 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-white font-semibold shadow-sm hover:opacity-90 active:scale-95 transition-all"
                  >
                    Begin Journey
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Profile Modal */}
      {user && (
        <ProfileModal
          isOpen={profileModalOpen}
          onClose={() => setProfileModalOpen(false)}
          user={user}
          onLogout={handleLogout}
        />
      )}
    </>
  );
}
