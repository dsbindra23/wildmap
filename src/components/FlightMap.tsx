"use client";

import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Loader2 } from "lucide-react";
import type { SearchResult } from "@/lib/duffel";
import { formatPrice } from "@/lib/utils";

const AIRPORT_COORDS: Record<string, [number, number]> = {
  // Northeast
  JFK: [40.6413, -73.7781], LGA: [40.7769, -73.874], EWR: [40.6895, -74.1745],
  BOS: [42.3656, -71.0096], BUF: [42.9405, -78.7322], BDL: [41.9389, -72.6832],
  SYR: [43.1112, -76.1063],
  // Mid-Atlantic
  PHL: [39.8729, -75.2437], BWI: [39.1754, -76.6682], DCA: [38.8512, -77.0402],
  IAD: [38.9531, -77.4565], PIT: [40.4917, -80.2329], RIC: [37.5052, -77.3197],
  ORF: [36.8976, -76.0178],
  // Southeast
  ATL: [33.6407, -84.4277], CLT: [35.2144, -80.9473], RDU: [35.8801, -78.788],
  MIA: [25.7959, -80.287], FLL: [26.0726, -80.1527], TPA: [27.9755, -82.5332],
  MCO: [28.4294, -81.3089], PBI: [26.6832, -80.0956], RSW: [26.5362, -81.7552],
  SRQ: [27.3954, -82.5544], JAX: [30.4941, -81.6879], MSY: [29.9902, -90.258],
  BNA: [36.1245, -86.6782], MEM: [35.0424, -89.9767], CHS: [32.8987, -80.0405],
  // Midwest
  ORD: [41.9742, -87.9073], MDW: [41.7868, -87.7522], DTW: [42.2162, -83.3554],
  MSP: [44.8848, -93.2223], MCI: [39.2976, -94.7139], STL: [38.7487, -90.37],
  CMH: [39.998, -82.8919], CLE: [41.4117, -81.8498], CVG: [39.0488, -84.6678],
  IND: [39.7173, -86.2944], MKE: [42.9472, -87.8966], GRR: [42.8808, -85.5228],
  OMA: [41.3032, -95.8941], OKC: [35.3931, -97.6007], XNA: [36.2819, -94.3069],
  // Texas
  DFW: [32.8998, -97.0403], AUS: [30.1975, -97.6664], HOU: [29.6454, -95.2789],
  SAT: [29.5337, -98.4698], ELP: [31.8072, -106.3779],
  // Mountain West
  DEN: [39.8561, -104.6737], SLC: [40.7899, -111.9791], BOI: [43.5644, -116.2228],
  RNO: [39.4991, -119.7681],
  // Southwest
  LAS: [36.084, -115.1537], PHX: [33.4373, -112.0078], TUS: [32.1161, -110.941],
  // Pacific
  LAX: [33.9425, -118.4081], SFO: [37.6213, -122.379], SAN: [32.7338, -117.1933],
  BUR: [34.2006, -118.3584], ONT: [34.056, -117.6012], SNA: [33.6757, -117.8682],
  SJC: [37.3626, -121.929], SMF: [38.6954, -121.5908],
  // Pacific NW
  SEA: [47.4502, -122.3088], PDX: [45.5898, -122.5951], GEG: [47.6199, -117.5338],
  // US Territories
  SJU: [18.4394, -66.0018],
  // Mexico
  CUN: [21.0365, -86.8771], PVR: [20.6801, -105.2544], SJD: [23.1518, -109.7215],
  GDL: [20.5218, -103.3111], MZT: [23.1614, -106.2661],
  // Caribbean
  PUJ: [18.5674, -68.3634], SDQ: [18.4297, -69.6689],
  // Central America
  GUA: [14.5833, -90.5275], SAL: [13.4409, -89.0557],
};

interface Props {
  preloadedFlights?: SearchResult[];
  origin?: string;
}

interface AirportSuggestion { iataCode: string; city: string; name: string; }

function MapFit({ coords }: { coords: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (coords.length > 1) map.fitBounds(coords, { padding: [60, 60], maxZoom: 7 });
  }, [coords, map]);
  return null;
}

