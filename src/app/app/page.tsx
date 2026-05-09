"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import OriginSearch from "@/components/OriginSearch";
import type { SearchResult } from "@/lib/duffel";
import { Loader2 } from "lucide-react";
import dynamic from "next/dynamic";
import { formatTime, formatDuration, formatPrice } from "@/lib/utils";
import Link from "next/link";

const FlightMap = dynamic(() => import("@/components/FlightMap"), { ssr: false });

const POPULAR_DESTINATIONS = [
  "LAX","ORD","ATL","DEN","MIA","LAS","PHX","SEA","BOS","DFW",
  "MCO","SFO","DCA","CLT","TPA","SAN","AUS","BNA","PDX","SLC",
];

// Vibe lookup for color-coded cards
const VIBE: Record<string, string> = {
  FLL:"beach",MIA:"beach",TPA:"beach",MCO:"city",PBI:"beach",RSW:"beach",SRQ:"beach",CHS:"beach",JAX:"beach",
  SAN:"beach",SNA:"beach",SJU:"beach",CUN:"beach",MZT:"beach",PVR:"beach",SJD:"beach",PUJ:"beach",SDQ:"beach",ORF:"beach",
  DEN:"mountain",SLC:"mountain",BOI:"mountain",RNO:"mountain",SEA:"mountain",PDX:"mountain",GEG:"mountain",
  PHX:"desert",TUS:"desert",ELP:"desert",LAS:"city",
  ATL:"city",ORD:"city",LAX:"city",DFW:"city",BOS:"city",JFK:"city",EWR:"city",LGA:"city",DCA:"city",IAD:"city",
  PHL:"city",CLT:"city",RDU:"city",BNA:"city",MSY:"city",BUR:"city",ONT:"city",SFO:"city",SJC:"city",SMF:"city",
  MDW:"city",DTW:"city",CMH:"city",CLE:"city",CVG:"city",AUS:"city",HOU:"city",SAT:"city",BWI:"city",PIT:"city",
  RIC:"city",BDL:"city",BUF:"city",SYR:"city",GDL:"city",GUA:"city",SAL:"city",
  MCI:"heartland",IND:"heartland",GRR:"heartland",MKE:"heartland",MSP:"heartland",OKC:"heartland",OMA:"heartland",
  STL:"heartland",XNA:"heartland",MEM:"heartland",
};
const VIBE_COLORS: Record<string, string> = {
  beach: "var(--beach)", mountain: "var(--mountain)", city: "var(--city)",
  desert: "var(--desert)", heartland: "var(--heartland)",
};
function vibeLabel(iata: string) {
  return VIBE[iata] ?? "city";
}
function accentColor(iata: string) {
  return VIBE_COLORS[VIBE[iata]] ?? "var(--beach)";
}

type View = "list" | "grid" | "map";

