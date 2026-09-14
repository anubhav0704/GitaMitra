"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { 
  Plus, 
  MessageSquare, 
  Trash2, 
  X, 
  PanelLeftClose, 
  ChevronUp,
  User as UserIcon,
  BookOpen,
  Sun,
  Moon,
  LogOut,
  Shield,
  Sparkles,
  Search,
  Edit2,
  Check,
  Settings as SettingsIcon
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import ProfileModal from "../ProfileModal";
import { API_BASE } from "../../lib/api";

export interface ConversationItem {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

interface SidebarProps {
  conversations: ConversationItem[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNewChat: () => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
  onRename?: (id: string, newTitle: string) => void;
  isOpen: boolean;
  onClose: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function Sidebar({
  conversations,
  activeId,
  onSelect,
  onNewChat,
  onDelete,
  onRename,
  isOpen,
  onClose,
  isCollapsed = false,
  onToggleCollapse
}: SidebarProps) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();

  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut: Ctrl+K for search, Ctrl+N for new chat
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "n") {
        e.preventDefault();
        onNewChat();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onNewChat]);

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
      setMenuOpen(false);
      router.push("/login");
    }
  };

  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.toLowerCase();
    return conversations.filter((c) => (c.title || "Spiritual Inquiry").toLowerCase().includes(q));
  }, [conversations, searchQuery]);

  const handleStartRename = (conv: ConversationItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(conv.id);
    setEditingTitle(conv.title || "Spiritual Inquiry");
  };

  const handleSaveRename = (id: string, e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (editingTitle.trim() && onRename) {
      onRename(id, editingTitle.trim());
    }
    setEditingId(null);
  };

  const initial = user ? (user.name ? user.name[0] : user.email[0]).toUpperCase() : "S";

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar container - Sacred Temple Drawer */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 h-full max-h-screen flex-shrink-0 bg-[#faf6ee]/95 dark:bg-[#0d091e]/95 backdrop-blur-xl border-r border-amber-500/20 flex flex-col justify-between transition-all duration-300 ease-in-out select-none font-sans ${
          isOpen ? "translate-x-0 w-64" : "-translate-x-full md:translate-x-0"
        } ${
          isCollapsed ? "md:w-0 md:opacity-0 md:pointer-events-none md:border-r-0 overflow-hidden" : "md:w-64"
        }`}
      >
        {/* Top Header: Brand + Collapse button */}
        <div className="p-3.5 border-b border-amber-500/20 flex items-center justify-between flex-shrink-0">
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-400 text-white flex items-center justify-center font-serif text-sm font-bold shadow-xs group-hover:scale-105 transition-transform">
              ॐ
            </div>
            <div className="flex items-baseline space-x-1 font-serif text-sm font-bold tracking-tight text-stone-900 dark:text-white">
              <span>Gita<span className="text-amber-600 dark:text-amber-400">Mitra</span></span>
            </div>
          </Link>

          <div className="flex items-center space-x-1">
            {onToggleCollapse && (
              <button
                onClick={onToggleCollapse}
                className="hidden md:flex p-1.5 text-stone-500 hover:text-amber-600 dark:text-stone-400 dark:hover:text-amber-300 rounded-lg hover:bg-amber-500/10 transition-colors cursor-pointer"
                title="Collapse sidebar"
                aria-label="Collapse sidebar"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={onClose}
              className="md:hidden p-1.5 text-stone-500 hover:text-amber-600 dark:text-stone-400 dark:hover:text-amber-300 rounded-lg hover:bg-amber-500/10 transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* New Inquiry Action Button */}
        <div className="p-3 pb-1 flex-shrink-0 space-y-2">
          <button
            onClick={() => {
              onNewChat();
              onClose();
            }}
            className="w-full flex items-center justify-between px-3.5 py-2.5 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-white text-xs font-semibold rounded-2xl shadow-sm hover:shadow-md hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer group font-serif"
            title="Start new inquiry (Ctrl+N)"
          >
            <div className="flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>New Spiritual Inquiry</span>
            </div>
            <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded-md font-mono">
              Ctrl+N
            </span>
          </button>

          {/* Search Conversations Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-stone-400 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chats (Ctrl+K)..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-amber-500/20 bg-white/60 dark:bg-[#15102a]/70 text-xs text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:border-amber-500 font-sans"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Conversation List / Dialogue History - Separately Scrollable */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-2 space-y-1 custom-scrollbar">
          <div className="px-2.5 py-1.5 text-[11px] font-serif font-bold text-amber-800/80 dark:text-amber-400 uppercase tracking-wider flex items-center justify-between sticky top-0 bg-[#faf6ee]/95 dark:bg-[#0d091e]/95 backdrop-blur-sm z-10">
            <span className="flex items-center gap-1">
              <span>✦</span>
              <span>Recent Dialogues</span>
            </span>
            <span className="text-[10px] text-stone-400 font-normal">{filteredConversations.length}</span>
          </div>

          {filteredConversations.length === 0 ? (
            <div className="text-center py-8 px-4 text-xs text-stone-400 dark:text-stone-500 font-serif">
              {searchQuery ? "No matching inquiries found." : "No inquiries yet. Ask Lord Krishna any dilemma."}
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const isActive = conv.id === activeId;
              const isEditing = editingId === conv.id;

              return (
                <div
                  key={conv.id}
                  onClick={() => {
                    if (!isEditing) {
                      onSelect(conv.id);
                      onClose();
                    }
                  }}
                  className={`group flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer transition-all duration-150 text-xs active:scale-[0.99] ${
                    isActive
                      ? "bg-amber-500/20 dark:bg-amber-500/20 text-amber-950 dark:text-amber-100 font-semibold border-l-2 border-amber-600 dark:border-amber-400 shadow-xs"
                      : "text-stone-700 dark:text-stone-300 hover:bg-amber-500/10 hover:text-amber-900 dark:hover:text-amber-200"
                  }`}
                >
                  {isEditing ? (
                    <form
                      onSubmit={(e) => handleSaveRename(conv.id, e)}
                      className="flex items-center space-x-1 flex-1 min-w-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="text"
                        autoFocus
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onBlur={() => handleSaveRename(conv.id)}
                        className="w-full bg-white dark:bg-black px-1.5 py-0.5 rounded border border-amber-500 text-xs text-stone-900 dark:text-white focus:outline-none"
                      />
                      <button type="submit" className="p-1 text-emerald-600">
                        <Check className="w-3 h-3" />
                      </button>
                    </form>
                  ) : (
                    <>
                      <div className="flex items-center space-x-2.5 truncate flex-1 min-w-0">
                        <MessageSquare className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? "text-amber-600 dark:text-amber-400" : "text-stone-400"}`} />
                        <span className="truncate">{conv.title || "Spiritual Inquiry"}</span>
                      </div>

                      <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-0.5 transition-opacity flex-shrink-0 ml-1">
                        {onRename && (
                          <button
                            onClick={(e) => handleStartRename(conv, e)}
                            className="p-1 hover:text-amber-600 rounded transition-colors text-stone-400"
                            title="Rename inquiry"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        )}
                        <button
                          onClick={(e) => onDelete(conv.id, e)}
                          className="p-1 hover:text-rose-600 rounded transition-colors text-stone-400"
                          title="Delete inquiry"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Bottom Navigation Sections Pinned to Bottom */}
        <div className="mt-auto p-2 border-t border-amber-500/20 flex-shrink-0 space-y-1 bg-[#faf6ee]/95 dark:bg-[#0d091e]/95">
          {/* Gita Explorer Link */}
          <Link
            href="/gita"
            onClick={onClose}
            className={`flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-semibold active:scale-[0.99] transition-all duration-150 font-serif ${
              pathname?.startsWith("/gita")
                ? "bg-amber-500/20 text-amber-900 dark:text-amber-200 border border-amber-500/30"
                : "text-stone-700 dark:text-stone-300 hover:bg-amber-500/10 hover:text-amber-900 dark:hover:text-amber-200"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            <span className="truncate">Gita 700 Verses Explorer</span>
          </Link>

          {/* Personal Memory Sanctuary Link */}
          <Link
            href="/memory"
            onClick={onClose}
            className={`flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-semibold active:scale-[0.99] transition-all duration-150 font-serif ${
              pathname === "/memory"
                ? "bg-amber-500/20 text-amber-900 dark:text-amber-200 border border-amber-500/30"
                : "text-stone-700 dark:text-stone-300 hover:bg-amber-500/10 hover:text-amber-900 dark:hover:text-amber-200"
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            <span className="truncate">Spiritual Memory Sanctuary</span>
          </Link>

          {/* Settings Link */}
          <Link
            href="/settings"
            onClick={onClose}
            className={`flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-semibold active:scale-[0.99] transition-all duration-150 font-serif ${
              pathname === "/settings"
                ? "bg-amber-500/20 text-amber-900 dark:text-amber-200 border border-amber-500/30"
                : "text-stone-700 dark:text-stone-300 hover:bg-amber-500/10 hover:text-amber-900 dark:hover:text-amber-200"
            }`}
          >
            <SettingsIcon className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            <span className="truncate">Settings & Sanctuary</span>
          </Link>

          {/* Admin Portal Link (Only visible to admin users) */}
          {user?.role === "admin" && (
            <Link
              href="/admin"
              onClick={onClose}
              className={`flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-bold active:scale-[0.99] transition-all duration-150 font-serif text-amber-700 dark:text-amber-300 bg-amber-500/15 border border-amber-500/40 hover:bg-amber-500/25 ${
                pathname === "/admin" ? "ring-2 ring-amber-500" : ""
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
              <span className="truncate">Admin Portal</span>
              <span className="ml-auto text-[9px] bg-amber-600 text-white font-sans px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                Admin
              </span>
            </Link>
          )}

          {/* Seeker Profile Button & Popover */}
          <div className="relative pt-1 border-t border-amber-500/10" ref={profileMenuRef}>
            {menuOpen && (
              <div
                className="absolute bottom-full left-0 right-0 mb-2 rounded-2xl bg-white/95 dark:bg-[#15102a]/95 backdrop-blur-xl border border-amber-500/30 shadow-2xl py-1.5 z-50 animate-in fade-in slide-in-from-bottom-2 divide-y divide-amber-500/15"
              >
                {/* User Info Header */}
                <div className="px-3.5 py-2">
                  <p className="text-xs font-serif font-bold text-stone-900 dark:text-white truncate">
                    {user?.name || "Seeker"}
                  </p>
                  <p className="text-[11px] text-stone-500 truncate mt-0.5">
                    {user?.email}
                  </p>
                </div>

                {/* Profile Edit Trigger */}
                <div className="py-1">
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      setProfileModalOpen(true);
                    }}
                    className="w-full flex items-center space-x-2.5 px-3.5 py-2 text-xs text-stone-700 dark:text-stone-300 hover:bg-amber-500/10 hover:text-amber-900 dark:hover:text-amber-200 transition-colors cursor-pointer font-serif"
                  >
                    <UserIcon className="w-3.5 h-3.5 text-stone-400" />
                    <span>Seeker Profile</span>
                  </button>

                  {/* Theme toggle */}
                  <button
                    onClick={() => toggleTheme()}
                    className="w-full flex items-center justify-between px-3.5 py-2 text-xs text-stone-700 dark:text-stone-300 hover:bg-amber-500/10 hover:text-amber-900 dark:hover:text-amber-200 transition-colors cursor-pointer font-serif"
                  >
                    <div className="flex items-center space-x-2.5">
                      {theme === "dark" ? (
                        <Moon className="w-3.5 h-3.5 text-amber-400" />
                      ) : (
                        <Sun className="w-3.5 h-3.5 text-amber-600" />
                      )}
                      <span>Aura: {theme === "dark" ? "Cosmic Night" : "Sacred Dawn"}</span>
                    </div>
                  </button>
                </div>

                {/* Logout Action */}
                <div className="py-1">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-2.5 px-3.5 py-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer font-serif"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Conclude Journey (Logout)</span>
                  </button>
                </div>
              </div>
            )}

            <button
              onClick={() => setMenuOpen((prev) => !prev)}
              className="w-full flex items-center justify-between p-2 rounded-2xl hover:bg-amber-500/10 transition-colors cursor-pointer group"
              title="Seeker Account"
            >
              <div className="flex items-center space-x-2.5 min-w-0">
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-600 to-amber-400 text-white font-serif font-bold text-xs flex items-center justify-center shadow-xs">
                  {initial}
                </div>
                <div className="text-left truncate">
                  <p className="text-xs font-serif font-bold text-stone-900 dark:text-white truncate">
                    {user?.name || "Seeker"}
                  </p>
                  <p className="text-[10px] text-stone-500 dark:text-stone-400 truncate">
                    {user?.email}
                  </p>
                </div>
              </div>
              <ChevronUp className={`w-3.5 h-3.5 text-stone-400 transition-transform ${menuOpen ? "rotate-180" : ""}`} />
            </button>
          </div>
        </div>
      </aside>

      {/* Edit Profile Modal */}
      {profileModalOpen && (
        <ProfileModal
          isOpen={profileModalOpen}
          onClose={() => setProfileModalOpen(false)}
        />
      )}
    </>
  );
}
