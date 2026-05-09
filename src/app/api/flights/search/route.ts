import { NextRequest, NextResponse } from "next/server";
import { searchFlights } from "@/lib/duffel";
import { rateLimit } from "@/lib/ratelimit";

const IATA_RE = /^[A-Z]{3}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  if (!rateLimit(ip, 20, 60_000)) {
    return NextResponse.json({ error: "Too many requests. Please wait a moment." }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { origin, destination, date, passengers, cabinClass } = body as Record<string, unknown>;

  if (
    typeof origin !== "string" || !IATA_RE.test(origin) ||
    typeof destination !== "string" || !IATA_RE.test(destination) ||
    typeof date !== "string" || !DATE_RE.test(date)
  ) {
    return NextResponse.json({ error: "Invalid origin, destination, or date" }, { status: 400 });
  }

  const pax = typeof passengers === "number" ? Math.min(Math.max(Math.floor(passengers), 1), 9) : 1;

  try {
    const results = await searchFlights({
      origin,
      destination,
      date,
      passengers: pax,
      cabinClass: typeof cabinClass === "string" ? cabinClass as "economy" : "economy",
    });
    return NextResponse.json({ results });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Search failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
