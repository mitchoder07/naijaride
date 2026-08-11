"use client";

import { cn } from "@/lib/utils";

interface LogoProps {
  size?: number;
  withWordmark?: boolean;
  className?: string;
  onClick?: () => void;
}

/**
 * NaijaRide Stamp Logo — a passport-stamp style circular emblem
 * featuring a stylised road converging to a sunset.
 * Uses currentColor so it adapts to light/dark mode automatically.
 */
export function Logo({ size = 40, withWordmark = true, className, onClick }: LogoProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="NaijaRide home"
      className={cn("flex items-center gap-2.5 group", className)}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 transition-transform group-hover:rotate-[6deg] group-hover:scale-105"
      >
        {/* Outer stamp ring — bold primary */}
        <circle
          cx="24"
          cy="24"
          r="22"
          stroke="currentColor"
          strokeWidth="2.5"
          className="text-primary"
          strokeDasharray="2.5 3.2"
          fill="none"
        />
        {/* Inner sun */}
        <circle
          cx="24"
          cy="18"
          r="6"
          className="text-primary"
          fill="currentColor"
        />
        {/* Road converging to horizon — uses foreground color (adapts to theme) */}
        <path
          d="M6 42 L20 26 L28 26 L42 42 Z"
          className="text-foreground"
          fill="currentColor"
        />
        {/* Road dashes */}
        <path
          d="M24 26 L24 42"
          stroke="oklch(0.985 0.012 75)"
          strokeWidth="1.5"
          strokeDasharray="2 2"
          opacity="0.9"
        />
        {/* Stars (Nigerian flag hint) */}
        <path
          d="M11 9 L12 11.5 L14.5 12 L12.5 13.5 L13 16 L11 14.5 L9 16 L9.5 13.5 L7.5 12 L10 11.5 Z"
          className="text-foreground"
          fill="currentColor"
          opacity="0.7"
        />
      </svg>
      {withWordmark && (
        <span className="font-display font-bold tracking-tight text-lg leading-none">
          Naija<span className="text-primary">Ride</span>
        </span>
      )}
    </button>
  );
}

/** Larger demo logo for landing / auth pages — theme-aware */
export function LogoEmblem({ size = 120 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="drop-shadow-sm"
    >
      <defs>
        <linearGradient id="nr-sunset" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="oklch(0.78 0.14 75)" />
          <stop offset="60%" stopColor="oklch(0.62 0.21 38)" />
          <stop offset="100%" stopColor="oklch(0.45 0.18 290)" />
        </linearGradient>
        <radialGradient id="nr-sun" cx="50%" cy="35%" r="50%">
          <stop offset="0%" stopColor="oklch(0.9 0.18 70)" />
          <stop offset="100%" stopColor="oklch(0.62 0.21 38)" />
        </radialGradient>
      </defs>

      {/* Stamp ring — primary orange (works on both themes) */}
      <circle
        cx="60"
        cy="60"
        r="55"
        stroke="oklch(0.62 0.21 38)"
        strokeWidth="3"
        strokeDasharray="3 4"
        fill="none"
      />
      {/* Inner circle — uses currentColor (foreground) for border, transparent fill */}
      <circle
        cx="60"
        cy="60"
        r="50"
        className="text-foreground"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />

      {/* Sunset sky */}
      <rect x="14" y="14" width="92" height="44" fill="url(#nr-sunset)" rx="6" />

      {/* Sun disc */}
      <circle cx="60" cy="42" r="14" fill="url(#nr-sun)" />

      {/* Sun bands */}
      <path d="M14 56 L106 56" stroke="oklch(0.985 0.012 75)" strokeWidth="2" opacity="0.5" />
      <path d="M14 50 L106 50" stroke="oklch(0.985 0.012 75)" strokeWidth="1" opacity="0.35" />

      {/* Road converging to horizon — uses currentColor (foreground) */}
      <path
        d="M14 106 L46 60 L74 60 L106 106 Z"
        className="text-foreground"
        fill="currentColor"
      />
      {/* Road centre line */}
      <path
        d="M60 60 L60 106"
        stroke="oklch(0.985 0.012 75)"
        strokeWidth="2"
        strokeDasharray="3 4"
      />

      {/* Three small stars — Nigerian flag hint */}
      <g fill="oklch(0.985 0.012 75)">
        <circle cx="32" cy="26" r="1.5" />
        <circle cx="44" cy="22" r="1" />
        <circle cx="78" cy="22" r="1" />
        <circle cx="90" cy="26" r="1.5" />
      </g>

      {/* Wordmark below — uses currentColor (foreground) */}
      <text
        x="60"
        y="116"
        textAnchor="middle"
        fontFamily="var(--font-display), sans-serif"
        fontSize="11"
        fontWeight="800"
        letterSpacing="0.15em"
        className="text-foreground"
        fill="currentColor"
      >
        NAJARIDE
      </text>
    </svg>
  );
}
