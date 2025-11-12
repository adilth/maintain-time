import { Context } from "telegraf";
import { Update } from "telegraf/types";
import {
  getUserState,
  getUserHistory,
  getUserSaves,
} from "./profiles";
import {
  getNotificationsKeyboard,
} from "./keyboards";
import { escapeMarkdown, getMoodEmoji, getTimeAgo } from "./utils";

type BotContext = Context<Update>;

// /stats command - Show user analytics
export async function handleStats(ctx: BotContext) {
  const userId = ctx.from?.id.toString();
  if (!userId) return;

  try {
    const userState = await getUserState(userId);
    const stats = userState.stats;

    const joinedDate = new Date(stats.joinedAt).toLocaleDateString();
    const daysSinceJoin = Math.floor(
      (Date.now() - new Date(stats.joinedAt).getTime()) / (1000 * 60 * 60 * 24)
    );

    const topCategories = Object.entries(stats.favoriteCategories)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([cat, count]) => `  • ${cat}: ${count}`)
      .join("\n");

    const streakEmoji = stats.streak > 7 ? "🔥" : stats.streak > 3 ? "⚡" : "📅";

    const message = `📊 *Your Statistics*

👤 *Activity:*
  • Joined: ${escapeMarkdown(joinedDate)} (${daysSinceJoin} days ago)
  • ${streakEmoji} Streak: ${stats.streak} days
  • 📝 Total queries: ${stats.totalQueries}
  • ❤️ Total likes: ${stats.totalLikes}
  • 💾 Total saves: ${stats.totalSaves}

${topCategories ? `🏷️ *Top Categories:*\n${escapeMarkdown(topCategories)}` : ""}

Keep exploring! 🚀`;

    await ctx.replyWithMarkdownV2(message, { parse_mode: "MarkdownV2" });
  } catch (error) {
    console.error("Stats error:", error);
    await ctx.reply("❌ Error loading stats");
  }
}

// /mysaves command - Show user's personal saves from bot
export async function handleMySaves(ctx: BotContext) {
  const userId = ctx.from?.id.toString();
  if (!userId) return;

  try {
    const saves = await getUserSaves(userId);

    if (saves.length === 0) {
      await ctx.reply(
        "💾 You haven't saved any videos yet.\n\nUse the 💾 Save button when I recommend videos!"
      );
      return;
    }

    let message = `💾 *Your Saved Videos* (${saves.length})\n\n`;

    const recentSaves = saves.slice(0, 10);
    recentSaves.forEach((save, i) => {
      message += `${i + 1}\\. *${escapeMarkdown(save.suggestion.title)}*\n`;
      message += `   👤 ${escapeMarkdown(save.suggestion.creatorName)}\n`;
      message += `   📂 ${save.list}`;
      if (save.suggestion.durationMinutes) {
        message += ` • ⏱️ ${save.suggestion.durationMinutes}min`;
      }
      message += `\n`;
      if (save.suggestion.url) {
        message += `   🔗 [Watch](${save.suggestion.url})\n`;
      }
      message += `\n`;
    });

    if (saves.length > 10) {
      message += `\\_\\_Showing 10 of ${saves.length} saves\\_\\_`;
    }

    await ctx.replyWithMarkdownV2(message, { parse_mode: "MarkdownV2" });
  } catch (error) {
    console.error("My saves error:", error);
    await ctx.reply("❌ Error loading your saves");
  }
}

// /myhistory command - Show user's personal history from bot
export async function handleMyHistory(ctx: BotContext) {
  const userId = ctx.from?.id.toString();
  if (!userId) return;

  try {
    const history = await getUserHistory(userId, 10);

    if (history.length === 0) {
      await ctx.reply("📜 No history yet.\n\nStart asking for recommendations!");
      return;
    }

    let message = `📜 *Your Recent History* (${history.length})\n\n`;

    history.forEach((session, i) => {
      const date = new Date(session.timestamp);
      const timeAgo = getTimeAgo(date);
      const moodEmoji = getMoodEmoji(session.mood);

      message += `${i + 1}\\. ${moodEmoji} *${escapeMarkdown(session.message)}*\n`;
      message += `   📅 ${escapeMarkdown(timeAgo)} • 📺 ${session.suggestions.length} videos`;
      if (session.feedback) {
        message += session.feedback === "helpful" ? " • 👍" : " • 👎";
      }
      message += `\n\n`;
    });

    await ctx.replyWithMarkdownV2(message, { parse_mode: "MarkdownV2" });
  } catch (error) {
    console.error("My history error:", error);
    await ctx.reply("❌ Error loading your history");
  }
}

// /notifications command - Manage notifications
export async function handleNotifications(ctx: BotContext) {
  const userId = ctx.from?.id.toString();
  if (!userId) return;

  try {
    const userState = await getUserState(userId);

    await ctx.reply(
      "🔔 *Notification Settings*\n\nToggle your preferences:",
      {
        parse_mode: "Markdown",
        reply_markup: getNotificationsKeyboard(
          userState.notifications.dailyDigest,
          userState.notifications.trendingAlerts,
          userState.notifications.reminders
        ),
      }
    );
  } catch (error) {
    console.error("Notifications error:", error);
    await ctx.reply("❌ Error loading notification settings");
  }
}
