import { Duffel } from "@duffel/api";

const duffel = new Duffel({
  token: process.env.DUFFEL_ACCESS_TOKEN!,
});

export default duffel;

export interface FlightSearchParams {
  origin: string;
  destination: string;
  date: string; // YYYY-MM-DD
  passengers?: number;
  cabinClass?: "economy" | "premium_economy" | "business" | "first";
}

export interface SearchResult {
  id: string;
  origin: string;
  destination: string;
  originCity: string;
  destinationCity: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  stops: number;
  price: string;
  currency: string;
  airline: string;
  airlineCode: string;
  slices: SliceInfo[];
}

export interface SliceInfo {
  origin: string;
  destination: string;
  departureAt: string;
  arrivalAt: string;
  duration: string;
  segments: SegmentInfo[];
}

export interface SegmentInfo {
  origin: string;
  destination: string;
  departureAt: string;
  arrivalAt: string;
  carrier: string;
  flightNumber: string;
}

export interface AirportResult {
  iataCode: string;
  name: string;
  city: string;
  country: string;
}

function cleanCityName(raw: string): string {
  return raw
    .replace(/\s+(international|regional|municipal|executive|general)\s+airport\s*$/i, "")
    .replace(/\s+airport\s*$/i, "")
    .replace(/\s+intl\.?\s*$/i, "")
    .trim();
}

export async function searchFlights(params: FlightSearchParams): Promise<SearchResult[]> {
  const response = await duffel.offerRequests.create({
    slices: [
      {
        origin: params.origin,
        destination: params.destination,
        departure_date: params.date,
        departure_time: null,
        arrival_time: null,
      },
    ],
    passengers: Array.from({ length: params.passengers || 1 }, () => ({
      type: "adult" as const,
    })),
    cabin_class: params.cabinClass || "economy",
    return_offers: true,
  });

  const offers = response.data.offers || [];

  return offers.slice(0, 20).map((offer) => {
    const slice = offer.slices[0];
    const firstSeg = slice.segments[0];
    const lastSeg = slice.segments[slice.segments.length - 1];

    return {
      id: offer.id,
      origin: slice.origin.iata_code || "",
      destination: slice.destination.iata_code || "",
      originCity: cleanCityName((slice.origin as { city?: { name?: string }; name: string }).city?.name || slice.origin.name),
      destinationCity: cleanCityName((slice.destination as { city?: { name?: string }; name: string }).city?.name || slice.destination.name),
      departureTime: firstSeg.departing_at,
      arrivalTime: lastSeg.arriving_at,
      duration: slice.duration || "",
      stops: slice.segments.length - 1,
      price: offer.total_amount,
      currency: offer.total_currency,
      airline: firstSeg.marketing_carrier.name,
      airlineCode: firstSeg.marketing_carrier.iata_code || "",
      slices: offer.slices.map((s) => ({
        origin: s.origin.iata_code || "",
        destination: s.destination.iata_code || "",
        departureAt: s.segments[0].departing_at,
        arrivalAt: s.segments[s.segments.length - 1].arriving_at,
        duration: s.duration || "",
        segments: s.segments.map((seg) => ({
          origin: seg.origin.iata_code || "",
          destination: seg.destination.iata_code || "",
          departureAt: seg.departing_at,
          arrivalAt: seg.arriving_at,
          carrier: seg.marketing_carrier.name,
          flightNumber: `${seg.marketing_carrier.iata_code}${seg.marketing_carrier_flight_number}`,
        })),
      })),
    };
  });
}

export async function searchAirports(query: string): Promise<AirportResult[]> {
  const response = await duffel.airports.list({});
  const airports = (response.data || []).filter(
    (a) => a.iata_code?.toLowerCase().includes(query.toLowerCase()) || a.name?.toLowerCase().includes(query.toLowerCase())
  );
  return airports.slice(0, 10).map((a) => ({
    iataCode: a.iata_code || "",
    name: a.name,
    city: (a as { city?: { name?: string } }).city?.name || "",
    country: (a as { city?: { country_name?: string } }).city?.country_name || "",
  }));
}

export async function searchPlaces(query: string): Promise<AirportResult[]> {
  const response = await duffel.suggestions.list({ query });
  const places = response.data || [];
  return places
    .filter((p) => p.airports && p.airports.length > 0)
    .slice(0, 8)
    .map((p) => ({
      iataCode: p.airports?.[0]?.iata_code || "",
      name: p.name,
      city: p.name,
      country: p.type === "city" ? "" : "",
    }));
}
