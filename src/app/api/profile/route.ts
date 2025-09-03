import { NextRequest } from "next/server";
import { Profile } from "@/types";
import { readStore, writeStore } from "@/lib/store";

export async function GET() {
  const store = await readStore();
  return new Response(JSON.stringify({ profile: store.profile ?? {} }));
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const profile: Profile | undefined = body?.profile;
  if (!profile) return new Response(JSON.stringify({ ok: false, error: "missing profile" }), { status: 400 });
  const store = await readStore();
  store.profile = profile;
  await writeStore(store);
  return new Response(JSON.stringify({ ok: true }));
}
