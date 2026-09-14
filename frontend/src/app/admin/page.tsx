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
  BarChart3
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { API_BASE, getAuthHeaders } from "../../lib/api";

export default function AdminDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const { theme } = useTheme();

  const [activeTab, setActiveTab] = useState<"overview" | "users" | "gita" | "rag" | "feedback" | "health" | "audit">("overview");
  const [period, setPeriod] = useState<"24h" | "7d" | "30d" | "90d">("30d");

  const [metrics, setMetrics] = useState<any>(null);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [gitaHealth, setGitaHealth] = useState<any>(null);
  const [ragStats, setRagStats] = useState<any>(null);
  const [feedbackSummary, setFeedbackSummary] = useState<any>(null);
  const [componentHealth, setComponentHealth] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchAdminData = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const [mRes, uRes, gRes, rRes, fRes, hRes, aRes] = await Promise.all([
        fetch(`${API_BASE}/admin/metrics?period=${period}`, { headers: getAuthHeaders(), credentials: "include" }),
        fetch(`${API_BASE}/admin/users`, { headers: getAuthHeaders(), credentials: "include" }),
        fetch(`${API_BASE}/admin/gita/health`, { headers: getAuthHeaders(), credentials: "include" }),
        fetch(`${API_BASE}/admin/rag/stats`, { headers: getAuthHeaders(), credentials: "include" }),
        fetch(`${API_BASE}/admin/feedback`, { headers: getAuthHeaders(), credentials: "include" }),
        fetch(`${API_BASE}/admin/system/health`, { headers: getAuthHeaders(), credentials: "include" }),
        fetch(`${API_BASE}/admin/audit-logs`, { headers: getAuthHeaders(), credentials: "include" })
      ]);

      if (mRes.status === 403) {
        setErrorMsg("Administrative privileges required to view this portal.");
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

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`${API_BASE}/admin/users/${userId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        credentials: "include",
        body: JSON.stringify({ is_active: !currentStatus })
      });
      if (res.ok) {
        fetchAdminData();
      }
    } catch (err) {
      console.error("Status update error", err);
    }
  };

  const toggleUserRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === "admin" ? "user" : "admin";
    try {
      const res = await fetch(`${API_BASE}/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        credentials: "include",
        body: JSON.stringify({ role: newRole })
      });
      if (res.ok) {
        fetchAdminData();
      }
    } catch (err) {
      console.error("Role update error", err);
    }
  };

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

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#090714] text-amber-200 font-serif">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs uppercase tracking-widest">Authenticating Admin Session...</p>
        </div>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="min-h-screen bg-[#faf6ee] dark:bg-[#090714] text-stone-900 dark:text-stone-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 rounded-3xl bg-white dark:bg-[#15102a] border border-amber-500/30 text-center space-y-4 shadow-2xl">
          <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-xl font-bold font-serif">Access Restricted</h2>
          <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed font-sans font-medium">
            {errorMsg}
          </p>
          <Link
            href="/chat"
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-amber-600 to-amber-500 text-white font-serif text-xs font-semibold shadow-md hover:opacity-90 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Spiritual Dialogue</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf6ee] dark:bg-[#090714] text-stone-900 dark:text-stone-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-amber-500/20 pb-5">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-600 to-yellow-500 flex items-center justify-center text-white font-serif font-bold text-lg shadow-md">
              ॐ
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-bold font-serif">GitaMitra Command Center</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30 font-serif">
                  ADMINISTRATOR
                </span>
              </div>
              <p className="text-xs text-stone-600 dark:text-stone-400 font-sans">
                Production System Governance, RAG Health, Analytics & User Security
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={fetchAdminData}
              className="p-2 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 transition-colors cursor-pointer"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            </button>
            <Link
              href="/chat"
              className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 text-white text-xs font-serif font-bold shadow-md shadow-amber-500/20 hover:opacity-95 active:scale-95 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to App</span>
            </Link>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex overflow-x-auto scrollbar-none gap-2 pb-2 border-b border-amber-500/15 text-xs font-serif font-semibold">
          {[
            { id: "overview", label: "System Overview", icon: Activity },
            { id: "users", label: "User Management", icon: Users },
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
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                  active
                    ? "bg-amber-500/20 text-amber-900 dark:text-amber-200 border border-amber-500/40 shadow-xs"
                    : "text-stone-600 dark:text-stone-400 hover:bg-amber-500/10"
                }`}
              >
                <Icon className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>{tab.label}</span>
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

        {/* Tab 2: User Management */}
        {activeTab === "users" && (
          <div className="space-y-4">
            <h2 className="text-base font-bold font-serif text-amber-900 dark:text-amber-300">Registered Seekers</h2>
            <div className="overflow-x-auto rounded-2xl border border-amber-500/20 bg-white/80 dark:bg-[#15102a]/80 shadow-md">
              <table className="w-full text-left text-xs">
                <thead className="bg-amber-500/10 font-serif text-stone-700 dark:text-stone-300 border-b border-amber-500/20">
                  <tr>
                    <th className="p-3">User</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Role</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-500/10">
                  {usersList.map((u) => (
                    <tr key={u.id}>
                      <td className="p-3 font-semibold">{u.name || "Seeker"}</td>
                      <td className="p-3 text-stone-500 dark:text-stone-400">{u.email}</td>
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
                      <td className="p-3 flex items-center space-x-2">
                        <button
                          onClick={() => toggleUserStatus(u.id, u.is_active)}
                          className="px-2.5 py-1 rounded-lg border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-[11px] font-serif transition-colors cursor-pointer"
                        >
                          {u.is_active ? "Deactivate" : "Activate"}
                        </button>
                        <button
                          onClick={() => toggleUserRole(u.id, u.role)}
                          className="px-2.5 py-1 rounded-lg border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 text-[11px] font-serif transition-colors cursor-pointer"
                        >
                          Toggle Role
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Gita Knowledge Base */}
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

        {/* Tab 4: RAG Monitor */}
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

        {/* Tab 5: Feedback Analytics */}
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

        {/* Tab 6: Component Health */}
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

        {/* Tab 7: Audit Logs */}
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
    </div>
  );
}
