import { Mood } from "@/types";

export const BOT_CONFIG = {
  token: process.env.TELEGRAM_BOT_TOKEN!,
  apiUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3002",
  defaultCount: 5, // Default number of recommendations
  maxCount: 10, // Max recommendations per request
};

export const VALID_MOODS: Mood[] = [
  "tired",
  "curious",
  "motivated",
  "relaxed",
  "bored",
  "chill",
];

export const BOT_COMMANDS = {
  start: "Start the bot and see instructions",
  help: "Show available commands",
  mood: "Set your mood (e.g., /mood curious)",
  profile: "Manage your profile preferences",
  recommend: "Get recommendations (e.g., /recommend 20min coding)",
  history: "View your recent recommendations",
  saves: "View your saved content",
  trending: "Get trending content",
  stats: "View your usage statistics",
  mysaves: "View your personal saved videos",
  myhistory: "View your personal history",
  notifications: "Manage notification settings",
  reset: "Reset your profile and preferences",
};

export const MESSAGES = {
  welcome: `👋 Welcome to Maintain Bot!

I can help you find YouTube videos based on your preferences and mood.

🎯 *Quick Start:*
Just send me a message like:
• "40-minute coding tutorial"
• "relaxing music for studying"
• "quick tech news"

📋 *Commands:*
/mood - Set your current mood
/profile - Set your interests & preferences
/history - View past recommendations
/saves - View saved content
/trending - Get trending videos
/help - Show all commands

Let's start! What would you like to watch? 🎥`,

  help: `🤖 *Maintain Bot Commands*

*Getting Recommendations:*
Just send any message describing what you want!
Examples:
• "30 min coding tutorial"
• "funny tech videos"
• "learn JavaScript basics"

*Available Commands:*
/mood <mood> - Set your mood
  Moods: tired, curious, motivated, relaxed, bored, chill
  
/profile - Setup your preferences
  • Hobbies
  • Interests
  • Languages
  • Favorite YouTubers

/recommend <query> - Get recommendations
/history - View your recommendation history
/saves - View your saved videos
/trending - Get trending content
/stats - View your usage statistics
/mysaves - View your personal saved videos
/myhistory - View your personal history
/notifications - Manage daily digest settings
/reset - Reset your profile
/help - Show this message

💡 *New Features:*
• 👍 Like/Save buttons on every video
• 📊 Track your viewing stats
• 🔔 Daily digest notifications
• 📷 Video thumbnails
• ⚡ Quick actions with buttons`,

  moodSet: (mood: Mood) => `✅ Mood set to: *${mood}*\n\nNow send me what you'd like to watch!`,
  
  invalidMood: `❌ Invalid mood. Choose from:\n${VALID_MOODS.map(m => `• ${m}`).join('\n')}`,
  
  processing: "🤖 Finding recommendations for you...",
  
  noResults: "😕 No recommendations found. Try a different query!",
  
  error: "❌ Oops! Something went wrong. Please try again later.",
  
  profileStart: `📝 *Setup Your Profile*

Let me know your preferences to get better recommendations!

Reply with your details in this format:

*Hobbies:* programming, gaming
*Interests:* web development, AI
*Languages:* English, Arabic
*YouTubers:* Fireship, ThePrimeagen

Or send /skip to continue without setting profile.`,

  profileSaved: "✅ Profile saved successfully!",
  
  profileReset: "🔄 Profile and preferences have been reset.",
};
