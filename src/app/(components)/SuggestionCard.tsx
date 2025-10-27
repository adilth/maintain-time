import { Suggestion, SaveList } from "@/types";
import { useEffect, useRef, useState } from "react";
import { useLikesSaves } from "@/contexts/LikesSavesContext";

export function SuggestionCard({ s, onLike, onSave }: { s: Suggestion; onLike?: (s: Suggestion) => void; onSave?: (s: Suggestion, list: SaveList) => void }) {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const [thumbnailError, setThumbnailError] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  
  // Use global context instead of fetching individually
  const { checkIfLiked, checkIfSaved, refreshLikes, refreshSaves } = useLikesSaves();
  const isLiked = checkIfLiked(s.id);
  const { isSaved, savedTo } = checkIfSaved(s.id);

  // Remove duplicate fetch calls - now using context!

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
    <a href={s.url ?? "#"} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-black/10 dark:border-white/10 p-3 hover:bg-black/5 dark:hover:bg-white/5 transition flex flex-col h-full">
      <div className="aspect-video bg-black/5 dark:bg-white/10 rounded mb-3 overflow-hidden flex items-center justify-center relative">
        {s.thumbnailUrl && !thumbnailError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img 
            src={s.thumbnailUrl} 
            alt="thumbnail" 
            className="w-full h-full object-cover" 
            onError={() => setThumbnailError(true)}
          />
        ) : (
          <div className="text-4xl opacity-30">🎬</div>
        )}
      </div>
      <div className="font-medium line-clamp-2">{s.title}</div>
      <div className="text-xs text-foreground/60 flex items-center gap-2 mt-0.5">
        {s.creatorAvatarUrl && !avatarError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img 
            src={s.creatorAvatarUrl} 
            alt="avatar" 
            className="w-4 h-4 rounded-full bg-black/5 dark:bg-white/10" 
            onError={() => setAvatarError(true)}
          />
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
        <button 
          type="button" 
          className={`px-2 py-1 cursor-pointer rounded-md border text-xs transition-colors ${
            isLiked 
              ? "bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700 text-red-700 dark:text-red-300" 
              : "hover:bg-black/5 dark:hover:bg-white/10"
          }`}
          onClick={(e) => { 
            e.preventDefault(); 
            onLike?.(s);
            // Refresh likes after action
            setTimeout(() => refreshLikes(), 100);
          }}
          title={isLiked ? "Already liked" : "Like this"}
        >
          {isLiked ? "❤️ Liked" : "🤍 Like"}
        </button>
        <div className="relative">
          <details ref={detailsRef}>
            <summary 
              className={`list-none cursor-pointer px-2 py-1 rounded-md border text-xs transition-colors ${
                isSaved
                  ? "bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700 text-green-700 dark:text-green-300"
                  : "hover:bg-black/5 dark:hover:bg-white/10"
              }`}
              title={isSaved ? `Saved to ${savedTo}` : "Save this"}
            >
              {isSaved ? `✅ Saved${savedTo ? ` (${savedTo})` : ""}` : "🔖 Save"}
            </summary>
            <div className="absolute right-0 mt-1 z-10 bg-background border rounded-md shadow text-xs min-w-24">
              {(["listen","learn","knowledge","tomorrow","other"] as SaveList[]).map((list) => (
                <button 
                  key={list} 
                  className={`block w-full text-left px-3 py-2 hover:bg-black/5 dark:hover:bg-white/10 ${
                    savedTo === list ? "bg-green-100 dark:bg-green-900/30 font-medium" : ""
                  }`}
                  onClick={(e) => { 
                    e.preventDefault(); 
                    onSave?.(s, list);
                    // Refresh saves after action
                    setTimeout(() => refreshSaves(), 100);
                    (e.currentTarget.parentElement as HTMLElement)?.closest('details')?.removeAttribute('open'); 
                  }}
                >
                  {savedTo === list ? "✓ " : ""}{list}
                </button>
              ))}
            </div>
          </details>
        </div>
      </div>
    </a>
  );
}