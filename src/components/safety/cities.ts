// Supported Nigerian cities for NaijaRide
// Users can only offer/book trips within these cities for now.
// Long-distance inter-city trips will be enabled in a future update.

export interface SupportedCity {
  name: string;
  state: string;
  lat: number;
  lng: number;
  // Bounding box radius in km - used for checking if a point is "in" this city
  radiusKm: number;
}

export const SUPPORTED_CITIES: SupportedCity[] = [
  { name: "Abuja", state: "FCT", lat: 9.0765, lng: 7.3986, radiusKm: 30 },
  { name: "Ikeja", state: "Lagos", lat: 6.6018, lng: 3.3515, radiusKm: 25 },
  { name: "Lagos Island", state: "Lagos", lat: 6.4541, lng: 3.4749, radiusKm: 25 },
  { name: "Lekki", state: "Lagos", lat: 6.4506, lng: 3.4737, radiusKm: 20 },
  { name: "Ilorin", state: "Kwara", lat: 8.4966, lng: 4.5421, radiusKm: 20 },
  { name: "Kaduna", state: "Kaduna", lat: 10.5222, lng: 7.4586, radiusKm: 25 },
  { name: "Zaria", state: "Kaduna", lat: 11.1113, lng: 7.7222, radiusKm: 20 },
  { name: "Lokoja", state: "Kogi", lat: 7.8000, lng: 6.7333, radiusKm: 20 },
  { name: "Port Harcourt", state: "Rivers", lat: 4.8156, lng: 7.0498, radiusKm: 25 },
  { name: "Ibadan", state: "Oyo", lat: 7.3776, lng: 3.9470, radiusKm: 25 },
  { name: "Benin City", state: "Edo", lat: 6.3350, lng: 5.6037, radiusKm: 20 },
  { name: "Enugu", state: "Enugu", lat: 6.5244, lng: 7.5085, radiusKm: 20 },
];

// Default map center (Nigeria)
export const NIGERIA_CENTER = { lat: 9.0765, lng: 7.3986 };

// Haversine distance in km
function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Check if a point is within any supported city
export function findNearestCity(
  lat: number,
  lng: number,
): { city: SupportedCity; distanceKm: number } | null {
  let nearest: { city: SupportedCity; distanceKm: number } | null = null;
  for (const city of SUPPORTED_CITIES) {
    const dist = haversineKm(lat, lng, city.lat, city.lng);
    if (dist <= city.radiusKm) {
      if (!nearest || dist < nearest.distanceKm) {
        nearest = { city, distanceKm: dist };
      }
    }
  }
  return nearest;
}

// Check if a point is in a supported city
export function isSupportedLocation(lat: number, lng: number): boolean {
  return findNearestCity(lat, lng) !== null;
}

// Get city name for a location, or null if not supported
export function getCityForLocation(
  lat: number,
  lng: number,
): string | null {
  const nearest = findNearestCity(lat, lng);
  return nearest ? nearest.city.name : null;
}

// Format the list of supported cities for display
export function getSupportedCitiesText(): string {
  return SUPPORTED_CITIES.map((c) => c.name).join(", ");
}
