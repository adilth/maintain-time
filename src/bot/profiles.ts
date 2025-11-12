import { Profile, Mood, Suggestion, SaveList } from "@/types";
import fs from "fs/promises";
import path from "path";

// Simple file-based storage for bot users
// In production, use a proper database

const DATA_DIR = process.env.DATA_DIR || ".data";
const BOT_PROFILES_FILE = path.join(DATA_DIR, "bot-profiles.json");

export type BotHistorySession = {
  id: string;
  message: string;
  mood: Mood;
  suggestions: Suggestion[];
  timestamp: string;
  feedback?: "helpful" | "not-helpful";
};

export type BotSavedItem = {
  id: string;
  suggestion: Suggestion;
  list: SaveList;
  addedAt: string;
};

export type UserStats = {
  totalQueries: number;
  totalLikes: number;
  totalSaves: number;
  lastActive: string;
  joinedAt: string;
  streak: number; // Days in a row
  favoriteCategories: Record<string, number>;
};

export type NotificationSettings = {
  dailyDigest: boolean;
  dailyTime?: string; // "09:00" format
  trendingAlerts: boolean;
  reminders: boolean;
};

export type BotUserState = {
  userId: string;
  username?: string;
  firstName?: string;
  profile: Profile;
  currentMood?: Mood;
  lastActive: string;
  pendingProfileSetup?: boolean;
  // Per-user data
  history: BotHistorySession[];
  saves: BotSavedItem[];
  likes: string[]; // video IDs
  stats: UserStats;
  notifications: NotificationSettings;
};

type BotProfileStore = {
  users: Record<string, BotUserState>;
};

// In-memory cache
let profileCache: BotProfileStore | null = null;

async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (err) {
    console.error("Error creating data directory:", err);
  }
}

async function loadProfiles(): Promise<BotProfileStore> {
  if (profileCache) return profileCache;

  try {
    await ensureDataDir();
    const data = await fs.readFile(BOT_PROFILES_FILE, "utf-8");
    profileCache = JSON.parse(data);
    return profileCache!;
  } catch {
    profileCache = { users: {} };
    return profileCache;
  }
}

async function saveProfiles(store: BotProfileStore) {
  try {
    await ensureDataDir();
    await fs.writeFile(BOT_PROFILES_FILE, JSON.stringify(store, null, 2));
    profileCache = store;
  } catch (err) {
    console.error("Error saving bot profiles:", err);
  }
}

export async function getUserState(userId: string): Promise<BotUserState> {
  const store = await loadProfiles();
  
  if (!store.users[userId]) {
    const now = new Date().toISOString();
    store.users[userId] = {
      userId,
      profile: {
        hobbies: [],
        interests: [],
        languages: [],
        youtubers: [],
      },
      lastActive: now,
      history: [],
      saves: [],
      likes: [],
      stats: {
        totalQueries: 0,
        totalLikes: 0,
        totalSaves: 0,
        lastActive: now,
        joinedAt: now,
        streak: 0,
        favoriteCategories: {},
      },
      notifications: {
        dailyDigest: false,
        trendingAlerts: false,
        reminders: false,
      },
    };
    await saveProfiles(store);
  }

  // Update last active
  store.users[userId].lastActive = new Date().toISOString();
  
  return store.users[userId];
}

export async function updateUserState(
  userId: string,
  updates: Partial<BotUserState>
) {
  const store = await loadProfiles();
  const currentState = await getUserState(userId);
  
  store.users[userId] = {
    ...currentState,
    ...updates,
    lastActive: new Date().toISOString(),
  };
  
  await saveProfiles(store);
  return store.users[userId];
}

export async function setUserMood(userId: string, mood: Mood) {
  return updateUserState(userId, { currentMood: mood });
}

export async function updateUserProfile(userId: string, profile: Partial<Profile>) {
  const state = await getUserState(userId);
  const updatedProfile = {
    ...state.profile,
    ...profile,
  };
  
  return updateUserState(userId, { profile: updatedProfile });
}

export async function resetUserProfile(userId: string) {
  return updateUserState(userId, {
    profile: {
      hobbies: [],
      interests: [],
      languages: [],
      youtubers: [],
    },
    currentMood: undefined,
    pendingProfileSetup: false,
  });
}

export async function getAllUsers(): Promise<BotUserState[]> {
  const store = await loadProfiles();
  return Object.values(store.users);
}

