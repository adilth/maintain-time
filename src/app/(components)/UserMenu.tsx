"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function UserMenu({ userName }: { userName?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
      setLoading(false);
    }
  }

  if (!userName) {
    return (
      <div className="text-xs space-y-2">
        <a
          href="/login"
          className="block px-3 py-2 rounded-md hover:bg-black/5 dark:hover:bg-white/10 text-center"
        >
          Login
        </a>
        <a
          href="/signup"
          className="block px-3 py-2 rounded-md bg-foreground text-background hover:opacity-90 text-center"
        >
          Sign up
        </a>
      </div>
    );
  }

  return (
    <div className="text-xs space-y-2">
      <div className="px-3 py-2 text-foreground/60 truncate">
        {userName}
      </div>
      <button
        onClick={handleLogout}
        disabled={loading}
        className="w-full px-3 py-2 rounded-md hover:bg-black/5 dark:hover:bg-white/10 text-left disabled:opacity-50"
      >
        {loading ? "Logging out..." : "Logout"}
      </button>
    </div>
  );
}
