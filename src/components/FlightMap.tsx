"use client";

import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Loader2, Search } from "lucide-react";
import type { SearchResult } from "@/lib/duffel";
import { formatPrice } from "@/lib/utils";

const AIRPORT_COORDS: Record<string, [number, number]> = {
  JFK: [40.6413, -73.7781], LGA: [40.7769, -73.874], EWR: [40.6895, -74.1745],
  LAX: [33.9425, -118.4081], SFO: [37.6213, -122.379], LAS: [36.084, -115.1537],
  ORD: [41.9742, -87.9073], MDW: [41.7868, -87.7522], DEN: [39.8561, -104.6737],
  MIA: [25.7959, -80.287], FLL: [26.0726, -80.1527], TPA: [27.9755, -82.5332],
  ATL: [33.6407, -84.4277], DFW: [32.8998, -97.0403], IAH: [29.9902, -95.3368],
  PHX: [33.4373, -112.0078], SEA: [47.4502, -122.3088], BOS: [42.3656, -71.0096],
  DTW: [42.2162, -83.3554], MSP: [44.8848, -93.2223], CLT: [35.2144, -80.9473],
  PHL: [39.8729, -75.2437], BWI: [39.1754, -76.6682], DCA: [38.8512, -77.0402],
  MCO: [28.4294, -81.3089], SAN: [32.7338, -117.1933], PDX: [45.5898, -122.5951],
  SLC: [40.7899, -111.9791], AUS: [30.1975, -97.6664], BNA: [36.1245, -86.6782],
  RDU: [35.8801, -78.788], STL: [38.7487, -90.37], MCI: [39.2976, -94.7139],
  CUN: [21.0365, -86.8771], MEX: [19.4363, -99.0721], CZM: [20.5224, -86.9256],
};

const POPULAR_DESTINATIONS = Object.keys(AIRPORT_COORDS);

interface Props {
  preloadedFlights?: SearchResult[];
  origin?: string;
}

interface AirportSuggestion {
  iataCode: string;
  city: string;
  name: string;
}

function MapFit({ coords }: { coords: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (coords.length > 1) {
      map.fitBounds(coords as [number, number][], { padding: [50, 50], maxZoom: 8 });
    }
  }, [coords, map]);
  return null;
}

