import { NextRequest, NextResponse } from "next/server";
import duffel from "@/lib/duffel";

// Preferred IATA code for major metro areas (city name → main airport)
const PREFERRED: Record<string, string> = {
  "new york": "JFK",
  "los angeles": "LAX",
  "chicago": "ORD",
  "dallas": "DFW",
  "houston": "IAH",
  "atlanta": "ATL",
  "miami": "MIA",
  "san francisco": "SFO",
  "seattle": "SEA",
  "boston": "BOS",
  "denver": "DEN",
  "las vegas": "LAS",
  "phoenix": "PHX",
  "orlando": "MCO",
  "washington": "DCA",
  "minneapolis": "MSP",
  "detroit": "DTW",
  "philadelphia": "PHL",
  "charlotte": "CLT",
  "salt lake city": "SLC",
  "portland": "PDX",
  "san diego": "SAN",
  "austin": "AUS",
  "nashville": "BNA",
  "st. louis": "STL",
  "kansas city": "MCI",
  "tampa": "TPA",
  "fort lauderdale": "FLL",
  "raleigh": "RDU",
  "cancun": "CUN",
  "mexico city": "MEX",
};

function pickBestAirport(
  airports: { iata_code: string | null; name: string }[],
  cityName: string
) {
  if (!airports || airports.length === 0) return null;

  // 1. Check preferred map
  const city = cityName.replace(/ city$/i, "").toLowerCase().trim();
  const preferred = PREFERRED[city];
  if (preferred) {
    const match = airports.find((a) => a.iata_code === preferred);
    if (match) return match;
  }

  // 2. Airport whose name contains the full city name (avoids "Executive" airports)
  //    But skip if the name also contains "Executive" or "General"
  const cityMatch = airports.find(
    (a) =>
      a.name.toLowerCase().includes(city) &&
      !a.name.toLowerCase().includes("executive") &&
      !a.name.toLowerCase().includes("general aviation") &&
      !a.name.toLowerCase().includes("heliport")
  );
  if (cityMatch) return cityMatch;

  // 3. Any "International" airport
  const international = airports.find(
    (a) =>
      a.name.toLowerCase().includes("international") &&
      !a.name.toLowerCase().includes("executive")
  );
  return international || airports[0];
}

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q") || "";

  if (query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    const response = await duffel.suggestions.list({ query });
    const places = response.data || [];

    const results = places
      .filter((p) => p.airports && p.airports.length > 0)
      .slice(0, 8)
      .map((p) => {
        const best = pickBestAirport(p.airports || [], p.name);
        return {
          iataCode: best?.iata_code || "",
          name: best?.name || p.name,
          city: p.name.replace(/ city$/i, ""),
          country: "",
          type: p.type,
        };
      })
      .filter((r) => r.iataCode);

    return NextResponse.json({ results });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Airport search failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
