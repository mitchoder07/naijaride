"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  Users,
  Car,
  Calendar,
  TrendingUp,
  Wallet,
  Star,
  Activity,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api, formatNGN } from "@/lib/api";
import { useNavigation } from "@/lib/store";

interface AdminOverview {
  counts: {
    users: number;
    drivers: number;
    passengers: number;
    trips: number;
    bookings: number;
    confirmedBookings: number;
  };
  gmv: number;
  commission: number;
  gmvByDay: { date: string; gmv: number; commission: number }[];
  topRoutes: { route: string; trips: number }[];
}

interface AdminTrip {
  id: string;
  originLabel: string;
  destinationLabel: string;
  departureAt: string;
  seatsTotal: number;
  seatsAvailable: number;
  pricePerSeat: number;
  status: string;
  isRecurring: boolean;
  driver: { id: string; name: string | null; email: string };
  _count: { bookings: number };
}

interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  role: string;
  isDemo: boolean;
  walletBalance: number;
  createdAt: string;
  _count: {
    tripsAsDriver: number;
    bookings: number;
    reviewsGiven: number;
    reviewsReceived: number;
  };
}

interface AdminBooking {
  id: string;
  seatsBooked: number;
  fareTotal: number;
  commission: number;
  status: string;
  paystackRef: string | null;
  createdAt: string;
  trip: { id: string; originLabel: string; destinationLabel: string; departureAt: string };
  passenger: { id: string; name: string | null; email: string; avatarUrl: string | null };
}

const STATUS_COLORS: Record<string, string> = {
  OPEN: "bg-chart-2/15 text-chart-2 border-chart-2/30",
  FULL: "bg-primary/15 text-primary border-primary/30",
  COMPLETED: "bg-chart-3/15 text-chart-3 border-chart-3/30",
  CANCELLED: "bg-destructive/15 text-destructive border-destructive/30",
  PENDING: "bg-muted text-muted-foreground border-border",
  CONFIRMED: "bg-chart-2/15 text-chart-2 border-chart-2/30",
};

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent = "primary",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  sub?: string;
  accent?: "primary" | "chart-2" | "chart-3" | "foreground";
}) {
  const color = {
    primary: "bg-primary/10 text-primary",
    "chart-2": "bg-chart-2/10 text-chart-2",
    "chart-3": "bg-chart-3/10 text-chart-3",
    foreground: "bg-foreground/10 text-foreground",
  }[accent];

  return (
    <Card className="border-2">
      <CardContent className="p-5 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground uppercase tracking-wide font-medium">{label}</span>
          <div className={`size-9 rounded-xl ${color} flex items-center justify-center`}>
            <Icon className="size-4" />
          </div>
        </div>
        <p className="text-3xl font-display font-bold tabular-nums">{value}</p>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      </CardContent>
    </Card>
  );
}

