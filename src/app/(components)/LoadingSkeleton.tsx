export function SuggestionCardSkeleton() {
  return (
    <div className="rounded-lg border border-black/10 dark:border-white/10 p-3 animate-pulse">
      <div className="aspect-video bg-black/10 dark:bg-white/10 rounded mb-3" />
      <div className="h-4 bg-black/10 dark:bg-white/10 rounded w-3/4 mb-2" />
      <div className="h-3 bg-black/10 dark:bg-white/10 rounded w-1/2 mb-4" />
      <div className="flex gap-2">
        <div className="h-5 w-12 bg-black/10 dark:bg-white/10 rounded-full" />
        <div className="h-5 w-16 bg-black/10 dark:bg-white/10 rounded-full" />
      </div>
    </div>
  );
}

export function SuggestionsGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <SuggestionCardSkeleton key={i} />
      ))}
    </div>
  );
}
