"use client";

import { useEffect, useMemo, useRef, useState, Suspense, lazy } from "react";
import { MapPin, Crosshair, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface GeoPoint {
  label: string;
  lat: number;
  lng: number;
}

// Map components — lazy-loaded so leaflet never imports on server.
const MapInteractive = lazy(() => import("./map-interactive"));
const MapStatic = lazy(() => import("./map-static"));

// Simple label resolver using Nominatim (free OSM geocoding)
async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14&addressdetails=1`,
      { headers: { Accept: "application/json" } },
    );
    if (!res.ok) return `${lat.toFixed(3)}, ${lng.toFixed(3)}`;
    const data = await res.json();
    const addr = data?.address ?? {};
    const town =
      addr.city || addr.town || addr.village || addr.county || addr.state || "";
    const country = addr.country || "";
    return (
      [town, country].filter(Boolean).join(", ") ||
      data?.display_name ||
      `${lat.toFixed(3)}, ${lng.toFixed(3)}`
    );
  } catch {
    return `${lat.toFixed(3)}, ${lng.toFixed(3)}`;
  }
}

interface MapPickerProps {
  pickup?: GeoPoint | null;
  onChange: (p: GeoPoint | null) => void;
  center?: [number, number];
  height?: string;
  label?: string;
  allowManualLabel?: boolean;
}

export function MapPicker({
  pickup,
  onChange,
  center = [9.0765, 7.3986],
  height = "320px",
  label = "Pickup point",
  allowManualLabel = true,
}: MapPickerProps) {
  const lookupBusy = useRef(false);

  const handlePick = async (lat: number, lng: number) => {
    if (lookupBusy.current) return;
    lookupBusy.current = true;
    try {
      const resolved = await reverseGeocode(lat, lng);
      onChange({ label: resolved, lat, lng });
    } finally {
      lookupBusy.current = false;
    }
  };

  const handleLocate = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => handlePick(pos.coords.latitude, pos.coords.longitude),
      (err) => console.warn("geolocation error", err),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  const renameLabel = (newLabel: string) => {
    if (!pickup) return;
    onChange({ ...pickup, label: newLabel });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">{label}</Label>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={handleLocate}
          className="gap-1.5 rounded-full text-xs"
        >
          <Crosshair className="size-3.5" />
          Use my location
        </Button>
      </div>

      <div
        className="rounded-2xl overflow-hidden border-2 border-border/60 relative"
        style={{ height }}
      >
        <Suspense
          fallback={
            <div className="flex items-center justify-center h-full bg-muted">
              <div className="size-6 rounded-full border-2 border-foreground/30 border-t-foreground animate-spin" />
            </div>
          }
        >
          <MapInteractive
            center={center}
            pickup={pickup ?? null}
            onPick={handlePick}
            height={height}
          />
        </Suspense>

        {!pickup && (
          <div className="absolute inset-0 bg-background/30 pointer-events-none flex items-center justify-center">
            <div className="bg-background/90 backdrop-blur px-4 py-2 rounded-full text-sm font-medium border-2 border-border/40 flex items-center gap-2 pointer-events-none">
              <MapPin className="size-4 text-primary" />
              Tap the map to drop a pin
            </div>
          </div>
        )}
      </div>

      {pickup && allowManualLabel && (
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Label (editable)</Label>
          <div className="flex items-center gap-2">
            <Input
              value={pickup.label}
              onChange={(e) => renameLabel(e.target.value)}
              className="rounded-full"
            />
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => onChange(null)}
              className="rounded-full text-muted-foreground hover:text-destructive"
              aria-label={`Clear ${label.toLowerCase()}`}
            >
              <X className="size-4" />
            </Button>
          </div>
          <Badge variant="secondary" className="gap-1 text-xs">
            <MapPin className="size-3" />
            {pickup.lat.toFixed(4)}, {pickup.lng.toFixed(4)}
          </Badge>
        </div>
      )}
    </div>
  );
}

/** Compact route preview — non-interactive */
export function RoutePreviewMap({
  origin,
  destination,
  waypoints = [],
  height = "240px",
  className,
}: {
  origin: GeoPoint;
  destination: GeoPoint;
  waypoints?: GeoPoint[];
  height?: string;
  className?: string;
}) {
  const positions = useMemo<[number, number][]>(() => {
    const pts: GeoPoint[] = [origin, ...waypoints, destination];
    return pts.map((p) => [p.lat, p.lng]);
  }, [origin, destination, waypoints]);

  const bounds = useMemo<[[number, number], [number, number]]>(() => {
    const latMin = Math.min(...positions.map((p) => p[0]));
    const latMax = Math.max(...positions.map((p) => p[0]));
    const lngMin = Math.min(...positions.map((p) => p[1]));
    const lngMax = Math.max(...positions.map((p) => p[1]));
    return [
      [latMin, lngMin],
      [latMax, lngMax],
    ];
  }, [positions]);

  return (
    <div
      className={cn("rounded-2xl overflow-hidden border-2 border-border/40", className)}
      style={{ height }}
    >
      <Suspense
        fallback={
          <div className="flex items-center justify-center h-full bg-muted">
            <div className="size-6 rounded-full border-2 border-foreground/30 border-t-foreground animate-spin" />
          </div>
        }
      >
        <MapStatic
          bounds={bounds}
          polylinePositions={positions}
          markers={[...waypoints, origin, destination].map((p) => [p.lat, p.lng])}
        />
      </Suspense>
    </div>
  );
}
