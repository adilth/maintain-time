"use client";

import { useEffect, useState } from "react";
import { SaveList, SavedItem } from "@/types";
import { SuggestionCard } from "../(components)/SuggestionCard";

const LISTS: SaveList[] = ["listen", "learn", "knowledge", "tomorrow", "other"];

export default function SavesPage() {
  const [active, setActive] = useState<SaveList>("listen");
  const [items, setItems] = useState<SavedItem[]>([]);
  const [loading, setLoading] = useState(true);

  async function load(list: SaveList) {
    setLoading(true);
    const resp = await fetch(`/api/saves?list=${list}`);
    const data = await resp.json();
    setItems(data.items ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load(active);
  }, [active]);

  return (
    <div className="p-4 md:p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Saves</h1>
      <div className="flex gap-2">
        {LISTS.map((l) => (
          <button
            key={l}
            className={`px-3 py-2 rounded-md border ${
              active === l ? "bg-black/10 dark:bg-white/10" : ""
            }`}
            onClick={() => setActive(l)}
          >
            {l}
          </button>
        ))}
      </div>
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-lg border border-black/10 dark:border-white/10 p-3 animate-pulse"
            >
              <div className="aspect-video bg-black/10 dark:bg-white/10 rounded mb-3" />
              <div className="h-4 bg-black/10 dark:bg-white/10 rounded w-3/4 mb-2" />
              <div className="h-3 bg-black/10 dark:bg-white/10 rounded w-1/2 mb-4" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className=" text-foreground/60 text-center mt-4">
          No saved suggestions found.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items
            .sort((a, b) => b.addedAt.localeCompare(a.addedAt))
            .map((it) => (
              <SuggestionCard key={it.id + it.list} s={it.suggestion} />
            ))}
        </div>
      )}
    </div>
  );
}
