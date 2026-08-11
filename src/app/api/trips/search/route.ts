import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  scoreTrip,
  type GeoPoint,
  type TripForMatching,
} from "@/lib/matching";

interface TripWithDriver extends TripForMatching {
  driver: { id: string; name: string | null; avatarUrl: string | null; trustScore: number; isVerified: boolean };
  id: string;
  originLabel: string;
  destinationLabel: string;
  pricePerSeat: number;
  seatsTotal: number;
  waypointsJson: string;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const pickupLat = parseFloat(url.searchParams.get("pickupLat") ?? "");
    const pickupLng = parseFloat(url.searchParams.get("pickupLng") ?? "");
    const dropoffLat = parseFloat(url.searchParams.get("dropoffLat") ?? "");
    const dropoffLng = parseFloat(url.searchParams.get("dropoffLng") ?? "");
    const departAfter = url.searchParams.get("departAfter");

    const missing =
      [pickupLat, pickupLng, dropoffLat, dropoffLng].some((n) => Number.isNaN(n));
    if (missing) {
      return NextResponse.json(
        { error: "pickup and dropoff coordinates are required" },
        { status: 400 },
      );
    }

    const pickup: GeoPoint = { lat: pickupLat, lng: pickupLng };
    const dropoff: GeoPoint = { lat: dropoffLat, lng: dropoffLng };

    const trips = (await db.trip.findMany({
      where: {
        status: "OPEN",
        seatsAvailable: { gt: 0 },
        departureAt: {
          gte: departAfter ? new Date(departAfter) : new Date(),
        },
      },
      include: {
        driver: {
          select: { id: true, name: true, avatarUrl: true, trustScore: true, isVerified: true },
        },
      },
      orderBy: { departureAt: "asc" },
    })) as TripWithDriver[];

    const scored = trips
      .map((t) => {
        const match = scoreTrip(t, {
          pickup,
          dropoff,
          departAfter: departAfter ? new Date(departAfter) : undefined,
        });
        return {
          ...t,
          match,
        };
      })
      .filter((t) => t.match.reason === null)
      .sort((a, b) => (b.match.score ?? 0) - (a.match.score ?? 0));

    return NextResponse.json({ trips: scored });
  } catch (err) {
    console.error("[trips/search]", err);
    return NextResponse.json(
      { error: "Failed to search trips" },
      { status: 500 },
    );
  }
}
