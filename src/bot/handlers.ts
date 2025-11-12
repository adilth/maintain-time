import { Context } from "telegraf";
import { Update } from "telegraf/types";
import { RecommendResponse, Suggestion, Mood } from "@/types";
import {
  BOT_CONFIG,
  VALID_MOODS,
  MESSAGES,
} from "./config";
import {
  getUserState,
  setUserMood,
  updateUserProfile,
  resetUserProfile,
  parseProfileFromMessage,
  addToHistory,
} from "./profiles";
import { getVideoActionButtons } from "./keyboards";
import { storeSuggestionData } from "./callbacks";
import { escapeMarkdown, splitMessage } from "./utils";

type BotContext = Context<Update>;

// Helper to call the recommend API
async function getRecommendations(
  message: string,
  userId: string
): Promise<RecommendResponse> {
  const userState = await getUserState(userId);
  
  const response = await fetch(`${BOT_CONFIG.apiUrl}/api/recommend`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      mood: userState.currentMood,
      count: BOT_CONFIG.defaultCount,
      profile: userState.profile,
    }),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return await response.json();
}

// Format suggestions for Telegram message
function formatSuggestions(suggestions: Suggestion[]): string {
  if (suggestions.length === 0) {
    return MESSAGES.noResults;
  }

  let message = `📺 *Found ${suggestions.length} videos:*\n\n`;

  suggestions.forEach((s, i) => {
    message += `${i + 1}\\. *${escapeMarkdown(s.title)}*\n`;
    message += `   👤 ${escapeMarkdown(s.creatorName)}\n`;
    
    if (s.durationMinutes) {
      message += `   ⏱️ ${s.durationMinutes} min\n`;
    }
    
    if (s.description) {
      const shortDesc = s.description.slice(0, 100);
      const suffix = s.description.length > 100 ? '\\.\\.\\.' : '';
      message += `   📝 ${escapeMarkdown(shortDesc)}${suffix}\n`;
    }
    
    if (s.url) {
      message += `   🔗 [Watch Video](${escapeMarkdown(s.url)})\n`;
    }
    
    message += `\n`;
  });

  return message;
}

// Command handlers
export async function handleStart(ctx: BotContext) {
  const userId = ctx.from?.id.toString();
  if (!userId) return;

  await getUserState(userId); // Initialize user
  
  await ctx.replyWithMarkdownV2(
    escapeMarkdown(MESSAGES.welcome),
    {
      parse_mode: "MarkdownV2",
    }
  );
}

export async function handleHelp(ctx: BotContext) {
  await ctx.replyWithMarkdownV2(
    escapeMarkdown(MESSAGES.help),
    {
      parse_mode: "MarkdownV2",
    }
  );
}

export async function handleMood(ctx: BotContext) {
  const userId = ctx.from?.id.toString();
  if (!userId) return;

  const args = ctx.message && 'text' in ctx.message 
    ? ctx.message.text.split(' ').slice(1) 
    : [];
  
  if (args.length === 0) {
    await ctx.reply(
      `Set your mood:\n\n${VALID_MOODS.map(m => `• /${m}`).join('\n')}\n\nOr use: /mood <mood>`
    );
    return;
  }

  const mood = args[0].toLowerCase();
  if (!VALID_MOODS.includes(mood as Mood)) {
    await ctx.reply(MESSAGES.invalidMood);
    return;
  }

  await setUserMood(userId, mood as Mood);
  await ctx.replyWithMarkdownV2(escapeMarkdown(MESSAGES.moodSet(mood as Mood)));
}

export async function handleProfile(ctx: BotContext) {
  const userId = ctx.from?.id.toString();
  if (!userId) return;

  const userState = await getUserState(userId);
  
  if (userState.profile.hobbies.length === 0 && userState.profile.interests.length === 0) {
    // Start profile setup
    const updatedState = await getUserState(userId);
    updatedState.pendingProfileSetup = true;
    await ctx.replyWithMarkdownV2(escapeMarkdown(MESSAGES.profileStart));
  } else {
    // Show current profile
    let profileText = "📝 *Your Profile:*\n\n";
    
    if (userState.profile.hobbies.length > 0) {
      profileText += `*Hobbies:* ${userState.profile.hobbies.join(", ")}\n`;
    }
    if (userState.profile.interests.length > 0) {
      profileText += `*Interests:* ${userState.profile.interests.join(", ")}\n`;
    }
    if (userState.profile.languages.length > 0) {
      profileText += `*Languages:* ${userState.profile.languages.join(", ")}\n`;
    }
    if (userState.profile.youtubers && userState.profile.youtubers.length > 0) {
      profileText += `*YouTubers:* ${userState.profile.youtubers.map(y => y.name).join(", ")}\n`;
    }
    
    profileText += "\nSend new profile details to update, or /reset to clear.";
    
    await ctx.replyWithMarkdownV2(escapeMarkdown(profileText));
  }
}

