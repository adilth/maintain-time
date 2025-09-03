import { NextRequest } from "next/server";
import { SaveList, SavedItem, Suggestion } from "@/types";
import { readStore, writeStore } from "@/lib/store";

export async function GET(req: NextRequest) {
  const store = await readStore();
  const list = (new URL(req.url).searchParams.get("list") as SaveList | null) ?? null;
  const items: SavedItem[] = store.saves ?? [];
  const filtered = list ? items.filter((i) => i.list === list) : items;
  return new Response(JSON.stringify({ items: filtered }));
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const suggestion: Suggestion | undefined = body?.suggestion;
  const list: SaveList | undefined = body?.list;
  if (!suggestion?.id || !list) return new Response(JSON.stringify({ ok: false, error: "missing suggestion/list" }), { status: 400 });
  const store = await readStore();
  const items: SavedItem[] = store.saves ?? [];
  const exists = items.find((i) => i.id === suggestion.id && i.list === list);
  if (!exists) items.push({ id: suggestion.id, list, addedAt: new Date().toISOString(), suggestion });
  store.saves = items;
  await writeStore(store);
  return new Response(JSON.stringify({ ok: true }));
}


