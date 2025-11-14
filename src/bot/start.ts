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
    // Define bot commands before launch
    const commands = [
      { command: "start", description: "Start the bot" },
      { command: "help", description: "Show all commands" },
      { command: "recommend", description: "Get video recommendations" },
      { command: "mood", description: "Set your mood" },
      { command: "profile", description: "Manage your profile" },
      { command: "history", description: "View recommendation history" },
      { command: "saves", description: "View saved content" },
      { command: "trending", description: "Get trending videos" },
      { command: "stats", description: "View your statistics" },
      { command: "mysaves", description: "View personal saved videos" },
      { command: "myhistory", description: "View personal history" },
      { command: "notifications", description: "Manage notifications" },
      { command: "skip", description: "Skip current action" },
      { command: "reset", description: "Reset your profile" },
    ];
    
    // Start bot in long polling mode
    await bot.launch();
    console.log("✅ Bot is running!");
    
    // Set bot commands for autocomplete menu after launch
    // Note: Descriptions must be 1-256 characters
    try {
      console.log("🔧 Registering bot commands...");
      
      // Delete old commands first to ensure clean state
      try {
        await bot.telegram.deleteMyCommands();
        console.log("🗑️  Cleared old commands");
      } catch {
        // Ignore if no commands exist
      }
      
      const result = await bot.telegram.setMyCommands(commands);
      console.log("✅ Bot commands registered successfully:", result);
      
      // Verify commands were set
      const setCommands = await bot.telegram.getMyCommands();
      console.log("📋 Current bot commands:", setCommands.length, "commands");
      setCommands.forEach((cmd, i) => {
        console.log(`   ${i + 1}. /${cmd.command} - ${cmd.description}`);
      });
      
    } catch (cmdError) {
      console.error("⚠️  Warning: Could not set bot commands:");
      console.error(cmdError);
    }
    
    console.log("Press Ctrl+C to stop");
  } catch (error) {
    console.error("❌ Failed to start bot:", error);
    process.exit(1);
  }
}

start();
