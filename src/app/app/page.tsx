"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, useMemo, Suspense } from "react";
import OriginSearch from "@/components/OriginSearch";
import type { SearchResult } from "@/lib/duffel";
import { Loader2 } from "lucide-react";
import dynamic from "next/dynamic";
import { formatTime, formatDuration, formatPrice } from "@/lib/utils";

const FlightMap = dynamic(() => import("@/components/FlightMap"), { ssr: false });

const POPULAR_DESTINATIONS = [
  "LAX","ORD","ATL","DEN","MIA","LAS","PHX","SEA","BOS","DFW",
  "MCO","SFO","DCA","CLT","TPA","SAN","AUS","BNA","PDX","SLC",
];

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
  beach: "var(--vibe-beach)", mountain: "var(--vibe-mountain)", city: "var(--vibe-city)",
  desert: "var(--vibe-desert)", heartland: "var(--vibe-heartland)",
};
function vibeLabel(iata: string) { return VIBE[iata] ?? "city"; }
function accentColor(iata: string) { return VIBE_COLORS[VIBE[iata]] ?? "var(--beach)"; }

const REGION_MAP: Record<string, string> = {
  BOS:"East Coast", BDL:"East Coast", BUF:"East Coast", SYR:"East Coast",
  PHL:"East Coast", BWI:"East Coast", DCA:"East Coast", IAD:"East Coast",
  PIT:"East Coast", RIC:"East Coast", ORF:"East Coast",
  JFK:"East Coast", LGA:"East Coast", EWR:"East Coast",
  ATL:"East Coast", CLT:"East Coast", RDU:"East Coast",
  MIA:"East Coast", FLL:"East Coast", TPA:"East Coast", MCO:"East Coast",
  PBI:"East Coast", RSW:"East Coast", SRQ:"East Coast", JAX:"East Coast",
  CHS:"East Coast", BNA:"East Coast", MEM:"East Coast", MSY:"East Coast",
  ORD:"Central", MDW:"Central", DTW:"Central", MSP:"Central",
  MCI:"Central", STL:"Central", CMH:"Central", CLE:"Central",
  CVG:"Central", IND:"Central", MKE:"Central", GRR:"Central",
  OMA:"Central", OKC:"Central", XNA:"Central",
  DFW:"Central", AUS:"Central", HOU:"Central", SAT:"Central", ELP:"Central",
  DEN:"Central", SLC:"Central", BOI:"Central", RNO:"Central",
  LAX:"West Coast", SFO:"West Coast", SAN:"West Coast", BUR:"West Coast",
  ONT:"West Coast", SNA:"West Coast", SJC:"West Coast", SMF:"West Coast",
  SEA:"West Coast", PDX:"West Coast", GEG:"West Coast",
  LAS:"West Coast", PHX:"West Coast", TUS:"West Coast",
  SJU:"International", CUN:"International", PVR:"International",
  SJD:"International", GDL:"International", MZT:"International",
  PUJ:"International", SDQ:"International", GUA:"International", SAL:"International",
};
const REGION_ORDER = ["East Coast", "Central", "West Coast", "International"];
function getRegion(iata: string) { return REGION_MAP[iata] ?? "Other"; }

