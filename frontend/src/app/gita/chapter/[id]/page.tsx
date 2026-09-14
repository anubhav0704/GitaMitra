"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronLeft, ArrowRight, Sparkles } from "lucide-react";

interface Chapter {
  chapter_number: number;
  title_sanskrit: string;
  title_english: string;
  summary_en: string;
  total_verses: number;
  themes: string[];
}

interface Verse {
  chapter_number: number;
  verse_number: number;
  translation_en: string;
}

export default function ChapterPage() {
  const params = useParams();
  const chapterId = (params?.id as string) || "1";

  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!chapterId) return;

    const fetchChapterData = async () => {
      try {
        const [chapterRes, versesRes] = await Promise.all([
          fetch(`http://localhost:8000/api/gita/chapters/${chapterId}`),
          fetch(`http://localhost:8000/api/gita/chapters/${chapterId}/verses`)
        ]);
        
        if (chapterRes.ok && versesRes.ok) {
          const chapterData = await chapterRes.json();
          const versesData = await versesRes.json();
          setChapter(chapterData);
          setVerses(versesData);
        }
      } catch (err) {
        console.error("Error fetching chapter:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchChapterData();
  }, [chapterId]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#090714] text-amber-200 font-serif space-y-3">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs uppercase tracking-widest">Opening Adhyaya...</p>
      </div>
    );
  }

  if (!chapter) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#fdfaf4] dark:bg-[#090714] p-6 text-center font-serif">
        <h2 className="text-2xl font-bold text-stone-900 dark:text-white mb-2">Chapter Not Found</h2>
        <Link href="/gita" className="text-amber-600 hover:underline text-xs">
          Return to All Chapters
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-chariot-theme py-10 px-4 sm:px-6 lg:px-8 text-stone-900 dark:text-stone-100 selection:bg-amber-500/30 selection:text-amber-900 dark:selection:text-amber-200">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Back Link */}
        <Link 
          href="/gita" 
          className="inline-flex items-center text-xs font-serif uppercase tracking-wider text-amber-900 dark:text-amber-300 font-bold hover:underline transition-colors px-3 py-1.5 rounded-full bg-white/70 dark:bg-black/60 backdrop-blur-md border border-amber-500/30"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          <span>Back to All 18 Adhyayas</span>
        </Link>

        {/* Chapter Hero Card - Temple Glass */}
        <div className="temple-card p-8 sm:p-10 text-center space-y-4 shadow-xl">
          <div className="inline-flex items-center space-x-2 font-serif text-xs uppercase tracking-widest text-amber-800 dark:text-amber-300 font-semibold px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>अध्याय {chapter.chapter_number} of 18</span>
          </div>

          <div>
            <h1 className="text-3xl sm:text-4xl font-bold font-serif text-stone-900 dark:text-white tracking-tight">
              {chapter.title_english}
            </h1>
            <p className="text-2xl text-amber-600 dark:text-amber-400 font-devanagari mt-2 font-semibold tracking-normal">
              {chapter.title_sanskrit}
            </p>
          </div>

          <p className="text-xs sm:text-sm text-stone-700 dark:text-stone-300 max-w-2xl mx-auto leading-relaxed font-sans font-medium">
            {chapter.summary_en}
          </p>

          {chapter.themes && chapter.themes.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2 font-serif text-xs">
              {chapter.themes.map((theme, i) => (
                <span 
                  key={i}
                  className="px-3.5 py-1 rounded-full border border-amber-500/30 bg-amber-500/15 text-amber-900 dark:text-amber-200 font-semibold"
                >
                  ✦ {theme}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Verses Grid Header */}
        <div className="flex items-center justify-between font-serif text-xs uppercase tracking-wider text-amber-900 dark:text-amber-300 font-bold pt-4 border-b border-amber-500/30 pb-3">
          <span>Verses in this Sacred Chapter</span>
          <span>{verses.length} of {chapter.total_verses} Verses</span>
        </div>

        {/* Verses Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {verses.map((verse) => (
            <Link
              key={verse.verse_number}
              href={`/gita/chapter/${chapter.chapter_number}/verse/${verse.verse_number}`}
              className="temple-card p-5 hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between group shadow-sm hover:shadow-md"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between font-serif text-xs text-amber-700 dark:text-amber-400 font-bold">
                  <span>श्लोक {chapter.chapter_number}.{verse.verse_number}</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
                <p className="text-xs text-stone-700 dark:text-stone-300 line-clamp-3 leading-relaxed font-sans italic">
                  &quot;{verse.translation_en}&quot;
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
