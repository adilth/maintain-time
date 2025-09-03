import { NextRequest } from "next/server";
import { Suggestion } from "@/types";
import { readStore, writeStore } from "@/lib/store";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const suggestion: Suggestion | undefined = body?.suggestion;
  if (!suggestion?.id) return new Response(JSON.stringify({ ok: false, error: "missing suggestion" }), { status: 400 });
  const store = await readStore();
  const liked = new Set<string>(store.likes ?? []);
  liked.add(suggestion.id);
  store.likes = Array.from(liked);
  store.likedSuggestions = { ...(store.likedSuggestions ?? {}), [suggestion.id]: suggestion };
  await writeStore(store);
  return new Response(JSON.stringify({ ok: true }));
}

export async function GET() {
  const store = await readStore();
  return new Response(JSON.stringify({ likes: store.likes ?? [], likedSuggestions: store.likedSuggestions ?? {} }));
}


