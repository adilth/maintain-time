/**
 * Migration script to move data from JSON files to PostgreSQL database
 * 
 * Run with: npx tsx scripts/migrate-to-db.ts
 */

import { prisma } from '../src/lib/prisma'
import fs from 'fs/promises'
import path from 'path'

const DATA_DIR = process.env.DATA_DIR || '.data'
const STORE_FILE = path.join(DATA_DIR, 'store.json')
const BOT_PROFILES_FILE = path.join(DATA_DIR, 'bot-profiles.json')

async function migrateWebAppData() {
  console.log('📦 Migrating web app data from store.json...')
  
  try {
    const storeData = JSON.parse(await fs.readFile(STORE_FILE, 'utf-8'))
    
    // Create a default web user if none exists
    let user = await prisma.user.findFirst({
      where: { email: { not: null } }
    })
    
    if (!user) {
      console.log('Creating default web user...')
      user = await prisma.user.create({
        data: {
          email: 'user@example.com', // Change this!
          name: storeData.profile?.name || 'Web User',
          profile: {
            create: {
              hobbies: storeData.profile?.hobbies || [],
              interests: storeData.profile?.interests || [],
              languages: storeData.profile?.languages || [],
              workContext: storeData.profile?.workContext,
              youtubers: storeData.profile?.youtubers || [],
            }
          },
          stats: {
            create: {
              totalQueries: storeData.history?.length || 0,
              totalLikes: storeData.likes?.length || 0,
              totalSaves: storeData.saves?.length || 0,
            }
          }
        }
      })
      console.log('✅ Created user:', user.id)
    }
    
    // Migrate history
    if (storeData.history && Array.isArray(storeData.history)) {
      console.log(`Migrating ${storeData.history.length} history sessions...`)
      for (const session of storeData.history) {
        await prisma.historySession.create({
          data: {
            userId: user.id,
            message: session.message,
            mood: session.mood,
            suggestions: session.suggestions,
            timestamp: new Date(session.timestamp),
          }
        })
      }
      console.log('✅ History migrated')
    }
    
    // Migrate saves
    if (storeData.saves && Array.isArray(storeData.saves)) {
      console.log(`Migrating ${storeData.saves.length} saved items...`)
      for (const save of storeData.saves) {
        await prisma.savedItem.create({
          data: {
            userId: user.id,
            videoId: save.id,
            suggestion: save.suggestion,
            list: save.list,
            addedAt: new Date(save.addedAt),
          }
        })
      }
      console.log('✅ Saves migrated')
    }
    
    // Migrate likes
    if (storeData.likes && Array.isArray(storeData.likes)) {
      console.log(`Migrating ${storeData.likes.length} likes...`)
      for (const videoId of storeData.likes) {
        const suggestion = storeData.likedSuggestions?.[videoId]
        await prisma.like.create({
          data: {
            userId: user.id,
            videoId,
            suggestion: suggestion || null,
          }
        })
      }
      console.log('✅ Likes migrated')
    }
    
    console.log('✅ Web app data migration complete!')
    
  } catch (error) {
    console.error('❌ Error migrating web app data:', error)
  }
}

async function migrateBotData() {
  console.log('\n📱 Migrating Telegram bot data from bot-profiles.json...')
  
  try {
    const botData = JSON.parse(await fs.readFile(BOT_PROFILES_FILE, 'utf-8'))
    
    if (!botData.users) {
      console.log('No bot users to migrate')
      return
    }
    
    const userIds = Object.keys(botData.users)
    console.log(`Found ${userIds.length} bot users`)
    
    for (const telegramId of userIds) {
      const botUser = botData.users[telegramId]
      
      console.log(`\nMigrating bot user: ${botUser.username || botUser.firstName || telegramId}`)
      
      // Check if user already exists
      let user = await prisma.user.findUnique({
        where: { telegramId }
      })
      
      if (!user) {
        // Create new user
        user = await prisma.user.create({
          data: {
            telegramId,
            telegramUsername: botUser.username,
            name: botUser.firstName,
            profile: {
              create: {
                hobbies: botUser.profile?.hobbies || [],
                interests: botUser.profile?.interests || [],
                languages: botUser.profile?.languages || [],
                workContext: botUser.profile?.workContext,
                youtubers: botUser.profile?.youtubers || [],
              }
            },
            stats: {
              create: {
                totalQueries: botUser.stats?.totalQueries || 0,
                totalLikes: botUser.stats?.totalLikes || 0,
                totalSaves: botUser.stats?.totalSaves || 0,
                streak: botUser.stats?.streak || 0,
                favoriteCategories: botUser.stats?.favoriteCategories || {},
                lastActiveDate: new Date(botUser.stats?.lastActive || botUser.lastActive),
                joinedAt: new Date(botUser.stats?.joinedAt || botUser.lastActive),
              }
            },
            telegramAccount: {
              create: {
                telegramId,
                username: botUser.username,
                firstName: botUser.firstName,
                currentMood: botUser.currentMood,
                lastActive: new Date(botUser.lastActive),
                notifications: {
                  create: {
                    dailyDigest: botUser.notifications?.dailyDigest || false,
                    dailyDigestTime: botUser.notifications?.dailyTime,
                    trendingAlerts: botUser.notifications?.trendingAlerts || false,
                    reminders: botUser.notifications?.reminders || false,
                  }
                }
              }
            }
          }
        })
        console.log('✅ Created user:', user.id)
      }
      
      // Migrate bot user's history
      if (botUser.history && Array.isArray(botUser.history)) {
        console.log(`  - Migrating ${botUser.history.length} history sessions`)
        for (const session of botUser.history) {
          await prisma.historySession.create({
            data: {
              userId: user.id,
              message: session.message,
              mood: session.mood,
              suggestions: session.suggestions,
              timestamp: new Date(session.timestamp),
              feedback: session.feedback,
            }
          })
        }
      }
      
      // Migrate bot user's saves
      if (botUser.saves && Array.isArray(botUser.saves)) {
        console.log(`  - Migrating ${botUser.saves.length} saves`)
        for (const save of botUser.saves) {
          await prisma.savedItem.create({
            data: {
              userId: user.id,
              videoId: save.id,
              suggestion: save.suggestion,
              list: save.list,
              addedAt: new Date(save.addedAt),
            }
          })
        }
      }
      
      // Migrate bot user's likes
      if (botUser.likes && Array.isArray(botUser.likes)) {
        console.log(`  - Migrating ${botUser.likes.length} likes`)
        for (const videoId of botUser.likes) {
          await prisma.like.create({
            data: {
              userId: user.id,
              videoId,
            }
          })
        }
      }
      
      console.log(`✅ Migrated bot user: ${botUser.username || botUser.firstName}`)
    }
    
    console.log('\n✅ Bot data migration complete!')
    
  } catch (error) {
    console.error('❌ Error migrating bot data:', error)
  }
}

async function main() {
  console.log('🚀 Starting database migration...\n')
  
  try {
    await migrateWebAppData()
    await migrateBotData()
    
    console.log('\n🎉 Migration complete!')
    console.log('\n💡 Next steps:')
    console.log('1. Backup your .data folder')
    console.log('2. Test the app and bot with the new database')
    console.log('3. Update the code to use database functions instead of JSON')
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
