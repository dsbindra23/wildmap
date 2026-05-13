"use client";

import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Loader2 } from "lucide-react";
import type { SearchResult } from "@/lib/duffel";
import { formatPrice } from "@/lib/utils";

// ─── Airport coordinates ───────────────────────────────────────────────
const AIRPORT_COORDS: Record<string, [number, number]> = {
  JFK: [40.6413, -73.7781], LGA: [40.7769, -73.874], EWR: [40.6895, -74.1745],
  BOS: [42.3656, -71.0096], BUF: [42.9405, -78.7322], BDL: [41.9389, -72.6832],
  SYR: [43.1112, -76.1063],
  PHL: [39.8729, -75.2437], BWI: [39.1754, -76.6682], DCA: [38.8512, -77.0402],
  IAD: [38.9531, -77.4565], PIT: [40.4917, -80.2329], RIC: [37.5052, -77.3197],
  ORF: [36.8976, -76.0178],
  ATL: [33.6407, -84.4277], CLT: [35.2144, -80.9473], RDU: [35.8801, -78.788],
  MIA: [25.7959, -80.287], FLL: [26.0726, -80.1527], TPA: [27.9755, -82.5332],
  MCO: [28.4294, -81.3089], PBI: [26.6832, -80.0956], RSW: [26.5362, -81.7552],
  SRQ: [27.3954, -82.5544], JAX: [30.4941, -81.6879], MSY: [29.9902, -90.258],
  BNA: [36.1245, -86.6782], MEM: [35.0424, -89.9767], CHS: [32.8987, -80.0405],
  ORD: [41.9742, -87.9073], MDW: [41.7868, -87.7522], DTW: [42.2162, -83.3554],
  MSP: [44.8848, -93.2223], MCI: [39.2976, -94.7139], STL: [38.7487, -90.37],
  CMH: [39.998, -82.8919], CLE: [41.4117, -81.8498], CVG: [39.0488, -84.6678],
  IND: [39.7173, -86.2944], MKE: [42.9472, -87.8966], GRR: [42.8808, -85.5228],
  OMA: [41.3032, -95.8941], OKC: [35.3931, -97.6007], XNA: [36.2819, -94.3069],
  DFW: [32.8998, -97.0403], AUS: [30.1975, -97.6664], HOU: [29.6454, -95.2789],
  SAT: [29.5337, -98.4698], ELP: [31.8072, -106.3779],
  DEN: [39.8561, -104.6737], SLC: [40.7899, -111.9791], BOI: [43.5644, -116.2228],
  RNO: [39.4991, -119.7681],
  LAS: [36.084, -115.1537], PHX: [33.4373, -112.0078], TUS: [32.1161, -110.941],
  LAX: [33.9425, -118.4081], SFO: [37.6213, -122.379], SAN: [32.7338, -117.1933],
  BUR: [34.2006, -118.3584], ONT: [34.056, -117.6012], SNA: [33.6757, -117.8682],
  SJC: [37.3626, -121.929], SMF: [38.6954, -121.5908],
  SEA: [47.4502, -122.3088], PDX: [45.5898, -122.5951], GEG: [47.6199, -117.5338],
  SJU: [18.4394, -66.0018],
  CUN: [21.0365, -86.8771], PVR: [20.6801, -105.2544], SJD: [23.1518, -109.7215],
  GDL: [20.5218, -103.3111], MZT: [23.1614, -106.2661],
  PUJ: [18.5674, -68.3634], SDQ: [18.4297, -69.6689],
  GUA: [14.5833, -90.5275], SAL: [13.4409, -89.0557],
};

// ─── Bezier helpers ────────────────────────────────────────────────────
function haversineKm(p1: [number, number], p2: [number, number]): number {
  const R = 6371, r = Math.PI / 180;
  const dLat = (p2[0] - p1[0]) * r, dLon = (p2[1] - p1[1]) * r;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(p1[0] * r) * Math.cos(p2[0] * r) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(a));
}

