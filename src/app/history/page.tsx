"use client";

import { useEffect, useState } from "react";
import { HistorySession } from "@/types";
import { SuggestionCard } from "../(components)/SuggestionCard";
import { toast } from "sonner";

export default function HistoryPage() {
  const [history, setHistory] = useState<HistorySession[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  async function loadHistory() {
    setLoading(true);
    try {
      const resp = await fetch("/api/history");
      const data = await resp.json();
      setHistory(data.history ?? []);
    } catch {
      toast.error("Failed to load history");
    } finally {
      setLoading(false);
    }
  }

  async function deleteSession(id: string) {
    try {
      await fetch(`/api/history?id=${id}`, { method: "DELETE" });
      setHistory((prev) => prev.filter((s) => s.id !== id));
      toast.success("Deleted from history");
    } catch {
      toast.error("Failed to delete");
    }
  }

  async function clearAllHistory() {
    if (!confirm("Are you sure you want to clear all history?")) return;
    try {
      await fetch("/api/history", { method: "DELETE" });
      setHistory([]);
      toast.success("History cleared");
    } catch {
      toast.error("Failed to clear history");
    }
  }

  useEffect(() => {
    loadHistory();
  }, []);

  const getMoodEmoji = (mood: string) => {
    const map: Record<string, string> = {
      tired: "😴",
      curious: "🧐",
      motivated: "⚡",
      relaxed: "🧘",
      bored: "🤥",
      chill: "😌",
    };
    return map[mood] || "💭";
  };

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">History</h1>
        {history.length > 0 && (
          <button
            onClick={clearAllHistory}
            className="text-sm text-foreground/60 hover:text-foreground hover:underline"
          >
            Clear all
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="rounded-lg border border-black/10 dark:border-white/10 p-4 animate-pulse"
            >
              <div className="h-4 bg-black/10 dark:bg-white/10 rounded w-3/4 mb-2" />
              <div className="h-3 bg-black/10 dark:bg-white/10 rounded w-1/2 mb-4" />
            </div>
          ))}
        </div>
      ) : history.length === 0 ? (
        <div className="text-foreground/60 text-center mt-8">
          No history yet. Start chatting to see your recommendations here!
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((session) => {
            const isExpanded = expandedId === session.id;
            const date = new Date(session.timestamp);
            const timeAgo = getTimeAgo(date);

            return (
              <div
                key={session.id}
                className="rounded-lg border border-black/10 dark:border-white/10 p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-4">
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : session.id)}
                    className="flex-1 text-left space-y-1"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{getMoodEmoji(session.mood)}</span>
                      <span className="font-medium">{session.message}</span>
                    </div>
                    <div className="text-xs text-foreground/60 flex items-center gap-2">
                      <span>{timeAgo}</span>
                      <span>•</span>
                      <span>{session.suggestions.length} suggestions</span>
                      {!isExpanded && (
                        <>
                          <span>•</span>
                          <span className="text-foreground/40">Click to expand</span>
                        </>
                      )}
                    </div>
                  </button>
                  <button
                    onClick={() => deleteSession(session.id)}
                    className="text-xs text-foreground/60 hover:text-foreground hover:underline"
                  >
                    Delete
                  </button>
                </div>

                {isExpanded && (
                  <div className="pt-3 border-t border-black/10 dark:border-white/10">
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {session.suggestions.map((s) => (
                        <SuggestionCard key={s.id} s={s} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString();
}
