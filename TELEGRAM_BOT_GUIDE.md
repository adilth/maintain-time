# Quick Start Guide - Telegram Bot

## 🚀 Getting Started (3 Steps)

### Step 1: Start Both Servers
```bash
npm run dev:all
```

This starts:
- ✅ Next.js on http://localhost:3002
- ✅ Telegram Bot (polling for messages)

### Step 2: Find Your Bot on Telegram
1. Open Telegram
2. Search for your bot (the name you set with BotFather)
3. Click "Start" or send `/start`

### Step 3: Use the Bot!

#### Example 1: Simple Request
```
You: 30 minute coding tutorial
Bot: 📺 Found 5 videos: [list of recommendations]
```

#### Example 2: With Mood
```
You: /mood curious
Bot: ✅ Mood set to: curious

You: quick tech news
Bot: 📺 Found 5 videos: [personalized to curious mood]
```

#### Example 3: Setup Profile
```
You: /profile
Bot: 📝 Setup Your Profile...

You: 
Hobbies: programming, gaming
Interests: web development, AI
Languages: English, Arabic
YouTubers: Fireship, ThePrimeagen

Bot: ✅ Profile saved successfully!
```

## 📱 All Commands

| Command | Description | Example |
|---------|-------------|---------|
| `/start` | Welcome message | `/start` |
| `/help` | Show all commands | `/help` |
| `/mood <mood>` | Set your mood | `/mood curious` |
| `/profile` | Setup profile | `/profile` |
| `/recommend <query>` | Get recommendations | `/recommend 20min python` |
| `/reset` | Clear profile | `/reset` |

## 🎯 Mood Options

- `/tired` - Low energy content
- `/curious` - Educational, interesting
- `/motivated` - Inspiring, productive
- `/relaxed` - Calm, easy watching
- `/bored` - Entertaining, fun
- `/chill` - Background, ambient

## 💡 Tips

1. **Set mood first** for better recommendations
2. **Setup profile** for personalized results
3. **Be specific** in your requests (e.g., "40min Python tutorial for beginners")
4. **Use natural language** - no need for perfect formatting

## ⚙️ Troubleshooting

### Bot doesn't respond?
```bash
# Check if both are running
npm run dev:all

# If you see errors, run separately:
# Terminal 1
npm run dev

# Terminal 2
npm run bot
```

### "API temporarily unavailable"?
- Bot uses saved content as fallback
- Check your internet connection
- Verify Gemini API key is valid

### Bot works but no recommendations?
- Make sure Next.js server is running (localhost:3002)
- Check terminal logs for errors

## 🔍 What's Happening Behind the Scenes?

```
Your Message
    ↓
Telegram Bot receives it
    ↓
Loads your profile & mood
    ↓
Calls /api/recommend endpoint
    ↓
Gemini AI generates suggestions
    ↓
Bot formats & sends back to you
```

## 🎨 Example Conversations

### Scenario 1: Morning Motivation
```
You: /motivated
Bot: ✅ Mood set to: motivated

You: productivity tips
Bot: 📺 Found 5 videos:
1. "10 Habits of Highly Productive People"
   👤 Ali Abdaal
   ⏱️ 15 min
   🔗 [Watch Video]
...
```

### Scenario 2: Learning Session
```
You: /curious
Bot: ✅ Mood set to: curious

You: explain quantum computing simply
Bot: 📺 Found 5 videos:
1. "Quantum Computing Explained in 10 Minutes"
   👤 Veritasium
   ⏱️ 10 min
   🔗 [Watch Video]
...
```

### Scenario 3: Chill Time
```
You: /chill
Bot: ✅ Mood set to: chill

You: lofi music for studying
Bot: 📺 Found 5 videos:
1. "Lofi Hip Hop Radio - 24/7 Study Music"
   👤 Lofi Girl
   ⏱️ 120 min
   🔗 [Watch Video]
...
```

## 📊 Your Data

All data is stored locally in `.data/bot-profiles.json`:
- Your profile (hobbies, interests, languages)
- Current mood preference
- Last active timestamp

## 🚀 Next Steps

1. **Try different moods** to see how recommendations change
2. **Setup your profile** for better personalization
3. **Use natural language** - treat it like a friend who recommends videos
4. **Combine mood + profile** for best results

Enjoy your personalized video recommendations! 🎉
