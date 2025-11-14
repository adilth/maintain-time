#!/usr/bin/env node

/**
 * Script to manually set bot commands for autocomplete
 * Run this if the commands don't appear in Telegram
 * 
 * Usage: tsx --env-file=.env src/bot/set-commands.ts
 */

import { Telegraf } from "telegraf";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!BOT_TOKEN) {
  console.error("❌ TELEGRAM_BOT_TOKEN not found in environment");
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);

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

async function setCommands() {
  try {
    console.log("🔧 Setting bot commands...");
    console.log("📝 Commands to set:", commands.length);
    
    // Delete existing commands first
    console.log("🗑️  Clearing old commands...");
    await bot.telegram.deleteMyCommands();
    
    // Set new commands
    console.log("➕ Setting new commands...");
    const result = await bot.telegram.setMyCommands(commands);
    console.log("✅ Commands set successfully:", result);
    
    // Verify
    console.log("🔍 Verifying commands...");
    const setCommands = await bot.telegram.getMyCommands();
    console.log(`✅ Found ${setCommands.length} commands:`);
    
    setCommands.forEach((cmd, i) => {
      console.log(`   ${i + 1}. /${cmd.command} - ${cmd.description}`);
    });
    
    console.log("");
    console.log("✅ Done! Commands should now appear in Telegram when you type '/'");
    console.log("💡 If they don't appear immediately:");
    console.log("   1. Close and reopen the chat with your bot");
    console.log("   2. Try typing '/' again");
    console.log("   3. Wait a few seconds for Telegram to update");
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error setting commands:", error);
    process.exit(1);
  }
}

setCommands();
