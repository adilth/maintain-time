import { promises as fs } from "fs";
import path from "path";
import { SavedItem, Suggestion } from "@/types";

type Store = {
  likes?: string[];
  likedSuggestions?: Record<string, Suggestion>;
  saves?: SavedItem[];
  profile?: any;
};

const DATA_DIR = process.env.DATA_DIR || ".data";
const FILE_PATH = path.join(process.cwd(), DATA_DIR, "store.json");

async function ensureFile() {
  const dir = path.dirname(FILE_PATH);
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch {}
  try {
    await fs.access(FILE_PATH);
  } catch {
    await fs.writeFile(FILE_PATH, JSON.stringify({ likes: [], likedSuggestions: {}, saves: [], profile: {} }, null, 2));
  }
}

export async function readStore(): Promise<Store> {
  await ensureFile();
  const raw = await fs.readFile(FILE_PATH, "utf8");
  try {
    return JSON.parse(raw);
  } catch {
    return { likes: [], likedSuggestions: {}, saves: [], profile: {} };
  }
}

export async function writeStore(store: Store) {
  await ensureFile();
  await fs.writeFile(FILE_PATH, JSON.stringify(store, null, 2));
}