function ViewToggle({ view, setView }: { view: View; setView: (v: View) => void }) {
  const views: View[] = ["list", "grid", "map"];
  return (
    <div className="flex rounded-lg overflow-hidden" style={{ border: "1px solid var(--border-2)" }}>
      {views.map((v, i) => (
        <button
          key={v}
          onClick={() => setView(v)}
          style={{
            fontFamily: "var(--font-bebas)",
            letterSpacing: "0.12em",
            fontSize: 13,
            padding: "7px 18px",
            borderRight: i < views.length - 1 ? "1px solid var(--border-2)" : "none",
            backgroundColor: view === v ? "var(--bg-4)" : "transparent",
            color: view === v ? "var(--fg)" : "var(--fg-3)",
            transition: "all 0.15s",
          }}
        >
          {v.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

function ListRow({ flight }: { flight: SearchResult }) {
  const color = accentColor(flight.destination);
  const stops = flight.stops === 0 ? "Nonstop" : `${flight.stops} stop${flight.stops > 1 ? "s" : ""}`;
  const date = flight.departureTime.split("T")[0];
  const bookUrl = `https://www.flyfrontier.com/flights/search?origin=${flight.origin}&destination=${flight.destination}&departDate=${date}&adults=1`;

  return (
    <div
      className="flex items-center gap-5 px-5 py-4 rounded-xl transition-all hover:opacity-90"
      style={{ backgroundColor: "var(--bg-2)", border: "1px solid var(--border)", borderLeftWidth: 4, borderLeftColor: color }}
    >
      {/* Destination — most prominent */}
      <div style={{ minWidth: 140 }}>
        <div style={{ fontFamily: "var(--font-bebas)", fontSize: 32, letterSpacing: "0.04em", color: "var(--fg)", lineHeight: 1 }}>
          {flight.destination}
        </div>
        <div className="text-sm mt-0.5" style={{ color: "var(--fg-2)" }}>{flight.destinationCity}</div>
        <div style={{ fontFamily: "var(--font-bebas)", fontSize: 10, letterSpacing: "0.15em", color, marginTop: 3 }}>
          {vibeLabel(flight.destination).toUpperCase()}
        </div>
      </div>

      {/* Flight line */}
      <div className="flex-1 flex items-center gap-3 min-w-0">
        <div className="text-center shrink-0">
          <div style={{ fontFamily: "var(--font-bebas)", fontSize: 20, letterSpacing: "0.05em", color: "var(--fg-2)" }}>{flight.origin}</div>
          <div className="text-xs" style={{ color: "var(--fg-3)" }}>{formatTime(flight.departureTime)}</div>
        </div>
        <div className="flex-1 flex flex-col items-center gap-1">
          <div className="text-xs" style={{ color: "var(--fg-3)" }}>{formatDuration(flight.duration)}</div>
          <div className="w-full flex items-center gap-1">
            <div className="flex-1 h-px" style={{ backgroundColor: "var(--border-2)" }} />
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
          </div>
          <div style={{ fontFamily: "var(--font-bebas)", fontSize: 10, letterSpacing: "0.1em", color: "var(--fg-3)" }}>{stops}</div>
        </div>
        <div className="text-center shrink-0">
          <div style={{ fontFamily: "var(--font-bebas)", fontSize: 20, letterSpacing: "0.05em", color: "var(--fg-2)" }}>{flight.destination}</div>
          <div className="text-xs" style={{ color: "var(--fg-3)" }}>{formatTime(flight.arrivalTime)}</div>
        </div>
      </div>

      {/* Price + book */}
      <div className="shrink-0 flex items-center gap-4">
        <div className="text-right">
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 22, fontWeight: 500, color: "var(--orange)", lineHeight: 1 }}>
            {formatPrice(flight.price, flight.currency)}
          </div>
          <div className="text-xs mt-0.5" style={{ color: "var(--fg-3)" }}>all-in</div>
        </div>
        <a
          href={bookUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary whitespace-nowrap hover:opacity-80 transition-opacity"
          style={{ padding: "9px 15px", borderRadius: 7, fontSize: 13, textDecoration: "none" }}
        >
          Book →
        </a>
      </div>
    </div>
  );
}

function GridCard({ flight }: { flight: SearchResult }) {
  const color = accentColor(flight.destination);
  const date = flight.departureTime.split("T")[0];
  const bookUrl = `https://www.flyfrontier.com/flights/search?origin=${flight.origin}&destination=${flight.destination}&departDate=${date}&adults=1`;

  return (
    <div
      className="rounded-xl p-5 flex flex-col transition-all hover:opacity-90"
      style={{ backgroundColor: "var(--bg-2)", border: "1px solid var(--border)", borderLeftWidth: 5, borderLeftColor: color, minHeight: 160 }}
    >
      {/* IATA badge top-right */}
      <div className="flex items-start justify-between mb-2">
        <div />
        <div style={{ fontFamily: "var(--font-bebas)", fontSize: 13, letterSpacing: "0.12em", backgroundColor: "var(--bg-4)", color: "var(--fg-2)", padding: "3px 8px", borderRadius: 5, border: "1px solid var(--border-2)" }}>
          {flight.destination}
        </div>
      </div>

      {/* City name */}
      <div style={{ fontFamily: "var(--font-serif)", fontSize: 22, fontWeight: 700, color: "var(--fg)", lineHeight: 1.15, flex: 1 }}>
        {flight.destinationCity}
      </div>

      {/* Vibe + duration + time */}
      <div className="flex items-center justify-between mt-3">
        <div style={{ fontFamily: "var(--font-bebas)", fontSize: 10, letterSpacing: "0.15em", color, backgroundColor: `${color}18`, padding: "3px 9px", borderRadius: 20 }}>
          {vibeLabel(flight.destination).toUpperCase()}
        </div>
        <div className="text-right">
          <div className="text-xs" style={{ color: "var(--fg-3)" }}>{formatDuration(flight.duration)}</div>
          <div className="text-xs mt-0.5" style={{ color: "var(--fg-2)", fontFamily: "var(--font-mono)" }}>
            {formatTime(flight.departureTime)} → {formatTime(flight.arrivalTime)}
          </div>
        </div>
      </div>

      {/* Price + book */}
      <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
        <div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 20, fontWeight: 500, color: "var(--orange)", lineHeight: 1 }}>
            {formatPrice(flight.price, flight.currency)}
          </div>
          <div className="text-xs mt-0.5" style={{ color: "var(--fg-3)" }}>all-in</div>
        </div>
        <a
          href={bookUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary hover:opacity-80 transition-opacity"
          style={{ padding: "7px 14px", borderRadius: 7, fontSize: 12, textDecoration: "none" }}
        >
          Book →
        </a>
      </div>
    </div>
  );
}

function ExploreContent() {
  const params = useSearchParams();
  const origin = params.get("origin") || "";
  const originName = params.get("originName") || origin;

  const [flights, setFlights] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [view, setView] = useState<View>("list");

  useEffect(() => {
    if (!origin) return;
    setLoading(true);
    setSearched(true);
    const destinations = POPULAR_DESTINATIONS.filter((d) => d !== origin).slice(0, 12);
    const date = new Date(Date.now() + 3 * 86400000).toISOString().split("T")[0];

    Promise.allSettled(
      destinations.map((dest) =>
        fetch("/api/flights/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ origin, destination: dest, date, passengers: 1 }),
        }).then((r) => r.json())
      )
    ).then((results) => {
      const all: SearchResult[] = [];
      results.forEach((r) => {
        if (r.status === "fulfilled" && r.value.results?.length) {
          const cheapest: SearchResult = r.value.results.reduce(
            (min: SearchResult, f: SearchResult) =>
              parseFloat(f.price) < parseFloat(min.price) ? f : min,
            r.value.results[0]
          );
          all.push(cheapest);
        }
      });
      all.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
      setFlights(all);
      setLoading(false);
    });
  }, [origin]);

  return (
    <div className="max-w-6xl mx-auto px-5 py-10">
      {/* Search */}
      <div className="max-w-lg mb-10">
        <OriginSearch initialValue={originName} />
      </div>

      {!searched && (
        <div className="py-24 text-center">
          <div style={{ fontFamily: "var(--font-serif)", fontSize: 28, color: "var(--fg-2)", marginBottom: 10 }}>Where to next?</div>
          <p className="text-sm" style={{ color: "var(--fg-3)" }}>Enter your departure airport above to see all reachable GoWild destinations.</p>
        </div>
      )}

      {loading && (
        <div className="py-24 flex flex-col items-center gap-3" style={{ color: "var(--fg-3)" }}>
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="text-sm" style={{ fontFamily: "var(--font-bebas)", letterSpacing: "0.1em", fontSize: 14 }}>
            Searching from {origin}...
          </span>
        </div>
      )}

      {!loading && searched && flights.length > 0 && (
        <>
          {/* Header */}
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <div>
              <div style={{ fontFamily: "var(--font-bebas)", fontSize: 11, letterSpacing: "0.3em", color: "var(--beach)", marginBottom: 6 }}>
                ONE-WAY · GOWILD PASS
              </div>
              <div style={{ fontFamily: "var(--font-serif)", fontSize: 36, fontWeight: 900, color: "var(--fg)", lineHeight: 1.05 }}>
                Flying from <span style={{ color: "var(--beach)" }}>{origin}</span>
              </div>
              <div style={{ fontFamily: "var(--font-bebas)", fontSize: 13, letterSpacing: "0.15em", color: "var(--fg-3)", marginTop: 4 }}>
                {flights.length} DESTINATIONS FOUND
              </div>
            </div>
            <ViewToggle view={view} setView={setView} />
          </div>

          {view === "list" && (
            <div className="flex flex-col gap-2">
              {flights.map((f) => <ListRow key={f.id} flight={f} />)}
            </div>
          )}

          {view === "grid" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {flights.map((f) => <GridCard key={f.id} flight={f} />)}
            </div>
          )}

          {view === "map" && (
            <div className="rounded-xl overflow-hidden border" style={{ borderColor: "var(--border)", height: 560 }}>
              <FlightMap preloadedFlights={flights} origin={origin} />
            </div>
          )}
        </>
      )}

      {!loading && searched && flights.length === 0 && (
        <div className="py-24 text-center">
          <div style={{ fontFamily: "var(--font-serif)", fontSize: 24, color: "var(--fg-2)", marginBottom: 8 }}>No flights found from {origin}</div>
          <p className="text-sm" style={{ color: "var(--fg-3)" }}>Try a different airport or come back closer to your travel date.</p>
        </div>
      )}
    </div>
  );
}

export default function AppPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center py-24">
        <Loader2 className="w-5 h-5 animate-spin" style={{ color: "var(--fg-3)" }} />
      </div>
    }>
      <ExploreContent />
    </Suspense>
  );
}
