"use client";

import { useQuery } from "@tanstack/react-query";
import {
  CalendarClock,
  Car,
  Wallet,
  TrendingUp,
  ArrowRight,
  Receipt,
  Star,
  ShieldCheck,
  ShieldAlert,
  Phone,
  Share2,
  Lock,
  Sparkles,
  Users,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigation } from "@/lib/store";
import { useCurrentUser } from "@/hooks/use-current-user";
import { api, formatNGN, formatDate, formatTime, timeAgo } from "@/lib/api";
import { EmptyState } from "@/components/empty-state";
import { TrustBadge } from "@/components/safety/trust-badge";

interface DashboardData {
  stats: {
    totalTrips: number;
    upcomingTrips: number;
    upcomingBookings: number;
    totalBookings: number;
    walletBalance: number;
    transactions: number;
    earnings: number;
  };
  upcomingTrips: {
    id: string;
    originLabel: string;
    destinationLabel: string;
    departureAt: string;
    seatsAvailable: number;
    seatsTotal: number;
    status: string;
  }[];
  upcomingBookings: {
    id: string;
    seatsBooked: number;
    status: string;
    trip: {
      id: string;
      originLabel: string;
      destinationLabel: string;
      departureAt: string;
      status: string;
    };
  }[];
  recentActivity: {
    type: "trip" | "booking";
    id: string;
    title: string;
    subtitle: string;
    date: string;
  }[];
}

