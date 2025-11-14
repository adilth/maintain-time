import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { SaveList, SavedItem, Suggestion } from "@/types";
import { saveVideo, getUserSaves, removeSave } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;

    if (!userId) {
      return new Response(
        JSON.stringify({ items: [] }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    const list = (new URL(req.url).searchParams.get("list") as SaveList | null) ?? undefined;
    const savesData = await getUserSaves(userId, list);

    // Convert to app format
    const items: SavedItem[] = savesData.map((s: { videoId: string; list: string; addedAt: Date; suggestion: unknown; notes: string | null }) => ({
      id: s.videoId,
      list: s.list as SaveList,
      addedAt: s.addedAt.toISOString(),
      suggestion: s.suggestion as Suggestion,
      notes: s.notes || undefined,
    }));

    return new Response(JSON.stringify({ items }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching saves:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch saves" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const suggestion: Suggestion | undefined = body?.suggestion;
    const list: SaveList | undefined = body?.list;
    const notes: string | undefined = body?.notes;

    if (!suggestion?.id || !list) {
      return new Response(
        JSON.stringify({ ok: false, error: "missing suggestion/list" }),
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

    await saveVideo(userId, {
      videoId: suggestion.id,
      suggestion,
      list,
      notes,
    });

    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error saving video:", error);
    return new Response(
      JSON.stringify({ ok: false, error: "Failed to save video" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const videoId = url.searchParams.get("id");

    if (!videoId) {
      return new Response(
        JSON.stringify({ ok: false, error: "missing video id" }),
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

    await removeSave(userId, videoId);

    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error removing save:", error);
    return new Response(
      JSON.stringify({ ok: false, error: "Failed to remove save" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}



