"use client";

import { MapContainer, TileLayer, Marker, Polyline } from "react-leaflet";
import L from "leaflet";

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

export default function MapStatic({
  bounds,
  polylinePositions,
  markers,
}: {
  bounds: [[number, number], [number, number]];
  polylinePositions: [number, number][];
  markers: [number, number][];
}) {
  setupIcons();
  return (
    <MapContainer
      bounds={bounds}
      scrollWheelZoom={false}
      doubleClickZoom={false}
      dragging={false}
      touchZoom={false}
      zoomControl={false}
      attributionControl={false}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; OSM'
      />
      <Polyline
        positions={polylinePositions}
        pathOptions={{ color: "#E8590C", weight: 4, dashArray: "6 6", opacity: 0.85 }}
      />
      {markers.map((m, i) => (
        <Marker key={i} position={m} />
      ))}
    </MapContainer>
  );
}
