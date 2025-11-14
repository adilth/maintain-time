import { prisma } from './prisma'
import { Suggestion } from '@/types'

// ============================================
// HISTORY
// ============================================

export async function addToHistory(userId: string, data: {
  message: string
  mood?: string
  suggestions: Suggestion[]
}) {
  const history = await prisma.historySession.create({
    data: {
      userId,
      message: data.message,
      mood: data.mood,
      suggestions: data.suggestions 
    }
  })
  
  // Update user stats
  await prisma.userStats.update({
    where: { userId },
    data: {
      totalQueries: { increment: 1 },
      lastActiveDate: new Date(),
    }
  })
  
  return history
}

export async function getUserHistory(userId: string, limit = 10) {
  return prisma.historySession.findMany({
    where: { userId },
    orderBy: { timestamp: 'desc' },
    take: limit,
  })
}

export async function getGlobalHistory(limit = 20) {
  return prisma.historySession.findMany({
    orderBy: { timestamp: 'desc' },
    take: limit,
    include: {
      user: {
        select: {
          name: true,
          telegramUsername: true,
        }
      }
    }
  })
}

// ============================================
// SAVES
// ============================================

export async function saveVideo(userId: string, data: {
  videoId: string
  suggestion: Suggestion
  list: 'listen' | 'learn' | 'knowledge' | 'tomorrow' | 'other'
  notes?: string
}) {
  // Check if already saved
  const existing = await prisma.savedItem.findUnique({
    where: {
      userId_videoId: {
        userId,
        videoId: data.videoId
      }
    }
  })
  
  if (existing) {
    // Update the list if different
    return prisma.savedItem.update({
      where: { id: existing.id },
      data: {
        list: data.list,
        notes: data.notes,
      }
    })
  }
  
  // Create new save
  const saved = await prisma.savedItem.create({
    data: {
      userId,
      videoId: data.videoId,
      suggestion: data.suggestion,
      list: data.list,
      notes: data.notes,
    }
  })
  
  // Update user stats
  await prisma.userStats.update({
    where: { userId },
    data: {
      totalSaves: { increment: 1 },
    }
  })
  
  return saved
}

export async function getUserSaves(userId: string, list?: string) {
  return prisma.savedItem.findMany({
    where: {
      userId,
      ...(list && { list })
    },
    orderBy: { addedAt: 'desc' }
  })
}

export async function removeSave(userId: string, videoId: string) {
  const deleted = await prisma.savedItem.delete({
    where: {
      userId_videoId: {
        userId,
        videoId
      }
    }
  })
  
  // Update user stats
  await prisma.userStats.update({
    where: { userId },
    data: {
      totalSaves: { decrement: 1 },
    }
  })
  
  return deleted
}

// ============================================
// LIKES
// ============================================

export async function likeVideo(userId: string, videoId: string, suggestion?: Suggestion) {
  // Check if already liked
  const existing = await prisma.like.findUnique({
    where: {
      userId_videoId: {
        userId,
        videoId
      }
    }
  })
  
  if (existing) {
    return existing // Already liked
  }
  
  // Create like
  const like = await prisma.like.create({
    data: {
      userId,
      videoId,
      suggestion: suggestion 
    }
  })
  
  // Update user stats
  await prisma.userStats.update({
    where: { userId },
    data: {
      totalLikes: { increment: 1 },
    }
  })
  
  return like
}

export async function unlikeVideo(userId: string, videoId: string) {
  const deleted = await prisma.like.delete({
    where: {
      userId_videoId: {
        userId,
        videoId
      }
    }
  })
  
  // Update user stats
  await prisma.userStats.update({
    where: { userId },
    data: {
      totalLikes: { decrement: 1 },
    }
  })
  
  return deleted
}

export async function getUserLikes(userId: string, limit?: number) {
  return prisma.like.findMany({
    where: { userId },
    orderBy: { likedAt: 'desc' },
    ...(limit && { take: limit })
  })
}

export async function isVideoLiked(userId: string, videoId: string) {
  const like = await prisma.like.findUnique({
    where: {
      userId_videoId: {
        userId,
        videoId
      }
    }
  })
  
  return !!like
}

// ============================================
// PROFILE
// ============================================

export async function updateUserProfile(userId: string, data: {
  hobbies?: string[]
  interests?: string[]
  languages?: string[]
  workContext?: string
  youtubers?: { name: string; channelUrl: string }[]
}) {
  return prisma.profile.upsert({
    where: { userId },
    create: {
      userId,
      hobbies: data.hobbies || [],
      interests: data.interests || [],
      languages: data.languages || [],
      workContext: data.workContext,
      youtubers: data.youtubers 
    },
    update: {
      ...(data.hobbies && { hobbies: data.hobbies }),
      ...(data.interests && { interests: data.interests }),
      ...(data.languages && { languages: data.languages }),
      ...(data.workContext !== undefined && { workContext: data.workContext }),
      ...(data.youtubers && { youtubers: data.youtubers }),
    }
  })
}

// ============================================
// STATS
// ============================================

export async function getUserStats(userId: string) {
  return prisma.userStats.findUnique({
    where: { userId }
  })
}

export async function updateStreak(userId: string) {
  const stats = await prisma.userStats.findUnique({
    where: { userId }
  })
  
  if (!stats) return
  
  const now = new Date()
  const lastActive = new Date(stats.lastActiveDate)
  const daysDiff = Math.floor((now.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24))
  
  let newStreak = stats.streak
  
  if (daysDiff === 1) {
    // Continue streak
    newStreak = stats.streak + 1
  } else if (daysDiff > 1) {
    // Streak broken
    newStreak = 1
  }
  
  const longestStreak = Math.max(newStreak, stats.longestStreak)
  
  await prisma.userStats.update({
    where: { userId },
    data: {
      streak: newStreak,
      longestStreak,
      lastActiveDate: now,
    }
  })
  
  return { streak: newStreak, longestStreak }
}

// ============================================
// TELEGRAM BOT SPECIFIC
// ============================================

export async function updateTelegramMood(telegramId: string, mood: string) {
  return prisma.telegramAccount.update({
    where: { telegramId },
    data: { currentMood: mood }
  })
}

export async function getTelegramNotificationSettings(telegramId: string) {
  const account = await prisma.telegramAccount.findUnique({
    where: { telegramId },
    include: { notifications: true }
  })
  
  return account?.notifications
}

export async function updateTelegramNotifications(telegramId: string, data: {
  dailyDigest?: boolean
  dailyDigestTime?: string
  trendingAlerts?: boolean
  reminders?: boolean
  timezone?: string
}) {
  const account = await prisma.telegramAccount.findUnique({
    where: { telegramId },
    include: { notifications: true }
  })
  
  if (!account) throw new Error('Telegram account not found')
  
  if (!account.notifications) {
    // Create notifications settings
    return prisma.notificationSettings.create({
      data: {
        telegramId: account.id,
        ...data
      }
    })
  }
  
  // Update existing
  return prisma.notificationSettings.update({
    where: { id: account.notifications.id },
    data
  })
}
