"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useTheme } from "@/components/ThemeProvider";
import { Sun, Moon, Menu, X } from "lucide-react";
import { useState } from "react";

export default function Navbar() {
  const { data: session } = useSession();
  const { theme, toggle } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <header style={{ borderBottom: "1px solid var(--border)", backgroundColor: "var(--bg)" }} className="sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-5 h-14 flex items-center justify-between">

        <Link href="/" className="font-semibold text-base tracking-tight" style={{ color: "var(--fg)" }}>
          WildMap
        </Link>

        <nav className="hidden md:flex items-center gap-7 text-sm" style={{ color: "var(--fg-2)" }}>
          <Link href="/app" className="hover:opacity-70 transition-opacity">Explore</Link>
          <Link href="/app/map" className="hover:opacity-70 transition-opacity">Map</Link>
          <Link href="/app/calendar" className="hover:opacity-70 transition-opacity">Calendar</Link>
          <Link href="/faq" className="hover:opacity-70 transition-opacity">FAQ</Link>
        </nav>

        <div className="flex items-center gap-3">
          <button
            onClick={toggle}
            aria-label="Toggle theme"
            className="w-8 h-8 flex items-center justify-center rounded-lg transition-opacity hover:opacity-70"
            style={{ color: "var(--fg-3)" }}
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <div className="hidden md:flex items-center gap-3 text-sm">
            {session ? (
              <>
                <Link href="/settings" className="hover:opacity-70 transition-opacity" style={{ color: "var(--fg-2)" }}>
                  {session.user?.name?.split(" ")[0] || "Account"}
                </Link>
                <button
                  onClick={() => signOut()}
                  className="px-3 py-1.5 rounded-lg text-sm border transition-opacity hover:opacity-70"
                  style={{ borderColor: "var(--border)", color: "var(--fg-2)" }}
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="hover:opacity-70 transition-opacity" style={{ color: "var(--fg-2)" }}>
                  Sign in
                </Link>
                <Link
                  href="/auth/register"
                  className="px-3 py-1.5 rounded-lg text-sm font-medium transition-opacity hover:opacity-80 btn-primary"
                >
                  Get started
                </Link>
              </>
            )}
          </div>

          <button className="md:hidden" onClick={() => setOpen(!open)} style={{ color: "var(--fg-2)" }}>
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t px-5 py-4 space-y-3 text-sm" style={{ borderColor: "var(--border)", backgroundColor: "var(--bg)" }}>
          <Link href="/app" className="block" style={{ color: "var(--fg-2)" }} onClick={() => setOpen(false)}>Explore</Link>
          <Link href="/app/map" className="block" style={{ color: "var(--fg-2)" }} onClick={() => setOpen(false)}>Map</Link>
          <Link href="/app/calendar" className="block" style={{ color: "var(--fg-2)" }} onClick={() => setOpen(false)}>Calendar</Link>
          <Link href="/faq" className="block" style={{ color: "var(--fg-2)" }} onClick={() => setOpen(false)}>FAQ</Link>
          {session ? (
            <button onClick={() => signOut()} className="block" style={{ color: "var(--fg-2)" }}>Sign out</button>
          ) : (
            <>
              <Link href="/auth/login" className="block" style={{ color: "var(--fg-2)" }} onClick={() => setOpen(false)}>Sign in</Link>
              <Link href="/auth/register" className="block font-medium" style={{ color: "var(--fg)" }} onClick={() => setOpen(false)}>Get started</Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