// Animated plane route layer — uses imperative Leaflet for animation control
function RouteLayer({ flight, originCoord }: { flight: SearchResult; originCoord: [number, number] }) {
  const map = useMap();
  const destCoord = AIRPORT_COORDS[flight.destination];
  const [hovered, setHovered] = useState(false);
  const animRef = useRef<number | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const tRef = useRef(0);

  const stopAnim = () => {
    if (animRef.current !== null) cancelAnimationFrame(animRef.current);
    animRef.current = null;
    if (markerRef.current) { map.removeLayer(markerRef.current); markerRef.current = null; }
    tRef.current = 0;
  };

  const startAnim = () => {
    if (!destCoord) return;
    const dLat = destCoord[0] - originCoord[0];
    const dLon = destCoord[1] - originCoord[1];
    const angleDeg = Math.atan2(dLon, dLat) * 180 / Math.PI;

    const icon = L.divIcon({
      html: `<div style="color:#00d4b4;font-size:15px;transform:rotate(${angleDeg}deg);filter:drop-shadow(0 0 5px #00d4b4);pointer-events:none">✈</div>`,
      className: "",
      iconSize: [18, 18],
      iconAnchor: [9, 9],
    });
    markerRef.current = L.marker(originCoord, { icon, interactive: false, zIndexOffset: 1000 }).addTo(map);

    const animate = () => {
      tRef.current = (tRef.current + 0.004) % 1;
      const lat = originCoord[0] + dLat * tRef.current;
      const lng = originCoord[1] + dLon * tRef.current;
      markerRef.current?.setLatLng([lat, lng]);
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => () => stopAnim(), []); // cleanup on unmount

  if (!destCoord) return null;

  return (
    <>
      <Polyline
        positions={[originCoord, destCoord]}
        pathOptions={{
          color: hovered ? "#00d4b4" : "rgba(255,255,255,0.18)",
          weight: hovered ? 2 : 1.5,
          dashArray: "6 9",
          opacity: hovered ? 1 : 0.55,
        }}
        eventHandlers={{
          mouseover: () => { setHovered(true); startAnim(); },
          mouseout: () => { setHovered(false); stopAnim(); },
        }}
      >
        <Popup>
          <div style={{ fontFamily: "monospace", fontSize: 13, minWidth: 140, background: "#0d1b2e", color: "#e8f0f8", padding: 10, borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)" }}>
            <div style={{ fontFamily: "sans-serif", fontWeight: 700, marginBottom: 2 }}>
              {flight.origin} → {flight.destination}
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#ff7a1a", marginBottom: 4 }}>
              {formatPrice(flight.price, flight.currency)}
            </div>
            <div style={{ fontSize: 11, color: "#8ba0b8", marginBottom: 8 }}>{flight.destinationCity}</div>
            <a
              href={`https://www.flyfrontier.com/flights/search?origin=${flight.origin}&destination=${flight.destination}&departDate=${flight.departureTime.split("T")[0]}&adults=1`}
              target="_blank" rel="noopener noreferrer"
              style={{ display: "inline-block", background: "#e8f0f8", color: "#060d1a", fontSize: 11, padding: "4px 12px", borderRadius: 6, textDecoration: "none", fontWeight: 700 }}
            >
              Book on Frontier →
            </a>
          </div>
        </Popup>
      </Polyline>

      {/* Destination dot */}
      <CircleMarker
        center={destCoord}
        radius={hovered ? 7 : 5}
        pathOptions={{
          color: hovered ? "#00d4b4" : "rgba(255,255,255,0.5)",
          fillColor: hovered ? "#00d4b4" : "#0d1b2e",
          fillOpacity: 0.9,
          weight: hovered ? 2 : 1,
        }}
        eventHandlers={{
          mouseover: () => { setHovered(true); startAnim(); },
          mouseout: () => { setHovered(false); stopAnim(); },
        }}
      >
        <Popup>
          <div style={{ fontFamily: "monospace", fontSize: 13, minWidth: 140, background: "#0d1b2e", color: "#e8f0f8", padding: 10, borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)" }}>
            <div style={{ fontFamily: "sans-serif", fontWeight: 700, marginBottom: 2 }}>
              {flight.origin} → {flight.destination}
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#ff7a1a", marginBottom: 4 }}>
              {formatPrice(flight.price, flight.currency)}
            </div>
            <div style={{ fontSize: 11, color: "#8ba0b8", marginBottom: 8 }}>{flight.destinationCity}</div>
            <a
              href={`https://www.flyfrontier.com/flights/search?origin=${flight.origin}&destination=${flight.destination}&departDate=${flight.departureTime.split("T")[0]}&adults=1`}
              target="_blank" rel="noopener noreferrer"
              style={{ display: "inline-block", background: "#e8f0f8", color: "#060d1a", fontSize: 11, padding: "4px 12px", borderRadius: 6, textDecoration: "none", fontWeight: 700 }}
            >
              Book on Frontier →
            </a>
          </div>
        </Popup>
      </CircleMarker>
    </>
  );
}

function AirportSearch({ value, onChange }: { value: string; onChange: (iata: string) => void }) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<AirportSuggestion[]>([]);
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

  const pick = (r: AirportSuggestion) => {
    setQuery(`${r.city} (${r.iataCode})`);
    onChange(r.iataCode);
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <input
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Home airport..."
        className="bg-transparent outline-none text-xs w-36"
        style={{ color: "#e8f0f8" }}
        onFocus={() => results.length > 0 && setOpen(true)}
      />
      {open && results.length > 0 && (
        <div className="absolute z-[2000] top-full mt-1 w-52 rounded-lg overflow-hidden shadow-xl"
          style={{ backgroundColor: "#0d1b2e", border: "1px solid rgba(255,255,255,0.14)" }}>
          {results.map((r) => (
            <button key={r.iataCode} type="button" onClick={() => pick(r)}
              className="w-full text-left px-3 py-2.5 text-xs flex items-center gap-2 hover:opacity-70 transition-opacity border-b last:border-0"
              style={{ borderColor: "rgba(255,255,255,0.07)", color: "#e8f0f8" }}>
              <span className="font-bold w-8 shrink-0" style={{ fontFamily: "monospace" }}>{r.iataCode}</span>
              <span style={{ color: "#8ba0b8" }}>{r.city}</span>
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
    const dests = Object.keys(AIRPORT_COORDS).filter((c) => c !== originCode).slice(0, 18);
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

  const originCoord = AIRPORT_COORDS[origin];
  const destCoords = flights.filter((f) => AIRPORT_COORDS[f.destination]).map((f) => AIRPORT_COORDS[f.destination]);

  return (
    <div className="h-full w-full relative" style={{ minHeight: 480 }}>
      {/* Floating controls — only on standalone map page */}
      {!preloadedFlights && (
        <div
          className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-3 px-4 py-2.5 rounded-xl shadow-lg"
          style={{ backgroundColor: "rgba(13,27,46,0.95)", border: "1px solid rgba(255,255,255,0.14)", backdropFilter: "blur(10px)" }}
        >
          <AirportSearch value={origin} onChange={setOrigin} />
          <div style={{ width: 1, height: 20, backgroundColor: "rgba(255,255,255,0.14)" }} />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="text-xs outline-none bg-transparent"
            style={{ color: "#8ba0b8" }}
          />
          <button
            onClick={() => search()}
            disabled={loading}
            className="flex items-center gap-1.5 disabled:opacity-50"
            style={{ fontFamily: "var(--font-bebas, sans-serif)", letterSpacing: "0.1em", fontSize: 13, color: "#00d4b4" }}
          >
            {loading && <Loader2 className="w-3 h-3 animate-spin" />}
            {loading ? "Loading" : "Show"}
          </button>
        </div>
      )}

      <MapContainer
        center={[38, -95]}
        zoom={4}
        style={{ height: "100%", width: "100%", minHeight: 480, background: "#060d1a" }}
        zoomControl={false}
      >
        {/* CartoDB Dark Matter — matches navy theme */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {destCoords.length > 1 && <MapFit coords={destCoords} />}

        {/* Origin marker */}
        {originCoord && (
          <CircleMarker
            center={originCoord}
            radius={7}
            pathOptions={{ color: "#00d4b4", fillColor: "#00d4b4", fillOpacity: 1, weight: 0 }}
          >
            <Popup>
              <div style={{ background: "#0d1b2e", color: "#e8f0f8", padding: "8px 12px", borderRadius: 8, fontSize: 13, border: "1px solid rgba(255,255,255,0.1)" }}>
                <strong>{origin}</strong> — your origin
              </div>
            </Popup>
          </CircleMarker>
        )}

        {/* Dotted animated routes */}
        {originCoord && flights.filter((f) => AIRPORT_COORDS[f.destination]).map((f) => (
          <RouteLayer key={f.id} flight={f} originCoord={originCoord} />
        ))}
      </MapContainer>

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm"
            style={{ backgroundColor: "rgba(13,27,46,0.95)", color: "#8ba0b8", border: "1px solid rgba(255,255,255,0.14)" }}>
            <Loader2 className="w-4 h-4 animate-spin" style={{ color: "#00d4b4" }} />
            <span style={{ fontFamily: "monospace" }}>Fetching routes...</span>
          </div>
        </div>
      )}
    </div>
  );
}
