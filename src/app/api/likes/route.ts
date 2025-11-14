import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { Suggestion } from "@/types";
import { likeVideo, unlikeVideo, getUserLikes } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const suggestion: Suggestion | undefined = body?.suggestion;
    const action: "like" | "unlike" | undefined = body?.action;

    if (!suggestion?.id) {
      return new Response(
        JSON.stringify({ ok: false, error: "missing suggestion" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;

    if (!userId) {
      return new Response(
        JSON.stringify({ ok: false, error: "Not authenticated" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    if (action === "unlike") {
      await unlikeVideo(userId, suggestion.id);
    } else {
      await likeVideo(userId, suggestion.id, suggestion);
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error managing like:", error);
    return new Response(
      JSON.stringify({ ok: false, error: "Failed to manage like" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;

    if (!userId) {
      return new Response(
        JSON.stringify({ likes: [], likedSuggestions: {} }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    const likesData = await getUserLikes(userId);
    
    // Convert to app format
    const likes = likesData.map((l: { videoId: string }) => l.videoId);
    const likedSuggestions: Record<string, Suggestion> = {};
    
    likesData.forEach((l: { videoId: string; suggestion: unknown }) => {
      if (l.suggestion) {
        likedSuggestions[l.videoId] = l.suggestion as Suggestion;
      }
    });

    return new Response(
      JSON.stringify({ likes, likedSuggestions }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error fetching likes:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch likes" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}



