"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useLanguage, LanguageSwitcherButton } from "../context/LanguageContext";
import ProfileModal from "./ProfileModal";
import { API_BASE, getAuthHeaders } from "../lib/api";
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
  const { t, language } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();

  const [profileModalOpen, setProfileModalOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: "POST",
        headers: getAuthHeaders(),
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
      <header className="bg-white/95 dark:bg-[#0c0919]/95 backdrop-blur-xl border-b border-amber-500/20 sticky top-0 z-50 w-full transition-colors duration-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            {/* Sacred Brand Identity */}
            <div className="flex items-center space-x-6">
              <Link href={user ? "/chat" : "/"} className="flex items-center space-x-3 group">
                <div className="relative">
                  <div className="absolute inset-0 rounded-2xl bg-amber-500/30 blur-md group-hover:blur-lg transition-all duration-300"></div>
                  <div className="relative w-10 h-10 rounded-2xl overflow-hidden shadow-md shadow-amber-500/25 border border-amber-300/50 group-hover:scale-105 transition-all bg-black shrink-0">
                    <img
                      src="/logo.png"
                      alt="GitaMitra Official Logo"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                <div className="flex items-baseline space-x-2">
                  <span className="text-xl font-bold tracking-tight text-stone-900 dark:text-stone-100 font-serif">
                    {language === "hi" ? (
                      <>गीता<span className="text-amber-600 dark:text-amber-400">मित्र</span></>
                    ) : (
                      <>Gita<span className="text-amber-600 dark:text-amber-400">Mitra</span></>
                    )}
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
                  <span>{t.nav.chat}</span>
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
                  <span>{t.nav.gita}</span>
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
                    <span>{t.nav.settings}</span>
                  </Link>
                )}

                {user?.role === "admin" && (
                  <Link
                    href="/admin"
                    className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full bg-amber-500/20 text-amber-900 dark:text-amber-200 font-bold border border-amber-500/40 hover:bg-amber-500/30 transition-all duration-150"
                  >
                    <Shield className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span>{t.nav.adminPortal}</span>
                  </Link>
                )}
              </nav>
            </div>

            {/* Right Controls */}
            <div className="flex items-center space-x-2 sm:space-x-2.5">
              {/* Bilingual Language Switcher (hidden on mobile phone screens, kept in sidebar) */}
              <LanguageSwitcherButton className="hidden md:inline-flex" />

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                aria-label="Toggle theme"
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-amber-500/25 bg-amber-500/5 hover:bg-amber-500/15 flex items-center justify-center text-amber-600 dark:text-amber-400 transition-colors shrink-0"
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
                    className="flex items-center space-x-2 px-2 sm:px-2.5 py-1 rounded-xl sm:rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200 hover:bg-amber-500/20 transition-colors shrink-0"
                  >
                    {user.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={user.name || "Seeker"}
                        className="w-6 h-6 sm:w-5 sm:h-5 rounded-full object-cover border border-amber-500/40 shrink-0"
                      />
                    ) : (
                      <div className="w-6 h-6 sm:w-5 sm:h-5 rounded-full bg-gradient-to-tr from-amber-600 to-amber-500 text-white font-serif font-bold text-[10px] flex items-center justify-center shrink-0">
                        {(user.name ? user.name[0] : user.email ? user.email[0] : "S").toUpperCase()}
                      </div>
                    )}
                    {(() => {
                      const fullName = user.name?.trim() || user.email?.split("@")[0] || "Seeker";
                      const words = fullName.split(/\s+/);
                      if (words.length >= 2) {
                        return (
                          <div className="flex flex-col text-left leading-tight">
                            <span className="font-serif font-semibold text-[11px] sm:text-xs text-stone-900 dark:text-stone-100 max-w-[75px] sm:max-w-[120px] truncate">
                              {words[0]}
                            </span>
                            <span className="font-serif text-[10px] sm:text-[11px] text-amber-700 dark:text-amber-300 font-medium max-w-[75px] sm:max-w-[120px] truncate">
                              {words.slice(1).join(" ")}
                            </span>
                          </div>
                        );
                      }
                      if (fullName.length > 9) {
                        const mid = Math.ceil(fullName.length / 2);
                        return (
                          <div className="flex flex-col text-left leading-tight">
                            <span className="font-serif font-semibold text-[10px] sm:text-xs text-stone-900 dark:text-stone-100 max-w-[75px] sm:max-w-[120px] truncate">
                              {fullName.slice(0, mid)}
                            </span>
                            <span className="font-serif text-[9px] sm:text-[10px] text-amber-700 dark:text-amber-300 font-medium max-w-[75px] sm:max-w-[120px] truncate">
                              {fullName.slice(mid)}
                            </span>
                          </div>
                        );
                      }
                      return (
                        <span className="font-serif text-xs font-semibold max-w-[80px] sm:max-w-[120px] truncate">
                          {fullName}
                        </span>
                      );
                    })()}
                  </button>
                </div>
              ) : (
                <div className="flex items-center text-xs font-medium">
                  <Link
                    href="/chat"
                    className="px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-white font-semibold shadow-sm hover:opacity-90 active:scale-95 transition-all"
                  >
                    {t.nav.register}
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
