import { NextRequest } from "next/server";
import { RecommendRequest, RecommendResponse, Suggestion } from "@/types";
import { readStore } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: RecommendRequest | undefined;
  try {
    body = await req.json();
  } catch (_) {}

  const message = body?.message ?? "";
  const count = Math.min(Math.max(body?.count ?? 10, 1), 20);

  try {
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) throw new Error("Missing GOOGLE_GEMINI_API_KEY");
    const payload = buildGeminiPrompt(body);
    const resp = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
      {
        method: "POST",
        headers: { "X-goog-api-key": apiKey, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    if (!resp.ok) {
      const errorText = await resp.text();
      console.error("Gemini API error:", errorText);
      throw new Error(
        `Gemini request failed: ${resp.status} ${resp.statusText} - ${errorText}`
      );
    }

    const data = await resp.json();
    if (process.env.NODE_ENV !== "production") {
      console.log("Gemini response data:", JSON.stringify(data, null, 2));
    }
    const suggestions = parseGeminiResponse(data, count);
    if (process.env.NODE_ENV !== "production") {
      console.log("Recommend response data:", JSON.stringify(suggestions, null, 2));
    }
    const response: RecommendResponse = {
      suggestions,
      model: "gemini-2.0-flash",
      usedFallback: false,
    };
    return new Response(JSON.stringify(response), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    const suggestions = await fallbackSuggestions(message, count, body?.mood);
    const debug =
      process.env.NODE_ENV !== "production" ? { error: String(err?.message ?? err) } : {};
    const response: RecommendResponse & { error?: string } = {
      suggestions,
      model: "fallback",
      usedFallback: true,
      ...(debug as any),
    };
    return new Response(JSON.stringify(response), {
      headers: { "Content-Type": "application/json" },
    });
  }
}

function buildGeminiPrompt(body?: RecommendRequest) {
  const count = Math.min(Math.max(body?.count ?? 10, 1), 20);
  const profile = body?.profile;
  const mood = body?.mood;
  const message = body?.message ?? "";

  // Separate system instructions from user content
  const systemInstruction = `You are a web content recommendation system. You recommend videos, articles, and podcasts based on user requests. 
  
  Always return ONLY valid JSON in this exact format - an array of suggestion objects:
  [
    {
      "id": "unique_id",
      "title": "Content Title",
      "creatorName": "Creator Name",
      "thumbnailUrl": "https://youtube.com/thumb.jpg",
      "creatorAvatarUrl": "https://youtube.com/avatar.jpg",
      "durationMinutes": 25,
      "date_published": "2024-07-01",
      "description": "Brief description of the content",
      "tags": ["tag1", "tag2"],
      "relevance": 0.9,
      "url": "https://youtube.com/content"
    }
  ]
  
  Consider the user's mood, profile (hobbies, interests, languages, work context), and favorite content creators. Prioritize matching channels when relevant to their interests. Avoid duplicates. Ensure relevance is a number between 0 and 1.`;

  const userPrompt = `Please recommend ${count} pieces of web content based on:
  
  Message: "${message}"
  Mood: ${mood ?? "unknown"}
  Profile: ${JSON.stringify(profile ?? {})}
  
  Return only the JSON array, no additional text.`;

  return {
    systemInstruction: {
      parts: [{ text: systemInstruction }],
    },
    contents: [
      {
        role: "user",
        parts: [{ text: userPrompt }],
      },
    ],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 3048, // Increased for better JSON response
      topP: 0.8,
      topK: 40,
    },
  };
}

function parseGeminiResponse(data: any, count: number): Suggestion[] {
  try {
    let text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    // Strip markdown code fences if present
    text = text.replace(/^```[a-zA-Z]*\n?/g, "").replace(/```\s*$/g, "");

    // Try bracket-matched extraction of the first JSON array
    const jsonArray = extractJsonArray(text);
    if (jsonArray) {
      try {
        const arr = JSON.parse(jsonArray);
        if (Array.isArray(arr)) {
          return arr.slice(0, count).map(normalizeSuggestion);
        }
      } catch {}
    }

    // Fallback: extract individual JSON objects and wrap into an array
    const objects = extractJsonObjects(text);
    if (objects.length > 0) {
      return objects.slice(0, count).map(normalizeSuggestion);
    }

    return [];
  } catch {
    return [];
  }
}