export async function handleReset(ctx: BotContext) {
  const userId = ctx.from?.id.toString();
  if (!userId) return;

  await resetUserProfile(userId);
  await ctx.reply(MESSAGES.profileReset);
}

export async function handleHistory(ctx: BotContext) {
  const userId = ctx.from?.id.toString();
  if (!userId) return;

  try {
    const response = await fetch(`${BOT_CONFIG.apiUrl}/api/history`);
    
    if (!response.ok) {
      await ctx.reply("❌ Could not load history. Make sure Next.js server is running.");
      return;
    }

    const data = await response.json();
    const sessions = data.sessions || [];

    if (sessions.length === 0) {
      await ctx.reply("📜 No recommendation history yet.\n\nStart by asking for recommendations!");
      return;
    }

    let message = "📜 *Your Recent History:*\n\n";
    const recentSessions = sessions.slice(0, 5); // Show last 5 sessions

    recentSessions.forEach((session: { timestamp: string; message: string; mood: string; suggestions?: Suggestion[] }, i: number) => {
      const date = new Date(session.timestamp).toLocaleDateString();
      message += `${i + 1}\\. *${escapeMarkdown(session.message)}*\n`;
      message += `   📅 ${date} \\| 😊 ${session.mood}\n`;
      message += `   📺 ${session.suggestions?.length || 0} videos\n\n`;
    });

    message += `Showing ${recentSessions.length} of ${sessions.length} sessions\\.`;

    await ctx.replyWithMarkdownV2(message, { parse_mode: "MarkdownV2" });
  } catch (error) {
    console.error("History error:", error);
    await ctx.reply("❌ Error loading history. Make sure Next.js server is running.");
  }
}

export async function handleSaves(ctx: BotContext) {
  const userId = ctx.from?.id.toString();
  if (!userId) return;

  try {
    const response = await fetch(`${BOT_CONFIG.apiUrl}/api/saves`);
    
    if (!response.ok) {
      await ctx.reply("❌ Could not load saves. Make sure Next.js server is running.");
      return;
    }

    const data = await response.json();
    const saves = data.saves || [];

    if (saves.length === 0) {
      await ctx.reply("💾 No saved videos yet.\n\nYou can save videos from the web app!");
      return;
    }

    let message = "💾 *Your Saved Videos:*\n\n";
    const recentSaves = saves.slice(0, 10); // Show 10 most recent

    recentSaves.forEach((save: { list: string; suggestion: Suggestion }, i: number) => {
      message += `${i + 1}\\. *${escapeMarkdown(save.suggestion.title)}*\n`;
      message += `   👤 ${escapeMarkdown(save.suggestion.creatorName)}\n`;
      message += `   📂 List: ${save.list}\n`;
      if (save.suggestion.url) {
        message += `   🔗 [Watch](${save.suggestion.url})\n`;
      }
      message += `\n`;
    });

    message += `Showing ${recentSaves.length} of ${saves.length} saved videos\\.`;

    await ctx.replyWithMarkdownV2(message, { parse_mode: "MarkdownV2" });
  } catch (error) {
    console.error("Saves error:", error);
    await ctx.reply("❌ Error loading saves. Make sure Next.js server is running.");
  }
}

export async function handleTrending(ctx: BotContext) {
  const userId = ctx.from?.id.toString();
  if (!userId) return;

  try {
    await ctx.reply("📈 Fetching trending content...");

    const response = await fetch(`${BOT_CONFIG.apiUrl}/api/trending`);
    
    if (!response.ok) {
      await ctx.reply("❌ Could not load trending content. Make sure Next.js server is running.");
      return;
    }

    const data = await response.json();
    const suggestions = data.suggestions || [];

    if (suggestions.length === 0) {
      await ctx.reply("📈 No trending content available at the moment.");
      return;
    }

    const formattedMessage = formatSuggestions(suggestions);
    
    if (formattedMessage.length > 4000) {
      const chunks = splitMessage(formattedMessage, 4000);
      for (const chunk of chunks) {
        await ctx.replyWithMarkdownV2(chunk, { parse_mode: "MarkdownV2" });
      }
    } else {
      await ctx.replyWithMarkdownV2(formattedMessage, { parse_mode: "MarkdownV2" });
    }
  } catch (error) {
    console.error("Trending error:", error);
    await ctx.reply("❌ Error loading trending content. Make sure Next.js server is running.");
  }
}

