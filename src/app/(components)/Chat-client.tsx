"use client";

import { useEffect, useRef, useState } from "react";
import { Mood, Suggestion, RecommendResponse, Profile } from "@/types";
import { SuggestionCard } from "./SuggestionCard";

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
      }

      if (data?.usedFallback) {
        console.info("Using fallback suggestions from saved content");
      }

      setSessions((prev) =>
        prev.map((s) =>
          s.id === id ? { ...s, suggestions: data.suggestions ?? [], loading: false } : s
        )
      );

      queueMicrotask(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }));
    } catch (error) {
      console.error("Error submitting message:", error);
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
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="rounded-lg border border-black/10 dark:border-white/10 p-3 animate-pulse"
                    >
                      <div className="aspect-video bg-black/10 dark:bg-white/10 rounded mb-3" />
                      <div className="h-4 bg-black/10 dark:bg-white/10 rounded w-3/4 mb-2" />
                      <div className="h-3 bg-black/10 dark:bg-white/10 rounded w-1/2 mb-4" />
                      <div className="flex gap-2">
                        <div className="h-5 w-12 bg-black/10 dark:bg-white/10 rounded-full" />
                        <div className="h-5 w-16 bg-black/10 dark:bg-white/10 rounded-full" />
                      </div>
                    </div>
                  ))}
                </div>
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
                          await fetch("/api/likes", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ suggestion: sig }),
                          });
                        }}
                        onSave={async (sig, list) => {
                          await fetch("/api/saves", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ suggestion: sig, list }),
                          });
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
        <div className="max-w-7xl mx-auto flex items-center gap-2">
          <MoodIcons value={mood} onChange={setMood} />
          <input
            className="flex-1 border rounded-lg px-4 py-3 bg-background text-base"
            placeholder="Ask for a 40-minute video for the shower…"
            value={message}
            id="message"
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
          />
          <button
            className="px-5 py-3 rounded-md bg-foreground text-background text-base"
            onClick={submit}
            disabled={loading}
          >
            {loading ? "Sending…" : "Send"}
          </button>
        </div>
      </div>
    </>
  );
}

function MoodIcons({ value, onChange }: { value: Mood; onChange: (m: Mood) => void }) {
  const items: { mood: Mood; label: string; emoji: string }[] = [
    { mood: "tired", label: "Tired", emoji: "😴" },
    { mood: "curious", label: "Curious", emoji: "🧐" },
    { mood: "motivated", label: "Motivated", emoji: "⚡" },
    { mood: "relaxed", label: "Relaxed", emoji: "🧘" },
    { mood: "bored", label: "Bored", emoji: "🤥" },
    { mood: "chill", label: "Chill", emoji: "😌" },
  ];

  return (
    <div className="flex items-center gap-1">
      {items.map((it) => (
        <button
          key={it.mood}
          className={`px-2 py-2 rounded-md border ${
            value === it.mood ? "bg-black/10 dark:bg-white/10" : "bg-transparent"
          }`}
          aria-label={it.label}
          onClick={() => onChange(it.mood)}
        >
          <span className="text-xl" title={it.label}>
            {it.emoji}
          </span>
        </button>
      ))}
    </div>
  );
}
