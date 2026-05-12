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

  return (
    <div ref={containerRef} style={{ width: "100%", maxWidth: 720, margin: "0 auto" }}>
      <style>{`
        .wm-ticket-input {
          font-family: var(--font-serif);
          font-weight: 900;
          font-size: 28px;
          color: var(--fg);
          background: transparent;
          border: none;
          outline: none;
          width: 100%;
          line-height: 1;
          caret-color: var(--fg);
          display: block;
        }
        .wm-ticket-input::placeholder { color: var(--fg-3); font-size: 20px; font-weight: 700; }
        .wm-hover-hint { display: block; }
        @media (max-width: 640px) {
          .wm-ticket-input { font-size: 22px !important; }
          .wm-ticket-input::placeholder { font-size: 15px; }
          .wm-hover-hint { display: none; }
          .wm-ticket-wrapper { height: 360px !important; }
          .wm-ticket-front { height: 300px !important; }
          .wm-ticket-explore { padding: 10px 16px !important; }
        }
      `}</style>

      {/* Hover hint */}
      <div className="wm-hover-hint" style={{
        textAlign: "center", marginBottom: 20,
        fontFamily: "var(--font-bebas)", fontSize: 11, letterSpacing: "0.2em", color: "var(--fg-3)",
      }}>
        ✦ HOVER THE TICKETS TO REVEAL THE STACK ✦
      </div>

      {/* Ticket stack */}
      <div
        className="wm-ticket-wrapper"
        style={{ position: "relative", height: 320 }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Back ticket */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 80,
          zIndex: 1, opacity: 0.5,
          backgroundColor: "var(--bg-4)",
          border: "1.5px solid var(--border-2)",
          borderRadius: 10,
          transform: hovered ? "rotate(-8deg) translate(-40px, -14px)" : "rotate(-3deg)",
          transition: SPRING,
        }} />
        {/* Middle ticket */}
        <div style={{
          position: "absolute", top: 20, left: 0, right: 0, height: 90,
          zIndex: 2, opacity: 0.75,
          backgroundColor: "var(--bg-3)",
          border: "1.5px solid var(--border-2)",
          borderRadius: 10,
          transform: hovered ? "rotate(6deg) translate(28px, -14px)" : "rotate(2deg)",
          transition: SPRING,
        }} />
        {/* Front ticket */}
        <div
          className="wm-ticket-front"
          style={{
            position: "absolute", top: 50, left: 0, right: 0, height: 260,
            zIndex: 3,
            backgroundColor: "var(--bg-2)",
            border: "1.5px solid var(--border-2)",
            borderRadius: 10,
            boxShadow: "0 16px 40px rgba(15,31,46,0.12)",
          }}
        >
          {/* Top strip */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "13px 22px", borderBottom: DASH,
          }}>
            <span style={{ fontFamily: "var(--font-bebas)", fontSize: 10, letterSpacing: "0.2em", color: "var(--fg-3)" }}>
              GO WILD · UNLIMITED PASS
            </span>
            <span style={{ fontFamily: "var(--font-bebas)", fontSize: 10, letterSpacing: "0.2em", color: "var(--fg)" }}>
              TICKET 001 / ∞
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#be123c", display: "inline-block" }} />
              <span style={{ fontFamily: "var(--font-bebas)", fontSize: 10, letterSpacing: "0.2em", color: "var(--fg-3)" }}>VALID</span>
            </span>
          </div>

          {/* Main section */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "22px 26px" }}>
            {/* Search icon circle */}
            <div
              onClick={() => inputRef.current?.focus()}
              style={{
                width: 46, height: 46, borderRadius: "50%",
                backgroundColor: "var(--fg)",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0, cursor: "pointer",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--bg)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
            </div>

            {/* Input */}
            <div style={{ flex: 1, minWidth: 0, position: "relative" }}>
              <div style={{ fontFamily: "var(--font-bebas)", fontSize: 10, letterSpacing: "0.2em", color: "var(--fg-3)", marginBottom: 3 }}>
                DEPARTING FROM
              </div>
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
                  position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0,
                  zIndex: 9999,
                  backgroundColor: "var(--bg-2)",
                  borderRadius: 10, overflow: "hidden",
                  boxShadow: "0 8px 32px rgba(15,31,46,0.15)",
                  border: "1px solid var(--border-2)",
                }}>
                  {results.map((r) => (
                    <button
                      key={r.iataCode} type="button" onClick={() => pick(r)}
                      className="border-b last:border-0"
                      style={{
                        display: "flex", alignItems: "center", gap: 12,
                        padding: "11px 16px", width: "100%",
                        borderColor: "var(--border)", background: "none", cursor: "pointer",
                      }}
                    >
                      <span style={{ fontFamily: "var(--font-bebas)", letterSpacing: "0.1em", fontSize: 15, color: "var(--beach)", width: 38, flexShrink: 0 }}>{r.iataCode}</span>
                      <span style={{ fontSize: 14, color: "var(--fg-2)" }}>{r.city}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Explore button */}
            <button
              className="wm-ticket-explore"
              onClick={handleSubmit}
              style={{
                fontFamily: "var(--font-bebas)", letterSpacing: "0.15em", fontSize: 14,
                padding: "14px 22px", borderRadius: 8,
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

          {/* Bottom stats */}
          <div style={{ borderTop: DASH, padding: "15px 26px 18px", display: "flex", justifyContent: "space-around", alignItems: "center" }}>
            {[
              { value: "95+", label: "Destinations" },
              { value: "$0.01", label: "Per Flight" },
              { value: "∞", label: "Adventures" },
            ].map((stat, i, arr) => (
              <div key={stat.label} style={{ display: "flex", alignItems: "center" }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontFamily: "var(--font-bebas)", fontSize: 24, color: "var(--fg)", lineHeight: 1 }}>{stat.value}</div>
                  <div style={{ fontSize: 9, letterSpacing: "0.15em", color: "var(--fg-3)", textTransform: "uppercase", marginTop: 2 }}>{stat.label}</div>
                </div>
                {i < arr.length - 1 && (
                  <div style={{ width: 1, height: 28, backgroundColor: "var(--border-2)", margin: "0 20px" }} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Below stack */}
      <div style={{ textAlign: "center", marginTop: 28, fontFamily: "var(--font-bebas)", fontSize: 11, letterSpacing: "0.2em", color: "var(--fg-3)" }}>
        UNLIMITED FLIGHTS · ONE TICKET · ALL YEAR
      </div>
    </div>
  );
}
