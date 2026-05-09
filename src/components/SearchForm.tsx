"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, Calendar, Users, ArrowLeftRight } from "lucide-react";

interface Airport { iataCode: string; name: string; city: string; }

export interface SearchParams {
  origin: string;
  originName: string;
  destination: string;
  destinationName: string;
  date: string;
  passengers: number;
}

interface SearchFormProps {
  onSearch?: (params: SearchParams) => void;
  compact?: boolean;
  initialValues?: Partial<SearchParams>;
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

  useEffect(() => { setQuery(displayValue || value); }, [displayValue, value]);

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

  const select = (a: Airport) => {
    setQuery(`${a.city} (${a.iataCode})`);
    onChange(a.iataCode, `${a.city} (${a.iataCode})`);
    setOpen(false);
    setResults([]);
  };

  return (
    <div className="relative flex-1" ref={ref}>
      <label className="block text-xs mb-1.5" style={{ color: "var(--fg-3)" }}>{label}</label>
      <div className="relative flex items-center gap-2 px-3 py-2.5 rounded-lg border"
        style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-2)" }}>
        <span style={{ color: "var(--fg-3)" }}>{icon}</span>
        <input
          className="flex-1 bg-transparent outline-none text-sm placeholder:opacity-50"
          style={{ color: "var(--fg)" }}
          placeholder="City or airport..."
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
        />
      </div>
      {open && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border shadow-lg overflow-hidden"
          style={{ borderColor: "var(--border)", backgroundColor: "var(--bg)" }}>
          {results.map((a) => (
            <button key={a.iataCode} type="button"
              className="w-full text-left px-4 py-3 text-sm flex items-center gap-3 hover:opacity-70 transition-opacity border-b last:border-0"
              style={{ borderColor: "var(--border)", color: "var(--fg)" }}
              onClick={() => select(a)}>
              <span className="font-semibold w-9 shrink-0" style={{ color: "var(--fg)" }}>{a.iataCode}</span>
              <span className="truncate" style={{ color: "var(--fg-2)" }}>{a.city}</span>
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
  const [date, setDate] = useState(initialValues?.date || new Date(Date.now() + 86400000).toISOString().split("T")[0]);
  const [passengers, setPassengers] = useState(initialValues?.passengers || 1);

  const swap = () => {
    setOrigin(destination); setOriginName(destinationName);
    setDestination(origin); setDestinationName(originName);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!origin || !destination || !date) return;
    const params: SearchParams = { origin, originName, destination, destinationName, date, passengers };
    if (onSearch) {
      onSearch(params);
    } else {
      router.push(`/app/results?${new URLSearchParams({
        origin, originName, destination, destinationName, date, passengers: String(passengers),
      })}`);
    }
  };

  const fieldStyle = {
    borderColor: "var(--border)",
    backgroundColor: "var(--bg-2)",
    color: "var(--fg)",
  };

  return (
    <form onSubmit={handleSubmit}
      className={`rounded-2xl border ${compact ? "p-4" : "p-6"}`}
      style={{ borderColor: "var(--border)", backgroundColor: "var(--bg)" }}>
      <div className="flex flex-col md:flex-row gap-3 items-end">
        <AirportInput label="From" value={origin} displayValue={originName}
          onChange={(iata, name) => { setOrigin(iata); setOriginName(name); }}
          icon={<MapPin className="w-4 h-4" />} />

        <button type="button" onClick={swap}
          className="hidden md:flex w-9 h-9 shrink-0 mb-0.5 items-center justify-center rounded-full border hover:opacity-70 transition-opacity"
          style={{ borderColor: "var(--border)", color: "var(--fg-2)", backgroundColor: "var(--bg-3)" }}>
          <ArrowLeftRight className="w-4 h-4" />
        </button>

        <AirportInput label="To" value={destination} displayValue={destinationName}
          onChange={(iata, name) => { setDestination(iata); setDestinationName(name); }}
          icon={<MapPin className="w-4 h-4" />} />

        <div className="flex-1 min-w-[140px]">
          <label className="block text-xs mb-1.5" style={{ color: "var(--fg-3)" }}>Date</label>
          <div className="relative flex items-center gap-2 px-3 py-2.5 rounded-lg border" style={fieldStyle}>
            <Calendar className="w-4 h-4 shrink-0" style={{ color: "var(--fg-3)" }} />
            <input type="date" min={today} value={date} onChange={(e) => setDate(e.target.value)}
              className="flex-1 bg-transparent outline-none text-sm" style={{ color: "var(--fg)" }} />
          </div>
        </div>

        <div className="w-24">
          <label className="block text-xs mb-1.5" style={{ color: "var(--fg-3)" }}>Travelers</label>
          <div className="relative flex items-center gap-2 px-3 py-2.5 rounded-lg border" style={fieldStyle}>
            <Users className="w-4 h-4 shrink-0" style={{ color: "var(--fg-3)" }} />
            <select value={passengers} onChange={(e) => setPassengers(Number(e.target.value))}
              className="flex-1 bg-transparent outline-none text-sm appearance-none" style={{ color: "var(--fg)" }}>
              {[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        </div>

        <button type="submit" disabled={!origin || !destination || !date}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm btn-primary disabled:opacity-40 transition-opacity shrink-0">
          <Search className="w-4 h-4" />
          Search
        </button>
      </div>
    </form>
  );
}
