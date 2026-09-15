"use client";

import React, { useState, useEffect } from "react";
import { Download, Share, PlusSquare, X, Smartphone, Check } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showIosModal, setShowIosModal] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [installedSuccessfully, setInstalledSuccessfully] = useState(false);

  useEffect(() => {
    // Register Service Worker for PWA
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("/sw.js").catch((err) => {
          console.warn("ServiceWorker registration skipped:", err);
        });
      });
    }

    // Check standalone mode (already installed & running as PWA)
    const standaloneCheck =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(standaloneCheck);

    // Check if user previously dismissed banner in this session
    const isDismissed = sessionStorage.getItem("gitamitra_pwa_dismissed") === "true";
    setDismissed(isDismissed);

    // Check iOS Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(isIosDevice);

    // Listen for Chrome / Edge / Android install prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstallable(false);
      setDeferredPrompt(null);
      setInstalledSuccessfully(true);
      setTimeout(() => setInstalledSuccessfully(false), 5000);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIos) {
      setShowIosModal(true);
      return;
    }

    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setIsInstallable(false);
      }
      setDeferredPrompt(null);
    } else {
      // Fallback instruction for browsers where prompt isn't directly triggerable
      alert("To install GitaMitra on your device: open your browser's menu (⋮ or Share) and select 'Install app' or 'Add to Home Screen'.");
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem("gitamitra_pwa_dismissed", "true");
  };

  // If already running inside installed standalone app, don't show prompt
  if (isStandalone) {
    return null;
  }

  return (
    <>
      {/* Subtle Mobile/Desktop Install Invitation Banner */}
      {!dismissed && (isInstallable || isIos) && (
        <div className="fixed top-2 left-3 right-3 sm:left-auto sm:right-4 sm:top-16 sm:w-96 z-50 animate-in fade-in slide-in-from-top-3 duration-300">
          <div className="p-3 rounded-2xl bg-[#0c091a]/95 text-white border border-amber-500/40 shadow-2xl backdrop-blur-xl flex items-center justify-between gap-3">
            <div className="flex items-center space-x-3 min-w-0">
              <div className="w-10 h-10 rounded-xl overflow-hidden border border-amber-500/40 bg-black shrink-0 shadow-md">
                <img src="/logo.png" alt="GitaMitra Official Logo" className="w-full h-full object-cover" />
              </div>
              <div className="min-w-0">
                <p className="font-serif text-xs font-bold text-amber-200 truncate">
                  Use GitaMitra as an App
                </p>
                <p className="text-[10px] text-stone-300 font-sans truncate">
                  Install on your phone or PC for instant full-screen access
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-1.5 shrink-0">
              <button
                type="button"
                onClick={handleInstallClick}
                className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-stone-950 text-xs font-semibold font-serif flex items-center space-x-1 hover:brightness-110 active:scale-95 transition-all shadow-sm cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Install</span>
              </button>
              <button
                type="button"
                onClick={handleDismiss}
                className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                title="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Installed Successfully Toast */}
      {installedSuccessfully && (
        <div className="fixed bottom-16 left-4 right-4 sm:left-auto sm:right-6 z-50 p-3 rounded-2xl bg-emerald-950/90 border border-emerald-500/40 text-emerald-200 text-xs font-serif flex items-center space-x-2 shadow-2xl backdrop-blur-xl animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>GitaMitra successfully installed to your device!</span>
        </div>
      )}

      {/* iOS Safari Step-by-Step Installation Modal */}
      {showIosModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in"
          onClick={() => setShowIosModal(false)}
        >
          <div
            className="w-full max-w-sm rounded-3xl bg-[#120d24] border border-amber-500/40 p-5 text-stone-100 shadow-2xl space-y-4 animate-in slide-in-from-bottom-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-amber-500/20">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg overflow-hidden border border-amber-500 bg-black shrink-0">
                  <img src="/logo.png" alt="GitaMitra Official Logo" className="w-full h-full object-cover" />
                </div>
                <span className="font-serif font-bold text-sm text-amber-300">
                  Install GitaMitra on iPhone / iPad
                </span>
              </div>
              <button
                onClick={() => setShowIosModal(false)}
                className="p-1 rounded-full text-stone-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-stone-300 leading-relaxed font-sans">
              Install GitaMitra to your home screen for full-screen divine dialogue without the browser URL bar:
            </p>

            <ol className="space-y-2.5 text-xs font-sans text-stone-200">
              <li className="flex items-start space-x-2.5">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  1
                </span>
                <span>
                  Tap the <strong className="text-amber-300">Share</strong> button at the bottom of Safari (<Share className="inline w-3.5 h-3.5 text-amber-400" />).
                </span>
              </li>
              <li className="flex items-start space-x-2.5">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  2
                </span>
                <span>
                  Scroll down and tap <strong className="text-amber-300">Add to Home Screen</strong> (<PlusSquare className="inline w-3.5 h-3.5 text-amber-400" />).
                </span>
              </li>
              <li className="flex items-start space-x-2.5">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  3
                </span>
                <span>
                  Tap <strong className="text-amber-300">Add</strong> in the top right corner. GitaMitra is now on your phone!
                </span>
              </li>
            </ol>

            <button
              onClick={() => setShowIosModal(false)}
              className="w-full py-2 rounded-2xl bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 text-stone-950 font-serif font-bold text-xs shadow-md hover:opacity-95 transition-all"
            >
              Understood
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// Compact Button version for Sidebar or Settings
export function InstallAppButton({ className = "" }: { className?: string }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIos, setIsIos] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showIosModal, setShowIosModal] = useState(false);

  useEffect(() => {
    const standaloneCheck =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(standaloneCheck);

    const userAgent = window.navigator.userAgent.toLowerCase();
    setIsIos(/iphone|ipad|ipod/.test(userAgent));

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
  }, []);

  if (isStandalone) {
    return null;
  }

  const handleClick = async () => {
    if (isIos) {
      setShowIosModal(true);
      return;
    }
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      setDeferredPrompt(null);
    } else {
      alert("To install GitaMitra on your device: open your browser's menu (⋮ or Share) and select 'Install app' or 'Add to Home Screen'.");
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={`flex items-center space-x-2 text-xs font-serif text-amber-800 dark:text-amber-300 hover:text-amber-950 dark:hover:text-amber-100 transition-colors cursor-pointer ${className}`}
        title="Install GitaMitra as an App on your phone or PC"
      >
        <Smartphone className="w-3.5 h-3.5 text-amber-500 shrink-0" />
        <span>Use as App / Install</span>
      </button>

      {showIosModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs"
          onClick={() => setShowIosModal(false)}
        >
          <div
            className="w-full max-w-sm rounded-3xl bg-[#120d24] border border-amber-500/40 p-5 text-stone-100 shadow-2xl space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-amber-500/20">
              <span className="font-serif font-bold text-sm text-amber-300">
                Install on iOS
              </span>
              <button onClick={() => setShowIosModal(false)} className="text-stone-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-stone-300">
              In Safari, tap <strong className="text-amber-300">Share (<Share className="inline w-3 h-3" />)</strong>, then tap <strong className="text-amber-300">Add to Home Screen (<PlusSquare className="inline w-3 h-3" />)</strong>.
            </p>
            <button
              onClick={() => setShowIosModal(false)}
              className="w-full py-2 rounded-xl bg-amber-500 text-stone-950 font-serif font-bold text-xs"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </>
  );
}
