"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Menu, X } from "lucide-react";
import { useState } from "react";

export default function Navbar() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);

  return (
    <header
      style={{
        borderBottom: "1px solid var(--border)",
        backgroundColor: "rgba(6,13,26,0.92)",
        backdropFilter: "blur(12px)",
      }}
      className="sticky top-0 z-50"
    >
      <div className="max-w-6xl mx-auto px-5 h-14 flex items-center justify-between">

        <Link href="/" style={{ fontFamily: "var(--font-bebas, 'Bebas Neue')", fontSize: 22, color: "var(--fg)", letterSpacing: "0.15em" }}>
          WildMap
        </Link>

        <nav className="hidden md:flex items-center gap-8" style={{ fontFamily: "var(--font-bebas, 'Bebas Neue')", letterSpacing: "0.12em", fontSize: 14 }}>
          <Link href="/app" className="hover:opacity-70 transition-opacity" style={{ color: "var(--fg-2)" }}>Destinations</Link>
          <Link href="/app/calendar" className="hover:opacity-70 transition-opacity" style={{ color: "var(--fg-2)" }}>Explore</Link>
          <Link href="/faq" className="hover:opacity-70 transition-opacity" style={{ color: "var(--fg-2)" }}>FAQ</Link>
        </nav>

        <div className="hidden md:flex items-center gap-3">
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
          <Link href="/app" className="block" style={{ color: "var(--fg-2)" }} onClick={() => setOpen(false)}>Destinations</Link>
          <Link href="/app/calendar" className="block" style={{ color: "var(--fg-2)" }} onClick={() => setOpen(false)}>Explore</Link>
          <Link href="/faq" className="block" style={{ color: "var(--fg-2)" }} onClick={() => setOpen(false)}>FAQ</Link>
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
