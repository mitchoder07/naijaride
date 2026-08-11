"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Calendar,
  Clock,
  Users,
  Star,
  Car,
  ShieldCheck,
  MapPin,
  ArrowLeft,
  MessageCircle,
  CreditCard,
  User as UserIcon,
  CheckCircle2,
  Hourglass,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useNavigation } from "@/lib/store";
import { useCurrentUser } from "@/hooks/use-current-user";
import { api, formatNGN, formatDateTime, formatDate, formatTime } from "@/lib/api";
import { RouteMap } from "@/components/route-map";
import { UserAvatar } from "@/components/user-avatar";
import { EmptyState } from "@/components/empty-state";
import { PaystackModal } from "@/components/paystack/paystack-modal";
import { ReviewModal } from "@/components/review-modal";

interface TripDetail {
  id: string;
  driverId: string;
  originLabel: string;
  destinationLabel: string;
  originLat: number;
  originLng: number;
  destinationLat: number;
  destinationLng: number;
  waypointsJson: string;
  departureAt: string;
  seatsTotal: number;
  seatsAvailable: number;
  pricePerSeat: number;
  vehicleModel: string;
  vehicleColor: string;
  vehiclePlate: string;
  status: string;
  createdAt: string;
  driver: {
    id: string;
    name: string | null;
    avatarUrl: string | null;
    phone: string | null;
    createdAt: string;
  };
  bookings: {
    id: string;
    seatsBooked: number;
    status: string;
    passenger: {
      id: string;
      name: string | null;
      avatarUrl: string | null;
    };
  }[];
  reviews: {
    id: string;
    rating: number;
    comment: string | null;
    createdAt: string;
    reviewer: {
      id: string;
      name: string | null;
      avatarUrl: string | null;
    };
  }[];
}

interface ExistingBooking {
  id: string;
  status: string;
  tripId: string;
}

