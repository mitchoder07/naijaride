"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  Car,
  Compass,
  MapPin,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  Wallet,
  Route as RouteIcon,
  Clock,
  Zap,
  Heart,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigation } from "@/lib/store";
import { useCurrentUser } from "@/hooks/use-current-user";
import { api, formatNGN, formatDateTime } from "@/lib/api";
import type { TripSummary } from "@/components/trip-card";
import { TripCard } from "@/components/trip-card";
import { RouteMap } from "@/components/route-map";
import { LogoEmblem } from "@/components/logo";

const FEATURED_ROUTES = [
  {
    from: "Lagos",
    to: "Abuja",
    lat1: 6.5244,
    lng1: 3.3792,
    lat2: 9.0765,
    lng2: 7.3986,
    price: 18000,
    duration: "8h 30m",
    riders: "1.4k",
  },
  {
    from: "Port Harcourt",
    to: "Enugu",
    lat1: 4.8156,
    lng1: 7.0498,
    lat2: 6.5244,
    lng2: 7.5085,
    price: 8500,
    duration: "3h 10m",
    riders: "620",
  },
  {
    from: "Kano",
    to: "Kaduna",
    lat1: 12.0022,
    lng1: 8.592,
    lat2: 10.5222,
    lng2: 7.4586,
    price: 6500,
    duration: "2h 40m",
    riders: "410",
  },
];

const STEPS = [
  {
    icon: Compass,
    title: "Find a ride",
    description:
      "Search by pickup and drop-off. We score trips by distance and time so the closest matches rise to the top — no endless scrolling.",
    step: "01",
  },
  {
    icon: Car,
    title: "Book your seat",
    description:
      "Pick your seat, pay with Paystack, and you're confirmed instantly. The platform keeps 10% — drivers keep 90%.",
    step: "02",
  },
  {
    icon: Users,
    title: "Travel together",
    description:
      "Chat with your driver in-app, share the road, and arrive together. Rate each other after the trip to build trust.",
    step: "03",
  },
];

const WHY = [
  {
    icon: Wallet,
    title: "Save up to 70%",
    description:
      "Split fuel and tolls with other passengers. Pay drivers directly through the platform — no middle-men taking a slice.",
    stat: "₦42M+",
    statLabel: "saved by riders",
  },
  {
    icon: ShieldCheck,
    title: "Verified drivers",
    description:
      "Drivers go through phone and plate verification. Every trip is recorded with reviews you can read before you book.",
    stat: "4.8★",
    statLabel: "avg rating",
  },
  {
    icon: Sparkles,
    title: "Smart matching",
    description:
      "Our matching engine ranks trips by pickup & drop-off distance and time proximity using Haversine — built for Nigeria.",
    stat: "<3s",
    statLabel: "match time",
  },
];

const TESTIMONIALS = [
  {
    quote:
      "I drive Lagos to Abuja every Friday. NaijaRide fills my empty seats and pays me before I even start the engine.",
    name: "Ade Thompson",
    role: "Driver · 142 trips",
    rating: 5,
    location: "Lekki → Wuse II",
  },
  {
    quote:
      "Used to spend ₦25k on a single bolt from Yaba to VI. Now I split with two passengers going my way for ₦8k total.",
    name: "Chioma Okeke",
    role: "Passenger · 38 rides",
    rating: 5,
    location: "Yaba → Victoria Island",
  },
  {
    quote:
      "The chat feature is everything. I knew exactly when my driver was leaving, where he was, and we arrived together.",
    name: "Ibrahim Musa",
    role: "Passenger · 21 rides",
    rating: 5,
    location: "Kano → Kaduna",
  },
];