// Quadratic bezier control point — arcs northward for great-circle feel
function bezierCtrl(p0: [number, number], p1: [number, number]): [number, number] {
  const km = haversineKm(p0, p1);
  const lift = km < 400 ? 1.5 : Math.min(11, km / 450);
  return [(p0[0] + p1[0]) / 2 + lift, (p0[1] + p1[1]) / 2];
}

function bezierAt(p0: [number, number], c: [number, number], p1: [number, number], t: number): [number, number] {
  const m = 1 - t;
  return [m * m * p0[0] + 2 * m * t * c[0] + t * t * p1[0], m * m * p0[1] + 2 * m * t * c[1] + t * t * p1[1]];
}

function bezierPts(p0: [number, number], c: [number, number], p1: [number, number], n = 80): [number, number][] {
  return Array.from({ length: n }, (_, i) => bezierAt(p0, c, p1, i / (n - 1)));
}

// Ease in-out for cinematic flight feel
function easeIO(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

// Parse ISO 8601 duration → seconds
function parseIsoDur(s: string): number {
  const m = s?.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 3600;
  return (+(m[1] || 0)) * 3600 + (+(m[2] || 0)) * 60 + (+(m[3] || 0));
}

function fmtSimTime(secs: number): string {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = Math.floor(secs % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// ─── Constants ─────────────────────────────────────────────────────────
const BASE_DURATION_SEC = 30; // wall-clock seconds at 1× speed for full arc
const SPEEDS = [1, 8, 16, 64, 128] as const;
type Speed = (typeof SPEEDS)[number];

interface Props { preloadedFlights?: SearchResult[]; origin?: string; }
interface AirportSuggestion { iataCode: string; city: string; name: string; }

// ─── MapFit ────────────────────────────────────────────────────────────
function MapFit({ coords }: { coords: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (coords.length > 1) map.fitBounds(coords as L.LatLngBoundsExpression, { padding: [60, 60], maxZoom: 7 });
  }, [coords, map]);
  return null;
}

// ─── RouteArc ──────────────────────────────────────────────────────────
// Renders one flight's curved arc + destination dot, handles click-to-select.
// All Leaflet layers are created imperatively for direct SVG path access.
function RouteArc({
  flight, originCoord, selectedId, onSelect, mapTheme,
}: {
  flight: SearchResult;
  originCoord: [number, number];
  selectedId: string | null;
  onSelect: (id: string) => void;
  mapTheme: "night" | "day";
}) {
  const map = useMap();
  const dest = AIRPORT_COORDS[flight.destination];
  const arcRef = useRef<L.Polyline | null>(null);
  const hitRef = useRef<L.Polyline | null>(null);
  const dotRef = useRef<L.CircleMarker | null>(null);

  const teal = mapTheme === "day" ? "#0d9488" : "#00d4b4";
  const bgFill = mapTheme === "day" ? "#f8f6f0" : "#0d1b2e";

  // Mount layers once per flight/theme
  useEffect(() => {
    if (!dest) return;
    const ctrl = bezierCtrl(originCoord, dest);
    const pts = bezierPts(originCoord, ctrl, dest);

    // Visible arc — dashed, at rest
    const arc = L.polyline(pts as L.LatLngExpression[], {
      color: teal, weight: 1.5, opacity: 0.35, dashArray: "4 6", interactive: false,
    }).addTo(map);
    arcRef.current = arc;

    // Apply smooth CSS transitions and slow dashoffset animation after render
    requestAnimationFrame(() => {
      const svgPath = (arc as any)._path as SVGPathElement | undefined;
      if (svgPath) {
        svgPath.style.transition = "opacity 350ms ease-out, stroke-width 300ms ease-out";
        svgPath.style.animation = "wm-dash 40s linear infinite";
      }
    });

    // Wide invisible hit area for easy clicking
    const hit = L.polyline(pts as L.LatLngExpression[], { color: "#fff", weight: 22, opacity: 0.001 }).addTo(map);
    hitRef.current = hit;
    hit.on("click", () => onSelect(flight.id));
    hit.on("mouseover", () => {
      const p = (arcRef.current as any)?._path as SVGPathElement | undefined;
      if (p) p.style.opacity = "0.7";
      dotRef.current?.setRadius(8);
    });
    hit.on("mouseout", () => {
      // Opacity restored by the selection-state effect
      const isSelected = arcRef.current && (arcRef.current as any).__wmSelected;
      const isFaded = arcRef.current && (arcRef.current as any).__wmFaded;
      const p = (arcRef.current as any)?._path as SVGPathElement | undefined;
      if (p) p.style.opacity = isSelected ? "1" : isFaded ? "0.12" : "0.35";
      dotRef.current?.setRadius(isSelected ? 6 : 5);
    });

    // Destination dot
    const dot = L.circleMarker(dest as L.LatLngExpression, {
      radius: 5, color: teal, weight: 1.5, fillColor: bgFill, fillOpacity: 0.9, opacity: 0.4,
    }).addTo(map);
    dotRef.current = dot;
    dot.on("click", () => onSelect(flight.id));
    dot.on("mouseover", () => dot.setRadius(8));
    dot.on("mouseout", () => dot.setRadius((dot as any).__wmSelected ? 6 : 5));

    // Popup on dot
    const bookUrl = `https://www.flyfrontier.com/flights/search?origin=${flight.origin}&destination=${flight.destination}&departDate=${flight.departureTime.split("T")[0]}&adults=1`;
    dot.bindPopup(
      `<div style="font-family:sans-serif;font-size:13px;min-width:148px;background:#0d1b2e;color:#e8f0f8;padding:10px;border-radius:8px;border:1px solid rgba(255,255,255,0.1)">` +
      `<div style="font-size:15px;margin-bottom:2px">${flight.origin} → ${flight.destination}</div>` +
      `<div style="font-size:22px;color:#ff7a1a;margin-bottom:4px">${formatPrice(flight.price, flight.currency)}</div>` +
      `<div style="font-size:11px;color:#8ba0b8;margin-bottom:8px">${(flight.destinationCity || "").toUpperCase()}</div>` +
      `<a href="${bookUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;background:#e8f0f8;color:#060d1a;font-size:11px;padding:5px 13px;border-radius:6px;text-decoration:none;font-weight:700">BOOK ON FRONTIER →</a></div>`,
      { className: "wm-popup" }
    );

    return () => {
      map.removeLayer(arc);
      map.removeLayer(hit);
      map.removeLayer(dot);
    };
  }, [flight.id, mapTheme]); // eslint-disable-line react-hooks/exhaustive-deps

  // React to selection state changes
  useEffect(() => {
    const isSelected = selectedId === flight.id;
    const isFaded = selectedId !== null && !isSelected;

    // Store state on layer object for the hover handlers
    if (arcRef.current) {
      (arcRef.current as any).__wmSelected = isSelected;
      (arcRef.current as any).__wmFaded = isFaded;
    }
    if (dotRef.current) (dotRef.current as any).__wmSelected = isSelected;

    const svgPath = (arcRef.current as any)?._path as SVGPathElement | undefined;
    if (svgPath) {
      if (isSelected) {
        svgPath.style.opacity = "1";
        svgPath.style.strokeWidth = "2px";
        svgPath.style.strokeDasharray = "none";
        svgPath.style.animation = "none";
      } else if (isFaded) {
        svgPath.style.opacity = "0.12";
        svgPath.style.strokeWidth = "1.5px";
        svgPath.style.strokeDasharray = "4 6";
        svgPath.style.animation = "wm-dash 40s linear infinite";
      } else {
        svgPath.style.opacity = "0.35";
        svgPath.style.strokeWidth = "1.5px";
        svgPath.style.strokeDasharray = "4 6";
        svgPath.style.animation = "wm-dash 40s linear infinite";
      }
    }

    const dotPath = (dotRef.current as any)?._path as SVGPathElement | undefined;
    if (dotPath) {
      dotPath.style.transition = "opacity 350ms ease-out";
      dotPath.style.opacity = isSelected ? "1" : isFaded ? "0.12" : "0.4";
    }
    if (isSelected) {
      dotRef.current?.setStyle({ fillColor: teal });
      dotRef.current?.setRadius(6);
    } else {
      dotRef.current?.setStyle({ fillColor: bgFill });
      dotRef.current?.setRadius(5);
    }
  }, [selectedId, flight.id, teal, bgFill]);

  return null;
}

// ─── PlaybackLayer ─────────────────────────────────────────────────────
// Lives inside MapContainer. Manages the animated plane + trail polylines.
function PlaybackLayer({
  flight, originCoord, isPlaying, speed, mapTheme, progressRef, timerElRef, onComplete,
}: {
  flight: SearchResult;
  originCoord: [number, number];
  isPlaying: boolean;
  speed: Speed;
  mapTheme: "night" | "day";
  progressRef: { current: number };
  timerElRef: React.RefObject<HTMLSpanElement | null>;
  onComplete: () => void;
}) {
  const map = useMap();
  const dest = AIRPORT_COORDS[flight.destination];
  const ctrl = dest ? bezierCtrl(originCoord, dest) : null;

  const ptsRef = useRef<[number, number][]>([]);
  const planeMarkerRef = useRef<L.Marker | null>(null);
  const planeElRef = useRef<HTMLElement | null>(null);
  const trailRef = useRef<L.Polyline | null>(null);
  const trailGlowRef = useRef<L.Polyline | null>(null);
  const animRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);
  const speedRef = useRef(speed);
  const isPlayingRef = useRef(isPlaying);
  const completedRef = useRef(false);
  const flightDurSec = parseIsoDur(flight.duration);

  const teal = mapTheme === "day" ? "#0d9488" : "#00d4b4";
  const planeFill = mapTheme === "day" ? "#0f1f2e" : "#00d4b4";

  useEffect(() => { speedRef.current = speed; }, [speed]);
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);

  // Mount plane marker + trail polylines once per selected flight
  useEffect(() => {
    if (!dest || !ctrl) return;
    ptsRef.current = bezierPts(originCoord, ctrl, dest, 80);
    completedRef.current = false;

    const planeSvg =
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-12 -9 24 18" width="28" height="22" style="display:block">` +
      `<path d="M9,0 L-4,-2 L-9,-1.5 L-10.5,0 L-9,1.5 L-4,2 Z" fill="${planeFill}"/>` +
      `<path d="M0.5,-1.5 L-4.5,-9 L-6.5,-6 L-1.5,0 Z" fill="${planeFill}"/>` +
      `<path d="M0.5,1.5 L-4.5,9 L-6.5,6 L-1.5,0 Z" fill="${planeFill}"/>` +
      `<path d="M-8,-1.5 L-11.5,-5 L-10,-1.5 Z" fill="${planeFill}" opacity="0.8"/>` +
      `<path d="M-8,1.5 L-11.5,5 L-10,1.5 Z" fill="${planeFill}" opacity="0.8"/>` +
      `</svg>`;

    const marker = L.marker(originCoord as L.LatLngExpression, {
      icon: L.divIcon({
        html: `<div id="wm-plane" style="pointer-events:none;will-change:transform;transform-origin:center center;opacity:0;transition:opacity 300ms ease-out">${planeSvg}</div>`,
        className: "",
        iconSize: [28, 22],
        iconAnchor: [14, 11],
      }),
      interactive: false,
      zIndexOffset: 2000,
    }).addTo(map);
    planeMarkerRef.current = marker;

    trailGlowRef.current = L.polyline([], { color: teal, weight: 10, opacity: 0, interactive: false }).addTo(map);
    trailRef.current = L.polyline([], { color: teal, weight: 2.5, opacity: 0, interactive: false }).addTo(map);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      map.removeLayer(marker);
      if (trailRef.current) { map.removeLayer(trailRef.current); trailRef.current = null; }
      if (trailGlowRef.current) { map.removeLayer(trailGlowRef.current); trailGlowRef.current = null; }
      planeElRef.current = null;
    };
  }, [flight.id, mapTheme]); // eslint-disable-line react-hooks/exhaustive-deps

  // Start / pause animation based on isPlaying
  useEffect(() => {
    if (!isPlaying) {
      if (animRef.current) { cancelAnimationFrame(animRef.current); animRef.current = null; }
      lastTsRef.current = null;
      return;
    }
    if (!dest || !ctrl || completedRef.current) return;

    // Fade in plane + trail
    const planeEl = document.getElementById("wm-plane");
    planeElRef.current = planeEl as HTMLElement | null;
    if (planeEl) planeEl.style.opacity = "1";
    trailRef.current?.setStyle({ opacity: 0.9 });
    trailGlowRef.current?.setStyle({ opacity: 0.13 });

    const animate = (ts: number) => {
      if (!isPlayingRef.current) return;

      const dt = lastTsRef.current !== null ? (ts - lastTsRef.current) / 1000 : 0;
      lastTsRef.current = ts;

      // Advance progress (zoom-independent — always wall-clock based)
      progressRef.current = Math.min(progressRef.current + (speedRef.current / BASE_DURATION_SEC) * dt, 1);
      const eased = easeIO(progressRef.current);

      // Position on bezier curve
      const pos = bezierAt(originCoord, ctrl!, dest!, eased);

      // Screen-space tangent angle for plane rotation
      const tA = bezierAt(originCoord, ctrl!, dest!, Math.max(0, eased - 0.02));
      const tB = bezierAt(originCoord, ctrl!, dest!, Math.min(1, eased + 0.02));
      const pA = map.latLngToContainerPoint(tA as L.LatLngExpression);
      const pB = map.latLngToContainerPoint(tB as L.LatLngExpression);
      const angle = Math.atan2(pB.y - pA.y, pB.x - pA.x) * (180 / Math.PI);

      if (!planeElRef.current) planeElRef.current = document.getElementById("wm-plane") as HTMLElement | null;
      if (planeElRef.current) {
        planeElRef.current.style.transform = `rotate(${angle.toFixed(1)}deg)`;
        planeElRef.current.style.filter = `drop-shadow(0 0 8px ${teal}99)`;
      }
      planeMarkerRef.current?.setLatLng(pos as L.LatLngExpression);

      // Trail — slice precomputed bezier points up to current eased progress
      const pts = ptsRef.current;
      const trailEnd = Math.max(1, Math.ceil(eased * (pts.length - 1)));
      const trail = pts.slice(0, trailEnd + 1);
      trailRef.current?.setLatLngs(trail as L.LatLngExpression[]);
      trailGlowRef.current?.setLatLngs(trail as L.LatLngExpression[]);

      // Update timer display directly (no re-render)
      if (timerElRef.current) {
        const elapsed = Math.round(eased * flightDurSec);
        timerElRef.current.textContent = `${fmtSimTime(elapsed)} / ${fmtSimTime(flightDurSec)}`;
      }

      if (progressRef.current >= 1) {
        completedRef.current = true;
        // Fade out plane
        if (planeElRef.current) {
          planeElRef.current.style.transition = "opacity 600ms ease-in, transform 600ms ease-in";
          planeElRef.current.style.opacity = "0";
          planeElRef.current.style.transform = `rotate(${angle.toFixed(1)}deg) scale(1.2)`;
        }
        // Fade trail
        const trailSvg = (trailRef.current as any)?._path as SVGPathElement | undefined;
        if (trailSvg) trailSvg.style.transition = "opacity 800ms ease-in";
        trailRef.current?.setStyle({ opacity: 0 });
        const glowSvg = (trailGlowRef.current as any)?._path as SVGPathElement | undefined;
        if (glowSvg) glowSvg.style.transition = "opacity 800ms ease-in";
        trailGlowRef.current?.setStyle({ opacity: 0 });
        setTimeout(onComplete, 850);
        return;
      }

      animRef.current = requestAnimationFrame(animate);
    };

    lastTsRef.current = null;
    animRef.current = requestAnimationFrame(animate);
    return () => { if (animRef.current) { cancelAnimationFrame(animRef.current); animRef.current = null; } };
  }, [isPlaying, flight.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}

// ─── AirportSearch (for standalone /app/map page) ──────────────────────
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

  const pick = (r: AirportSuggestion) => { setQuery(`${r.city} (${r.iataCode})`); onChange(r.iataCode); setOpen(false); };

  return (
    <div className="relative" ref={ref}>
      <input value={query} onChange={(e) => handleChange(e.target.value)} placeholder="Home airport..."
        className="bg-transparent outline-none text-xs w-36" style={{ color: "#e8f0f8" }}
        onFocus={() => results.length > 0 && setOpen(true)} />
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

// ─── FlightMap ─────────────────────────────────────────────────────────
export default function FlightMap({ preloadedFlights, origin: preloadedOrigin }: Props) {
  const [origin, setOrigin] = useState(preloadedOrigin || "JFK");
  const [date, setDate] = useState(new Date(Date.now() + 3 * 86400000).toISOString().split("T")[0]);
  const [flights, setFlights] = useState<SearchResult[]>(preloadedFlights || []);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(!!preloadedFlights?.length);
  const [mapTheme, setMapTheme] = useState<"night" | "day">("night");

  // Playback state
  const [selectedFlight, setSelectedFlight] = useState<SearchResult | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<Speed>(1);
  const [hasPlayed, setHasPlayed] = useState(false);
  const progressRef = useRef(0);
  const timerElRef = useRef<HTMLSpanElement | null>(null);

  // Theme observer
  useEffect(() => {
    const getTheme = () => (document.documentElement.getAttribute("data-theme") || "night") as "night" | "day";
    setMapTheme(getTheme());
    const obs = new MutationObserver(() => setMapTheme(getTheme()));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => obs.disconnect();
  }, []);

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

  const handleSelect = (id: string) => {
    const flight = flights.find((f) => f.id === id);
    if (!flight) return;
    if (flight.id === selectedFlight?.id) return;

    // Fade out existing plane before switching
    const planeEl = document.getElementById("wm-plane");
    if (planeEl) {
      planeEl.style.transition = "opacity 280ms ease-in";
      planeEl.style.opacity = "0";
    }

    setTimeout(() => {
      setIsPlaying(false);
      progressRef.current = 0;
      setHasPlayed(false);
      setSelectedFlight(flight);
      // Reset timer display
      if (timerElRef.current) {
        timerElRef.current.textContent = `00:00 / ${fmtSimTime(parseIsoDur(flight.duration))}`;
      }
    }, planeEl ? 300 : 0);
  };

  const handlePlay = () => {
    if (!hasPlayed) setHasPlayed(true);
    setIsPlaying(true);
  };

  const handlePause = () => setIsPlaying(false);

  const handleComplete = () => {
    setIsPlaying(false);
    progressRef.current = 0;
    setHasPlayed(false);
    // Keep selectedFlight so the panel stays visible, just reset to ▶
  };

  const handleDeselect = () => {
    setIsPlaying(false);
    progressRef.current = 0;
    setHasPlayed(false);
    setSelectedFlight(null);
  };

  const originCoord = AIRPORT_COORDS[origin];
  const destCoords = flights.filter((f) => AIRPORT_COORDS[f.destination]).map((f) => AIRPORT_COORDS[f.destination]);
  const tileUrl = mapTheme === "day"
    ? "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
  const teal = mapTheme === "day" ? "#0d9488" : "#00d4b4";
  const flightDurSec = selectedFlight ? parseIsoDur(selectedFlight.duration) : 0;

  return (
    <div className="h-full w-full relative" style={{ minHeight: 480 }}>
      {/* CSS keyframes for arc slow-dash animation */}
      <style>{`
        @keyframes wm-dash { from { stroke-dashoffset: 100; } to { stroke-dashoffset: 0; } }
        .wm-popup .leaflet-popup-content-wrapper,
        .wm-popup .leaflet-popup-tip { background: transparent !important; box-shadow: none !important; }
        .wm-popup .leaflet-popup-content { margin: 0 !important; }
      `}</style>

      {/* Standalone map search controls (not shown when preloaded) */}
      {!preloadedFlights && (
        <div
          className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-3 px-4 py-2.5 rounded-xl shadow-lg"
          style={{ backgroundColor: "rgba(13,27,46,0.95)", border: "1px solid rgba(255,255,255,0.14)", backdropFilter: "blur(10px)" }}
        >
          <AirportSearch value={origin} onChange={setOrigin} />
          <div style={{ width: 1, height: 20, backgroundColor: "rgba(255,255,255,0.14)" }} />
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
            className="text-xs outline-none bg-transparent" style={{ color: "#8ba0b8" }} />
          <button onClick={() => search()} disabled={loading}
            className="flex items-center gap-1.5 disabled:opacity-50"
            style={{ fontFamily: "var(--font-bebas, sans-serif)", letterSpacing: "0.1em", fontSize: 13, color: teal }}>
            {loading && <Loader2 className="w-3 h-3 animate-spin" />}
            {loading ? "LOADING" : "SHOW"}
          </button>
        </div>
      )}

      <MapContainer
        center={[38, -95]}
        zoom={4}
        minZoom={3}
        maxZoom={8}
        style={{ height: "100%", width: "100%", minHeight: 480, background: mapTheme === "day" ? "#f8f6f0" : "#060d1a" }}
        zoomControl={false}
      >
        <TileLayer
          key={mapTheme}
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url={tileUrl}
        />

        {destCoords.length > 1 && <MapFit coords={destCoords} />}


        {/* Route arcs */}
        {originCoord && flights.filter((f) => AIRPORT_COORDS[f.destination]).map((f) => (
          <RouteArc
            key={f.id}
            flight={f}
            originCoord={originCoord}
            selectedId={selectedFlight?.id ?? null}
            onSelect={handleSelect}
            mapTheme={mapTheme}
          />
        ))}

        {/* Origin dot (rendered last so it's on top) */}
        {originCoord && <OriginMarker coord={originCoord} teal={teal} origin={origin} />}

        {/* Playback layer — remounts when selected flight changes */}
        {selectedFlight && originCoord && (
          <PlaybackLayer
            key={selectedFlight.id}
            flight={selectedFlight}
            originCoord={originCoord}
            isPlaying={isPlaying}
            speed={speed}
            mapTheme={mapTheme}
            progressRef={progressRef}
            timerElRef={timerElRef}
            onComplete={handleComplete}
          />
        )}
      </MapContainer>

      {/* Play / Timer UI overlay */}
      <div
        style={{
          position: "absolute", bottom: 16, left: 16, zIndex: 1000,
          display: "flex", alignItems: "center", gap: 10,
          backgroundColor: mapTheme === "day" ? "rgba(248,246,240,0.95)" : "rgba(13,27,46,0.95)",
          border: "1px solid var(--border-2)",
          borderRadius: 12, padding: "10px 14px",
          boxShadow: "0 4px 24px rgba(0,0,0,0.22)",
          backdropFilter: "blur(12px)",
          opacity: selectedFlight ? 1 : 0,
          transition: "opacity 250ms ease-out",
          pointerEvents: selectedFlight ? "auto" : "none",
        }}
      >
        {/* Play / Pause */}
        <button
          onClick={isPlaying ? handlePause : handlePlay}
          style={{
            width: 36, height: 36, borderRadius: "50%",
            backgroundColor: teal, color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            border: "none", cursor: "pointer", flexShrink: 0, fontSize: 13,
            transition: "transform 200ms ease-out, opacity 200ms ease-out",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.08)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
        >
          {isPlaying ? "⏸" : "▶"}
        </button>

        {/* Route label */}
        <div style={{ minWidth: 90 }}>
          <div style={{ fontFamily: "var(--font-bebas)", fontSize: 14, letterSpacing: "0.1em", color: mapTheme === "day" ? "#0f1f2e" : "#e8f0f8", lineHeight: 1.1 }}>
            {selectedFlight?.origin} → {selectedFlight?.destination}
          </div>
          <div style={{ fontSize: 10, color: mapTheme === "day" ? "#78716c" : "#8ba0b8", marginTop: 1 }}>
            {selectedFlight?.destinationCity}
          </div>
        </div>

        {/* Separator */}
        <div style={{ width: 1, height: 28, backgroundColor: mapTheme === "day" ? "rgba(15,31,46,0.15)" : "rgba(255,255,255,0.12)" }} />

        {/* Timer */}
        <div style={{ fontFamily: "var(--font-bebas)", fontSize: 13, letterSpacing: "0.08em", color: mapTheme === "day" ? "#57534e" : "#8ba0b8", minWidth: 90, whiteSpace: "nowrap" }}>
          <span ref={timerElRef}>{`00:00 / ${fmtSimTime(flightDurSec)}`}</span>
        </div>

        {/* Speed buttons — revealed after first play */}
        <div
          style={{
            display: "flex", gap: 4,
            opacity: hasPlayed ? 1 : 0,
            transition: "opacity 200ms ease-out",
            pointerEvents: hasPlayed ? "auto" : "none",
          }}
        >
          {SPEEDS.map((s) => (
            <button
              key={s}
              onClick={() => setSpeed(s)}
              style={{
                fontFamily: "var(--font-bebas)", fontSize: 11, letterSpacing: "0.06em",
                padding: "4px 8px", borderRadius: 5,
                backgroundColor: speed === s ? teal : "transparent",
                color: speed === s ? "#fff" : mapTheme === "day" ? "#78716c" : "#8ba0b8",
                border: `1px solid ${speed === s ? teal : mapTheme === "day" ? "rgba(15,31,46,0.2)" : "rgba(255,255,255,0.14)"}`,
                cursor: "pointer",
                transition: "all 150ms ease",
              }}
            >
              {s}×
            </button>
          ))}
        </div>

        {/* Close / deselect */}
        <button
          onClick={handleDeselect}
          style={{
            width: 22, height: 22, borderRadius: "50%", border: "none",
            backgroundColor: "transparent", cursor: "pointer", flexShrink: 0,
            color: mapTheme === "day" ? "#78716c" : "#8ba0b8", fontSize: 14, lineHeight: 1,
            display: "flex", alignItems: "center", justifyContent: "center",
            opacity: 0.6, transition: "opacity 150ms ease",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = "1"; }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = "0.6"; }}
        >
          ×
        </button>
      </div>

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm"
            style={{ backgroundColor: "rgba(13,27,46,0.95)", color: "#8ba0b8", border: "1px solid rgba(255,255,255,0.14)" }}>
            <Loader2 className="w-4 h-4 animate-spin" style={{ color: teal }} />
            <span style={{ fontFamily: "monospace" }}>Fetching routes...</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── OriginMarker ──────────────────────────────────────────────────────
// Separate component so it uses useMap() cleanly inside MapContainer
function OriginMarker({ coord, teal, origin }: { coord: [number, number]; teal: string; origin: string }) {
  const map = useMap();

  useEffect(() => {
    const ring = L.circleMarker(coord as L.LatLngExpression, {
      radius: 16, color: teal, fillColor: "transparent", fillOpacity: 0, weight: 1, opacity: 0.2, interactive: false,
    }).addTo(map);
    const dot = L.circleMarker(coord as L.LatLngExpression, {
      radius: 7, color: teal, fillColor: teal, fillOpacity: 1, weight: 0,
    }).addTo(map);
    dot.bindPopup(
      `<div style="background:#0d1b2e;color:#e8f0f8;padding:8px 12px;border-radius:8px;font-size:13px;border:1px solid rgba(255,255,255,0.1)"><strong>${origin}</strong> — your origin</div>`,
      { className: "wm-popup" }
    );
    return () => { map.removeLayer(ring); map.removeLayer(dot); };
  }, [coord, teal, origin, map]);

  return null;
}
