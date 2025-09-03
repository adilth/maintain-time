"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
export default function SidebarLink({ href, children }: { href: string; children: React.ReactNode }) {
    const pathname = usePathname();
    const isActive = pathname === href;
  
    return (
      <Link
        href={href}
        className={`text-lg hover:underline ${
          isActive ? "font-bold text-blue-600 dark:text-blue-400" : "text-foreground"
        }`}
      >
        {children}
      </Link>
    );
  }