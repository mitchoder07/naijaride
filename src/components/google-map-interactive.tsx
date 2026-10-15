"use client";

import { useEffect, useRef, useState } from "react";
import {
  APIProvider,
  Map,
  Marker,
  useMap,
} from "@vis.gl/react-google-maps";
import type { GeoPoint } from "@/components/map-picker";

const GOOGLE_MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!;

function MapContent({
  pickup,
  onPick,
}: {
  pickup: GeoPoint | null;
  onPick: (lat: number, lng: number) => void;
}) {
  const map = useMap();

  useEffect(() => {
    if (map && pickup) {
      map.panTo({ lat: pickup.lat, lng: pickup.lng });
      map.setZoom(14);
    }
  }, [map, pickup]);

  useEffect(() => {
    if (!map) return;
    const clickListener = map.addListener("click", (e: google.maps.MapMouseEvent) => {
      if (e.latLng) {
        onPick(e.latLng.lat(), e.latLng.lng());
      }
    });
    return () => clickListener.remove();
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
    <APIProvider
      apiKey={GOOGLE_MAPS_KEY}
      libraries={["places", "geocoding", "marker"]}
    >
      <div style={{ height, width: "100%", position: "relative" }}>
        <Map
          defaultCenter={defaultCenter}
          defaultZoom={12}
          gestureHandling="greedy"
          clickableIcons={false}
          disableDefaultUI={false}
          mapTypeControl={false}
          streetViewControl={false}
          fullscreenControl={false}
          zoomControl={true}
          style={{ width: "100%", height: "100%" }}
        >
          {onPick && (
            <MapContent
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
