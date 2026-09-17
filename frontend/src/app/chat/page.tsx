"use client";

import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { useLanguage, LanguageSwitcherButton } from "../../context/LanguageContext";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
  ArrowUp,
  ArrowDown,
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
import { API_BASE, getAuthHeaders, resilientFetch } from "../../lib/api";
import { OnboardingModal } from "../../components/onboarding/OnboardingModal";
import { MobileNav } from "../../components/layout/MobileNav";
import { InstallAppButton } from "../../components/pwa/PWAInstallPrompt";

interface PromptCard {
  title: string;
  prompt: string;
  tag: string;
}

const INQUIRY_LIBRARY_EN: PromptCard[] = [
  {
    title: "Moral Duty vs Affection",
    prompt: "How do I choose between doing what is right and protecting the feelings of someone I love?",
    tag: "Duty & Ethics"
  },
  {
    title: "Anxiety & Racing Thoughts",
    prompt: "My mind never stops worrying about what might happen next. How do I find inner calm?",
    tag: "Mindful Meditation"
  },
  {
    title: "Releasing Fear of Failure",
    prompt: "I am giving my best effort, but fear of an outcome is paralyzing me. How do I act with detachment?",
    tag: "Selfless Action"
  },
  {
    title: "Grief & Coping with Loss",
    prompt: "I am struggling with deep sorrow after losing someone precious. How does the Gita understand grief?",
    tag: "Eternal Soul"
  },
  {
    title: "Mastering Anger & Irritation",
    prompt: "Small frustrations quickly trigger my anger and disturb my peace. How do I maintain equanimity?",
    tag: "Equanimity"
  },
  {
    title: "Loneliness & Feeling Alienated",
    prompt: "I feel surrounded by people yet profoundly alone and misunderstood. How can I feel connected within?",
    tag: "Devotion & Oneness"
  },
  {
    title: "Mental Exhaustion & Burnout",
    prompt: "I feel depleted and overwhelmed by non-stop demands. Where do I find renewal and balance?",
    tag: "Moderation"
  },
  {
    title: "Overcoming Comparison & Envy",
    prompt: "When I see others flourishing while I struggle, bitterness creeps in. How do I transcend jealousy?",
    tag: "Wisdom & Truth"
  },
  {
    title: "Forgiving Deep Betrayal",
    prompt: "Someone broke my trust. How can I practice forgiveness without feeling like a victim?",
    tag: "Forgiveness"
  },
  {
    title: "Discovering Authentic Calling",
    prompt: "I feel trapped between external expectations and my own nature. How do I recognize my true calling?",
    tag: "Inner Nature"
  },
  {
    title: "Self-Doubt & Inner Critic",
    prompt: "I constantly feel not good enough and doubt my abilities. How do I cultivate unshakeable self-faith?",
    tag: "Self-Confidence"
  },
  {
    title: "Standing Firm in Crisis",
    prompt: "Circumstances feel overwhelming right now. How do I gather courage when everything feels shaken?",
    tag: "Courage"
  },
  {
    title: "Guilt & Healing Past Regrets",
    prompt: "I carry heavy guilt about mistakes I made in the past. Can an individual truly be redeemed?",
    tag: "Inner Healing"
  },
  {
    title: "Love Without Possessiveness",
    prompt: "How can I love and care for others deeply without becoming possessive or terrified of losing them?",
    tag: "Pure Attachment"
  },
  {
    title: "Conflict & Ethical Decisions",
    prompt: "When two good values clash, how does higher wisdom guide a seeker to discern the right action?",
    tag: "Discernment"
  },
  {
    title: "Accepting Inevitable Change",
    prompt: "Life transitions frighten me and I resist change. How do I accept the flow of time and impermanence?",
    tag: "Impermanence"
  }
];

