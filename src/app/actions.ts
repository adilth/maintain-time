"use server";

import { revalidateTag } from "next/cache";
import { Mood, Profile, SavedItem, Suggestion } from "@/types";
import { headers } from "next/headers";

export async function submitRecommendationRequest(
  message: string,
  mood: Mood,
  profile: Profile | null
) {
  try {
    const header = await headers();
    const host = header.get("host");
    const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
    const response = await fetch(`${protocol}://${host}/api/recommend`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        mood,
        count: 10,
        profile,
      }),
    });

    const data = await response.json();

    // Optionally revalidate any cached data
    revalidateTag("recommendations");

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error("Server action error:", error);
    return {
      success: false,
      error: "Failed to get recommendations",
    };
  }
}

export async function getSavedSuggestions(): Promise<Suggestion[]> {
  try {
    const header = await headers();
    const host = header.get("host");
    const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
    const response = await fetch(`${protocol}://${host}/api/saves`, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch saved suggestions");
    }

    const data = await response.json();
    return data.items ? data.items.map((item: SavedItem) => item.suggestion) : [];
  } catch (error) {
    console.error("Error loading saved suggestions:", error);
    return [];
  }
}

export async function likeSuggestion(suggestion: Suggestion) {
  try {
    const header = await headers();
    const host = header.get("host");
    const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
    const response = await fetch(`${protocol}://${host}/api/likes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ suggestion }),
    });

    if (!response.ok) {
      throw new Error("Failed to like suggestion");
    }

    return { success: true };
  } catch (error) {
    console.error("Like suggestion error:", error);
    return { success: false, error: "Failed to like suggestion" };
  }
}
