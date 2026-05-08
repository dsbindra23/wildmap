"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

const AIRPORTS = ["JFK","LAX","ORD","DEN","MIA","ATL","DFW","SFO","LAS","SEA","BOS","PHX","MCO","CLT","DCA"];

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [homeAirport, setHomeAirport] = useState("");
  const [maxStops, setMaxStops] = useState(2);
  const [saved, setSaved] = useState(false);

  useEffect(() => { if (status === "unauthenticated") router.push("/auth/login"); }, [status, router]);

  if (status === "loading") {
    return <div className="flex justify-center py-24"><Loader2 className="w-5 h-5 animate-spin" style={{ color: "var(--fg-3)" }} /></div>;
  }

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const inputStyle = {
    width: "100%", padding: "10px 12px", borderRadius: "0.5rem",
    border: "1px solid var(--border)", backgroundColor: "var(--bg-2)",
    color: "var(--fg)", fontSize: 14, outline: "none",
  };

  return (
    <div className="max-w-xl mx-auto px-5 py-14">
      <h1 className="text-2xl font-semibold mb-1" style={{ color: "var(--fg)" }}>Settings</h1>
      <p className="text-sm mb-8" style={{ color: "var(--fg-3)" }}>Manage your account and search preferences.</p>

      <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--border)", backgroundColor: "var(--bg)" }}>
        <div className="px-6 py-5" style={{ borderBottom: "1px solid var(--border)" }}>
          <div className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--fg-3)" }}>Account</div>
          <div className="text-sm font-medium" style={{ color: "var(--fg)" }}>{session?.user?.email}</div>
          {session?.user?.name && <div className="text-sm mt-0.5" style={{ color: "var(--fg-3)" }}>{session.user.name}</div>}
        </div>

        <form onSubmit={save} className="px-6 py-5 space-y-5">
          <div className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--fg-3)" }}>Preferences</div>
          <div>
            <label className="block text-sm mb-1.5" style={{ color: "var(--fg-2)" }}>Home airport</label>
            <select value={homeAirport} onChange={(e) => setHomeAirport(e.target.value)} style={inputStyle}>
              <option value="">Select your home airport</option>
              {AIRPORTS.map((a) => <option key={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1.5" style={{ color: "var(--fg-2)" }}>Max stops</label>
            <select value={maxStops} onChange={(e) => setMaxStops(Number(e.target.value))} style={inputStyle}>
              <option value={0}>Nonstop only</option>
              <option value={1}>1 stop max</option>
              <option value={2}>2 stops max</option>
              <option value={3}>Any</option>
            </select>
          </div>
          <button type="submit" className="px-4 py-2 rounded-lg text-sm font-medium btn-primary transition-opacity hover:opacity-80">
            {saved ? "Saved" : "Save preferences"}
          </button>
        </form>
      </div>
    </div>
  );
}