export function DashboardView() {
  const { navigate } = useNavigation();
  const { user, isAuthenticated, isLoading } = useCurrentUser();
  const { data, isLoading: dashLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => api.get<DashboardData>(`/api/dashboard`),
    enabled: isAuthenticated,
  });

  if (isLoading || (!isAuthenticated && !isLoading)) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Skeleton className="h-12 w-72 mb-6" />
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <EmptyState
        icon={Car}
        title="Sign in to view your dashboard"
        description="Track your trips, bookings, and wallet in one place."
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

  const stats = data?.stats;
  const isDriver = user?.role === "DRIVER" || user?.role === "BOTH";

  // Role-aware stat cards
  const passengerStats = [
    { icon: CalendarClock, key: "upcomingBookings" as const, label: "Upcoming rides" },
    { icon: Receipt, key: "totalBookings" as const, label: "Total rides" },
    { icon: Star, key: "walletBalance" as const, label: "Wallet balance", isMoney: true },
    { icon: ShieldCheck, key: "_trust" as const, label: "Trust score", isTrust: true },
  ];
  const driverStats = [
    { icon: Car, key: "upcomingTrips" as const, label: "Upcoming trips" },
    { icon: CalendarClock, key: "upcomingBookings" as const, label: "Booked seats" },
    { icon: Wallet, key: "walletBalance" as const, label: "Wallet", isMoney: true },
    { icon: TrendingUp, key: "earnings" as const, label: "Earnings", isMoney: true },
  ];
  const statCards = isDriver ? driverStats : passengerStats;

  return (
    <main className="container mx-auto px-4 py-8 md:py-12">
      <header className="mb-6 flex items-start justify-between flex-wrap gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Welcome back,</p>
          <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tight flex items-center gap-3">
            {user?.name?.split(" ")[0] ?? "Rider"}
            {user?.isVerified && (
              <TrustBadge verified score={user?.trustScore ?? 0} size="sm" />
            )}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Here&apos;s what&apos;s happening with your trips today.
          </p>
        </div>
        {/* Safety quick-access */}
        <Button
          onClick={() => navigate("safety")}
          variant="outline"
          className="gap-2 rounded-full border-2"
        >
          <ShieldCheck className="size-4 text-primary" />
          Safety Center
        </Button>
      </header>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {statCards.map((stat) => {
          const value = stat.isTrust
            ? user?.trustScore ?? 0
            : (stats?.[stat.key as keyof DashboardData["stats"]] as number | undefined);
          return (
            <Card key={stat.label} className="border-2 hover:shadow-md transition-shadow">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">
                    {stat.label}
                  </p>
                  <div className="size-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <stat.icon className="size-4" />
                  </div>
                </div>
                <p className="text-3xl font-display font-bold tabular-nums">
                  {stat.isMoney
                    ? formatNGN(value ?? 0)
                    : stat.isTrust
                      ? `${value}/100`
                      : (value ?? 0)}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Upcoming trips as driver */}
        {isDriver && (
          <section className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-display font-bold">Your upcoming trips</h2>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1"
                onClick={() => navigate("my-trips")}
              >
                See all <ArrowRight className="size-4" />
              </Button>
            </div>
            {dashLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-20" />
                ))}
              </div>
            ) : (data?.upcomingTrips ?? []).length === 0 ? (
              <Card className="border-2">
                <CardContent className="py-6">
                  <EmptyState
                    icon={Car}
                    title="No upcoming trips"
                    description="Post a ride and let passengers book you."
                    action={
                      <Button
                        onClick={() => navigate("create-trip")}
                        className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full"
                      >
                        Offer a ride
                      </Button>
                    }
                  />
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {(data?.upcomingTrips ?? []).map((t) => (
                  <Card
                    key={t.id}
                    className="border-2 hover:shadow-sm hover:border-primary/30 transition cursor-pointer"
                    onClick={() => navigate("trip-detail", { id: t.id })}
                  >
                    <CardContent className="p-4 flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold truncate">
                          {t.originLabel} → {t.destinationLabel}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(t.departureAt)} · {formatTime(t.departureAt)}
                        </p>
                      </div>
                      <Badge variant="secondary">
                        {t.seatsAvailable}/{t.seatsTotal} seats
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Upcoming bookings (passenger view = main column when not driver) */}
        <section className={`space-y-4 ${isDriver ? "" : "lg:col-span-2"}`}>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-display font-bold">
              {isDriver ? "Upcoming rides" : "Your upcoming rides"}
            </h2>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1"
              onClick={() => navigate("bookings")}
            >
              See all <ArrowRight className="size-4" />
            </Button>
          </div>
          {dashLoading ? (
            <Skeleton className="h-32" />
          ) : (data?.upcomingBookings ?? []).length === 0 ? (
            <Card className="border-2">
              <CardContent className="py-6">
                <EmptyState
                  icon={CalendarClock}
                  title="No upcoming rides"
                  description="Find a verified driver and book your seat safely."
                  className="py-8"
                  action={
                    <Button
                      size="sm"
                      onClick={() => navigate("trips-search")}
                      className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full"
                    >
                      Find a ride
                    </Button>
                  }
                />
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {(data?.upcomingBookings ?? []).map((b) => (
                <Card
                  key={b.id}
                  className="border-2 hover:shadow-sm hover:border-primary/30 transition cursor-pointer"
                  onClick={() => navigate("chat", { bookingId: b.id })}
                >
                  <CardContent className="p-4 space-y-1">
                    <p className="font-semibold truncate text-sm">
                      {b.trip.originLabel} → {b.trip.destinationLabel}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(b.trip.departureAt)} · {formatTime(b.trip.departureAt)}
                    </p>
                    <Badge
                      variant={b.status === "CONFIRMED" ? "default" : "secondary"}
                      className={b.status === "CONFIRMED" ? "bg-primary text-primary-foreground" : ""}
                    >
                      {b.status}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Recent activity */}
      <section className="mt-10">
        <h2 className="text-lg font-display font-bold mb-4 flex items-center gap-2">
          <Receipt className="size-5" />
          Recent activity
        </h2>
        {(data?.recentActivity ?? []).length === 0 ? (
          <Card className="border-2">
            <CardContent className="py-8">
              <EmptyState
                icon={Receipt}
                title="No activity yet"
                description="Your trips, bookings, and reviews will show up here."
              />
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {(data?.recentActivity ?? []).map((a) => (
              <div
                key={`${a.type}-${a.id}`}
                className="flex items-center justify-between py-2.5 border-b border-border/40 last:border-0"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`size-9 rounded-lg flex items-center justify-center ${
                      a.type === "trip" ? "bg-primary/10 text-primary" : "bg-accent text-accent-foreground"
                    }`}
                  >
                    {a.type === "trip" ? <Car className="size-4" /> : <CalendarClock className="size-4" />}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{a.title}</p>
                    <p className="text-xs text-muted-foreground">{a.subtitle}</p>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">{timeAgo(a.date)}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Safety + Verification CTA */}
      <section className="mt-10 grid gap-4 md:grid-cols-2">
        <Card className="border-2 border-primary/30 bg-primary/5">
          <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="size-12 rounded-2xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
              <ShieldCheck className="size-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-display font-bold text-lg">
                {user?.isVerified ? "You're verified" : "Verify your identity"}
              </h3>
              <p className="text-muted-foreground text-sm mt-0.5">
                {user?.isVerified
                  ? "Your NIN, license, and selfie are confirmed. Other riders can trust you."
                  : "Add your NIN, driver's license, and a selfie. Verified riders get more bookings."}
              </p>
            </div>
            <Button
              variant={user?.isVerified ? "outline" : "default"}
              size="sm"
              className="shrink-0 rounded-full"
              onClick={() => navigate("safety")}
            >
              {user?.isVerified ? "Manage" : "Verify now"}
            </Button>
          </CardContent>
        </Card>

        {isDriver ? (
          <Card className="border-2">
            <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="size-12 rounded-2xl bg-chart-4/15 text-chart-4 flex items-center justify-center shrink-0">
                <Wallet className="size-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-display font-bold text-lg">Withdraw earnings</h3>
                <p className="text-muted-foreground text-sm mt-0.5">
                  Send your wallet balance to your bank.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 rounded-full"
                onClick={() => navigate("wallet")}
              >
                Open wallet
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-2">
            <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="size-12 rounded-2xl bg-chart-2/15 text-chart-2 flex items-center justify-center shrink-0">
                <Share2 className="size-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-display font-bold text-lg">Share your trip live</h3>
                <p className="text-muted-foreground text-sm mt-0.5">
                  Let loved ones track your ride in real time. Always on, always safe.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 rounded-full"
                onClick={() => navigate("safety")}
              >
                Learn more
              </Button>
            </CardContent>
          </Card>
        )}
      </section>
    </main>
  );
}
