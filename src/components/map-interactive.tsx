"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import type { GeoPoint } from "@/components/map-picker";

let iconsConfigured = false;
function setupIcons() {
  if (iconsConfigured) return;
  const defaultIcon = L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });
  L.Marker.prototype.options.icon = defaultIcon;
  iconsConfigured = true;
}

function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function FlyTo({ point }: { point: GeoPoint | null }) {
  const map = useMap();
  useEffect(() => {
    if (point) {
      map.flyTo([point.lat, point.lng], Math.max(map.getZoom(), 11), { duration: 0.8 });
    }
  }, [point, map]);
  return null;
}

export default function MapInteractive({
  center,
  pickup,
  onPick,
  height = "320px",
}: {
  center?: [number, number];
  pickup?: GeoPoint | null;
  onPick?: (lat: number, lng: number) => void;
  height?: string;
}) {
  setupIcons();
  // Default to Lagos at zoom 11 (city-level) so clicks land in Nigeria, not Mali.
  const defaultCenter: [number, number] = center ?? [6.5244, 3.3792];
  return (
    <div style={{ height, width: "100%" }}>
      <MapContainer
        center={pickup ? [pickup.lat, pickup.lng] : defaultCenter}
        zoom={11}
        scrollWheelZoom
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap'
        />
        {onPick && <ClickHandler onPick={onPick} />}
        <FlyTo point={pickup ?? null} />
        {pickup && <Marker position={[pickup.lat, pickup.lng]} />}
      </MapContainer>
    </div>
  );
}
