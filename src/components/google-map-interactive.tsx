"use client";

import { useEffect, useRef } from "react";
import {
  APIProvider,
  Map,
  Marker,
  useMap,
  useMapsLibrary,
} from "@vis.gl/react-google-maps";
import type { GeoPoint } from "@/components/map-picker";

const GOOGLE_MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!;

// Inner component that handles map clicks and marker
function MapContent({
  center,
  pickup,
  onPick,
}: {
  center?: { lat: number; lng: number };
  pickup: GeoPoint | null;
  onPick: (lat: number, lng: number) => void;
}) {
  const map = useMap();
  const geocoder = useMapsLibrary("geocoding");

  // Fly to picked location
  useEffect(() => {
    if (map && pickup) {
      map.panTo({ lat: pickup.lat, lng: pickup.lng });
    }
  }, [map, pickup]);

  // Handle map clicks
  useEffect(() => {
    if (!map) return;
    const listener = map.addListener("click", (e: google.maps.MapMouseEvent) => {
      if (e.latLng) {
        onPick(e.latLng.lat(), e.latLng.lng());
      }
    });
    return () => listener.remove();
  }, [map, onPick]);

  return (
    <>
      {pickup && (
        <Marker
          position={{ lat: pickup.lat, lng: pickup.lng }}
          title={pickup.label}
        />
      )}
    </>
  );
}

export default function GoogleMapInteractive({
  center,
  pickup,
  onPick,
  height = "320px",
}: {
  center?: { lat: number; lng: number };
  pickup?: GeoPoint | null;
  onPick?: (lat: number, lng: number) => void;
  height?: string;
}) {
  const defaultCenter = center ?? { lat: 9.0765, lng: 7.3986 };

  return (
    <APIProvider apiKey={GOOGLE_MAPS_KEY}>
      <div style={{ height, width: "100%" }}>
        <Map
          defaultCenter={defaultCenter}
          defaultZoom={12}
          gestureHandling="greedy"
          disableDefaultUI={false}
          mapTypeControl={false}
          streetViewControl={false}
          fullscreenControl={false}
          style={{ width: "100%", height: "100%" }}
          clickableIcons={false}
        >
          {onPick && (
            <MapContent
              center={center}
              pickup={pickup ?? null}
              onPick={onPick}
            />
          )}
          {pickup && !onPick && (
            <Marker
              position={{ lat: pickup.lat, lng: pickup.lng }}
              title={pickup.label}
            />
          )}
        </Map>
      </div>
    </APIProvider>
  );
}
