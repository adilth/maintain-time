import { InlineKeyboardMarkup, InlineKeyboardButton } from "telegraf/types";
import { Mood, SaveList } from "@/types";
import { VALID_MOODS } from "./config";

// Mood selection keyboard
export function getMoodKeyboard(): InlineKeyboardMarkup {
  const moodButtons: InlineKeyboardButton[][] = [];
  const moodEmojis: Record<Mood, string> = {
    tired: "😴",
    curious: "🧐",
    motivated: "⚡",
    relaxed: "🧘",
    bored: "🤥",
    chill: "😌",
  };

  // Create 2 rows of 3 buttons each
  for (let i = 0; i < VALID_MOODS.length; i += 3) {
    const row: InlineKeyboardButton[] = VALID_MOODS.slice(i, i + 3).map((mood) => ({
      text: `${moodEmojis[mood]} ${mood.charAt(0).toUpperCase() + mood.slice(1)}`,
      callback_data: `mood_${mood}`,
    }));
    moodButtons.push(row);
  }

  return { inline_keyboard: moodButtons };
}

// Video action buttons (like, save, watch)
export function getVideoActionButtons(videoId: string, videoUrl?: string, isLiked = false): InlineKeyboardMarkup {
  const buttons: InlineKeyboardButton[][] = [];

  const row1: InlineKeyboardButton[] = [
    { text: isLiked ? "❤️ Liked" : "🤍 Like", callback_data: `like_${videoId}` },
    { text: "💾 Save", callback_data: `save_${videoId}` },
  ];

  if (videoUrl) {
    row1.push({ text: "▶️ Watch", url: videoUrl });
  }

  buttons.push(row1);

  return { inline_keyboard: buttons };
}

// Save list selection keyboard
export function getSaveListKeyboard(videoId: string): InlineKeyboardMarkup {
  const lists: SaveList[] = ["listen", "learn", "knowledge", "tomorrow", "other"];
  const listEmojis: Record<SaveList, string> = {
    listen: "🎧",
    learn: "📚",
    knowledge: "🧠",
    tomorrow: "📅",
    other: "📁",
  };

  const buttons = lists.map((list) => [
    {
      text: `${listEmojis[list]} ${list.charAt(0).toUpperCase() + list.slice(1)}`,
      callback_data: `saveto_${videoId}_${list}`,
    },
  ]);

  buttons.push([{ text: "« Back", callback_data: `back_${videoId}` }]);

  return { inline_keyboard: buttons };
}

// Feedback buttons (helpful/not helpful)
export function getFeedbackKeyboard(sessionId: string): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [
        { text: "👍 Helpful", callback_data: `feedback_${sessionId}_helpful` },
        { text: "👎 Not Helpful", callback_data: `feedback_${sessionId}_not-helpful` },
      ],
    ],
  };
}

// More actions keyboard
export function getMoreActionsKeyboard(videoId: string): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [
        { text: "🔄 More Like This", callback_data: `morelike_${videoId}` },
        { text: "🎲 Different", callback_data: `different_${videoId}` },
      ],
      [{ text: "« Back", callback_data: `back_${videoId}` }],
    ],
  };
}

// Filter keyboard
export function getFilterKeyboard(): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [
        { text: "⏱️ Duration", callback_data: "filter_duration" },
        { text: "🏷️ Category", callback_data: "filter_category" },
      ],
      [
        { text: "📅 Date", callback_data: "filter_date" },
        { text: "🔄 Clear Filters", callback_data: "filter_clear" },
      ],
    ],
  };
}

// Duration filter keyboard
export function getDurationFilterKeyboard(): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [
        { text: "< 5 min", callback_data: "duration_0-5" },
        { text: "5-15 min", callback_data: "duration_5-15" },
      ],
      [
        { text: "15-30 min", callback_data: "duration_15-30" },
        { text: "> 30 min", callback_data: "duration_30+" },
      ],
      [{ text: "« Back", callback_data: "filter_back" }],
    ],
  };
}

// Notifications settings keyboard
export function getNotificationsKeyboard(
  dailyEnabled: boolean,
  trendingEnabled: boolean,
  remindersEnabled: boolean
): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [
        {
          text: dailyEnabled ? "✅ Daily Digest" : "⬜ Daily Digest",
          callback_data: "notify_daily",
        },
      ],
      [
        {
          text: trendingEnabled ? "✅ Trending Alerts" : "⬜ Trending Alerts",
          callback_data: "notify_trending",
        },
      ],
      [
        {
          text: remindersEnabled ? "✅ Reminders" : "⬜ Reminders",
          callback_data: "notify_reminders",
        },
      ],
      [{ text: "✓ Done", callback_data: "notify_done" }],
    ],
  };
}

// Retry button for errors
export function getRetryKeyboard(action: string): InlineKeyboardMarkup {
  return {
    inline_keyboard: [[{ text: "🔄 Try Again", callback_data: `retry_${action}` }]],
  };
}

// Confirmation keyboard
export function getConfirmationKeyboard(action: string, data: string): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [
        { text: "✅ Yes", callback_data: `confirm_${action}_${data}` },
        { text: "❌ No", callback_data: `cancel_${action}` },
      ],
    ],
  };
}

// Navigation buttons for paginated results
export function getPaginationKeyboard(page: number, totalPages: number, prefix: string): InlineKeyboardMarkup {
  const buttons: InlineKeyboardButton[][] = [];

  const navButtons: InlineKeyboardButton[] = [];
  if (page > 1) {
    navButtons.push({ text: "◀️ Previous", callback_data: `${prefix}_page_${page - 1}` });
  }
  if (page < totalPages) {
    navButtons.push({ text: "Next ▶️", callback_data: `${prefix}_page_${page + 1}` });
  }

  if (navButtons.length > 0) {
    buttons.push(navButtons);
  }

  buttons.push([{ text: `Page ${page}/${totalPages}`, callback_data: "noop" }]);

  return { inline_keyboard: buttons };
}
