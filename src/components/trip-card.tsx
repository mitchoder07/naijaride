"use client";

import { Calendar, Clock, Users, Star, Venus } from "lucide-react";
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

export function TripCard({ trip }: { trip: TripSummary }) {
  const { navigate } = useNavigation();
  const waypoints = trip.waypointsJson
    ? (JSON.parse(trip.waypointsJson) as { label: string; lat: number; lng: number }[])
    : [];
  const isFull = trip.seatsAvailable <= 0;
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
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1.5 flex-wrap">
                <Calendar className="size-3.5" />
                <span>{formatDate(trip.departureAt)}</span>
                <span className="text-border">·</span>
                <Clock className="size-3.5" />
                <span>{formatTime(trip.departureAt)}</span>
                {trip.femaleOnly && (
                  <Badge variant="secondary" className="gap-1 text-[10px] bg-chart-4/15 text-chart-4 ml-auto">
                    <Venus className="size-2.5" />
                    Women only
                  </Badge>
                )}
              </div>
              <h3 className="font-display font-bold text-base leading-snug">
                <span className="text-foreground">{trip.originLabel}</span>
                <span className="text-muted-foreground mx-1.5">→</span>
                <span className="text-primary">{trip.destinationLabel}</span>
              </h3>
              {waypoints.length > 0 && (
                <p className="text-xs text-muted-foreground mt-1 truncate">
                  via {waypoints.map((w) => w.label).join(", ")}
                </p>
              )}
            </div>
            <div className="text-right shrink-0">
              <p className="text-lg font-display font-bold text-primary">
                {formatNGN(trip.pricePerSeat)}
              </p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                per seat
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/40">
            <div className="flex items-center gap-2 min-w-0">
              {trip.driver && (
                <>
                  <UserAvatar
                    name={trip.driver.name}
                    avatarUrl={trip.driver.avatarUrl}
                    className="size-7"
                  />
                  <span className="text-sm font-medium truncate max-w-[90px]">
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
            <div className="flex items-center gap-2">
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
