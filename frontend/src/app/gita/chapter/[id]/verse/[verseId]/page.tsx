"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { 
  ChevronLeft, 
  ChevronRight, 
  Copy, 
  Check, 
  MessageSquare, 
  ArrowLeft,
  ArrowRight,
  Sparkles
} from "lucide-react";
import { cleanSanskritShloka, cleanHindiTranslation } from "../../../../../../lib/devanagari";

interface Verse {
  chapter_number: number;
  verse_number: number;
  verse_key: string;
  sanskrit: string;
  transliteration: string;
  translation_en: string;
  translation_hi: string | null;
  explanation_en: string | null;
  explanation_hi: string | null;
  topics: string[];
  concepts: string[];
  emotions: string[];
  life_situations: string[];
}

const CHAPTER_TOTAL_VERSES: Record<number, number> = {
  1: 47,
  2: 72,
  3: 43,
  4: 42,
  5: 29,
  6: 47,
  7: 30,
  8: 28,
  9: 34,
  10: 42,
  11: 55,
  12: 20,
  13: 34,
  14: 27,
  15: 20,
  16: 24,
  17: 28,
  18: 78,
};

export default function VersePage() {
  const params = useParams();
  const router = useRouter();
  const chapterId = (params?.id as string) || "1";
  const verseId = (params?.verseId as string) || (params?.verse as string) || "1";

  const [verse, setVerse] = useState<Verse | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedSanskrit, setCopiedSanskrit] = useState(false);
  const [copiedTranslation, setCopiedTranslation] = useState(false);

  const chNum = parseInt(chapterId, 10);
  const vNum = parseInt(verseId, 10);
  const maxVerses = CHAPTER_TOTAL_VERSES[chNum] || 47;

  // Calculate Previous verse & chapter transition
  let prevDest: { chapter: number; verse: number; label: string; isCrossChapter: boolean } | null = null;
  if (vNum > 1) {
    prevDest = {
      chapter: chNum,
      verse: vNum - 1,
      label: `श्लोक ${chNum}.${vNum - 1}`,
      isCrossChapter: false
    };
  } else if (chNum > 1) {
    const prevChapter = chNum - 1;
    const prevMax = CHAPTER_TOTAL_VERSES[prevChapter];
    prevDest = {
      chapter: prevChapter,
      verse: prevMax,
      label: `अध्याय ${prevChapter} · श्लोक ${prevChapter}.${prevMax}`,
      isCrossChapter: true
    };
  }

  // Calculate Next verse & chapter transition
  let nextDest: { chapter: number; verse: number; label: string; isCrossChapter: boolean } | null = null;
  if (vNum < maxVerses) {
    nextDest = {
      chapter: chNum,
      verse: vNum + 1,
      label: `श्लोक ${chNum}.${vNum + 1}`,
      isCrossChapter: false
    };
  } else if (chNum < 18) {
    nextDest = {
      chapter: chNum + 1,
      verse: 1,
      label: `अध्याय ${chNum + 1} · श्लोक ${chNum + 1}.1`,
      isCrossChapter: true
    };
  }

  useEffect(() => {
    if (!chapterId || !verseId) return;

    const fetchVerse = async () => {
      setLoading(true);
      try {
        const res = await fetch(`http://localhost:8000/api/gita/chapters/${chapterId}/verses/${verseId}`);
        if (res.ok) {
          const data = await res.json();
          setVerse(data);
        }
      } catch (err) {
        console.error("Error fetching verse:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchVerse();
  }, [chapterId, verseId]);

  const copyText = (text: string, type: "sanskrit" | "trans") => {
    navigator.clipboard.writeText(text);
    if (type === "sanskrit") {
      setCopiedSanskrit(true);
      setTimeout(() => setCopiedSanskrit(false), 2000);
    } else {
      setCopiedTranslation(true);
      setTimeout(() => setCopiedTranslation(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#090714] text-amber-200 font-serif space-y-3">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs uppercase tracking-widest">Opening Shloka {chNum}.{vNum}...</p>
      </div>
    );
  }

  if (!verse) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#fdfaf4] dark:bg-[#090714] p-6 text-center font-serif">
        <h2 className="text-xl font-bold text-stone-900 dark:text-white mb-2">Verse Not Found</h2>
        <Link href={`/gita/chapter/${chapterId}`} className="text-xs text-amber-600 hover:underline">
          Return to Chapter {chapterId}
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-chariot-theme py-10 px-4 sm:px-6 lg:px-8 text-stone-900 dark:text-stone-100 selection:bg-amber-500/30 selection:text-amber-900 dark:selection:text-amber-200">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Navigation Header */}
        <div className="flex items-center justify-between font-serif text-xs">
          <Link
            href={`/gita/chapter/${chapterId}`}
            className="inline-flex items-center text-amber-900 dark:text-amber-300 font-bold hover:underline transition-colors px-3.5 py-1.5 rounded-full bg-white/80 dark:bg-black/70 backdrop-blur-md border border-amber-500/30 shadow-xs"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            <span>Chapter {chapterId}</span>
          </Link>

          <div className="flex items-center space-x-2 text-amber-900 dark:text-amber-200 font-bold text-xs px-3.5 py-1.5 rounded-full bg-white/80 dark:bg-black/70 backdrop-blur-md border border-amber-500/30 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>श्लोक {chNum}.{vNum} of {maxVerses}</span>
          </div>
        </div>

        {/* Central Shloka Temple Card */}
        <div className="temple-card p-8 sm:p-12 text-center space-y-6 shadow-2xl">
          <div className="flex items-center justify-between border-b border-amber-500/20 pb-3 text-xs font-serif text-amber-800 dark:text-amber-400">
            <span className="font-semibold uppercase tracking-wider">✦ Sanskrit Devanagari ✦</span>
            <button
              onClick={() => copyText(verse.sanskrit, "sanskrit")}
              className="hover:text-amber-600 dark:hover:text-amber-200 flex items-center space-x-1 transition-colors cursor-pointer"
            >
              {copiedSanskrit ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSanskrit ? "Copied" : "Copy Shloka"}</span>
            </button>
          </div>

          {/* Sanskrit Text */}
          <p className="shloka-devanagari text-2xl sm:text-3xl text-stone-900 dark:text-amber-100 py-2 font-semibold whitespace-pre-line tracking-normal">
            {cleanSanskritShloka(verse.sanskrit)}
          </p>

          {/* Transliteration */}
          {verse.transliteration && (
            <div className="font-serif text-sm sm:text-base text-amber-800/90 dark:text-amber-300/90 italic tracking-wide border-t border-amber-500/20 pt-4 whitespace-pre-line leading-relaxed">
              {verse.transliteration.replace(/\r?\n\s*\r?\n+/g, "\n").trim()}
            </div>
          )}
        </div>

        {/* Parallel Translations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* English Translation */}
          <div className="temple-card p-6 sm:p-7 space-y-3.5 shadow-md flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-amber-500/20 pb-2.5">
                <span className="font-serif text-xs text-amber-800 dark:text-amber-400 font-semibold uppercase tracking-wider">
                  English Translation
                </span>
                <button
                  onClick={() => copyText(verse.translation_en, "trans")}
                  className="hover:text-amber-600 dark:hover:text-amber-200 flex items-center space-x-1 text-xs font-serif transition-colors cursor-pointer text-amber-800/80 dark:text-amber-300/80"
                >
                  {copiedTranslation ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedTranslation ? "Copied" : "Copy"}</span>
                </button>
              </div>
              <p className="text-sm sm:text-[15px] text-stone-800 dark:text-stone-200 leading-relaxed font-sans italic font-medium">
                &quot;{verse.translation_en}&quot;
              </p>
            </div>
          </div>

          {/* Hindi Translation */}
          {verse.translation_hi && (
            <div className="temple-card p-6 sm:p-7 space-y-3.5 shadow-md flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-amber-500/20 pb-2.5">
                  <span className="font-devanagari text-xs text-amber-800 dark:text-amber-400 font-semibold tracking-wide">
                    हिन्दी अनुवाद (Hindi)
                  </span>
                  <button
                    onClick={() => copyText(cleanHindiTranslation(verse.translation_hi), "trans")}
                    className="hover:text-amber-600 dark:hover:text-amber-200 flex items-center space-x-1 text-xs font-serif transition-colors cursor-pointer text-amber-800/80 dark:text-amber-300/80"
                  >
                    {copiedTranslation ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedTranslation ? "Copied" : "Copy"}</span>
                  </button>
                </div>
                <p className="devanagari-prose text-base sm:text-[17px] text-stone-850 dark:text-stone-150 leading-[2.0] font-medium text-justify sm:text-left">
                  {cleanHindiTranslation(verse.translation_hi)}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Action Link: Discuss with Lord Krishna */}
        <div className="flex justify-center pt-2">
          <Link
            href={`/chat?prompt=${encodeURIComponent(`Please guide me on the practical application of Bhagavad Gita Chapter ${chNum}, Verse ${vNum}: "${verse.translation_en}"`)}`}
            className="inline-flex items-center space-x-2.5 px-8 py-3.5 rounded-full bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-white font-serif font-semibold shadow-lg shadow-amber-500/30 hover:shadow-amber-500/45 active:scale-95 transition-all"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Reflect on this Verse with Lord Krishna</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Bottom Prev / Next Navigation Bar */}
        <div className="pt-8 border-t border-amber-500/30 flex items-center justify-between font-serif text-xs">
          {prevDest ? (
            <Link
              href={`/gita/chapter/${prevDest.chapter}/verse/${prevDest.verse}`}
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-full border border-amber-500/35 bg-white/80 dark:bg-[#120e26]/85 text-amber-950 dark:text-amber-200 font-bold hover:bg-amber-500/20 transition-colors shadow-md backdrop-blur-md"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>← {prevDest.label}</span>
            </Link>
          ) : (
            <div />
          )}

          {nextDest && (
            <Link
              href={`/gita/chapter/${nextDest.chapter}/verse/${nextDest.verse}`}
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-full border border-amber-500/35 bg-white/80 dark:bg-[#120e26]/85 text-amber-950 dark:text-amber-200 font-bold hover:bg-amber-500/20 transition-colors shadow-md backdrop-blur-md"
            >
              <span>{nextDest.label} →</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
