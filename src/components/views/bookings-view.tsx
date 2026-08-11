"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Car,
  Calendar,
  Star,
  MessageCircle,
  CreditCard,
  Clock,
  CheckCircle2,
  Hourglass,
  X,
} from "lucide-react";
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
import { PaystackModal } from "@/components/paystack/paystack-modal";
import { ReviewModal } from "@/components/review-modal";
import { toast } from "sonner";

interface MyBooking {
  id: string;
  seatsBooked: number;
  fareTotal: number;
  status: string;
  createdAt: string;
  trip: {
    id: string;
    originLabel: string;
    destinationLabel: string;
    departureAt: string;
    status: string;
    driver: {
      id: string;
      name: string | null;
      avatarUrl: string | null;
      phone: string | null;
    };
  };
}

const STATUS_META: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: typeof CheckCircle2; className: string }
> = {
  PENDING: {
    label: "Payment pending",
    variant: "secondary",
    icon: Hourglass,
    className: "",
  },
  CONFIRMED: {
    label: "Confirmed",
    variant: "default",
    icon: CheckCircle2,
    className: "bg-primary text-primary-foreground",
  },
  COMPLETED: {
    label: "Completed",
    variant: "outline",
    icon: CheckCircle2,
    className: "",
  },
  CANCELLED: {
    label: "Cancelled",
    variant: "destructive",
    icon: X,
    className: "",
  },
};

export function BookingsView() {
  const { navigate } = useNavigation();
  const { isAuthenticated, isLoading } = useCurrentUser();
  const qc = useQueryClient();
  const [filter, setFilter] = useState<"upcoming" | "past">("upcoming");
  const [payBooking, setPayBooking] = useState<MyBooking | null>(null);
  const [reviewBooking, setReviewBooking] = useState<MyBooking | null>(null);

  const { data, isLoading: bookingsLoading } = useQuery({
    queryKey: ["bookings"],
    enabled: isAuthenticated,
    queryFn: () => api.get<{ bookings: MyBooking[] }>(`/api/bookings`),
  });

  const bookings = data?.bookings ?? [];
  const now = Date.now();
  const upcoming = bookings.filter(
    (b) =>
      (b.status === "PENDING" || b.status === "CONFIRMED") &&
      new Date(b.trip.departureAt).getTime() > now,
  );
  const past = bookings.filter(
    (b) => new Date(b.trip.departureAt).getTime() <= now || b.status === "COMPLETED" || b.status === "CANCELLED",
  );
  const visible = filter === "upcoming" ? upcoming : past;

  const handlePaySuccess = async () => {
    setPayBooking(null);
    toast.success("Payment confirmed! Your seat is reserved.");
    qc.invalidateQueries({ queryKey: ["bookings"] });
    qc.invalidateQueries({ queryKey: ["dashboard"] });
    qc.invalidateQueries({ queryKey: ["session"] });
  };

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
        title="Sign in to view your bookings"
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
      <header className="mb-6">
        <Badge variant="secondary" className="gap-1 mb-2">
          <Car className="size-3.5" />
          Passenger
        </Badge>
        <h1 className="text-3xl font-bold tracking-tight">My bookings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Trips you&apos;ve booked as a passenger.
        </p>
      </header>

      <Tabs
        value={filter}
        onValueChange={(v) => setFilter(v as "upcoming" | "past")}
      >
        <TabsList className="mb-4">
          <TabsTrigger value="upcoming">
            Upcoming ({upcoming.length})
          </TabsTrigger>
          <TabsTrigger value="past">Past ({past.length})</TabsTrigger>
        </TabsList>
        <TabsContent value={filter} className="space-y-3">
          {bookingsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-36" />
              ))}
            </div>
          ) : visible.length === 0 ? (
            <Card>
              <CardContent className="py-8">
                <EmptyState
                  icon={Car}
                  title={
                    filter === "upcoming"
                      ? "No upcoming rides"
                      : "No past bookings yet"
                  }
                  description={
                    filter === "upcoming"
                      ? "Find a ride and book your seat."
                      : "Your completed trips will appear here."
                  }
                  className="py-10"
                  action={
                    filter === "upcoming" ? (
                      <Button
                        onClick={() => navigate("trips-search")}
                        className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                      >
                        <Car className="size-4" />
                        Find a ride
                      </Button>
                    ) : undefined
                  }
                />
              </CardContent>
            </Card>
          ) : (
            visible.map((b) => {
              const meta = STATUS_META[b.status] ?? STATUS_META.PENDING;
              const Icon = meta.icon;
              const isCompleted = b.status === "COMPLETED";
              return (
                <Card key={b.id}>
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <button
                          onClick={() =>
                            navigate("trip-detail", { id: b.trip.id })
                          }
                          className="text-left"
                        >
                          <p className="font-semibold truncate hover:text-primary transition">
                            {b.trip.originLabel} → {b.trip.destinationLabel}
                          </p>
                        </button>
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Calendar className="size-3.5" />
                          {formatDate(b.trip.departureAt)} ·{" "}
                          {formatTime(b.trip.departureAt)}
                        </p>
                      </div>
                      <Badge
                        variant={meta.variant}
                        className={"gap-1 " + meta.className}
                      >
                        <Icon className="size-3" />
                        {meta.label}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between gap-3 pt-3 border-t border-border/40">
                      <div className="flex items-center gap-2 min-w-0">
                        <UserAvatar
                          name={b.trip.driver.name}
                          avatarUrl={b.trip.driver.avatarUrl}
                          className="size-8"
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {b.trip.driver.name ?? "Driver"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Driver
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs text-muted-foreground">
                          {b.seatsBooked} seat
                          {b.seatsBooked !== 1 ? "s" : ""}
                        </p>
                        <p className="font-semibold text-primary">
                          {formatNGN(b.fareTotal)}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2">
                      {b.status === "PENDING" && (
                        <Button
                          size="sm"
                          className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
                          onClick={() => setPayBooking(b)}
                        >
                          <CreditCard className="size-4" />
                          Pay {formatNGN(b.fareTotal)}
                        </Button>
                      )}
                      {b.status === "CONFIRMED" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5"
                          onClick={() =>
                            navigate("chat", { bookingId: b.id })
                          }
                        >
                          <MessageCircle className="size-4" />
                          Chat with driver
                        </Button>
                      )}
                      {isCompleted && (
                        <Button
                          size="sm"
                          variant="secondary"
                          className="gap-1.5"
                          onClick={() => setReviewBooking(b)}
                        >
                          <Star className="size-4" />
                          Leave a review
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          navigate("trip-detail", { id: b.trip.id })
                        }
                      >
                        View trip
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>
      </Tabs>

      <PaystackModal
        open={!!payBooking}
        amount={payBooking?.fareTotal ?? 0}
        customerEmail={undefined}
        onClose={() => setPayBooking(null)}
        onSuccess={handlePaySuccess}
      />

      {reviewBooking && (
        <ReviewModal
          open={!!reviewBooking}
          bookingId={reviewBooking.id}
          onClose={() => setReviewBooking(null)}
        />
      )}
    </main>
  );
}