// Extract the first top-level JSON array using bracket depth, tolerant to truncation
function extractJsonArray(source: string): string | null {
  const start = source.indexOf("[");
  if (start < 0) return null;
  let depth = 0;
  let inString = false;
  let prevChar = "";
  for (let i = start; i < source.length; i++) {
    const ch = source[i];
    if (inString) {
      if (ch === '"' && prevChar !== "\\") inString = false;
    } else {
      if (ch === '"') inString = true;
      else if (ch === "[") depth++;
      else if (ch === "]") {
        depth--;
        if (depth === 0) {
          return source.slice(start, i + 1);
        }
      }
    }
    prevChar = ch;
  }
  // If we get here, it may be truncated. Try to close it naively.
  return source.slice(start) + "]";
}

// Very tolerant extraction of JSON objects { ... } at top level (not perfect but useful fallback)
function extractJsonObjects(source: string): any[] {
  const results: any[] = [];
  let start = -1;
  let depth = 0;
  let inString = false;
  let prevChar = "";
  for (let i = 0; i < source.length; i++) {
    const ch = source[i];
    if (inString) {
      if (ch === '"' && prevChar !== "\\") inString = false;
    } else {
      if (ch === '"') inString = true;
      else if (ch === "{") {
        if (depth === 0) start = i;
        depth++;
      } else if (ch === "}") {
        depth--;
        if (depth === 0 && start >= 0) {
          const slice = source.slice(start, i + 1);
          try {
            const obj = JSON.parse(slice);
            results.push(obj);
          } catch {}
          start = -1;
        }
      }
    }
    prevChar = ch;
  }
  return results;
}

function normalizeSuggestion(s: any): Suggestion {
  return {
    id: String(s.id ?? crypto.randomUUID()),
    title: String(s.title ?? "Untitled"),
    creatorName: String(s.creatorName ?? "Unknown"),
    creatorAvatarUrl: s.creatorAvatarUrl ?? undefined,
    thumbnailUrl: s.thumbnailUrl ?? undefined,
    durationMinutes:
      typeof s.durationMinutes === "number" ? s.durationMinutes : undefined,
    datePublished: typeof s.datePublished === "string" ? s.datePublished : undefined,
    description: s.description ?? undefined,
    tags: Array.isArray(s.tags) ? s.tags : [],
    relevance:
      typeof s.relevance === "number" ? Math.max(0, Math.min(1, s.relevance)) : 0.5,
    url: s.url ?? undefined,
  };
}

async function fallbackSuggestions(
  message: string,
  count: number,
  mood?: string
): Promise<Suggestion[]> {
  try {
    const store = await readStore();
    const allSaves = store.saves ?? [];
    if (allSaves.length === 0) {
      return Array.from({ length: count }).map((_, i) => ({
        id: `fallback_${i + 1}`,
        title: `No saved content yet - ${message}`,
        creatorName: "Your Saves",
        durationMinutes: 30,
        description: `Save some content to see personalized suggestions when AI is unavailable.`,
        tags: ["saved", "fallback"],
        relevance: 0.5,
        url: "#",
      }));
    }

    // Shuffle and take up to count
    const shuffled = [...allSaves].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count).map((item, i) => ({
      ...item.suggestion,
      id: `saved_${item.id}_${i}`,
      description: `From your saves (${item.list}) - ${
        item.suggestion.description || "Saved content"
      }`,
      tags: [...(item.suggestion.tags || []), "saved", item.list],
      relevance: Math.max(0.4, 0.9 - i * 0.1),
    }));
  } catch {
    return Array.from({ length: count }).map((_, i) => ({
      id: `error_${i + 1}`,
      title: `AI temporarily unavailable`,
      creatorName: "System",
      durationMinutes: 0,
      description: `Please try again later. Error loading saved content.`,
      tags: ["error"],
      relevance: 0.1,
      url: "#",
    }));
  }
}
