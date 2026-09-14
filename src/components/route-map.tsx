"use client";

import { MapPin, Navigation } from "lucide-react";
import { cn } from "@/lib/utils";

export interface RoutePoint {
  label: string;
  lat: number;
  lng: number;
}

export function RouteMap({
  origin,
  destination,
  waypoints = [],
  className,
}: {
  origin: RoutePoint;
  destination: RoutePoint;
  waypoints?: RoutePoint[];
  className?: string;
}) {
  const all = [origin, ...waypoints, destination];
  // Normalize coords into a 0-100 viewbox range
  const lats = all.map((p) => p.lat);
  const lngs = all.map((p) => p.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const latRange = Math.max(maxLat - minLat, 0.001);
  const lngRange = Math.max(maxLng - minLng, 0.001);

  const W = 100;
  const H = 100;
  const PAD = 14;

  const project = (p: RoutePoint) => {
    const x = PAD + ((p.lng - minLng) / lngRange) * (W - 2 * PAD);
    const y = PAD + ((maxLat - p.lat) / latRange) * (H - 2 * PAD);
    return { x, y };
  };

  const points = all.map(project);
  const pathD = points
    .map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`))
    .join(" ");

  return (
    <div
      className={cn(
        "relative w-full rounded-xl overflow-hidden bg-grid-warm bg-accent/30 border border-border",
        className,
      )}
      role="img"
      aria-label={`Route from ${origin.label} to ${destination.label}`}
    >
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute inset-0 w-full h-full"
      >
        <defs>
          <filter id="soft" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow
              dx="0"
              dy="0"
              stdDeviation="0.5"
              floodColor="var(--foreground)"
              floodOpacity="0.15"
            />
          </filter>
        </defs>
        <path
          d={pathD}
          fill="none"
          stroke="var(--primary)"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="0.5 1.5"
          filter="url(#soft)"
        />
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={i === 0 || i === points.length - 1 ? 2.4 : 1.4}
            fill={i === 0 ? "var(--primary)" : i === points.length - 1 ? "var(--chart-4)" : "var(--muted-foreground)"}
            stroke="var(--background)"
            strokeWidth="0.6"
          />
        ))}
      </svg>

      {/* Origin label — top left, with solid background for readability */}
      <div className="absolute top-3 left-3 z-10 max-w-[55%]">
        <div className="flex items-center gap-1.5 bg-background/95 backdrop-blur border border-border/60 rounded-full pl-1.5 pr-2.5 py-1 shadow-sm">
          <div className="size-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0">
            <MapPin className="size-3" />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] uppercase tracking-wider text-muted-foreground leading-none mb-0.5">
              From
            </p>
            <p className="text-xs font-semibold truncate leading-none">
              {origin.label}
            </p>
          </div>
        </div>
      </div>

      {/* Destination label — bottom right, with solid background */}
      <div className="absolute bottom-3 right-3 z-10 max-w-[55%]">
        <div className="flex items-center gap-1.5 bg-background/95 backdrop-blur border border-border/60 rounded-full pl-2.5 pr-1.5 py-1 shadow-sm">
          <div className="min-w-0 text-right">
            <p className="text-[9px] uppercase tracking-wider text-muted-foreground leading-none mb-0.5">
              To
            </p>
            <p className="text-xs font-semibold truncate leading-none">
              {destination.label}
            </p>
          </div>
          <div className="size-5 rounded-full bg-chart-4 text-primary-foreground flex items-center justify-center shrink-0">
            <Navigation className="size-3" />
          </div>
        </div>
      </div>
    </div>
  );
}
