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
      className="flex items-center justify-between gap-4 px-5 py-4 rounded-xl border transition-opacity hover:opacity-80"
      style={{ borderColor: "var(--border)", backgroundColor: "var(--bg)" }}
    >
      {/* Airline */}
      <div className="hidden sm:block w-16 shrink-0">
        <div className="text-xs font-semibold" style={{ color: "var(--fg)" }}>{flight.airlineCode}</div>
        <div className="text-xs truncate" style={{ color: "var(--fg-3)" }}>{flight.airline}</div>
      </div>

      {/* Route */}
      <div className="flex-1 flex items-center gap-4 min-w-0">
        <div className="text-center shrink-0">
          <div className="text-base font-semibold tabular-nums" style={{ color: "var(--fg)" }}>{formatTime(flight.departureTime)}</div>
          <div className="text-xs font-medium" style={{ color: "var(--fg-3)" }}>{flight.origin}</div>
        </div>

        <div className="flex-1 flex flex-col items-center gap-0.5 min-w-0">
          <div className="text-xs" style={{ color: "var(--fg-3)" }}>{formatDuration(flight.duration)}</div>
          <div className="w-full flex items-center gap-1">
            <div className="flex-1 h-px" style={{ backgroundColor: "var(--border)" }} />
            <div className="w-1 h-1 rounded-full shrink-0" style={{ backgroundColor: "var(--fg-3)" }} />
          </div>
          <div className="text-xs" style={{ color: "var(--fg-3)" }}>{stops}</div>
        </div>

        <div className="text-center shrink-0">
          <div className="text-base font-semibold tabular-nums" style={{ color: "var(--fg)" }}>{formatTime(flight.arrivalTime)}</div>
          <div className="text-xs font-medium" style={{ color: "var(--fg-3)" }}>{flight.destination}</div>
        </div>
      </div>

      {/* Price + book */}
      <div className="shrink-0 flex items-center gap-4">
        <div className="text-right">
          <div className="text-lg font-bold tabular-nums" style={{ color: "var(--fg)" }}>
            {formatPrice(flight.price, flight.currency)}
          </div>
          <div className="text-xs" style={{ color: "var(--fg-3)" }}>per person</div>
        </div>
        <a
          href={frontierUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-medium px-3 py-2 rounded-lg btn-primary transition-opacity hover:opacity-80 whitespace-nowrap"
        >
          Book →
        </a>
      </div>
    </div>
  );
}
