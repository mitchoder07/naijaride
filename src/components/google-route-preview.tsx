"use client";

import { useEffect, useState } from "react";
import {
  APIProvider,
  Map,
  Marker,
  useMap,
} from "@vis.gl/react-google-maps";
import type { GeoPoint } from "@/components/map-picker";

const GOOGLE_MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!;

function RouteContent({
  origin,
  destination,
  waypoints,
}: {
  origin: GeoPoint;
  destination: GeoPoint;
  waypoints: GeoPoint[];
}) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    // Fit bounds to show all points
    const bounds = new google.maps.LatLngBounds();
    bounds.extend({ lat: origin.lat, lng: origin.lng });
    bounds.extend({ lat: destination.lat, lng: destination.lng });
    waypoints.forEach((w) =>
      bounds.extend({ lat: w.lat, lng: w.lng }),
    );
    map.fitBounds(bounds, 60);
  }, [map, origin, destination, waypoints]);

  // Draw a polyline between all points
  useEffect(() => {
    if (!map) return;
    const path = [
      { lat: origin.lat, lng: origin.lng },
      ...waypoints.map((w) => ({ lat: w.lat, lng: w.lng })),
      { lat: destination.lat, lng: destination.lng },
    ];
    const polyline = new google.maps.Polyline({
      path,
      geodesic: true,
      strokeColor: "#E8590C",
      strokeOpacity: 0.8,
      strokeWeight: 3,
    });
    polyline.setMap(map);
    return () => polyline.setMap(null);
  }, [map, origin, destination, waypoints]);

  return (
    <>
      <Marker
        position={{ lat: origin.lat, lng: origin.lng }}
        label={{ text: "A", color: "#fff", fontSize: "12px", fontWeight: "bold" }}
      />
      {waypoints.map((w, i) => (
        <Marker
          key={i}
          position={{ lat: w.lat, lng: w.lng }}
          label={{
            text: String.fromCharCode(66 + i),
            color: "#fff",
            fontSize: "10px",
          }}
        />
      ))}
      <Marker
        position={{ lat: destination.lat, lng: destination.lng }}
        label={{
          text: String.fromCharCode(67 + waypoints.length),
          color: "#fff",
          fontSize: "12px",
          fontWeight: "bold",
        }}
      />
    </>
  );
}

export default function GoogleRoutePreview({
  origin,
  destination,
  waypoints = [],
}: {
  origin: GeoPoint;
  destination: GeoPoint;
  waypoints?: GeoPoint[];
}) {
  return (
    <APIProvider apiKey={GOOGLE_MAPS_KEY}>
      <Map
        defaultCenter={{ lat: origin.lat, lng: origin.lng }}
        defaultZoom={6}
        gestureHandling="none"
        disableDefaultUI={true}
        mapTypeControl={false}
        streetViewControl={false}
        fullscreenControl={false}
        style={{ width: "100%", height: "100%" }}
      >
        <RouteContent
          origin={origin}
          destination={destination}
          waypoints={waypoints}
        />
      </Map>
    </APIProvider>
  );
}
