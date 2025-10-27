import { NextRequest } from "next/server";
import { HistorySession } from "@/types";
import { readStore, writeStore } from "@/lib/store";

export async function GET() {
  try {
    const store = await readStore();
    const history = (store.history ?? []).sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
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

    if (!session?.id) {
      return new Response(
        JSON.stringify({ ok: false, error: "missing session data" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const store = await readStore();
    const history: HistorySession[] = store.history ?? [];
    
    // Add new session at the beginning
    history.unshift(session);
    
    // Keep only last 50 sessions
    if (history.length > 50) {
      history.splice(50);
    }

    store.history = history;
    await writeStore(store);

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

    const store = await readStore();
    const history: HistorySession[] = store.history ?? [];

    if (sessionId) {
      // Delete specific session
      store.history = history.filter((s) => s.id !== sessionId);
    } else {
      // Clear all history
      store.history = [];
    }

    await writeStore(store);

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
