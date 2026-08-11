import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * GET /api/safety/share/[token]
 * Public endpoint — returns trip + driver info for a share token.
 * Used by emergency contacts / loved ones to track a live trip.
 */
export async function GET(_req: Request, ctx: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await ctx.params;
    const share = await db.tripShare.findUnique({
      where: { token },
      include: {
        trip: {
          include: {
            driver: { select: { id: true, name: true, avatarUrl: true, phone: true, trustScore: true, isVerified: true } },
          },
        },
        user: { select: { id: true, name: true, phone: true } },
      },
    });
    if (!share) return NextResponse.json({ error: "Invalid or expired link" }, { status: 404 });
    if (share.expiresAt < new Date()) {
      return NextResponse.json({ error: "This share link has expired" }, { status: 410 });
    }
    return NextResponse.json({
      share: {
        token: share.token,
        audience: share.audience,
        expiresAt: share.expiresAt,
      },
      trip: {
        id: share.trip.id,
        originLabel: share.trip.originLabel,
        destinationLabel: share.trip.destinationLabel,
        departureAt: share.trip.departureAt,
        vehicleModel: share.trip.vehicleModel,
        vehicleColor: share.trip.vehicleColor,
        vehiclePlate: share.trip.vehiclePlate,
        currentLat: share.trip.currentLat,
        currentLng: share.trip.currentLng,
        tripStartedAt: share.trip.tripStartedAt,
        tripEndedAt: share.trip.tripEndedAt,
        status: share.trip.status,
        driver: share.trip.driver,
      },
      sharedBy: share.user,
    });
  } catch (err) {
    console.error("[share/[token] GET]", err);
    return NextResponse.json({ error: "Failed to load share" }, { status: 500 });
  }
}
