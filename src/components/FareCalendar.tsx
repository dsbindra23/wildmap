"use client";

import { useState, useRef, useEffect } from "react";
import type { SearchResult } from "@/lib/duffel";
import { formatTime, formatDuration, formatPrice } from "@/lib/utils";
import { Loader2, Search, ArrowLeftRight, ChevronDown } from "lucide-react";

interface DayFare { date: string; price: string | null; currency: string; }
interface Airport { iataCode: string; city: string; name: string; }

type FareFilter = "all" | "gowild" | "discountden";

const FILTER_TABS: { id: FareFilter; label: string }[] = [
  { id: "all", label: "All Flights" },
  { id: "gowild", label: "GoWild ($20–$150)" },
  { id: "discountden", label: "Discount Den (under $60)" },
];

function AirportInput({ label, placeholder, onSelect }: {
  label: string;
  placeholder: string;
  onSelect: (iata: string, city: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Airport[]>([]);
  const [open, setOpen] = useState(false);
  const timeout = useRef<NodeJS.Timeout | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
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
    <div className="relative flex-1" ref={ref}>
      <label style={{ fontFamily: "var(--font-bebas)", fontSize: 10, letterSpacing: "0.25em", color: "var(--fg-3)", display: "block", marginBottom: 6 }}>{label}</label>
      <div className="flex items-center gap-2 px-3 py-3 rounded-lg border" style={{ borderColor: "var(--border-2)", backgroundColor: "var(--bg-3)" }}>
        <Search className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--fg-3)" }} />
        <input
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-transparent outline-none text-sm"
          style={{ color: "var(--fg)" }}
          onFocus={() => results.length > 0 && setOpen(true)}
        />
      </div>
      {open && results.length > 0 && (
        <div className="absolute z-50 top-full mt-1 w-full rounded-xl overflow-hidden shadow-xl"
          style={{ backgroundColor: "var(--bg-2)", border: "1px solid var(--border-2)" }}>
          {results.map((r) => (
            <button key={r.iataCode} type="button" onClick={() => pick(r)}
              className="w-full text-left px-4 py-3 flex items-center gap-3 hover:opacity-70 transition-opacity border-b last:border-0"
              style={{ borderColor: "var(--border)", color: "var(--fg)" }}>
              <span style={{ fontFamily: "var(--font-bebas)", letterSpacing: "0.1em", fontSize: 16, width: 36, flexShrink: 0, color: "var(--beach)" }}>{r.iataCode}</span>
              <span style={{ color: "var(--fg-2)", fontSize: 14 }}>{r.city}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function priceColor(price: string | null, min: number, max: number) {
  if (!price) return { backgroundColor: "var(--bg-3)", color: "var(--fg-3)", borderColor: "var(--border)" };
  const ratio = (parseFloat(price) - min) / (max - min || 1);
  if (ratio < 0.33) return { backgroundColor: "rgba(0,212,180,0.1)", color: "#00d4b4", borderColor: "rgba(0,212,180,0.25)" };
  if (ratio < 0.66) return { backgroundColor: "rgba(245,176,65,0.1)", color: "#f5b041", borderColor: "rgba(245,176,65,0.25)" };
  return { backgroundColor: "rgba(239,68,68,0.1)", color: "#f87171", borderColor: "rgba(239,68,68,0.25)" };
}

function applyFilter(fares: DayFare[], filter: FareFilter): DayFare[] {
  if (filter === "all") return fares;
  return fares.map((f) => {
    if (!f.price) return f;
    const p = parseFloat(f.price);
    if (filter === "discountden" && p > 60) return { ...f, price: null };
    if (filter === "gowild" && (p < 20 || p > 150)) return { ...f, price: null };
    return f;
  });
}

function FlightResultCard({ flight, originIata, destIata }: { flight: SearchResult; originIata: string; destIata: string }) {
  const date = flight.departureTime.split("T")[0];
  const bookUrl = `https://www.flyfrontier.com/flights/search?origin=${originIata}&destination=${destIata}&departDate=${date}&adults=1`;
  const stops = flight.stops === 0 ? "Nonstop" : `${flight.stops} stop${flight.stops > 1 ? "s" : ""}`;

  return (
    <div className="flex items-center gap-4 px-5 py-4 rounded-xl"
      style={{ backgroundColor: "var(--bg-2)", border: "1px solid var(--border)" }}>
      <div className="flex-1 flex items-center gap-3 min-w-0">
        <div className="text-center shrink-0">
          <div style={{ fontFamily: "var(--font-bebas)", fontSize: 20, letterSpacing: "0.06em", color: "var(--fg)", lineHeight: 1 }}>{flight.origin}</div>
          <div style={{ fontSize: 13, color: "var(--fg-2)", marginTop: 2 }}>{formatTime(flight.departureTime)}</div>
        </div>
        <div className="flex-1 flex flex-col items-center gap-1">
          <div style={{ fontSize: 12, color: "var(--fg-3)" }}>{formatDuration(flight.duration, flight.departureTime, flight.arrivalTime)}</div>
          <div className="w-full flex items-center gap-1">
            <div className="flex-1 h-px" style={{ backgroundColor: "var(--border-2)" }} />
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "var(--beach)" }} />
          </div>
          <div style={{ fontSize: 11, color: "var(--fg-3)" }}>
            {stops}{flight.airlineCode ? ` · ${flight.airlineCode}` : ""}
          </div>
        </div>
        <div className="text-center shrink-0">
          <div style={{ fontFamily: "var(--font-bebas)", fontSize: 20, letterSpacing: "0.06em", color: "var(--fg)", lineHeight: 1 }}>{flight.destination}</div>
          <div style={{ fontSize: 13, color: "var(--fg-2)", marginTop: 2 }}>{formatTime(flight.arrivalTime)}</div>
        </div>
      </div>
      <div className="shrink-0 flex items-center gap-3">
        <div className="text-right">
          <div style={{ fontFamily: "var(--font-bebas)", fontSize: 22, color: "var(--orange)", lineHeight: 1 }}>{formatPrice(flight.price, flight.currency)}</div>
          <div style={{ fontSize: 11, color: "var(--fg-3)" }}>all-in</div>
        </div>
        <a href={bookUrl} target="_blank" rel="noopener noreferrer"
          className="btn-primary hover:opacity-80 transition-opacity"
          style={{ padding: "9px 15px", borderRadius: 7, fontSize: 13, textDecoration: "none", whiteSpace: "nowrap" }}>
          Book →
        </a>
      </div>
    </div>
  );
}

export default function FareCalendar() {
  const [origin, setOrigin] = useState({ iata: "", city: "" });
  const [destination, setDestination] = useState({ iata: "", city: "" });
  const [travelDate, setTravelDate] = useState("");
  const [singleResults, setSingleResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // Calendar state — loaded on demand
  const [fares, setFares] = useState<DayFare[]>([]);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [filter, setFilter] = useState<FareFilter>("all");

  const today = new Date().toISOString().split("T")[0];

  const swap = () => { setOrigin(destination); setDestination(origin); };

  const searchSingle = async () => {
    if (!origin.iata || !destination.iata) return;
    setLoading(true);
    setSearched(true);
    setCalendarOpen(false);
    setFares([]);

    const date = travelDate || new Date(Date.now() + 86400000).toISOString().split("T")[0];
    const res = await fetch("/api/flights/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ origin: origin.iata, destination: destination.iata, date, passengers: 1 }),
    }).then((r) => r.json());

    setSingleResults(res.results || []);
    setLoading(false);
  };

  const loadCalendar = async () => {
    setCalendarOpen(true);
    if (fares.length > 0) return;

    setCalendarLoading(true);
    const baseDate = travelDate || new Date(Date.now() + 86400000).toISOString().split("T")[0];
    const dates = Array.from({ length: 28 }, (_, i) => {
      const d = new Date(baseDate + "T12:00:00");
      d.setDate(d.getDate() + i);
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
    setCalendarLoading(false);
  };

  const displayed = applyFilter(fares, filter);
  const prices = displayed.filter((f) => f.price).map((f) => parseFloat(f.price!));
  const min = prices.length ? Math.min(...prices) : 0;
  const max = prices.length ? Math.max(...prices) : 0;
  const weeks: DayFare[][] = [];
  for (let i = 0; i < displayed.length; i += 7) weeks.push(displayed.slice(i, i + 7));
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const travelDateLabel = travelDate
    ? new Date(travelDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })
    : null;

  return (
    <div>
      {/* Search panel */}
      <div className="rounded-2xl border p-6 mb-6" style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-2)" }}>
        <div style={{ fontFamily: "var(--font-bebas)", fontSize: 11, letterSpacing: "0.3em", color: "var(--beach)", marginBottom: 16 }}>
          ONE-WAY · GOWILD PASS
        </div>

        <div className="flex items-end gap-3 mb-2 flex-wrap">
          <AirportInput label="FROM" placeholder="Origin city or airport..." onSelect={(iata, city) => setOrigin({ iata, city })} />
          <button type="button" onClick={swap}
            className="hidden sm:flex w-9 h-9 shrink-0 mb-0.5 items-center justify-center rounded-full border hover:opacity-70 transition-opacity"
            style={{ borderColor: "var(--border-2)", color: "var(--fg-3)", backgroundColor: "var(--bg-4)" }}>
            <ArrowLeftRight className="w-4 h-4" />
          </button>
          <AirportInput label="TO" placeholder="Destination city or airport..." onSelect={(iata, city) => setDestination({ iata, city })} />
          <div style={{ minWidth: 160 }}>
            <label style={{ fontFamily: "var(--font-bebas)", fontSize: 10, letterSpacing: "0.25em", color: "var(--fg-3)", display: "block", marginBottom: 6 }}>TRAVEL DATE</label>
            <div className="flex items-center gap-2 px-3 py-3 rounded-lg border" style={{ borderColor: "var(--border-2)", backgroundColor: "var(--bg-3)" }}>
              <input type="date" min={today} value={travelDate} onChange={(e) => setTravelDate(e.target.value)}
                className="flex-1 bg-transparent outline-none text-sm" style={{ color: "var(--fg)" }} />
            </div>
          </div>
          <button onClick={searchSingle} disabled={loading || !origin.iata || !destination.iata}
            className="flex items-center gap-2 px-6 py-3 rounded-lg btn-primary disabled:opacity-40 transition-opacity shrink-0"
            style={{ fontSize: 14 }}>
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "Searching..." : "Search Flights"}
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="py-16 flex flex-col items-center gap-3" style={{ color: "var(--fg-3)" }}>
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--beach)" }} />
          <span style={{ fontSize: 14 }}>Searching flights...</span>
        </div>
      )}

      {/* Results */}
      {!loading && searched && (
        <div className="mb-6">
          {singleResults.length > 0 ? (
            <>
              <div className="flex items-baseline gap-3 mb-2 flex-wrap">
                <span style={{ fontFamily: "var(--font-serif)", fontSize: 24, fontWeight: 700, color: "var(--fg)" }}>
                  {origin.city} → {destination.city}
                </span>
                <span style={{ fontFamily: "var(--font-bebas)", fontSize: 11, letterSpacing: "0.2em", color: "var(--beach)" }}>
                  {singleResults.length} FLIGHTS
                </span>
              </div>
              {travelDateLabel && (
                <div style={{ fontSize: 13, color: "var(--fg-3)", marginBottom: 16 }}>{travelDateLabel}</div>
              )}
              <div className="flex flex-col gap-2">
                {singleResults.slice(0, 15).map((f) => (
                  <FlightResultCard key={f.id} flight={f} originIata={origin.iata} destIata={destination.iata} />
                ))}
              </div>

              {/* Compare dates toggle */}
              <button
                onClick={loadCalendar}
                className="mt-6 flex items-center gap-2 px-5 py-3 rounded-xl border hover:opacity-80 transition-all w-full justify-center"
                style={{ borderColor: "var(--border-2)", color: "var(--fg-2)", backgroundColor: "var(--bg-2)", fontSize: 14 }}>
                <ChevronDown className="w-4 h-4" style={{ transform: calendarOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
                Compare prices across 28 days
              </button>
            </>
          ) : (
            <div className="py-20 text-center">
              <div style={{ fontFamily: "var(--font-serif)", fontSize: 24, color: "var(--fg-2)", marginBottom: 8 }}>No flights found</div>
              <div className="text-sm" style={{ color: "var(--fg-3)" }}>Try a different date or route.</div>
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {!loading && !searched && (
        <div className="py-20 text-center">
          <div style={{ fontFamily: "var(--font-serif)", fontSize: 28, color: "var(--fg-2)", marginBottom: 10 }}>Find the best time to fly</div>
          <div className="text-sm" style={{ color: "var(--fg-3)" }}>Pick your route and travel date, then hit Search.</div>
        </div>
      )}

      {/* 28-day fare calendar — loaded on demand */}
      {calendarOpen && (
        <div className="mt-2">
          {calendarLoading && (
            <div className="py-10 flex flex-col items-center gap-3" style={{ color: "var(--fg-3)" }}>
              <Loader2 className="w-5 h-5 animate-spin" style={{ color: "var(--beach)" }} />
              <span style={{ fontSize: 13 }}>Loading 28 days of fares...</span>
            </div>
          )}

          {!calendarLoading && fares.length > 0 && (
            <div className="rounded-xl border p-5" style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-2)" }}>
              <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <div>
                  <div style={{ fontFamily: "var(--font-serif)", fontSize: 18, fontWeight: 700, color: "var(--fg)" }}>
                    {origin.city} → {destination.city} · 28 days
                  </div>
                  <div style={{ fontFamily: "var(--font-bebas)", fontSize: 10, letterSpacing: "0.2em", color: "var(--fg-3)", marginTop: 3 }}>
                    {origin.iata} → {destination.iata} · ALL-IN PRICING
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs" style={{ color: "var(--fg-3)" }}>
                  <span className="flex items-center gap-1.5"><span style={{ width: 10, height: 10, borderRadius: 2, display: "inline-block", backgroundColor: "rgba(0,212,180,0.3)" }} />Cheapest</span>
                  <span className="flex items-center gap-1.5"><span style={{ width: 10, height: 10, borderRadius: 2, display: "inline-block", backgroundColor: "rgba(245,176,65,0.3)" }} />Mid</span>
                  <span className="flex items-center gap-1.5"><span style={{ width: 10, height: 10, borderRadius: 2, display: "inline-block", backgroundColor: "rgba(239,68,68,0.3)" }} />Priciest</span>
                </div>
              </div>

              {/* Filter tabs */}
              <div className="flex gap-2 flex-wrap mb-4">
                {FILTER_TABS.map((tab) => (
                  <button key={tab.id} onClick={() => setFilter(tab.id)}
                    className="px-4 py-1.5 rounded-full transition-all"
                    style={{
                      fontSize: 12,
                      border: "1px solid",
                      borderColor: filter === tab.id ? "var(--beach)" : "var(--border-2)",
                      backgroundColor: filter === tab.id ? "rgba(0,212,180,0.1)" : "transparent",
                      color: filter === tab.id ? "var(--beach)" : "var(--fg-3)",
                    }}>
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-0.5 mb-1">
                {days.map((d) => (
                  <div key={d} className="text-center pb-2" style={{ fontFamily: "var(--font-bebas)", letterSpacing: "0.1em", fontSize: 11, color: "var(--fg-3)" }}>{d}</div>
                ))}
              </div>

              {weeks.map((week, wi) => (
                <div key={wi} className="grid grid-cols-7 gap-0.5 mb-0.5">
                  {week.map((day) => {
                    const d = new Date(day.date + "T12:00:00");
                    const cs = priceColor(day.price, min, max);
                    const bookUrl = day.price
                      ? `https://www.flyfrontier.com/flights/search?origin=${origin.iata}&destination=${destination.iata}&departDate=${day.date}&adults=1`
                      : undefined;
                    return (
                      <a key={day.date} href={bookUrl} target={bookUrl ? "_blank" : undefined}
                        rel={bookUrl ? "noopener noreferrer" : undefined}
                        className="rounded-md p-1.5 text-center transition-opacity hover:opacity-75"
                        style={{ backgroundColor: cs.backgroundColor, color: cs.color, border: `1px solid ${cs.borderColor}`, cursor: bookUrl ? "pointer" : "default" }}>
                        <div style={{ fontFamily: "var(--font-bebas)", fontSize: 14, letterSpacing: "0.05em" }}>{d.getDate()}</div>
                        <div style={{ fontSize: 9, marginTop: 2, fontFamily: "var(--font-bebas)" }} className="truncate">
                          {day.price ? formatPrice(day.price, day.currency) : "—"}
                        </div>
                      </a>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
