"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../context/AuthContext";
import {
  Shield,
  Trash2,
  Edit3,
  ArrowLeft,
  Check,
  X,
  RefreshCw,
  Clock,
  Sparkles,
  Search,
  MessageSquare
} from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { Badge } from "../../components/ui/Badge";
import { Skeleton } from "../../components/ui/Skeleton";
import { EmptyState } from "../../components/ui/EmptyState";
import { MobileNav } from "../../components/layout/MobileNav";
import { api } from "../../lib/api";

interface MemoryItem {
  id: string;
  type: string;
  content: string;
  summary: string | null;
  importance: number;
  confidence: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_accessed_at: string | null;
}

const MEMORY_CATEGORIES = ["ALL", "PROFILE", "GOAL", "EVENT", "PREFERENCE", "CHALLENGE", "CONTEXT"];

export default function MemorySanctuaryPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [memoryEnabled, setMemoryEnabled] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Modals state
  const [editingMemory, setEditingMemory] = useState<MemoryItem | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editImportance, setEditImportance] = useState(3);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // 1. Memory settings
      const settings = await api.memory.getSettings();
      setMemoryEnabled(settings.memory_enabled);

      // 2. Memory items
      const memList = await api.memory.list(true);
      setMemories(memList);
    } catch (err) {
      console.error("Failed to load memories:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const handleToggleMemory = async () => {
    const nextState = !memoryEnabled;
    try {
      await api.memory.updateSettings(nextState);
      setMemoryEnabled(nextState);
      setStatusMessage(nextState ? "Continuous Spiritual Reflection Active" : "Continuous Reflection Paused");
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err) {
      console.error("Failed to update memory settings:", err);
    }
  };

  const handleDeleteMemory = async (id: string) => {
    try {
      await api.memory.delete(id);
      setMemories((prev) => prev.filter((m) => m.id !== id));
      setStatusMessage("Memory Removed");
      setTimeout(() => setStatusMessage(null), 2500);
    } catch (err) {
      console.error("Failed to delete memory:", err);
    }
  };

  const handleClearAll = async () => {
    try {
      await api.memory.clearAll();
      setMemories([]);
      setConfirmClearOpen(false);
      setStatusMessage("All Spiritual Context Purged");
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err) {
      console.error("Failed to clear memories:", err);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingMemory) return;
    try {
      await api.memory.update(editingMemory.id, {
        content: editContent,
        importance: editImportance
      });
      setMemories((prev) =>
        prev.map((m) =>
          m.id === editingMemory.id
            ? { ...m, content: editContent, importance: editImportance, updated_at: new Date().toISOString() }
            : m
        )
      );
      setEditingMemory(null);
      setStatusMessage("Reflection Updated");
      setTimeout(() => setStatusMessage(null), 2500);
    } catch (err) {
      console.error("Failed to update memory:", err);
    }
  };

  const filteredMemories = memories.filter((m) => {
    const matchesCat = activeFilter === "ALL" || m.type.toUpperCase() === activeFilter;
    const matchesSearch =
      !searchQuery.trim() ||
      m.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.summary && m.summary.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-chariot-theme bg-fixed flex flex-col font-sans pb-20 md:pb-8">
      <div className="max-w-4xl mx-auto w-full px-4 py-6 sm:py-8 space-y-6 flex-1">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between">
          <Link
            href="/chat"
            className="inline-flex items-center space-x-2 text-xs font-serif font-bold text-stone-700 dark:text-stone-300 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Dialogue</span>
          </Link>

          <div className="flex items-center space-x-2 font-serif text-xs text-amber-800 dark:text-amber-400">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Spiritual Memory Sanctuary</span>
          </div>
        </div>

        {/* Status Notification Toast */}
        {statusMessage && (
          <div className="p-3 rounded-2xl border border-amber-500/35 bg-amber-500/20 text-amber-950 dark:text-amber-100 font-serif text-xs text-center animate-in fade-in shadow-md">
            ✦ {statusMessage} ✦
          </div>
        )}

        {/* Hero Card */}
        <div className="temple-card p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-amber-500/20 pb-6">
            <div className="space-y-1">
              <div className="flex items-center space-x-2 font-serif text-xs text-amber-800 dark:text-amber-300 font-semibold">
                <Shield className="w-4 h-4 text-amber-500" />
                <span>What GitaMitra Remembers</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold font-serif text-stone-900 dark:text-white">
                Personal Memory Sanctuary
              </h1>
              <p className="text-xs text-stone-700 dark:text-stone-300 max-w-xl leading-relaxed font-sans font-medium">
                GitaMitra remembers useful life situations and goals to make future dialogues deeply personalized. You retain full sovereignty over your data.
              </p>
            </div>

            {/* Toggle Switch */}
            <div className="flex items-center space-x-3 font-serif text-xs">
              <span className="text-amber-900 dark:text-amber-300 font-bold">
                {memoryEnabled ? "Active" : "Paused"}
              </span>
              <button
                onClick={handleToggleMemory}
                className={`w-14 h-8 rounded-full p-1 transition-colors duration-200 ease-in-out cursor-pointer ${
                  memoryEnabled ? "bg-gradient-to-r from-amber-600 to-amber-500" : "bg-stone-300 dark:bg-stone-800"
                }`}
                title={memoryEnabled ? "Pause memories" : "Enable memories"}
              >
                <div
                  className={`w-6 h-6 rounded-full transition-transform duration-200 ease-in-out ${
                    memoryEnabled ? "translate-x-6 bg-white" : "translate-x-0 bg-white"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-serif">
            <div className="p-4 rounded-2xl border border-amber-500/20 bg-amber-500/10 text-center">
              <div className="text-2xl font-bold text-amber-900 dark:text-amber-200">{memories.length}</div>
              <div className="text-[10px] text-stone-600 dark:text-stone-400 uppercase tracking-wider mt-0.5 font-bold">
                Contexts Preserved
              </div>
            </div>
            <div className="p-4 rounded-2xl border border-amber-500/20 bg-amber-500/10 text-center">
              <div className="text-2xl font-bold text-amber-900 dark:text-amber-200">100%</div>
              <div className="text-[10px] text-stone-600 dark:text-stone-400 uppercase tracking-wider mt-0.5 font-bold">
                User Isolated
              </div>
            </div>
            <div className="p-4 rounded-2xl border border-amber-500/20 bg-amber-500/10 text-center">
              <div className="text-2xl font-bold text-amber-900 dark:text-amber-200">Client</div>
              <div className="text-[10px] text-stone-600 dark:text-stone-400 uppercase tracking-wider mt-0.5 font-bold">
                Sovereign Control
              </div>
            </div>
            <div className="p-4 rounded-2xl border border-amber-500/20 bg-amber-500/10 text-center flex items-center justify-center">
              <Button
                variant="danger"
                size="sm"
                onClick={() => setConfirmClearOpen(true)}
                disabled={memories.length === 0}
                className="w-full text-[11px]"
              >
                Purge All
              </Button>
            </div>
          </div>
        </div>

        {/* Search & Filter Row */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5 font-serif text-xs">
              <span className="text-amber-900 dark:text-amber-300 mr-1 font-bold">Filter:</span>
              {MEMORY_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveFilter(cat)}
                  className={`px-3 py-1 rounded-full border transition-colors cursor-pointer text-xs ${
                    activeFilter === cat
                      ? "bg-gradient-to-r from-amber-600 to-amber-500 text-white border-amber-500 font-bold shadow-xs"
                      : "border-amber-500/25 bg-white/80 dark:bg-[#15102a]/85 text-stone-800 dark:text-stone-200 hover:border-amber-500"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* In-Memory Search */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search reflections..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-amber-500/20 bg-white/70 dark:bg-[#15102a]/80 text-xs text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Memories List */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : filteredMemories.length === 0 ? (
            <EmptyState
              icon={Shield}
              title={searchQuery ? "No matching reflections" : "No memories preserved yet"}
              description="As you engage in dialogue with GitaMitra, your aspirations, dilemmas, and goals will be thoughtfully recorded here."
              actionLabel="Start a Dialogue"
              onAction={() => router.push("/chat")}
            />
          ) : (
            filteredMemories.map((mem) => (
              <div
                key={mem.id}
                className="temple-card p-4 sm:p-5 hover:border-amber-500/50 transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <Badge variant={mem.type === "GOAL" ? "saffron" : mem.type === "PROFILE" ? "gold" : "stone"}>
                      {mem.type}
                    </Badge>
                    <span className="text-[10px] text-stone-500 dark:text-stone-400 font-serif">
                      Importance: {"★".repeat(mem.importance)}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm font-serif font-medium text-stone-900 dark:text-white leading-relaxed">
                    &quot;{mem.content}&quot;
                  </p>

                  <div className="flex items-center space-x-3 text-[10px] text-stone-500 dark:text-stone-400 font-sans">
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(mem.created_at).toLocaleDateString()}</span>
                    </span>
                    {mem.summary && <span className="truncate italic">Summary: {mem.summary}</span>}
                  </div>
                </div>

                <div className="flex items-center space-x-2 self-end sm:self-center flex-shrink-0">
                  <button
                    onClick={() => {
                      setEditingMemory(mem);
                      setEditContent(mem.content);
                      setEditImportance(mem.importance);
                    }}
                    className="p-2 rounded-xl text-stone-500 hover:text-amber-600 hover:bg-amber-500/10 transition-colors cursor-pointer"
                    title="Edit reflection"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteMemory(mem.id)}
                    className="p-2 rounded-xl text-stone-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                    title="Remove context"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Edit Memory Modal */}
      {editingMemory && (
        <Modal
          isOpen={!!editingMemory}
          onClose={() => setEditingMemory(null)}
          title="Edit Spiritual Memory"
          description="Adjust the content or importance level of this preserved context."
        >
          <div className="space-y-4 font-serif">
            <div>
              <label className="block text-xs font-bold text-stone-800 dark:text-stone-200 mb-1">
                Reflection Content
              </label>
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={3}
                className="w-full rounded-2xl border border-amber-500/30 px-3.5 py-2.5 text-xs sm:text-sm bg-white/70 dark:bg-[#15102a]/80 text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:border-amber-500 font-sans"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1 text-xs">
                <span className="font-bold text-stone-800 dark:text-stone-200">Importance Weight</span>
                <span className="text-amber-600 font-bold">{editImportance} / 5</span>
              </div>
              <input
                type="range"
                min={1}
                max={5}
                value={editImportance}
                onChange={(e) => setEditImportance(Number(e.target.value))}
                className="w-full accent-amber-600"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-amber-500/15">
              <Button variant="ghost" size="sm" onClick={() => setEditingMemory(null)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleSaveEdit}>
                Save Changes
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Clear All Confirmation Modal */}
      {confirmClearOpen && (
        <Modal
          isOpen={confirmClearOpen}
          onClose={() => setConfirmClearOpen(false)}
          title="Purge All Memories?"
          description="Are you sure you wish to delete all remembered context? This action cannot be undone, but your conversation histories will remain safe."
        >
          <div className="flex items-center justify-end space-x-2 pt-4">
            <Button variant="ghost" size="sm" onClick={() => setConfirmClearOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={handleClearAll}>
              Yes, Purge Memories
            </Button>
          </div>
        </Modal>
      )}

      <MobileNav />
    </div>
  );
}
