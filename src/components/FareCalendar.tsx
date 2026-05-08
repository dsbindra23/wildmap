"use client";

import { useState } from "react";
import { formatPrice } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface DayFare { date: string; price: string | null; currency: string; }

const AIRPORTS = ["JFK","LAX","ORD","DEN","MIA","ATL","DFW","SFO","LAS","SEA","BOS","PHX","MCO","CLT","DCA"];

function priceColor(price: string | null, min: number, max: number) {
  if (!price) return { backgroundColor: "var(--bg-3)", color: "var(--fg-3)", borderColor: "var(--border)" };
  const ratio = (parseFloat(price) - min) / (max - min || 1);
  if (ratio < 0.33) return { backgroundColor: "#d1fae5", color: "#065f46", borderColor: "#6ee7b7" };
  if (ratio < 0.66) return { backgroundColor: "#fef9c3", color: "#713f12", borderColor: "#fde047" };
  return { backgroundColor: "#fee2e2", color: "#991b1b", borderColor: "#fca5a5" };
}

export default function FareCalendar() {
  const [origin, setOrigin] = useState("JFK");
  const [destination, setDestination] = useState("LAX");
  const [fares, setFares] = useState<DayFare[]>([]);
  const [loading, setLoading] = useState(false);

  const search = async () => {
    setLoading(true);
    const today = new Date();
    const dates = Array.from({ length: 28 }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() + i + 1);
      return d.toISOString().split("T")[0];
    });

    const batches = [dates.slice(0, 7), dates.slice(7, 14), dates.slice(14, 21), dates.slice(21)];
    const allFares: DayFare[] = [];

    for (const batch of batches) {
      const results = await Promise.allSettled(
        batch.map((date) =>
          fetch("/api/flights/search", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ origin, destination, date, passengers: 1 }),
          }).then((r) => r.json())
        )
      );
      batch.forEach((date, i) => {
        const r = results[i];
        if (r.status === "fulfilled" && r.value.results?.length) {
          const min = r.value.results.reduce(
            (m: { price: string; currency: string }, f: { price: string; currency: string }) =>
              parseFloat(f.price) < parseFloat(m.price) ? f : m,
            r.value.results[0]
          );
          allFares.push({ date, price: min.price, currency: min.currency });
        } else {
          allFares.push({ date, price: null, currency: "USD" });
        }
      });
    }

    setFares(allFares);
    setLoading(false);
  };

  const prices = fares.filter((f) => f.price).map((f) => parseFloat(f.price!));
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const weeks: DayFare[][] = [];
  for (let i = 0; i < fares.length; i += 7) weeks.push(fares.slice(i, i + 7));
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const selectStyle = {
    borderColor: "var(--border)",
    backgroundColor: "var(--bg-2)",
    color: "var(--fg)",
    borderRadius: "0.5rem",
    padding: "6px 10px",
    fontSize: 13,
    outline: "none",
    border: "1px solid var(--border)",
  };

  return (
    <div>
      <div
        className="flex flex-wrap gap-3 items-end p-5 rounded-xl border mb-6"
        style={{ borderColor: "var(--border)", backgroundColor: "var(--bg)" }}
      >
        <div>
          <label className="block text-xs mb-1" style={{ color: "var(--fg-3)" }}>From</label>
          <select value={origin} onChange={(e) => setOrigin(e.target.value)} style={selectStyle}>
            {AIRPORTS.map((a) => <option key={a}>{a}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs mb-1" style={{ color: "var(--fg-3)" }}>To</label>
          <select value={destination} onChange={(e) => setDestination(e.target.value)} style={selectStyle}>
            {AIRPORTS.filter((a) => a !== origin).map((a) => <option key={a}>{a}</option>)}
          </select>
        </div>
        <button
          onClick={search}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium btn-primary disabled:opacity-50"
        >
          {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          {loading ? "Loading..." : "Show calendar"}
        </button>
      </div>

      {loading && (
        <div className="py-16 flex flex-col items-center gap-3" style={{ color: "var(--fg-3)" }}>
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="text-sm">Checking 28 days of fares...</span>
        </div>
      )}

      {!loading && fares.length > 0 && (
        <div className="rounded-xl border p-5" style={{ borderColor: "var(--border)", backgroundColor: "var(--bg)" }}>
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium" style={{ color: "var(--fg)" }}>
              {origin} → {destination}
            </span>
            <div className="flex items-center gap-4 text-xs" style={{ color: "var(--fg-3)" }}>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm inline-block bg-green-200" /> Cheapest</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm inline-block bg-yellow-200" /> Mid</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm inline-block bg-red-200" /> Priciest</span>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-0.5 mb-1">
            {days.map((d) => (
              <div key={d} className="text-center text-xs pb-1" style={{ color: "var(--fg-3)" }}>{d}</div>
            ))}
          </div>
          {weeks.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7 gap-0.5 mb-0.5">
              {week.map((day) => {
                const d = new Date(day.date + "T12:00:00");
                const style = priceColor(day.price, min, max);
                return (
                  <a
                    key={day.date}
                    href={day.price ? `/app?origin=${origin}` : undefined}
                    className="rounded-md border p-1.5 text-center text-xs transition-opacity hover:opacity-80"
                    style={{ ...style, border: `1px solid ${style.borderColor}` }}
                  >
                    <div className="font-medium">{d.getDate()}</div>
                    <div className="text-xs mt-0.5 truncate" style={{ fontSize: 10 }}>
                      {day.price ? formatPrice(day.price, day.currency) : "—"}
                    </div>
                  </a>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {!loading && fares.length === 0 && (
        <div className="py-16 text-center">
          <div className="text-3xl mb-3">📅</div>
          <div className="text-sm" style={{ color: "var(--fg-3)" }}>
            Select a route above and click Show calendar
          </div>
        </div>
      )}
    </div>
  );
}