const INQUIRY_LIBRARY_HI: PromptCard[] = [
  {
    title: "कर्तव्य और स्नेह का द्वंद्व",
    prompt: "उचित कर्तव्य का पालन करने और किसी प्रियजन की भावनाओं की रक्षा करने में से मैं किसे प्राथमिकता दूँ?",
    tag: "धर्म और कर्तव्य"
  },
  {
    title: "चिंता और चंचल विचार",
    prompt: "मेरा मन भविष्य की आशंकाओं से कभी शांत नहीं होता। मैं आंतरिक शांति कैसे प्राप्त करूँ?",
    tag: "ध्यान योग"
  },
  {
    title: "असफलता के भय से मुक्ति",
    prompt: "मैं पूरा परिश्रम कर रहा हूँ, फिर भी परिणाम का भय मुझे विचलित करता है। अनासक्त होकर कर्म कैसे करूँ?",
    tag: "निष्काम कर्म"
  },
  {
    title: "शोक और वियोग की वेदना",
    prompt: "किसी प्रिय के बिछड़ने से मन गहन पीड़ा में है। श्रीमद्भगवद्गीता शोक को किस दृष्टि से समझाती है?",
    tag: "आत्म तत्त्व"
  },
  {
    title: "क्रोध और रोष पर नियंत्रण",
    prompt: "छोटी-छोटी बातों पर तुरंत क्रोध आ जाता है और शांति भंग हो जाती है। मैं समत्व भाव कैसे बनाए रखूँ?",
    tag: "समत्व भाव"
  },
  {
    title: "अकेलापन और उपेक्षा",
    prompt: "भीड़ में रहकर भी मैं स्वयं को नितांत अकेला और उपेक्षित पाता हूँ। अंतर्मन से जुड़ने का क्या मार्ग है?",
    tag: "भक्ति योग"
  },
  {
    title: "मानसिक थकावट और तनाव",
    prompt: "निरंतर दायित्वों से मैं अत्यंत थक चुका हूँ। जीवन में पुनः नवजीवन और संतुलन कहाँ से लाऊँ?",
    tag: "संतुलित जीवन"
  },
  {
    title: "ईर्ष्या और तुलना से मुक्ति",
    prompt: "दूसरों की प्रगति देखकर जब मन में ईर्ष्या जागती है, तब मैं इस दुर्भाव से कैसे मुक्त होऊँ?",
    tag: "ज्ञान योग"
  },
  {
    title: "विश्वासघात और क्षमा",
    prompt: "किसी ने मेरा गहरा विश्वास तोड़ा है। दुर्बल बने बिना मैं उसे हृदय से क्षमा कैसे करूँ?",
    tag: "क्षमा भाव"
  },
  {
    title: "स्वधर्म और सच्चा उद्देश्य",
    prompt: "सामाजिक अपेक्षाओं और अपने वास्तविक स्वभाव के बीच उलझा हुआ हूँ। मैं अपना स्वधर्म कैसे पहचानूँ?",
    tag: "स्वधर्म"
  },
  {
    title: "आत्म-संदेह से मुक्ति",
    prompt: "मुझे निरंतर अपनी योग्यता पर संदेह रहता है। मैं अपने भीतर अटूट आत्म-विश्वास कैसे जगाऊँ?",
    tag: "आत्म-विश्वास"
  },
  {
    title: "संकट में अडिग रहना",
    prompt: "परिस्थितियाँ अत्यंत विकट हो गई हैं। जब सब कुछ डगमगा रहा हो, तब साहस कहाँ से जुटाऊँ?",
    tag: "अभय"
  },
  {
    title: "अतीत की गलतियाँ और ग्लानि",
    prompt: "पुरानी भूलों का बोझ मेरे मन को कचोटता रहता है। क्या मनुष्य सचमुच पश्चाताप से शुद्ध हो सकता है?",
    tag: "आत्म-शुद्धि"
  },
  {
    title: "अनासक्त सच्चा प्रेम",
    prompt: "बिना अधिकार जताए और खोने के डर से मुक्त होकर मैं दूसरों से सच्चा प्रेम कैसे करूँ?",
    tag: "वैराग्य और प्रेम"
  },
  {
    title: "धर्मसंकट और नैतिक निर्णय",
    prompt: "जब दो अच्छे मूल्यों में टकराव हो, तब बुद्धि योग द्वारा सही निर्णय कैसे लिया जाए?",
    tag: "बुद्धि योग"
  },
  {
    title: "परिवर्तन का सहज स्वीकार",
    prompt: "जीवन के बदलाव मुझे भयभीत करते हैं। समय के प्रवाह और अनित्यता को सहजता से कैसे स्वीकारूँ?",
    tag: "अनित्यता"
  }
];

