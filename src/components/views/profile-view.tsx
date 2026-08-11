"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Star,
  Car,
  ShieldCheck,
  Calendar,
  MapPin,
  Mail,
  Phone,
  Wallet,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useNavigation } from "@/lib/store";
import { api, formatNGN, formatDate, formatDateTime } from "@/lib/api";
import { UserAvatar } from "@/components/user-avatar";
import { EmptyState } from "@/components/empty-state";

interface ReviewEntry {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  reviewer: {
    id: string;
    name: string | null;
    avatarUrl: string | null;
  };
  booking: {
    id: string;
    trip: { originLabel: string; destinationLabel: string };
  };
}

interface PublicProfileData {
  user: {
    id: string;
    name: string | null;
    avatarUrl: string | null;
    role: string;
    createdAt: string;
  };
  stats: {
    tripsCompleted: number;
    totalReviews: number;
    avgRating: number;
  };
  recentReviews: ReviewEntry[];
}

export function ProfileView({ userId }: { userId: string }) {
  const { navigate, back } = useNavigation();
  const { user: me, isAuthenticated, isLoading } = useCurrentUser();
  const isMe = me?.id === userId;

  const { data, isLoading: profileLoading } = useQuery({
    queryKey: ["profile-public", userId],
    enabled: !!userId,
    queryFn: () => api.get<PublicProfileData>(`/api/profile/${userId}`),
  });

  if (isLoading || profileLoading) {
    return (
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <Skeleton className="h-32 mb-6" />
        <Skeleton className="h-64" />
      </main>
    );
  }

  if (!isAuthenticated && !isMe) {
    return (
      <EmptyState
        icon={Car}
        title="Sign in to view profiles"
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

  const profile = data?.user;
  if (!profile) {
    return (
      <EmptyState
        icon={Car}
        title="User not found"
        action={
          <Button onClick={() => navigate("landing")}>Go home</Button>
        }
      />
    );
  }

  const stats = data?.stats ?? {
    tripsCompleted: 0,
    totalReviews: 0,
    avgRating: 0,
  };
  const reviews = data?.recentReviews ?? [];
  const isDriver = profile.role === "DRIVER" || profile.role === "BOTH";

  return (
    <main className="container mx-auto px-4 py-8 md:py-10 max-w-3xl">
      <button
        onClick={back}
        className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 mb-4"
      >
        ← Back
      </button>

      <Card>
        <CardContent className="p-6 space-y-6">
          <div className="flex items-start gap-4 flex-wrap">
            <UserAvatar
              name={profile.name}
              avatarUrl={profile.avatarUrl}
              className="size-20"
            />
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold">{profile.name ?? "User"}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="gap-1">
                  <ShieldCheck className="size-3" />
                  Verified
                </Badge>
                <Badge variant="outline">{profile.role}</Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1.5">
                <Calendar className="size-3.5" />
                Member since {formatDate(profile.createdAt)}
              </p>
            </div>
            {isMe && (
              <Button
                variant="outline"
                onClick={() => navigate("dashboard")}
                className="gap-1.5"
              >
                Edit profile
              </Button>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="text-center rounded-lg bg-accent/30 p-3">
              <p className="text-2xl font-bold">
                {stats.tripsCompleted}
              </p>
              <p className="text-xs text-muted-foreground">Trips</p>
            </div>
            <div className="text-center rounded-lg bg-accent/30 p-3">
              <p className="text-2xl font-bold">{stats.totalReviews}</p>
              <p className="text-xs text-muted-foreground">Reviews</p>
            </div>
            <div className="text-center rounded-lg bg-accent/30 p-3">
              <p className="text-2xl font-bold flex items-center justify-center gap-1">
                <Star className="size-4 fill-primary text-primary" />
                {stats.avgRating.toFixed(1)}
              </p>
              <p className="text-xs text-muted-foreground">Avg rating</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {isDriver && isMe && (
        <Card className="mt-6">
          <CardContent className="p-5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="size-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Wallet className="size-5" />
              </div>
              <div>
                <h3 className="font-semibold">Driver wallet</h3>
                <p className="text-sm text-muted-foreground">
                  Manage your trip earnings.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate("wallet")}
              className="gap-1"
            >
              Open <ArrowRight className="size-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      <h2 className="font-semibold mt-8 mb-3 flex items-center gap-2">
        <Star className="size-5 fill-primary text-primary" />
        Recent reviews
      </h2>
      {reviews.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <EmptyState
              icon={Star}
              title="No reviews yet"
              description={
                isDriver
                  ? "Reviews from passengers will appear here after each completed trip."
                  : "Reviews you've left for trips will appear here."
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <Card key={r.id}>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UserAvatar
                      name={r.reviewer.name}
                      avatarUrl={r.reviewer.avatarUrl}
                      className="size-7"
                    />
                    <div>
                      <p className="text-sm font-medium">
                        {r.reviewer.name ?? "Reviewer"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {r.booking.trip.originLabel} →{" "}
                        {r.booking.trip.destinationLabel}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
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
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDateTime(r.createdAt)}
                    </p>
                  </div>
                </div>
                {r.comment && (
                  <p className="text-sm text-muted-foreground italic">
                    “{r.comment}”
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
