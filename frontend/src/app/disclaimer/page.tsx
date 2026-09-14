"use client";

import React from "react";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, HeartPulse, ShieldAlert, Sparkles } from "lucide-react";

export default function DisclaimerPage() {
  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-chariot-theme">
      <div className="max-w-4xl mx-auto space-y-8">
        <Link
          href="/"
          className="inline-flex items-center space-x-2 text-xs font-serif text-amber-700 dark:text-amber-300 hover:underline bg-white/60 dark:bg-black/60 px-3 py-1.5 rounded-full border border-amber-500/30 backdrop-blur-md"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to GitaMitra Sanctuary</span>
        </Link>

        <div className="space-y-3 text-center sm:text-left">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-amber-500/20 text-amber-950 dark:text-amber-200 text-xs font-serif font-bold border border-amber-500/40 shadow-sm backdrop-blur-md">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>Spiritual Guidance & AI Boundaries</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold font-serif text-stone-900 dark:text-amber-100 drop-shadow-xs">Important Disclaimer</h1>
          <p className="text-xs sm:text-sm text-stone-700 dark:text-stone-300 font-serif">
            Please read this notice before using the GitaMitra AI Companion.
          </p>
        </div>

        <div className="space-y-6 font-sans text-xs sm:text-sm leading-relaxed text-stone-900 dark:text-stone-100 bg-white/95 dark:bg-[#0c081e]/95 p-6 sm:p-10 rounded-3xl border border-amber-500/35 shadow-2xl backdrop-blur-2xl">
          <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-stone-900 dark:text-amber-100 font-serif flex items-start space-x-3 shadow-inner">
            <Sparkles className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-sm text-amber-950 dark:text-amber-200">AI Spiritual Assistant Statement</h3>
              <p className="text-xs mt-1 leading-relaxed text-stone-800 dark:text-stone-200 font-sans">
                GitaMitra is an artificial intelligence software application built to reflect Bhagavad Gita wisdom. It is inspired by the timeless teachings of Shri Krishna, but it is NOT a divine entity, guru, or human spiritual leader.
              </p>
            </div>
          </div>

          <section className="space-y-3 border-b border-amber-500/15 pb-5">
            <h2 className="text-base font-bold font-serif text-amber-950 dark:text-amber-200 flex items-center gap-2">
              <HeartPulse className="w-4 h-4 text-rose-500" />
              1. Medical & Mental Health Emergencies
            </h2>
            <p className="text-stone-800 dark:text-stone-200 leading-relaxed font-sans">
              GitaMitra is NOT a medical, psychiatric, or psychological counseling service. If you are experiencing severe mental distress, thoughts of self-harm, or a medical emergency, please immediately contact professional emergency medical services, a doctor, or a suicide prevention helpline in your area.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold font-serif text-amber-950 dark:text-amber-200 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              2. Informational & Reflection Purpose Only
            </h2>
            <p className="text-stone-800 dark:text-stone-200 leading-relaxed font-sans">
              All responses, shloka explanations, and spiritual guidance provided by GitaMitra are for educational, reflective, and informational purposes only. They should not replace professional legal, financial, or clinical advice.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
