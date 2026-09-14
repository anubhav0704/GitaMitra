"use client";

import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
  ArrowUp,
  PanelLeftOpen,
  Plus,
  BookOpen,
  AlertCircle,
  RefreshCw,
  Square,
  Sun,
  Moon,
  Sparkles,
  Compass,
  Mic,
  MicOff,
  Check,
  X,
  Loader2
} from "lucide-react";

import Sidebar, { ConversationItem } from "../../components/chat/Sidebar";
import MessageBubble, { MessageItem } from "../../components/chat/MessageBubble";
import { ShlokaReference } from "../../components/chat/ShlokaCard";
import { useVoiceRecorder } from "../../lib/voice";
import { API_BASE } from "../../lib/api";
import { OnboardingModal } from "../../components/onboarding/OnboardingModal";
import { MobileNav } from "../../components/layout/MobileNav";

interface PromptCard {
  title: string;
  prompt: string;
  tag: string;
}

const SUGGESTED_CARDS: PromptCard[] = [
  {
    title: "Overcoming failure & rejection",
    prompt: "I failed my interview and I feel like I am useless.",
    tag: "कर्म योग // Karma Yoga"
  },
  {
    title: "Anxiety & restless mind",
    prompt: "How do I control my anger and restless mind?",
    tag: "ध्यान योग // Dhyana Yoga"
  },
  {
    title: "Comparison & jealousy",
    prompt: "My friend got a much better job than me and I feel jealous.",
    tag: "ज्ञान योग // Jnana Yoga"
  },
  {
    title: "Confusion about career & purpose",
    prompt: "I am confused about my career and life direction.",
    tag: "स्वधर्म // Swadharma"
  }
];

