"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  ArrowDownLeft,
  ArrowUpRight,
  Car,
  Coins,
  RefreshCcw,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useNavigation } from "@/lib/store";
import { api, formatNGN, formatDateTime, timeAgo } from "@/lib/api";
import { EmptyState } from "@/components/empty-state";

interface WalletTxn {
  id: string;
  amount: number;
  signed: number;
  type: "EARNING" | "COMMISSION" | "REFUND";
  bookingId: string | null;
  createdAt: string;
  booking?: {
    id: string;
    trip: { originLabel: string; destinationLabel: string };
  } | null;
}

interface WalletData {
  balance: number;
  transactions: WalletTxn[];
}

const TYPE_META: Record<
  WalletTxn["type"],
  {
    label: string;
    icon: typeof TrendingUp;
    bg: string;
    color: string;
  }
> = {
  EARNING: {
    label: "Trip earning",
    icon: ArrowDownLeft,
    bg: "bg-green-100",
    color: "text-green-700",
  },
  COMMISSION: {
    label: "Platform commission",
    icon: Coins,
    bg: "bg-amber-100",
    color: "text-amber-700",
  },
  REFUND: {
    label: "Refund",
    icon: ArrowUpRight,
    bg: "bg-accent",
    color: "text-accent-foreground",
  },
};

export function WalletView() {
  const { navigate } = useNavigation();
  const { isAuthenticated, isLoading, user } = useCurrentUser();
  const { data, isLoading: walletLoading } = useQuery({
    queryKey: ["wallet"],
    enabled: isAuthenticated,
    queryFn: () => api.get<WalletData>(`/api/wallet`),
  });

  const isDriver = user?.role === "DRIVER" || user?.role === "BOTH";

  if (isLoading) {
    return (
      <main className="container mx-auto px-4 py-8">
        <Skeleton className="h-44 mb-6" />
        <Skeleton className="h-64" />
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <EmptyState
        icon={Wallet}
        title="Sign in to view your wallet"
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

  // Passengers don't have earnings — redirect them with a friendly message
  if (!isDriver) {
    return (
      <main className="container mx-auto px-4 py-8 md:py-12 max-w-lg">
        <header className="mb-6 text-center">
          <div className="size-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
            <Wallet className="size-7 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-display font-bold">Wallet is for drivers</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Drivers earn 90% of every fare here. Passengers pay through Paystack at booking time.
            To start earning, update your account role to DRIVER or BOTH.
          </p>
        </header>
        <Card className="border-2">
          <CardContent className="p-5 space-y-3">
            <p className="text-sm font-medium">Want to become a driver?</p>
            <p className="text-xs text-muted-foreground">
              You&apos;ll need to verify your NIN, driver&apos;s license, and vehicle plate before
              you can offer your first trip. Verification is free and takes ~24 hours.
            </p>
            <div className="flex gap-2">
              <Button
                className="flex-1 rounded-full gap-1.5"
                onClick={() => navigate("safety")}
              >
                Start verification
              </Button>
              <Button
                variant="outline"
                className="rounded-full"
                onClick={() => navigate("dashboard")}
              >
                Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  const balance = data?.balance ?? 0;
  const transactions = data?.transactions ?? [];
  const earnings = transactions
    .filter((t) => t.type === "EARNING")
    .reduce((s, t) => s + t.amount * t.signed, 0);
  const commissions = transactions
    .filter((t) => t.type === "COMMISSION")
    .reduce((s, t) => s + Math.abs(t.amount), 0);

  return (
    <main className="container mx-auto px-4 py-8 md:py-10">
      <header className="mb-6">
        <Badge variant="secondary" className="gap-1 mb-2">
          <Wallet className="size-3.5" />
          Wallet
        </Badge>
        <h1 className="text-3xl font-bold tracking-tight">Your wallet</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Earnings from your trips, less platform commission.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <Card className="bg-primary text-primary-foreground border-0 overflow-hidden relative">
            <CardContent className="p-6 relative z-10">
              <p className="text-xs uppercase tracking-wide opacity-80">
                Available balance
              </p>
              <p className="text-4xl font-bold mt-2">{formatNGN(balance)}</p>
              <p className="text-xs opacity-70 mt-1">
                Updated just now · Mock wallet
              </p>
              <div className="mt-6 flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => {}}
                >
                  <RefreshCcw className="size-4" />
                  Withdraw
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="gap-1.5 bg-primary-foreground/10 hover:bg-primary-foreground/15 text-primary-foreground"
                  onClick={() => navigate("dashboard")}
                >
                  Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-3 mt-4">
            <Card>
              <CardContent className="p-4 space-y-1">
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="size-4 text-green-600" />
                  <p className="text-xs text-muted-foreground">Earnings</p>
                </div>
                <p className="text-lg font-bold text-green-700">
                  {formatNGN(earnings)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 space-y-1">
                <div className="flex items-center gap-1.5">
                  <TrendingDown className="size-4 text-amber-600" />
                  <p className="text-xs text-muted-foreground">Commission</p>
                </div>
                <p className="text-lg font-bold text-amber-700">
                  {formatNGN(commissions)}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold">Transaction history</h2>
                <Badge variant="secondary">{transactions.length} entries</Badge>
              </div>
              {walletLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-16" />
                  ))}
                </div>
              ) : transactions.length === 0 ? (
                <EmptyState
                  icon={Car}
                  title="No transactions yet"
                  description="When passengers book and pay for your trips, your earnings will appear here."
                  action={
                    <Button
                      onClick={() => navigate("create-trip")}
                      className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      <Car className="size-4" />
                      Offer a ride
                    </Button>
                  }
                />
              ) : (
                <div className="space-y-1 max-h-[600px] overflow-y-auto scrollbar-warm -mx-2 px-2">
                  {transactions.map((t) => {
                    const meta = TYPE_META[t.type];
                    const Icon = meta.icon;
                    const credit = t.signed >= 0;
                    return (
                      <div
                        key={t.id}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/40 transition"
                      >
                        <div
                          className={`size-10 rounded-lg flex items-center justify-center shrink-0 ${meta.bg}`}
                        >
                          <Icon className={`size-5 ${meta.color}`} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm">
                            {meta.label}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {t.booking
                              ? `${t.booking.trip.originLabel} → ${t.booking.trip.destinationLabel}`
                              : "—"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {timeAgo(t.createdAt)}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p
                            className={`font-semibold ${credit ? "text-green-700" : "text-amber-700"}`}
                          >
                            {credit ? "+" : "−"}
                            {formatNGN(Math.abs(t.amount))}
                          </p>
                          <p className="text-[10px] text-muted-foreground uppercase">
                            {t.type}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
