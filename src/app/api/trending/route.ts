import { NextRequest } from "next/server";
import { Suggestion, SuggestionTag } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SuggestionTagAll = SuggestionTag | "all";
export async function GET(req: NextRequest) {
    try {
        const url = new URL(req.url);
        const category: SuggestionTagAll = url.searchParams.get("category") as SuggestionTagAll || "all";
        const count = Math.min(
            Math.max(parseInt(url.searchParams.get("count") || "10"), 1),
            50 // Increased max to support larger requests
        );

        const apiKey = process.env.YOUTUBE_API_KEY;

        // If no API key, return fallback trending content
        if (!apiKey) {
            console.warn("No YOUTUBE_API_KEY found, using fallback trending content");
            return new Response(
                JSON.stringify({
                    suggestions: getFallbackTrending(count),
                    source: "fallback",
                }),
                { headers: { "Content-Type": "application/json" } }
            );
        }

        // Map category to YouTube category ID
        const categoryMap: Record<string, string> = {
            gaming: "20",
            music: "10",
            news: "25",
            education: "27",
            entertainment: "24",
            sports: "17",
            technology: "28",
            science: "28",
        };

        let suggestions: Suggestion[] = [];

        // If "all" category, fetch from multiple categories
        if (category === "all") {
            const categories = ["gaming", "music", "entertainment", "education"];
            const perCategory = Math.ceil(count / categories.length);

            const allPromises = categories.map(async (cat) => {
                try {
                    const ytUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
                    ytUrl.searchParams.set("part", "snippet,contentDetails,statistics");
                    ytUrl.searchParams.set("chart", "mostPopular");
                    ytUrl.searchParams.set("regionCode", "US");
                    ytUrl.searchParams.set("maxResults", perCategory.toString());
                    ytUrl.searchParams.set("key", apiKey);

                    if (categoryMap[cat]) {
                        ytUrl.searchParams.set("videoCategoryId", categoryMap[cat]);
                    }

                    const response = await fetch(ytUrl.toString());
                    if (!response.ok) return [];

                    const data = await response.json();
                    return (data.items || []).map((item: any) =>
                        youtubeItemToSuggestion(item, cat)
                    );
                } catch {
                    return [];
                }
            });

            const results = await Promise.all(allPromises);
            suggestions = results.flat().slice(0, count);
        } else {
            // Fetch specific category
            const ytUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
            ytUrl.searchParams.set("part", "snippet,contentDetails,statistics");
            ytUrl.searchParams.set("chart", "mostPopular");
            ytUrl.searchParams.set("regionCode", "US");
            ytUrl.searchParams.set("maxResults", count.toString());
            ytUrl.searchParams.set("key", apiKey);

            if (categoryMap[category]) {
                ytUrl.searchParams.set("videoCategoryId", categoryMap[category]);
            }

            const response = await fetch(ytUrl.toString());

            if (!response.ok) {
                throw new Error(`YouTube API error: ${response.status}`);
            }

            const data = await response.json();
            suggestions = (data.items || []).map((item: any) =>
                youtubeItemToSuggestion(item, category)
            );
        }

        return new Response(
            JSON.stringify({
                suggestions,
                source: "youtube",
            }),
            { headers: { "Content-Type": "application/json" } }
        );
    } catch (error) {
        console.error("Trending API error:", error);
        return new Response(
            JSON.stringify({
                suggestions: getFallbackTrending(10),
                source: "fallback",
                error: String(error),
            }),
            { headers: { "Content-Type": "application/json" } }
        );
    }
}

function youtubeItemToSuggestion(item: any, category: SuggestionTag): Suggestion {
    const snippet = item.snippet || {};
    const statistics = item.statistics || {};
    const contentDetails = item.contentDetails || {};

    // Parse ISO 8601 duration (PT1H2M10S) to minutes
    const duration = contentDetails.duration || "PT0S";
    const durationMatch = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    const hours = parseInt(durationMatch?.[1] || "0");
    const minutes = parseInt(durationMatch?.[2] || "0");
    const durationMinutes = hours * 60 + minutes;

    // Get the best available thumbnail - fallback chain
    let thumbnailUrl = snippet.thumbnails?.maxres?.url ||
        snippet.thumbnails?.high?.url ||
        snippet.thumbnails?.medium?.url ||
        snippet.thumbnails?.default?.url;

    // If no thumbnail from API, construct from video ID
    if (!thumbnailUrl && item.id) {
        thumbnailUrl = `https://i.ytimg.com/vi/${item.id}/hqdefault.jpg`;
    }

    return {
        id: `yt_${item.id}`,
        title: snippet.title || "Untitled",
        creatorName: snippet.channelTitle || "Unknown",
        thumbnailUrl,
        durationMinutes: durationMinutes || undefined,
        datePublished: snippet.publishedAt,
        description: snippet.description
            ? snippet.description.substring(0, 150) + "..."
            : undefined,
        tags: [category, "trending", "youtube"],
        relevance: Math.min(
            0.9,
            0.5 + (parseInt(statistics.viewCount || "0") / 10000000) * 0.4
        ),
        url: `https://www.youtube.com/watch?v=${item.id}`,
    };
}

function getFallbackTrending(count: number): Suggestion[] {
    const fallbackItems: Partial<Suggestion>[] = [
        {
            id: "trend_1",
            title: "Top Tech News This Week",
            creatorName: "Tech Daily",
            durationMinutes: 15,
            description: "Stay updated with the latest in technology",
            tags: ["tech", "news", "trending"],
            relevance: 0.7,
            url: "#",
        },
        {
            id: "trend_2",
            title: "Relaxing Music Mix",
            creatorName: "Chill Vibes",
            durationMinutes: 60,
            description: "Perfect background music for work or study",
            tags: ["music", "chill", "trending"],
            relevance: 0.7,
            url: "#",
        },
        {
            id: "trend_3",
            title: "Quick Coding Tutorial",
            creatorName: "Code Masters",
            durationMinutes: 12,
            description: "Learn something new in just 12 minutes",
            tags: ["coding", "learning", "trending"],
            relevance: 0.7,
            url: "#",
        },
        {
            id: "trend_4",
            title: "Gaming Highlights",
            creatorName: "Pro Gamer",
            durationMinutes: 20,
            description: "Best gaming moments from this week",
            tags: ["gaming", "entertainment", "trending"],
            relevance: 0.7,
            url: "#",
        },
        {
            id: "trend_5",
            title: "Productivity Tips",
            creatorName: "Life Optimizer",
            durationMinutes: 8,
            description: "Boost your daily productivity",
            tags: ["wellness", "learning", "trending"],
            relevance: 0.7,
            url: "#",
        },
    ];

    return fallbackItems.slice(0, count) as Suggestion[];
}
