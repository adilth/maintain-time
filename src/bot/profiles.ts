import { Profile, Mood, Suggestion, SaveList } from "@/types";
import { prisma } from "@/lib/prisma";
import { findOrCreateTelegramUser } from "@/lib/auth";
import { 
  updateTelegramMood, 
  updateTelegramNotifications,
  addToHistory as dbAddToHistory,
  getUserHistory as dbGetUserHistory,
  saveVideo,
  getUserSaves as dbGetUserSaves,
  removeSave,
  likeVideo,
  unlikeVideo,
  isVideoLiked,
  updateUserProfile as dbUpdateUserProfile,
  getUserStats,
  updateStreak as dbUpdateStreak
} from "@/lib/db";

// Helper to get or create user from telegram ID
async function getTelegramUser(telegramId: string) {
  return findOrCreateTelegramUser({ telegramId });
}

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
  streak: number;
  favoriteCategories: Record<string, number>;
};

export type NotificationSettings = {
  dailyDigest: boolean;
  dailyTime?: string;
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
  history: BotHistorySession[];
  saves: BotSavedItem[];
  likes: string[];
  stats: UserStats;
  notifications: NotificationSettings;
};

// Get or create Telegram user and return full state
export async function getUserState(
  userId: string,
  ctx?: { from?: { username?: string; first_name?: string } }
): Promise<BotUserState> {
  const telegramId = userId;
  
  // Find or create user
  const user = await findOrCreateTelegramUser({
    telegramId,
    username: ctx?.from?.username,
    firstName: ctx?.from?.first_name,
  });
  
  // Get profile
  const profile = await prisma.profile.findUnique({
    where: { userId: user.id }
  });
  
  // Get telegram account details
  const telegramAccount = await prisma.telegramAccount.findUnique({
    where: { telegramId },
    include: { notifications: true }
  });
  
  // Get stats
  const stats = await getUserStats(user.id);
  
  // Get recent history
  const historyData = await dbGetUserHistory(user.id, 50);
  const history: BotHistorySession[] = historyData.map((h: { id: string; message: string; mood: string | null; suggestions: unknown; timestamp: Date }) => ({
    id: h.id,
    message: h.message,
    mood: (h.mood as Mood) || "curious",
    suggestions: h.suggestions as Suggestion[],
    timestamp: h.timestamp.toISOString(),
  }));
  
  // Get saves
  const savesData = await dbGetUserSaves(user.id);
  const saves: BotSavedItem[] = savesData.map((s: { videoId: string; suggestion: unknown; list: string; addedAt: Date }) => ({
    id: s.videoId,
    suggestion: s.suggestion as Suggestion,
    list: s.list as SaveList,
    addedAt: s.addedAt.toISOString(),
  }));
  
  // Get likes
  const likesData = await prisma.like.findMany({
    where: { userId: user.id },
    select: { videoId: true }
  });
  const likes = likesData.map((l: { videoId: string }) => l.videoId);
  
  return {
    userId: user.id,
    username: user.telegramUsername || undefined,
    firstName: user.name || undefined,
    profile: {
      hobbies: profile?.hobbies as string[] || [],
      interests: profile?.interests as string[] || [],
      languages: profile?.languages as string[] || [],
      workContext: profile?.workContext || undefined,
      youtubers: profile?.youtubers as { name: string; channelUrl: string }[] || [],
    },
    currentMood: (telegramAccount?.currentMood as Mood) || undefined,
    lastActive: stats?.lastActiveDate.toISOString() || new Date().toISOString(),
    pendingProfileSetup: false,
    history,
    saves,
    likes,
    stats: {
      totalQueries: stats?.totalQueries || 0,
      totalLikes: stats?.totalLikes || 0,
      totalSaves: stats?.totalSaves || 0,
      lastActive: stats?.lastActiveDate.toISOString() || new Date().toISOString(),
      joinedAt: user.createdAt.toISOString(),
      streak: stats?.streak || 0,
      favoriteCategories: (stats?.favoriteCategories as Record<string, number>) || {},
    },
    notifications: {
      dailyDigest: telegramAccount?.notifications?.dailyDigest || false,
      dailyTime: telegramAccount?.notifications?.dailyDigestTime || undefined,
      trendingAlerts: telegramAccount?.notifications?.trendingAlerts || false,
      reminders: telegramAccount?.notifications?.reminders || false,
    },
  };
}

