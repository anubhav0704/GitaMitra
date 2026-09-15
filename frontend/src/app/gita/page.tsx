"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, BookOpen, ArrowRight, Sparkles } from "lucide-react";
import { MobileNav } from "../../components/layout/MobileNav";
import { API_BASE } from "../../lib/api";

interface Chapter {
  chapter_number: number;
  title_sanskrit: string;
  title_english: string;
  summary_en: string;
  total_verses: number;
}

export default function GitaExplorer() {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetch(`${API_BASE}/gita/chapters`)
      .then((res) => res.json())
      .then((data) => {
        setChapters(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching chapters:", err);
        setLoading(false);
      });
  }, []);

  const filteredChapters = chapters.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.title_english.toLowerCase().includes(q) ||
      c.title_sanskrit.toLowerCase().includes(q) ||
      c.chapter_number.toString().includes(q) ||
      c.summary_en.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-chariot-theme py-12 pb-24 sm:pb-12 px-4 sm:px-6 lg:px-8 text-stone-900 dark:text-stone-100 selection:bg-amber-500/30 selection:text-amber-900 dark:selection:text-amber-200">
      <div className="max-w-6xl mx-auto space-y-10">
        {/* Hero Section */}
        <div className="text-center space-y-4 max-w-2xl mx-auto animate-in fade-in duration-300">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-lg shadow-amber-500/25 border border-amber-300/40 bg-black">
              <img src="/logo.png" alt="GitaMitra Official Logo" className="w-full h-full object-cover" />
            </div>
          </div>

          <div className="inline-flex items-center space-x-2 font-serif text-xs uppercase tracking-widest text-amber-900 dark:text-amber-300 font-bold px-4 py-1 rounded-full bg-amber-500/15 border border-amber-500/30">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>श्रीमद्भगवद्गीता · 18 Adhyayas · 700 Verses</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight font-serif text-stone-900 dark:text-white">
            Bhagavad Gita <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 dark:from-amber-400 dark:via-yellow-300 dark:to-orange-400">Explorer</span>
          </h1>

          <p className="text-xs sm:text-sm text-stone-700 dark:text-stone-300 font-sans leading-relaxed font-medium">
            Immerse yourself in all 18 sacred chapters of timeless wisdom and spiritual liberation.
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-xl mx-auto">
          <div className="relative font-sans">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-11 pr-4 py-3 rounded-full border border-amber-500/35 bg-white/95 dark:bg-[#15102a]/95 text-stone-900 dark:text-white placeholder-stone-400 text-sm focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20 transition-all shadow-lg backdrop-blur-md"
              placeholder="Search chapters by number, Sanskrit name, or topic..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3 font-serif">
            <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs text-amber-800 dark:text-amber-300 uppercase tracking-widest">Opening sacred chapters...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredChapters.map((chapter) => (
              <Link 
                href={`/gita/chapter/${chapter.chapter_number}`} 
                key={chapter.chapter_number}
                className="group block"
              >
                <div className="temple-card p-6 h-full flex flex-col justify-between hover:-translate-y-1 transition-all duration-200 shadow-md hover:shadow-xl">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center font-serif text-xs">
                      <span className="px-3 py-1 rounded-full border border-amber-500/30 bg-amber-500/15 text-amber-900 dark:text-amber-200 font-bold">
                        अध्याय {chapter.chapter_number}
                      </span>
                      <span className="text-amber-800 dark:text-amber-400 font-semibold">
                        {chapter.total_verses} Verses
                      </span>
                    </div>

                    <div>
                      <h2 className="font-serif text-lg font-bold text-stone-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                        {chapter.title_english}
                      </h2>
                      <p className="text-base text-amber-700 dark:text-amber-300 font-serif mt-0.5 font-semibold">
                        {chapter.title_sanskrit}
                      </p>
                    </div>

                    <p className="text-xs text-stone-700 dark:text-stone-300 line-clamp-2 leading-relaxed font-sans font-medium">
                      {chapter.summary_en}
                    </p>
                  </div>

                  <div className="pt-4 mt-3 border-t border-amber-500/20 flex items-center justify-between font-serif text-xs text-amber-800 dark:text-amber-300 group-hover:text-amber-900 dark:group-hover:text-amber-200 transition-colors">
                    <span className="font-semibold">Explore Chapter</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
      <MobileNav />
    </div>
  );
}
