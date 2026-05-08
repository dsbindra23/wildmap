"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

interface Place {
  iataCode: string;
  city: string;
  name: string;
}

export default function OriginSearch({ initialValue = "" }: { initialValue?: string }) {
  const router = useRouter();
  const [query, setQuery] = useState(initialValue);
  const [results, setResults] = useState<Place[]>([]);
  const [selected, setSelected] = useState<Place | null>(null);
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
    setSelected(null);
    if (timeout.current) clearTimeout(timeout.current);
    if (q.length < 2) { setResults([]); setOpen(false); return; }
    timeout.current = setTimeout(async () => {
      const res = await fetch(`/api/airports/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data.results || []);
      setOpen(true);
    }, 280);
  };

  const pick = (place: Place) => {
    setSelected(place);
    setQuery(`${place.city} (${place.iataCode})`);
    setOpen(false);
    setResults([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const iata = selected?.iataCode || (query.length === 3 ? query.toUpperCase() : null);
    if (!iata) return;
    router.push(`/app?origin=${iata}&originName=${encodeURIComponent(query)}`);
  };

  return (
    <div className="relative" ref={ref}>
    <form onSubmit={handleSubmit}>
      <div
        className="flex items-center gap-3 rounded-xl border px-4 py-3.5"
        style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-2)" }}
      >
        <Search className="w-4 h-4 shrink-0" style={{ color: "var(--fg-3)" }} />
        <input
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--fg-3)]"
          style={{ color: "var(--fg)" }}
          placeholder="Departure city or airport code"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
        />
        <button
          type="submit"
          disabled={!selected && query.length !== 3}
          className="shrink-0 px-4 py-2 rounded-lg text-sm font-medium btn-primary disabled:opacity-40 transition-opacity"
        >
          Explore
        </button>
      </div>

      {open && results.length > 0 && (
        <div
          className="absolute z-50 mt-1.5 w-full rounded-xl border overflow-hidden shadow-sm"
          style={{ borderColor: "var(--border)", backgroundColor: "var(--bg)" }}
        >
          {results.map((r) => (
            <button
              key={r.iataCode}
              type="button"
              onClick={() => pick(r)}
              className="w-full text-left px-4 py-3 text-sm flex items-center gap-3 hover:opacity-70 transition-opacity border-b last:border-0"
              style={{ borderColor: "var(--border)" }}
            >
              <span className="font-semibold w-9 shrink-0" style={{ color: "var(--fg)" }}>{r.iataCode}</span>
              <span style={{ color: "var(--fg-2)" }}>{r.city}</span>
            </button>
          ))}
        </div>
      )}
    </form>
    </div>
  );
}