export async function handleRecommend(ctx: BotContext) {
  const userId = ctx.from?.id.toString();
  if (!userId) return;

  const text = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
  const query = text.replace(/^\/recommend\s*/i, '').trim();
  
  if (!query) {
    await ctx.reply("Please provide what you're looking for.\n\nExample: /recommend 30min coding tutorial");
    return;
  }

  await handleTextMessage(ctx, query);
}

// Handle regular text messages
export async function handleTextMessage(ctx: BotContext, customQuery?: string) {
  const userId = ctx.from?.id.toString();
  if (!userId) return;

  const userState = await getUserState(userId);
  const text = customQuery || (ctx.message && 'text' in ctx.message ? ctx.message.text : '');
  
  if (!text) return;

  // Skip if it's a command (unless it's a custom query from /recommend)
  if (!customQuery && text.startsWith('/')) {
    return;
  }

  // Check if user is setting up profile
  if (userState.pendingProfileSetup) {
    if (text.toLowerCase() === '/skip') {
      userState.pendingProfileSetup = false;
      await ctx.reply("Profile setup skipped. You can set it later with /profile");
      return;
    }
    
    const profileData = parseProfileFromMessage(text);
    
    if (Object.keys(profileData).length > 0) {
      await updateUserProfile(userId, profileData);
      userState.pendingProfileSetup = false;
      await ctx.reply(MESSAGES.profileSaved);
      return;
    } else {
      await ctx.reply("I couldn't understand that format. Please try again or send /skip");
      return;
    }
  }

  // Get recommendations
  try {
    // Send loading message that we can edit later
    const loadingMsg = await ctx.reply("🔍 Searching for videos...");

    const data = await getRecommendations(text, userId);
    
    if (data.suggestions && data.suggestions.length > 0) {
      // Delete loading message
      try {
        await ctx.telegram.deleteMessage(ctx.chat!.id, loadingMsg.message_id);
      } catch {
        // Ignore if can't delete
      }

      // Add to user's history
      await addToHistory(userId, {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        message: text,
        mood: userState.currentMood || "curious",
        suggestions: data.suggestions,
      });

      // Send each video as a separate message with inline buttons
      let videoCount = 0;
      for (const video of data.suggestions) {
        videoCount++;
        
        // Store video data for callbacks
        storeSuggestionData(video.id, video);
        
        // Format video message
        const videoMsg = formatSingleVideo(video, videoCount);
        
        // Get action buttons
        const keyboard = getVideoActionButtons(video.id);
        
        try {
          // Send with thumbnail if available
          if (video.thumbnailUrl) {
            await ctx.replyWithPhoto(
              video.thumbnailUrl,
              {
                caption: videoMsg,
                parse_mode: "MarkdownV2",
                reply_markup: keyboard,
              }
            );
          } else {
            // Send as text with buttons
            await ctx.replyWithMarkdownV2(videoMsg, {
              reply_markup: keyboard,
            });
          }
        } catch (error) {
          console.error("Error sending video:", error);
          // Fallback to simple text
          await ctx.reply(`${video.title}\n${video.url || ""}`);
        }
      }
      
      // Show model info in debug
      if (data.usedFallback) {
        await ctx.reply("ℹ️ Using fallback suggestions (AI unavailable)");
      }
    } else {
      // Delete loading message
      try {
        await ctx.telegram.deleteMessage(ctx.chat!.id, loadingMsg.message_id);
      } catch {
        // Ignore
      }
      await ctx.reply(MESSAGES.noResults);
    }
  } catch (error) {
    console.error("Bot error:", error);
    await ctx.reply(MESSAGES.error);
  }
}

// Format a single video for display
function formatSingleVideo(video: Suggestion, index: number): string {
  let message = `*${index}\\. ${escapeMarkdown(video.title)}*\n\n`;
  
  if (video.creatorName) {
    message += `📺 ${escapeMarkdown(video.creatorName)}\n`;
  }
  
  if (video.description) {
    if (video.description.length > 150) {
      const shortDesc = video.description.slice(0, 150);
      message += `\n${escapeMarkdown(shortDesc)}\\.\\.\\.\n`;
    } else {
      message += `\n${escapeMarkdown(video.description)}\n`;
    }
  }
  
  if (video.url) {
    message += `\n🔗 [Watch on YouTube](${escapeMarkdown(video.url)})`;
  }
  
  return message;
}

// Handle quick mood commands
export async function handleMoodCommand(ctx: BotContext, mood: string) {
  const userId = ctx.from?.id.toString();
  if (!userId) return;

  if (VALID_MOODS.includes(mood as Mood)) {
    await setUserMood(userId, mood as Mood);
    await ctx.replyWithMarkdownV2(escapeMarkdown(MESSAGES.moodSet(mood as Mood)));
  }
}
