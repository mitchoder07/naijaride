"use client";

import { useEffect } from "react";
import { useNavigation, type ViewName } from "@/lib/store";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { LandingView } from "@/components/views/landing-view";
import { AuthView } from "@/components/views/auth-view";
import { DashboardView } from "@/components/views/dashboard-view";
import { TripsSearchView } from "@/components/views/trips-search-view";
import { TripDetailView } from "@/components/views/trip-detail-view";
import { CreateTripView } from "@/components/views/create-trip-view";
import { MyTripsView } from "@/components/views/my-trips-view";
import { BookingsView } from "@/components/views/bookings-view";
import { ChatView } from "@/components/views/chat-view";
import { WalletView } from "@/components/views/wallet-view";
import { ProfileView } from "@/components/views/profile-view";
import { AdminView } from "@/components/views/admin-view";
import { SafetyView } from "@/components/views/safety-view";
import { TrackView } from "@/components/views/track-view";

const AUTHED_VIEWS: ViewName[] = [
  "dashboard",
  "create-trip",
  "my-trips",
  "bookings",
  "chat",
  "wallet",
  "admin",
  "safety",
];

const DRIVER_VIEWS: ViewName[] = ["create-trip", "my-trips"];
const ADMIN_VIEWS: ViewName[] = ["admin"];

export function AppShell() {
  const { route, navigate } = useNavigation();
  const { isAuthenticated, isLoading, user } = useCurrentUser();

  // Guard authed views
  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated && AUTHED_VIEWS.includes(route.view)) {
      navigate("signin");
    }
    if (
      isAuthenticated &&
      user &&
      DRIVER_VIEWS.includes(route.view) &&
      user.role === "PASSENGER"
    ) {
      navigate("dashboard");
    }
    if (
      isAuthenticated &&
      user &&
      ADMIN_VIEWS.includes(route.view) &&
      user.role !== "ADMIN"
    ) {
      navigate("dashboard");
    }
  }, [route.view, isAuthenticated, isLoading, user, navigate]);

  // Hide footer for full-screen views
  const showFooter =
    route.view !== "chat" &&
    route.view !== "signin" &&
    route.view !== "signup";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <div className="flex-1 flex flex-col">{renderView()}</div>
      {showFooter && <Footer />}
    </div>
  );

  function renderView() {
    switch (route.view) {
      case "landing":
        return <LandingView />;
      case "signin":
        return <AuthView initialMode="signin" />;
      case "signup":
        return <AuthView initialMode="signup" />;
      case "dashboard":
        return <DashboardView />;
      case "trips-search":
        return <TripsSearchView />;
      case "trip-detail":
        return route.params.id ? (
          <TripDetailView tripId={route.params.id} />
        ) : (
          <TripsSearchView />
        );
      case "create-trip":
        return <CreateTripView />;
      case "my-trips":
        return <MyTripsView />;
      case "bookings":
        return <BookingsView />;
      case "chat":
        return route.params.bookingId ? (
          <ChatView bookingId={route.params.bookingId} />
        ) : (
          <BookingsView />
        );
      case "wallet":
        return <WalletView />;
      case "admin":
        return <AdminView />;
      case "safety":
        return <SafetyView />;
      case "track":
        return route.params.token ? <TrackView token={route.params.token} /> : <SafetyView />;
      case "profile":
      case "profile-public":
        return route.params.userId ? (
          <ProfileView userId={route.params.userId} />
        ) : user ? (
          <ProfileView userId={user.id} />
        ) : (
          <AuthView initialMode="signin" />
        );
      default:
        return <LandingView />;
    }
  }
}
