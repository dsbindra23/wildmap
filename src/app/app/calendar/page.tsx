import FareCalendar from "@/components/FareCalendar";

export default function CalendarPage() {
  return (
    <div className="max-w-4xl mx-auto px-5 py-10">
      <h1 className="text-2xl font-semibold mb-1" style={{ color: "var(--fg)" }}>Fare calendar</h1>
      <p className="text-sm mb-6" style={{ color: "var(--fg-3)" }}>
        Browse a month of dates at once and find the cheapest days to fly your route.
      </p>
      <FareCalendar />
    </div>
  );
}
