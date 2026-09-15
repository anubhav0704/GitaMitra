"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Copy, Check, ExternalLink, Sparkles } from "lucide-react";

export interface ShlokaReference {
  reference: string;
  chapter: number;
  verse: number;
  sanskrit: string;
  translation_en: string;
  translation_hi?: string;
  relevance_score?: number;
  why_this_verse?: string;
}

export default function ShlokaCard({ refData }: { refData: ShlokaReference }) {
  const [copiedSanskrit, setCopiedSanskrit] = useState(false);
  const [copiedTrans, setCopiedTrans] = useState(false);

  const copyText = (text: string, type: "sanskrit" | "trans") => {
    navigator.clipboard.writeText(text);
    if (type === "sanskrit") {
      setCopiedSanskrit(true);
      setTimeout(() => setCopiedSanskrit(false), 2000);
    } else {
      setCopiedTrans(true);
      setTimeout(() => setCopiedTrans(false), 2000);
    }
  };

  return (
    <div className="my-3 rounded-2xl border border-amber-500/30 bg-amber-50/70 dark:bg-[#18122c]/80 backdrop-blur-md p-4 shadow-sm transition-all duration-200">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-amber-500/20 pb-2.5 mb-3 text-xs">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-400 text-white flex items-center justify-center text-xs font-bold font-serif shadow-xs">
            ॐ
          </div>
          <span className="font-bold text-amber-900 dark:text-amber-200 font-serif tracking-wide text-sm">
            {refData.reference.startsWith("Bhagavad Gita") ? refData.reference : `Bhagavad Gita ${refData.reference}`}
          </span>
          {refData.relevance_score !== undefined && (
            <span className="text-[10px] px-2 py-0.5 rounded-full border border-amber-500/30 bg-amber-500/15 text-amber-800 dark:text-amber-300 font-semibold font-serif">
              Relevance: {refData.relevance_score.toFixed(2)}
            </span>
          )}
        </div>

        <Link
          href={`/gita/chapter/${refData.chapter}/verse/${refData.verse}`}
          className="inline-flex items-center space-x-1 text-xs font-serif text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-100 hover:underline transition-colors"
        >
          <span>View in Explorer</span>
          <ExternalLink className="w-3 h-3 ml-0.5" />
        </Link>
      </div>

      {/* Sanskrit Shloka */}
      {refData.sanskrit && (
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1.5 font-serif text-[11px] uppercase tracking-wider text-amber-800/80 dark:text-amber-300">
            <span className="flex items-center space-x-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Sanskrit Shloka</span>
            </span>
            <button
              onClick={() => copyText(refData.sanskrit, "sanskrit")}
              className="text-xs text-stone-500 dark:text-stone-400 hover:text-amber-600 dark:hover:text-amber-300 flex items-center space-x-1 px-1.5 py-0.5 rounded transition-colors cursor-pointer"
              title="Copy Sanskrit text"
            >
              {copiedSanskrit ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
              <span>{copiedSanskrit ? "Copied" : "Copy"}</span>
            </button>
          </div>
          <p className="font-serif text-stone-900 dark:text-amber-100 text-sm sm:text-[15px] leading-relaxed whitespace-pre-line bg-white/80 dark:bg-[#0f0b1f]/90 p-3.5 rounded-xl border border-amber-500/20 font-medium">
            {refData.sanskrit}
          </p>
        </div>
      )}

      {/* Translation */}
      {refData.translation_en && (
        <div>
          <div className="flex items-center justify-between mb-1 font-serif text-[11px] uppercase tracking-wider text-stone-500 dark:text-stone-400">
            <span>Translation</span>
            <button
              onClick={() => copyText(refData.translation_en, "trans")}
              className="text-xs text-stone-500 dark:text-stone-400 hover:text-amber-600 dark:hover:text-amber-300 flex items-center space-x-1 px-1.5 py-0.5 rounded transition-colors cursor-pointer"
              title="Copy translation"
            >
              {copiedTrans ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
              <span>{copiedTrans ? "Copied" : "Copy"}</span>
            </button>
          </div>
          <p className="text-stone-700 dark:text-stone-300 text-xs sm:text-sm italic leading-relaxed font-sans">
            &quot;{refData.translation_en}&quot;
          </p>
        </div>
      )}

      {/* Why This Verse */}
      {refData.why_this_verse && (
        <div className="mt-3 pt-2.5 border-t border-amber-500/20 text-xs text-stone-600 dark:text-stone-400">
          <span className="font-serif text-[11px] font-bold text-amber-700 dark:text-amber-400 mr-1.5 uppercase">Spiritual Context:</span>
          {refData.why_this_verse}
        </div>
      )}
    </div>
  );
}
