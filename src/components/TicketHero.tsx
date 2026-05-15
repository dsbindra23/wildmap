"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Place { iataCode: string; city: string; name: string; }

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
  // Consistent horizontal padding across all strips for symmetry
  const PX = "22px";
  const LABEL: React.CSSProperties = {
    fontSize: 9, letterSpacing: "0.18em", color: "var(--fg-3)",
    marginBottom: 4, textTransform: "uppercase",
  };
  const VALUE: React.CSSProperties = {
    fontSize: 13, fontWeight: 400, color: "var(--fg-2)", letterSpacing: "0.03em",
  };

  const BARS: [number, number][] = [
    [0,3],[4,1],[7,2],[10,1],[12,1],[15,2],[18,1],[21,1],[23,3],[27,1],
    [30,2],[33,1],[35,1],[38,2],[41,1],[44,1],[46,3],[50,1],[53,2],[56,1],
    [58,1],[61,1],[63,2],[66,3],[70,1],[73,1],[75,2],[78,1],[81,3],[85,1],
    [87,2],[90,1],[93,1],[95,2],[98,3],[102,1],[105,2],[108,1],[110,3],[114,1],
    [117,2],[120,1],[123,1],[125,2],[128,1],[131,1],[133,2],[136,1],[139,3],[143,2],
  ];

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
        .wm-ticket-input::placeholder { color: var(--fg-3); font-size: 19px; font-weight: 700; }
        @keyframes wm-boarding-blink {
          0%, 100% { opacity: 1; box-shadow: 0 0 6px #22c55e; }
          50% { opacity: 0.2; box-shadow: 0 0 2px #22c55e44; }
        }
        .wm-boarding-dot { animation: wm-boarding-blink 2.4s ease-in-out infinite; }
        @media (max-width: 640px) {
          .wm-ticket-input { font-size: 20px !important; }
          .wm-ticket-input::placeholder { font-size: 14px; }
          .wm-ticket-explore { padding: 10px 14px !important; font-size: 12px !important; }
        }
      `}</style>

      {/*
        Wrapper uses paddingTop instead of fixed height so the front ticket
        auto-sizes to its content — no "chin" gap.
        Back/middle tickets are absolutely placed and peek above via paddingTop.
      */}
      <div
        className="wm-ticket-wrapper"
        style={{ position: "relative", paddingTop: 52 }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Back ticket — peeks above the front */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 72,
          zIndex: 1, opacity: 0.45,
          backgroundColor: "var(--bg-4)", border: "1.5px solid var(--border-2)", borderRadius: 10,
          transform: hovered ? "rotate(-7deg) translate(-38px, -12px)" : "rotate(-3deg)",
          transition: SPRING,
        }} />
        {/* Middle ticket — peeks slightly above the front */}
        <div style={{
          position: "absolute", top: 18, left: 0, right: 0, height: 80,
          zIndex: 2, opacity: 0.7,
          backgroundColor: "var(--bg-3)", border: "1.5px solid var(--border-2)", borderRadius: 10,
          transform: hovered ? "rotate(5deg) translate(26px, -12px)" : "rotate(2deg)",
          transition: SPRING,
        }} />

        {/* Front ticket — in normal flow, height = content */}
        <div
          className="wm-ticket-front"
          style={{
            position: "relative",
            zIndex: 3,
            backgroundColor: "var(--bg-2)",
            border: "1.5px solid var(--border-2)",
            borderRadius: 10,
            boxShadow: "0 16px 40px rgba(15,31,46,0.11)",
          }}
        >
          {/* ── STRIP 1: Passenger · Flight · Status ── */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: `14px ${PX}`, borderBottom: DASH,
          }}>
            <div>
              <div style={LABEL}>Passenger</div>
              <div style={VALUE}>Mr. GoWild</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={LABEL}>Flight</div>
              <div style={{ fontFamily: "var(--font-bebas)", fontSize: 18, letterSpacing: "0.12em", color: "var(--fg-2)" }}>
                F9 1507
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={LABEL}>Status</div>
              <div style={{ display: "flex", alignItems: "center", gap: 5, justifyContent: "flex-end" }}>
                <span className="wm-boarding-dot" style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: "#22c55e", display: "inline-block", boxShadow: "0 0 6px #22c55e" }} />
                <span style={{ ...VALUE, color: "#22c55e" }}>Boarding</span>
              </div>
            </div>
          </div>

          {/* ── STRIP 2: Departing-from search ── */}
          <div style={{ padding: `18px ${PX}`, borderBottom: DASH }}>
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
                  padding: "13px 22px", borderRadius: 8,
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
          </div>

          {/* ── STRIP 3: Seat · Barcode · Gate ── */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: `12px ${PX}`, gap: 16,
          }}>
            {/* Seat — left */}
            <div style={{ flexShrink: 0, minWidth: 48 }}>
              <div style={LABEL}>Seat</div>
              <div style={{ fontFamily: "var(--font-bebas)", fontSize: 22, letterSpacing: "0.06em", color: "var(--fg-2)", lineHeight: 1 }}>
                11A
              </div>
            </div>

            {/* Barcode — center, fills available space */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <svg viewBox="0 0 146 24" style={{ width: "100%", height: 24, display: "block" }} aria-hidden="true">
                {BARS.map(([x, w]) => (
                  <rect key={x} x={x} y={0} width={w} height={24} fill="var(--fg)" opacity={0.5} />
                ))}
              </svg>
              <div style={{
                textAlign: "center", marginTop: 3,
                fontSize: 8, letterSpacing: "0.2em", color: "var(--fg-3)",
                fontVariantNumeric: "tabular-nums",
              }}>
                1 0613232398
              </div>
            </div>

            {/* Gate — right */}
            <div style={{ flexShrink: 0, minWidth: 48, textAlign: "right" }}>
              <div style={LABEL}>Gate</div>
              <div style={{ fontFamily: "var(--font-bebas)", fontSize: 22, letterSpacing: "0.06em", color: "var(--fg-2)", lineHeight: 1 }}>
                D23
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
