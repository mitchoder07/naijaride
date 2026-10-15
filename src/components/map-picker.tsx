"use client";

import { useEffect, useRef, useState, Suspense, lazy } from "react";
import { MapPin, Crosshair, X, Search, Maximize2, ArrowLeft } from "lucide-react";
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
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_KEY}&language=en`,
    );
    if (!res.ok) return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    const data = await res.json();
    if (data.results && data.results.length > 0) {
      return data.results[0].formatted_address;
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
  const [fullscreenOpen, setFullscreenOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<
    Array<{ label: string; lat: number; lng: number }>
  >([]);

  const handlePick = async (lat: number, lng: number) => {
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
      const resolved = await reverseGeocode(lat, lng);
      onChange({ label: resolved, lat, lng });
      setFullscreenOpen(false);
    } finally {
      lookupBusy.current = false;
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim() || !GOOGLE_MAPS_KEY) return;
    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
          searchQuery + ", Nigeria",
        )}&key=${GOOGLE_MAPS_KEY}&language=en`,
      );
      const data = await res.json();
      if (data.results) {
        const results = data.results
          .slice(0, 5)
          .map((r: { formatted_address: string; geometry: { location: { lat: number; lng: number } } }) => ({
            label: r.formatted_address,
            lat: r.geometry.location.lat,
            lng: r.geometry.location.lng,
          }));
        setSearchResults(results);
      }
    } catch (err) {
      console.error("[search] error", err);
    }
  };

  const handleSelectResult = (result: { label: string; lat: number; lng: number }) => {
    handlePick(result.lat, result.lng);
    setSearchQuery("");
    setSearchResults([]);
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
        <div className="flex gap-2">
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
        </div>
      </div>

      {/* Search box */}
      {GOOGLE_MAPS_KEY && (
        <div className="relative">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder={`Search for a place in ${label.toLowerCase()}...`}
                className="pl-9 rounded-full"
              />
            </div>
            <Button
              type="button"
              size="sm"
              onClick={handleSearch}
              className="rounded-full"
            >
              Search
            </Button>
          </div>
          {searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-lg z-20 max-h-48 overflow-y-auto">
              {searchResults.map((result, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSelectResult(result)}
                  className="w-full text-left px-3 py-2 hover:bg-muted transition border-b border-border/40 last:border-0"
                >
                  <div className="flex items-start gap-2">
                    <MapPin className="size-4 text-primary shrink-0 mt-0.5" />
                    <p className="text-sm font-medium truncate">{result.label}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Map preview - clickable to open fullscreen */}
      <div
        className="rounded-2xl overflow-hidden border-2 border-border/60 relative cursor-pointer"
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

        {pickup && GOOGLE_MAPS_KEY && (
          <div className="absolute top-2 right-2 bg-background/95 backdrop-blur px-2 py-1 rounded-full text-xs font-medium border border-border/40 flex items-center gap-1 pointer-events-none">
            <MapPin className="size-3 text-primary" />
            Pin dropped
          </div>
        )}
        {GOOGLE_MAPS_KEY && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-background/95 backdrop-blur px-3 py-1 rounded-full text-xs font-medium border border-border/40 flex items-center gap-1 pointer-events-none">
            <Maximize2 className="size-3" />
            Tap to open full map
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

      {/* Fullscreen map modal - like Uber */}
      <Dialog open={fullscreenOpen} onOpenChange={setFullscreenOpen}>
        <DialogContent className="max-w-none w-screen h-screen p-0 m-0 rounded-none border-0">
          <DialogTitle className="sr-only">Full screen map - {label}</DialogTitle>
          <div className="flex flex-col h-full">
            {/* Header with search */}
            <div className="bg-background border-b border-border p-3 flex items-center gap-2 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setFullscreenOpen(false)}
                className="rounded-full shrink-0"
              >
                <ArrowLeft className="size-5" />
              </Button>
              {GOOGLE_MAPS_KEY ? (
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    placeholder={`Search for a place...`}
                    className="pl-9 rounded-full"
                  />
                  {searchResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-lg z-20 max-h-64 overflow-y-auto">
                      {searchResults.map((result, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => handleSelectResult(result)}
                          className="w-full text-left px-3 py-2 hover:bg-muted transition border-b border-border/40 last:border-0"
                        >
                          <div className="flex items-start gap-2">
                            <MapPin className="size-4 text-primary shrink-0 mt-0.5" />
                            <p className="text-sm font-medium truncate">{result.label}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm font-medium flex-1">Set location - {label}</p>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleLocate}
                className="rounded-full gap-1.5 shrink-0"
              >
                <Crosshair className="size-4" />
                GPS
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
                    onPick={handlePick}
                    height="100%"
                  />
                </Suspense>
              ) : (
                <div className="flex flex-col items-center justify-center h-full bg-muted text-center p-8">
                  <MapPin className="size-12 text-muted-foreground mb-3" />
                  <p className="text-base font-medium mb-2">Google Maps API key needed</p>
                  <p className="text-sm text-muted-foreground max-w-md">
                    Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your environment variables to enable the interactive map.
                  </p>
                </div>
              )}

              {/* Floating instruction */}
              {GOOGLE_MAPS_KEY && !pickup && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-background/95 backdrop-blur px-4 py-2 rounded-full text-sm font-medium border border-border/40 flex items-center gap-2 pointer-events-none shadow-lg">
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