export function LandingView() {
  const { navigate } = useNavigation();
  const { isAuthenticated } = useCurrentUser();

  const { data } = useQuery({
    queryKey: ["featured-trips"],
    queryFn: () => api.get<{ trips: TripSummary[] }>(`/api/trips`),
  });
  const trips = data?.trips ?? [];

  return (
    <main>
      {/* Hero — bold sunset */}
      <section className="relative bg-hero-sunset overflow-hidden">
        <div className="absolute inset-0 bg-grid-dots opacity-40 pointer-events-none" />
        <div className="container mx-auto px-4 py-14 md:py-24 relative">
          <div className="grid md:grid-cols-12 gap-10 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="md:col-span-7"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold border border-primary/20 mb-5">
                <span className="size-2 rounded-full bg-primary animate-glow-pulse" />
                Live across Nigeria · 3,200+ trips shared
              </div>
              <h1 className="text-5xl md:text-7xl font-display font-bold tracking-tight leading-[0.95]">
                Share the road.
                <br />
                <span className="text-primary relative">
                  Share the journey.
                  <svg
                    className="absolute -bottom-3 left-0 w-full"
                    viewBox="0 0 300 12"
                    fill="none"
                  >
                    <path
                      d="M2 9 C 50 2, 150 2, 298 9"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      className="text-primary/40"
                    />
                  </svg>
                </span>
              </h1>
              <p className="mt-8 text-lg text-muted-foreground max-w-xl text-pretty leading-relaxed">
                NaijaRide connects drivers and passengers travelling the same way.
                Save money, build community, and travel together — safely, on the road that raised us.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Button
                  size="lg"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 rounded-full font-semibold px-6 h-12 text-base shadow-lg shadow-primary/20"
                  onClick={() => navigate("trips-search")}
                >
                  <Compass className="size-4" />
                  Find a ride
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="gap-2 rounded-full font-semibold px-6 h-12 text-base border-2"
                  onClick={() => navigate(isAuthenticated ? "create-trip" : "signup")}
                >
                  <Car className="size-4" />
                  Offer a ride
                </Button>
              </div>
              <div className="mt-10 flex items-center gap-8 text-sm text-muted-foreground">
                <div>
                  <p className="text-3xl font-display font-bold text-foreground tabular-nums">
                    3.2k+
                  </p>
                  <p className="mt-1">Trips shared</p>
                </div>
                <div className="w-px h-12 bg-border" />
                <div>
                  <p className="text-3xl font-display font-bold text-foreground flex items-center gap-1 tabular-nums">
                    4.8 <Star className="size-5 fill-primary text-primary" />
                  </p>
                  <p className="mt-1">Avg rating</p>
                </div>
                <div className="w-px h-12 bg-border" />
                <div>
                  <p className="text-3xl font-display font-bold text-foreground tabular-nums">
                    ₦42M
                  </p>
                  <p className="mt-1">Saved by riders</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="md:col-span-5 relative"
            >
              {/* Logo emblem */}
              <div className="flex justify-center mb-6">
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                >
                  <LogoEmblem size={140} />
                </motion.div>
              </div>

              <Card className="overflow-hidden card-stamp border-2">
                <CardContent className="p-0">
                  <div className="bg-gradient-to-br from-primary/15 to-chart-2/20 p-4">
                    <RouteMap
                      origin={{ label: "Yaba, Lagos", lat: 6.5244, lng: 3.3792 }}
                      destination={{
                        label: "Wuse II, Abuja",
                        lat: 9.0765,
                        lng: 7.3986,
                      }}
                      waypoints={[
                        { label: "Ibadan", lat: 7.3776, lng: 3.947 },
                        { label: "Ilorin", lat: 8.4966, lng: 4.5421 },
                      ]}
                      className="h-48"
                    />
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="size-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-display font-bold text-sm">
                          AT
                        </div>
                        <div>
                          <p className="font-semibold text-sm">Ade Thompson</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Star className="size-3 fill-primary text-primary" />
                            4.9 · 142 trips · Verified
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="gap-1">
                        <ShieldCheck className="size-3" />
                        Top driver
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm pt-3 border-t-2 border-border/30">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <Clock className="size-3.5" />
                        Sat, 16 Aug · 7:00 AM
                      </span>
                      <span className="font-display font-bold text-primary text-xl">
                        {formatNGN(18000)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Floating stat chip — positioned to not overlap the card */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="absolute -top-5 -right-3 hidden md:flex bg-card border-2 border-border/40 rounded-full pl-2 pr-3 py-1.5 shadow-lg z-20"
              >
                <div className="flex items-center gap-2">
                  <div className="size-7 rounded-full bg-chart-2/20 text-chart-2 flex items-center justify-center">
                    <Zap className="size-3.5" />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground leading-none">Match found in</p>
                    <p className="text-xs font-bold leading-none mt-0.5">2.4s</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Featured Routes — bigger cards */}
      <section className="py-16 border-y-2 border-foreground/10 bg-card/40">
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between mb-8">
            <div>
              <div className="text-primary text-sm font-semibold mb-2 flex items-center gap-1.5">
                <RouteIcon className="size-4" />
                POPULAR ROUTES
              </div>
              <h2 className="text-3xl md:text-5xl font-display font-bold tracking-tight">
                Where Naija is heading
              </h2>
              <p className="text-muted-foreground mt-2 max-w-lg">
                The routes our riders travel most every week — Lagos to Abuja is the king.
              </p>
            </div>
            <Button
              variant="ghost"
              className="gap-1 hidden sm:flex rounded-full"
              onClick={() => navigate("trips-search")}
            >
              See all <ArrowRight className="size-4" />
            </Button>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {FEATURED_ROUTES.map((r, i) => (
              <motion.div
                key={r.from + r.to}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
              >
                <Card
                  className="overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer border-2 group"
                  onClick={() => navigate("trips-search")}
                >
                  <CardContent className="p-0">
                    <RouteMap
                      origin={{ label: r.from, lat: r.lat1, lng: r.lng1 }}
                      destination={{ label: r.to, lat: r.lat2, lng: r.lng2 }}
                      className="h-36"
                    />
                    <div className="p-5 space-y-3">
                      <div className="flex items-center gap-2 text-base">
                        <MapPin className="size-4 text-primary" />
                        <span className="font-display font-bold">
                          {r.from} → {r.to}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="size-3" />
                          {r.duration}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="size-3" />
                          {r.riders} riders
                        </span>
                      </div>
                      <div className="pt-3 border-t-2 border-border/30 flex items-end justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground">from</p>
                          <p className="text-2xl font-display font-bold text-primary">
                            {formatNGN(r.price)}
                          </p>
                        </div>
                        <ArrowRight className="size-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works — big numbered steps */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-dots opacity-25 pointer-events-none" />
        <div className="container mx-auto px-4 relative">
          <div className="text-center mb-14 max-w-2xl mx-auto">
            <div className="text-primary text-sm font-semibold mb-2">HOW IT WORKS</div>
            <h2 className="text-4xl md:text-5xl font-display font-bold tracking-tight">
              Three steps. One journey.
            </h2>
            <p className="text-muted-foreground mt-3 text-lg">
              From finding a ride to arriving together — NaijaRide keeps it simple.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3 relative">
            {STEPS.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="h-full border-2 hover:border-primary/40 transition-all group">
                  <CardContent className="p-7 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="size-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                        <step.icon className="size-6" />
                      </div>
                      <span className="text-5xl font-display font-bold text-muted/30 group-hover:text-primary/30 transition">
                        {step.step}
                      </span>
                    </div>
                    <h3 className="text-xl font-display font-bold">{step.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured trips */}
      {trips.length > 0 && (
        <section className="py-16 bg-card/40 border-y-2 border-foreground/10">
          <div className="container mx-auto px-4">
            <div className="flex items-end justify-between mb-8">
              <div>
                <div className="text-primary text-sm font-semibold mb-2 flex items-center gap-1.5">
                  <Zap className="size-4" />
                  LIVE NOW
                </div>
                <h2 className="text-3xl md:text-4xl font-display font-bold tracking-tight">
                  Available trips now
                </h2>
                <p className="text-muted-foreground mt-2">
                  Live trips from drivers heading out soon.
                </p>
              </div>
              <Button
                variant="ghost"
                className="gap-1 hidden sm:flex rounded-full"
                onClick={() => navigate("trips-search")}
              >
                Find more <ArrowRight className="size-4" />
              </Button>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {trips.slice(0, 6).map((t) => (
                <TripCard key={t.id} trip={t} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Why NaijaRide — with stats */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-hero-sunset opacity-50 pointer-events-none" />
        <div className="container mx-auto px-4 relative">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <div className="text-primary text-sm font-semibold mb-2">WHY NAJARIDE</div>
            <h2 className="text-4xl md:text-5xl font-display font-bold tracking-tight">
              Built for the Nigerian road.
            </h2>
            <p className="text-muted-foreground mt-3 text-lg">
              Save on transport, meet your neighbours, and travel with confidence.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {WHY.map((w, i) => (
              <motion.div
                key={w.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
              >
                <Card className="border-2 h-full hover:border-primary/40 transition-all">
                  <CardContent className="p-7 space-y-4">
                    <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                      <w.icon className="size-6" />
                    </div>
                    <h3 className="font-display font-bold text-xl">{w.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {w.description}
                    </p>
                    <div className="pt-4 border-t-2 border-border/30">
                      <p className="text-3xl font-display font-bold text-primary tabular-nums">
                        {w.stat}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">{w.statLabel}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-card/40 border-y-2 border-foreground/10">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 max-w-2xl mx-auto">
            <div className="text-primary text-sm font-semibold mb-2 flex items-center justify-center gap-1.5">
              <Heart className="size-4" />
              RIDER STORIES
            </div>
            <h2 className="text-3xl md:text-4xl font-display font-bold tracking-tight">
              What Nigerians are saying
            </h2>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
              >
                <Card className="border-2 h-full">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex gap-0.5">
                      {Array.from({ length: t.rating }).map((_, idx) => (
                        <Star key={idx} className="size-4 fill-primary text-primary" />
                      ))}
                    </div>
                    <p className="text-sm leading-relaxed font-medium">
                      &ldquo;{t.quote}&rdquo;
                    </p>
                    <div className="pt-4 border-t border-border/40 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold">{t.name}</p>
                        <p className="text-xs text-muted-foreground">{t.role}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-medium text-primary">{t.location}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA — bold stamp */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="rounded-[2.5rem] bg-foreground text-background p-10 md:p-16 relative overflow-hidden">
            <div className="absolute -top-20 -right-20 size-80 rounded-full bg-primary/30 blur-3xl" />
            <div className="absolute -bottom-24 -left-24 size-96 rounded-full bg-primary/20 blur-3xl" />
            <div className="relative grid md:grid-cols-2 gap-8 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/20 text-primary text-xs font-semibold mb-5">
                  <Sparkles className="size-3.5" />
                  Join the movement
                </div>
                <h2 className="text-4xl md:text-5xl font-display font-bold leading-tight text-balance">
                  Ready to share your next ride?
                </h2>
                <p className="mt-4 text-background/70 max-w-md text-lg">
                  Join thousands of drivers and passengers building the future of Nigerian transport — together.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row md:justify-end gap-3">
                <Button
                  size="lg"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 rounded-full font-semibold px-6 h-12 text-base shadow-xl shadow-primary/30"
                  onClick={() => navigate(isAuthenticated ? "create-trip" : "signup")}
                >
                  Offer a ride
                  <ArrowRight className="size-4" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="gap-2 rounded-full font-semibold px-6 h-12 text-base border-2 border-background/40 bg-transparent text-background hover:bg-background/10 hover:text-background"
                  onClick={() => navigate("trips-search")}
                >
                  Find a ride
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
