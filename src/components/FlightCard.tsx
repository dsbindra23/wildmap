"use client";

import { formatTime, formatDuration } from "@/lib/utils";
import type { SearchResult } from "@/lib/duffel";

interface FlightCardProps {
  flight: SearchResult;
}

export default function FlightCard({ flight }: FlightCardProps) {
  const stops = flight.stops === 0 ? "Nonstop" : `${flight.stops} stop${flight.stops > 1 ? "s" : ""}`;
  const frontierUrl = `https://www.flyfrontier.com/flights/search?origin=${flight.origin}&destination=${flight.destination}&departDate=${flight.departureTime.split("T")[0]}&adults=1`;

  return (
    <div
      className="flex items-center gap-4 px-5 py-4 rounded-xl border transition-all hover:opacity-90"
      style={{
        borderColor: "var(--border)",
        borderLeftColor: "var(--beach)",
        borderLeftWidth: 4,
        backgroundColor: "var(--bg-2)",
      }}
    >
      {/* Airline code */}
      <div className="hidden sm:block shrink-0" style={{ minWidth: 52 }}>
        <div style={{ fontFamily: "var(--font-bebas)", letterSpacing: "0.12em", fontSize: 18, color: "var(--fg)" }}>{flight.airlineCode}</div>
        <div className="text-xs truncate" style={{ color: "var(--fg-3)", maxWidth: 56 }}>{flight.airline}</div>
      </div>

      {/* Route */}
      <div className="flex-1 flex items-center gap-4 min-w-0">
        <div className="text-center shrink-0">
          <div className="tabular-nums" style={{ fontFamily: "var(--font-bebas)", fontSize: 26, letterSpacing: "0.05em", color: "var(--fg)", lineHeight: 1 }}>{flight.origin}</div>
          <div className="text-xs mt-0.5" style={{ color: "var(--fg-3)" }}>{formatTime(flight.departureTime)}</div>
        </div>

        <div className="flex-1 flex flex-col items-center gap-1 min-w-0">
          <div className="text-xs" style={{ color: "var(--fg-2)" }}>{formatDuration(flight.duration)}</div>
          <div className="w-full flex items-center gap-1">
            <div className="flex-1 h-px" style={{ backgroundColor: "var(--border-2)" }} />
            <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: "var(--beach)" }} />
          </div>
          <div className="text-xs" style={{ color: "var(--fg-3)", fontFamily: "var(--font-bebas)", letterSpacing: "0.08em" }}>{stops}</div>
        </div>

        <div className="text-center shrink-0">
          <div className="tabular-nums" style={{ fontFamily: "var(--font-bebas)", fontSize: 26, letterSpacing: "0.05em", color: "var(--fg)", lineHeight: 1 }}>{flight.destination}</div>
          <div className="text-xs mt-0.5" style={{ color: "var(--fg-3)" }}>{formatTime(flight.arrivalTime)}</div>
        </div>
      </div>

      {/* Price + book */}
      <div className="shrink-0 flex items-center gap-4">
        <div className="text-right">
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 22, fontWeight: 500, color: "var(--orange)", lineHeight: 1 }}>
            $0.01
          </div>
          <div className="text-xs mt-0.5" style={{ color: "var(--fg-3)" }}>+ ~$30 taxes</div>
        </div>
        <a
          href={frontierUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary transition-opacity hover:opacity-80 whitespace-nowrap"
          style={{ padding: "9px 15px", borderRadius: 7, fontSize: 13 }}
        >
          Book →
        </a>
      </div>
    </div>
  );
}
