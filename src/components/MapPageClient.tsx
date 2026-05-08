"use client";

import dynamic from "next/dynamic";

const FlightMap = dynamic(() => import("@/components/FlightMap"), { ssr: false });

export default function MapPageClient() {
  return <FlightMap />;
}
