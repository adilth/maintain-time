import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUserById } from "@/lib/auth";
import { updateUserProfile } from "@/lib/db";
import type { Profile } from "@/types";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;

    if (!userId) {
      return new Response(JSON.stringify({ profile: {} }));
    }

    const user = await getUserById(userId);
    
    if (!user || !user.profile) {
      return new Response(JSON.stringify({ profile: {} }));
    }

    // Convert database format to app format
    const profile: Profile = {
      name: user.name || undefined,
      hobbies: user.profile.hobbies,
      interests: user.profile.interests,
      languages: user.profile.languages,
      workContext: user.profile.workContext || undefined,
      youtubers: user.profile.youtubers as any || undefined,
    };

    return new Response(JSON.stringify({ profile }));
  } catch (error) {
    console.error("Error getting profile:", error);
    return new Response(JSON.stringify({ profile: {} }));
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const profile: Profile | undefined = body?.profile;
    
    if (!profile) {
      return new Response(
        JSON.stringify({ ok: false, error: "missing profile" }),
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;

    if (!userId) {
      return new Response(
        JSON.stringify({ ok: false, error: "Not authenticated" }),
        { status: 401 }
      );
    }

    // Update profile in database
    await updateUserProfile(userId, {
      hobbies: profile.hobbies,
      interests: profile.interests,
      languages: profile.languages,
      workContext: profile.workContext,
      youtubers: profile.youtubers,
    });

    return new Response(JSON.stringify({ ok: true }));
  } catch (error) {
    console.error("Error updating profile:", error);
    return new Response(
      JSON.stringify({ ok: false, error: "Failed to update profile" }),
      { status: 500 }
    );
  }
}
