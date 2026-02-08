"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Navigation() {
  const pathname = usePathname();

  const navItems = [
    { name: "entries", href: "/entries" },
    { name: "people", href: "/people" },
    { name: "threads", href: "/threads" },
    { name: "search", href: "/search" },
  ];

  return (
    <nav className="border-b border-border bg-bg-secondary/50 backdrop-blur-sm sticky top-0 z-40">
      <div className="max-w-5xl mx-auto px-6">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-8">
            <Link href="/entries" className="text-accent font-mono text-sm tracking-tight font-semibold">
              reflectify
            </Link>
            <div className="flex gap-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                      isActive
                        ? "text-accent bg-accent-muted"
                        : "text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
          <form action="/auth/sign-out" method="POST">
            <button
              type="submit"
              className="text-xs text-text-tertiary hover:text-text-secondary transition-colors px-3 py-1.5 rounded-md"
            >
              sign out
            </button>
          </form>
        </div>
      </div>
    </nav>
  );
}
