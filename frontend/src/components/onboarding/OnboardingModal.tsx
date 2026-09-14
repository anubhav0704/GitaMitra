"use client";

import React, { useState } from "react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Sparkles, Globe, Volume2, Shield, ArrowRight, Check } from "lucide-react";
import { api } from "../../lib/api";

export interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: () => void;
  userName?: string;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onComplete,
  userName = ""
}) => {
  const [step, setStep] = useState(1);
  const [preferredName, setPreferredName] = useState(userName);
  const [language, setLanguage] = useState("auto");
  const [responseDepth, setResponseDepth] = useState("balanced");
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [memoryEnabled, setMemoryEnabled] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const handleFinish = async () => {
    setIsSaving(true);
    try {
      // 1. Save voice settings
      await api.voice.updateSettings({
        preferred_language: language,
        auto_play: voiceEnabled,
        voice_mode: "push_to_talk",
        voice_persona: "calm_guide",
        speed: 1.0
      });

      // 2. Save memory settings
      await api.memory.updateSettings(memoryEnabled);

      // 3. Save local response depth & language preference
      if (typeof window !== "undefined") {
        localStorage.setItem("gitamitra_response_depth", responseDepth);
        localStorage.setItem("gitamitra_preferred_lang", language);
        localStorage.setItem("gitamitra_preferred_name", preferredName || userName);
      }
    } catch (err) {
      console.error("Failed to save onboarding preferences:", err);
    } finally {
      setIsSaving(false);
      onComplete();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onComplete}
      maxWidth="md"
    >
      <div className="space-y-5">
        {/* Header Indicator */}
        <div className="flex items-center justify-between border-b border-amber-500/20 pb-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-amber-500/15 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-serif text-sm font-bold text-stone-900 dark:text-white">
                Welcome to GitaMitra
              </h2>
              <p className="font-serif text-[11px] text-amber-800 dark:text-amber-300">
                Step {step} of 3 • Personalize your Sanctuary
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === step
                    ? "w-6 bg-gradient-to-r from-amber-600 to-amber-500"
                    : i < step
                    ? "w-3 bg-amber-500/50"
                    : "w-2 bg-stone-300 dark:bg-stone-800"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Step 1: Language & Address */}
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in">
            <div>
              <label className="block font-serif text-xs font-semibold text-stone-800 dark:text-stone-200 mb-1.5">
                What should Lord Krishna and GitaMitra call you?
              </label>
              <input
                type="text"
                value={preferredName}
                onChange={(e) => setPreferredName(e.target.value)}
                placeholder={userName || "e.g. Arjuna, Seeker"}
                className="w-full rounded-2xl border border-amber-500/30 px-3.5 py-2.5 text-sm bg-white/70 dark:bg-[#15102a]/80 text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block font-serif text-xs font-semibold text-stone-800 dark:text-stone-200">
                Preferred Guidance Language
              </label>
              <div className="grid grid-cols-2 gap-2 font-serif text-xs">
                {[
                  { id: "auto", label: "Auto-detect", sub: "English, Hindi, Hinglish" },
                  { id: "hi", label: "हिन्दी (Hindi)", sub: "शुद्ध देवनागरी एवं सरल अनुवाद" },
                  { id: "en", label: "English", sub: "Classical & Modern clarity" },
                  { id: "hinglish", label: "Hinglish", sub: "Conversational blend" }
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setLanguage(item.id)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      language === item.id
                        ? "border-amber-500 bg-amber-500/15 dark:bg-amber-500/20 shadow-xs"
                        : "border-amber-500/20 bg-white/50 dark:bg-black/20 hover:border-amber-500/40"
                    }`}
                  >
                    <div className="font-bold text-stone-900 dark:text-white">{item.label}</div>
                    <div className="text-[10px] text-stone-600 dark:text-stone-400 font-sans mt-0.5">
                      {item.sub}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Response Depth & Reflection */}
        {step === 2 && (
          <div className="space-y-4 animate-in fade-in">
            <div className="space-y-1.5">
              <label className="block font-serif text-xs font-semibold text-stone-800 dark:text-stone-200">
                How detailed should spiritual counsel be?
              </label>
              <div className="space-y-2 font-serif text-xs">
                {[
                  {
                    id: "simple",
                    title: "Simple & Actionable",
                    desc: "Concise answers with direct practical application and 1 key verse."
                  },
                  {
                    id: "balanced",
                    title: "Balanced (Recommended)",
                    desc: "Harmonious blend of Bhagavad Gita perspective, shloka, and life reflection."
                  },
                  {
                    id: "deep",
                    title: "Deep Scriptural Exegesis",
                    desc: "Comprehensive Sanskrit breakdown, philosophical contexts, and multiple verses."
                  }
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setResponseDepth(item.id)}
                    className={`w-full p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                      responseDepth === item.id
                        ? "border-amber-500 bg-amber-500/15 dark:bg-amber-500/20 shadow-xs"
                        : "border-amber-500/20 bg-white/50 dark:bg-black/20 hover:border-amber-500/40"
                    }`}
                  >
                    <div className="font-bold text-stone-900 dark:text-white">{item.title}</div>
                    <div className="text-[11px] text-stone-600 dark:text-stone-300 font-sans mt-0.5">
                      {item.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Voice & Memory Sanctuary */}
        {step === 3 && (
          <div className="space-y-3.5 animate-in fade-in">
            <div className="p-3.5 rounded-2xl border border-amber-500/25 bg-amber-500/10 flex items-start justify-between gap-3">
              <div className="flex items-start space-x-2.5">
                <Volume2 className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-serif text-xs font-bold text-stone-900 dark:text-white">
                    Auto-Recite Responses
                  </h4>
                  <p className="font-sans text-[11px] text-stone-600 dark:text-stone-300 mt-0.5">
                    Automatically speak Lord Krishna&apos;s counsel aloud with accurate Sanskrit chanting.
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={voiceEnabled}
                onChange={(e) => setVoiceEnabled(e.target.checked)}
                className="w-4 h-4 accent-amber-600 cursor-pointer mt-0.5"
              />
            </div>

            <div className="p-3.5 rounded-2xl border border-amber-500/25 bg-amber-500/10 flex items-start justify-between gap-3">
              <div className="flex items-start space-x-2.5">
                <Shield className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-serif text-xs font-bold text-stone-900 dark:text-white">
                    Continuous Spiritual Memory
                  </h4>
                  <p className="font-sans text-[11px] text-stone-600 dark:text-stone-300 mt-0.5">
                    Remember life situations across dialogues. You can edit or purge them anytime.
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={memoryEnabled}
                onChange={(e) => setMemoryEnabled(e.target.checked)}
                className="w-4 h-4 accent-amber-600 cursor-pointer mt-0.5"
              />
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-amber-500/15">
          <button
            type="button"
            onClick={onComplete}
            className="font-serif text-xs text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200 cursor-pointer"
          >
            Skip for now
          </button>

          <div className="flex items-center space-x-2">
            {step > 1 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep((s) => s - 1)}
              >
                Back
              </Button>
            )}

            {step < 3 ? (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setStep((s) => s + 1)}
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              >
                Continue
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={handleFinish}
                isLoading={isSaving}
                rightIcon={<Check className="w-3.5 h-3.5 stroke-[2.5]" />}
              >
                Begin Journey
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};
