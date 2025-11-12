#!/usr/bin/env node

/**
 * Telegram Bot Starter
 * 
 * This script starts the Telegram bot for the Maintain App.
 * It should be run alongside the Next.js development server.
 * 
 * Usage:
 *   npm run bot
 *   or
 *   npm run dev:all (to run both Next.js and bot)
 */

import bot from "./index";

async function start() {
  console.log("🤖 Starting Maintain Telegram Bot...");
  console.log("📱 Bot will start receiving messages");
  console.log("⚙️  API URL:", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3002");
  console.log("💾 Data directory:", process.env.DATA_DIR || ".data");
  console.log("");
  console.log("Available commands:");
  console.log("  /start - Start the bot");
  console.log("  /help - Show help message");
  console.log("  /mood <mood> - Set your mood");
  console.log("  /profile - Setup your profile");
  console.log("  /recommend <query> - Get recommendations");
  console.log("  /history - View recommendation history");
  console.log("  /saves - View saved content");
  console.log("  /trending - Get trending videos");
  console.log("  /reset - Reset profile");
  console.log("");
  console.log("Just send any message to get video recommendations!");
  console.log("");

  try {
    // Start bot in long polling mode
    await bot.launch();
    console.log("✅ Bot is running!");
    console.log("Press Ctrl+C to stop");
  } catch (error) {
    console.error("❌ Failed to start bot:", error);
    process.exit(1);
  }
}

start();
