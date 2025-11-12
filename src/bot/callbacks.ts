import { Context } from "telegraf";
import { Update, CallbackQuery } from "telegraf/types";
import { Mood, Suggestion, SaveList } from "@/types";
import {
  getUserState,
  setUserMood,
  addToSaves,
  toggleLike,
  setFeedback,
  updateNotificationSettings,
  isLiked,
} from "./profiles";
import {
  getSaveListKeyboard,
  getVideoActionButtons,
  getNotificationsKeyboard,
} from "./keyboards";

type BotContext = Context<Update>;

// Store temporary data for multi-step interactions
const tempData = new Map<string, Suggestion>();

export async function handleCallbackQuery(ctx: BotContext) {
  if (!ctx.callbackQuery || !("data" in ctx.callbackQuery)) return;

  const query = ctx.callbackQuery as CallbackQuery.DataQuery;
  const data = query.data;
  const userId = ctx.from?.id.toString();

  if (!userId) return;

  try {
    await ctx.answerCbQuery();

    // Mood selection
    if (data.startsWith("mood_")) {
      const mood = data.replace("mood_", "") as Mood;
      await setUserMood(userId, mood);
      await ctx.editMessageText(
        `✅ Mood set to: *${mood}*\n\nNow send me what you'd like to watch!`,
        { parse_mode: "Markdown" }
      );
      return;
    }

    // Like button
    if (data.startsWith("like_")) {
      const videoId = data.replace("like_", "");
      const liked = await toggleLike(userId, videoId);

      await ctx.answerCbQuery(liked ? "❤️ Liked!" : "Removed like");

      // Update the button
      const suggestion = tempData.get(videoId);
      if (suggestion && ctx.callbackQuery.message) {
        try {
          await ctx.editMessageReplyMarkup(
            getVideoActionButtons(videoId, suggestion.url, liked)
          );
        } catch (err) {
          // Message might be too old to edit
          console.log("Could not update button:", err);
        }
      }
      return;
    }

    // Save button - show list selection
    if (data.startsWith("save_")) {
      const videoId = data.replace("save_", "");

      if (ctx.callbackQuery.message && "text" in ctx.callbackQuery.message) {
        await ctx.editMessageReplyMarkup(getSaveListKeyboard(videoId));
      }
      return;
    }

    // Save to specific list
    if (data.startsWith("saveto_")) {
      const parts = data.replace("saveto_", "").split("_");
      const videoId = parts[0];
      const list = parts[1] as SaveList;

      const suggestion = tempData.get(videoId);
      if (suggestion) {
        await addToSaves(userId, suggestion, list);
        await ctx.answerCbQuery(`💾 Saved to ${list}!`);

        // Restore original buttons
        const liked = await isLiked(userId, videoId);
        if (ctx.callbackQuery.message) {
          try {
            await ctx.editMessageReplyMarkup(
              getVideoActionButtons(videoId, suggestion.url, liked)
            );
          } catch (err) {
            console.log("Could not restore buttons:", err);
          }
        }
      }
      return;
    }

    // Back button - restore original buttons
    if (data.startsWith("back_")) {
      const videoId = data.replace("back_", "");
      const suggestion = tempData.get(videoId);
      const liked = await isLiked(userId, videoId);

      if (suggestion && ctx.callbackQuery.message) {
        try {
          await ctx.editMessageReplyMarkup(
            getVideoActionButtons(videoId, suggestion.url, liked)
          );
        } catch (err) {
          console.log("Could not restore buttons:", err);
        }
      }
      return;
    }

    // Feedback buttons
    if (data.startsWith("feedback_")) {
      const parts = data.replace("feedback_", "").split("_");
      const sessionId = parts[0];
      const feedback = parts[1] as "helpful" | "not-helpful";

      await setFeedback(userId, sessionId, feedback);
      await ctx.answerCbQuery(
        feedback === "helpful" ? "👍 Thanks for the feedback!" : "👎 We'll try to improve"
      );

      // Remove feedback buttons
      if (ctx.callbackQuery.message) {
        try {
          await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
        } catch (err) {
          console.log("Could not remove buttons:", err);
        }
      }
      return;
    }

    // Notification toggles
    if (data.startsWith("notify_")) {
      const action = data.replace("notify_", "");
      const userState = await getUserState(userId);

      if (action === "done") {
        await ctx.editMessageText(
          "✅ Notification settings saved!",
          { parse_mode: "Markdown" }
        );
        return;
      }

      const updates: Record<string, Partial<{ dailyDigest: boolean; trendingAlerts: boolean; reminders: boolean }>> = {
        daily: { dailyDigest: !userState.notifications.dailyDigest },
        trending: { trendingAlerts: !userState.notifications.trendingAlerts },
        reminders: { reminders: !userState.notifications.reminders },
      };

      if (updates[action]) {
        await updateNotificationSettings(userId, updates[action]);
        const newState = await getUserState(userId);

        // Update keyboard
        if (ctx.callbackQuery.message) {
          try {
            await ctx.editMessageReplyMarkup(
              getNotificationsKeyboard(
                newState.notifications.dailyDigest,
                newState.notifications.trendingAlerts,
                newState.notifications.reminders
              )
            );
          } catch (err) {
            console.log("Could not update keyboard:", err);
          }
        }
      }
      return;
    }

    // More like this
    if (data.startsWith("morelike_")) {
      const videoId = data.replace("morelike_", "");
      const suggestion = tempData.get(videoId);

      if (suggestion) {
        await ctx.answerCbQuery("🔍 Finding similar videos...");
        // Trigger a new recommendation based on this video
        await ctx.reply(
          `Looking for videos similar to "${suggestion.title}"...\n\nType your preferences or just wait for suggestions!`
        );
      }
      return;
    }

    // Different recommendations
    if (data.startsWith("different_")) {
      await ctx.answerCbQuery("🎲 Getting different suggestions...");
      await ctx.reply("Let's try something different! What are you in the mood for?");
      return;
    }

    // No-op (for display-only buttons like page numbers)
    if (data === "noop") {
      await ctx.answerCbQuery();
      return;
    }

    // Unknown callback
    await ctx.answerCbQuery("Action not implemented yet");
  } catch (error) {
    console.error("Callback query error:", error);
    await ctx.answerCbQuery("❌ An error occurred");
  }
}

// Export function to store suggestion data temporarily
export function storeSuggestionData(videoId: string, suggestion: Suggestion) {
  tempData.set(videoId, suggestion);

  // Clean up after 1 hour
  setTimeout(() => {
    tempData.delete(videoId);
  }, 60 * 60 * 1000);
}

// Export function to get stored suggestion
export function getSuggestionData(videoId: string): Suggestion | undefined {
  return tempData.get(videoId);
}
