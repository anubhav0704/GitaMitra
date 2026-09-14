"use client";

import React, { useState, useRef, useEffect } from "react";
import { Play, Pause, Square, RotateCcw, Volume2, Loader2, Sparkles } from "lucide-react";

// Global audio coordinator to ensure only one assistant response plays at a time
let currentGlobalAudio: HTMLAudioElement | null = null;
let currentGlobalStopCallback: (() => void) | null = null;

export function stopAllGlobalAudio() {
  if (currentGlobalAudio) {
    currentGlobalAudio.pause();
    currentGlobalAudio.currentTime = 0;
    currentGlobalAudio = null;
  }
  if (currentGlobalStopCallback) {
    currentGlobalStopCallback();
    currentGlobalStopCallback = null;
  }
}

interface VoiceAudioPlayerProps {
  text: string;
  messageId?: string;
  autoPlay?: boolean;
}

export default function VoiceAudioPlayer({ text, messageId, autoPlay = false }: VoiceAudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioBlobUrl, setAudioBlobUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasAutoPlayedRef = useRef(false);

  // Initialize or fetch audio blob from /api/voice/synthesize
  const fetchAudio = async (): Promise<string | null> => {
    if (audioBlobUrl) return audioBlobUrl;

    setIsLoading(true);
    setError(null);
    try {
      // Get saved voice settings from localStorage if available
      let voice = "onyx";
      let speed = 1.0;
      try {
        const savedSettings = localStorage.getItem("gitamitra_voice_settings");
        if (savedSettings) {
          const parsed = JSON.parse(savedSettings);
          if (parsed.voice) voice = parsed.voice;
          if (parsed.speed) speed = parsed.speed;
        }
      } catch {
        // ignore
      }

      const res = await fetch("http://localhost:8000/api/voice/synthesize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          text: text,
          voice: voice,
          speed: speed,
          message_id: messageId
        })
      });

      if (!res.ok) {
        throw new Error("Could not synthesize speech.");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setAudioBlobUrl(url);
      return url;
    } catch (err: any) {
      console.error("Audio synthesis error:", err);
      setError("Voice playback unavailable.");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlay = async () => {
    if (isPlaying) {
      if (audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
      return;
    }

    // Stop any previously playing audio across the entire page
    stopAllGlobalAudio();

    let url = audioBlobUrl;
    if (!url) {
      url = await fetchAudio();
      if (!url) return;
    }

    if (!audioRef.current) {
      const audio = new Audio(url);
      audioRef.current = audio;

      audio.ontimeupdate = () => {
        setCurrentTime(audio.currentTime);
      };

      audio.onloadedmetadata = () => {
        setDuration(audio.duration || 0);
      };

      audio.onended = () => {
        setIsPlaying(false);
        setCurrentTime(0);
        if (currentGlobalAudio === audio) {
          currentGlobalAudio = null;
          currentGlobalStopCallback = null;
        }
      };

      audio.onerror = () => {
        setError("Audio playback error.");
        setIsPlaying(false);
      };
    }

    try {
      currentGlobalAudio = audioRef.current;
      currentGlobalStopCallback = () => {
        setIsPlaying(false);
        setCurrentTime(0);
      };

      await audioRef.current.play();
      setIsPlaying(true);
    } catch (err) {
      console.warn("Autoplay / Play blocked:", err);
      setError("Tap play to listen.");
      setIsPlaying(false);
    }
  };

  const handleStopSpeaking = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setCurrentTime(0);
    if (currentGlobalAudio === audioRef.current) {
      currentGlobalAudio = null;
      currentGlobalStopCallback = null;
    }
  };

  const handleReplay = async () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      await audioRef.current.play();
      setIsPlaying(true);
    } else {
      handlePlay();
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  // Handle optional Auto-play on mount
  useEffect(() => {
    if (autoPlay && !hasAutoPlayedRef.current) {
      hasAutoPlayedRef.current = true;
      handlePlay();
    }
  }, [autoPlay]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (audioBlobUrl) {
        URL.revokeObjectURL(audioBlobUrl);
      }
    };
  }, [audioBlobUrl]);

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <div className="mt-3 pt-2.5 border-t border-amber-500/20 flex flex-col space-y-2 select-none">
      <div className="flex items-center justify-between">
        {/* Main Audio Controls */}
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handlePlay}
            disabled={isLoading}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-serif font-medium transition-all duration-200 cursor-pointer shadow-xs ${
              isPlaying
                ? "bg-amber-600 text-white shadow-amber-500/30"
                : "bg-amber-500/15 text-amber-900 dark:text-amber-200 hover:bg-amber-500/25 border border-amber-500/30"
            }`}
            title={isPlaying ? "Pause Reflection" : "Listen to Reflection"}
          >
            {isLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600 dark:text-amber-400" />
            ) : isPlaying ? (
              <Pause className="w-3.5 h-3.5 fill-current" />
            ) : (
              <Volume2 className="w-3.5 h-3.5" />
            )}
            <span>{isLoading ? "Preparing Voice..." : isPlaying ? "Pause" : "Listen to Reflection"}</span>
          </button>

          {/* Stop Speaking Button (Interruption) */}
          {isPlaying && (
            <button
              type="button"
              onClick={handleStopSpeaking}
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-full text-xs font-serif text-stone-600 dark:text-stone-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer border border-amber-500/20"
              title="Stop Speaking"
            >
              <Square className="w-3 h-3 fill-current" />
              <span>Stop Speaking</span>
            </button>
          )}

          {/* Replay Button */}
          {duration > 0 && !isPlaying && (
            <button
              type="button"
              onClick={handleReplay}
              className="p-1.5 rounded-full text-stone-500 hover:text-amber-600 dark:text-stone-400 dark:hover:text-amber-300 hover:bg-amber-500/10 transition-colors cursor-pointer"
              title="Replay from start"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Subtle Animated Speaking Pulse or Spiritual Badge */}
        <div className="flex items-center space-x-1 text-[11px] font-serif text-amber-800 dark:text-amber-400">
          {isPlaying ? (
            <div className="flex items-center space-x-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
              <span className="text-[10px] tracking-wide uppercase font-semibold">Speaking Calmly</span>
            </div>
          ) : (
            <div className="hidden sm:flex items-center space-x-1 text-stone-400 dark:text-stone-500 text-[10px]">
              <Sparkles className="w-3 h-3 text-amber-500/70" />
              <span>Spiritual Voice</span>
            </div>
          )}
        </div>
      </div>

      {/* Progress Bar & Timestamps (when loaded or playing) */}
      {(duration > 0 || isPlaying) && (
        <div className="flex items-center space-x-2 pt-0.5">
          <span className="text-[10px] font-mono text-stone-500 dark:text-stone-400 w-7 text-right">
            {formatTime(currentTime)}
          </span>
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="flex-1 h-1 bg-amber-500/20 rounded-lg appearance-none cursor-pointer accent-amber-600 dark:accent-amber-400"
          />
          <span className="text-[10px] font-mono text-stone-500 dark:text-stone-400 w-7">
            {formatTime(duration)}
          </span>
        </div>
      )}

      {error && (
        <p className="text-[11px] text-amber-700 dark:text-amber-400 font-serif italic">
          {error}
        </p>
      )}
    </div>
  );
}
