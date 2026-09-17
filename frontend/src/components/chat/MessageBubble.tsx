"use client";

import React, { useState } from "react";
import ShlokaCard, { ShlokaReference } from "./ShlokaCard";
import VoiceAudioPlayer from "./VoiceAudioPlayer";
import { API_BASE, getAuthHeaders } from "../../lib/api";
import {
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  ChevronDown,
  Sparkles,
  Mic,
  RotateCcw
} from "lucide-react";

export interface MessageItem {
  id?: string;
  role: "user" | "assistant";
  content: string;
  references?: ShlokaReference[];
  memories?: Array<{ type: string; summary?: string; content?: string }>;
  created_at?: string;
  input_mode?: string;
}

const FEEDBACK_CATEGORIES = [
  { id: "verse_not_relevant", label: "Verse not relevant" },
  { id: "explanation_unclear", label: "Explanation unclear" },
  { id: "not_practical", label: "Not practical enough" },
  { id: "too_long", label: "Too long" },
  { id: "too_short", label: "Too short" },
  { id: "inaccurate_reference", label: "Inaccurate reference" },
  { id: "inappropriate_response", label: "Inappropriate response" }
];

export default function MessageBubble({
  message,
  onRegenerate
}: {
  message: MessageItem;
  onRegenerate?: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState<boolean | null>(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [feedbackComment, setFeedbackComment] = useState("");
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [showReferences, setShowReferences] = useState(true);

  const isUser = message.role === "user";

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePositiveFeedback = async () => {
    if (feedbackSent !== null) return;
    setFeedbackSent(true);
    try {
      await fetch(`${API_BASE}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        credentials: "include",
        body: JSON.stringify({
          message_id: message.id,
          is_helpful: true
        })
      });
    } catch (e) {
      console.error("Failed to submit feedback", e);
    }
  };

  const submitDetailedFeedback = async (isHelpful: boolean) => {
    setSubmittingFeedback(true);
    try {
      await fetch(`${API_BASE}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        credentials: "include",
        body: JSON.stringify({
          message_id: message.id,
          is_helpful: isHelpful,
          category: selectedCategory || undefined,
          comment: feedbackComment.trim() || undefined
        })
      });
      setFeedbackSent(isHelpful);
      setShowFeedbackModal(false);
    } catch (e) {
      console.error("Failed to submit feedback", e);
    } finally {
      setSubmittingFeedback(false);
    }
  };

  // Safe formatting helper for headings, bold, verses, bullet points
  const renderFormattedContent = (content: string) => {
    let radheRendered = false;
    const lines = content.split("\n");
    // Clean robotic AI bold heading prefixes while preserving and elegantly styling bold terms used for focus
    const renderInline = (text: string) => {
      if (!text) return null;

      // Strip robotic AI boilerplate bold headers at start of line:
      // e.g. "**1. Understand Your Duty:**" -> "1. Understand Your Duty:"
      // e.g. "**Karma Yoga:**" -> "Karma Yoga:"
      let cleaned = text.replace(/^\*\*([^*]+?):\*\*\s*/, "$1: ");
      if (cleaned.startsWith("**") && cleaned.endsWith("**") && (cleaned.match(/\*\*/g) || []).length === 2) {
        cleaned = cleaned.slice(2, -2);
      }

      // Split and render inline bold markers for genuine conceptual focus
      const parts = cleaned.split(/(\*\*[^*]+?\*\*)/g);
      return parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
          const boldWord = part.slice(2, -2);
          return (
            <strong key={i} className="font-bold text-stone-950 dark:text-amber-100">
              {boldWord}
            </strong>
          );
        }
        // Never output unparsed raw asterisks
        return <React.Fragment key={i}>{part.replace(/\*\*/g, "")}</React.Fragment>;
      });
    };

    return lines.map((line, idx) => {
      const trimmed = line.trim();

      // Sacred Greeting Heading: "!! Radhe Radhe !!" in bold and slightly large font in the middle (strictly once)
      if (trimmed.includes("!! Radhe Radhe !!")) {
        const remaining = trimmed
          .replace(/^[#\s*]*!*\s*!\s*Radhe\s+Radhe\s*!\s*!*[#\s*]*/gi, "")
          .trim();

        if (radheRendered) {
          if (!remaining) return null;
          return (
            <p key={idx} className="text-sm text-stone-800 dark:text-stone-200 leading-relaxed my-1 font-sans">
              {renderInline(remaining)}
            </p>
          );
        }

        radheRendered = true;
        return (
          <React.Fragment key={idx}>
            <div className="my-3 text-center">
              <h2 className="text-base sm:text-lg font-bold font-serif text-amber-900 dark:text-amber-300 tracking-wide inline-block px-5 py-1 rounded-full bg-amber-500/15 border border-amber-500/35 shadow-xs">
                !! Radhe Radhe !!
              </h2>
            </div>
            {remaining ? (
              <p className="text-sm text-stone-800 dark:text-stone-200 leading-relaxed my-1 font-sans">
                {renderInline(remaining)}
              </p>
            ) : null}
          </React.Fragment>
        );
      }

      // Special Saar Card: matches "### Saar", "**Saar:**", or "Saar:"
      if (
        trimmed.startsWith("### Saar") ||
        trimmed.startsWith("### Practical Saar") ||
        trimmed.startsWith("**Saar:**") ||
        trimmed.startsWith("Saar:")
      ) {
        const saarText = trimmed
          .replace(/^###\s*(Practical\s*)?Saar:?/i, "")
          .replace(/^\*\*Saar:\*\*/i, "")
          .replace(/^Saar:/i, "")
          .trim();

        return (
          <div
            key={idx}
            className="my-4 p-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 dark:bg-amber-950/25 shadow-xs"
          >
            <div className="flex items-center space-x-2 font-serif text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 mb-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>प्रैक्टिकल सार // Core Spiritual Guidance</span>
            </div>
            <p className="text-sm font-medium text-stone-900 dark:text-amber-100 leading-relaxed font-sans">
              {renderInline(saarText)}
            </p>
          </div>
        );
      }

      // H3 or H2 Headers
      if (trimmed.startsWith("### ") || trimmed.startsWith("## ")) {
        const headerText = trimmed.replace(/^#{2,3}\s+/, "");
        return (
          <h3
            key={idx}
            className="font-serif text-sm font-bold text-amber-900 dark:text-amber-300 mt-4 mb-1.5 flex items-center space-x-1.5"
          >
            <span className="text-amber-500 text-xs">✦</span>
            <span>{renderInline(headerText)}</span>
          </h3>
        );
      }

      // Blockquotes (verses or emphasized guidance)
      if (trimmed.startsWith(">")) {
        const quoteText = trimmed.replace(/^>\s*/, "");
        return (
          <blockquote
            key={idx}
            className="my-3 pl-4 border-l-2 border-amber-500 italic text-sm text-stone-700 dark:text-amber-200/90 py-1 font-serif bg-amber-500/5 rounded-r-xl"
          >
            {renderInline(quoteText)}
          </blockquote>
        );
      }

      // Bullet points
      if (trimmed.startsWith("- ") || trimmed.startsWith("* ") || /^\d+\.\s/.test(trimmed)) {
        const bulletText = trimmed.replace(/^[-*]\s+|\d+\.\s+/, "");
        return (
          <div key={idx} className="flex items-start space-x-2 my-1 text-sm text-stone-800 dark:text-stone-200">
            <span className="text-amber-500 mt-0.5">•</span>
            <span className="leading-relaxed font-sans">{renderInline(bulletText)}</span>
          </div>
        );
      }

      // Empty lines
      if (!trimmed) {
        return <div key={idx} className="h-2" />;
      }

      // Standard paragraph
      return (
        <p key={idx} className="text-sm text-stone-800 dark:text-stone-200 leading-relaxed my-1 font-sans">
          {renderInline(line)}
        </p>
      );
    });
  };

  if (isUser) {
    return (
      <div className="flex justify-end my-3">
        <div className="max-w-[85%] sm:max-w-[75%] rounded-2xl px-5 py-3.5 bg-gradient-to-r from-amber-700 via-amber-600 to-amber-700 text-white font-sans text-sm shadow-md leading-relaxed border border-amber-400/30">
          <div className="flex items-center justify-between font-serif text-[10px] uppercase tracking-widest text-amber-200 mb-1">
            <span>Seeker Inquiry</span>
            {message.input_mode === "voice" && (
              <span className="flex items-center space-x-1 bg-white/20 px-2 py-0.5 rounded-full text-[9px] font-sans font-medium">
                <Mic className="w-2.5 h-2.5" />
                <span>Voice</span>
              </span>
            )}
          </div>
          <div className="whitespace-pre-wrap">{message.content}</div>
        </div>
      </div>
    );
  }

  // Assistant (Krishna) message in Temple Glass styling
  return (
    <div className="my-4 flex flex-col items-start animate-in fade-in duration-300">
      <div className="w-full max-w-2xl temple-card p-5 sm:p-6 shadow-lg relative">
        {/* Header with Krishna title and timestamp */}
        <div className="flex items-center justify-between pb-3 border-b border-amber-500/20 mb-3.5">
          <div className="flex items-center space-x-2.5">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-400 text-white flex items-center justify-center text-xs font-bold font-serif shadow-xs">
              ॐ
            </div>
            <div className="flex items-baseline space-x-1.5 font-serif">
              <span className="font-bold tracking-wide text-stone-900 dark:text-amber-200 text-sm">
                Lord Krishna
              </span>
              <span className="text-[10px] text-amber-700 dark:text-amber-400">
                (गीतामित्र)
              </span>
            </div>
          </div>

          <span className="text-[10px] font-serif text-stone-400 dark:text-stone-500">
            {message.created_at ? new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Divine Counsel"}
          </span>
        </div>

        {/* Memory tags */}
        {message.memories && message.memories.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3 font-serif text-[10px]">
            {message.memories.map((m, idx) => (
              <span
                key={idx}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full border border-amber-500/25 bg-amber-500/10 text-amber-900 dark:text-amber-300"
              >
                <span className="font-bold mr-1">
                  {m.type}:
                </span>
                <span className="truncate max-w-[180px]">
                  {m.summary || m.content}
                </span>
              </span>
            ))}
          </div>
        )}

        {/* Message Content */}
        <div className="space-y-1">
          {renderFormattedContent(message.content)}
        </div>

        {/* Assistant Spiritual Voice Audio Player */}
        <VoiceAudioPlayer text={message.content} messageId={message.id} />

        {/* Verified References (Shloka Cards) */}
        {message.references && message.references.length > 0 && (
          <div className="mt-4 pt-3 border-t border-amber-500/20">
            <button
              onClick={() => setShowReferences(!showReferences)}
              className="flex items-center space-x-2 font-serif text-xs font-bold text-amber-800 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-300 transition-colors cursor-pointer py-1"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Verified Scriptural References ({message.references.length})</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showReferences ? "rotate-180" : ""}`} />
            </button>
            {showReferences && (
              <div className="space-y-2 mt-2">
                {message.references.map((ref, i) => (
                  <ShlokaCard key={i} refData={ref} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Action Toolbar */}
        <div className="mt-4 pt-3 border-t border-amber-500/20 flex items-center space-x-3 text-xs text-stone-400 dark:text-stone-500 font-serif">
          <button
            onClick={handleCopy}
            className="hover:text-amber-600 dark:hover:text-amber-300 flex items-center space-x-1 transition-colors cursor-pointer"
            title="Copy response"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="text-[11px]">{copied ? "Copied" : "Copy"}</span>
          </button>

          {onRegenerate && (
            <button
              onClick={onRegenerate}
              className="hover:text-amber-600 dark:hover:text-amber-300 flex items-center space-x-1 transition-colors cursor-pointer"
              title="Regenerate counsel"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="text-[11px]">Regenerate</span>
            </button>
          )}

          <button
            onClick={handlePositiveFeedback}
            disabled={feedbackSent !== null}
            className={`flex items-center space-x-1 transition-colors cursor-pointer ${
              feedbackSent === true
                ? "text-emerald-600 font-bold"
                : "hover:text-amber-600 dark:hover:text-amber-300"
            }`}
            title="Good response"
          >
            <ThumbsUp className="w-3.5 h-3.5" />
            {feedbackSent === true && <span className="text-[11px]">Helpful</span>}
          </button>

          <button
            onClick={() => setShowFeedbackModal(true)}
            disabled={feedbackSent !== null}
            className={`flex items-center space-x-1 transition-colors cursor-pointer ${
              feedbackSent === false
                ? "text-rose-600 font-bold"
                : "hover:text-amber-600 dark:hover:text-amber-300"
            }`}
            title="Report response"
          >
            <ThumbsDown className="w-3.5 h-3.5" />
            {feedbackSent === false && <span className="text-[11px]">Reported</span>}
          </button>
        </div>

        {/* Feedback Modal */}
        {showFeedbackModal && (
          <div className="mt-3 p-4 rounded-2xl border border-amber-500/30 bg-amber-50/90 dark:bg-[#1c1535] text-xs max-w-md animate-in fade-in font-serif">
            <div className="font-bold text-amber-900 dark:text-amber-200 mb-2">
              Share Reflection Feedback
            </div>
            <div className="flex flex-wrap gap-1.5 mb-2.5 font-sans">
              {FEEDBACK_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-2.5 py-1 rounded-full text-[11px] border transition-colors cursor-pointer ${
                    selectedCategory === cat.id
                      ? "bg-amber-600 text-white border-amber-600 font-bold"
                      : "bg-white dark:bg-[#120e26] text-stone-700 dark:text-stone-300 border-amber-500/25 hover:border-amber-500"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
            <textarea
              placeholder="Additional thoughts (optional)..."
              value={feedbackComment}
              onChange={(e) => setFeedbackComment(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-amber-500/30 bg-white dark:bg-[#120e26] text-stone-900 dark:text-white mb-2.5 resize-none outline-none focus:border-amber-500 font-sans"
              rows={2}
            />
            <div className="flex justify-end space-x-2 text-xs">
              <button
                onClick={() => setShowFeedbackModal(false)}
                className="px-3 py-1 text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => submitDetailedFeedback(false)}
                disabled={submittingFeedback}
                className="px-4 py-1.5 rounded-full bg-amber-600 text-white font-semibold hover:bg-amber-500 transition-colors cursor-pointer"
              >
                {submittingFeedback ? "Submitting..." : "Submit"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
