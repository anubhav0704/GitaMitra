"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ShieldAlert, 
  Users, 
  Activity, 
  BookOpen, 
  Search, 
  ThumbsUp, 
  Server, 
  History, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  ArrowLeft,
  Lock,
  UserCheck,
  UserX,
  Sparkles,
  BarChart3,
  Database,
  Eye,
  Download,
  MessageSquare,
  Brain,
  Mic,
  FileJson,
  X,
  ChevronRight,
  ChevronLeft,
  Key,
  Shield,
  Copy,
  Check
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { API_BASE, getAuthHeaders } from "../../lib/api";

export default function AdminDashboardPage() {
  const { user, login: updateAuthUser, loading: authLoading } = useAuth();
  const { theme } = useTheme();

  const [activeTab, setActiveTab] = useState<
    "overview" | "users" | "database" | "conversations" | "memories" | "voice" | "gita" | "rag" | "feedback" | "health" | "audit"
  >("overview");
  const [period, setPeriod] = useState<"24h" | "7d" | "30d" | "90d">("30d");

  // Overview metrics & health
  const [metrics, setMetrics] = useState<any>(null);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [gitaHealth, setGitaHealth] = useState<any>(null);
  const [ragStats, setRagStats] = useState<any>(null);
  const [feedbackSummary, setFeedbackSummary] = useState<any>(null);
  const [componentHealth, setComponentHealth] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // Database explorer state
  const [tablesList, setTablesList] = useState<any[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>("users");
  const [tableData, setTableData] = useState<any>({ rows: [], columns: [], total_count: 0 });
  const [tableSkip, setTableSkip] = useState(0);
  const [tableSearch, setTableSearch] = useState("");
  const [tableLoading, setTableLoading] = useState(false);

  // User Vault (Everything) state
  const [selectedUserVault, setSelectedUserVault] = useState<any>(null);
  const [vaultLoading, setVaultLoading] = useState(false);
  const [vaultActiveSection, setVaultActiveSection] = useState<"convs" | "memories" | "prefs" | "feedback" | "voice">("convs");

  // Platform Conversations state
  const [allConversations, setAllConversations] = useState<any[]>([]);
  const [convSearch, setConvSearch] = useState("");
  const [selectedConvMessages, setSelectedConvMessages] = useState<{ id: string; title: string; messages: any[] } | null>(null);

  // Platform Memories state
  const [allMemories, setAllMemories] = useState<any[]>([]);
  const [memoryTypeFilter, setMemoryTypeFilter] = useState<string>("");

  // Platform Voice Sessions state
  const [allVoiceSessions, setAllVoiceSessions] = useState<any[]>([]);

  // Row JSON Modal state
  const [inspectRowData, setInspectRowData] = useState<{ title: string; data: any } | null>(null);
  const [copiedJson, setCopiedJson] = useState(false);

  // Claim admin state
  const [claimKey, setClaimKey] = useState("");
  const [claimLoading, setClaimLoading] = useState(false);
  const [claimMsg, setClaimMsg] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchAdminData = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const [mRes, uRes, gRes, rRes, fRes, hRes, aRes, tRes] = await Promise.all([
        fetch(`${API_BASE}/admin/metrics?period=${period}`, { headers: getAuthHeaders(), credentials: "include" }),
        fetch(`${API_BASE}/admin/users?limit=100`, { headers: getAuthHeaders(), credentials: "include" }),
        fetch(`${API_BASE}/admin/gita/health`, { headers: getAuthHeaders(), credentials: "include" }),
        fetch(`${API_BASE}/admin/rag/stats`, { headers: getAuthHeaders(), credentials: "include" }),
        fetch(`${API_BASE}/admin/feedback`, { headers: getAuthHeaders(), credentials: "include" }),
        fetch(`${API_BASE}/admin/system/health`, { headers: getAuthHeaders(), credentials: "include" }),
        fetch(`${API_BASE}/admin/audit-logs`, { headers: getAuthHeaders(), credentials: "include" }),
        fetch(`${API_BASE}/admin/database/tables`, { headers: getAuthHeaders(), credentials: "include" })
      ]);

      if (mRes.status === 403 || uRes.status === 403) {
        setErrorMsg("Administrative privileges required to access this portal.");
        setIsLoading(false);
        return;
      }

      if (mRes.ok) setMetrics(await mRes.json());
      if (uRes.ok) setUsersList(await uRes.json());
      if (gRes.ok) setGitaHealth(await gRes.json());
      if (rRes.ok) setRagStats(await rRes.json());
      if (fRes.ok) setFeedbackSummary(await fRes.json());
      if (hRes.ok) setComponentHealth(await hRes.json());
      if (aRes.ok) setAuditLogs(await aRes.json());
      if (tRes.ok) setTablesList(await tRes.json());
    } catch (err: any) {
      console.error("Admin data fetch error:", err);
      setErrorMsg("Failed to connect to GitaMitra Administrative Service.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchAdminData();
    }
  }, [user, period]);

  // Fetch table rows when table or pagination changes
  const fetchTableData = async (tableName: string, skip = 0, search = "") => {
    setTableLoading(true);
    try {
      let url = `${API_BASE}/admin/database/table/${tableName}?skip=${skip}&limit=50`;
      if (search.trim()) {
        url += `&search=${encodeURIComponent(search.trim())}`;
      }
      const res = await fetch(url, { headers: getAuthHeaders(), credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setTableData(data);
      }
    } catch (err) {
      console.error("Table data fetch error", err);
    } finally {
      setTableLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "database") {
      fetchTableData(selectedTable, tableSkip, tableSearch);
    } else if (activeTab === "conversations") {
      fetchConversationsData();
    } else if (activeTab === "memories") {
      fetchMemoriesData();
    } else if (activeTab === "voice") {
      fetchVoiceData();
    }
  }, [activeTab, selectedTable, tableSkip]);

  const fetchConversationsData = async () => {
    try {
      let url = `${API_BASE}/admin/conversations/all?limit=100`;
      if (convSearch.trim()) url += `&search=${encodeURIComponent(convSearch.trim())}`;
      const res = await fetch(url, { headers: getAuthHeaders(), credentials: "include" });
      if (res.ok) setAllConversations(await res.json());
    } catch (err) {
      console.error("Conversations fetch error", err);
    }
  };

  const fetchMemoriesData = async () => {
    try {
      let url = `${API_BASE}/admin/memories/all?limit=100`;
      if (memoryTypeFilter) url += `&type_filter=${memoryTypeFilter}`;
      const res = await fetch(url, { headers: getAuthHeaders(), credentials: "include" });
      if (res.ok) setAllMemories(await res.json());
    } catch (err) {
      console.error("Memories fetch error", err);
    }
  };

  const fetchVoiceData = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/voice-sessions/all?limit=100`, { headers: getAuthHeaders(), credentials: "include" });
      if (res.ok) setAllVoiceSessions(await res.json());
    } catch (err) {
      console.error("Voice sessions fetch error", err);
    }
  };

  // Inspect User Vault (Everything)
  const openUserVault = async (userId: string) => {
    setVaultLoading(true);
    setSelectedUserVault(null);
    try {
      const res = await fetch(`${API_BASE}/admin/users/${userId}/everything`, {
        headers: getAuthHeaders(),
        credentials: "include"
      });
      if (res.ok) {
        setSelectedUserVault(await res.json());
      }
    } catch (err) {
      console.error("User vault fetch error", err);
    } finally {
      setVaultLoading(false);
    }
  };

  // View conversation messages
  const openConversationMessages = async (convId: string, title: string) => {
    try {
      const res = await fetch(`${API_BASE}/admin/conversations/${convId}/messages`, {
        headers: getAuthHeaders(),
        credentials: "include"
      });
      if (res.ok) {
        const msgs = await res.json();
        setSelectedConvMessages({ id: convId, title, messages: msgs });
      }
    } catch (err) {
      console.error("Conversation messages fetch error", err);
    }
  };

  // Export full database dump
  const handleExportFullDatabase = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/database/export-all`, {
        method: "POST",
        headers: getAuthHeaders(),
        credentials: "include"
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `gitamitra_full_database_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
    } catch (err) {
      alert("Failed to export full database dump.");
    }
  };

  // Toggle user active status
  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`${API_BASE}/admin/users/${userId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        credentials: "include",
        body: JSON.stringify({ is_active: !currentStatus })
      });
      if (res.ok) fetchAdminData();
    } catch (err) {
      console.error("Status update error", err);
    }
  };

  // Toggle user role
  const toggleUserRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === "admin" ? "user" : "admin";
    try {
      const res = await fetch(`${API_BASE}/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        credentials: "include",
        body: JSON.stringify({ role: newRole })
      });
      if (res.ok) fetchAdminData();
    } catch (err) {
      console.error("Role update error", err);
    }
  };

  // Trigger dataset embedding rebuild
  const triggerEmbeddingRebuild = async () => {
    if (!confirm("Are you sure you want to trigger a full Gita embedding dataset rebuild?")) return;
    try {
      const res = await fetch(`${API_BASE}/admin/gita/rebuild`, {
        method: "POST",
        headers: getAuthHeaders(),
        credentials: "include"
      });
      if (res.ok) {
        alert("Gita embedding dataset rebuild initiated successfully.");
        fetchAdminData();
      }
    } catch (err) {
      console.error("Rebuild error", err);
    }
  };

  // Claim Admin Privileges
  const handleClaimAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setClaimLoading(true);
    setClaimMsg(null);
    try {
      const res = await fetch(`${API_BASE}/admin/claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        credentials: "include",
        body: JSON.stringify({ setup_key: claimKey.trim() })
      });
      const data = await res.json();
      if (res.ok) {
        setClaimMsg(data.message);
        if (user) {
          updateAuthUser({ ...user, role: "admin" });
        }
        setTimeout(() => {
          setErrorMsg(null);
          fetchAdminData();
        }, 1200);
      } else {
        setClaimMsg(data.detail || "Failed to claim administrator privileges.");
      }
    } catch (err: any) {
      setClaimMsg("Connection error while attempting to claim admin access.");
    } finally {
      setClaimLoading(false);
    }
  };

  const copyJsonToClipboard = (data: any) => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf6ee] dark:bg-[#090714] text-amber-900 dark:text-amber-200 font-serif">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs uppercase tracking-widest">Authenticating Admin Session...</p>
        </div>
      </div>
    );
  }

  // Not an admin or access restricted view with claim admin capability
  if (errorMsg) {
    return (
      <div className="min-h-screen bg-chariot-theme text-stone-900 dark:text-stone-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 rounded-3xl temple-card text-center space-y-5 shadow-2xl">
          <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-xl font-bold font-serif">Administrative Portal Locked</h2>
          <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed font-sans font-medium">
            {errorMsg}
          </p>

          {/* Claim Administrator Form */}
          <form onSubmit={handleClaimAdmin} className="space-y-3 pt-2 text-left font-serif border-t border-amber-500/20">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-amber-900 dark:text-amber-300">
              Claim Administrator Access
            </label>
            <div className="relative font-sans">
              <Key className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
              <input
                type="password"
                placeholder="Enter admin setup key..."
                value={claimKey}
                onChange={(e) => setClaimKey(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-amber-500/30 bg-white/80 dark:bg-[#15102a]/80 text-xs text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:border-amber-500 font-sans"
              />
            </div>
            {claimMsg && (
              <p className="text-[11px] text-amber-700 dark:text-amber-400 font-sans font-medium">
                {claimMsg}
              </p>
            )}
            <button
              type="submit"
              disabled={claimLoading}
              className="w-full py-2 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold font-serif shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              {claimLoading ? "Validating Credentials..." : "Elevate to Administrator"}
            </button>
          </form>

          <div className="pt-2">
            <Link
              href="/chat"
              className="inline-flex items-center space-x-2 text-xs font-serif text-amber-700 dark:text-amber-400 hover:underline"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Spiritual Dialogue</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf6ee] dark:bg-[#090714] text-stone-900 dark:text-stone-100 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-amber-500/20 pb-5">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl overflow-hidden shadow-md border border-amber-500/30 bg-black shrink-0">
              <img src="/logo.png" alt="GitaMitra Official Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-bold font-serif">GitaMitra Command Center</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30 font-serif">
                  SUPER ADMIN
                </span>
              </div>
              <p className="text-xs text-stone-600 dark:text-stone-400 font-sans">
                Full Database Access, User Vaults, RAG Health, Real-time Governance & Telemetry
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              onClick={handleExportFullDatabase}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300 hover:bg-amber-500/20 text-xs font-serif font-bold transition-all cursor-pointer shadow-xs"
              title="Download full JSON database dump"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Full DB</span>
            </button>
            <button
              onClick={fetchAdminData}
              className="p-2 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 transition-colors cursor-pointer"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            </button>
            <Link
              href="/chat"
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-white text-xs font-serif font-bold shadow-md shadow-amber-500/20 hover:opacity-95 active:scale-95 transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to App</span>
            </Link>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex overflow-x-auto scrollbar-none gap-2 pb-2 border-b border-amber-500/15 text-xs font-serif font-semibold">
          {[
            { id: "overview", label: "Overview", icon: Activity },
            { id: "database", label: "Database Explorer", icon: Database, badge: tablesList.length },
            { id: "users", label: "User Management & Vaults", icon: Users, badge: usersList.length },
            { id: "conversations", label: "All Conversations", icon: MessageSquare },
            { id: "memories", label: "All Seeker Memories", icon: Brain },
            { id: "voice", label: "Voice Sessions", icon: Mic },
            { id: "gita", label: "Gita Knowledge Base", icon: BookOpen },
            { id: "rag", label: "RAG Monitor", icon: Search },
            { id: "feedback", label: "User Feedback", icon: ThumbsUp },
            { id: "health", label: "Component Health", icon: Server },
            { id: "audit", label: "Audit Logs", icon: History }
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                  active
                    ? "bg-amber-500/20 text-amber-900 dark:text-amber-200 border border-amber-500/40 shadow-xs"
                    : "text-stone-600 dark:text-stone-400 hover:bg-amber-500/10"
                }`}
              >
                <Icon className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/20 text-amber-800 dark:text-amber-300 font-mono">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab 1: System Overview */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-base font-bold font-serif text-amber-900 dark:text-amber-300">Metrics Overview</h2>
              <div className="flex items-center space-x-1 border border-amber-500/30 rounded-xl p-1 bg-white/50 dark:bg-[#120e24]/50">
                {(["24h", "7d", "30d", "90d"] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={`px-3 py-1 rounded-lg text-xs font-serif transition-colors cursor-pointer ${
                      period === p ? "bg-amber-500 text-white font-bold" : "text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-white/80 dark:bg-[#15102a]/80 border border-amber-500/20 shadow-md">
                <span className="text-xs text-stone-500 dark:text-stone-400 font-serif">Total Users</span>
                <p className="text-2xl font-bold font-serif text-amber-900 dark:text-amber-200 mt-1">
                  {metrics?.users_total ?? 0}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white/80 dark:bg-[#15102a]/80 border border-amber-500/20 shadow-md">
                <span className="text-xs text-stone-500 dark:text-stone-400 font-serif">Active (Period)</span>
                <p className="text-2xl font-bold font-serif text-amber-900 dark:text-amber-200 mt-1">
                  {metrics?.users_active ?? 0}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white/80 dark:bg-[#15102a]/80 border border-amber-500/20 shadow-md">
                <span className="text-xs text-stone-500 dark:text-stone-400 font-serif">Conversations</span>
                <p className="text-2xl font-bold font-serif text-amber-900 dark:text-amber-200 mt-1">
                  {metrics?.conversations ?? 0}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white/80 dark:bg-[#15102a]/80 border border-amber-500/20 shadow-md">
                <span className="text-xs text-stone-500 dark:text-stone-400 font-serif">Messages Processed</span>
                <p className="text-2xl font-bold font-serif text-amber-900 dark:text-amber-200 mt-1">
                  {metrics?.messages ?? 0}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-white/80 dark:bg-[#15102a]/80 border border-amber-500/20 shadow-md">
                <span className="text-xs text-stone-500 dark:text-stone-400 font-serif">Active Memories</span>
                <p className="text-xl font-bold font-serif text-emerald-600 dark:text-emerald-400 mt-1">
                  {metrics?.memories_active ?? 0}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white/80 dark:bg-[#15102a]/80 border border-amber-500/20 shadow-md">
                <span className="text-xs text-stone-500 dark:text-stone-400 font-serif">Voice Sessions</span>
                <p className="text-xl font-bold font-serif text-blue-600 dark:text-blue-400 mt-1">
                  {metrics?.voice_sessions ?? 0}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white/80 dark:bg-[#15102a]/80 border border-amber-500/20 shadow-md">
                <span className="text-xs text-stone-500 dark:text-stone-400 font-serif">Error Rate</span>
                <p className="text-xl font-bold font-serif text-amber-600 dark:text-amber-400 mt-1">
                  {metrics?.runtime_metrics?.error_rate_pct ?? 0}%
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Database Explorer (Full Access to All Tables) */}
        {activeTab === "database" && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h2 className="text-base font-bold font-serif text-amber-900 dark:text-amber-300">
                  Database Table Explorer
                </h2>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Direct administrative inspection across all tables and relational models
                </p>
              </div>

              <button
                onClick={handleExportFullDatabase}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-amber-600 text-white font-serif text-xs font-bold hover:bg-amber-500 shadow-sm cursor-pointer transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Full Database Dump (JSON)</span>
              </button>
            </div>

            {/* Table Selector Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2.5">
              {tablesList.map((tbl) => {
                const active = selectedTable === tbl.table_name;
                return (
                  <button
                    key={tbl.table_name}
                    onClick={() => {
                      setSelectedTable(tbl.table_name);
                      setTableSkip(0);
                      setTableSearch("");
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      active
                        ? "bg-amber-500/25 border-amber-500 shadow-sm"
                        : "bg-white/70 dark:bg-[#15102a]/70 border-amber-500/20 hover:border-amber-500/40"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-mono text-xs font-bold text-amber-900 dark:text-amber-200 truncate">
                        {tbl.table_name}
                      </span>
                      <span className="px-1.5 py-0.5 rounded-md text-[10px] font-mono bg-amber-500/20 text-amber-800 dark:text-amber-300 font-bold">
                        {tbl.row_count}
                      </span>
                    </div>
                    <p className="text-[10px] text-stone-500 dark:text-stone-400 mt-1 line-clamp-1 font-sans">
                      {tbl.description}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Table Controls (Search & Pagination) */}
            <div className="p-4 rounded-2xl border border-amber-500/20 bg-white/80 dark:bg-[#15102a]/80 shadow-md space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="relative w-full sm:w-72">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-stone-400" />
                  <input
                    type="text"
                    placeholder={`Search in ${selectedTable}...`}
                    value={tableSearch}
                    onChange={(e) => setTableSearch(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && fetchTableData(selectedTable, 0, tableSearch)}
                    className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-amber-500/30 bg-white/90 dark:bg-[#120e26]/90 text-xs text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:border-amber-500 font-sans"
                  />
                </div>

                <div className="flex items-center space-x-2 text-xs font-serif">
                  <span className="text-stone-500">
                    Showing {tableData.rows.length} of {tableData.total_count} records
                  </span>
                  <button
                    disabled={tableSkip === 0 || tableLoading}
                    onClick={() => setTableSkip(Math.max(0, tableSkip - 50))}
                    className="p-1.5 rounded-lg border border-amber-500/30 hover:bg-amber-500/15 disabled:opacity-30 cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    disabled={tableSkip + 50 >= tableData.total_count || tableLoading}
                    onClick={() => setTableSkip(tableSkip + 50)}
                    className="p-1.5 rounded-lg border border-amber-500/30 hover:bg-amber-500/15 disabled:opacity-30 cursor-pointer"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Table Data Viewer */}
              <div className="overflow-x-auto rounded-xl border border-amber-500/20">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-amber-500/10 font-serif text-stone-700 dark:text-stone-300 border-b border-amber-500/20">
                    <tr>
                      <th className="p-2.5">Inspect</th>
                      {tableData.columns?.slice(0, 7).map((col: string) => (
                        <th key={col} className="p-2.5">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-500/10">
                    {tableLoading ? (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-xs font-serif text-amber-700 dark:text-amber-300">
                          <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                          Loading {selectedTable} rows...
                        </td>
                      </tr>
                    ) : tableData.rows.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-6 text-center text-xs font-serif text-stone-500">
                          No records found in table `{selectedTable}`.
                        </td>
                      </tr>
                    ) : (
                      tableData.rows.map((row: any, idx: number) => (
                        <tr key={idx} className="hover:bg-amber-500/5 transition-colors">
                          <td className="p-2.5">
                            <button
                              onClick={() => setInspectRowData({ title: `${selectedTable} Record`, data: row })}
                              className="p-1 rounded-md text-amber-700 dark:text-amber-400 hover:bg-amber-500/15 cursor-pointer"
                              title="Inspect Full JSON"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          </td>
                          {tableData.columns?.slice(0, 7).map((col: string) => (
                            <td key={col} className="p-2.5 max-w-[200px] truncate text-stone-700 dark:text-stone-300">
                              {typeof row[col] === "object" ? JSON.stringify(row[col]) : String(row[col] ?? "—")}
                            </td>
                          ))}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: User Management & Seeker Vaults */}
        {activeTab === "users" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-base font-bold font-serif text-amber-900 dark:text-amber-300">Registered Seekers</h2>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Inspect individual seeker vaults, full transcripts, extracted memories, and authorization roles
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-amber-800 dark:text-amber-300">
                Total Seekers: {usersList.length}
              </span>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-amber-500/20 bg-white/80 dark:bg-[#15102a]/80 shadow-md">
              <table className="w-full text-left text-xs">
                <thead className="bg-amber-500/10 font-serif text-stone-700 dark:text-stone-300 border-b border-amber-500/20">
                  <tr>
                    <th className="p-3">Seeker</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Role</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Created</th>
                    <th className="p-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-500/10">
                  {usersList.map((u) => (
                    <tr key={u.id} className="hover:bg-amber-500/5">
                      <td className="p-3 font-semibold text-stone-900 dark:text-white flex items-center gap-2">
                        {u.name || "Seeker"}
                      </td>
                      <td className="p-3 font-mono text-stone-600 dark:text-stone-400">{u.email}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          u.role === "admin" ? "bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-300" : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300"
                        }`}>
                          {u.role || "user"}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          u.is_active ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300" : "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
                        }`}>
                          {u.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-[11px] text-stone-500">
                        {u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"}
                      </td>
                      <td className="p-3 flex items-center space-x-2">
                        <button
                          onClick={() => openUserVault(u.id)}
                          className="px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/35 text-amber-900 dark:text-amber-200 text-[11px] font-serif font-bold transition-colors cursor-pointer flex items-center gap-1"
                          title="Open Seeker Vault"
                        >
                          <Database className="w-3 h-3" />
                          <span>Inspect Vault</span>
                        </button>
                        <button
                          onClick={() => toggleUserStatus(u.id, u.is_active)}
                          className="px-2 py-1 rounded-lg border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-[11px] font-serif transition-colors cursor-pointer"
                        >
                          {u.is_active ? "Deactivate" : "Activate"}
                        </button>
                        <button
                          onClick={() => toggleUserRole(u.id, u.role)}
                          className="px-2 py-1 rounded-lg border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 text-[11px] font-serif transition-colors cursor-pointer"
                        >
                          Role
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 4: All Platform Conversations */}
        {activeTab === "conversations" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-base font-bold font-serif text-amber-900 dark:text-amber-300">Platform Conversations</h2>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Global view of all seeker spiritual dialogues and message counts
                </p>
              </div>

              <div className="relative w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-stone-400" />
                <input
                  type="text"
                  placeholder="Search seeker or title..."
                  value={convSearch}
                  onChange={(e) => setConvSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && fetchConversationsData()}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-amber-500/30 bg-white/80 dark:bg-[#15102a]/80 text-xs text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:border-amber-500 font-sans"
                />
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-amber-500/20 bg-white/80 dark:bg-[#15102a]/80 shadow-md">
              <table className="w-full text-left text-xs">
                <thead className="bg-amber-500/10 font-serif text-stone-700 dark:text-stone-300 border-b border-amber-500/20">
                  <tr>
                    <th className="p-3">Title</th>
                    <th className="p-3">Seeker Email</th>
                    <th className="p-3">Messages</th>
                    <th className="p-3">Updated</th>
                    <th className="p-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-500/10">
                  {allConversations.map((c) => (
                    <tr key={c.id} className="hover:bg-amber-500/5">
                      <td className="p-3 font-semibold text-stone-900 dark:text-white max-w-xs truncate">
                        {c.title || "Spiritual Inquiry"}
                      </td>
                      <td className="p-3 font-mono text-stone-600 dark:text-stone-400">{c.user_email}</td>
                      <td className="p-3 font-bold font-mono text-amber-700 dark:text-amber-400">{c.message_count}</td>
                      <td className="p-3 font-mono text-[11px] text-stone-500">
                        {c.updated_at ? new Date(c.updated_at).toLocaleString() : "—"}
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => openConversationMessages(c.id, c.title)}
                          className="px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-[11px] font-serif font-bold transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          <span>View Dialogue</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 5: All Seeker Memories */}
        {activeTab === "memories" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h2 className="text-base font-bold font-serif text-amber-900 dark:text-amber-300">Seeker Memory Bank</h2>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Global repository of isolated seeker memories extracted across turns
                </p>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                {["", "PROFILE", "GOAL", "CHALLENGE", "PREFERENCE", "EVENT", "CONTEXT"].map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      setMemoryTypeFilter(t);
                    }}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-serif transition-colors cursor-pointer ${
                      memoryTypeFilter === t
                        ? "bg-amber-600 text-white font-bold"
                        : "bg-amber-500/10 text-stone-600 dark:text-stone-300 hover:bg-amber-500/20"
                    }`}
                  >
                    {t || "ALL TYPES"}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {allMemories.map((m) => (
                <div key={m.id} className="p-4 rounded-2xl border border-amber-500/20 bg-white/80 dark:bg-[#15102a]/80 shadow-xs space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-serif bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30">
                      {m.type}
                    </span>
                    <span className="text-[10px] font-mono text-stone-400">
                      Score: {m.importance}/5
                    </span>
                  </div>
                  <p className="text-xs font-sans text-stone-900 dark:text-stone-100 font-medium line-clamp-3">
                    {m.content}
                  </p>
                  <div className="pt-2 border-t border-amber-500/10 flex justify-between items-center text-[10px] text-stone-500 font-mono">
                    <span className="truncate max-w-[150px]">{m.user_email}</span>
                    <span>{m.created_at ? new Date(m.created_at).toLocaleDateString() : ""}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 6: Voice Sessions */}
        {activeTab === "voice" && (
          <div className="space-y-4">
            <h2 className="text-base font-bold font-serif text-amber-900 dark:text-amber-300">Voice Telemetry Sessions</h2>
            <div className="overflow-x-auto rounded-2xl border border-amber-500/20 bg-white/80 dark:bg-[#15102a]/80 shadow-md">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-amber-500/10 font-serif text-stone-700 dark:text-stone-300 border-b border-amber-500/20">
                  <tr>
                    <th className="p-3">Seeker Email</th>
                    <th className="p-3">Language</th>
                    <th className="p-3">Duration (ms)</th>
                    <th className="p-3">STT Provider</th>
                    <th className="p-3">TTS Provider</th>
                    <th className="p-3">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-500/10">
                  {allVoiceSessions.map((v) => (
                    <tr key={v.id} className="hover:bg-amber-500/5">
                      <td className="p-3 text-stone-900 dark:text-white">{v.user_email}</td>
                      <td className="p-3 font-bold uppercase text-amber-700 dark:text-amber-300">{v.input_language}</td>
                      <td className="p-3">{v.input_duration_ms} ms</td>
                      <td className="p-3 text-stone-600 dark:text-stone-400">{v.stt_provider || "—"}</td>
                      <td className="p-3 text-stone-600 dark:text-stone-400">{v.tts_provider || "—"}</td>
                      <td className="p-3 text-stone-500 text-[11px]">{v.created_at ? new Date(v.created_at).toLocaleString() : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 7: Gita Knowledge Base */}
        {activeTab === "gita" && (
          <div className="space-y-6">
            <h2 className="text-base font-bold font-serif text-amber-900 dark:text-amber-300">Dataset & Embedding Status</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-white/80 dark:bg-[#15102a]/80 border border-amber-500/20 shadow-md">
                <span className="text-xs text-stone-500 dark:text-stone-400 font-serif">Chapters</span>
                <p className="text-2xl font-bold font-serif text-amber-900 dark:text-amber-200 mt-1">
                  {gitaHealth?.chapters ?? 18} / 18
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white/80 dark:bg-[#15102a]/80 border border-amber-500/20 shadow-md">
                <span className="text-xs text-stone-500 dark:text-stone-400 font-serif">Total Verses</span>
                <p className="text-2xl font-bold font-serif text-amber-900 dark:text-amber-200 mt-1">
                  {gitaHealth?.total_verses ?? 700}
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white/80 dark:bg-[#15102a]/80 border border-amber-500/20 shadow-md">
                <span className="text-xs text-stone-500 dark:text-stone-400 font-serif">Embeddings Count</span>
                <p className="text-2xl font-bold font-serif text-amber-900 dark:text-amber-200 mt-1">
                  {gitaHealth?.total_embeddings ?? 700}
                </p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white/80 dark:bg-[#15102a]/80 border border-amber-500/20 shadow-md flex justify-between items-center">
              <div>
                <h3 className="font-bold font-serif text-sm">Dataset Maintenance</h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 font-sans mt-0.5">
                  Re-index verse embeddings across 384 dimensions using current dense vector provider.
                </p>
              </div>
              <button
                onClick={triggerEmbeddingRebuild}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 text-white font-serif text-xs font-bold hover:opacity-90 transition-all cursor-pointer shadow-sm"
              >
                Rebuild Embeddings
              </button>
            </div>
          </div>
        )}

        {/* Tab 8: RAG Monitor */}
        {activeTab === "rag" && (
          <div className="space-y-6">
            <h2 className="text-base font-bold font-serif text-amber-900 dark:text-amber-300">Hybrid RAG Search Metrics</h2>
            <div className="p-6 rounded-2xl bg-white/80 dark:bg-[#15102a]/80 border border-amber-500/20 shadow-md space-y-4">
              <div className="flex justify-between items-center border-b border-amber-500/15 pb-3">
                <span className="text-xs font-serif text-stone-600 dark:text-stone-400">Retrieval Strategy</span>
                <span className="text-xs font-bold font-serif text-amber-900 dark:text-amber-200">{ragStats?.retrieval_strategy}</span>
              </div>
              <div className="flex justify-between items-center border-b border-amber-500/15 pb-3">
                <span className="text-xs font-serif text-stone-600 dark:text-stone-400">Average Top Similarity Score</span>
                <span className="text-xs font-bold font-serif text-emerald-600 dark:text-emerald-400">{ragStats?.avg_top_similarity}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-serif text-stone-600 dark:text-stone-400">Popular Topics</span>
                <div className="flex gap-1.5 flex-wrap">
                  {ragStats?.popular_topics?.map((t: string, idx: number) => (
                    <span key={idx} className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/15 text-amber-900 dark:text-amber-200 font-serif border border-amber-500/30">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 9: Feedback Analytics */}
        {activeTab === "feedback" && (
          <div className="space-y-6">
            <h2 className="text-base font-bold font-serif text-amber-900 dark:text-amber-300">User Satisfaction & Feedback</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-white/80 dark:bg-[#15102a]/80 border border-amber-500/20 shadow-md">
                <span className="text-xs text-stone-500 dark:text-stone-400 font-serif">Satisfaction Rate</span>
                <p className="text-2xl font-bold font-serif text-emerald-600 dark:text-emerald-400 mt-1">
                  {feedbackSummary?.satisfaction_rate_pct ?? 100}%
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white/80 dark:bg-[#15102a]/80 border border-amber-500/20 shadow-md">
                <span className="text-xs text-stone-500 dark:text-stone-400 font-serif">Helpful Votes</span>
                <p className="text-2xl font-bold font-serif text-amber-900 dark:text-amber-200 mt-1">
                  {feedbackSummary?.helpful_count ?? 0}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white/80 dark:bg-[#15102a]/80 border border-amber-500/20 shadow-md">
                <span className="text-xs text-stone-500 dark:text-stone-400 font-serif">Unhelpful Votes</span>
                <p className="text-2xl font-bold font-serif text-amber-900 dark:text-amber-200 mt-1">
                  {feedbackSummary?.unhelpful_count ?? 0}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 10: Component Health */}
        {activeTab === "health" && (
          <div className="space-y-4">
            <h2 className="text-base font-bold font-serif text-amber-900 dark:text-amber-300">System Infrastructure Health</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Object.entries(componentHealth?.components || {}).map(([key, val]) => (
                <div key={key} className="p-4 rounded-2xl bg-white/80 dark:bg-[#15102a]/80 border border-amber-500/20 shadow-md flex justify-between items-center">
                  <span className="text-xs font-serif font-bold uppercase tracking-wider">{key.replace("_", " ")}</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold font-serif ${
                    val === "HEALTHY" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300" : "bg-rose-100 text-rose-800"
                  }`}>
                    {val as string}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 11: Audit Logs */}
        {activeTab === "audit" && (
          <div className="space-y-4">
            <h2 className="text-base font-bold font-serif text-amber-900 dark:text-amber-300">Admin Operations History</h2>
            <div className="overflow-x-auto rounded-2xl border border-amber-500/20 bg-white/80 dark:bg-[#15102a]/80 shadow-md">
              <table className="w-full text-left text-xs">
                <thead className="bg-amber-500/10 font-serif text-stone-700 dark:text-stone-300 border-b border-amber-500/20">
                  <tr>
                    <th className="p-3">Timestamp</th>
                    <th className="p-3">Action</th>
                    <th className="p-3">Resource</th>
                    <th className="p-3">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-500/10">
                  {auditLogs.map((log) => (
                    <tr key={log.id}>
                      <td className="p-3 text-stone-500 font-mono">{log.timestamp}</td>
                      <td className="p-3 font-bold text-amber-900 dark:text-amber-200 font-serif">{log.action}</td>
                      <td className="p-3 font-mono text-stone-600 dark:text-stone-400">{log.resource || "—"}</td>
                      <td className="p-3 font-mono text-stone-500">{log.ip_address || "internal"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Seeker Vault Inspector Drawer / Modal */}
      {selectedUserVault && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="max-w-4xl w-full max-h-[90vh] rounded-3xl bg-white dark:bg-[#120e26] border border-amber-500/40 shadow-2xl flex flex-col overflow-hidden">
            {/* Vault Header */}
            <div className="p-5 border-b border-amber-500/20 flex items-center justify-between bg-amber-500/5">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-400 text-white font-serif font-bold text-sm flex items-center justify-center shadow-sm">
                  {selectedUserVault.user_profile.name ? selectedUserVault.user_profile.name[0].toUpperCase() : "S"}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-serif font-bold text-base text-stone-900 dark:text-white">
                      {selectedUserVault.user_profile.name || "Seeker Vault"}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-800 dark:text-amber-300">
                      {selectedUserVault.user_profile.role}
                    </span>
                  </div>
                  <p className="text-xs font-mono text-stone-500">
                    {selectedUserVault.user_profile.email} · ID: {selectedUserVault.user_profile.id}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setInspectRowData({ title: "User Vault Raw JSON", data: selectedUserVault })}
                  className="px-3 py-1.5 rounded-xl border border-amber-500/30 bg-white dark:bg-black text-xs font-serif font-semibold hover:bg-amber-500/10 cursor-pointer"
                >
                  Inspect JSON
                </button>
                <button
                  onClick={() => setSelectedUserVault(null)}
                  className="p-1.5 rounded-full hover:bg-amber-500/15 text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Vault Stats Bar */}
            <div className="grid grid-cols-5 border-b border-amber-500/20 bg-amber-500/5 text-center text-xs py-2.5">
              <div>
                <span className="text-[10px] font-serif text-stone-500 uppercase">Conversations</span>
                <p className="font-bold font-mono text-amber-900 dark:text-amber-200">{selectedUserVault.stats.conversation_count}</p>
              </div>
              <div>
                <span className="text-[10px] font-serif text-stone-500 uppercase">Total Messages</span>
                <p className="font-bold font-mono text-amber-900 dark:text-amber-200">{selectedUserVault.stats.total_messages}</p>
              </div>
              <div>
                <span className="text-[10px] font-serif text-stone-500 uppercase">Memories</span>
                <p className="font-bold font-mono text-emerald-600 dark:text-emerald-400">{selectedUserVault.stats.memory_count}</p>
              </div>
              <div>
                <span className="text-[10px] font-serif text-stone-500 uppercase">Feedbacks</span>
                <p className="font-bold font-mono text-amber-900 dark:text-amber-200">{selectedUserVault.stats.feedback_count}</p>
              </div>
              <div>
                <span className="text-[10px] font-serif text-stone-500 uppercase">Voice Sessions</span>
                <p className="font-bold font-mono text-blue-600 dark:text-blue-400">{selectedUserVault.stats.voice_sessions_count}</p>
              </div>
            </div>

            {/* Vault Section Navigation */}
            <div className="flex border-b border-amber-500/20 px-4 bg-white/50 dark:bg-[#120e26]/50 text-xs font-serif font-semibold gap-2">
              {[
                { id: "convs", label: `Conversations (${selectedUserVault.conversations.length})` },
                { id: "memories", label: `Memories (${selectedUserVault.memories.length})` },
                { id: "prefs", label: "Preferences & Settings" },
                { id: "feedback", label: `Feedbacks (${selectedUserVault.feedbacks.length})` },
                { id: "voice", label: `Voice Logs (${selectedUserVault.voice_sessions.length})` }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setVaultActiveSection(tab.id as any)}
                  className={`py-2.5 px-3 border-b-2 transition-colors cursor-pointer ${
                    vaultActiveSection === tab.id
                      ? "border-amber-500 text-amber-900 dark:text-amber-200 font-bold"
                      : "border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-300"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Vault Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs font-sans max-h-[60vh]">
              {vaultActiveSection === "convs" && (
                <div className="space-y-4">
                  {selectedUserVault.conversations.length === 0 ? (
                    <p className="text-stone-500 text-center py-6 font-serif">No dialogue conversations recorded yet.</p>
                  ) : (
                    selectedUserVault.conversations.map((conv: any) => (
                      <div key={conv.id} className="p-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 space-y-3">
                        <div className="flex justify-between items-start border-b border-amber-500/15 pb-2">
                          <h4 className="font-serif font-bold text-sm text-amber-900 dark:text-amber-200">
                            {conv.title || "Spiritual Inquiry"}
                          </h4>
                          <span className="text-[10px] font-mono text-stone-500">
                            {conv.messages.length} messages · {conv.created_at ? new Date(conv.created_at).toLocaleDateString() : ""}
                          </span>
                        </div>
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                          {conv.messages.map((m: any) => (
                            <div key={m.id} className={`p-2.5 rounded-xl text-xs ${
                              m.role === "assistant"
                                ? "bg-amber-500/10 border border-amber-500/25 text-stone-900 dark:text-amber-100"
                                : "bg-stone-200/80 dark:bg-stone-800 text-stone-800 dark:text-stone-200"
                            }`}>
                              <span className="font-serif font-bold text-[10px] uppercase text-amber-700 dark:text-amber-400 block mb-1">
                                {m.role === "assistant" ? "Lord Krishna" : "Seeker"}
                              </span>
                              <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {vaultActiveSection === "memories" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedUserVault.memories.map((m: any) => (
                    <div key={m.id} className="p-3.5 rounded-2xl border border-amber-500/20 bg-amber-500/5 space-y-1.5">
                      <div className="flex justify-between items-start">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-serif font-bold bg-amber-500/15 text-amber-800 dark:text-amber-300">
                          {m.type}
                        </span>
                        <span className="text-[10px] font-mono text-stone-500">Importance: {m.importance}/5</span>
                      </div>
                      <p className="text-xs font-sans text-stone-800 dark:text-stone-200 font-medium">{m.content}</p>
                      {m.summary && <p className="text-[11px] text-stone-500 italic">Summary: {m.summary}</p>}
                    </div>
                  ))}
                </div>
              )}

              {vaultActiveSection === "prefs" && (
                <div className="p-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 font-mono text-xs">
                  <pre className="whitespace-pre-wrap text-stone-800 dark:text-stone-200">
                    {JSON.stringify(selectedUserVault.preferences, null, 2)}
                  </pre>
                </div>
              )}

              {vaultActiveSection === "feedback" && (
                <div className="space-y-2">
                  {selectedUserVault.feedbacks.map((f: any) => (
                    <div key={f.id} className="p-3 rounded-xl border border-amber-500/20 bg-amber-500/5 flex justify-between items-center text-xs">
                      <div>
                        <span className={`font-bold ${f.is_helpful ? "text-emerald-600" : "text-rose-600"}`}>
                          {f.is_helpful ? "Helpful (Thumbs Up)" : "Unhelpful (Reported)"}
                        </span>
                        {f.category && <span className="ml-2 font-mono text-stone-500">[{f.category}]</span>}
                        {f.comment && <p className="mt-1 text-stone-700 dark:text-stone-300 italic">{f.comment}</p>}
                      </div>
                      <span className="text-[10px] font-mono text-stone-500">{f.created_at ? new Date(f.created_at).toLocaleDateString() : ""}</span>
                    </div>
                  ))}
                </div>
              )}

              {vaultActiveSection === "voice" && (
                <div className="space-y-2">
                  {selectedUserVault.voice_sessions.map((v: any) => (
                    <div key={v.id} className="p-3 rounded-xl border border-amber-500/20 bg-amber-500/5 flex justify-between items-center text-xs font-mono">
                      <div>
                        <span className="font-bold text-amber-800 dark:text-amber-300 uppercase">{v.input_language}</span>
                        <span className="ml-2 text-stone-600 dark:text-stone-400">Duration: {v.input_duration_ms} ms</span>
                      </div>
                      <span className="text-[10px] text-stone-500">{v.created_at ? new Date(v.created_at).toLocaleString() : ""}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Conversation Messages Transcript Modal */}
      {selectedConvMessages && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="max-w-3xl w-full max-h-[85vh] rounded-3xl bg-white dark:bg-[#120e26] border border-amber-500/40 shadow-2xl flex flex-col overflow-hidden">
            <div className="p-4 border-b border-amber-500/20 flex justify-between items-center bg-amber-500/5">
              <h3 className="font-serif font-bold text-sm text-stone-900 dark:text-white truncate max-w-md">
                Dialogue: {selectedConvMessages.title}
              </h3>
              <button
                onClick={() => setSelectedConvMessages(null)}
                className="p-1 rounded-full hover:bg-amber-500/15 text-stone-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 overflow-y-auto space-y-3 font-sans text-xs">
              {selectedConvMessages.messages.map((m: any) => (
                <div key={m.id} className={`p-3.5 rounded-2xl ${
                  m.role === "assistant"
                    ? "bg-amber-500/10 border border-amber-500/30 text-stone-900 dark:text-amber-100"
                    : "bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200"
                }`}>
                  <div className="flex justify-between items-center mb-1 font-serif text-[10px] uppercase font-bold text-amber-700 dark:text-amber-400">
                    <span>{m.role === "assistant" ? "Lord Krishna" : "Seeker"}</span>
                    <span className="font-mono text-stone-400">{m.created_at ? new Date(m.created_at).toLocaleTimeString() : ""}</span>
                  </div>
                  <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Row JSON Inspector Modal */}
      {inspectRowData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="max-w-3xl w-full max-h-[85vh] rounded-3xl bg-white dark:bg-[#120e26] border border-amber-500/40 shadow-2xl flex flex-col overflow-hidden">
            <div className="p-4 border-b border-amber-500/20 flex justify-between items-center bg-amber-500/5">
              <div className="flex items-center space-x-2">
                <FileJson className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <h3 className="font-serif font-bold text-sm text-stone-900 dark:text-white">
                  {inspectRowData.title}
                </h3>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => copyJsonToClipboard(inspectRowData.data)}
                  className="flex items-center space-x-1 px-3 py-1 rounded-xl bg-amber-500/15 border border-amber-500/30 text-xs font-serif font-semibold text-amber-900 dark:text-amber-200 hover:bg-amber-500/25 cursor-pointer"
                >
                  {copiedJson ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedJson ? "Copied" : "Copy JSON"}</span>
                </button>
                <button
                  onClick={() => setInspectRowData(null)}
                  className="p-1 rounded-full hover:bg-amber-500/15 text-stone-500 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-5 overflow-y-auto bg-stone-50 dark:bg-black font-mono text-xs text-stone-800 dark:text-amber-200">
              <pre className="whitespace-pre-wrap leading-relaxed">
                {JSON.stringify(inspectRowData.data, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
