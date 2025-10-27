import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SidebarLink from "./(components)/SidebarLink";
import Link from "next/link";
import { Toaster } from "sonner";
import { LikesSavesProvider } from "@/contexts/LikesSavesContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  fallback: ["Arial", "Times New Roman"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Maintain - AI Content Recommendations",
  description: "Get personalized video, article, and podcast recommendations based on your mood and interests",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geistSans.className} ${geistMono.className} antialiased`}>
        <LikesSavesProvider>
          <Toaster position="top-right" richColors />
          <div className="min-h-screen grid grid-cols-[72px_1fr] md:grid-cols-[260px_1fr]">
            <aside className="border-r border-black/10 dark:border-white/10 p-2 md:p-4 sticky top-0 h-svh">
              {/* Sidebar */}
              <nav className="flex flex-col gap-3 h-full">
                <Link href="/" className="text-xl font-semibold mt-2">
                  Maintain
                </Link>
                              <div className="flex-1 overflow-auto mt-6">
                <ul className="text-sm space-y-4 ">
                  <li>
                    <SidebarLink href="/">Chat</SidebarLink>
                  </li>
                  <li>
                    <SidebarLink href="/trending">Trending</SidebarLink>
                  </li>
                  <li>
                    <SidebarLink href="/history">History</SidebarLink>
                  </li>
                  <li>
                    <SidebarLink href="/saves">Saves</SidebarLink>
                  </li>
                  <li>
                    <SidebarLink href="/settings">Settings</SidebarLink>
                  </li>
                </ul>
              </div>
                <div className="text-xs text-foreground/60">AI Suggestions</div>
              </nav>
            </aside>
            <main className="min-h-svh">{children}</main>
          </div>
        </LikesSavesProvider>
      </body>
    </html>
  );
}
