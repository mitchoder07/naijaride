"use client";

import { useRef, useState, Suspense, lazy } from "react";
import { MapPin, Crosshair, X, Maximize2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  SUPPORTED_CITIES,
  findNearestCity,
} from "@/lib/cities";
import { GooglePlacesSearch } from "@/components/google-places-search";

export interface GeoPoint {
  label: string;
  lat: number;
  lng: number;
}

const GOOGLE_MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

interface MapPickerProps {
  pickup?: GeoPoint | null;
  onChange: (p: GeoPoint | null) => void;
  center?: { lat: number; lng: number };
  height?: string;
  label?: string;
  allowManualLabel?: boolean;
}

const GoogleMapInteractive = lazy(() => import("./google-map-interactive"));

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  if (!GOOGLE_MAPS_KEY) {
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
  try {
    // Try with result_type filter for specific addresses first
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_KEY}&language=en&result_type=street_address|route|neighborhood|sublocality|locality|administrative_area_level_2|administrative_area_level_1`,
    );
    const data = await res.json();

    if (data.status === "OK" && data.results && data.results.length > 0) {
      return data.results[0].formatted_address;
    }

    // Fallback: try without result_type filter
    const res2 = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_KEY}&language=en`,
    );
    const data2 = await res2.json();

    if (data2.status === "OK" && data2.results && data2.results.length > 0) {
      return data2.results[0].formatted_address;
    }

    // If API returned an error, log it
    if (data.error_message) {
      console.error("[geocode] API error:", data.error_message);
    }

    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  } catch (err) {
    console.error("[geocode] fetch error", err);
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
  const [fullscreenOpen, setFullscreenOpen] = useState(false);

  const handlePick = async (lat: number, lng: number, placeLabel?: string) => {
    if (lookupBusy.current) return;
    lookupBusy.current = true;
    try {
      const nearest = findNearestCity(lat, lng);
      if (!nearest) {
        const cityNames = SUPPORTED_CITIES.slice(0, 5)
          .map((c) => c.name)
          .join(", ");
        setCityWarning(
          `This location is outside our service area. We currently operate in: ${cityNames}, and more.`,
        );
        return;
      }

      setCityWarning(null);

      // If we already have a label from search, use it. Otherwise reverse geocode.
      const resolvedLabel = placeLabel || await reverseGeocode(lat, lng);
      onChange({ label: resolvedLabel, lat, lng });
      setFullscreenOpen(false);
    } finally {
      lookupBusy.current = false;
    }
  };

  // When user selects from search
  const handleSearchSelect = (result: { label: string; lat: number; lng: number }) => {
    handlePick(result.lat, result.lng, result.label);
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
      <div className="flex items-center justify-between gap-2">
        <Label className="text-base font-semibold">{label}</Label>
        <div className="flex gap-1.5">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleLocate}
            className="gap-1.5 rounded-full text-xs"
          >
            <Crosshair className="size-3.5" />
            GPS
          </Button>
          {GOOGLE_MAPS_KEY && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setFullscreenOpen(true)}
              className="gap-1.5 rounded-full text-xs"
            >
              <Maximize2 className="size-3.5" />
              Full map
            </Button>
          )}
        </div>
      </div>

      {/* Google Places Search box - real-time suggestions like Google Maps */}
      {GOOGLE_MAPS_KEY && (
        <GooglePlacesSearch
          placeholder={`Search for a place for ${label.toLowerCase()}...`}
          onSelect={handleSearchSelect}
        />
      )}

      {/* Map preview */}
      <div
        className={cn(
          "rounded-2xl overflow-hidden border-2 border-border/60 relative",
          GOOGLE_MAPS_KEY && "cursor-pointer",
        )}
        style={{ height }}
        onClick={() => GOOGLE_MAPS_KEY && setFullscreenOpen(true)}
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
              onPick={(lat, lng) => handlePick(lat, lng)}
              height={height}
            />
          </Suspense>
        ) : (
          <div className="flex flex-col items-center justify-center h-full bg-muted text-center p-4">
            <MapPin className="size-8 text-muted-foreground mb-2" />
            <p className="text-sm font-medium mb-1">Google Maps API key needed</p>
            <p className="text-xs text-muted-foreground max-w-[250px]">
              Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your environment variables.
            </p>
          </div>
        )}

        {pickup && GOOGLE_MAPS_KEY && (
          <div className="absolute top-2 right-2 bg-background/95 backdrop-blur px-2.5 py-1 rounded-full text-xs font-medium border border-border/40 flex items-center gap-1 pointer-events-none">
            <MapPin className="size-3 text-primary" />
            Pinned
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
          <Label className="text-xs text-muted-foreground">Selected location</Label>
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
              className="rounded-full text-muted-foreground hover:text-destructive shrink-0"
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

      {/* Fullscreen map modal - like Uber */}
      <Dialog open={fullscreenOpen} onOpenChange={setFullscreenOpen}>
        <DialogContent className="max-w-none w-screen h-screen p-0 m-0 rounded-none border-0 [&>button]:hidden">
          <DialogTitle className="sr-only">Full screen map - {label}</DialogTitle>
          <div className="flex flex-col h-full">
            {/* Header with back button and search */}
            <div className="bg-background border-b border-border p-3 flex items-center gap-2 shrink-0 z-10">
              <Button
                variant="default"
                onClick={() => setFullscreenOpen(false)}
                className="rounded-full gap-1.5 shrink-0 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold px-4"
              >
                <ArrowLeft className="size-5" />
                <span>Back</span>
              </Button>
              <div className="flex-1">
                <GooglePlacesSearch
                  placeholder="Search for a place..."
                  onSelect={handleSearchSelect}
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={handleLocate}
                className="rounded-full shrink-0"
                title="Use my location"
              >
                <Crosshair className="size-4" />
              </Button>
            </div>

            {/* Map */}
            <div className="flex-1 relative">
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
                    onPick={(lat, lng) => handlePick(lat, lng)}
                    height="100%"
                  />
                </Suspense>
              ) : (
                <div className="flex flex-col items-center justify-center h-full bg-muted text-center p-8">
                  <MapPin className="size-12 text-muted-foreground mb-3" />
                  <p className="text-base font-medium mb-2">Google Maps API key needed</p>
                  <p className="text-sm text-muted-foreground max-w-md">
                    Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your environment variables.
                  </p>
                </div>
              )}

              {GOOGLE_MAPS_KEY && !pickup && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-background/95 backdrop-blur px-4 py-2.5 rounded-full text-sm font-medium border border-border/40 flex items-center gap-2 pointer-events-none shadow-lg">
                  <MapPin className="size-4 text-primary" />
                  Tap anywhere on the map to drop a pin
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
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

const GoogleRoutePreview = lazy(() => import("./google-route-preview"));
