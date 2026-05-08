"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, Calendar, Users, ArrowLeftRight } from "lucide-react";

interface Airport {
  iataCode: string;
  name: string;
  city: string;
  country: string;
}

interface SearchFormProps {
  onSearch?: (params: SearchParams) => void;
  compact?: boolean;
  initialValues?: Partial<SearchParams>;
}

export interface SearchParams {
  origin: string;
  originName: string;
  destination: string;
  destinationName: string;
  date: string;
  passengers: number;
}

function AirportInput({
  label,
  value,
  displayValue,
  onChange,
  icon,
}: {
  label: string;
  value: string;
  displayValue: string;
  onChange: (iata: string, name: string) => void;
  icon: React.ReactNode;
}) {
  const [query, setQuery] = useState(displayValue || value);
  const [results, setResults] = useState<Airport[]>([]);
  const [open, setOpen] = useState(false);
  const timeout = useRef<NodeJS.Timeout | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(displayValue || value);
  }, [displayValue, value]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
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
    }, 300);
  };

  const select = (airport: Airport) => {
    setQuery(`${airport.city} (${airport.iataCode})`);
    onChange(airport.iataCode, `${airport.city} (${airport.iataCode})`);
    setOpen(false);
  };

  return (
    <div className="relative flex-1" ref={ref}>
      <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{icon}</span>
        <input
          className="w-full pl-9 pr-3 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50"
          placeholder={`City or airport...`}
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
        />
      </div>
      {open && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          {results.map((a) => (
            <button
              key={a.iataCode}
              className="w-full text-left px-4 py-3 hover:bg-indigo-50 text-sm transition-colors flex items-center gap-3"
              onClick={() => select(a)}
            >
              <span className="font-bold text-indigo-600 w-10 shrink-0">{a.iataCode}</span>
              <span className="text-gray-700 truncate">{a.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SearchForm({ onSearch, compact, initialValues }: SearchFormProps) {
  const router = useRouter();
  const [origin, setOrigin] = useState(initialValues?.origin || "");
  const [originName, setOriginName] = useState(initialValues?.originName || "");
  const [destination, setDestination] = useState(initialValues?.destination || "");
  const [destinationName, setDestinationName] = useState(initialValues?.destinationName || "");
  const today = new Date().toISOString().split("T")[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];
  const [date, setDate] = useState(initialValues?.date || tomorrow);
  const [passengers, setPassengers] = useState(initialValues?.passengers || 1);

  const swap = () => {
    setOrigin(destination);
    setOriginName(destinationName);
    setDestination(origin);
    setDestinationName(originName);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!origin || !destination || !date) return;
    const params: SearchParams = { origin, originName, destination, destinationName, date, passengers };
    if (onSearch) {
      onSearch(params);
    } else {
      const qs = new URLSearchParams({
        origin, originName, destination, destinationName, date, passengers: String(passengers),
      });
      router.push(`/app/results?${qs}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`bg-white rounded-2xl shadow-lg border border-gray-100 ${compact ? "p-4" : "p-6"}`}>
      <div className="flex flex-col md:flex-row gap-3 items-end">
        <AirportInput
          label="From"
          value={origin}
          displayValue={originName}
          onChange={(iata, name) => { setOrigin(iata); setOriginName(name); }}
          icon={<MapPin className="w-4 h-4" />}
        />

        <button
          type="button"
          onClick={swap}
          className="hidden md:flex w-9 h-9 shrink-0 items-center justify-center bg-gray-100 hover:bg-indigo-100 rounded-full transition-colors mb-0.5"
        >
          <ArrowLeftRight className="w-4 h-4 text-gray-500" />
        </button>

        <AirportInput
          label="To"
          value={destination}
          displayValue={destinationName}
          onChange={(iata, name) => { setDestination(iata); setDestinationName(name); }}
          icon={<MapPin className="w-4 h-4" />}
        />

        <div className="flex-1 min-w-[140px]">
          <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Date</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="date"
              min={today}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full pl-9 pr-3 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50"
            />
          </div>
        </div>

        <div className="w-24">
          <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Travelers</label>
          <div className="relative">
            <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={passengers}
              onChange={(e) => setPassengers(Number(e.target.value))}
              className="w-full pl-9 pr-2 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 appearance-none"
            >
              {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={!origin || !destination || !date}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-semibold text-sm transition-colors shrink-0"
        >
          <Search className="w-4 h-4" />
          Search
        </button>
      </div>
    </form>
  );
}
