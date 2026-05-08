"use client";
import dynamic from "next/dynamic";

const FlightMap = dynamic(() => import("@/components/FlightMap"), { ssr: false });

export default function MapPage() {
  return (
    <div className="max-w-6xl mx-auto px-5 py-10">
      <h1 className="text-2xl font-semibold mb-1" style={{ color: "var(--fg)" }}>Destination map</h1>
      <p className="text-sm mb-6" style={{ color: "var(--fg-3)" }}>
        Pick a departure airport to see every destination you can reach with real-time fares on the map.
      </p>
      <div className="rounded-xl overflow-hidden border" style={{ borderColor: "var(--border)", height: 560 }}>
        <FlightMap />
      </div>
    </div>
  );
}
