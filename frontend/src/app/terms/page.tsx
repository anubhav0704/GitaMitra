"use client";

import React from "react";
import Link from "next/link";
import { Scale, ArrowLeft, CheckCircle, FileText } from "lucide-react";

export default function TermsOfServicePage() {
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
            <Scale className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>Sacred Agreement & Terms of Use</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold font-serif text-stone-900 dark:text-amber-100 drop-shadow-xs">Terms of Service</h1>
          <p className="text-xs sm:text-sm text-stone-700 dark:text-stone-300 font-serif">
            Effective Date: September 14, 2026 · GitaMitra Companion v1.0 Production Release
          </p>
        </div>

        <div className="space-y-6 font-sans text-xs sm:text-sm leading-relaxed text-stone-900 dark:text-stone-100 bg-white/95 dark:bg-[#0c081e]/95 p-6 sm:p-10 rounded-3xl border border-amber-500/35 shadow-2xl backdrop-blur-2xl">
          <section className="space-y-3 border-b border-amber-500/15 pb-5">
            <h2 className="text-base font-bold font-serif text-amber-950 dark:text-amber-200 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              1. Acceptance of Terms
            </h2>
            <p className="text-stone-800 dark:text-stone-200 leading-relaxed font-sans">
              By accessing or using GitaMitra, you agree to comply with and be bound by these Terms of Service. GitaMitra is an AI-powered companion designed for spiritual exploration and personal reflection grounded in the 700 verses of the Bhagavad Gita.
            </p>
          </section>

          <section className="space-y-3 border-b border-amber-500/15 pb-5">
            <h2 className="text-base font-bold font-serif text-amber-950 dark:text-amber-200 flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              2. Acceptable Use Policy
            </h2>
            <p className="text-stone-800 dark:text-stone-200 leading-relaxed font-sans">
              You agree not to use GitaMitra for any unlawful purpose, to generate malicious content, or to attempt unauthorized access to other users&apos; accounts or system infrastructure.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold font-serif text-amber-950 dark:text-amber-200 flex items-center gap-2">
              <Scale className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              3. Service Modification & Limitations
            </h2>
            <p className="text-stone-800 dark:text-stone-200 leading-relaxed font-sans">
              We reserve the right to update, modify, or enhance features of GitaMitra. Rate limits and AI usage quotas may be enforced to ensure service stability and equitable availability for all seekers.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
