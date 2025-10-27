"use client";

import { useState, useEffect } from "react";
import { Suggestion } from "@/types";
import { SuggestionCard } from "../(components)/SuggestionCard";
import { SuggestionsGridSkeleton } from "../(components)/LoadingSkeleton";
import { toast } from "sonner";
import { useLikesSaves } from "@/contexts/LikesSavesContext";

type Category = "all" | "gaming" | "music" | "sports" | "news" | "entertainment" | "education" | "science" | "technology";

const CATEGORIES: { value: Category; label: string; emoji: string }[] = [
  { value: "all", label: "All", emoji: "🌐" },
  { value: "gaming", label: "Gaming", emoji: "🎮" },
  { value: "music", label: "Music", emoji: "🎵" },
  { value: "sports", label: "Sports", emoji: "⚽" },
  { value: "news", label: "News", emoji: "📰" },
  { value: "entertainment", label: "Entertainment", emoji: "🎬" },
  { value: "education", label: "Education", emoji: "📚" },
  { value: "science", label: "Science", emoji: "🔬" },
  { value: "technology", label: "Technology", emoji: "💻" },
];

export default function TrendingPage() {
  const [category, setCategory] = useState<Category>("all");
  const [count, setCount] = useState(12);
  const [trending, setTrending] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const { refreshLikes, refreshSaves } = useLikesSaves();

  // Fetch trending content when category or count changes
  useEffect(() => {
    async function loadTrending() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (category !== "all") {
          params.append("category", category);
        }
        params.append("count", count.toString());

        const resp = await fetch(`/api/trending?${params.toString()}`);
        const data = await resp.json();
        setTrending(data.suggestions || []);
      } catch (err) {
        console.error("Failed to load trending:", err);
        toast.error("Failed to load trending content");
      } finally {
        setLoading(false);
      }
    }
    loadTrending();
  }, [category, count]);

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            🔥 Trending Now
          </h1>
          <p className="text-foreground/60">
            Discover what&apos;s popular on YouTube right now
          </p>
        </div>

        {/* Filters */}
        <div className="space-y-4 border border-black/10 dark:border-white/10 rounded-lg p-4 bg-background/50">
          {/* Category Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Category</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setCategory(cat.value)}
                  className={`px-3 py-2 rounded-md border text-sm transition-colors ${
                    category === cat.value
                      ? "bg-foreground text-background border-foreground"
                      : "bg-background hover:bg-black/5 dark:hover:bg-white/5"
                  }`}
                >
                  <span className="mr-1">{cat.emoji}</span>
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Count Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Results per page</label>
            <div className="flex gap-2">
              {[6, 12, 24, 48].map((num) => (
                <button
                  key={num}
                  onClick={() => setCount(num)}
                  className={`px-3 py-2 rounded-md border text-sm transition-colors ${
                    count === num
                      ? "bg-foreground text-background border-foreground"
                      : "bg-background hover:bg-black/5 dark:hover:bg-white/5"
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results Count */}
        {!loading && (
          <div className="text-sm text-foreground/60">
            Showing {trending.length} trending video{trending.length !== 1 ? "s" : ""}
          </div>
        )}

        {/* Content Grid */}
        {loading ? (
          <SuggestionsGridSkeleton count={count} />
        ) : trending.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {trending.map((s) => (
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
                    await refreshSaves();
                  } catch {
                    toast.error("Failed to save");
                  }
                }}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-foreground/60">
            <div className="text-4xl mb-2">🔍</div>
            <div>No trending content found</div>
            <div className="text-sm mt-1">Try a different category</div>
          </div>
        )}
      </div>
    </div>
  );
}
