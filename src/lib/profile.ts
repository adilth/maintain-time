import { Profile } from "@/types";
import { readStore } from "./store";

export async function loadProfile(): Promise<Profile> {
  try {
    // Read directly from store instead of making an API call
    // This works on both server and client side
    const store = await readStore();
    const profile = store.profile as Profile | undefined;
    
    // Return profile with defaults for missing fields
    return {
      hobbies: [],
      interests: [],
      languages: [],
      youtubers: [],
      ...profile,
    };
  } catch (err) {
    console.error("Error loading profile:", err);
    return { hobbies: [], interests: [], languages: [], youtubers: [] };
  }
}

export async function saveProfile(profile: Profile) {
  try {
    await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile }),
    });
  } catch {}
}