type View = "list" | "grid" | "map";
type StopsFilter = "any" | "0" | "1";

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
      {/* City name — most prominent */}
      <div style={{ minWidth: 160 }}>
        <div style={{ fontFamily: "var(--font-serif)", fontSize: 23, fontWeight: 700, color: "var(--fg)", lineHeight: 1.2 }}>
          {flight.destinationCity}
        </div>
        <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", color: "var(--fg-3)", marginTop: 2 }}>
          {flight.destination}
        </div>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", color, marginTop: 2 }}>
          {vibeLabel(flight.destination)}
        </div>
      </div>

      {/* Flight line */}
      <div className="flex-1 flex items-center gap-3 min-w-0">
        <div className="text-center shrink-0">
          <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: "0.04em", color: "var(--fg-2)" }}>{flight.origin}</div>
          <div style={{ fontSize: 12, color: "var(--fg-3)" }}>{formatTime(flight.departureTime)}</div>
        </div>
        <div className="flex-1 flex flex-col items-center gap-1">
          <div style={{ fontSize: 12, color: "var(--fg-3)" }}>{formatDuration(flight.duration)}</div>
          <div className="w-full flex items-center gap-1">
            <div className="flex-1 h-px" style={{ backgroundColor: "var(--border-2)" }} />
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
          </div>
          <div style={{ fontSize: 11, color: "var(--fg-3)" }}>
            {stops}
            {flight.airlineCode && (
              <span style={{ marginLeft: 6, opacity: 0.6 }}>· {flight.airlineCode}</span>
            )}
          </div>
        </div>
        <div className="text-center shrink-0">
          <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: "0.04em", color: "var(--fg-2)" }}>{flight.destination}</div>
          <div style={{ fontSize: 12, color: "var(--fg-3)" }}>{formatTime(flight.arrivalTime)}</div>
        </div>
      </div>

      {/* Price + book */}
      <div className="shrink-0 flex items-center gap-4">
        <div className="text-right">
          <div style={{ fontFamily: "var(--font-bebas)", fontSize: 22, fontWeight: 500, color: "var(--orange)", lineHeight: 1 }}>
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
      <div className="flex items-start justify-between mb-2">
        <div />
        <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.06em", backgroundColor: "var(--bg-4)", color: "var(--fg-3)", padding: "3px 8px", borderRadius: 5, border: "1px solid var(--border-2)" }}>
          {flight.destination}
        </div>
      </div>
      <div style={{ fontFamily: "var(--font-serif)", fontSize: 23, fontWeight: 700, color: "var(--fg)", lineHeight: 1.15, flex: 1 }}>
        {flight.destinationCity}
      </div>
      <div className="flex items-center justify-between mt-3">
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", color, backgroundColor: `${color}18`, padding: "3px 9px", borderRadius: 20 }}>
          {vibeLabel(flight.destination)}
        </div>
        <div className="text-right">
          <div style={{ fontSize: 12, color: "var(--fg-3)" }}>{formatDuration(flight.duration)}</div>
          <div style={{ fontSize: 12, color: "var(--fg-2)", marginTop: 2 }}>
            {formatTime(flight.departureTime)} → {formatTime(flight.arrivalTime)}
          </div>
          {flight.airlineCode && (
            <div style={{ fontSize: 11, color: "var(--fg-3)", marginTop: 2, opacity: 0.7 }}>
              {flight.airlineCode}
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
        <div>
          <div style={{ fontFamily: "var(--font-bebas)", fontSize: 20, fontWeight: 500, color: "var(--orange)", lineHeight: 1 }}>
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

function RegionHeader({ region, count }: { region: string; count: number }) {
  return (
    <div style={{ marginBottom: 16, paddingBottom: 10, borderBottom: "1px solid var(--border)", display: "flex", alignItems: "baseline", gap: 14 }}>
      <span style={{ fontFamily: "var(--font-serif)", fontSize: 30, fontWeight: 900, color: "var(--fg)", lineHeight: 1 }}>
        {region}
      </span>
      <span style={{ fontFamily: "var(--font-bebas)", fontSize: 12, letterSpacing: "0.28em", color: "var(--beach)" }}>
        {count} {count === 1 ? "DESTINATION" : "DESTINATIONS"}
      </span>
    </div>
  );
}

function ExploreContent() {
  const params = useSearchParams();
  const origin = params.get("origin") || "";
  const originName = params.get("originName") || origin;

  const [rawResults, setRawResults] = useState<SearchResult[][]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [view, setView] = useState<View>("list");
  const [date, setDate] = useState(() =>
    new Date(Date.now() + 3 * 86400000).toISOString().split("T")[0]
  );
  const [maxStops, setMaxStops] = useState<StopsFilter>("any");

  useEffect(() => {
    if (!origin) return;
    setLoading(true);
    setSearched(true);
    const destinations = POPULAR_DESTINATIONS.filter((d) => d !== origin).slice(0, 12);

    Promise.allSettled(
      destinations.map((dest) =>
        fetch("/api/flights/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ origin, destination: dest, date, passengers: 1 }),
        }).then((r) => r.json())
      )
    ).then((results) => {
      const all: SearchResult[][] = [];
      results.forEach((r) => {
        if (r.status === "fulfilled" && r.value.results?.length) {
          all.push(r.value.results);
        }
      });
      setRawResults(all);
      setLoading(false);
    });
  }, [origin, date]);

  const flights = useMemo(() => {
    const all: SearchResult[] = [];
    rawResults.forEach((results) => {
      let candidates = results;
      if (maxStops !== "any") {
        const n = parseInt(maxStops);
        candidates = candidates.filter((f) => f.stops === n);
      }
      if (!candidates.length) return;
      all.push(
        candidates.reduce(
          (min, f) => parseFloat(f.price) < parseFloat(min.price) ? f : min,
          candidates[0]
        )
      );
    });
    return all.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
  }, [rawResults, maxStops]);

  const grouped = useMemo(() => {
    return REGION_ORDER
      .map((r) => ({ region: r, items: flights.filter((f) => getRegion(f.destination) === r) }))
      .filter((g) => g.items.length > 0);
  }, [flights]);

  const stopsOptions: { value: StopsFilter; label: string }[] = [
    { value: "any", label: "Any" },
    { value: "0", label: "Nonstop" },
    { value: "1", label: "1 Stop" },
  ];

  return (
    <div className="max-w-6xl mx-auto px-5 py-10">
      {/* Search controls */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-3 mb-4 max-w-2xl">
          <div className="flex-1 min-w-52">
            <OriginSearch initialValue={originName} />
          </div>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-lg px-3 py-2.5 outline-none"
            style={{
              backgroundColor: "var(--bg-2)",
              border: "1px solid var(--border)",
              color: "var(--fg-2)",
              fontFamily: "var(--font-bebas)",
              fontSize: 13,
            }}
          />
        </div>
        <div className="flex gap-2">
          {stopsOptions.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setMaxStops(value)}
              style={{
                fontFamily: "var(--font-bebas)",
                letterSpacing: "0.12em",
                fontSize: 12,
                padding: "5px 14px",
                borderRadius: 20,
                backgroundColor: maxStops === value ? "var(--beach)" : "var(--bg-2)",
                color: maxStops === value ? "var(--navy)" : "var(--fg-3)",
                border: `1px solid ${maxStops === value ? "var(--beach)" : "var(--border)"}`,
                transition: "all 0.15s",
              }}
            >
              {label}
            </button>
          ))}
        </div>
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
            <div className="flex flex-col gap-8">
              {grouped.map(({ region, items }) => (
                <div key={region}>
                  <RegionHeader region={region} count={items.length} />
                  <div className="flex flex-col gap-2">
                    {items.map((f) => <ListRow key={f.id} flight={f} />)}
                  </div>
                </div>
              ))}
            </div>
          )}

          {view === "grid" && (
            <div className="flex flex-col gap-8">
              {grouped.map(({ region, items }) => (
                <div key={region}>
                  <RegionHeader region={region} count={items.length} />
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {items.map((f) => <GridCard key={f.id} flight={f} />)}
                  </div>
                </div>
              ))}
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
          <div style={{ fontFamily: "var(--font-serif)", fontSize: 24, color: "var(--fg-2)", marginBottom: 8 }}>
            {rawResults.length === 0
              ? `No flights found from ${origin}`
              : maxStops === "0" ? "No nonstop flights found" : "No 1-stop flights found"}
          </div>
          <p className="text-sm" style={{ color: "var(--fg-3)" }}>
            {rawResults.length === 0
              ? "Try a different airport or come back closer to your travel date."
              : "Try changing the stop filter or selecting a different date."}
          </p>
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
