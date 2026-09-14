"use client";

import React from "react";
import Link from "next/link";
import { Shield, ArrowLeft, Lock, Database, EyeOff, UserCheck } from "lucide-react";

export default function PrivacyPolicyPage() {
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
            <Shield className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>Spiritual Sanctuary & Privacy Safeguards</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold font-serif text-stone-900 dark:text-amber-100 drop-shadow-xs">Privacy Policy</h1>
          <p className="text-xs sm:text-sm text-stone-700 dark:text-stone-300 font-serif">
            Effective Date: September 14, 2026 · GitaMitra Companion v1.0 Production Release
          </p>
        </div>

        <div className="space-y-6 font-sans text-xs sm:text-sm leading-relaxed text-stone-900 dark:text-stone-100 bg-white/95 dark:bg-[#0c081e]/95 p-6 sm:p-10 rounded-3xl border border-amber-500/35 shadow-2xl backdrop-blur-2xl">
          <section className="space-y-3 border-b border-amber-500/15 pb-5">
            <h2 className="text-base font-bold font-serif text-amber-950 dark:text-amber-200 flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              1. Our Sacred Commitment to Your Sanctuary
            </h2>
            <p className="text-stone-800 dark:text-stone-200 leading-relaxed font-sans">
              At GitaMitra, your inner reflections, personal dilemmas, and spiritual inquiries are treated with extreme respect and confidentiality. We design our architecture so that your conversations and long-term memory records remain encrypted, user-isolated, and strictly accessible only to you.
            </p>
          </section>

          <section className="space-y-3 border-b border-amber-500/15 pb-5">
            <h2 className="text-base font-bold font-serif text-amber-950 dark:text-amber-200 flex items-center gap-2">
              <Database className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              2. Information We Collect
            </h2>
            <ul className="list-disc pl-5 space-y-2 text-stone-800 dark:text-stone-200 font-sans">
              <li><strong className="text-stone-900 dark:text-amber-200 font-serif">Account Information:</strong> Name, email address, and hashed credentials upon registration.</li>
              <li><strong className="text-stone-900 dark:text-amber-200 font-serif">Conversation Threads & Memories:</strong> Inquiries you submit and extracted spiritual context used to personalize Gita insights.</li>
              <li><strong className="text-stone-900 dark:text-amber-200 font-serif">Voice Data:</strong> Audio clips captured during speech-to-text interactions are processed ephemerally and discarded unless explicitly cached in local temporary sessions.</li>
            </ul>
          </section>

          <section className="space-y-3 border-b border-amber-500/15 pb-5">
            <h2 className="text-base font-bold font-serif text-amber-950 dark:text-amber-200 flex items-center gap-2">
              <EyeOff className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              3. Data Isolation & Non-Disclosure
            </h2>
            <p className="text-stone-800 dark:text-stone-200 leading-relaxed font-sans">
              We do NOT sell, rent, or monetize your personal conversations or memory logs. All AI processing is performed under user-isolated contexts. Admin personnel only monitor aggregated system health, RAG performance metrics, and anonymized feedback.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold font-serif text-amber-950 dark:text-amber-200 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              4. User Rights, Data Export & Deletion
            </h2>
            <p className="text-stone-800 dark:text-stone-200 leading-relaxed font-sans">
              You maintain full sovereignty over your data. Inside your Profile settings, you can:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-stone-800 dark:text-stone-200 font-sans">
              <li>Download a complete JSON export of your profile, conversations, and memories at any time.</li>
              <li>Delete individual memories or clear all active memories instantly.</li>
              <li>Permanently delete your entire account, which triggers automated cascading deletion of all associated messages and data.</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
