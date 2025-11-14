import { Telegraf } from "telegraf";
import { BOT_CONFIG, VALID_MOODS } from "./config";
import {
  handleStart,
  handleHelp,
  handleMood,
  handleProfile,
  handleReset,
  handleRecommend,
  handleSkip,
  handleTextMessage,
  handleMoodCommand,
  handleHistory,
  handleSaves,
  handleTrending,
} from "./handlers";
import {
  handleStats,
  handleMySaves,
  handleMyHistory,
  handleNotifications,
} from "./commands";
import { handleCallbackQuery } from "./callbacks";

// Validate bot token
if (!BOT_CONFIG.token) {
  throw new Error("TELEGRAM_BOT_TOKEN is not set in environment variables");
}

// Create bot instance
export const bot = new Telegraf(BOT_CONFIG.token);

// Register commands
bot.command("start", handleStart);
bot.command("help", handleHelp);
bot.command("mood", handleMood);
bot.command("profile", handleProfile);
bot.command("reset", handleReset);
bot.command("recommend", handleRecommend);
bot.command("skip", handleSkip);
bot.command("history", handleHistory);
bot.command("saves", handleSaves);
bot.command("trending", handleTrending);
bot.command("stats", handleStats);
bot.command("mysaves", handleMySaves);
bot.command("myhistory", handleMyHistory);
bot.command("notifications", handleNotifications);

// Register quick mood commands
VALID_MOODS.forEach((mood) => {
  bot.command(mood, (ctx) => handleMoodCommand(ctx, mood));
});

// Handle callback queries (button clicks)
bot.on("callback_query", handleCallbackQuery);

// Handle all text messages (for recommendations)
bot.on("text", (ctx) => handleTextMessage(ctx));

// Error handling
bot.catch((err, ctx) => {
  console.error(`Error for ${ctx.updateType}:`, err);
  ctx.reply("Sorry, an error occurred. Please try again.");
});

// Graceful shutdown
process.once("SIGINT", () => {
  console.log("\n🛑 Stopping Telegram bot...");
  bot.stop("SIGINT");
});

process.once("SIGTERM", () => {
  console.log("\n🛑 Stopping Telegram bot...");
  bot.stop("SIGTERM");
});

export default bot;