function AirportSearch({ value, onChange }: { value: string; onChange: (iata: string, label: string) => void }) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<AirportSuggestion[]>([]);
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

  const pick = (r: AirportSuggestion) => {
    setQuery(`${r.city} (${r.iataCode})`);
    onChange(r.iataCode, `${r.city} (${r.iataCode})`);
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg border text-xs"
        style={{ borderColor: "var(--border)", backgroundColor: "var(--bg)", color: "var(--fg)" }}>
        <Search className="w-3 h-3 shrink-0" style={{ color: "var(--fg-3)" }} />
        <input
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Home airport..."
          className="bg-transparent outline-none w-32 text-xs"
          style={{ color: "var(--fg)" }}
          onFocus={() => results.length > 0 && setOpen(true)}
        />
      </div>
      {open && results.length > 0 && (
        <div className="absolute z-[2000] top-full mt-1 w-52 rounded-lg border shadow-lg overflow-hidden"
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

export default function FlightMap({ preloadedFlights, origin: preloadedOrigin }: Props) {
  const [origin, setOrigin] = useState(preloadedOrigin || "JFK");
  const [date, setDate] = useState(new Date(Date.now() + 3 * 86400000).toISOString().split("T")[0]);
  const [flights, setFlights] = useState<SearchResult[]>(preloadedFlights || []);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(!!preloadedFlights?.length);

  const search = async (originCode = origin) => {
    setLoading(true);
    setSearched(true);
    const dests = POPULAR_DESTINATIONS.filter((c) => c !== originCode).slice(0, 16);
    const results = await Promise.allSettled(
      dests.map((dest) =>
        fetch("/api/flights/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ origin: originCode, destination: dest, date, passengers: 1 }),
        }).then((r) => r.json())
      )
    );
    const all: SearchResult[] = [];
    results.forEach((r) => {
      if (r.status === "fulfilled" && r.value.results?.length) {
        const cheapest: SearchResult = r.value.results.reduce(
          (min: SearchResult, f: SearchResult) => parseFloat(f.price) < parseFloat(min.price) ? f : min,
          r.value.results[0]
        );
        all.push(cheapest);
      }
    });
    setFlights(all);
    setLoading(false);
  };

  const destCoords = flights
    .filter((f) => AIRPORT_COORDS[f.destination])
    .map((f) => AIRPORT_COORDS[f.destination]);

  const originCoord = AIRPORT_COORDS[origin];

  return (
    <div className="h-full w-full relative" style={{ minHeight: 480 }}>
      {/* Floating controls — only on standalone map page */}
      {!preloadedFlights && (
        <div
          className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-2 px-3 py-2 rounded-xl border shadow-md"
          style={{ backgroundColor: "var(--bg)", borderColor: "var(--border)" }}
        >
          <AirportSearch
            value={origin}
            onChange={(iata) => setOrigin(iata)}
          />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="text-xs border rounded-lg px-2 py-2 outline-none"
            style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-2)", color: "var(--fg)" }}
          />
          <button
            onClick={() => search()}
            disabled={loading}
            className="text-xs font-medium px-3 py-2 rounded-lg btn-primary flex items-center gap-1.5 disabled:opacity-50"
          >
            {loading && <Loader2 className="w-3 h-3 animate-spin" />}
            {loading ? "Loading" : "Show"}
          </button>
        </div>
      )}

      <MapContainer
        center={[38, -96]}
        zoom={4}
        style={{ height: "100%", width: "100%", minHeight: 480 }}
        zoomControl={false}
      >
        {/* CartoDB Positron — clean, minimal, light-grey style */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />

        {destCoords.length > 1 && <MapFit coords={destCoords} />}

        {/* Origin marker — filled dark circle */}
        {originCoord && (
          <CircleMarker
            center={originCoord}
            radius={8}
            pathOptions={{ color: "var(--fg, #252525)", fillColor: "var(--fg, #252525)", fillOpacity: 1, weight: 2 }}
          >
            <Popup>
              <div style={{ fontFamily: "inherit", fontSize: 13 }}>
                <strong>{origin}</strong> — departure
              </div>
            </Popup>
          </CircleMarker>
        )}

        {/* Destination markers — price pill rendered as DivIcon via CircleMarker tooltip overlay */}
        {flights.filter((f) => AIRPORT_COORDS[f.destination]).map((f) => {
          const pos = AIRPORT_COORDS[f.destination];
          return (
            <CircleMarker
              key={f.id}
              center={pos}
              radius={5}
              pathOptions={{
                color: "#ffffff",
                fillColor: "#252525",
                fillOpacity: 0.9,
                weight: 1.5,
              }}
            >
              <Popup>
                <div style={{ fontFamily: "inherit", fontSize: 13, minWidth: 130 }}>
                  <div style={{ fontWeight: 700, marginBottom: 2 }}>
                    {origin} → {f.destination}
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>
                    {formatPrice(f.price, f.currency)}
                  </div>
                  <div style={{ color: "#7D7D7D", fontSize: 11, marginBottom: 6 }}>
                    {f.destinationCity}
                  </div>
                  <a
                    href={`https://www.flyfrontier.com/flights/search?origin=${origin}&destination=${f.destination}&departDate=${f.departureTime.split("T")[0]}&adults=1`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-block",
                      background: "#252525",
                      color: "#fff",
                      fontSize: 11,
                      padding: "3px 10px",
                      borderRadius: 6,
                      textDecoration: "none",
                      fontWeight: 600,
                    }}
                  >
                    Book on Frontier →
                  </a>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>

      {/* Price label overlays via SVG tooltips — Leaflet DivIcon approach on top */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm shadow-lg"
            style={{ backgroundColor: "var(--bg)", color: "var(--fg-2)", border: "1px solid var(--border)" }}>
            <Loader2 className="w-4 h-4 animate-spin" />
            Fetching prices...
          </div>
        </div>
      )}

      {!searched && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center px-6 py-5 rounded-xl shadow-lg"
            style={{ backgroundColor: "var(--bg)", border: "1px solid var(--border)" }}>
            <div className="text-2xl mb-2">🗺</div>
            <div className="text-sm font-medium" style={{ color: "var(--fg)" }}>
              Search an airport above to see destinations
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