export async function updateUserState(
  userId: string,
  updates: Partial<BotUserState>
) {
  // This is kept for compatibility but we update individual pieces
  const telegramId = userId;
  const user = await getTelegramUser(telegramId);
  
  if (updates.currentMood) {
    await updateTelegramMood(telegramId, updates.currentMood);
  }
  
  if (updates.profile) {
    await dbUpdateUserProfile(user.id, updates.profile);
  }
  
  if (updates.notifications) {
    await updateTelegramNotifications(telegramId, updates.notifications);
  }
  
  // Return updated state
  return getUserState(userId);
}

export async function setUserMood(userId: string, mood: Mood) {
  const telegramId = userId;
  await updateTelegramMood(telegramId, mood);
  return getUserState(userId);
}

export async function updateUserProfile(userId: string, profile: Partial<Profile>) {
  const telegramId = userId;
  const user = await getTelegramUser(telegramId);
  
  await dbUpdateUserProfile(user.id, profile);
  return getUserState(userId);
}

export async function resetUserProfile(userId: string) {
  const telegramId = userId;
  const user = await getTelegramUser(telegramId);
  
  await dbUpdateUserProfile(user.id, {
    hobbies: [],
    interests: [],
    languages: [],
    workContext: undefined,
    youtubers: [],
  });
  
  await updateTelegramMood(telegramId, "curious");
  
  return getUserState(userId);
}

export async function getAllUsers(): Promise<BotUserState[]> {
  const users = await prisma.user.findMany({
    where: {
      telegramId: { not: null }
    },
    include: {
      telegramAccount: {
        include: { notifications: true }
      },
      profile: true,
      stats: true,
    }
  });
  
  const states: BotUserState[] = [];
  
  for (const user of users) {
    if (!user.telegramAccount) continue;
    
    const state = await getUserState(user.telegramAccount.telegramId);
    states.push(state);
  }
  
  return states;
}

// Parse profile from user message
export function parseProfileFromMessage(message: string): Partial<Profile> {
  const profile: Partial<Profile> = {};
  
  const hobbiesMatch = message.match(/hobbies?:\s*([^\n]+)/i);
  if (hobbiesMatch) {
    profile.hobbies = hobbiesMatch[1]
      .split(/,|،/)
      .map((h) => h.trim())
      .filter(Boolean);
  }
  
  const interestsMatch = message.match(/interests?:\s*([^\n]+)/i);
  if (interestsMatch) {
    profile.interests = interestsMatch[1]
      .split(/,|،/)
      .map((i) => i.trim())
      .filter(Boolean);
  }
  
  const languagesMatch = message.match(/languages?:\s*([^\n]+)/i);
  if (languagesMatch) {
    profile.languages = languagesMatch[1]
      .split(/,|،/)
      .map((l) => l.trim())
      .filter(Boolean);
  }
  
  const youtubersMatch = message.match(/youtubers?:\s*([^\n]+)/i);
  if (youtubersMatch) {
    const youtuberNames = youtubersMatch[1]
      .split(/,|،/)
      .map((y) => y.trim())
      .filter(Boolean);
    
    profile.youtubers = youtuberNames.map((name) => ({
      name,
      channelUrl: "",
    }));
  }
  
  return profile;
}

// History management
export async function addToHistory(
  userId: string,
  session: BotHistorySession
) {
  const telegramId = userId;
  const user = await getTelegramUser(telegramId);
  
  await dbAddToHistory(user.id, {
    message: session.message,
    mood: session.mood,
    suggestions: session.suggestions,
  });
  
  return getUserState(userId);
}