function getRandomInquiries(count: number = 4, lang: string = "en"): PromptCard[] {
  const library = lang === "hi" ? INQUIRY_LIBRARY_HI : INQUIRY_LIBRARY_EN;
  const shuffled = [...library].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

export default function ChatPage() {
  const { user, loading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { t, language, isHindi } = useLanguage();
  const router = useRouter();

  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  
  const [inputText, setInputText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [streamingRefs, setStreamingRefs] = useState<ShlokaReference[]>([]);
  const [chatError, setChatError] = useState<string | null>(null);

  // Suggested Inquiries - generalized across life themes and randomized for every session
  const [suggestedCards, setSuggestedCards] = useState<PromptCard[]>(() => getRandomInquiries(4, language));

  useEffect(() => {
    // Refresh inquiries when language changes or on mount
    setSuggestedCards(getRandomInquiries(4, language));
  }, [language]);

  const shuffleInquiries = () => {
    setSuggestedCards(getRandomInquiries(4, language));
  };

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [isUserScrolledUp, setIsUserScrolledUp] = useState(false);

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
        headers: getAuthHeaders(),
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
      const res = await resilientFetch(`${API_BASE}/conversations`, {
        headers: getAuthHeaders(),
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
        const res = await resilientFetch(`${API_BASE}/conversations/${activeConvId}`, {
          headers: getAuthHeaders(),
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

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    setIsUserScrolledUp(distanceFromBottom > 140);
  };

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior
      });
    }
  };

  // High-performance auto-scroll: smooth for new messages, instant during streaming to eliminate jitter, respects user manual scroll
  useEffect(() => {
    if (!isUserScrolledUp) {
      if (isGenerating) {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
        }
      } else {
        scrollToBottom("smooth");
      }
    }
  }, [messages, streamingContent, isGenerating]);

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
    // Re-randomize inquiries for the fresh conversation
    setSuggestedCards(getRandomInquiries(4));
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const deleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await resilientFetch(`${API_BASE}/conversations/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
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
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
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

  const handleRetry = () => {
    if (isGenerating) return;
    const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
    if (lastUserMsg?.content) {
      setChatError(null);
      sendMessage(lastUserMsg.content, lastUserMsg.input_mode as any, true);
    } else if (inputText.trim()) {
      sendMessage();
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
      sendMessage(lastUserMsg.content, lastUserMsg.input_mode as any, true);
    }
  };

  // Send message via SSE streaming
  const sendMessage = async (textToSend?: string, mode?: "text" | "voice", isRetryOrRegenerate?: boolean) => {
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
    setIsUserScrolledUp(false);
    setTimeout(() => scrollToBottom("smooth"), 50);

    // Append optimistic user message only if this isn't a retry/regeneration
    if (!isRetryOrRegenerate) {
      const userMsg: MessageItem = { role: "user", content: message, input_mode: currentMode };
      setMessages((prev) => [...prev, userMsg]);
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;
    const timeoutId = setTimeout(() => {
      if (abortControllerRef.current === controller) {
        controller.abort("Request timed out. Please retry.");
      }
    }, 180000);

    try {
      const response = await resilientFetch(`${API_BASE}/chat/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        credentials: "include",
        signal: controller.signal,
        body: JSON.stringify({
          message: message,
          conversation_id: activeConvId || undefined,
          language: language
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
              if (parsed.done || parsed.assistant_message_id) {
                const assistantMsg: MessageItem = {
                  role: "assistant",
                  content: accumulatedText || parsed.message || parsed.response || "Namaste. I am here alongside you. Share what is on your mind and let us reflect on Krishna's wisdom together.",
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
    <div className="fixed inset-0 flex h-screen h-[100dvh] max-h-[100dvh] w-full overflow-hidden bg-krishna-theme text-stone-900 dark:text-stone-100 selection:bg-amber-500/30 selection:text-amber-900 dark:selection:text-amber-200">
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
      <div className="flex-1 min-w-0 flex flex-col h-full max-h-[100dvh] overflow-hidden relative">
        {/* Top Header Bar */}
        <header className="h-14 flex items-center justify-between px-4 border-b border-amber-500/25 bg-white/80 dark:bg-[#0c091a]/85 backdrop-blur-xl z-10 flex-shrink-0 sticky top-0">
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
            <div className="flex items-center space-x-2 px-2.5 py-1 rounded-full border border-amber-500/30 bg-amber-500/15 text-sm font-serif font-bold text-amber-900 dark:text-amber-200 shadow-xs">
              <div className="w-4 h-4 rounded-full overflow-hidden border border-amber-400/60 shrink-0 bg-black">
                <img src="/logo.png" alt="GitaMitra" className="w-full h-full object-cover" />
              </div>
              <span>{isHindi ? "गीतामित्र" : "GitaMitra"}</span>
            </div>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center space-x-2">
            <LanguageSwitcherButton />
            <InstallAppButton className="hidden sm:inline-flex px-2.5 py-1 text-xs rounded-full border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20" />
            
            <Link
              href="/gita"
              className="flex items-center space-x-1.5 px-3.5 py-1 text-xs font-serif font-semibold text-amber-900 dark:text-amber-200 border border-amber-500/30 bg-amber-500/15 rounded-full hover:bg-amber-500/25 transition-colors"
              title={isHindi ? "श्रीमद्भगवद्गीता के श्लोक पढ़ें" : "Browse Bhagavad Gita Verses"}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isHindi ? "गीता ७०० श्लोक" : "Gita 700 Verses"}</span>
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
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 min-h-0 overflow-y-auto overscroll-contain custom-scrollbar px-3 sm:px-4 py-3 sm:py-4 relative"
        >
          <div className="max-w-3xl mx-auto w-full">
            {messages.length === 0 && !streamingContent ? (
              /* Divine Welcome Screen with Official Logo */
              <div className="py-3 sm:py-5 px-2 text-center space-y-3 sm:space-y-4 animate-in fade-in duration-300">
                {/* Official Sacred Emblem of GitaMitra */}
                <div className="relative inline-flex items-center justify-center group">
                  <div className="absolute inset-0 rounded-full bg-amber-500/30 blur-2xl group-hover:blur-3xl transition-all duration-300 pointer-events-none"></div>
                  <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-2 border-amber-400/90 shadow-2xl shadow-amber-500/35 group-hover:scale-105 transition-transform duration-500 bg-black">
                    <img
                      src="/logo.png"
                      alt="GitaMitra Official Sacred Emblem"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="font-serif text-[11px] sm:text-xs uppercase tracking-widest text-amber-800 dark:text-amber-400 font-semibold">
                    ✦ ॐ नमो भगवते वासुदेवाय ✦
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 dark:text-white font-serif">
                    {isHindi ? "राधे राधे, " : "Namaste, "}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 dark:from-amber-400 dark:via-yellow-300 dark:to-orange-400">{firstName}</span>
                  </h1>
                  <p className="text-xs sm:text-sm text-stone-700 dark:text-stone-300 max-w-md mx-auto font-sans leading-relaxed font-medium">
                    {isHindi
                      ? "अपने अंतर्मन के किसी द्वंद्व, भावना अथवा कर्तव्य पर भगवान श्री कृष्ण के दिव्य उपदेशों से मार्गदर्शन प्राप्त करें।"
                      : "What dilemma, emotion, or duty would you like to reflect upon with the divine counsel of Lord Krishna?"}
                  </p>
                </div>

                {/* Suggested Inquiries Temple Grid */}
                <div className="pt-1">
                  <div className="flex items-center justify-between px-1 mb-2">
                    <span className="font-serif text-[11px] text-amber-800/80 dark:text-amber-400 font-semibold tracking-wider uppercase">
                      {isHindi ? "✦ शाश्वत जीवन चिंतन सूत्र" : "✦ Timeless Life Inquiries"}
                    </span>
                    <button
                      type="button"
                      onClick={shuffleInquiries}
                      className="inline-flex items-center space-x-1 text-[11px] font-serif text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-100 hover:underline cursor-pointer transition-colors"
                      title="Explore other inquiries"
                    >
                      <RefreshCw className="w-3 h-3 text-amber-500" />
                      <span>{isHindi ? "बदलें" : "Shuffle"}</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-left">
                    {suggestedCards.map((card, i) => (
                      <button
                        key={`${card.title}-${i}`}
                        onClick={() => sendMessage(card.prompt)}
                        className="temple-card p-3.5 sm:p-4 hover:-translate-y-0.5 active:scale-[0.99] transition-all duration-200 text-left cursor-pointer flex flex-col justify-between group shadow-sm hover:shadow-md"
                      >
                        <div>
                          <div className="flex items-center justify-between font-serif text-[10px] sm:text-[11px] text-amber-800 dark:text-amber-400 font-semibold uppercase tracking-wider mb-1">
                            <span>{isHindi ? `✦ जिज्ञासा ०${i + 1}` : `✦ Inquiry 0${i + 1}`}</span>
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

            {/* Error Banner with Retry */}
            {chatError && (
              <div className="my-3 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-800 dark:text-rose-300 flex items-center justify-between font-serif">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{chatError}</span>
                </div>
                <button
                  type="button"
                  onClick={handleRetry}
                  disabled={isGenerating}
                  className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-rose-100 dark:bg-rose-900/60 hover:bg-rose-200 dark:hover:bg-rose-800/80 text-rose-800 dark:text-rose-200 text-xs font-bold transition-all cursor-pointer disabled:opacity-50 ml-3 shrink-0"
                >
                  <RefreshCw className={`w-3 h-3 ${isGenerating ? "animate-spin" : ""}`} />
                  <span>{isGenerating ? (isHindi ? "पुनः प्रयास..." : "Retrying...") : (isHindi ? "पुनः प्रयास करें" : "Retry")}</span>
                </button>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Floating Scroll to Bottom Button */}
          {isUserScrolledUp && (
            <button
              type="button"
              onClick={() => {
                setIsUserScrolledUp(false);
                scrollToBottom("smooth");
              }}
              className="sticky bottom-3 float-right mr-2 z-30 px-3 py-1.5 rounded-full bg-white/95 dark:bg-[#1a1435]/95 border border-amber-500/40 text-amber-900 dark:text-amber-200 shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center space-x-1.5 text-xs font-serif cursor-pointer backdrop-blur-md animate-in fade-in"
              title={isHindi ? "नवीनतम मार्गदर्शन पर जाएँ" : "Jump to latest divine counsel"}
            >
              <ArrowDown className="w-3.5 h-3.5 text-amber-500" />
              <span>{isHindi ? "नवीनतम" : "Latest"}</span>
              {isGenerating && (
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
              )}
            </button>
          )}
        </div>

        {/* Bottom Floating Composer */}
        <div className="flex-shrink-0 px-3 sm:px-4 py-2 sm:py-2.5 border-t border-amber-500/20 z-20">
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
                      <span>{isHindi ? "आपकी वाणी सुन रहे हैं..." : "Listening to your voice..."}</span>
                      <span className="text-[11px] text-amber-700 dark:text-amber-300 font-mono">
                        (00:{recordingDuration < 10 ? `0${recordingDuration}` : recordingDuration} / 01:00)
                      </span>
                    </span>
                    <span className="text-[10px] text-stone-600 dark:text-stone-300 font-sans">
                      {isHindi ? "निःसंकोच हिन्दी में बोलें" : "Speak freely in English"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={handleCancelRecording}
                    className="p-1.5 rounded-full hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200 transition-colors cursor-pointer"
                    title={isHindi ? "रद्द करें" : "Cancel recording"}
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleFinishRecording}
                    className="px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-600 to-amber-500 text-white font-serif text-xs font-semibold hover:opacity-90 active:scale-95 transition-all flex items-center space-x-1 cursor-pointer shadow-sm"
                  >
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>{isHindi ? "पूर्ण" : "Done"}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Transcription In-Progress Indicator */}
            {isTranscribing && (
              <div className="mb-2.5 p-2.5 rounded-2xl bg-amber-500/10 dark:bg-amber-950/30 border border-amber-500/30 flex items-center justify-center space-x-2 text-xs font-serif text-amber-800 dark:text-amber-300 animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin text-amber-600 dark:text-amber-400" />
                <span>{isHindi ? "आपकी वाणी को पाठ में परिवर्तित किया जा रहा है..." : "Transcribing your speech with Gita-grounded precision..."}</span>
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

            <div className="rounded-[24px] bg-white/70 dark:bg-[#15102a]/75 backdrop-blur-2xl border border-amber-500/35 p-2.5 sm:p-3 shadow-xl focus-within:border-amber-500 dark:focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-500/20 transition-all duration-200 flex flex-col">
              {/* Voice Transcribed Notice Badge */}
              {isVoiceInput && inputText.trim() && (
                <div className="px-2 py-0.5 mb-1 inline-flex items-center space-x-1 text-[10px] font-serif text-amber-700 dark:text-amber-300 bg-amber-500/10 rounded-full border border-amber-500/20 self-start">
                  <Mic className="w-3 h-3 text-amber-600" />
                  <span>{isHindi ? "वाणी से प्रतिलेखित — भेजने से पहले समीक्षा करें या संपादित करें" : "Voice Transcribed — Review or edit before sending"}</span>
                </div>
              )}

              <textarea
                ref={textareaRef}
                value={inputText}
                onChange={handleTextareaInput}
                onKeyDown={handleKeyDown}
                rows={1}
                placeholder={t.chat.inputPlaceholder}
                className="w-full max-h-36 resize-none bg-transparent px-2 py-1 text-sm sm:text-[15px] text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-stone-500 focus:outline-none font-sans"
              />

              <div className="flex items-center justify-between pt-1.5 px-1 min-w-0">
                <div className="flex items-center space-x-1.5 font-serif text-[10px] sm:text-[11px] text-amber-800 dark:text-amber-400 truncate pr-2">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span className="truncate">
                    {isHindi ? "श्रीमद्भगवद्गीता के ७०० श्लोकों पर आधारित" : "Grounded in 700 Verses of Bhagavad Gita"}
                  </span>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
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
                    title={isRecording ? (isHindi ? "रिकॉर्डिंग समाप्त करें" : "Finish recording") : (isHindi ? "श्री कृष्ण से बोलकर पूछें" : "Speak to GitaMitra")}
                  >
                    {isRecording ? <Square className="w-3 h-3 fill-current" /> : <Mic className="w-3.5 h-3.5" />}
                  </button>

                  {/* Send / Stop Generating Button */}
                  {isGenerating ? (
                    <button
                      type="button"
                      onClick={stopGenerating}
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-stone-900 dark:bg-amber-400 text-white dark:text-stone-900 flex items-center justify-center hover:opacity-80 active:scale-95 transition-all cursor-pointer shadow-xs"
                      title={isHindi ? "उत्तर रोकें" : "Stop generating"}
                    >
                      <Square className="w-3 h-3 fill-current" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => sendMessage()}
                      disabled={!inputText.trim()}
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tr from-amber-600 via-amber-500 to-amber-600 text-white disabled:opacity-20 flex items-center justify-center hover:opacity-90 active:scale-95 transition-all cursor-pointer shadow-md shadow-amber-500/30"
                      title={isHindi ? "जिज्ञासा भेजें" : "Send inquiry"}
                    >
                      <ArrowUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            <p className="hidden sm:block text-[10px] sm:text-[11px] text-stone-500 dark:text-stone-400 text-center mt-1.5 font-serif">
              {isHindi
                ? "गीतामित्र धर्म पर आधारित आध्यात्मिक चिंतन प्रस्तुत करता है। संदेश भेजने हेतु Enter दबाएँ, नई पंक्ति हेतु Shift+Enter।"
                : "GitaMitra offers spiritual reflection grounded in Dharma. Press Enter to send, Shift+Enter for newline."}
            </p>
          </div>
        </div>

        {/* Mobile Bottom Navigation - Naturally positioned in flex flow right below composer */}
        <MobileNav isChat={true} />
      </div>

      {/* Lightweight First-Time Onboarding Modal */}
      {showOnboarding && (
        <OnboardingModal
          isOpen={showOnboarding}
          onComplete={handleOnboardingComplete}
          userName={user.name || undefined}
        />
      )}
    </div>
  );
}
