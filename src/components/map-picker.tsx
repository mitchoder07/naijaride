"use client";

import { useEffect, useRef, useState, Suspense, lazy } from "react";
import { MapPin, Crosshair, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  SUPPORTED_CITIES,
  findNearestCity,
  type SupportedCity,
} from "@/lib/cities";

export interface GeoPoint {
  label: string;
  lat: number;
  lng: number;
}

// Check if Google Maps API key is configured
const GOOGLE_MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

interface MapPickerProps {
  pickup?: GeoPoint | null;
  onChange: (p: GeoPoint | null) => void;
  center?: { lat: number; lng: number };
  height?: string;
  label?: string;
  allowManualLabel?: boolean;
}

// Lazy load the Google Maps interactive component
const GoogleMapInteractive = lazy(() => import("./google-map-interactive"));

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  if (!GOOGLE_MAPS_KEY) {
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_KEY}&language=en`,
    );
    if (!res.ok) return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    const data = await res.json();
    if (data.results && data.results.length > 0) {
      // Use the first result, but clean it up
      const address = data.results[0].formatted_address;
      return address;
    }
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  } catch {
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
}

export function MapPicker({
  pickup,
  onChange,
  center,
  height = "320px",
  label = "Pickup point",
  allowManualLabel = true,
}: MapPickerProps) {
  const lookupBusy = useRef(false);
  const [cityWarning, setCityWarning] = useState<string | null>(null);

  const handlePick = async (lat: number, lng: number) => {
    if (lookupBusy.current) return;
    lookupBusy.current = true;
    try {
      const resolved = await reverseGeocode(lat, lng);

      // Check if location is in a supported city
      const nearest = findNearestCity(lat, lng);
      if (!nearest) {
        const cityNames = SUPPORTED_CITIES.slice(0, 5)
          .map((c) => c.name)
          .join(", ");
        setCityWarning(
          `This location is outside our service area. We currently operate in: ${cityNames}, and more.`,
        );
        return; // Don't set the location
      }

      setCityWarning(null);
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
        {GOOGLE_MAPS_KEY ? (
          <Suspense
            fallback={
              <div className="flex items-center justify-center h-full bg-muted">
                <div className="size-6 rounded-full border-2 border-foreground/30 border-t-foreground animate-spin" />
              </div>
            }
          >
            <GoogleMapInteractive
              center={center}
              pickup={pickup ?? null}
              onPick={handlePick}
              height={height}
            />
          </Suspense>
        ) : (
          <div className="flex flex-col items-center justify-center h-full bg-muted text-center p-4">
            <MapPin className="size-8 text-muted-foreground mb-2" />
            <p className="text-sm font-medium mb-1">Google Maps API key needed</p>
            <p className="text-xs text-muted-foreground max-w-[250px]">
              Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your environment variables to enable interactive maps.
            </p>
          </div>
        )}

        {!pickup && GOOGLE_MAPS_KEY && (
          <div className="absolute inset-0 bg-background/30 pointer-events-none flex items-center justify-center">
            <div className="bg-background/95 backdrop-blur px-4 py-2 rounded-full text-sm font-medium border-2 border-border/40 flex items-center gap-2 pointer-events-none">
              <MapPin className="size-4 text-primary" />
              Tap the map to drop a pin
            </div>
          </div>
        )}
      </div>

      {cityWarning && (
        <div className="rounded-xl bg-destructive/10 border border-destructive/30 p-3 text-xs text-destructive">
          {cityWarning}
        </div>
      )}

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
              onClick={() => {
                onChange(null);
                setCityWarning(null);
              }}
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

// Compact route preview using Google Maps
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
  return (
    <div
      className={cn("rounded-2xl overflow-hidden border-2 border-border/40", className)}
      style={{ height }}
    >
      {GOOGLE_MAPS_KEY ? (
        <Suspense
          fallback={
            <div className="flex items-center justify-center h-full bg-muted">
              <div className="size-6 rounded-full border-2 border-foreground/30 border-t-foreground animate-spin" />
            </div>
          }
        >
          <GoogleRoutePreview
            origin={origin}
            destination={destination}
            waypoints={waypoints}
          />
        </Suspense>
      ) : (
        <div className="flex items-center justify-center h-full bg-muted">
          <MapPin className="size-8 text-muted-foreground" />
        </div>
      )}
    </div>
  );
}

// Lazy loaded route preview
const GoogleRoutePreview = lazy(() => import("./google-route-preview"));
