"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import {
  Shield,
  ArrowLeft,
  Sun,
  Moon,
  Volume2,
  Mic,
  Sliders,
  Sparkles,
  User as UserIcon,
  LogOut,
  Globe,
  SlidersHorizontal,
  ExternalLink
} from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { MobileNav } from "../../components/layout/MobileNav";
import ProfileModal from "../../components/ProfileModal";
import { api } from "../../lib/api";

export default function SettingsPage() {
  const { user, loading, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();

  const [memoryEnabled, setMemoryEnabled] = useState(true);
  const [memoryCount, setMemoryCount] = useState(0);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  // Local preferences
  const [responseDepth, setResponseDepth] = useState("balanced");
  const [preferredLang, setPreferredLang] = useState("auto");

  // Voice Settings state
  const [voiceSettings, setVoiceSettings] = useState({
    voice_mode: "push_to_talk",
    auto_play: false,
    preferred_language: "auto",
    voice_persona: "calm_guide",
    speed: 1.0,
    stt_provider: "whisper",
    tts_provider: "openai"
  });

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  // Load preferences from localStorage & APIs
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedDepth = localStorage.getItem("gitamitra_response_depth");
      if (savedDepth) setResponseDepth(savedDepth);
      const savedLang = localStorage.getItem("gitamitra_preferred_lang");
      if (savedLang) setPreferredLang(savedLang);
    }

    const loadSettings = async () => {
      try {
        const memSettings = await api.memory.getSettings();
        setMemoryEnabled(memSettings.memory_enabled);

        const memList = await api.memory.list(true);
        setMemoryCount(memList.length);

        const vSettings = await api.voice.getSettings();
        setVoiceSettings(vSettings);
      } catch (err) {
        console.error("Failed to load settings:", err);
      }
    };

    if (user) {
      loadSettings();
    }
  }, [user]);

  const handleUpdateVoice = async (updates: Partial<typeof voiceSettings>) => {
    const next = { ...voiceSettings, ...updates };
    setVoiceSettings(next);
    if ("auto_play" in updates && typeof window !== "undefined") {
      localStorage.setItem("gitamitra_voice_auto_play", String(updates.auto_play));
    }
    try {
      await api.voice.updateSettings(next);
      setStatusMessage("Voice Settings Updated");
      setTimeout(() => setStatusMessage(null), 2500);
    } catch (err) {
      console.error("Failed to update voice settings:", err);
    }
  };

  const handleToggleMemory = async () => {
    const next = !memoryEnabled;
    try {
      await api.memory.updateSettings(next);
      setMemoryEnabled(next);
      setStatusMessage(next ? "Spiritual Memory Enabled" : "Spiritual Memory Paused");
      setTimeout(() => setStatusMessage(null), 2500);
    } catch (err) {
      console.error("Failed to update memory setting:", err);
    }
  };

  const handleSetResponseDepth = (depth: string) => {
    setResponseDepth(depth);
    if (typeof window !== "undefined") {
      localStorage.setItem("gitamitra_response_depth", depth);
    }
    setStatusMessage("Response Depth Updated");
    setTimeout(() => setStatusMessage(null), 2000);
  };

  const handleSetPreferredLang = (lang: string) => {
    setPreferredLang(lang);
    if (typeof window !== "undefined") {
      localStorage.setItem("gitamitra_preferred_lang", lang);
    }
    handleUpdateVoice({ preferred_language: lang });
  };

  const handleLogout = async () => {
    try {
      await api.auth.logout();
    } catch (err) {
      console.error("Logout error", err);
    } finally {
      logout();
      router.push("/login");
    }
  };

  return (
    <div className="min-h-screen bg-chariot-theme bg-fixed flex flex-col font-sans pb-20 md:pb-8">
      <div className="max-w-3xl mx-auto w-full px-4 py-6 sm:py-8 space-y-6 flex-1">
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
            <span>GitaMitra Sanctuary Settings</span>
          </div>
        </div>

        {/* Status Toast */}
        {statusMessage && (
          <div className="p-3 rounded-2xl border border-amber-500/35 bg-amber-500/20 text-amber-950 dark:text-amber-100 font-serif text-xs text-center animate-in fade-in shadow-md">
            ✦ {statusMessage} ✦
          </div>
        )}

        {/* Hero Header */}
        <div className="temple-card p-6 sm:p-7 space-y-2 shadow-xl">
          <h1 className="text-2xl sm:text-3xl font-bold font-serif text-stone-900 dark:text-white">
            Sanctuary Preferences
          </h1>
          <p className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed font-sans font-medium">
            Customize your spiritual dialogue experience, language preferences, audio recitations, and memory privacy.
          </p>
        </div>

        {/* 1. Appearance / Aura */}
        <div className="temple-card p-5 sm:p-6 space-y-4">
          <div className="flex items-center space-x-2 text-xs font-serif font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider">
            {theme === "dark" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            <span>1. Visual Aura & Atmosphere</span>
          </div>

          <div className="grid grid-cols-2 gap-3 font-serif text-xs">
            <button
              onClick={() => theme === "dark" && toggleTheme()}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                theme === "light"
                  ? "border-amber-500 bg-amber-500/15 shadow-xs font-bold"
                  : "border-amber-500/20 bg-white/40 hover:border-amber-500/40"
              }`}
            >
              <div className="flex items-center space-x-2 text-stone-900 dark:text-white">
                <Sun className="w-4 h-4 text-amber-600" />
                <span>Sacred Dawn (Light)</span>
              </div>
              <p className="text-[11px] text-stone-600 dark:text-stone-400 font-sans mt-1">
                Warm cream and saffron hues for daytime reflection.
              </p>
            </button>

            <button
              onClick={() => theme === "light" && toggleTheme()}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                theme === "dark"
                  ? "border-amber-500 bg-amber-500/20 shadow-xs font-bold"
                  : "border-amber-500/20 bg-black/20 hover:border-amber-500/40"
              }`}
            >
              <div className="flex items-center space-x-2 text-stone-900 dark:text-white">
                <Moon className="w-4 h-4 text-amber-400" />
                <span>Cosmic Night (Dark)</span>
              </div>
              <p className="text-[11px] text-stone-600 dark:text-stone-400 font-sans mt-1">
                Deep obsidian and luminous gold for tranquil meditation.
              </p>
            </button>
          </div>
        </div>

        {/* 2. Language & Scriptural Preference */}
        <div className="temple-card p-5 sm:p-6 space-y-4">
          <div className="flex items-center space-x-2 text-xs font-serif font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider">
            <Globe className="w-4 h-4" />
            <span>2. Spoken & Counsel Language</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-serif text-xs">
            {[
              { id: "auto", label: "Auto-detect", sub: "Auto switch" },
              { id: "hi", label: "हिन्दी (Hindi)", sub: "देवनागरी" },
              { id: "en", label: "English", sub: "Modern clarity" },
              { id: "hinglish", label: "Hinglish", sub: "Bilingual" }
            ].map((l) => (
              <button
                key={l.id}
                onClick={() => handleSetPreferredLang(l.id)}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  preferredLang === l.id
                    ? "border-amber-500 bg-amber-500/15 dark:bg-amber-500/20 font-bold shadow-xs"
                    : "border-amber-500/20 bg-white/40 dark:bg-black/20 hover:border-amber-500/40"
                }`}
              >
                <div className="text-stone-900 dark:text-white">{l.label}</div>
                <div className="text-[10px] text-stone-500 dark:text-stone-400 font-sans mt-0.5">{l.sub}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 3. Response Depth */}
        <div className="temple-card p-5 sm:p-6 space-y-4">
          <div className="flex items-center space-x-2 text-xs font-serif font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider">
            <SlidersHorizontal className="w-4 h-4" />
            <span>3. Response Exegesis Depth</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-serif text-xs">
            {[
              {
                id: "simple",
                title: "Simple",
                desc: "Concise answers with direct practical application."
              },
              {
                id: "balanced",
                title: "Balanced",
                desc: "Grounded Gita perspective, shloka, and life guidance."
              },
              {
                id: "deep",
                title: "Deep Exegesis",
                desc: "Extensive Sanskrit analysis and philosophical context."
              }
            ].map((d) => (
              <button
                key={d.id}
                onClick={() => handleSetResponseDepth(d.id)}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  responseDepth === d.id
                    ? "border-amber-500 bg-amber-500/15 dark:bg-amber-500/20 font-bold shadow-xs"
                    : "border-amber-500/20 bg-white/40 dark:bg-black/20 hover:border-amber-500/40"
                }`}
              >
                <div className="text-stone-900 dark:text-white font-bold">{d.title}</div>
                <div className="text-[11px] text-stone-600 dark:text-stone-400 font-sans mt-0.5">{d.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 4. Voice Sanctuary Settings */}
        <div className="temple-card p-5 sm:p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-amber-500/20 pb-4">
            <div className="flex items-center space-x-2 text-xs font-serif font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider">
              <Volume2 className="w-4 h-4" />
              <span>4. Spiritual Voice Sanctuary</span>
            </div>

            <div className="flex items-center space-x-3 text-xs font-serif">
              <span className="text-stone-700 dark:text-stone-300">Auto-Recite:</span>
              <button
                onClick={() => handleUpdateVoice({ auto_play: !voiceSettings.auto_play })}
                className={`w-12 h-7 rounded-full p-1 transition-colors duration-200 cursor-pointer ${
                  voiceSettings.auto_play ? "bg-gradient-to-r from-amber-600 to-amber-500" : "bg-stone-300 dark:bg-stone-800"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    voiceSettings.auto_play ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-serif text-xs">
            {/* Persona */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-800 dark:text-stone-200">Voice Persona</label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: "calm_guide", label: "Calm" },
                  { id: "sage", label: "Sage" },
                  { id: "gentle", label: "Gentle" }
                ].map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleUpdateVoice({ voice_persona: p.id })}
                    className={`py-1.5 px-2 rounded-xl border text-center transition-all cursor-pointer ${
                      voiceSettings.voice_persona === p.id
                        ? "bg-amber-500 text-white border-amber-500 font-bold"
                        : "border-amber-500/20 bg-white/50 dark:bg-black/20"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Speed */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-800 dark:text-stone-200">Recitation Speed</label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { speed: 0.85, label: "0.85x" },
                  { speed: 1.0, label: "1.0x" },
                  { speed: 1.15, label: "1.15x" }
                ].map((s) => (
                  <button
                    key={s.speed}
                    onClick={() => handleUpdateVoice({ speed: s.speed })}
                    className={`py-1.5 px-2 rounded-xl border text-center transition-all cursor-pointer ${
                      voiceSettings.speed === s.speed
                        ? "bg-amber-500 text-white border-amber-500 font-bold"
                        : "border-amber-500/20 bg-white/50 dark:bg-black/20"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 5. Memory Sanctuary Summary */}
        <div className="temple-card p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-amber-500/20 pb-4">
            <div className="flex items-center space-x-2 text-xs font-serif font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider">
              <Shield className="w-4 h-4" />
              <span>5. Continuous Memory Sanctuary</span>
            </div>

            <button
              onClick={handleToggleMemory}
              className={`w-12 h-7 rounded-full p-1 transition-colors duration-200 cursor-pointer ${
                memoryEnabled ? "bg-gradient-to-r from-amber-600 to-amber-500" : "bg-stone-300 dark:bg-stone-800"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  memoryEnabled ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between text-xs font-serif">
            <span className="text-stone-700 dark:text-stone-300">
              Preserved Contexts: <strong className="text-amber-800 dark:text-amber-300">{memoryCount}</strong>
            </span>
            <Link
              href="/memory"
              className="inline-flex items-center space-x-1 text-amber-600 dark:text-amber-400 hover:underline font-bold"
            >
              <span>Manage Memories</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* 6. Account & Identity */}
        <div className="temple-card p-5 sm:p-6 space-y-4">
          <div className="flex items-center space-x-2 text-xs font-serif font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider">
            <UserIcon className="w-4 h-4" />
            <span>6. Seeker Account & Sovereignty</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
            <div>
              <p className="font-serif font-bold text-sm text-stone-900 dark:text-white">
                {user?.name || "Seeker"}
              </p>
              <p className="font-sans text-xs text-stone-500 dark:text-stone-400">
                {user?.email}
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setProfileModalOpen(true)}
              >
                Profile & Password
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleLogout}
                leftIcon={<LogOut className="w-3.5 h-3.5" />}
              >
                Logout
              </Button>
            </div>

          </div>
        </div>
      </div>

      {profileModalOpen && (
        <ProfileModal
          isOpen={profileModalOpen}
          onClose={() => setProfileModalOpen(false)}
        />
      )}

      <MobileNav />
    </div>
  );
}
