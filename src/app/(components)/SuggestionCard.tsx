import { Suggestion, SaveList } from "@/types";
import { useEffect, useRef } from "react";

export function SuggestionCard({ s, onLike, onSave }: { s: Suggestion; onLike?: (s: Suggestion) => void; onSave?: (s: Suggestion, list: SaveList) => void }) {
    const detailsRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        detailsRef.current &&
        detailsRef.current.hasAttribute("open") &&
        !detailsRef.current.contains(e.target as Node)
      ) {
        detailsRef.current.removeAttribute("open");
      }
    }

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);
    return (
    <a href={s.url ?? "#"} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-black/10 dark:border-white/10 p-3 block hover:bg-black/5 dark:hover:bg-white/5 transition flex flex-col h-full">
      <div className="aspect-video bg-black/5 dark:bg-white/10 rounded mb-3 overflow-hidden">
        {s.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={s.thumbnailUrl} alt="thumbnail" className="w-full h-full object-cover" />
        ) : null}
      </div>
      <div className="font-medium line-clamp-2">{s.title}</div>
      <div className="text-xs text-foreground/60 flex items-center gap-2 mt-0.5">
        {s.creatorAvatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={s.creatorAvatarUrl} alt="avatar" className="w-4 h-4 rounded-full" />
        ) : null}
        <span>
          {s.creatorName}
          {s.durationMinutes ? ` • ${s.durationMinutes}m` : ""}
          {s.datePublished ? ` • ${new Date(s.datePublished).toLocaleDateString()}` : ""}
        </span>
      </div>
      {s.description ? <div className="text-sm mt-2 line-clamp-2">{s.description}</div> : null}
      <div className="mt-2 flex flex-wrap gap-1 text-xs items-center flex-grow">
        {s.tags?.map((t) => (
          <span key={t} className="px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10">
            {t}
          </span>
        ))}
        <span className="ml-auto text-foreground/50">{Math.round((s.relevance ?? 0) * 100)}%</span>
      </div>
      <div className="mt-3 flex items-center justify-end gap-1">
        <button type="button" className="px-2 py-1 rounded-md border hover:bg-black/5 dark:hover:bg-white/10 text-xs" onClick={(e) => { e.preventDefault(); onLike?.(s); }}>❤️ Like</button>
        <div className="relative">
          <details ref={detailsRef}>
            <summary className="list-none cursor-pointer px-2 py-1 rounded-md border hover:bg-black/5 dark:hover:bg-white/10 text-xs">🔖 Save</summary>
            <div className="absolute right-0 mt-1 z-10 bg-background border rounded-md shadow text-xs min-w-24">
              {(["listen","learn","knowledge","tomorrow","other"] as SaveList[]).map((list) => (
                <button key={list} className="block w-full text-left px-3 py-2 hover:bg-black/5 dark:hover:bg-white/10" onClick={(e) => { e.preventDefault(); onSave?.(s, list); (e.currentTarget.parentElement as HTMLElement)?.closest('details')?.removeAttribute('open'); }}>
                  {list}
                </button>
              ))}
            </div>
          </details>
        </div>
      </div>
    </a>
  );
}