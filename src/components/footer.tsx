"use client";

import { Compass, Shield, Heart, Github, MapPin, ArrowRight } from "lucide-react";
import { useNavigation, type ViewName } from "@/lib/store";
import { Logo } from "@/components/logo";

export function Footer() {
  const { navigate } = useNavigation();

  const groups: { title: string; items: { label: string; view?: ViewName }[] }[] = [
    {
      title: "Explore",
      items: [
        { label: "Find a ride", view: "trips-search" },
        { label: "Offer a ride", view: "create-trip" },
      ],
    },
    {
      title: "Account",
      items: [
        { label: "Dashboard", view: "dashboard" },
        { label: "Wallet", view: "wallet" },
        { label: "My bookings", view: "bookings" },
      ],
    },
    {
      title: "Company",
      items: [{ label: "About" }, { label: "Trust & Safety" }],
    },
  ];

  return (
    <footer className="mt-auto border-t-2 border-foreground/15 bg-card/40 relative overflow-hidden">
      {/* Subtle sunset glow at top */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 size-64 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

      <div className="container mx-auto px-4 py-12 relative">
        <div className="grid gap-10 md:grid-cols-5">
          <div className="md:col-span-2 space-y-4">
            <Logo size={40} onClick={() => navigate("landing")} />
            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
              Share rides across Nigeria. Save money, meet your neighbours,
              and travel together — safely, on the road that brought us all up.
            </p>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="chip bg-muted text-muted-foreground">
                <MapPin className="size-3" />
                Lagos · Abuja · PH · Kano
              </span>
              <span className="chip bg-muted text-muted-foreground">
                <Shield className="size-3" />
                Verified drivers
              </span>
            </div>
            <div className="flex gap-3 text-muted-foreground pt-2">
              <button className="size-8 rounded-full bg-muted hover:bg-primary hover:text-primary-foreground transition flex items-center justify-center" aria-label="Trust & Safety">
                <Shield className="size-4" />
              </button>
              <button className="size-8 rounded-full bg-muted hover:bg-primary hover:text-primary-foreground transition flex items-center justify-center" aria-label="Explore">
                <Compass className="size-4" />
              </button>
              <button className="size-8 rounded-full bg-muted hover:bg-primary hover:text-primary-foreground transition flex items-center justify-center" aria-label="Community">
                <Heart className="size-4" />
              </button>
              <button className="size-8 rounded-full bg-muted hover:bg-primary hover:text-primary-foreground transition flex items-center justify-center" aria-label="GitHub">
                <Github className="size-4" />
              </button>
            </div>
          </div>

          {groups.map((g) => (
            <div key={g.title} className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground tracking-wide uppercase">
                {g.title}
              </h4>
              <ul className="space-y-2 text-sm">
                {g.items.map((it) => (
                  <li key={it.label}>
                    <button
                      onClick={() => it.view && navigate(it.view)}
                      className="text-muted-foreground hover:text-primary transition flex items-center gap-1 group"
                    >
                      {it.label}
                      {it.view && (
                        <ArrowRight className="size-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition" />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 pt-6 border-t border-border/40 flex flex-col md:flex-row justify-between gap-3 text-xs text-muted-foreground">
          <p>
            © {new Date().getFullYear()} NaijaRide. Built for Nigerian roads.
          </p>
          <div className="flex items-center gap-3">
            <span className="chip bg-muted/60 text-muted-foreground">Mock Paystack</span>
            <span className="chip bg-muted/60 text-muted-foreground">No real payments</span>
            <span className="chip bg-primary/15 text-primary">Demo build</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