// Parse profile from user message
export function parseProfileFromMessage(message: string): Partial<Profile> {
  const profile: Partial<Profile> = {};
  
  // Extract hobbies
  const hobbiesMatch = message.match(/hobbies?:\s*([^\n]+)/i);
  if (hobbiesMatch) {
    profile.hobbies = hobbiesMatch[1]
      .split(/,|،/)
      .map((h) => h.trim())
      .filter(Boolean);
  }
  
  // Extract interests
  const interestsMatch = message.match(/interests?:\s*([^\n]+)/i);
  if (interestsMatch) {
    profile.interests = interestsMatch[1]
      .split(/,|،/)
      .map((i) => i.trim())
      .filter(Boolean);
  }
  
  // Extract languages
  const languagesMatch = message.match(/languages?:\s*([^\n]+)/i);
  if (languagesMatch) {
    profile.languages = languagesMatch[1]
      .split(/,|،/)
      .map((l) => l.trim())
      .filter(Boolean);
  }
  
  // Extract YouTubers
  const youtubersMatch = message.match(/youtubers?:\s*([^\n]+)/i);
  if (youtubersMatch) {
    const youtuberNames = youtubersMatch[1]
      .split(/,|،/)
      .map((y) => y.trim())
      .filter(Boolean);
    
    profile.youtubers = youtuberNames.map((name) => ({
      name,
      channelUrl: "", // User can add later if needed
    }));
  }
  
  return profile;
}

// User-specific history management
export async function addToHistory(
  userId: string,
  session: BotHistorySession
) {
  const state = await getUserState(userId);
  state.history.unshift(session);
  
  // Keep only last 50 sessions
  if (state.history.length > 50) {
    state.history = state.history.slice(0, 50);
  }
  
  // Update stats
  state.stats.totalQueries++;
  
  return updateUserState(userId, state);
}

export async function getUserHistory(userId: string, limit = 10): Promise<BotHistorySession[]> {
  const state = await getUserState(userId);
  return state.history.slice(0, limit);
}

// User-specific saves management
export async function addToSaves(
  userId: string,
  suggestion: Suggestion,
  list: SaveList
) {
  const state = await getUserState(userId);
  
  // Check if already saved
  const existingIndex = state.saves.findIndex(s => s.id === suggestion.id);
  if (existingIndex >= 0) {
    // Update list if different
    state.saves[existingIndex].list = list;
  } else {
    state.saves.unshift({
      id: suggestion.id,
      suggestion,
      list,
      addedAt: new Date().toISOString(),
    });
  }
  
  // Update stats
  state.stats.totalSaves++;
  
  return updateUserState(userId, state);
}

export async function removeFromSaves(userId: string, videoId: string) {
  const state = await getUserState(userId);
  state.saves = state.saves.filter(s => s.id !== videoId);
  return updateUserState(userId, state);
}

export async function getUserSaves(userId: string, list?: SaveList): Promise<BotSavedItem[]> {
  const state = await getUserState(userId);
  if (list) {
    return state.saves.filter(s => s.list === list);
  }
  return state.saves;
}

// User-specific likes management
export async function toggleLike(userId: string, videoId: string): Promise<boolean> {
  const state = await getUserState(userId);
  const index = state.likes.indexOf(videoId);
  
  if (index >= 0) {
    // Unlike
    state.likes.splice(index, 1);
    state.stats.totalLikes = Math.max(0, state.stats.totalLikes - 1);
    await updateUserState(userId, state);
    return false;
  } else {
    // Like
    state.likes.push(videoId);
    state.stats.totalLikes++;
    await updateUserState(userId, state);
    return true;
  }
}

export async function isLiked(userId: string, videoId: string): Promise<boolean> {
  const state = await getUserState(userId);
  return state.likes.includes(videoId);
}

// Feedback management
export async function setFeedback(
  userId: string,
  sessionId: string,
  feedback: "helpful" | "not-helpful"
) {
  const state = await getUserState(userId);
  const session = state.history.find(h => h.id === sessionId);
  if (session) {
    session.feedback = feedback;
    await updateUserState(userId, state);
  }
}

// Notification settings
export async function updateNotificationSettings(
  userId: string,
  settings: Partial<NotificationSettings>
) {
  const state = await getUserState(userId);
  state.notifications = { ...state.notifications, ...settings };
  return updateUserState(userId, state);
}

// Stats helpers
export async function updateStreak(userId: string) {
  const state = await getUserState(userId);
  const now = new Date();
  const lastActive = new Date(state.stats.lastActive);
  const daysDiff = Math.floor((now.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysDiff === 1) {
    // Consecutive day
    state.stats.streak++;
  } else if (daysDiff > 1) {
    // Streak broken
    state.stats.streak = 1;
  }
  // Same day, don't change streak
  
  state.stats.lastActive = now.toISOString();
  return updateUserState(userId, state);
}

export async function trackCategory(userId: string, category: string) {
  const state = await getUserState(userId);
  state.stats.favoriteCategories[category] = (state.stats.favoriteCategories[category] || 0) + 1;
  return updateUserState(userId, state);
}