export default function ChatPage() {
  const { user, loading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();

  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  
  const [inputText, setInputText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [streamingRefs, setStreamingRefs] = useState<ShlokaReference[]>([]);
  const [chatError, setChatError] = useState<string | null>(null);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Check for first-time onboarding
  useEffect(() => {
    if (user) {
      const completed = localStorage.getItem(`gitamitra_onboarding_completed_${user.id}`);
      if (!completed) {
        setShowOnboarding(true);
      }
    }
  }, [user]);

  const handleOnboardingComplete = () => {
    if (user) {
      localStorage.setItem(`gitamitra_onboarding_completed_${user.id}`, "true");
    }
    setShowOnboarding(false);
  };

  // Support ?prompt= query param on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const promptParam = urlParams.get("prompt");
      if (promptParam) {
        setInputText(promptParam);
        window.history.replaceState({}, "", "/chat");
        if (textareaRef.current) {
          textareaRef.current.focus();
        }
      }
    }
  }, []);

  // Voice recording state
  const {
    isRecording,
    recordingDuration,
    recordingError,
    startRecording,
    stopRecording,
    cancelRecording
  } = useVoiceRecorder();

  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isVoiceInput, setIsVoiceInput] = useState(false);
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);

  const handleStartRecording = async () => {
    setVoiceNotice(null);
    const started = await startRecording();
    if (!started && recordingError) {
      setVoiceNotice(recordingError);
    }
  };

  const handleFinishRecording = async () => {
    const audioBlob = await stopRecording();
    if (!audioBlob) return;

    setIsTranscribing(true);
    setVoiceNotice(null);

    try {
      const formData = new FormData();
      let ext = "webm";
      if (audioBlob.type.includes("wav")) ext = "wav";
      else if (audioBlob.type.includes("ogg")) ext = "ogg";
      else if (audioBlob.type.includes("mp4")) ext = "mp4";

      formData.append("file", audioBlob, `speech.${ext}`);
      formData.append("detect_language", "true");

      const res = await fetch(`${API_BASE}/voice/transcribe`, {
        method: "POST",
        credentials: "include",
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        if (data.text && data.text.trim()) {
          setInputText(data.text.trim());
          setIsVoiceInput(true);
          if (textareaRef.current) {
            textareaRef.current.focus();
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
          }
        } else {
          setVoiceNotice("No speech recognized. Please speak clearly and try again.");
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        setVoiceNotice(errData.detail || "Speech recognition failed. Please try again.");
      }
    } catch (err: any) {
      console.error("Transcription error:", err);
      setVoiceNotice("Could not connect to speech transcription service.");
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleCancelRecording = () => {
    cancelRecording();
    setVoiceNotice(null);
  };

  const stopGenerating = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsGenerating(false);
  };

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  // Load saved sidebar collapsed state
  useEffect(() => {
    try {
      const saved = localStorage.getItem("gitamitra_sidebar_collapsed");
      if (saved === "true") {
        setSidebarCollapsed(true);
      }
    } catch {
      // ignore
    }
  }, []);

  const toggleSidebarCollapse = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("gitamitra_sidebar_collapsed", String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  // Load conversations list
  const loadConversations = async () => {
    try {
      const res = await fetch(`${API_BASE}/conversations`, {
        credentials: "include"
      });
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
      }
    } catch (err) {
      console.error("Failed to load conversations", err);
    }
  };

  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user]);

  // Load messages when active conversation changes
  useEffect(() => {
    if (!activeConvId) {
      setMessages([]);
      return;
    }

    if (isGenerating) {
      return;
    }

    const loadMessages = async () => {
      try {
        const res = await fetch(`${API_BASE}/conversations/${activeConvId}`, {
          credentials: "include"
        });
        if (res.ok) {
          const data = await res.json();
          setMessages(data.messages || []);
        }
      } catch (err) {
        console.error("Failed to load conversation details", err);
      }
    };

    loadMessages();
  }, [activeConvId]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  // Auto-resize textarea
  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  };

  const startNewChat = () => {
    stopGenerating();
    setActiveConvId(null);
    setMessages([]);
    setStreamingContent("");
    setStreamingRefs([]);
    setChatError(null);
    setInputText("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const deleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`${API_BASE}/conversations/${id}`, {
        method: "DELETE",
        credentials: "include"
      });
      if (res.ok) {
        setConversations((prev) => prev.filter((c) => c.id !== id));
        if (activeConvId === id) {
          startNewChat();
        }
      }
    } catch (err) {
      console.error("Failed to delete conversation", err);
    }
  };

  const handleRenameConversation = async (id: string, newTitle: string) => {
    try {
      const res = await fetch(`${API_BASE}/conversations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ title: newTitle })
      });
      if (res.ok) {
        setConversations((prev) =>
          prev.map((c) => (c.id === id ? { ...c, title: newTitle } : c))
        );
      }
    } catch (err) {
      console.error("Failed to rename conversation", err);
    }
  };

  const handleRegenerate = () => {
    const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
    if (lastUserMsg && !isGenerating) {
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last && last.role === "assistant") {
          return prev.slice(0, -1);
        }
        return prev;
      });
      sendMessage(lastUserMsg.content, lastUserMsg.input_mode as any);
    }
  };

  // Send message via SSE streaming
  const sendMessage = async (textToSend?: string, mode?: "text" | "voice") => {
    const message = (textToSend || inputText).trim();
    if (!message || isGenerating) return;

    const currentMode = mode || (isVoiceInput ? "voice" : "text");
    setIsVoiceInput(false);

    setInputText("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    setChatError(null);
    setIsGenerating(true);
    setStreamingContent("");
    setStreamingRefs([]);

    // Append optimistic user message with input_mode
    const userMsg: MessageItem = { role: "user", content: message, input_mode: currentMode };
    setMessages((prev) => [...prev, userMsg]);

    const controller = new AbortController();
    abortControllerRef.current = controller;
    const timeoutId = setTimeout(() => {
      if (abortControllerRef.current === controller) {
        controller.abort("Request timed out. Please retry.");
      }
    }, 25000);

    try {
      const response = await fetch(`${API_BASE}/chat/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        signal: controller.signal,
        body: JSON.stringify({
          message: message,
          conversation_id: activeConvId || undefined
        })
      });

      if (!response.ok) {
        throw new Error(`Server error (${response.status})`);
      }

      if (!response.body) {
        throw new Error("ReadableStream not supported");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";
      let accumulatedText = "";
      let finalReferences: ShlokaReference[] = [];
      let finalMemories: Array<{ type: string; summary?: string; content?: string }> = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const dataStr = line.slice(6).trim();
            if (!dataStr) continue;

            try {
              const parsed = JSON.parse(dataStr);

              // Server conversation initialization
              if (parsed.conversation_id) {
                if (!activeConvId) {
                  setActiveConvId(parsed.conversation_id);
                  loadConversations();
                }
              }

              // Text tokens
              if (parsed.token) {
                accumulatedText += parsed.token;
                setStreamingContent(accumulatedText);
              }

              // Scriptural references
              if (parsed.references) {
                finalReferences = parsed.references;
                setStreamingRefs(parsed.references);
              }

              // Memory updates
              if (parsed.memories) {
                finalMemories = parsed.memories;
              }

              // Stream ended
              if (parsed.done) {
                const assistantMsg: MessageItem = {
                  role: "assistant",
                  content: accumulatedText || parsed.message || "",
                  references: finalReferences,
                  memories: finalMemories,
                  created_at: new Date().toISOString()
                };

                setMessages((prev) => [...prev, assistantMsg]);
                setStreamingContent("");
                setStreamingRefs([]);
                setIsGenerating(false);
                loadConversations();
                return;
              }

              // Error emitted in stream
              if (parsed.error) {
                setChatError(parsed.error);
                setIsGenerating(false);
                return;
              }
            } catch (jsonErr) {
              console.warn("JSON stream parse skip:", jsonErr, line);
            }
          }
        }
      }

      // Stream finished without explicit done flag
      if (accumulatedText) {
        const assistantMsg: MessageItem = {
          role: "assistant",
          content: accumulatedText,
          references: finalReferences,
          memories: finalMemories,
          created_at: new Date().toISOString()
        };
        setMessages((prev) => [...prev, assistantMsg]);
        setStreamingContent("");
        setStreamingRefs([]);
        loadConversations();
      }
    } catch (err: any) {
      if (err.name === "AbortError") {
        setChatError("Response was cancelled or reached timeout. Please try again.");
      } else {
        console.error("Streaming error", err);
        setChatError(err.message || "Unable to reach GitaMitra. Please try again.");
      }
    } finally {
      clearTimeout(timeoutId);
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
      setIsGenerating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#090714] text-amber-200 font-serif">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs tracking-widest uppercase">Entering Spiritual Sanctuary...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const firstName = user.name ? user.name.split(" ")[0] : "Seeker";

  return (
    <div className="fixed inset-0 flex h-screen w-screen overflow-hidden bg-krishna-theme text-stone-900 dark:text-stone-100 selection:bg-amber-500/30 selection:text-amber-900 dark:selection:text-amber-200">
      {/* Sidebar (Sacred Temple Drawer) */}
      <Sidebar
        conversations={conversations}
        activeId={activeConvId}
        onSelect={(id) => {
          if (id !== activeConvId) {
            stopGenerating();
            setActiveConvId(id);
          }
        }}
        onNewChat={startNewChat}
        onDelete={deleteConversation}
        onRename={handleRenameConversation}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={toggleSidebarCollapse}
      />

      {/* Main Chat Workspace */}
      <div className="flex-1 min-w-0 flex flex-col h-full max-h-screen overflow-hidden relative">
        {/* Top Header Bar */}
        <header className="h-14 flex items-center justify-between px-4 border-b border-amber-500/25 bg-white/80 dark:bg-[#0c091a]/85 backdrop-blur-xl z-10 flex-shrink-0">
          <div className="flex items-center space-x-2">
            {/* Mobile drawer toggle */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 text-stone-500 hover:text-amber-600 dark:text-stone-400 dark:hover:text-amber-300 rounded-xl hover:bg-amber-500/10 transition-colors cursor-pointer"
              title="Open drawer"
              aria-label="Open drawer"
            >
              <PanelLeftOpen className="w-4 h-4" />
            </button>

            {/* Desktop collapse toggle */}
            {sidebarCollapsed && (
              <button
                onClick={toggleSidebarCollapse}
                className="hidden md:flex p-2 text-stone-500 hover:text-amber-600 dark:text-stone-400 dark:hover:text-amber-300 rounded-xl hover:bg-amber-500/10 transition-colors cursor-pointer"
                title="Expand sidebar"
                aria-label="Expand sidebar"
              >
                <PanelLeftOpen className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={startNewChat}
              className="p-2 text-stone-500 hover:text-amber-600 dark:text-stone-400 dark:hover:text-amber-300 rounded-xl hover:bg-amber-500/10 transition-colors cursor-pointer"
              title="New inquiry"
            >
              <Plus className="w-4 h-4" />
            </button>

            {/* Model Badge */}
            <div className="flex items-center space-x-2 px-3 py-1 rounded-full border border-amber-500/30 bg-amber-500/15 text-xs font-serif font-bold text-amber-900 dark:text-amber-200 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>GitaMitra · गीतामित्र</span>
            </div>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center space-x-2">
            <Link
              href="/gita"
              className="flex items-center space-x-1.5 px-3.5 py-1 text-xs font-serif font-semibold text-amber-900 dark:text-amber-200 border border-amber-500/30 bg-amber-500/15 rounded-full hover:bg-amber-500/25 transition-colors"
              title="Browse Bhagavad Gita Verses"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Gita 700 Verses</span>
            </Link>

            <button
              onClick={toggleTheme}
              className="w-8 h-8 rounded-full border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 flex items-center justify-center text-amber-700 dark:text-amber-300 transition-colors cursor-pointer"
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-amber-700" />
              )}
            </button>
          </div>
        </header>

        {/* Scrollable Conversation Container */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain custom-scrollbar px-3 sm:px-4 py-3 sm:py-4">
          <div className="max-w-3xl mx-auto w-full">
            {messages.length === 0 && !streamingContent ? (
              /* Divine Welcome Screen with Lord Krishna Portrait */
              <div className="py-3 sm:py-5 px-2 text-center space-y-3 sm:space-y-4 animate-in fade-in duration-300">
                {/* Celestial Portrait of Lord Krishna */}
                <div className="relative inline-flex items-center justify-center group">
                  <div className="absolute inset-0 rounded-full bg-amber-500/30 blur-2xl group-hover:blur-3xl transition-all duration-300 pointer-events-none"></div>
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-2 border-amber-400/80 shadow-2xl shadow-amber-500/30 group-hover:scale-105 transition-transform duration-500">
                    <img
                      src="/images/krishna_divine_portrait.jpg"
                      alt="Lord Krishna in Celestial Realm"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="font-serif text-[11px] sm:text-xs uppercase tracking-widest text-amber-800 dark:text-amber-400 font-semibold">
                    ✦ ॐ नमो भगवते वासुदेवाय ✦
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 dark:text-white font-serif">
                    Namaste, <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 dark:from-amber-400 dark:via-yellow-300 dark:to-orange-400">{firstName}</span>
                  </h1>
                  <p className="text-xs sm:text-sm text-stone-700 dark:text-stone-300 max-w-md mx-auto font-sans leading-relaxed font-medium">
                    What dilemma, emotion, or duty would you like to reflect upon with the divine counsel of Lord Krishna?
                  </p>
                </div>

                {/* Suggested Inquiries Temple Grid */}
                <div className="pt-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-left">
                    {SUGGESTED_CARDS.map((card, i) => (
                      <button
                        key={i}
                        onClick={() => sendMessage(card.prompt)}
                        className="temple-card p-3.5 sm:p-4 hover:-translate-y-0.5 active:scale-[0.99] transition-all duration-200 text-left cursor-pointer flex flex-col justify-between group shadow-sm hover:shadow-md"
                      >
                        <div>
                          <div className="flex items-center justify-between font-serif text-[10px] sm:text-[11px] text-amber-800 dark:text-amber-400 font-semibold uppercase tracking-wider mb-1">
                            <span>✦ Inquiry 0{i + 1}</span>
                            <span>{card.tag}</span>
                          </div>
                          <p className="font-serif text-xs font-bold text-stone-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                            {card.title}
                          </p>
                          <p className="text-[11px] sm:text-xs text-stone-700 dark:text-stone-300 mt-0.5 leading-relaxed font-sans font-medium line-clamp-2">
                            &quot;{card.prompt}&quot;
                          </p>
                        </div>
                        <div className="mt-2.5 flex items-center justify-end">
                          <Compass className="w-3.5 h-3.5 text-stone-400 group-hover:text-amber-600 dark:group-hover:text-amber-400 group-hover:rotate-45 transition-all" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* Message Thread */
              <div className="space-y-4">
                {messages.map((msg, idx) => (
                  <MessageBubble
                    key={idx}
                    message={msg}
                    onRegenerate={idx === messages.length - 1 && msg.role === "assistant" ? handleRegenerate : undefined}
                  />
                ))}

                {/* Streaming Assistant Message */}
                {isGenerating && streamingContent && (
                  <MessageBubble
                    message={{
                      role: "assistant",
                      content: streamingContent,
                      references: streamingRefs
                    }}
                  />
                )}

                {/* Generating Status Pulse */}
                {isGenerating && !streamingContent && (
                  <div className="flex items-center space-x-2.5 py-4 font-serif text-xs text-amber-700 dark:text-amber-400">
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping"></div>
                    <span className="font-medium">Lord Krishna is reflecting on the Bhagavad Gita...</span>
                  </div>
                )}
              </div>
            )}

            {/* Error Banner */}
            {chatError && (
              <div className="mt-4 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center justify-between font-serif">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{chatError}</span>
                </div>
                <button
                  onClick={() => sendMessage()}
                  className="inline-flex items-center space-x-1 text-xs font-bold underline ml-3 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Retry</span>
                </button>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Pinned Bottom Floating Composer */}
        <div className="flex-shrink-0 px-3 sm:px-4 pt-2.5 pb-16 sm:py-3 bg-white/75 dark:bg-[#0c091a]/85 backdrop-blur-xl border-t border-amber-500/20 z-20">
          <div className="max-w-3xl mx-auto w-full">
            {/* Voice Recording Active Banner */}
            {isRecording && (
              <div className="mb-2.5 p-3 rounded-2xl bg-amber-500/15 dark:bg-amber-950/40 border border-amber-500/40 backdrop-blur-xl flex items-center justify-between animate-in fade-in slide-in-from-bottom-2 shadow-lg">
                <div className="flex items-center space-x-3">
                  <div className="relative flex items-center justify-center">
                    <span className="animate-ping absolute inline-flex h-4 w-4 rounded-full bg-rose-500 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-600"></span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-serif text-xs font-bold text-stone-900 dark:text-amber-100 flex items-center gap-1.5">
                      <span>Listening to your voice...</span>
                      <span className="text-[11px] text-amber-700 dark:text-amber-300 font-mono">
                        (00:{recordingDuration < 10 ? `0${recordingDuration}` : recordingDuration} / 01:00)
                      </span>
                    </span>
                    <span className="text-[10px] text-stone-600 dark:text-stone-300 font-sans">
                      Speak freely in English, Hindi, or Hinglish
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={handleCancelRecording}
                    className="p-1.5 rounded-full hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200 transition-colors cursor-pointer"
                    title="Cancel recording"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleFinishRecording}
                    className="px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-600 to-amber-500 text-white font-serif text-xs font-semibold hover:opacity-90 active:scale-95 transition-all flex items-center space-x-1 cursor-pointer shadow-sm"
                  >
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Done</span>
                  </button>
                </div>
              </div>
            )}

            {/* Transcription In-Progress Indicator */}
            {isTranscribing && (
              <div className="mb-2.5 p-2.5 rounded-2xl bg-amber-500/10 dark:bg-amber-950/30 border border-amber-500/30 flex items-center justify-center space-x-2 text-xs font-serif text-amber-800 dark:text-amber-300 animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin text-amber-600 dark:text-amber-400" />
                <span>Transcribing your speech with Gita-grounded precision...</span>
              </div>
            )}

            {/* Voice Notice / Error Banner */}
            {voiceNotice && (
              <div className="mb-2 p-2.5 rounded-xl bg-amber-100 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800/60 text-[11px] font-sans text-amber-900 dark:text-amber-200 flex items-center justify-between">
                <span>{voiceNotice}</span>
                <button
                  type="button"
                  onClick={() => setVoiceNotice(null)}
                  className="ml-2 text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            <div className="rounded-[24px] bg-white/95 dark:bg-[#15102a]/95 backdrop-blur-xl border border-amber-500/35 p-2.5 sm:p-3 shadow-xl focus-within:border-amber-500 dark:focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-500/20 transition-all duration-200 flex flex-col">
              {/* Voice Transcribed Notice Badge */}
              {isVoiceInput && inputText.trim() && (
                <div className="px-2 py-0.5 mb-1 inline-flex items-center space-x-1 text-[10px] font-serif text-amber-700 dark:text-amber-300 bg-amber-500/10 rounded-full border border-amber-500/20 self-start">
                  <Mic className="w-3 h-3 text-amber-600" />
                  <span>Voice Transcribed — Review or edit before sending</span>
                </div>
              )}

              <textarea
                ref={textareaRef}
                value={inputText}
                onChange={handleTextareaInput}
                onKeyDown={handleKeyDown}
                rows={1}
                placeholder="Ask Lord Krishna anything about your duty, peace, purpose, or Gita verses..."
                className="w-full max-h-36 resize-none bg-transparent px-2 py-1 text-sm sm:text-[15px] text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-stone-500 focus:outline-none font-sans"
              />

              <div className="flex items-center justify-between pt-1.5 px-1 min-w-0">
                <div className="flex items-center space-x-1.5 font-serif text-[10px] sm:text-[11px] text-amber-800 dark:text-amber-400 truncate pr-2">
                  <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
                  <span className="truncate">Grounded in 700 Verses of Bhagavad Gita</span>
                </div>

                <div className="flex items-center space-x-2">
                  {/* Microphone Action Button */}
                  <button
                    type="button"
                    onClick={isRecording ? handleFinishRecording : handleStartRecording}
                    disabled={isGenerating || isTranscribing}
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                      isRecording
                        ? "bg-rose-600 text-white animate-pulse shadow-md shadow-rose-500/30 ring-2 ring-rose-400"
                        : "bg-amber-500/15 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 hover:bg-amber-500/25 border border-amber-500/30"
                    }`}
                    title={isRecording ? "Finish recording" : "Speak to GitaMitra"}
                  >
                    {isRecording ? <Square className="w-3 h-3 fill-current" /> : <Mic className="w-3.5 h-3.5" />}
                  </button>

                  {/* Send / Stop Generating Button */}
                  {isGenerating ? (
                    <button
                      type="button"
                      onClick={stopGenerating}
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-stone-900 dark:bg-amber-400 text-white dark:text-stone-900 flex items-center justify-center hover:opacity-80 active:scale-95 transition-all cursor-pointer shadow-xs"
                      title="Stop generating"
                    >
                      <Square className="w-3 h-3 fill-current" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => sendMessage()}
                      disabled={!inputText.trim()}
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tr from-amber-600 via-amber-500 to-amber-600 text-white disabled:opacity-20 flex items-center justify-center hover:opacity-90 active:scale-95 transition-all cursor-pointer shadow-md shadow-amber-500/30"
                      title="Send inquiry"
                    >
                      <ArrowUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            <p className="text-[10px] sm:text-[11px] text-stone-500 dark:text-stone-400 text-center mt-1.5 font-serif">
              GitaMitra offers spiritual reflection grounded in Dharma. Press Enter to send, Shift+Enter for newline.
            </p>
          </div>
        </div>
      </div>

      {/* Lightweight First-Time Onboarding Modal */}
      {showOnboarding && (
        <OnboardingModal
          isOpen={showOnboarding}
          onComplete={handleOnboardingComplete}
          userName={user.name || undefined}
        />
      )}


      {/* Mobile Bottom Navigation */}
      <MobileNav />
    </div>
  );
}
