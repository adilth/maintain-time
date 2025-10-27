"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";

interface SavedItem {
  id: string;
  list: string;
  addedAt: string;
}

interface LikesSavesContextType {
  likes: string[];
  saves: SavedItem[];
  isLoading: boolean;
  refreshLikes: () => Promise<void>;
  refreshSaves: () => Promise<void>;
  refreshAll: () => Promise<void>;
  checkIfLiked: (id: string) => boolean;
  checkIfSaved: (id: string) => { isSaved: boolean; savedTo: string | null };
}

const LikesSavesContext = createContext<LikesSavesContextType | undefined>(undefined);

export function LikesSavesProvider({ children }: { children: ReactNode }) {
  const [likes, setLikes] = useState<string[]>([]);
  const [saves, setSaves] = useState<SavedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshLikes = useCallback(async () => {
    try {
      const response = await fetch("/api/likes");
      const data = await response.json();
      setLikes(data.likes || []);
    } catch (err) {
      console.error("Failed to fetch likes:", err);
    }
  }, []);

  const refreshSaves = useCallback(async () => {
    try {
      const response = await fetch("/api/saves");
      const data = await response.json();
      setSaves(data.items || []);
    } catch (err) {
      console.error("Failed to fetch saves:", err);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([refreshLikes(), refreshSaves()]);
    setIsLoading(false);
  }, [refreshLikes, refreshSaves]);

  const checkIfLiked = useCallback((id: string) => {
    return likes.includes(id);
  }, [likes]);

  const checkIfSaved = useCallback((id: string): { isSaved: boolean; savedTo: string | null } => {
    const savedItem = saves.find((item) => item.id === id);
    return {
      isSaved: !!savedItem,
      savedTo: savedItem?.list || null,
    };
  }, [saves]);

  // Initial fetch on mount
  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  return (
    <LikesSavesContext.Provider
      value={{
        likes,
        saves,
        isLoading,
        refreshLikes,
        refreshSaves,
        refreshAll,
        checkIfLiked,
        checkIfSaved,
      }}
    >
      {children}
    </LikesSavesContext.Provider>
  );
}

export function useLikesSaves() {
  const context = useContext(LikesSavesContext);
  if (!context) {
    throw new Error("useLikesSaves must be used within LikesSavesProvider");
  }
  return context;
}
