"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Place { iataCode: string; city: string; name: string; }

function Barcode() {
  const bars: [number, number][] = [
    [0,3],[4,1],[7,2],[10,1],[12,1],[15,2],[18,1],[21,1],[23,3],[27,1],
    [30,2],[33,1],[35,1],[38,2],[41,1],[44,1],[46,3],[50,1],[53,2],[56,1],
    [58,1],[61,1],[63,2],[66,3],[70,1],[73,1],[75,2],[78,1],[81,3],[85,1],
    [87,2],[90,1],[93,1],[95,2],[98,3],[102,1],[105,2],[108,1],[110,3],[114,1],
    [117,2],[120,1],[123,1],[125,2],[128,1],[131,1],[133,2],[136,1],[139,3],[143,2],
  ];
  return (
    <svg viewBox="0 0 146 30" style={{ width: "100%", height: 30, display: "block" }} aria-hidden="true">
      {bars.map(([x, w]) => (
        <rect key={x} x={x} y={0} width={w} height={30} fill="var(--fg)" opacity={0.55} />
      ))}
    </svg>
  );
}

export default function TicketHero() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Place[]>([]);
  const [selected, setSelected] = useState<Place | null>(null);
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const timeout = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
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

  const handleSubmit = () => {
    const iata = selected?.iataCode || (query.length === 3 ? query.toUpperCase() : null);
    if (!iata) { inputRef.current?.focus(); return; }
    router.push(`/app?origin=${iata}&originName=${encodeURIComponent(selected?.city || query)}`);
  };

  const SPRING = "0.5s cubic-bezier(0.34, 1.56, 0.64, 1)";
  const DASH = "1px dashed var(--border-2)";
  const LABEL: React.CSSProperties = { fontSize: 9, letterSpacing: "0.18em", color: "var(--fg-3)", marginBottom: 3, textTransform: "uppercase" };
  const VALUE: React.CSSProperties = { fontSize: 13, fontWeight: 600, color: "var(--fg)", letterSpacing: "0.04em" };

  return (
    <div ref={containerRef} style={{ width: "100%", maxWidth: 720, margin: "0 auto" }}>
      <style>{`
        .wm-ticket-input {
          font-family: var(--font-serif);
          font-weight: 900;
          font-size: 26px;
          color: var(--fg);
          background: transparent;
          border: none;
          outline: none;
          width: 100%;
          line-height: 1;
          caret-color: var(--fg);
          display: block;
        }
        .wm-ticket-input::placeholder { color: var(--fg-3); font-size: 18px; font-weight: 700; }
        @media (max-width: 640px) {
          .wm-ticket-input { font-size: 20px !important; }
          .wm-ticket-input::placeholder { font-size: 14px; }
          .wm-ticket-wrapper { height: 420px !important; }
          .wm-ticket-front { height: 350px !important; }
          .wm-ticket-explore { padding: 10px 14px !important; font-size: 12px !important; }
        }
      `}</style>

      <div
        className="wm-ticket-wrapper"
        style={{ position: "relative", height: 380 }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Back ticket */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 80,
          zIndex: 1, opacity: 0.5,
          backgroundColor: "var(--bg-4)", border: "1.5px solid var(--border-2)", borderRadius: 10,
          transform: hovered ? "rotate(-8deg) translate(-40px, -14px)" : "rotate(-3deg)",
          transition: SPRING,
        }} />
        {/* Middle ticket */}
        <div style={{
          position: "absolute", top: 20, left: 0, right: 0, height: 90,
          zIndex: 2, opacity: 0.75,
          backgroundColor: "var(--bg-3)", border: "1.5px solid var(--border-2)", borderRadius: 10,
          transform: hovered ? "rotate(6deg) translate(28px, -14px)" : "rotate(2deg)",
          transition: SPRING,
        }} />

        {/* Front ticket */}
        <div
          className="wm-ticket-front"
          style={{
            position: "absolute", top: 50, left: 0, right: 0, height: 318,
            zIndex: 3,
            backgroundColor: "var(--bg-2)", border: "1.5px solid var(--border-2)",
            borderRadius: 10, boxShadow: "0 16px 40px rgba(15,31,46,0.12)",
            overflow: "hidden",
          }}
        >
          {/* ── Top strip: boarding-pass header ── */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 22px", borderBottom: DASH }}>
            <div>
              <div style={LABEL}>Passenger</div>
              <div style={VALUE}>Mr. GoWild</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={LABEL}>Flight</div>
              <div style={{ fontFamily: "var(--font-bebas)", fontSize: 18, letterSpacing: "0.12em", color: "var(--fg)" }}>W1 DSB</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={LABEL}>Status</div>
              <div style={{ display: "flex", alignItems: "center", gap: 5, justifyContent: "flex-end" }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: "#22c55e", display: "inline-block", boxShadow: "0 0 6px #22c55e" }} />
                <span style={{ ...VALUE, color: "#22c55e" }}>Boarding</span>
              </div>
            </div>
          </div>

          {/* ── Main section: search + barcode ── */}
          <div style={{ padding: "16px 26px 14px" }}>
            {/* Search row */}
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div
                onClick={() => inputRef.current?.focus()}
                style={{
                  width: 42, height: 42, borderRadius: "50%",
                  backgroundColor: "var(--fg)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0, cursor: "pointer",
                }}
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--bg)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                </svg>
              </div>
              <div style={{ flex: 1, minWidth: 0, position: "relative" }}>
                <div style={{ ...LABEL, marginBottom: 3 }}>Departing from</div>
                <input
                  ref={inputRef}
                  className="wm-ticket-input"
                  value={query}
                  onChange={(e) => handleChange(e.target.value)}
                  onFocus={() => results.length > 0 && setOpen(true)}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  placeholder="City or airport"
                />
                {open && results.length > 0 && (
                  <div style={{
                    position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, zIndex: 9999,
                    backgroundColor: "var(--bg-2)", borderRadius: 10, overflow: "hidden",
                    boxShadow: "0 8px 32px rgba(15,31,46,0.15)", border: "1px solid var(--border-2)",
                  }}>
                    {results.map((r) => (
                      <button
                        key={r.iataCode} type="button" onClick={() => pick(r)}
                        className="border-b last:border-0"
                        style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 16px", width: "100%", borderColor: "var(--border)", background: "none", cursor: "pointer" }}
                      >
                        <span style={{ fontWeight: 700, fontSize: 14, color: "var(--fg)", width: 38, flexShrink: 0, letterSpacing: "0.04em" }}>{r.iataCode}</span>
                        <span style={{ fontSize: 14, color: "var(--fg-2)" }}>{r.city}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                className="wm-ticket-explore"
                onClick={handleSubmit}
                style={{
                  fontFamily: "var(--font-bebas)", letterSpacing: "0.15em", fontSize: 14,
                  padding: "12px 20px", borderRadius: 8,
                  backgroundColor: "var(--fg)", color: "var(--bg)",
                  border: "none", cursor: "pointer", flexShrink: 0, whiteSpace: "nowrap",
                  transition: "opacity 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.82")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              >
                EXPLORE →
              </button>
            </div>

            {/* Barcode — inside the search section */}
            <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--border)" }}>
              <Barcode />
              <div style={{
                textAlign: "center", marginTop: 5,
                fontSize: 10, letterSpacing: "0.22em", color: "var(--fg-3)",
                fontVariantNumeric: "tabular-nums",
              }}>
                1 0613232398
              </div>
            </div>
          </div>

          {/* ── Bottom strip: Seat / Gate ── */}
          <div style={{ borderTop: DASH, padding: "10px 22px", display: "flex", gap: 32, alignItems: "center" }}>
            <div>
              <div style={LABEL}>Seat</div>
              <div style={{ ...VALUE, fontSize: 15 }}>11A</div>
            </div>
            <div style={{ width: 1, height: 28, backgroundColor: "var(--border-2)" }} />
            <div>
              <div style={LABEL}>Gate</div>
              <div style={{ ...VALUE, fontSize: 15 }}>D23</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
