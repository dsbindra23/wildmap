"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import OriginSearch from "@/components/OriginSearch";
import FlightCard from "@/components/FlightCard";
import type { SearchResult } from "@/lib/duffel";
import { Loader2 } from "lucide-react";
import dynamic from "next/dynamic";

const FlightMap = dynamic(() => import("@/components/FlightMap"), { ssr: false });

const POPULAR_DESTINATIONS = [
  "LAX","ORD","ATL","DEN","MIA","LAS","PHX","SEA","BOS","DFW",
  "MCO","SFO","DCA","CLT","TPA","SAN","AUS","BNA","PDX","SLC",
];

function ExploreContent() {
  const params = useSearchParams();
  const origin = params.get("origin") || "";
  const originName = params.get("originName") || origin;

  const [flights, setFlights] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [view, setView] = useState<"list" | "map">("list");

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
      {/* Search bar */}
      <div className="max-w-lg mb-10">
        <OriginSearch initialValue={originName} />
      </div>

      {!searched && (
        <div className="py-24 text-center">
          <p className="text-4xl mb-4">✈</p>
          <p className="text-base font-medium mb-1" style={{ color: "var(--fg)" }}>Enter your departure airport above</p>
          <p className="text-sm" style={{ color: "var(--fg-3)" }}>
            We will find every destination you can reach with your GoWild pass.
          </p>
        </div>
      )}

      {loading && (
        <div className="py-24 flex flex-col items-center gap-3" style={{ color: "var(--fg-3)" }}>
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="text-sm">Checking availability from {origin}...</span>
        </div>
      )}

      {!loading && searched && flights.length > 0 && (
        <>
          {/* Header + view toggle */}
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <div>
              <h2 className="text-lg font-semibold" style={{ color: "var(--fg)" }}>
                {flights.length} destinations from {origin}
              </h2>
              <p className="text-sm mt-0.5" style={{ color: "var(--fg-3)" }}>
                Showing cheapest available fare per destination
              </p>
            </div>
            <div
              className="flex rounded-lg border overflow-hidden text-sm"
              style={{ borderColor: "var(--border)" }}
            >
              {(["list", "map"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className="px-4 py-2 capitalize transition-opacity"
                  style={{
                    backgroundColor: view === v ? "var(--fg)" : "var(--bg)",
                    color: view === v ? "var(--accent-fg)" : "var(--fg-2)",
                  }}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          {view === "list" && (
            <div className="space-y-2">
              {flights.map((f) => <FlightCard key={f.id} flight={f} />)}
            </div>
          )}

          {view === "map" && (
            <div className="rounded-xl overflow-hidden border" style={{ borderColor: "var(--border)", height: 520 }}>
              <FlightMap preloadedFlights={flights} origin={origin} />
            </div>
          )}
        </>
      )}

      {!loading && searched && flights.length === 0 && (
        <div className="py-24 text-center">
          <p className="text-4xl mb-4">🔍</p>
          <p className="text-base font-medium mb-1" style={{ color: "var(--fg)" }}>No flights found from {origin}</p>
          <p className="text-sm" style={{ color: "var(--fg-3)" }}>
            Try a different airport or come back closer to your travel date.
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
