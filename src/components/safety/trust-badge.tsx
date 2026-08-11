"use client";

import { ShieldCheck, Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface TrustBadgeProps {
  verified: boolean;
  score?: number;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
  showScore?: boolean;
}

export function TrustBadge({
  verified,
  score = 0,
  size = "md",
  className,
  showScore = true,
}: TrustBadgeProps) {
  if (!verified && score === 0) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-muted text-muted-foreground",
          className,
        )}
        title="Unverified user — encourage them to verify their identity"
      >
        <ShieldCheck className="size-3" />
        Unverified
      </span>
    );
  }

  const tier =
    score >= 80
      ? "bg-chart-2/15 text-chart-2 border-chart-2/30"
      : score >= 60
        ? "bg-primary/15 text-primary border-primary/30"
        : score >= 40
          ? "bg-chart-3/15 text-chart-3 border-chart-3/30"
          : "bg-destructive/15 text-destructive border-destructive/30";

  const sizeCls =
    size === "xs"
      ? "text-[10px] px-1.5 py-0.5 gap-0.5"
      : size === "sm"
        ? "text-xs px-2 py-0.5 gap-1"
        : size === "lg"
          ? "text-sm px-3 py-1 gap-1.5"
          : "text-xs px-2 py-0.5 gap-1";

  const iconSize =
    size === "xs" ? "size-2.5" : size === "sm" ? "size-3" : size === "lg" ? "size-4" : "size-3.5";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border font-semibold",
        tier,
        sizeCls,
        className,
      )}
      title={`Trust score: ${score}/100`}
    >
      <ShieldCheck className={iconSize} />
      {verified ? "Verified" : "Trust"}
      {showScore && (
        <span className="tabular-nums ml-0.5 opacity-80">· {score}</span>
      )}
    </span>
  );
}

export function TrustMeter({ score, verified }: { score: number; verified: boolean }) {
  const pct = Math.max(0, Math.min(100, score));
  const tier =
    score >= 80
      ? "bg-chart-2"
      : score >= 60
        ? "bg-primary"
        : score >= 40
          ? "bg-chart-3"
          : "bg-destructive";
  const label =
    score >= 80 ? "Excellent" : score >= 60 ? "Good" : score >= 40 ? "Fair" : "Low";
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-2 font-semibold">
          <ShieldCheck className="size-4 text-primary" />
          Trust score
          {verified && (
            <span className="text-xs bg-chart-2/15 text-chart-2 px-2 py-0.5 rounded-full">
              Identity verified
            </span>
          )}
        </span>
        <span className="tabular-nums font-bold">
          {score}<span className="text-muted-foreground font-normal">/100</span>
        </span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full ${tier} transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        {label} — based on identity verification, completed trips, and reviews.
      </p>
    </div>
  );
}
