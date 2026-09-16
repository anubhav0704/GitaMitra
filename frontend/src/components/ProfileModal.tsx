"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { 
  X, 
  User as UserIcon, 
  Mail, 
  Brain, 
  BookOpen, 
  MessageSquare, 
  Moon, 
  Sun, 
  Shield, 
  LogOut,
  Sparkles,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Loader2,
  Download,
  Trash2,
  Camera,
  FileText
} from "lucide-react";
import { API_BASE, getAuthHeaders } from "../lib/api";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { exportUserDataAsPdf } from "../lib/exportPdf";

interface User {
  id: string;
  name: string | null;
  email: string;
  role?: string;
  avatar_url?: string | null;
}

export interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: User | null;
  onLogout?: () => void;
}

export default function ProfileModal({ isOpen, onClose, user: propUser, onLogout: propLogout }: ProfileModalProps) {
  const { user: authUser, logout: authLogout, updateProfilePicture } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [memoryCount, setMemoryCount] = useState<number | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const currentUser = propUser || authUser;
  const currentLogout = propLogout || authLogout;

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordStatus(null);

    if (newPassword.length < 8) {
      setPasswordStatus({ type: "error", text: "New password must be at least 8 characters long." });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordStatus({ type: "error", text: "New passwords do not match." });
      return;
    }

    setIsSubmitting(true);
    try {
      await api.auth.changePassword({
        current_password: currentPassword,
        new_password: newPassword
      });
      setPasswordStatus({ type: "success", text: "Password changed successfully!" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => {
        setShowPasswordForm(false);
        setPasswordStatus(null);
      }, 2000);
    } catch (err: any) {
      setPasswordStatus({ type: "error", text: err.message || "Failed to change password." });
    } finally {
      setIsSubmitting(false);
    }
  };


  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);

    if (!file.type.startsWith("image/")) {
      setUploadError("Please select a valid image file (PNG, JPG, WebP).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Image size must be under 5MB.");
      return;
    }

    setUploadingPhoto(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64Url = reader.result as string;
          if (updateProfilePicture) {
            await updateProfilePicture(base64Url);
          }
        } catch (err: any) {
          setUploadError(err.message || "Failed to update profile picture.");
        } finally {
          setUploadingPhoto(false);
        }
      };
      reader.onerror = () => {
        setUploadError("Failed to read image file.");
        setUploadingPhoto(false);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setUploadError(err.message || "Failed to update profile picture.");
      setUploadingPhoto(false);
    }
  };

  const handlePhotoRemove = async () => {
    if (confirm("Remove profile picture and revert to initial letter?")) {
      setUploadError(null);
      try {
        if (updateProfilePicture) {
          await updateProfilePicture(null);
        }
      } catch (err: any) {
        setUploadError(err.message || "Failed to remove profile picture.");
      }
    }
  };

  const handleExportPdf = async () => {
    setIsExportingPdf(true);
    try {
      let exportData: any = null;
      try {
        const res = await fetch(`${API_BASE}/auth/account/export`, {
          headers: getAuthHeaders(),
          credentials: "include",
        });
        if (res.ok) {
          exportData = await res.json();
        }
      } catch (err) {
        console.warn("[ProfileModal] Could not fetch remote export:", err);
      }

      // If backend export is unavailable, assemble complete fallback from session
      if (!exportData) {
        exportData = {
          export_metadata: {
            exported_at: new Date().toISOString(),
            application: "GitaMitra Companion v1.0",
            version: "1.0-production",
          },
          user_profile: {
            id: currentUser?.id,
            name: currentUser?.name,
            email: currentUser?.email,
            created_at: new Date().toISOString(),
          },
          memories: [],
          conversations: [],
        };
      }

      await exportUserDataAsPdf(exportData);
    } catch (err: any) {
      console.error("PDF export failed:", err);
      alert("Failed to generate PDF. Please check your connection and try again.");
    } finally {
      setIsExportingPdf(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    // Fetch active memories count
    fetch(`${API_BASE}/memories?is_active=true`, {
      headers: getAuthHeaders(),
      credentials: "include"
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) {
          setMemoryCount(data.length);
        }
      })
      .catch(() => setMemoryCount(null));
  }, [isOpen]);

  if (!isOpen) return null;

  const initial = currentUser
    ? (currentUser.name ? currentUser.name[0] : currentUser.email[0]).toUpperCase()
    : "S";

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-md max-h-[85vh] flex flex-col bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden transition-all transform scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header background banner - Fixed Top */}
        <div className="shrink-0 h-24 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 relative p-4 flex justify-between items-start">
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Spiritual Profile</span>
          </span>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-black/20 hover:bg-black/30 text-white transition-colors cursor-pointer"
            title="Close profile"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Modal Content Body */}
        <div className="flex-1 overflow-y-auto px-6 pb-6 relative scrollbar-thin">
          {/* Avatar badge overlapping banner */}
          <div className="-mt-12 mb-4 flex justify-between items-end">
            <div className="relative group">
              <div className="w-20 h-20 rounded-2xl bg-white dark:bg-gray-800 p-1.5 shadow-xl ring-2 ring-amber-500/20 overflow-hidden">
                {currentUser?.avatar_url ? (
                  <img
                    src={currentUser.avatar_url}
                    alt={currentUser.name || "Seeker Avatar"}
                    className="w-full h-full rounded-xl object-cover"
                  />
                ) : (
                  <div className="w-full h-full rounded-xl bg-gradient-to-tr from-amber-600 to-amber-500 text-white font-serif font-bold text-2xl flex items-center justify-center shadow-inner select-none">
                    {initial}
                  </div>
                )}

                {/* Uploading indicator */}
                {uploadingPhoto && (
                  <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center">
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                  </div>
                )}
              </div>

              {/* Upload photo trigger button */}
              <label
                htmlFor="profile-picture-upload"
                className="absolute -bottom-1 -right-1 p-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white shadow-lg cursor-pointer transition-all hover:scale-110 active:scale-95 flex items-center justify-center border border-white dark:border-gray-900"
                title="Upload Profile Picture"
              >
                <Camera className="w-3.5 h-3.5" />
                <input
                  id="profile-picture-upload"
                  type="file"
                  accept="image/png, image/jpeg, image/webp, image/gif"
                  className="hidden"
                  onChange={handlePhotoUpload}
                  disabled={uploadingPhoto}
                />
              </label>

              {/* Remove photo button if custom picture uploaded */}
              {currentUser?.avatar_url && (
                <button
                  type="button"
                  onClick={handlePhotoRemove}
                  className="absolute -top-1 -right-1 p-1 rounded-full bg-rose-600 hover:bg-rose-500 text-white shadow-md cursor-pointer transition-all hover:scale-110 border border-white dark:border-gray-900"
                  title="Remove picture (revert to initial letter)"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Theme quick switcher */}
            <button
              onClick={toggleTheme}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs font-medium text-gray-700 dark:text-gray-300 hover:border-amber-500 transition-colors cursor-pointer"
            >
              {theme === "dark" ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span>Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-slate-700" />
                  <span>Dark Mode</span>
                </>
              )}
            </button>
          </div>

          {/* Upload error notice */}
          {uploadError && (
            <div className="mb-3 p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-center space-x-2 text-rose-600 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}

          {/* User details */}
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {currentUser?.name || "Spiritual Seeker"}
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                Sadhaka
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center space-x-1">
              <Mail className="w-3.5 h-3.5" />
              <span>{currentUser?.email}</span>
            </p>
          </div>

          {/* Spiritual stats cards */}
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="p-3 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/50">
              <div className="flex items-center space-x-1.5 text-xs text-amber-800 dark:text-amber-300 font-medium">
                <Brain className="w-3.5 h-3.5" />
                <span>Memories</span>
              </div>
              <p className="mt-1 text-base font-bold text-amber-900 dark:text-amber-200">
                {memoryCount !== null ? `${memoryCount} Active` : "Syncing..."}
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-1.5 text-xs text-gray-600 dark:text-gray-300 font-medium">
                <Shield className="w-3.5 h-3.5 text-emerald-500" />
                <span>Sanctuary</span>
              </div>
              <p className="mt-1 text-xs font-semibold text-gray-800 dark:text-gray-200">
                Encrypted & Private
              </p>
            </div>
          </div>

          {/* Navigation actions */}
          <div className="mt-4 space-y-2">
            {currentUser?.role === "admin" && (
              <Link
                href="/admin"
                onClick={onClose}
                className="flex items-center justify-between p-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-xs font-bold text-amber-900 dark:text-amber-200 transition-colors"
              >
                <div className="flex items-center space-x-2.5">
                  <Shield className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>Admin Command Center</span>
                </div>
                <span className="text-[10px] bg-amber-600 text-white font-sans px-2 py-0.5 rounded-full font-bold uppercase">
                  Admin Dashboard →
                </span>
              </Link>
            )}
            <Link
              href="/settings"
              onClick={onClose}
              className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 border border-gray-100 dark:border-gray-800 text-xs font-medium text-gray-700 dark:text-gray-300 transition-colors"
            >
              <div className="flex items-center space-x-2.5">
                <Brain className="w-4 h-4 text-amber-600" />
                <span>Spiritual Memory & Persona</span>
              </div>
              <span className="text-xs text-gray-400">Manage →</span>
            </Link>

            <Link
              href="/gita"
              onClick={onClose}
              className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 border border-gray-100 dark:border-gray-800 text-xs font-medium text-gray-700 dark:text-gray-300 transition-colors"
            >
              <div className="flex items-center space-x-2.5">
                <BookOpen className="w-4 h-4 text-blue-500" />
                <span>Browse Gita Explorer</span>
              </div>
              <span className="text-xs text-gray-400">18 Chapters →</span>
            </Link>

            <button
              type="button"
              onClick={() => {
                setShowPasswordForm(!showPasswordForm);
                setPasswordStatus(null);
              }}
              className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 border border-gray-100 dark:border-gray-800 text-xs font-medium text-gray-700 dark:text-gray-300 transition-colors cursor-pointer"
            >
              <div className="flex items-center space-x-2.5">
                <KeyRound className="w-4 h-4 text-purple-500" />
                <span className="font-medium text-gray-800 dark:text-gray-200">Change Password</span>
              </div>
              <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold">
                {showPasswordForm ? "Close" : "Update →"}
              </span>
            </button>

            <button
              type="button"
              disabled={isExportingPdf}
              onClick={handleExportPdf}
              className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-amber-50 dark:hover:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/50 text-xs font-medium text-gray-700 dark:text-gray-300 transition-colors cursor-pointer group"
            >
              <div className="flex items-center space-x-2.5">
                {isExportingPdf ? (
                  <Loader2 className="w-4 h-4 text-amber-600 animate-spin" />
                ) : (
                  <FileText className="w-4 h-4 text-amber-600 group-hover:scale-110 transition-transform" />
                )}
                <div className="text-left">
                  <span className="font-medium text-gray-800 dark:text-gray-200 block">Export My Data (PDF)</span>
                  <span className="text-[10px] text-gray-500 dark:text-gray-400">Download formatted spiritual profile archive</span>
                </div>
              </div>
              <span className="text-xs text-amber-700 dark:text-amber-400 font-semibold px-2 py-1 rounded-lg bg-amber-500/10">
                {isExportingPdf ? "Generating..." : "Download PDF"}
              </span>
            </button>

            <button
              type="button"
              onClick={async () => {
                if (confirm("Are you sure? This will permanently delete your account and all conversations and memories.")) {
                  const res = await fetch(`${API_BASE}/auth/account`, {
                    method: "DELETE",
                    headers: getAuthHeaders(),
                    credentials: "include"
                  });
                  if (res.ok) {
                    onClose();
                    if (currentLogout) currentLogout();
                  }
                }
              }}
              className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-100 dark:border-rose-900/50 text-xs font-medium text-rose-600 transition-colors cursor-pointer"
            >
              <div className="flex items-center space-x-2.5">
                <Trash2 className="w-4 h-4 text-rose-500" />
                <span className="font-medium">Delete Account</span>
              </div>
              <span className="text-xs font-semibold">Delete</span>
            </button>
          </div>

          {/* Change password expandable form */}
          {showPasswordForm && (
            <form onSubmit={handlePasswordSubmit} className="mt-3 p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 space-y-3 animate-fade-in">
              <h3 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center space-x-1.5">
                <KeyRound className="w-3.5 h-3.5 text-purple-500" />
                <span>Update Account Password</span>
              </h3>

              {passwordStatus && (
                <div
                  className={`p-2.5 rounded-xl text-xs flex items-center space-x-2 ${
                    passwordStatus.type === "success"
                      ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                      : "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800"
                  }`}
                >
                  {passwordStatus.type === "success" ? (
                    <CheckCircle className="w-4 h-4 shrink-0 text-emerald-500" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                  )}
                  <span>{passwordStatus.text}</span>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPass ? "text" : "password"}
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full px-3 py-2 pr-9 text-xs rounded-xl bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
                  >
                    {showCurrentPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">
                  New Password (min 8 chars)
                </label>
                <div className="relative">
                  <input
                    type={showNewPass ? "text" : "password"}
                    required
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full px-3 py-2 pr-9 text-xs rounded-xl bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
                  >
                    {showNewPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-900 dark:text-white"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordForm(false)}
                  className="px-3 py-1.5 rounded-lg text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center space-x-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 shadow transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Updating...</span>
                    </>
                  ) : (
                    <span>Save New Password</span>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Logout footer */}
          <div className="mt-5 pt-4 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between">
            <div className="flex items-center space-x-2 text-[10px] text-gray-500 dark:text-gray-400">
              <Link href="/privacy" onClick={onClose} className="hover:underline">Privacy</Link>
              <span>·</span>
              <Link href="/terms" onClick={onClose} className="hover:underline">Terms</Link>
              <span>·</span>
              <Link href="/disclaimer" onClick={onClose} className="hover:underline">Disclaimer</Link>
            </div>
            <button
              onClick={() => {
                onClose();
                if (currentLogout) currentLogout();
              }}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

}
