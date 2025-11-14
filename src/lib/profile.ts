import { Profile } from "@/types";

/**
 * Client-side function to load user profile from API
 * Works in client components (browser)
 */
export async function loadProfile(): Promise<Profile> {
  try {
    const response = await fetch("/api/profile", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    
    if (!response.ok) {
      return { hobbies: [], interests: [], languages: [], youtubers: [] };
    }
    
    const data = await response.json();
    const profile = data.profile as Profile | undefined;
    
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
      credentials: "include",
      body: JSON.stringify({ profile }),
    });
  } catch (err) {
    console.error("Error saving profile:", err);
  }
}
