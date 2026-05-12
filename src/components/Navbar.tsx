"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import ThemeToggle from "@/components/ThemeToggle";

export default function Navbar() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);

  return (
    <header
      style={{
        borderBottom: "1px solid var(--border)",
        backgroundColor: "var(--navbar-bg)",
        backdropFilter: "blur(14px)",
        transition: "background-color 0.3s ease",
      }}
      className="sticky top-0 z-50"
    >
      <div className="max-w-6xl mx-auto px-5 h-14 flex items-center justify-between">

        <Link href="/" style={{ fontFamily: "var(--font-bebas, 'Bebas Neue')", fontSize: 26, color: "var(--fg)", letterSpacing: "0.18em", display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <svg width="32" height="24" viewBox="0 0 32 24" fill="none" aria-hidden="true" style={{ display: "block", flexShrink: 0 }}>
            <path d="M3 20 Q16 2 29 12" stroke="var(--beach)" strokeWidth="1.5" strokeDasharray="3 3.5" strokeLinecap="round"/>
            <circle cx="3" cy="20" r="2.5" fill="var(--beach)"/>
            <circle cx="29" cy="12" r="1.8" fill="var(--beach)" opacity="0.6"/>
            <text x="16" y="10" dominantBaseline="central" textAnchor="middle" fontSize="11" fill="var(--beach)" transform="rotate(-30, 16, 10)">✈</text>
          </svg>
          WildMap
        </Link>

        <nav className="hidden md:flex items-center gap-8" style={{ fontFamily: "var(--font-bebas, 'Bebas Neue')", letterSpacing: "0.12em", fontSize: 14 }}>
          <Link href="/app" className="hover:opacity-70 transition-opacity" style={{ color: "var(--fg-2)" }}>Explore</Link>
          <Link href="/app/calendar" className="hover:opacity-70 transition-opacity" style={{ color: "var(--fg-2)" }}>One Way</Link>
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <ThemeToggle />
          {session ? (
            <>
              <Link href="/settings" className="hover:opacity-70 transition-opacity" style={{ fontFamily: "var(--font-bebas)", letterSpacing: "0.1em", fontSize: 14, color: "var(--fg-2)" }}>
                {session.user?.name?.split(" ")[0] || "Account"}
              </Link>
              <button
                onClick={() => signOut()}
                className="px-3 py-1.5 rounded-lg border transition-opacity hover:opacity-70"
                style={{ fontFamily: "var(--font-bebas)", letterSpacing: "0.1em", fontSize: 13, borderColor: "var(--border-2)", color: "var(--fg-2)" }}
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="hover:opacity-70 transition-opacity" style={{ fontFamily: "var(--font-bebas)", letterSpacing: "0.1em", fontSize: 14, color: "var(--fg-2)" }}>
                Sign in
              </Link>
              <Link href="/auth/register" className="px-4 py-1.5 rounded-lg transition-opacity hover:opacity-80 btn-primary" style={{ fontSize: 13 }}>
                Get started
              </Link>
            </>
          )}
        </div>

        <button className="md:hidden" onClick={() => setOpen(!open)} style={{ color: "var(--fg-2)" }}>
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {open && (
        <div
          className="md:hidden border-t px-5 py-4 space-y-4"
          style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-2)", fontFamily: "var(--font-bebas)", letterSpacing: "0.12em", fontSize: 15 }}
        >
          <Link href="/app" className="block" style={{ color: "var(--fg-2)" }} onClick={() => setOpen(false)}>Explore</Link>
          <Link href="/app/calendar" className="block" style={{ color: "var(--fg-2)" }} onClick={() => setOpen(false)}>One Way</Link>
          <div className="flex items-center gap-2" style={{ color: "var(--fg-2)" }}>
            <span style={{ fontFamily: "var(--font-bebas)", letterSpacing: "0.12em", fontSize: 15 }}>Theme</span>
            <ThemeToggle />
          </div>
          {session ? (
            <button onClick={() => signOut()} className="block" style={{ color: "var(--fg-2)" }}>Sign out</button>
          ) : (
            <>
              <Link href="/auth/login" className="block" style={{ color: "var(--fg-2)" }} onClick={() => setOpen(false)}>Sign in</Link>
              <Link href="/auth/register" className="block" style={{ color: "var(--beach)" }} onClick={() => setOpen(false)}>Get started</Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
