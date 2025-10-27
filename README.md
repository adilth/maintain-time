# Maintain - AI-Powered Content Recommendations

A personal content recommendation app that uses AI to suggest videos, articles, and podcasts based on your mood, interests, and preferences.

## Features

✨ **AI-Powered Recommendations** - Get personalized content suggestions using Google Gemini AI  
🎭 **Mood-Based Filtering** - Choose your mood (tired, curious, motivated, relaxed, bored, chill) for better matches  
💾 **Save & Organize** - Save content to categorized lists (listen, learn, knowledge, tomorrow, other)  
📜 **History Tracking** - View your past recommendations and revisit them anytime  
🔥 **Trending Content** - See what's popular right now (optional YouTube integration)  
🔍 **Search & Filter** - Find saved content easily with search and tag filters  
🎨 **Modern UI** - Clean, responsive design with dark mode support  
🎉 **Toast Notifications** - Get instant feedback on your actions  
⚡ **Error Boundaries** - Graceful error handling for a stable experience

## Tech Stack

- **Next.js 15** with App Router
- **React 19** for UI
- **TypeScript** for type safety
- **Tailwind CSS 4** for styling
- **Sonner** for toast notifications
- **Google Gemini API** for AI recommendations
- **YouTube API** (optional) for trending content

## Getting Started

### Prerequisites

- Node.js 20+ or Bun
- pnpm (recommended), npm, or yarn
- Google Gemini API key (required)
- YouTube API key (optional, for trending content)

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd maintain-app
```

2. Install dependencies:
```bash
pnpm install
```

3. Create a `.env.local` file in the root directory:
```env
GOOGLE_GEMINI_API_KEY=your_gemini_api_key_here
YOUTUBE_API_KEY=your_youtube_api_key_here  # Optional
```

4. Run the development server:
```bash
pnpm dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## How to Use

### 1. Set Up Your Profile
Go to **Settings** and add:
- Your name
- Hobbies and interests
- Programming languages you know
- Work context
- Favorite YouTubers

### 2. Get Recommendations
- Select your current mood
- Type what you're looking for (e.g., "40-minute coding tutorial")
- Get AI-powered suggestions tailored to you

### 3. Save Content
- Click the "🔖 Save" button on any suggestion
- Choose a category (listen, learn, knowledge, tomorrow, other)
- Access saved content in the **Saves** page

### 4. View History
- Go to **History** to see all your past recommendations
- Click to expand and view suggestions again
- Delete individual sessions or clear all history

### 5. Explore Trending
- On the main page, view trending content
- Based on YouTube's trending videos (if API key is set)
- Falls back to curated suggestions if unavailable

## Project Structure

```
src/
├── app/
│   ├── (components)/     # React components
│   │   ├── Chat-client.tsx
│   │   ├── LoadingSkeleton.tsx
│   │   ├── SuggestionCard.tsx
│   │   └── SidebarLink.tsx
│   ├── api/              # API routes
│   │   ├── history/      # History management
│   │   ├── likes/        # Like functionality
│   │   ├── profile/      # Profile management
│   │   ├── recommend/    # AI recommendations
│   │   ├── saves/        # Save functionality
│   │   └── trending/     # Trending content
│   ├── history/          # History page
│   ├── saves/            # Saves page
│   ├── settings/         # Settings page
│   ├── error.tsx         # Error boundary
│   ├── global-error.tsx  # Global error handler
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Home page
├── lib/
│   ├── profile.ts        # Profile utilities
│   └── store.ts          # File-based storage
└── types.ts              # TypeScript types
```

## API Keys

### Google Gemini API
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add to `.env.local` as `GOOGLE_GEMINI_API_KEY`

### YouTube API (Optional)
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project and enable YouTube Data API v3
3. Create credentials (API key)
4. Add to `.env.local` as `YOUTUBE_API_KEY`

## Development

```bash
# Run development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Run linting
pnpm lint
```

## Features in Detail

### AI Recommendations
- Uses Google Gemini 2.0 Flash model
- Considers your mood, profile, and message
- Fallback to saved content if AI is unavailable
- Parses JSON responses with tolerance for truncation

### History Tracking
- Automatically saves all recommendation sessions
- Stores up to 50 recent sessions
- Shows relative time (e.g., "2h ago")
- Expandable to view full suggestions

### Search & Filter
- Search by title, creator, or description
- Filter by multiple tags
- Sort by newest, oldest, or relevance
- Shows result count

### Trending Content
- Fetches from YouTube API when available
- Falls back to curated suggestions
- Categorized by gaming, music, news, etc.
- Refreshes on page load

## Contributing

This is a personal project, but suggestions and feedback are welcome!

## License

MIT
