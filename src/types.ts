export type Mood = "tired" | "curious" | "motivated" | "relaxed" | "bored" | "chill";

export type SuggestionTag =
  | "learning"
  | "gaming"
  | "coding"
  | "entertainment"
  | "news"
  | "wellness"
  | "music"
  | "podcast"
  | "saved"
  | "fallback"
  | "error"
  | "listen"
  | "learn"
  | "knowledge"
  | "tomorrow"
  | "other"
  | "trending"
  | "youtube"
  | "tech"
  | "chill";

export type Suggestion = {
  id: string;
  title: string;
  creatorName: string;
  creatorAvatarUrl?: string;
  thumbnailUrl?: string;
  durationMinutes?: number;
  description?: string;
  datePublished?: string;
  tags: SuggestionTag[];
  relevance: number; // 0..1
  url?: string;
};

export type SaveList = "listen" | "learn" | "knowledge" | "tomorrow" | "other";

export type SavedItem = {
  id: string; // suggestion id
  list: SaveList;
  addedAt: string; // ISO date
  suggestion: Suggestion;
};

export type Profile = {
  name?: string;
  hobbies: string[];
  interests: string[];
  languages: string[];
  workContext?: string;
  youtubers?: { name: string; channelUrl: string }[];
};

export type RecommendRequest = {
  message: string;
  mood?: Mood;
  count?: number;
  profile?: Profile;
};

export type RecommendResponse = {
  suggestions: Suggestion[];
  model?: string;
  usedFallback?: boolean;
};

export type HistorySession = {
  id: string;
  message: string;
  mood: Mood;
  suggestions: Suggestion[];
  timestamp: string; // ISO date
};

