import { Profile } from "@/types";

export async function loadProfile(): Promise<Profile> {
  try {
    const resp = await fetch("/api/profile");
    const data = await resp.json();
    // Fix: Put defaults first, then spread the actual profile data
    return {
      ...{ hobbies: [], interests: [], languages: [], youtubers: [] },
      ...data.profile,
    };
  } catch {
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
