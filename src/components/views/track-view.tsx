"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  MapPin,
  Clock,
  Car,
  ShieldCheck,
  Phone,
  Navigation,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { Logo } from "@/components/logo";

interface TrackData {
  share: { token: string; audience: string; expiresAt: string };
  trip: {
    id: string;
    originLabel: string;
    destinationLabel: string;
    departureAt: string;
    vehicleModel: string;
    vehicleColor: string;
    vehiclePlate: string;
    currentLat: number | null;
    currentLng: number | null;
    tripStartedAt: string | null;
    tripEndedAt: string | null;
    status: string;
    driver: {
      id: string;
      name: string;
      avatarUrl: string | null;
      phone: string | null;
      trustScore: number;
      isVerified: boolean;
    };
  };
  sharedBy: { id: string; name: string; phone: string };
}

export function TrackView({ token }: { token: string }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["track", token],
    queryFn: () => api.get<TrackData>(`/api/safety/share/${token}`),
    refetchInterval: 15_000, // refresh every 15s for live updates
  });

  if (isLoading) {
    return (
      <main className="container mx-auto px-4 py-12 max-w-2xl">
        <Skeleton className="h-12 w-64 mb-6" />
        <Skeleton className="h-64 mb-4" />
        <Skeleton className="h-32" />
      </main>
    );
  }

  if (error) {
    return (
      <main className="container mx-auto px-4 py-12 max-w-2xl">
        <Card className="border-2 border-destructive/30">
          <CardContent className="p-8 text-center">
            <AlertCircle className="size-12 mx-auto text-destructive mb-3" />
            <h1 className="text-2xl font-display font-bold mb-2">
              {error instanceof Error ? error.message : "Link unavailable"}
            </h1>
            <p className="text-sm text-muted-foreground">
              Ask the rider for a fresh link, or contact them directly.
            </p>
          </CardContent>
        </Card>
      </main>
    );
  }

  const trip = data?.trip;
  if (!trip) return null;

  const expired = new Date(data.share.expiresAt) < new Date();
  const tripInProgress = !!trip.tripStartedAt && !trip.tripEndedAt;

  return (
    <main className="container mx-auto px-4 py-8 max-w-2xl">
      <header className="flex items-center justify-between mb-6">
        <Logo size={36} withWordmark={false} onClick={() => (window.location.href = "/")} />
        <Badge variant="secondary" className="gap-1">
          <ShieldCheck className="size-3" />
          Live tracking
        </Badge>
      </header>

      <Card className="border-2 mb-4 overflow-hidden">
        <CardContent className="p-0">
          <div className="bg-gradient-to-br from-primary/10 to-chart-2/10 p-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
              Tracking trip shared by
            </p>
            <h1 className="text-2xl font-display font-bold">{data.sharedBy.name}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {trip.originLabel} → {trip.destinationLabel}
            </p>
          </div>

          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground">Departure</p>
                <p className="font-semibold text-sm">
                  {new Date(trip.departureAt).toLocaleString("en-NG", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <div className="rounded-xl bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground">Status</p>
                <p className="font-semibold text-sm flex items-center gap-1.5">
                  {tripInProgress && (
                    <>
                      <motion.span
                        animate={{ opacity: [1, 0.4, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="size-2 rounded-full bg-chart-2"
                      />
                      In progress
                    </>
                  )}
                  {!tripInProgress && trip.status === "OPEN" && "Not started yet"}
                  {!tripInProgress && trip.status === "COMPLETED" && "Completed"}
                  {!tripInProgress && trip.status === "CANCELLED" && "Cancelled"}
                </p>
              </div>
            </div>

            {/* Driver info */}
            <div className="rounded-2xl border-2 border-border/60 p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3">Driver</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-12 rounded-full bg-primary/15 text-primary flex items-center justify-center font-display font-bold">
                    {trip.driver.name?.[0]?.toUpperCase() ?? "?"}
                  </div>
                  <div>
                    <p className="font-semibold">{trip.driver.name}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <ShieldCheck className="size-3 text-chart-2" />
                      {trip.driver.isVerified ? "Verified" : "Unverified"} · Trust {trip.driver.trustScore}/100
                    </p>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-chart-2/15 text-chart-2">
                  {trip.driver.trustScore >= 80 ? "Excellent" : trip.driver.trustScore >= 60 ? "Good" : "Fair"}
                </Badge>
              </div>
            </div>

            {/* Vehicle */}
            <div className="rounded-2xl bg-muted/30 p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1">
                <Car className="size-3" /> Vehicle
              </p>
              <p className="font-semibold">
                {trip.vehicleModel} · {trip.vehicleColor}
              </p>
              <p className="text-sm text-muted-foreground">Plate: {trip.vehiclePlate}</p>
            </div>

            {trip.currentLat && trip.currentLng && (
              <a
                href={`https://maps.google.com/?q=${trip.currentLat},${trip.currentLng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <Button variant="outline" className="w-full rounded-full gap-2">
                  <Navigation className="size-4" />
                  View live location on Google Maps
                </Button>
              </a>
            )}

            {expired && (
              <div className="rounded-xl bg-destructive/10 border-2 border-destructive/30 p-3 text-sm text-destructive flex items-center gap-2">
                <AlertCircle className="size-4 shrink-0" />
                This share link has expired. Ask the rider for a fresh link.
              </div>
            )}

            {/* Auto-refresh note */}
            <p className="text-[11px] text-muted-foreground text-center flex items-center justify-center gap-1">
              <Clock className="size-3" />
              Updates every 15 seconds · Last refreshed {new Date().toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-2 border-primary/30 bg-primary/5">
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <div className="size-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <h3 className="font-semibold">Concerned about safety?</h3>
              <p className="text-xs text-muted-foreground mt-1">
                If you cannot reach the rider or you suspect danger, call them directly. If no response,
                contact NaijaRide Safety at <span className="font-bold">safety@naijaride.demo</span> or
                call <span className="font-bold">112</span> (Nigeria Emergency).
              </p>
              {trip.driver.phone && (
                <a href={`tel:${trip.driver.phone}`} className="mt-2 inline-block">
                  <Button size="sm" variant="outline" className="rounded-full gap-1.5">
                    <Phone className="size-3.5" />
                    Call driver
                  </Button>
                </a>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
