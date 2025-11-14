import { prisma } from './prisma'
import bcrypt from 'bcryptjs'

export type AuthUser = {
  id: string
  email: string | null
  name: string | null
  telegramId: string | null
}

// ============================================
// WEB APP AUTHENTICATION
// ============================================

export async function createUser(email: string, password: string, name?: string) {
  // Check if user exists
  const existing = await prisma.user.findUnique({
    where: { email }
  })
  
  if (existing) {
    throw new Error('User already exists')
  }
  
  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10)
  
  // Create user with profile and stats
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      profile: {
        create: {
          hobbies: [],
          interests: [],
          languages: [],
        }
      },
      stats: {
        create: {
          totalQueries: 0,
          totalLikes: 0,
          totalSaves: 0,
          totalVideosWatched: 0,
        }
      }
    },
    include: {
      profile: true,
      stats: true,
    }
  })
  
  return user
}

export async function verifyUser(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      profile: true,
      stats: true,
    }
  })
  
  if (!user || !user.password) {
    return null
  }
  
  const isValid = await bcrypt.compare(password, user.password)
  
  if (!isValid) {
    return null
  }
  
  return user
}

export async function getUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
    include: {
      profile: true,
      stats: true,
      telegramAccount: true,
    }
  })
}

export async function getUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    include: {
      profile: true,
      stats: true,
      telegramAccount: true,
    }
  })
}

// ============================================
// TELEGRAM BOT AUTHENTICATION
// ============================================

export async function findOrCreateTelegramUser(telegramData: {
  telegramId: string
  username?: string
  firstName?: string
  lastName?: string
  languageCode?: string
}) {
  // Try to find existing user by Telegram ID
  let user = await prisma.user.findUnique({
    where: { telegramId: telegramData.telegramId },
    include: {
      profile: true,
      stats: true,
      telegramAccount: true,
    }
  })
  
  if (user) {
    // Update last active
    await prisma.telegramAccount.update({
      where: { telegramId: telegramData.telegramId },
      data: { lastActive: new Date() }
    })
    
    return user
  }
  
  // Create new user for Telegram
  user = await prisma.user.create({
    data: {
      telegramId: telegramData.telegramId,
      telegramUsername: telegramData.username,
      name: telegramData.firstName,
      profile: {
        create: {
          hobbies: [],
          interests: [],
          languages: [],
        }
      },
      stats: {
        create: {
          totalQueries: 0,
          totalLikes: 0,
          totalSaves: 0,
          totalVideosWatched: 0,
        }
      },
      telegramAccount: {
        create: {
          telegramId: telegramData.telegramId,
          username: telegramData.username,
          firstName: telegramData.firstName,
          lastName: telegramData.lastName,
          languageCode: telegramData.languageCode,
          notifications: {
            create: {
              dailyDigest: false,
              trendingAlerts: false,
              reminders: false,
            }
          }
        }
      }
    },
    include: {
      profile: true,
      stats: true,
      telegramAccount: {
        include: {
          notifications: true
        }
      },
    }
  })
  
  return user
}

export async function getUserByTelegramId(telegramId: string) {
  return prisma.user.findUnique({
    where: { telegramId },
    include: {
      profile: true,
      stats: true,
      telegramAccount: {
        include: {
          notifications: true
        }
      },
    }
  })
}

// ============================================
// LINKING ACCOUNTS
// ============================================

export async function linkTelegramToWebUser(userId: string, telegramData: {
  telegramId: string
  username?: string
  firstName?: string
  lastName?: string
}) {
  // Check if Telegram ID is already linked
  const existing = await prisma.user.findUnique({
    where: { telegramId: telegramData.telegramId }
  })
  
  if (existing && existing.id !== userId) {
    throw new Error('Telegram account already linked to another user')
  }
  
  // Update user and create Telegram account
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      telegramId: telegramData.telegramId,
      telegramUsername: telegramData.username,
      telegramAccount: {
        upsert: {
          create: {
            telegramId: telegramData.telegramId,
            username: telegramData.username,
            firstName: telegramData.firstName,
            lastName: telegramData.lastName,
            notifications: {
              create: {
                dailyDigest: false,
                trendingAlerts: false,
                reminders: false,
              }
            }
          },
          update: {
            username: telegramData.username,
            firstName: telegramData.firstName,
            lastName: telegramData.lastName,
            lastActive: new Date(),
          }
        }
      }
    },
    include: {
      profile: true,
      stats: true,
      telegramAccount: {
        include: {
          notifications: true
        }
      },
    }
  })
  
  return user
}
