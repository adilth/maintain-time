"use client";

import { useEffect, useState } from "react";
import { SaveList, SavedItem, SuggestionTag } from "@/types";
import { SuggestionCard } from "../(components)/SuggestionCard";
import { SuggestionsGridSkeleton } from "../(components)/LoadingSkeleton";
import { toast } from "sonner";

const LISTS: SaveList[] = ["listen", "learn", "knowledge", "tomorrow", "other"];

export default function SavesPage() {
  const [active, setActive] = useState<SaveList>("listen");
  const [items, setItems] = useState<SavedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<SuggestionTag[]>([]);
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "relevance">("newest");

  async function load(list: SaveList) {
    setLoading(true);
    try {
      const resp = await fetch(`/api/saves?list=${list}`);
      const data = await resp.json();
      setItems(data.items ?? []);
    } catch {
      toast.error("Failed to load saves");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(active);
  }, [active]);

  // Get all unique tags from current items
  const allTags = Array.from(
    new Set(items.flatMap((item) => item.suggestion.tags || []))
  ).sort();

  // Filter and sort items
  const filteredItems = items
    .filter((item) => {
      const matchesSearch =
        searchQuery === "" ||
        item.suggestion.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.suggestion.creatorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.suggestion.description?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesTags =
        selectedTags.length === 0 ||
        selectedTags.some((tag) => item.suggestion.tags?.includes(tag));

      return matchesSearch && matchesTags;
    })
    .sort((a, b) => {
      if (sortBy === "newest") {
        return b.addedAt.localeCompare(a.addedAt);
      } else if (sortBy === "oldest") {
        return a.addedAt.localeCompare(b.addedAt);
      } else {
        // relevance
        return (b.suggestion.relevance || 0) - (a.suggestion.relevance || 0);
      }
    });

  const toggleTag = (tag: SuggestionTag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  return (
    <div className="p-4 md:p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Saves</h1>
      
      {/* List tabs */}
      <div className="flex gap-2 flex-wrap">
        {LISTS.map((l) => (
          <button
            key={l}
            className={`px-3 py-2 rounded-md border ${
              active === l ? "bg-black/10 dark:bg-white/10" : ""
            }`}
            onClick={() => {
              setActive(l);
              setSearchQuery("");
              setSelectedTags([]);
            }}
          >
            {l}
          </button>
        ))}
      </div>

      {/* Search and filters */}
      <div className="space-y-3">
        <input
          type="text"
          placeholder="Search by title, creator, or description..."
          className="w-full border rounded-md px-4 py-2 bg-background"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm text-foreground/60">Sort by:</span>
          <button
            className={`px-3 py-1 rounded-md border text-sm ${
              sortBy === "newest" ? "bg-black/10 dark:bg-white/10" : ""
            }`}
            onClick={() => setSortBy("newest")}
          >
            Newest
          </button>
          <button
            className={`px-3 py-1 rounded-md border text-sm ${
              sortBy === "oldest" ? "bg-black/10 dark:bg-white/10" : ""
            }`}
            onClick={() => setSortBy("oldest")}
          >
            Oldest
          </button>
          <button
            className={`px-3 py-1 rounded-md border text-sm ${
              sortBy === "relevance" ? "bg-black/10 dark:bg-white/10" : ""
            }`}
            onClick={() => setSortBy("relevance")}
          >
            Relevance
          </button>
        </div>

        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm text-foreground/60">Filter by tags:</span>
            {allTags.map((tag) => (
              <button
                key={tag}
                className={`px-2 py-1 rounded-full text-xs ${
                  selectedTags.includes(tag)
                    ? "bg-foreground text-background"
                    : "bg-black/5 dark:bg-white/10"
                }`}
                onClick={() => toggleTag(tag)}
              >
                {tag}
              </button>
            ))}
            {selectedTags.length > 0 && (
              <button
                className="text-xs text-foreground/60 hover:underline"
                onClick={() => setSelectedTags([])}
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Results */}
      {loading ? (
        <SuggestionsGridSkeleton count={6} />
      ) : filteredItems.length === 0 ? (
        <div className="text-foreground/60 text-center mt-4">
          {items.length === 0
            ? "No saved suggestions found."
            : "No results match your search."}
        </div>
      ) : (
        <div>
          <div className="text-sm text-foreground/60 mb-2">
            {filteredItems.length} result{filteredItems.length !== 1 ? "s" : ""}
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map((it) => (
              <SuggestionCard key={it.id + it.list} s={it.suggestion} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
