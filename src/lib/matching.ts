/**
 * Matching algorithm for NaijaRide carpooling.
 * Uses Haversine distance for both pickup and drop-off matching.
 * Score formula: Score = (1 / (1 + pickupDistKm + dropoffDistKm)) * 100
 * Weighted by time proximity.
 * Returns null when seatsAvailable < seats or trip status !== OPEN.
 */

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface TripForMatching {
  id: string;
  originLat: number;
  originLng: number;
  destinationLat: number;
  destinationLng: number;
  departureAt: string | Date;
  seatsAvailable: number;
  status: "OPEN" | "FULL" | "COMPLETED" | "CANCELLED";
}

const EARTH_RADIUS_KM = 6371;
const toRad = (deg: number) => (deg * Math.PI) / 180;

/**
 * Haversine great-circle distance in kilometers between two coordinates.
 */
export function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

const MAX_PICKUP_KM = 5;
const MAX_DROPOFF_KM = 5;
const TIME_WINDOW_HOURS = 24;

/**
 * Score a trip against a passenger query.
 * Returns null when the trip is not bookable or out of bounds.
 */
export function scoreTrip(
  trip: TripForMatching,
  query: {
    pickup: GeoPoint;
    dropoff: GeoPoint;
    departAfter?: Date;
  },
): { score: number; pickupDistKm: number; dropoffDistKm: number; reason: string | null } {
  if (trip.status !== "OPEN") {
    return { score: 0, pickupDistKm: 0, dropoffDistKm: 0, reason: "Trip is not open" };
  }
  if (trip.seatsAvailable < 1) {
    return { score: 0, pickupDistKm: 0, dropoffDistKm: 0, reason: "No seats available" };
  }

  const pickupDistKm = haversineKm(query.pickup, {
    lat: trip.originLat,
    lng: trip.originLng,
  });
  const dropoffDistKm = haversineKm(query.dropoff, {
    lat: trip.destinationLat,
    lng: trip.destinationLng,
  });

  if (pickupDistKm > MAX_PICKUP_KM || dropoffDistKm > MAX_DROPOFF_KM) {
    return {
      score: 0,
      pickupDistKm,
      dropoffDistKm,
      reason: "Outside pickup/drop-off radius",
    };
  }

  // Time proximity weighting — closer in time = higher weight (1 .. 0.5 over 24h window)
  const departure = new Date(trip.departureAt);
  const ref = query.departAfter ?? new Date();
  const hoursAway = Math.max(
    0,
    (departure.getTime() - ref.getTime()) / (1000 * 60 * 60),
  );
  if (hoursAway > TIME_WINDOW_HOURS) {
    return {
      score: 0,
      pickupDistKm,
      dropoffDistKm,
      reason: "Departs too far in the future",
    };
  }
  const timeWeight = 1 - (hoursAway / TIME_WINDOW_HOURS) * 0.5;

  const distanceScore = 1 / (1 + pickupDistKm + dropoffDistKm);
  const score = distanceScore * 100 * timeWeight;

  return {
    score: Math.round(score * 100) / 100,
    pickupDistKm: Math.round(pickupDistKm * 100) / 100,
    dropoffDistKm: Math.round(dropoffDistKm * 100) / 100,
    reason: null,
  };
}

export function sortTripsByScore<
  T extends TripForMatching & { match?: ReturnType<typeof scoreTrip> },
>(trips: T[]): T[] {
  return [...trips]
    .filter((t) => t.match && t.match.reason === null)
    .sort((a, b) => (b.match?.score ?? 0) - (a.match?.score ?? 0));
}
