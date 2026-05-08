import OriginSearch from "@/components/OriginSearch";
import Link from "next/link";

export default function Home() {
  return (
    <div>
      {/* Hero — fully centered */}
      <section className="flex flex-col items-center text-center px-5 pt-28 pb-24">
        <p className="text-xs font-medium uppercase tracking-widest mb-5" style={{ color: "var(--fg-3)" }}>
          Frontier GoWild Pass
        </p>
        <h1
          className="text-5xl sm:text-6xl font-bold tracking-tight mb-5 leading-tight"
          style={{ color: "var(--fg)" }}
        >
          Explore where<br />you can fly
        </h1>
        <p
          className="text-base max-w-sm mb-10 leading-relaxed"
          style={{ color: "var(--fg-2)" }}
        >
          Enter your departure city and see every destination reachable with your GoWild pass.
        </p>
        <div className="w-full max-w-md">
          <OriginSearch />
        </div>
      </section>

      {/* Two feature links */}
      <div style={{ borderTop: "1px solid var(--border)" }}>
        <div className="max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-px" style={{ backgroundColor: "var(--border)" }}>
          {[
            {
              href: "/app/map",
              label: "Destination map",
              desc: "Every airport you can reach, plotted live with current fares.",
            },
            {
              href: "/app/calendar",
              label: "Fare calendar",
              desc: "Browse 28 days at a glance and find the cheapest dates to fly.",
            },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block p-8 text-center transition-opacity hover:opacity-70"
              style={{ backgroundColor: "var(--bg)" }}
            >
              <div className="text-sm font-semibold mb-1.5" style={{ color: "var(--fg)" }}>
                {item.label} →
              </div>
              <p className="text-sm leading-relaxed" style={{ color: "var(--fg-3)" }}>
                {item.desc}
              </p>
            </Link>
          ))}
        </div>
      </div>

      {/* Bottom CTA — centered */}
      <div style={{ borderTop: "1px solid var(--border)" }}>
        <div className="flex flex-col items-center text-center px-5 py-16 gap-4">
          <div className="font-semibold text-base" style={{ color: "var(--fg)" }}>Free to use</div>
          <p className="text-sm max-w-xs" style={{ color: "var(--fg-3)" }}>
            No subscription needed. Create an account to save your home airport.
          </p>
          <Link
            href="/auth/register"
            className="mt-1 px-5 py-2.5 rounded-lg text-sm font-medium btn-primary transition-opacity hover:opacity-80"
          >
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
}
