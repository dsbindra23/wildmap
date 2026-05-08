import Link from "next/link";

export default function Footer() {
  return (
    <footer style={{ borderTop: "1px solid var(--border)", backgroundColor: "var(--bg)" }}>
      <div className="max-w-6xl mx-auto px-5 py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <div className="font-semibold text-sm mb-1" style={{ color: "var(--fg)" }}>WildMap</div>
          <p className="text-xs max-w-xs leading-relaxed" style={{ color: "var(--fg-3)" }}>
            An independent tool for Frontier GoWild pass holders. Not affiliated with Frontier Airlines.
          </p>
        </div>
        <nav className="flex flex-wrap gap-5 text-xs" style={{ color: "var(--fg-3)" }}>
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