export function AdminView() {
  const { navigate } = useNavigation();

  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: () => api.get<AdminOverview>(`/api/admin/overview`),
  });
  const { data: tripsData } = useQuery({
    queryKey: ["admin-trips"],
    queryFn: () => api.get<{ trips: AdminTrip[] }>(`/api/admin/trips?limit=10`),
  });
  const { data: usersData } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => api.get<{ users: AdminUser[] }>(`/api/admin/users?limit=10`),
  });
  const { data: bookingsData } = useQuery({
    queryKey: ["admin-bookings"],
    queryFn: () => api.get<{ bookings: AdminBooking[] }>(`/api/admin/bookings?limit=10`),
  });

  const maxGmv = Math.max(1, ...(overview?.gmvByDay.map((d) => d.gmv) ?? [1]));

  return (
    <main className="container mx-auto px-4 py-8 md:py-10">
      <header className="mb-8 flex items-start justify-between flex-wrap gap-4">
        <div>
          <Badge variant="secondary" className="mb-3 gap-1.5">
            <ShieldCheck className="size-3.5" />
            ADMIN DASHBOARD
          </Badge>
          <h1 className="text-3xl md:text-5xl font-display font-bold tracking-tight">
            Platform overview
          </h1>
          <p className="text-muted-foreground mt-2 max-w-xl">
            Track GMV, commission, and platform activity across NaijaRide.
          </p>
        </div>
        <Button
          onClick={() => navigate("dashboard")}
          variant="outline"
          className="gap-1.5 rounded-full"
        >
          Back to user dashboard
          <ChevronRight className="size-4" />
        </Button>
      </header>

      {overviewLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : overview ? (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard icon={Users} label="Users" value={overview.counts.users} sub={`${overview.counts.drivers} drivers · ${overview.counts.passengers} passengers`} accent="primary" />
            <StatCard icon={Car} label="Trips" value={overview.counts.trips} sub={`${overview.counts.confirmedBookings} confirmed bookings`} accent="chart-2" />
            <StatCard icon={TrendingUp} label="GMV" value={formatNGN(overview.gmv)} sub="Gross merchandise value" accent="chart-3" />
            <StatCard icon={Wallet} label="Commission" value={formatNGN(overview.commission)} sub="Platform earnings (10%)" accent="foreground" />
          </div>

          {/* GMV chart */}
          <div className="grid gap-6 lg:grid-cols-3 mb-8">
            <Card className="border-2 lg:col-span-2">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-display font-bold text-lg">GMV & commission</h3>
                    <p className="text-xs text-muted-foreground">Last 14 days</p>
                  </div>
                  <div className="flex gap-3 text-xs">
                    <span className="flex items-center gap-1.5">
                      <span className="size-3 rounded bg-primary" />
                      GMV
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="size-3 rounded bg-chart-2" />
                      Commission
                    </span>
                  </div>
                </div>
                <div className="flex items-end gap-2 h-44">
                  {overview.gmvByDay.map((d) => (
                    <div key={d.date} className="flex-1 flex flex-col gap-1 items-center group">
                      <div className="w-full flex flex-col justify-end h-full gap-1">
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${(d.gmv / maxGmv) * 100}%` }}
                          transition={{ duration: 0.5 }}
                          className="w-full bg-primary rounded-t-md group-hover:bg-primary/80 transition relative"
                        >
                          <div className="absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition bg-foreground text-background text-xs px-2 py-1 rounded whitespace-nowrap">
                            {formatNGN(d.gmv)}
                          </div>
                        </motion.div>
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${(d.commission / maxGmv) * 100}%` }}
                          transition={{ duration: 0.5, delay: 0.1 }}
                          className="w-full bg-chart-2 rounded-b-md group-hover:bg-chart-2/80 transition"
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground tabular-nums">
                        {d.date.slice(5)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top routes */}
            <Card className="border-2">
              <CardContent className="p-6">
                <h3 className="font-display font-bold text-lg mb-4 flex items-center gap-2">
                  <Activity className="size-4 text-primary" />
                  Top routes
                </h3>
                <div className="space-y-3">
                  {overview.topRoutes.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No trips yet.</p>
                  ) : (
                    overview.topRoutes.map((r, i) => (
                      <div key={r.route} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="size-6 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-xs font-bold">
                            {i + 1}
                          </span>
                          <span className="text-sm font-medium">{r.route}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{r.trips} trips</span>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent trips */}
          <div className="grid gap-6 lg:grid-cols-2 mb-8">
            <Card className="border-2">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display font-bold text-lg flex items-center gap-2">
                    <Car className="size-4 text-primary" />
                    Recent trips
                  </h3>
                  <Calendar className="size-4 text-muted-foreground" />
                </div>
                <div className="space-y-2 max-h-80 overflow-y-auto scrollbar-warm pr-2">
                  {tripsData?.trips.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No trips yet.</p>
                  ) : (
                    tripsData?.trips.map((t) => (
                      <div key={t.id} className="flex items-center justify-between p-3 rounded-xl border border-border/60 hover:border-primary/40 transition">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {t.originLabel} → {t.destinationLabel}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {t.driver.name ?? t.driver.email} ·{" "}
                            {new Date(t.departureAt).toLocaleString("en-NG", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {t.isRecurring && <Badge variant="secondary" className="text-xs">Recurring</Badge>}
                          <span className={`chip border ${STATUS_COLORS[t.status] ?? STATUS_COLORS.OPEN}`}>
                            {t.status}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recent bookings */}
            <Card className="border-2">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display font-bold text-lg flex items-center gap-2">
                    <Calendar className="size-4 text-primary" />
                    Recent bookings
                  </h3>
                  <TrendingUp className="size-4 text-muted-foreground" />
                </div>
                <div className="space-y-2 max-h-80 overflow-y-auto scrollbar-warm pr-2">
                  {bookingsData?.bookings.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No bookings yet.</p>
                  ) : (
                    bookingsData?.bookings.map((b) => (
                      <div key={b.id} className="flex items-center justify-between p-3 rounded-xl border border-border/60 hover:border-primary/40 transition">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {b.trip.originLabel} → {b.trip.destinationLabel}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {b.passenger.name ?? b.passenger.email} · {b.seatsBooked} seat(s)
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-bold text-primary text-sm">{formatNGN(b.fareTotal)}</span>
                          <span className={`chip border ${STATUS_COLORS[b.status] ?? STATUS_COLORS.PENDING}`}>
                            {b.status}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Users */}
          <Card className="border-2">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-bold text-lg flex items-center gap-2">
                  <Users className="size-4 text-primary" />
                  Newest users
                </h3>
                <Star className="size-4 text-muted-foreground" />
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto scrollbar-warm pr-2">
                {usersData?.users.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No users yet.</p>
                ) : (
                  usersData?.users.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => navigate("profile", { userId: u.id })}
                      className="w-full flex items-center justify-between p-3 rounded-xl border border-border/60 hover:border-primary/40 transition text-left"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="size-9 rounded-full bg-primary/15 text-primary flex items-center justify-center text-sm font-semibold shrink-0">
                          {u.name?.[0]?.toUpperCase() ?? u.email[0]?.toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{u.name ?? u.email}</p>
                          <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {u.isDemo && <Badge variant="secondary" className="text-xs">Demo</Badge>}
                        <span className={`chip border ${STATUS_COLORS.OPEN}`}>
                          {u.role}
                        </span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <p className="text-muted-foreground">Failed to load admin overview.</p>
      )}
    </main>
  );
}
