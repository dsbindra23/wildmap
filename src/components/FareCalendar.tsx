"use client";

import { useState, useRef, useEffect } from "react";
import { formatPrice } from "@/lib/utils";
import { Loader2, Search, ArrowLeftRight } from "lucide-react";

interface DayFare { date: string; price: string | null; currency: string; }
interface Airport { iataCode: string; city: string; name: string; }

type FareFilter = "all" | "gowild" | "discountden";

const FILTER_TABS: { id: FareFilter; label: string; desc: string }[] = [
  { id: "all", label: "All Flights", desc: "Every available fare" },
  { id: "gowild", label: "GoWild Standard", desc: "Typical GoWild range ($20–$150)" },
  { id: "discountden", label: "Discount Den", desc: "Frontier's lowest fares (under $60)" },
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
          style={{ color: "var(--fg)", fontFamily: "var(--font-bebas)" }}
          onFocus={() => results.length > 0 && setOpen(true)}
        />
      </div>
      {open && results.length > 0 && (
        <div className="absolute z-50 top-full mt-1 w-full rounded-xl overflow-hidden shadow-xl"
          style={{ backgroundColor: "var(--bg-2)", border: "1px solid var(--border-2)" }}>
          {results.map((r) => (
            <button key={r.iataCode} type="button" onClick={() => pick(r)}
              className="w-full text-left px-4 py-3 text-sm flex items-center gap-3 hover:opacity-70 transition-opacity border-b last:border-0"
              style={{ borderColor: "var(--border)", color: "var(--fg)" }}>
              <span style={{ fontFamily: "var(--font-bebas)", letterSpacing: "0.1em", fontSize: 16, width: 36, flexShrink: 0, color: "var(--beach)" }}>{r.iataCode}</span>
              <span style={{ color: "var(--fg-2)" }}>{r.city}</span>
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

export default function FareCalendar() {
  const [origin, setOrigin] = useState({ iata: "", city: "" });
  const [destination, setDestination] = useState({ iata: "", city: "" });
  const [startDate, setStartDate] = useState("");
  const [fares, setFares] = useState<DayFare[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<FareFilter>("all");
  const today = new Date().toISOString().split("T")[0];

  const swap = () => { setOrigin(destination); setDestination(origin); };

  const search = async () => {
    if (!origin.iata || !destination.iata) return;
    setLoading(true);

    const baseDate = startDate || new Date(Date.now() + 86400000).toISOString().split("T")[0];
    const dates = Array.from({ length: 28 }, (_, i) => {
      const d = new Date(baseDate);
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
    setLoading(false);
  };

  const displayed = applyFilter(fares, filter);
  const prices = displayed.filter((f) => f.price).map((f) => parseFloat(f.price!));
  const min = prices.length ? Math.min(...prices) : 0;
  const max = prices.length ? Math.max(...prices) : 0;
  const weeks: DayFare[][] = [];
  for (let i = 0; i < displayed.length; i += 7) weeks.push(displayed.slice(i, i + 7));
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div>
      {/* Search panel */}
      <div className="rounded-2xl border p-6 mb-6" style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-2)" }}>
        <div style={{ fontFamily: "var(--font-bebas)", fontSize: 11, letterSpacing: "0.3em", color: "var(--beach)", marginBottom: 16 }}>
          ONE-WAY · GOWILD PASS
        </div>

        <div className="flex items-end gap-3 mb-5 flex-wrap">
          <AirportInput label="FROM" placeholder="Origin city or airport..." onSelect={(iata, city) => setOrigin({ iata, city })} />
          <button type="button" onClick={swap}
            className="hidden sm:flex w-9 h-9 shrink-0 mb-0.5 items-center justify-center rounded-full border hover:opacity-70 transition-opacity"
            style={{ borderColor: "var(--border-2)", color: "var(--fg-3)", backgroundColor: "var(--bg-4)" }}>
            <ArrowLeftRight className="w-4 h-4" />
          </button>
          <AirportInput label="TO" placeholder="Destination city or airport..." onSelect={(iata, city) => setDestination({ iata, city })} />
          <div style={{ minWidth: 160 }}>
            <label style={{ fontFamily: "var(--font-bebas)", fontSize: 10, letterSpacing: "0.25em", color: "var(--fg-3)", display: "block", marginBottom: 6 }}>FROM DATE</label>
            <div className="flex items-center gap-2 px-3 py-3 rounded-lg border" style={{ borderColor: "var(--border-2)", backgroundColor: "var(--bg-3)" }}>
              <input type="date" min={today} value={startDate} onChange={(e) => setStartDate(e.target.value)}
                className="flex-1 bg-transparent outline-none text-sm" style={{ color: "var(--fg)", fontFamily: "var(--font-bebas)" }} />
            </div>
          </div>
          <button onClick={search} disabled={loading || !origin.iata || !destination.iata}
            className="flex items-center gap-2 px-6 py-3 rounded-lg btn-primary disabled:opacity-40 transition-opacity shrink-0"
            style={{ fontSize: 14 }}>
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "Searching..." : "Search Flights"}
          </button>
        </div>

        {/* Filter tabs */}
        {fares.length > 0 && (
          <div className="flex gap-2 flex-wrap pt-4" style={{ borderTop: "1px solid var(--border)" }}>
            {FILTER_TABS.map((tab) => (
              <button key={tab.id} onClick={() => setFilter(tab.id)}
                className="px-4 py-2 rounded-full transition-all"
                style={{
                  fontFamily: "var(--font-bebas)", letterSpacing: "0.1em", fontSize: 13,
                  border: "1px solid",
                  borderColor: filter === tab.id ? "var(--beach)" : "var(--border-2)",
                  backgroundColor: filter === tab.id ? "rgba(0,212,180,0.1)" : "transparent",
                  color: filter === tab.id ? "var(--beach)" : "var(--fg-3)",
                }}>
                {tab.label}
              </button>
            ))}
            <span className="self-center text-xs ml-1" style={{ color: "var(--fg-3)" }}>
              {FILTER_TABS.find((t) => t.id === filter)?.desc}
            </span>
          </div>
        )}
      </div>

      {loading && (
        <div className="py-16 flex flex-col items-center gap-3" style={{ color: "var(--fg-3)" }}>
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--beach)" }} />
          <span style={{ fontFamily: "var(--font-bebas)", letterSpacing: "0.15em", fontSize: 14 }}>
            Checking 28 days of fares...
          </span>
        </div>
      )}

      {/* Calendar grid */}
      {!loading && displayed.length > 0 && (
        <div className="rounded-xl border p-5" style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-2)" }}>
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <div>
              <div style={{ fontFamily: "var(--font-serif)", fontSize: 22, fontWeight: 700, color: "var(--fg)" }}>
                {origin.city} → {destination.city}
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

      {!loading && displayed.length === 0 && (
        <div className="py-20 text-center">
          <div style={{ fontFamily: "var(--font-serif)", fontSize: 28, color: "var(--fg-2)", marginBottom: 10 }}>Find the best time to fly</div>
          <div className="text-sm" style={{ color: "var(--fg-3)" }}>Select your route and a start date, then hit Search to compare fares.</div>
        </div>
      )}
    </div>
  );
}
