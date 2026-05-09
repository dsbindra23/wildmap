"use client";

import { useState, useRef, useEffect } from "react";
import { formatPrice } from "@/lib/utils";
import { Loader2, Search } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";

interface DayFare { date: string; price: string | null; currency: string; }
interface Airport { iataCode: string; city: string; name: string; }

function AirportInput({ label, defaultValue, onSelect }: {
  label: string;
  defaultValue: string;
  onSelect: (iata: string, city: string) => void;
}) {
  const [query, setQuery] = useState(defaultValue);
  const [results, setResults] = useState<Airport[]>([]);
  const [open, setOpen] = useState(false);
  const timeout = useRef<NodeJS.Timeout | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleChange = (q: string) => {
    setQuery(q);
    if (timeout.current) clearTimeout(timeout.current);
    if (q.length < 2) { setResults([]); setOpen(false); return; }
    timeout.current = setTimeout(async () => {
      const res = await fetch(`/api/airports/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data.results || []);
      setOpen(true);
    }, 280);
  };

  const pick = (r: Airport) => {
    setQuery(`${r.city} (${r.iataCode})`);
    onSelect(r.iataCode, r.city);
    setOpen(false);
    setResults([]);
  };

  return (
    <div className="relative" ref={ref}>
      <label className="block text-xs mb-1.5" style={{ color: "var(--fg-3)" }}>{label}</label>
      <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg border"
        style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-2)" }}>
        <Search className="w-3 h-3 shrink-0" style={{ color: "var(--fg-3)" }} />
        <input
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="City or airport..."
          className="bg-transparent outline-none text-sm w-40"
          style={{ color: "var(--fg)" }}
          onFocus={() => results.length > 0 && setOpen(true)}
        />
      </div>
      {open && results.length > 0 && (
        <div className="absolute z-50 top-full mt-1 w-60 rounded-xl border shadow-lg overflow-hidden"
          style={{ borderColor: "var(--border)", backgroundColor: "var(--bg)" }}>
          {results.map((r) => (
            <button key={r.iataCode} type="button" onClick={() => pick(r)}
              className="w-full text-left px-3 py-2.5 text-xs flex items-center gap-2 hover:opacity-70 transition-opacity border-b last:border-0"
              style={{ borderColor: "var(--border)", color: "var(--fg)" }}>
              <span className="font-bold w-8 shrink-0">{r.iataCode}</span>
              <span style={{ color: "var(--fg-2)" }}>{r.city}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function priceColor(price: string | null, min: number, max: number, dark: boolean) {
  if (!price) return {
    backgroundColor: "var(--bg-3)",
    color: "var(--fg-3)",
    borderColor: "var(--border)",
  };
  const ratio = (parseFloat(price) - min) / (max - min || 1);
  if (ratio < 0.33) return {
    backgroundColor: dark ? "rgba(34,197,94,0.12)" : "rgba(34,197,94,0.14)",
    color: dark ? "#4ade80" : "#15803d",
    borderColor: dark ? "rgba(34,197,94,0.28)" : "rgba(34,197,94,0.35)",
  };
  if (ratio < 0.66) return {
    backgroundColor: dark ? "rgba(245,158,11,0.12)" : "rgba(245,158,11,0.14)",
    color: dark ? "#fbbf24" : "#92400e",
    borderColor: dark ? "rgba(245,158,11,0.28)" : "rgba(245,158,11,0.35)",
  };
  return {
    backgroundColor: dark ? "rgba(239,68,68,0.12)" : "rgba(239,68,68,0.14)",
    color: dark ? "#f87171" : "#991b1b",
    borderColor: dark ? "rgba(239,68,68,0.28)" : "rgba(239,68,68,0.35)",
  };
}

export default function FareCalendar() {
  const { theme } = useTheme();
  const dark = theme === "dark";

  const [origin, setOrigin] = useState({ iata: "JFK", city: "New York" });
  const [destination, setDestination] = useState({ iata: "LAX", city: "Los Angeles" });
  const [fares, setFares] = useState<DayFare[]>([]);
  const [loading, setLoading] = useState(false);

  const search = async () => {
    if (!origin.iata || !destination.iata) return;
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
            body: JSON.stringify({ origin: origin.iata, destination: destination.iata, date, passengers: 1 }),
          }).then((r) => r.json())
        )
      );
      batch.forEach((date, i) => {
        const r = results[i];
        if (r.status === "fulfilled" && r.value.results?.length) {
          const cheapest = r.value.results.reduce(
            (m: { price: string; currency: string }, f: { price: string; currency: string }) =>
              parseFloat(f.price) < parseFloat(m.price) ? f : m,
            r.value.results[0]
          );
          allFares.push({ date, price: cheapest.price, currency: cheapest.currency });
        } else {
          allFares.push({ date, price: null, currency: "USD" });
        }
      });
    }

    setFares(allFares);
    setLoading(false);
  };

  const prices = fares.filter((f) => f.price).map((f) => parseFloat(f.price!));
  const min = prices.length ? Math.min(...prices) : 0;
  const max = prices.length ? Math.max(...prices) : 0;
  const weeks: DayFare[][] = [];
  for (let i = 0; i < fares.length; i += 7) weeks.push(fares.slice(i, i + 7));
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const swatchStyle = (type: "green" | "yellow" | "red") => ({
    width: 10,
    height: 10,
    borderRadius: 2,
    display: "inline-block",
    backgroundColor: dark
      ? type === "green" ? "rgba(34,197,94,0.3)" : type === "yellow" ? "rgba(245,158,11,0.3)" : "rgba(239,68,68,0.3)"
      : type === "green" ? "rgba(34,197,94,0.4)" : type === "yellow" ? "rgba(245,158,11,0.4)" : "rgba(239,68,68,0.4)",
  });

  return (
    <div>
      {/* Controls */}
      <div className="flex flex-wrap gap-4 items-end p-5 rounded-xl border mb-6"
        style={{ borderColor: "var(--border)", backgroundColor: "var(--bg)" }}>
        <AirportInput
          label="From"
          defaultValue={`${origin.city} (${origin.iata})`}
          onSelect={(iata, city) => setOrigin({ iata, city })}
        />
        <AirportInput
          label="To"
          defaultValue={`${destination.city} (${destination.iata})`}
          onSelect={(iata, city) => setDestination({ iata, city })}
        />
        <div style={{ paddingTop: 20 }}>
          <button
            onClick={search}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium btn-primary disabled:opacity-50"
          >
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {loading ? "Loading..." : "Show calendar"}
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="py-16 flex flex-col items-center gap-3" style={{ color: "var(--fg-3)" }}>
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="text-sm">Checking 28 days of fares...</span>
        </div>
      )}

      {/* Calendar grid */}
      {!loading && fares.length > 0 && (
        <div className="rounded-xl border p-5" style={{ borderColor: "var(--border)", backgroundColor: "var(--bg)" }}>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <span className="text-sm font-medium" style={{ color: "var(--fg)" }}>
              {origin.iata} → {destination.iata}
            </span>
            <div className="flex items-center gap-4 text-xs" style={{ color: "var(--fg-3)" }}>
              <span className="flex items-center gap-1.5"><span style={swatchStyle("green")} />Cheapest</span>
              <span className="flex items-center gap-1.5"><span style={swatchStyle("yellow")} />Mid</span>
              <span className="flex items-center gap-1.5"><span style={swatchStyle("red")} />Priciest</span>
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
                const cs = priceColor(day.price, min, max, dark);
                const bookUrl = day.price
                  ? `https://www.flyfrontier.com/flights/search?origin=${origin.iata}&destination=${destination.iata}&departDate=${day.date}&adults=1`
                  : undefined;
                return (
                  <a
                    key={day.date}
                    href={bookUrl}
                    target={bookUrl ? "_blank" : undefined}
                    rel={bookUrl ? "noopener noreferrer" : undefined}
                    className="rounded-md p-1.5 text-center text-xs transition-opacity hover:opacity-80"
                    style={{
                      backgroundColor: cs.backgroundColor,
                      color: cs.color,
                      border: `1px solid ${cs.borderColor}`,
                      cursor: bookUrl ? "pointer" : "default",
                    }}
                  >
                    <div className="font-medium">{d.getDate()}</div>
                    <div style={{ fontSize: 10, marginTop: 2 }} className="truncate">
                      {day.price ? formatPrice(day.price, day.currency) : "—"}
                    </div>
                  </a>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
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
