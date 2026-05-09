"use client";

import { formatTime, formatDuration, formatPrice } from "@/lib/utils";
import type { SearchResult } from "@/lib/duffel";

interface FlightCardProps {
  flight: SearchResult;
}

export default function FlightCard({ flight }: FlightCardProps) {
  const stops = flight.stops === 0 ? "Nonstop" : `${flight.stops} stop${flight.stops > 1 ? "s" : ""}`;
  const frontierUrl = `https://www.flyfrontier.com/flights/search?origin=${flight.origin}&destination=${flight.destination}&departDate=${flight.departureTime.split("T")[0]}&adults=1`;

  return (
    <div
      className="flex items-center gap-5 px-5 py-4 rounded-xl border transition-all hover:opacity-90"
      style={{
        borderColor: "var(--border)",
        borderLeftColor: "var(--beach)",
        borderLeftWidth: 4,
        backgroundColor: "var(--bg-2)",
      }}
    >
      {/* Destination — most prominent */}
      <div style={{ minWidth: 130 }}>
        <div style={{ fontFamily: "var(--font-bebas)", fontSize: 30, letterSpacing: "0.04em", color: "var(--fg)", lineHeight: 1 }}>
          {flight.destination}
        </div>
        <div className="text-sm mt-0.5 truncate" style={{ color: "var(--fg-2)", maxWidth: 130 }}>{flight.destinationCity}</div>
      </div>

      {/* Route line */}
      <div className="flex-1 flex items-center gap-3 min-w-0">
        <div className="text-center shrink-0">
          <div style={{ fontFamily: "var(--font-bebas)", fontSize: 18, letterSpacing: "0.05em", color: "var(--fg-2)" }}>{flight.origin}</div>
          <div className="text-xs" style={{ color: "var(--fg-3)" }}>{formatTime(flight.departureTime)}</div>
        </div>
        <div className="flex-1 flex flex-col items-center gap-1">
          <div className="text-xs" style={{ color: "var(--fg-3)" }}>{formatDuration(flight.duration)}</div>
          <div className="w-full flex items-center gap-1">
            <div className="flex-1 h-px" style={{ backgroundColor: "var(--border-2)" }} />
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "var(--beach)" }} />
          </div>
          <div style={{ fontFamily: "var(--font-bebas)", fontSize: 10, letterSpacing: "0.1em", color: "var(--fg-3)" }}>{stops}</div>
        </div>
        <div className="text-center shrink-0">
          <div style={{ fontFamily: "var(--font-bebas)", fontSize: 18, letterSpacing: "0.05em", color: "var(--fg-2)" }}>{flight.destination}</div>
          <div className="text-xs" style={{ color: "var(--fg-3)" }}>{formatTime(flight.arrivalTime)}</div>
        </div>
      </div>

      {/* Airline */}
      <div className="hidden sm:block shrink-0 text-right" style={{ minWidth: 48 }}>
        <div style={{ fontFamily: "var(--font-bebas)", fontSize: 16, letterSpacing: "0.1em", color: "var(--fg-3)" }}>{flight.airlineCode}</div>
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
          href={frontierUrl}
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