export async function getUserHistory(userId: string, limit = 10): Promise<BotHistorySession[]> {
  const telegramId = userId;
  const user = await getTelegramUser(telegramId);
  
  const historyData = await dbGetUserHistory(user.id, limit);
  return historyData.map((h: { id: string; message: string; mood: string | null; suggestions: unknown; timestamp: Date }) => ({
    id: h.id,
    message: h.message,
    mood: (h.mood as Mood) || "curious",
    suggestions: h.suggestions as Suggestion[],
    timestamp: h.timestamp.toISOString(),
  }));
}

// Saves management
export async function addToSaves(
  userId: string,
  suggestion: Suggestion,
  list: SaveList
) {
  const telegramId = userId;
  const user = await getTelegramUser(telegramId);
  
  await saveVideo(user.id, {
    videoId: suggestion.id,
    suggestion,
    list,
  });
  
  return getUserState(userId);
}

export async function removeFromSaves(userId: string, videoId: string) {
  const telegramId = userId;
  const user = await getTelegramUser(telegramId);
  
  await removeSave(user.id, videoId);
  return getUserState(userId);
}

export async function getUserSaves(userId: string, list?: SaveList): Promise<BotSavedItem[]> {
  const telegramId = userId;
  const user = await getTelegramUser(telegramId);
  
  const savesData = await dbGetUserSaves(user.id, list);
  return savesData.map((s: { videoId: string; suggestion: unknown; list: string; addedAt: Date }) => ({
    id: s.videoId,
    suggestion: s.suggestion as Suggestion,
    list: s.list as SaveList,
    addedAt: s.addedAt.toISOString(),
  }));
}

// Likes management
export async function toggleLike(userId: string, videoId: string, suggestion?: Suggestion): Promise<boolean> {
  const telegramId = userId;
  const user = await getTelegramUser(telegramId);
  
  const liked = await isVideoLiked(user.id, videoId);
  
  if (liked) {
    await unlikeVideo(user.id, videoId);
    return false;
  } else {
    await likeVideo(user.id, videoId, suggestion);
    return true;
  }
}

export async function isLiked(userId: string, videoId: string): Promise<boolean> {
  const telegramId = userId;
  const user = await getTelegramUser(telegramId);
  
  return isVideoLiked(user.id, videoId);
}

// Feedback management (stored in history session feedback field)
export async function setFeedback(
  userId: string,
  sessionId: string,
  feedback: "helpful" | "not-helpful"
) {
  // Update feedback in the database
  // Note: Our schema doesn't have feedback field yet, but we can add it later
  // For now, this is a no-op
  console.log(`Feedback ${feedback} for session ${sessionId} by user ${userId}`);
}

// Notification settings
export async function updateNotificationSettings(
  userId: string,
  settings: Partial<NotificationSettings>
) {
  const telegramId = userId;
  
  await updateTelegramNotifications(telegramId, {
    dailyDigest: settings.dailyDigest,
    dailyDigestTime: settings.dailyTime,
    trendingAlerts: settings.trendingAlerts,
    reminders: settings.reminders,
  });
  
  return getUserState(userId);
}

// Stats helpers
export async function updateStreak(userId: string) {
  const telegramId = userId;
  const user = await getTelegramUser(telegramId);
  
  const result = await dbUpdateStreak(user.id);
  return result;
}

export async function trackCategory(userId: string, category: string) {
  const telegramId = userId;
  const user = await getTelegramUser(telegramId);
  
  const stats = await getUserStats(user.id);
  if (!stats) return;
  
  const categories = (stats.favoriteCategories as Record<string, number>) || {};
  categories[category] = (categories[category] || 0) + 1;
  
  await prisma.userStats.update({
    where: { userId: user.id },
    data: { favoriteCategories: categories }
  });
}