export function TripDetailView({ tripId }: { tripId: string }) {
  const { navigate, back } = useNavigation();
  const { user, isAuthenticated } = useCurrentUser();
  const qc = useQueryClient();
  const [seats, setSeats] = useState(1);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [payOpen, setPayOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["trip-detail", tripId],
    queryFn: () =>
      api.get<{
        trip: TripDetail;
        existingBooking: ExistingBooking | null;
        viewerId: string | null;
      }>(`/api/trips/${tripId}`),
    enabled: !!tripId,
  });

  const trip = data?.trip;
  const existingBooking = data?.existingBooking;
  const isOwner = trip?.driverId === user?.id;

  const createBooking = async () => {
    if (!isAuthenticated) {
      toast.info("Sign in to book this trip");
      navigate("signin");
      return;
    }
    try {
      const res = await api.post<{ booking: { id: string } }>(
        `/api/bookings`,
        { tripId, seatsBooked: seats },
      );
      setBookingId(res.booking.id);
      setPayOpen(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Booking failed");
    }
  };

  const handlePaySuccess = async () => {
    setPayOpen(false);
    toast.success("Payment confirmed! Your seat is reserved.");
    qc.invalidateQueries({ queryKey: ["trip-detail", tripId] });
    qc.invalidateQueries({ queryKey: ["dashboard"] });
    qc.invalidateQueries({ queryKey: ["bookings"] });
    qc.invalidateQueries({ queryKey: ["session"] });
    navigate("chat", { bookingId: bookingId ?? "" });
  };

  if (isLoading) {
    return (
      <main className="container mx-auto px-4 py-8">
        <Skeleton className="h-6 w-24 mb-4" />
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-80 lg:col-span-2" />
          <Skeleton className="h-80" />
        </div>
      </main>
    );
  }

  if (!trip) {
    return (
      <EmptyState
        icon={Car}
        title="Trip not found"
        description="This trip may have been cancelled or removed."
        action={
          <Button onClick={() => navigate("trips-search")}>
            Search for trips
          </Button>
        }
      />
    );
  }

  const waypoints = trip.waypointsJson
    ? (JSON.parse(trip.waypointsJson) as {
        label: string;
        lat: number;
        lng: number;
      }[])
    : [];
  const totalFare = trip.pricePerSeat * seats;
  const isFull = trip.seatsAvailable <= 0;
  const isPast = new Date(trip.departureAt).getTime() < Date.now();
  const isCompleted = trip.status === "COMPLETED";
  const totalRatings = trip.reviews.length;
  const avgRating =
    totalRatings > 0
      ? trip.reviews.reduce((s, r) => s + r.rating, 0) / totalRatings
      : 0;

  return (
    <main className="container mx-auto px-4 py-6 md:py-8">
      <button
        onClick={back}
        className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 mb-4 transition"
      >
        <ArrowLeft className="size-4" />
        Back
      </button>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Route map card */}
          <Card>
            <CardContent className="p-0">
              <RouteMap
                origin={{
                  label: trip.originLabel,
                  lat: trip.originLat,
                  lng: trip.originLng,
                }}
                destination={{
                  label: trip.destinationLabel,
                  lat: trip.destinationLat,
                  lng: trip.destinationLng,
                }}
                waypoints={waypoints}
                className="h-64 md:h-80 rounded-b-xl rounded-t-none border-0 border-b"
              />
              <div className="p-5">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold">
                      {trip.originLabel}
                      <span className="text-muted-foreground mx-2">→</span>
                      <span className="text-primary">
                        {trip.destinationLabel}
                      </span>
                    </h1>
                    <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="size-3.5" />
                        {formatDate(trip.departureAt)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="size-3.5" />
                        {formatTime(trip.departureAt)}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-primary">
                      {formatNGN(trip.pricePerSeat)}
                    </p>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">
                      per seat
                    </p>
                  </div>
                </div>

                {waypoints.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-border/40">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
                      Route waypoints
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {waypoints.map((w) => (
                        <Badge key={w.label} variant="secondary">
                          <MapPin className="size-3 mr-1" />
                          {w.label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Driver & vehicle */}
          <Card>
            <CardContent className="p-5 space-y-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Driver
                  </p>
                  <button
                    onClick={() =>
                      navigate("profile-public", { userId: trip.driverId })
                    }
                    className="flex items-center gap-3 mt-2 hover:opacity-80 transition"
                  >
                    <UserAvatar
                      name={trip.driver.name}
                      avatarUrl={trip.driver.avatarUrl}
                      className="size-12"
                    />
                    <div className="text-left">
                      <p className="font-semibold">
                        {trip.driver.name ?? "Driver"}
                      </p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        {totalRatings > 0 ? (
                          <>
                            <Star className="size-3 fill-primary text-primary" />
                            {avgRating.toFixed(1)} · {totalRatings} review
                            {totalRatings !== 1 ? "s" : ""}
                          </>
                        ) : (
                          <span>No reviews yet</span>
                        )}
                      </p>
                    </div>
                  </button>
                </div>
                <Badge variant="secondary" className="gap-1">
                  <ShieldCheck className="size-3" />
                  Verified
                </Badge>
              </div>

              <Separator />

              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
                  Vehicle
                </p>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div className="rounded-lg bg-accent/40 p-3">
                    <Car className="size-4 text-primary mb-1" />
                    <p className="text-xs text-muted-foreground">Model</p>
                    <p className="font-medium truncate">{trip.vehicleModel}</p>
                  </div>
                  <div className="rounded-lg bg-accent/40 p-3">
                    <div className="size-4 rounded-full border-2 border-border mb-1" />
                    <p className="text-xs text-muted-foreground">Colour</p>
                    <p className="font-medium">{trip.vehicleColor}</p>
                  </div>
                  <div className="rounded-lg bg-accent/40 p-3">
                    <div className="size-4 mb-1 flex items-center justify-center text-[10px] font-mono text-muted-foreground">
                      ABC
                    </div>
                    <p className="text-xs text-muted-foreground">Plate</p>
                    <p className="font-medium font-mono text-xs">
                      {trip.vehiclePlate}
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
                  Passengers ({trip.bookings.length}/{trip.seatsTotal})
                </p>
                <div className="flex flex-wrap gap-2">
                  {trip.bookings.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      No passengers yet.
                    </p>
                  )}
                  {trip.bookings.map((b) => (
                    <div
                      key={b.id}
                      className="flex items-center gap-1.5 rounded-full bg-accent/40 py-1 pl-1 pr-3"
                    >
                      <UserAvatar
                        name={b.passenger.name}
                        avatarUrl={b.passenger.avatarUrl}
                        className="size-6"
                      />
                      <span className="text-xs font-medium">
                        {b.passenger.name ?? "Passenger"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ×{b.seatsBooked}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reviews */}
          {trip.reviews.length > 0 && (
            <Card>
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Star className="size-4 fill-primary text-primary" />
                    Reviews ({trip.reviews.length})
                  </h3>
                  <p className="text-sm font-semibold">
                    {avgRating.toFixed(1)} ★
                  </p>
                </div>
                <div className="space-y-3">
                  {trip.reviews.slice(0, 4).map((r) => (
                    <div
                      key={r.id}
                      className="rounded-lg bg-accent/20 p-3 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <UserAvatar
                            name={r.reviewer.name}
                            avatarUrl={r.reviewer.avatarUrl}
                            className="size-6"
                          />
                          <span className="text-sm font-medium">
                            {r.reviewer.name ?? "Reviewer"}
                          </span>
                        </div>
                        <div className="flex">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={
                                i < r.rating
                                  ? "size-3 fill-primary text-primary"
                                  : "size-3 text-muted"
                              }
                            />
                          ))}
                        </div>
                      </div>
                      {r.comment && (
                        <p className="text-sm text-muted-foreground">
                          “{r.comment}”
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Booking sidebar */}
        <div className="lg:sticky lg:top-20 lg:self-start">
          <Card>
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Book your seat</h3>
                {isFull ? (
                  <Badge variant="destructive">Full</Badge>
                ) : isPast || isCompleted ? (
                  <Badge variant="secondary">Closed</Badge>
                ) : (
                  <Badge
                    variant="default"
                    className="bg-primary text-primary-foreground"
                  >
                    Open
                  </Badge>
                )}
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Users className="size-4" />
                  Seats available
                </span>
                <span className="font-semibold">
                  {trip.seatsAvailable}/{trip.seatsTotal}
                </span>
              </div>

              {!isOwner && !existingBooking && !isFull && !isPast && (
                <>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                      How many seats?
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setSeats((s) => Math.max(1, s - 1))}
                        disabled={seats <= 1}
                        className="size-9"
                        aria-label="Decrease seats"
                      >
                        −
                      </Button>
                      <span className="font-semibold text-lg w-8 text-center">
                        {seats}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() =>
                          setSeats((s) =>
                            Math.min(trip.seatsAvailable, s + 1),
                          )
                        }
                        disabled={seats >= trip.seatsAvailable}
                        className="size-9"
                        aria-label="Increase seats"
                      >
                        +
                      </Button>
                      <span className="text-xs text-muted-foreground ml-2">
                        max {trip.seatsAvailable}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-border/40">
                    <span className="text-sm text-muted-foreground">
                      Total fare
                    </span>
                    <span className="text-2xl font-bold text-primary">
                      {formatNGN(totalFare)}
                    </span>
                  </div>
                  <Button
                    onClick={createBooking}
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
                  >
                    <CreditCard className="size-4" />
                    Book &amp; Pay
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    Pay securely with Paystack (mock).
                  </p>
                </>
              )}

              {isOwner && (
                <div className="rounded-lg bg-primary/5 border border-primary/20 p-4 space-y-2">
                  <p className="text-sm font-medium text-primary">
                    This is your trip
                  </p>
                  <p className="text-xs text-muted-foreground">
                    You can view passenger bookings below.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => navigate("my-trips")}
                  >
                    Manage this trip
                  </Button>
                </div>
              )}

              {existingBooking && (
                <div className="rounded-lg bg-accent/40 p-4 space-y-3">
                  <p className="text-sm font-medium flex items-center gap-1.5">
                    {existingBooking.status === "CONFIRMED" ? (
                      <>
                        <CheckCircle2 className="size-4 text-primary" />
                        Your seat is reserved
                      </>
                    ) : (
                      <>
                        <Hourglass className="size-4 text-chart-4" />
                        Payment pending
                      </>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Status: {existingBooking.status}
                  </p>
                  <div className="flex gap-2">
                    {existingBooking.status === "PENDING" ? (
                      <Button
                        size="sm"
                        className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                        onClick={() => {
                          setBookingId(existingBooking.id);
                          setPayOpen(true);
                        }}
                      >
                        Pay now
                      </Button>
                    ) : null}
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() =>
                        navigate("chat", { bookingId: existingBooking.id })
                      }
                    >
                      <MessageCircle className="size-4 mr-1" />
                      Chat
                    </Button>
                  </div>
                </div>
              )}

              {isCompleted && existingBooking && (
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => setReviewOpen(true)}
                >
                  <Star className="size-4 mr-1" />
                  Leave a review
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <PaystackModal
        open={payOpen}
        amount={totalFare}
        customerEmail={user?.email}
        bookingId={bookingId}
        onClose={() => setPayOpen(false)}
        onSuccess={handlePaySuccess}
      />

      {existingBooking && (
        <ReviewModal
          open={reviewOpen}
          onClose={() => setReviewOpen(false)}
          bookingId={existingBooking.id}
        />
      )}
    </main>
  );
}
