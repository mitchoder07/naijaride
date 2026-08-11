"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Search,
  MapPin,
  Calendar,
  Sparkles,
  Filter,
  X,
  RefreshCw,
  Compass,
  Crosshair,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { TripSummary } from "@/components/trip-card";
import { TripCard } from "@/components/trip-card";
import { EmptyState } from "@/components/empty-state";
import { useNavigation } from "@/lib/store";
import { MapPicker, type GeoPoint } from "@/components/map-picker";

// Re-export for backward compatibility with create-trip-view if it imports it
export interface NaijaLocation {
  label: string;
  lat: number;
  lng: number;
}
export const NAIJA_LOCATIONS: NaijaLocation[] = [];

export function TripsSearchView() {
  const { navigate } = useNavigation();
  const [pickup, setPickup] = useState<GeoPoint | null>(null);
  const [dropoff, setDropoff] = useState<GeoPoint | null>(null);
  const [departAfter, setDepartAfter] = useState<string>("");

  const canSearch = !!pickup && !!dropoff;

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["trips-search", pickup?.lat, pickup?.lng, dropoff?.lat, dropoff?.lng, departAfter],
    enabled: canSearch,
    queryFn: () => {
      const qs = new URLSearchParams({
        pickupLat: String(pickup!.lat),
        pickupLng: String(pickup!.lng),
        dropoffLat: String(dropoff!.lat),
        dropoffLng: String(dropoff!.lng),
        departAfter: departAfter
          ? new Date(departAfter).toISOString()
          : new Date().toISOString(),
      });
      return api.get<{ trips: TripSummary[] }>(`/api/trips/search?${qs}`);
    },
  });

  const trips = data?.trips ?? [];

  const clearAll = () => {
    setPickup(null);
    setDropoff(null);
    setDepartAfter("");
  };

  return (
    <main className="container mx-auto px-4 py-8 md:py-10">
      <header className="mb-6">
        <Badge variant="secondary" className="gap-1 mb-3">
          <Compass className="size-3.5" />
          Find a ride
        </Badge>
        <h1 className="text-3xl md:text-5xl font-display font-bold tracking-tight">
          Where are you heading?
        </h1>
        <p className="text-muted-foreground mt-2 max-w-xl text-lg">
          Drop pins on the map to set pickup and drop-off. We&apos;ll rank
          trips by distance and departure time.
        </p>
      </header>

      <Card className="mb-6 border-2 card-stamp">
        <CardContent className="p-5 md:p-6 space-y-5">
          <div className="grid gap-5 md:grid-cols-2">
            <MapPicker
              label="Pickup point"
              pickup={pickup}
              onChange={setPickup}
              center={[6.5244, 3.3792]} // Lagos
              height="260px"
            />
            <MapPicker
              label="Drop-off point"
              pickup={dropoff}
              onChange={setDropoff}
              center={[9.0765, 7.3986]} // Abuja
              height="260px"
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Depart after (optional)
              </label>
              <Input
                type="datetime-local"
                value={departAfter}
                onChange={(e) => setDepartAfter(e.target.value)}
                className="rounded-full"
              />
            </div>
            <div className="flex items-end gap-2">
              <Button
                disabled={!canSearch || isFetching}
                onClick={() => refetch()}
                className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-full font-semibold h-10 flex-1 shadow-lg shadow-primary/20"
              >
                {isFetching ? (
                  <RefreshCw className="size-4 animate-spin" />
                ) : (
                  <Search className="size-4" />
                )}
                {isFetching ? "Searching..." : "Search trips"}
              </Button>
              <Button
                variant="outline"
                onClick={clearAll}
                className="gap-1 rounded-full h-10"
                disabled={!pickup && !dropoff && !departAfter}
              >
                <X className="size-4" />
                Clear
              </Button>
            </div>
          </div>
          {trips.length > 0 && (
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Sparkles className="size-3.5 text-primary" />
              {trips.length} matches · ranked by distance &amp; departure time
            </p>
          )}
        </CardContent>
      </Card>

      {!canSearch ? (
        <EmptyState
          icon={Filter}
          title="Drop pins on the map to start"
          description="Set your pickup and drop-off to see matching trips near you."
        />
      ) : isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-2xl" />
          ))}
        </div>
      ) : trips.length === 0 ? (
        <EmptyState
          icon={Compass}
          title="No matching trips yet"
          description="No drivers heading your way in the next 24 hours. Try a different pickup or check back later."
          action={
            <Button
              onClick={() => navigate("landing")}
              variant="outline"
              className="rounded-full"
            >
              Back home
            </Button>
          }
        />
      ) : (
        <>
          <div className="flex items-center gap-2 mb-4 text-sm">
            <Sparkles className="size-4 text-primary" />
            <span className="text-muted-foreground">
              Trips ranked by match score — distance &amp; departure time
            </span>
          </div>
          <motion.div
            layout
            className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
          >
            {trips.map((t, i) => (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <TripCard trip={t} />
              </motion.div>
            ))}
          </motion.div>
        </>
      )}
    </main>
  );
}
