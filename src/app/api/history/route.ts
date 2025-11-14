import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { HistorySession, Mood, Suggestion } from "@/types";
import { getUserHistory, addToHistory, getGlobalHistory } from "@/lib/db";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;

    let historyData;

    if (userId) {
      // Get user-specific history
      historyData = await getUserHistory(userId, 50);
    } else {
      // Get global history for non-logged-in users
      historyData = await getGlobalHistory(50);
    }

    function parseSuggestions(value: unknown): Suggestion[] {
      if (Array.isArray(value)) return value as Suggestion[];
      return [];
    }

    const history: HistorySession[] = historyData.map((h) => ({
      id: h.id,
      message: h.message,
      mood: (h.mood as Mood) ?? 'relaxed',
      suggestions: parseSuggestions(h.suggestions),
      timestamp: h.timestamp.toISOString(),
    }));

    return new Response(JSON.stringify({ history }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching history:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch history" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const session: HistorySession | undefined = body?.session;

    if (!session) {
      return new Response(
        JSON.stringify({ ok: false, error: "missing session data" }),
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

    // Add to database
    await addToHistory(userId, {
      message: session.message,
      mood: session.mood,
      suggestions: session.suggestions,
    });

    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error saving history:", error);
    return new Response(JSON.stringify({ ok: false, error: "Failed to save history" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const sessionId = url.searchParams.get("id");

    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;

    if (!userId) {
      return new Response(
        JSON.stringify({ ok: false, error: "Not authenticated" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    if (sessionId) {
      // Delete specific session
      await prisma.historySession.delete({
        where: { id: sessionId, userId },
      });
    } else {
      // Clear all history for user
      await prisma.historySession.deleteMany({
        where: { userId },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error deleting history:", error);
    return new Response(JSON.stringify({ ok: false, error: "Failed to delete history" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
