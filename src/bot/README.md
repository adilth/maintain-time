# Maintain Telegram Bot 🤖

A Telegram bot that provides AI-powered YouTube video recommendations based on your mood, preferences, and interests.

## Features

- 🎯 **Smart Recommendations**: Get personalized YouTube video suggestions
- 😊 **Mood-Based**: Set your mood (tired, curious, motivated, relaxed, bored, chill)
- 👤 **Profile Management**: Save your hobbies, interests, languages, and favorite YouTubers
- 💾 **State Persistence**: Your preferences are saved across sessions
- 🔄 **Fallback Support**: Works even when AI is unavailable

## Setup

### 1. Get Your Bot Token

1. Open Telegram and search for [@BotFather](https://t.me/botfather)
2. Send `/newbot` command
3. Follow the instructions to create your bot
4. Copy the bot token you receive

### 2. Configure Environment

Your `.env` file should already have:

```env
TELEGRAM_BOT_TOKEN=8326609482:AAHyZhwjPf87mSkVn2Go-dGNK-hbxBqNhEs
NEXT_PUBLIC_APP_URL=http://localhost:3002
DATA_DIR=.data
```

### 3. Run the Bot

**Option 1: Run bot and Next.js together (Recommended)**
```bash
npm run dev:all
```

**Option 2: Run separately**
```bash
# Terminal 1 - Start Next.js server
npm run dev

# Terminal 2 - Start bot
npm run bot
```

## Usage

### Basic Commands

- `/start` - Start the bot and see welcome message
- `/help` - Show all available commands
- `/mood <mood>` - Set your current mood
  - Example: `/mood curious`
- `/profile` - Setup or view your profile
- `/recommend <query>` - Get specific recommendations
  - Example: `/recommend 30min coding tutorial`
- `/reset` - Reset your profile and preferences

### Quick Mood Commands

You can also use these shortcuts:
- `/tired`
- `/curious`
- `/motivated`
- `/relaxed`
- `/bored`
- `/chill`

### Natural Messages

Just send any message describing what you want:
- "40-minute coding tutorial"
- "relaxing music for studying"
- "funny tech videos"
- "learn JavaScript basics"

## How It Works

```
User Message (Telegram)
    ↓
Bot Handler (src/bot/handlers.ts)
    ↓
User Profile (src/bot/profiles.ts)
    ↓
Your API Endpoint (/api/recommend)
    ↓
Gemini AI / Fallback
    ↓
Formatted Response
    ↓
Telegram Message
```

## File Structure

```
src/bot/
├── config.ts       # Bot configuration and messages
├── profiles.ts     # User profile management
├── handlers.ts     # Command and message handlers
├── index.ts        # Telegraf bot setup
└── start.ts        # Bot starter script
```

## Profile Setup

When you use `/profile` for the first time, reply with:

```
Hobbies: programming, gaming
Interests: web development, AI
Languages: English, Arabic
YouTubers: Fireship, ThePrimeagen
```

Or send `/skip` to set it up later.

## Data Storage

User profiles are stored in `.data/bot-profiles.json`

Each user has:
- Profile (hobbies, interests, languages, YouTubers)
- Current mood
- Last active timestamp

## Troubleshooting

### Bot doesn't respond
1. Make sure Next.js server is running on port 3002
2. Check that `TELEGRAM_BOT_TOKEN` is set correctly
3. Verify the API endpoint is accessible

### API errors
- Check `GOOGLE_GEMINI_API_KEY` is valid
- Bot will use fallback suggestions if AI fails

### Connection issues
- Ensure you have internet connection
- Bot needs to reach both Telegram API and your Next.js server

## Production Deployment

### Using Webhooks (Recommended for production)

Instead of long polling, use webhooks:

```typescript
// In your Next.js API route: src/app/api/telegram-webhook/route.ts
import { bot } from '@/bot';

export async function POST(req: Request) {
  const body = await req.json();
  await bot.handleUpdate(body);
  return new Response('OK');
}
```

Then set webhook:
```bash
curl -X POST https://api.telegram.org/bot<YOUR_TOKEN>/setWebhook \
  -d url=https://your-domain.com/api/telegram-webhook
```

### Environment Variables for Production

```env
TELEGRAM_BOT_TOKEN=your_production_token
NEXT_PUBLIC_APP_URL=https://your-domain.com
DATA_DIR=/var/data/maintain-app
GOOGLE_GEMINI_API_KEY=your_api_key
```

## Future Enhancements

- [ ] Save favorite videos
- [ ] View recommendation history
- [ ] Subscribe to trending topics
- [ ] Scheduled recommendations
- [ ] Voice message support
- [ ] Inline query mode
- [ ] Share recommendations with friends

## Support

For issues, check:
1. Bot logs in terminal
2. Next.js server logs
3. Network connectivity
4. API key validity

## License

Same as the main Maintain App project.
