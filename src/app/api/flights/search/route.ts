import { NextRequest, NextResponse } from "next/server";
import { searchFlights } from "@/lib/duffel";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { origin, destination, date, passengers, cabinClass } = body;

    if (!origin || !destination || !date) {
      return NextResponse.json(
        { error: "origin, destination, and date are required" },
        { status: 400 }
      );
    }

    const results = await searchFlights({ origin, destination, date, passengers, cabinClass });
    return NextResponse.json({ results });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Search failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
