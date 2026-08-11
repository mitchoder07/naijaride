"use client";

import { Calendar, Clock, Users, Star, Venus, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { UserAvatar } from "@/components/user-avatar";
import { useNavigation } from "@/lib/store";
import { formatNGN, formatDate, formatTime } from "@/lib/api";
import { cn } from "@/lib/utils";
import { TrustBadge } from "@/components/safety/trust-badge";

export interface TripSummary {
  id: string;
  originLabel: string;
  destinationLabel: string;
  originLat: number;
  originLng: number;
  destinationLat: number;
  destinationLng: number;
  waypointsJson?: string;
  departureAt: string;
  seatsTotal: number;
  seatsAvailable: number;
  pricePerSeat: number;
  status: string;
  femaleOnly?: boolean;
  driver?: {
    id: string;
    name: string | null;
    avatarUrl: string | null;
    trustScore?: number;
    isVerified?: boolean;
  };
  match?: {
    score: number;
    pickupDistKm: number;
    dropoffDistKm: number;
  };
}

/**
 * Clean up location labels from Nominatim geocoder.
 * Removes duplicate country names (e.g. "Oja Tutun, Oko Erin, Nigeria, Nigeria" → "Oja Tutun, Oko Erin")
 */
function cleanLocationLabel(label: string): string {
  if (!label) return label;
  // Split by comma, trim each part, remove duplicates, rejoin
  const parts = label.split(",").map((p) => p.trim()).filter(Boolean);
  // Remove duplicate consecutive parts
  const deduped: string[] = [];
  for (const part of parts) {
    const last = deduped[deduped.length - 1];
    if (last?.toLowerCase() !== part.toLowerCase()) {
      deduped.push(part);
    }
  }
  // If the result is too long (more than 3 parts), take the first 3 most relevant
  if (deduped.length > 3) {
    // Keep first 2 parts (usually the specific place + city) + last part (country)
    return `${deduped[0]}, ${deduped[1]}`;
  }
  return deduped.join(", ");
}

export function TripCard({ trip }: { trip: TripSummary }) {
  const { navigate } = useNavigation();
  const waypoints = trip.waypointsJson
    ? (JSON.parse(trip.waypointsJson) as { label: string; lat: number; lng: number }[])
    : [];
  const isFull = trip.seatsAvailable <= 0;

  const origin = cleanLocationLabel(trip.originLabel);
  const destination = cleanLocationLabel(trip.destinationLabel);

  return (
    <button
      className="text-left w-full"
      onClick={() => navigate("trip-detail", { id: trip.id })}
    >
      <Card
        className={cn(
          "border-2 transition-all hover:shadow-md hover:border-primary/40 hover:-translate-y-0.5",
          isFull && "opacity-60",
          trip.femaleOnly && "border-chart-4/30",
        )}
      >
        <CardContent className="p-4 space-y-3">
          {/* Top row: date/time + price */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap min-w-0">
              <Calendar className="size-3.5 shrink-0" />
              <span className="font-medium">{formatDate(trip.departureAt)}</span>
              <span className="text-border">·</span>
              <Clock className="size-3.5 shrink-0" />
              <span className="font-medium">{formatTime(trip.departureAt)}</span>
              {trip.femaleOnly && (
                <Badge variant="secondary" className="gap-1 text-[10px] bg-chart-4/15 text-chart-4 ml-auto">
                  <Venus className="size-2.5" />
                  Women only
                </Badge>
              )}
            </div>
            <div className="text-right shrink-0">
              <p className="text-lg font-display font-bold text-primary leading-tight">
                {formatNGN(trip.pricePerSeat)}
              </p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                per seat
              </p>
            </div>
          </div>

          {/* Route: origin → destination (stacked vertically with arrow) */}
          <div className="space-y-1">
            <div className="flex items-start gap-2 min-w-0">
              <div className="size-2 rounded-full bg-primary shrink-0 mt-1.5" />
              <p className="text-sm font-semibold truncate flex-1">{origin}</p>
            </div>
            <div className="flex items-start gap-2 min-w-0">
              <ArrowRight className="size-3 text-muted-foreground shrink-0 mt-1 rotate-90" />
              <div className="flex-1 min-w-0">
                {waypoints.length > 0 && (
                  <p className="text-[11px] text-muted-foreground truncate">
                    via {waypoints.map((w) => w.label).join(", ")}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-start gap-2 min-w-0">
              <div className="size-2 rounded-full bg-chart-4 shrink-0 mt-1.5" />
              <p className="text-sm font-semibold text-primary truncate flex-1">{destination}</p>
            </div>
          </div>

          {/* Bottom row: driver + seats/match */}
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/40">
            <div className="flex items-center gap-1.5 min-w-0">
              {trip.driver && (
                <>
                  <UserAvatar
                    name={trip.driver.name}
                    avatarUrl={trip.driver.avatarUrl}
                    className="size-6"
                  />
                  <span className="text-xs font-medium truncate max-w-[70px]">
                    {trip.driver.name ?? "Driver"}
                  </span>
                  {trip.driver.isVerified !== undefined && (
                    <TrustBadge
                      verified={!!trip.driver.isVerified}
                      score={trip.driver.trustScore ?? 0}
                      size="xs"
                      showScore
                    />
                  )}
                </>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-1 text-xs">
                <Users className="size-3.5 text-muted-foreground" />
                <span
                  className={
                    isFull ? "text-destructive font-medium" : "font-medium"
                  }
                >
                  {trip.seatsAvailable}/{trip.seatsTotal}
                </span>
              </div>
              {trip.match && (
                <Badge variant="secondary" className="gap-1 text-xs">
                  <Star className="size-3 fill-primary text-primary" />
                  {Math.round(trip.match.score)}%
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </button>
  );
}
