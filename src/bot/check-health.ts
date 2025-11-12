#!/usr/bin/env node

/**
 * Bot Health Check
 * Verifies bot token and connection to Telegram API
 * 
 * Run with: npm run bot:check
 * Or: TELEGRAM_BOT_TOKEN=your_token tsx src/bot/check-health.ts
 */

async function checkBot() {
  console.log("🔍 Checking Telegram Bot Configuration...\n");

  // Check environment variables
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const apiUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3002";
  const dataDir = process.env.DATA_DIR || ".data";

  console.log("📋 Environment Check:");
  console.log(`   TELEGRAM_BOT_TOKEN: ${token ? "✅ Set" : "❌ Missing"}`);
  console.log(`   NEXT_PUBLIC_APP_URL: ${apiUrl}`);
  console.log(`   DATA_DIR: ${dataDir}`);
  console.log(`   GOOGLE_GEMINI_API_KEY: ${process.env.GOOGLE_GEMINI_API_KEY ? "✅ Set" : "⚠️  Missing (will use fallback)"}`);
  console.log("");

  if (!token) {
    console.error("❌ TELEGRAM_BOT_TOKEN is not set!");
    console.error("");
    console.error("   Set it in your shell:");
    console.error("   export TELEGRAM_BOT_TOKEN='8326609482:AAHyZhwjPf87mSkVn2Go-dGNK-hbxBqNhEs'");
    console.error("");
    console.error("   Or run directly:");
    console.error("   TELEGRAM_BOT_TOKEN='8326609482:AAHyZhwjPf87mSkVn2Go-dGNK-hbxBqNhEs' npm run bot:check");
    console.error("");
    process.exit(1);
  }

  // Check bot token validity
  console.log("🔌 Testing Telegram API Connection...");
  try {
    const response = await fetch(
      `https://api.telegram.org/bot${token}/getMe`
    );
    const data = await response.json();

    if (data.ok) {
      console.log("✅ Bot Connected Successfully!");
      console.log(`   Bot Username: @${data.result.username}`);
      console.log(`   Bot Name: ${data.result.first_name}`);
      console.log(`   Bot ID: ${data.result.id}`);
      console.log("");
      console.log("🎉 Your bot is ready! Start it with:");
      console.log("   npm run bot");
      console.log("   or");
      console.log("   npm run dev:all");
    } else {
      console.error("❌ Invalid Bot Token!");
      console.error(`   Error: ${data.description}`);
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Failed to connect to Telegram API");
    console.error(`   Error: ${error}`);
    console.error("   Check your internet connection");
    process.exit(1);
  }

  // Check if Next.js API is accessible
  console.log("");
  console.log("🌐 Checking Next.js API...");
  try {
    const response = await fetch(`${apiUrl}/api/recommend`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "test", count: 1 }),
    });

    if (response.ok) {
      console.log("✅ Next.js API is accessible");
    } else {
      console.log("⚠️  Next.js API returned status:", response.status);
      console.log("   Make sure Next.js is running on", apiUrl);
    }
  } catch {
    console.log("⚠️  Cannot reach Next.js API");
    console.log("   Make sure to start Next.js first:");
    console.log("   npm run dev");
  }

  console.log("");
  console.log("✅ Health check complete!");
}

checkBot();
