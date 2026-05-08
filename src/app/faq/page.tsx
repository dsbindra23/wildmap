"use client";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  { q: "What is WildMap?", a: "WildMap is an independent search tool for Frontier Airlines GoWild pass holders. Enter your departure city and we show you every destination you can reach, with current fares and a direct link to book on Frontier." },
  { q: "Is WildMap affiliated with Frontier Airlines?", a: "No. WildMap is fully independent and is not affiliated with, endorsed by, or sponsored by Frontier Airlines. We use a third-party flight data API to retrieve availability." },
  { q: "Do I book through WildMap?", a: "No. WildMap is a discovery tool. When you find a flight you want, we send you to Frontier's own website to complete the booking, so your GoWild pass benefits apply correctly." },
  { q: "How accurate are the fares shown?", a: "Fares are fetched live from our data provider and reflect current market prices. They may differ slightly from what Frontier charges GoWild pass holders, since GoWild pricing depends on your pass tier and seat availability at the moment of booking." },
  { q: "What is the GoWild pass?", a: "The Frontier Airlines GoWild All-You-Can-Fly pass lets you fly as many Frontier flights as you want for a flat monthly or annual fee. Seats are released close to the departure date and are subject to availability." },
  { q: "What does the fare calendar show?", a: "The calendar shows the cheapest available fare for a route across the next 28 days. Green cells are the cheapest days, red cells are the most expensive. Click any date to start a search from that origin." },
  { q: "Is there a free plan?", a: "Yes, WildMap is free to use. Creating an account lets you save your home airport so you do not have to type it every time." },
];

function Item({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: "1px solid var(--border)" }}>
      <button
        className="w-full flex items-center justify-between py-5 text-left text-sm font-medium transition-opacity hover:opacity-70"
        style={{ color: "var(--fg)" }}
        onClick={() => setOpen(!open)}
      >
        {q}
        <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ml-4 ${open ? "rotate-180" : ""}`} style={{ color: "var(--fg-3)" }} />
      </button>
      {open && <p className="text-sm pb-5 leading-relaxed" style={{ color: "var(--fg-2)" }}>{a}</p>}
    </div>
  );
}

export default function FAQPage() {
  return (
    <div className="max-w-2xl mx-auto px-5 py-16">
      <h1 className="text-3xl font-semibold mb-2" style={{ color: "var(--fg)" }}>FAQ</h1>
      <p className="text-sm mb-10" style={{ color: "var(--fg-3)" }}>
        Common questions about WildMap and the GoWild pass.
      </p>
      <div className="rounded-xl border px-6" style={{ borderColor: "var(--border)", backgroundColor: "var(--bg)" }}>
        {faqs.map((item) => <Item key={item.q} {...item} />)}
      </div>
    </div>
  );
}
