"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Car, Calendar, Users, Plus, Filter } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useNavigation } from "@/lib/store";
import { api, formatNGN, formatDate, formatTime } from "@/lib/api";
import { EmptyState } from "@/components/empty-state";
import { UserAvatar } from "@/components/user-avatar";

interface MyTrip {
  id: string;
  originLabel: string;
  destinationLabel: string;
  departureAt: string;
  seatsTotal: number;
  seatsAvailable: number;
  pricePerSeat: number;
  status: string;
  createdAt: string;
  bookings: {
    id: string;
    status: string;
    seatsBooked: number;
    passenger: { id: string; name: string | null; avatarUrl: string | null };
  }[];
}

export function MyTripsView() {
  const { navigate } = useNavigation();
  const { isAuthenticated, isLoading } = useCurrentUser();
  const [filter, setFilter] = useState<"upcoming" | "past">("upcoming");

  const { data, isLoading: tripsLoading } = useQuery({
    queryKey: ["my-trips"],
    enabled: isAuthenticated,
    queryFn: () => api.get<{ trips: MyTrip[] }>(`/api/trips/my`),
  });

  const trips = data?.trips ?? [];
  const now = Date.now();
  const upcoming = trips.filter(
    (t) => new Date(t.departureAt).getTime() > now && t.status !== "CANCELLED",
  );
  const past = trips.filter(
    (t) => new Date(t.departureAt).getTime() <= now || t.status === "CANCELLED",
  );
  const visible = filter === "upcoming" ? upcoming : past;

  if (isLoading) {
    return (
      <main className="container mx-auto px-4 py-8">
        <Skeleton className="h-12 w-64 mb-6" />
        <Skeleton className="h-64" />
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <EmptyState
        icon={Car}
        title="Sign in to view your trips"
        action={
          <Button
            onClick={() => navigate("signin")}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Sign in
          </Button>
        }
      />
    );
  }

  return (
    <main className="container mx-auto px-4 py-8 md:py-10">
      <header className="mb-6 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <Badge variant="secondary" className="gap-1 mb-2">
            <Filter className="size-3.5" />
            Driver
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight">My trips</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Trips you&apos;ve offered as a driver.
          </p>
        </div>
        <Button
          onClick={() => navigate("create-trip")}
          className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="size-4" />
          Offer a ride
        </Button>
      </header>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as "upcoming" | "past")}>
        <TabsList className="mb-4">
          <TabsTrigger value="upcoming">
            Upcoming ({upcoming.length})
          </TabsTrigger>
          <TabsTrigger value="past">Past ({past.length})</TabsTrigger>
        </TabsList>
        <TabsContent value={filter} className="space-y-3">
          {tripsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
          ) : visible.length === 0 ? (
            <Card>
              <CardContent className="py-8">
                <EmptyState
                  icon={Car}
                  title={
                    filter === "upcoming"
                      ? "No upcoming trips"
                      : "No past trips yet"
                  }
                  description={
                    filter === "upcoming"
                      ? "Publish a new trip to start receiving bookings."
                      : "Your completed and cancelled trips will appear here."
                  }
                  className="py-10"
                  action={
                    filter === "upcoming" ? (
                      <Button
                        onClick={() => navigate("create-trip")}
                        className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                      >
                        <Plus className="size-4" />
                        Offer a ride
                      </Button>
                    ) : undefined
                  }
                />
              </CardContent>
            </Card>
          ) : (
            visible.map((t) => (
              <Card
                key={t.id}
                className="hover:shadow-sm hover:border-primary/30 transition cursor-pointer"
                onClick={() => navigate("trip-detail", { id: t.id })}
              >
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold truncate">
                        {t.originLabel} → {t.destinationLabel}
                      </p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Calendar className="size-3.5" />
                        {formatDate(t.departureAt)} · {formatTime(t.departureAt)}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-primary">
                        {formatNGN(t.pricePerSeat)}
                      </p>
                      <p className="text-[10px] text-muted-foreground uppercase">
                        per seat
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2 pt-3 border-t border-border/40">
                    <Badge
                      variant={
                        t.status === "OPEN"
                          ? "default"
                          : t.status === "FULL"
                            ? "secondary"
                            : "outline"
                      }
                      className={
                        t.status === "OPEN"
                          ? "bg-primary text-primary-foreground"
                          : ""
                      }
                    >
                      {t.status}
                    </Badge>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Users className="size-3.5" />
                        {t.seatsAvailable}/{t.seatsTotal}
                      </span>
                      <span className="text-muted-foreground">
                        {t.bookings.length} booking
                        {t.bookings.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                  {t.bookings.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {t.bookings.map((b) => (
                        <div
                          key={b.id}
                          className="flex items-center gap-1.5 rounded-full bg-accent/40 py-0.5 pl-0.5 pr-2"
                        >
                          <UserAvatar
                            name={b.passenger.name}
                            avatarUrl={b.passenger.avatarUrl}
                            className="size-5"
                          />
                          <span className="text-xs">
                            {b.passenger.name ?? "Passenger"}
                          </span>
                          <Badge variant="outline" className="text-[10px] px-1">
                            {b.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </main>
  );
}
