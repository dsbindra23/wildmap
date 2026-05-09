import OriginSearch from "@/components/OriginSearch";
import Link from "next/link";

const FEATURES = [
  {
    href: "/app",
    color: "var(--beach)",
    label: "Explore",
    desc: "Search flights from any GoWild city to any destination.",
  },
  {
    href: "/app/map",
    color: "var(--mountain)",
    label: "Destination Map",
    desc: "Every airport you can reach, plotted live with current fares.",
  },
  {
    href: "/app/calendar",
    color: "var(--city)",
    label: "Fare Calendar",
    desc: "Browse 28 days at a glance and find the cheapest dates to fly.",
  },
  {
    href: "/gowild-destinations.html",
    color: "var(--desert)",
    label: "All Destinations",
    desc: "Every GoWild destination filtered by vibe — beach, mountain, city and more.",
  },
];

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <section
        className="flex flex-col items-center text-center px-5 pt-24 pb-16"
        style={{ borderBottom: "1px solid var(--border)", background: "linear-gradient(180deg, rgba(0,212,180,0.05) 0%, transparent 100%)" }}
      >
        <p style={{ fontFamily: "var(--font-bebas)", fontSize: 11, letterSpacing: "0.35em", color: "var(--beach)", marginBottom: 18, opacity: 0.9 }}>
          GoWild Pass — Unofficial Companion
        </p>
        <h1
          style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(42px, 8vw, 80px)", fontWeight: 900, lineHeight: 1.05, color: "var(--fg)", marginBottom: 18 }}
        >
          Every Destination,<br />One Pass
        </h1>
        <p className="text-sm max-w-sm leading-relaxed mb-10" style={{ color: "var(--fg-2)" }}>
          Search every Frontier GoWild flight, browse 28-day fare calendars, and book in one tap.
        </p>
        <div className="w-full max-w-md">
          <OriginSearch />
        </div>
      </section>

      {/* Feature cards */}
      <div className="max-w-4xl mx-auto px-5 py-14 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {FEATURES.map((f) => (
          <Link
            key={f.href}
            href={f.href}
            className="block rounded-xl border p-6 transition-all hover:opacity-80"
            style={{ borderColor: "var(--border)", borderLeftColor: f.color, borderLeftWidth: 4, backgroundColor: "var(--bg-2)" }}
          >
            <div style={{ fontFamily: "var(--font-bebas)", letterSpacing: "0.12em", fontSize: 16, color: f.color, marginBottom: 6 }}>
              {f.label} →
            </div>
            <p className="text-sm leading-relaxed" style={{ color: "var(--fg-3)" }}>{f.desc}</p>
          </Link>
        ))}
      </div>

      {/* CTA strip */}
      <div style={{ borderTop: "1px solid var(--border)", backgroundColor: "var(--bg-2)" }}>
        <div className="flex flex-col items-center text-center px-5 py-14 gap-4">
          <p style={{ fontFamily: "var(--font-bebas)", fontSize: 11, letterSpacing: "0.3em", color: "var(--beach)" }}>Free to use</p>
          <h2 style={{ fontFamily: "var(--font-serif)", fontSize: 32, fontWeight: 700, color: "var(--fg)", lineHeight: 1.1 }}>
            Save your home airport
          </h2>
          <p className="text-sm max-w-xs" style={{ color: "var(--fg-3)" }}>
            Create a free account to save your departure city and preferences.
          </p>
          <Link
            href="/auth/register"
            className="mt-2 px-6 py-2.5 rounded-lg btn-primary transition-opacity hover:opacity-80"
            style={{ fontSize: 14 }}
          >
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
}
