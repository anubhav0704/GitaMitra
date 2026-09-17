"use client";

import Link from "next/link";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, BookOpen, ArrowRight, Shield, Sparkles, Compass } from "lucide-react";
import Navbar from "../components/Navbar";

export default function Home() {
  const { user, loading } = useAuth();
  const { t, isHindi } = useLanguage();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace("/chat");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#090714] text-amber-200">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs tracking-widest uppercase font-serif">Opening Sacred GitaMitra...</p>
        </div>
      </div>
    );
  }

  // Redirecting logged-in seeker
  if (user) return null;

  return (
    <div className="min-h-screen bg-chariot-theme flex flex-col justify-between text-stone-900 dark:text-stone-100 selection:bg-amber-500/30 selection:text-amber-900 dark:selection:text-amber-200 overflow-x-clip">
      {/* Top Sacred Navigation Bar */}
      <Navbar />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center">
        {/* Hero Section */}
        <section className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12 sm:pt-12 sm:pb-16 text-center space-y-6 sm:space-y-8">
          {/* Sacred Emblem & Badge */}
          <div className="flex flex-col items-center space-y-3">
            <div className="relative group">
              <div className="absolute inset-0 rounded-3xl bg-amber-500/35 blur-xl group-hover:blur-2xl transition-all duration-300 pointer-events-none"></div>
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-3xl overflow-hidden shadow-xl shadow-amber-500/30 border-2 border-amber-400/60 group-hover:scale-105 transition-transform bg-black shrink-0">
                <img
                  src="/logo.png"
                  alt="GitaMitra Official Logo"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full border border-amber-500/35 bg-amber-500/15 text-amber-900 dark:text-amber-200 text-xs font-serif font-semibold tracking-wider shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>{isHindi ? "श्रीमद्भगवद्गीता · शाश्वत आध्यात्मिक मित्र" : "श्रीमद्भगवद्गीता · Timeless Spiritual Companion"}</span>
            </div>
          </div>

          {/* Majestic Headline */}
          <div className="space-y-3.5 max-w-3xl mx-auto">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight font-serif leading-tight text-stone-900 dark:text-white">
              {isHindi ? (
                <>
                  आधुनिक जीवन और द्वंद्वों के लिए <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 dark:from-amber-400 dark:via-yellow-300 dark:to-orange-400">
                    शाश्वत भगवद् ज्ञान
                  </span>
                </>
              ) : (
                <>
                  Eternal Wisdom for <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 dark:from-amber-400 dark:via-yellow-300 dark:to-orange-400">
                    Modern Life & Dilemmas
                  </span>
                </>
              )}
            </h1>

            <p className="text-sm sm:text-base lg:text-lg text-stone-700 dark:text-stone-200 leading-relaxed font-sans max-w-2xl mx-auto font-medium">
              {isHindi
                ? "कुरुक्षेत्र के रथ पर अर्जुन को मिले भगवान श्री कृष्ण के प्रामाणिक मार्गदर्शन से अपने कर्म, कर्तव्य, संबंध और जीवन की उलझनों को सुलझाएँ।"
                : "Reflect on career, relationships, and duty with the authentic counsel of Lord Krishna to Arjuna on the chariot of Kurukshetra."}
            </p>
          </div>

          {/* Primary Action Buttons (Immediately Accessible Above the Fold) */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2.5 px-8 py-3.5 rounded-full bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-white text-sm font-semibold shadow-lg shadow-amber-500/30 hover:shadow-amber-500/45 active:scale-95 transition-all group cursor-pointer"
            >
              <span>{isHindi ? "आध्यात्मिक यात्रा आरंभ करें" : "Begin Spiritual Dialogue"}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              href="/gita"
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2.5 px-8 py-3.5 rounded-full border border-amber-500/40 bg-white/80 dark:bg-[#120e26]/85 text-amber-900 dark:text-amber-200 text-sm font-semibold hover:bg-amber-500/20 active:scale-95 transition-all shadow-md backdrop-blur-md"
            >
              <BookOpen className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>{isHindi ? "७०० श्लोक अन्वेषण" : "Explore 700 Verses"}</span>
            </Link>
          </div>

          {/* Religious Artwork Showcase Card */}
          <div className="pt-4 max-w-3xl mx-auto">
            <div className="relative rounded-3xl overflow-hidden border-2 border-amber-500/40 shadow-2xl shadow-amber-500/20 group">
              <img
                src="/images/krishna_arjuna_chariot.jpg"
                alt="Lord Krishna as Parthasarathi giving Bhagavad Gita upadesh to Arjuna on the golden chariot"
                className="w-full h-auto max-h-[300px] sm:max-h-[340px] object-cover object-top group-hover:scale-102 transition-transform duration-700"
              />
              <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/95 via-black/75 to-transparent text-white font-serif text-center">
                <p className="text-xs uppercase tracking-widest text-amber-300 font-bold">
                  ✦ श्रीकृष्ण-अर्जुन संवाद · कुरुक्षेत्र ✦
                </p>
                <p className="text-xs sm:text-sm text-stone-200 mt-0.5 font-sans">
                  {isHindi
                    ? "पार्थसारथि भगवान श्री कृष्ण द्वारा धनुर्धर अर्जुन को शाश्वत ज्ञान का उपदेश"
                    : "Lord Krishna as Parthasarathi imparting timeless wisdom to Prince Arjuna"}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Scriptural Shloka Highlight Section */}
        <section className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="temple-card p-6 sm:p-8 text-center space-y-4 shadow-xl">
            <div className="flex items-center justify-center space-x-2 font-serif text-xs font-semibold uppercase tracking-widest text-amber-800 dark:text-amber-400">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>{isHindi ? "श्रीमद्भगवद्गीता · अध्याय २, श्लोक ४७" : "Bhagavad Gita · Chapter 2, Verse 47"}</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            </div>

            <p className="shloka-devanagari text-xl sm:text-2xl text-stone-900 dark:text-amber-100 font-semibold py-1 leading-relaxed">
              कर्मण्येवाधिकारस्ते मा फलेषु कदाचन ।<br />
              मा कर्मफलहेतुर्भूर्मा ते सङ्गोऽस्त्वकर्मणि ॥
            </p>

            <div className="border-t border-amber-500/25 pt-3 max-w-2xl mx-auto">
              <p className="text-xs sm:text-sm text-stone-700 dark:text-stone-300 italic leading-relaxed font-sans font-medium">
                {isHindi
                  ? "«तुम्हारा अधिकार केवल कर्म करने में है, उसके फलों में कभी नहीं। अतः तुम कर्मों के फल का हेतु मत बनो और न ही अकर्मण्यता में तुम्हारी आसक्ति हो।»"
                  : "“You have a right to perform your prescribed duties, but you are not entitled to the fruits of your actions. Never consider yourself the cause of results, nor be attached to inaction.”"}
              </p>
            </div>

            <div className="pt-1">
              <Link
                href="/gita/chapter/2/verse/47"
                className="inline-flex items-center space-x-1.5 text-xs text-amber-700 dark:text-amber-300 font-serif font-semibold hover:underline"
              >
                <span>{isHindi ? "गीता अन्वेषक में श्लोक २.४७ पढ़ें" : "Read Shloka 2.47 in Gita Reader"}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </section>

        {/* Devotional Pillar Cards */}
        <section className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Card 1 */}
            <div className="temple-card p-6 space-y-3 shadow-md hover:-translate-y-1 transition-transform">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/35 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-base font-bold text-stone-900 dark:text-white">
                {isHindi ? "दिव्य संवाद" : "Divine Conversation"}
              </h3>
              <p className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed font-sans">
                {isHindi
                  ? "श्री कृष्ण के दिव्य उपदेशों से सीधा संवाद करें। प्रामाणिक श्लोक संदर्भों और व्यावहारिक सार के साथ संवेदनशील मार्गदर्शन प्राप्त करें।"
                  : "Dialogue directly with Krishna's counsel. Receive empathetic guidance enriched with authentic shloka citations and pragmatic Saar synthesis."}
              </p>
            </div>

            {/* Card 2 */}
            <div className="temple-card p-6 space-y-3 shadow-md hover:-translate-y-1 transition-transform">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/35 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-base font-bold text-stone-900 dark:text-white">
                {isHindi ? "१८ पवित्र अध्याय" : "18 Sacred Adhyayas"}
              </h3>
              <p className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed font-sans">
                {isHindi
                  ? "मूल संस्कृत देवनागरी सुलेख, रोमन लिप्यंतरण और हिन्दी-अंग्रेजी दोनों भाषाओं में अर्थ सहित सभी ७०० श्लोकों का अध्ययन करें।"
                  : "Access all 700 canonical verses with original Sanskrit Devanagari calligraphy, Roman transliterations, and dual English-Hindi commentaries."}
              </p>
            </div>

            {/* Card 3 */}
            <div className="temple-card p-6 space-y-3 shadow-md hover:-translate-y-1 transition-transform">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/35 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-base font-bold text-stone-900 dark:text-white">
                {isHindi ? "निजी आध्यात्मिक आश्रम" : "Private Sanctuary"}
              </h3>
              <p className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed font-sans">
                {isHindi
                  ? "आपकी आध्यात्मिक यात्रा पवित्र एवं गोपनीय है। अपनी व्यक्तिगत स्मृतियों को पूर्ण नियंत्रण के साथ देखें, व्यवस्थित करें या मिटाएँ।"
                  : "Your spiritual journey is sacred. Filter, inspect, and purge your personal reflection memories with end-to-end privacy control."}
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Devotional Footer */}
      <footer className="border-t border-amber-500/25 py-8 text-xs text-stone-600 dark:text-stone-400 font-serif bg-white/50 dark:bg-black/50 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-6 h-6 rounded-lg overflow-hidden border border-amber-500/40 bg-black shrink-0">
              <img src="/logo.png" alt="GitaMitra" className="w-full h-full object-cover" />
            </div>
            <span className="font-bold text-amber-700 dark:text-amber-400">GitaMitra</span>
            <span>·</span>
            <span>श्रीमद्भगवद्गीता</span>
          </div>
          <div className="flex items-center space-x-6 text-xs font-semibold">
            <Link href="/gita" className="hover:text-amber-600 dark:hover:text-amber-300 transition-colors">Gita Explorer</Link>
            <Link href="/chat" className="hover:text-amber-600 dark:hover:text-amber-300 transition-colors">Dialogue</Link>
            <Link href="/settings" className="hover:text-amber-600 dark:hover:text-amber-300 transition-colors">Sanctuary</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
