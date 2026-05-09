import Link from "next/link";

export default function Footer() {
  return (
    <footer style={{ borderTop: "1px solid var(--border)", backgroundColor: "var(--bg-2)" }}>
      <div className="max-w-6xl mx-auto px-5 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <div className="mb-1" style={{ fontFamily: "var(--font-bebas)", letterSpacing: "0.15em", fontSize: 18, color: "var(--fg)" }}>WildMap</div>
          <p className="text-xs max-w-xs leading-relaxed" style={{ color: "var(--fg-3)" }}>
            Not affiliated with Frontier Airlines. Fares shown are estimates — always verify at flyfrontier.com.
          </p>
        </div>
        <nav className="flex flex-wrap gap-6" style={{ fontFamily: "var(--font-bebas)", letterSpacing: "0.1em", fontSize: 13, color: "var(--fg-3)" }}>
          <Link href="/app" className="hover:opacity-70 transition-opacity">Explore</Link>
          <Link href="/app/map" className="hover:opacity-70 transition-opacity">Map</Link>
          <Link href="/app/calendar" className="hover:opacity-70 transition-opacity">Calendar</Link>
          <Link href="/faq" className="hover:opacity-70 transition-opacity">FAQ</Link>
          <Link href="/settings" className="hover:opacity-70 transition-opacity">Settings</Link>
        </nav>
      </div>
    </footer>
  );
}
