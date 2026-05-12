import FareCalendar from "@/components/FareCalendar";

export default function CalendarPage() {
  return (
    <div className="max-w-4xl mx-auto px-5 py-10">
      <div style={{ fontFamily: "var(--font-bebas)", fontSize: 11, letterSpacing: "0.3em", color: "var(--beach)", marginBottom: 8 }}>
        GOWILD PASS
      </div>
      <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 38, fontWeight: 900, color: "var(--fg)", lineHeight: 1.05, marginBottom: 6 }}>
        Explore Fares
      </h1>
      <p className="text-sm mb-8" style={{ color: "var(--fg-3)" }}>
        Pick a route and a start date, then tap any day to book on Frontier.
      </p>
      <FareCalendar />
    </div>
  );
}
