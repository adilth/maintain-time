"use client";

import { useRef, useState } from "react";
import { Mood, Suggestion, RecommendResponse, Profile } from "@/types";
import { SuggestionCard } from "./SuggestionCard";
import { SuggestionsGridSkeleton } from "./LoadingSkeleton";
import { toast } from "sonner";
import { useLikesSaves } from "@/contexts/LikesSavesContext";

type ChatSession = {
  id: string;
  message: string;
  suggestions: Suggestion[];
  loading?: boolean;
};

interface ChatClientProps {
  initialSessions: ChatSession[];
  initialProfile: Profile | null;
}

export function ChatClient({ initialSessions, initialProfile }: ChatClientProps) {
  const [mood, setMood] = useState<Mood>("curious");
  const [message, setMessage] = useState("");
  const [sessions, setSessions] = useState<ChatSession[]>(initialSessions);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  
  // Get context refresh functions
  const { refreshLikes, refreshSaves } = useLikesSaves();

  async function submit() {
    if (!message.trim()) return;

    setLoading(true);
    const userMessage = message;
    const id = crypto.randomUUID();

    // Optimistically append user's message and clear input
    setSessions((prev) => [
      ...prev,
      { id, message: userMessage, suggestions: [], loading: true },
    ]);
    setMessage("");

    queueMicrotask(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }));

    try {
      const resp = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          mood,
          count: 10,
          profile: initialProfile,
        }),
      });

      const data: RecommendResponse & { error?: string } = await resp.json();

      if (process.env.NODE_ENV !== "production") {
        console.log("Recommend response data:", JSON.stringify(data, null, 2));
      }

      if (data?.error) {
        console.warn("AI fallback:", data.error);
        toast.warning("AI temporarily unavailable", {
          description: "Showing content from your saves",
        });
      }

      if (data?.usedFallback) {
        console.info("Using fallback suggestions from saved content");
      }

      const suggestions = data.suggestions ?? [];

      setSessions((prev) =>
        prev.map((s) =>
          s.id === id ? { ...s, suggestions, loading: false } : s
        )
      );

      // Save to history
      if (suggestions.length > 0) {
        try {
          await fetch("/api/history", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              session: {
                id,
                message: userMessage,
                mood,
                suggestions,
                timestamp: new Date().toISOString(),
              },
            }),
          });
        } catch (err) {
          console.error("Failed to save history:", err);
        }
      }

      queueMicrotask(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }));
    } catch (error) {
      console.error("Error submitting message:", error);
      toast.error("Failed to get recommendations", {
        description: "Please try again",
      });
      setSessions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, loading: false } : s))
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="flex-1 overflow-auto p-4 md:p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {sessions.length === 0 && !loading ? (
            <div className="text-sm text-foreground/60 text-center mt-4">
              Ask for suggestions and they will appear here.
            </div>
          ) : null}

          {sessions.map((sess) => (
            <div key={sess.id} className="space-y-3">
              <div className="rounded-lg border border-black/10 dark:border-white/10 p-4 bg-background/50">
                <div className="text-xs text-foreground/60 mb-1">You</div>
                <div className="text-base">{sess.message}</div>
              </div>

              {sess.loading ? (
                <SuggestionsGridSkeleton count={6} />
              ) : (
                <div className="space-y-2">
                  {sess.suggestions.some(
                    (s) =>
                      s.tags?.includes("saved") ||
                      s.tags?.includes("fallback") ||
                      s.tags?.includes("error")
                  ) && (
                    <div className="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-2 rounded-md">
                      ⚠️ AI temporarily unavailable - showing content from your saves
                    </div>
                  )}

                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sess.suggestions.map((s) => (
                      <SuggestionCard
                        key={s.id}
                        s={s}
                        onLike={async (sig) => {
                          try {
                            await fetch("/api/likes", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ suggestion: sig }),
                            });
                            toast.success("Liked!", {
                              description: sig.title,
                            });
                            // Refresh context to update all cards
                            await refreshLikes();
                          } catch {
                            toast.error("Failed to like");
                          }
                        }}
                        onSave={async (sig, list) => {
                          try {
                            await fetch("/api/saves", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ suggestion: sig, list }),
                            });
                            toast.success(`Saved to ${list}!`, {
                              description: sig.title,
                            });
                            // Refresh context to update all cards
                            await refreshSaves();
                          } catch {
                            toast.error("Failed to save");
                          }
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </div>

      <div className="border-t border-black/10 dark:border-white/10 p-3 md:p-4">
        <div className="max-w-7xl mx-auto flex items-end gap-2">
          <select
            value={mood}
            onChange={(e) => setMood(e.target.value as Mood)}
            className="border rounded-lg px-3 py-3 bg-background text-base min-w-[140px]"
            title="Select your mood"
          >
            <option value="tired">😴 Tired</option>
            <option value="curious">🧐 Curious</option>
            <option value="motivated">⚡ Motivated</option>
            <option value="relaxed">🧘 Relaxed</option>
            <option value="bored">🤥 Bored</option>
            <option value="chill">😌 Chill</option>
          </select>
          <textarea
            className="chat_message flex-1 rounded-xl px-4 py-3 bg-[#212121] text-base resize-none overflow-y-auto min-h-[52px] max-h-[120px] "
            placeholder="Ask for a 40-minute video for the shower…"
            value={message}
            id="message"
            rows={1}
            onChange={(e) => {
              setMessage(e.target.value);
              // Auto-resize textarea
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
                // Reset height after submit
                e.currentTarget.style.height = 'auto';
              }
            }}
          />
          <button
            className="px-5 py-3 rounded-md bg-foreground text-background text-base whitespace-nowrap"
            onClick={() => {
              submit();
              // Reset textarea height after submit
              const textarea = document.getElementById('message') as HTMLTextAreaElement;
              if (textarea) {
                textarea.style.height = 'auto';
              }
            }}
            disabled={loading}
          >
            {loading ? "Sending…" : "Send"}
          </button>
        </div>
      </div>
    </>
  );
}
