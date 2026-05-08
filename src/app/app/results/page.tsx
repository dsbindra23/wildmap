"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import SearchForm from "@/components/SearchForm";
import FlightCard from "@/components/FlightCard";
import type { SearchResult } from "@/lib/duffel";
import { Loader2, AlertCircle, SlidersHorizontal } from "lucide-react";

function ResultsContent() {
  const params = useSearchParams();
  const origin = params.get("origin") || "";
  const destination = params.get("destination") || "";
  const date = params.get("date") || "";
  const passengers = Number(params.get("passengers") || 1);
  const originName = params.get("originName") || origin;
  const destinationName = params.get("destinationName") || destination;

  const [flights, setFlights] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [maxStops, setMaxStops] = useState<number>(3);
  const [sortBy, setSortBy] = useState<"price" | "duration" | "departure">("price");

  useEffect(() => {
    if (!origin || !destination || !date) return;
    setLoading(true);
    setError("");
    fetch("/api/flights/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ origin, destination, date, passengers }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setFlights(data.results || []);
      })
      .catch(() => setError("Failed to fetch flights. Please try again."))
      .finally(() => setLoading(false));
  }, [origin, destination, date, passengers]);

  const filtered = flights
    .filter((f) => f.stops <= maxStops)
    .sort((a, b) => {
      if (sortBy === "price") return parseFloat(a.price) - parseFloat(b.price);
      if (sortBy === "departure") return a.departureTime.localeCompare(b.departureTime);
      return (a.duration || "").localeCompare(b.duration || "");
    });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <SearchForm
          compact
          initialValues={{ origin, originName, destination, destinationName, date, passengers }}
        />
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-500">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          <span>Searching GoWild! availability...</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-6">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <div>
            <div className="font-semibold">Search error</div>
            <div className="text-sm">{error}</div>
          </div>
        </div>
      )}

      {!loading && !error && flights.length > 0 && (
        <>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div className="text-sm text-gray-600">
              <span className="font-semibold text-gray-900">{filtered.length}</span> flights found ·{" "}
              <span className="text-indigo-600">{originName}</span> → <span className="text-indigo-600">{destinationName}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <SlidersHorizontal className="w-4 h-4 text-gray-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="price">Sort: Price</option>
                <option value="departure">Sort: Departure</option>
                <option value="duration">Sort: Duration</option>
              </select>
              <select
                value={maxStops}
                onChange={(e) => setMaxStops(Number(e.target.value))}
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value={0}>Nonstop only</option>
                <option value={1}>Max 1 stop</option>
                <option value={3}>Any stops</option>
              </select>
            </div>
          </div>
          <div className="space-y-3">
            {filtered.map((flight) => (
              <FlightCard key={flight.id} flight={flight} />
            ))}
          </div>
        </>
      )}

      {!loading && !error && flights.length === 0 && origin && destination && (
        <div className="text-center py-20 text-gray-500">
          <div className="text-4xl mb-4">✈️</div>
          <div className="font-semibold text-gray-900 mb-2">No flights found</div>
          <div className="text-sm">Try a different date or route.</div>
        </div>
      )}
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin" /></div>}>
      <ResultsContent />
    </Suspense>
  );
}
