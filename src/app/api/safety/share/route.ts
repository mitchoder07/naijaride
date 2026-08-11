import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";

const schema = z.object({
  tripId: z.string().min(1, "Trip required"),
  audience: z.enum(["PUBLIC_LINK", "EMERGENCY_CONTACT", "PLATFORM"]).default("PUBLIC_LINK"),
  expiresInHours: z.number().int().min(1).max(72).default(24),
});

/**
 * POST /api/safety/share
 * Create a tokenized shareable link for live trip tracking.
 */
export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid" }, { status: 400 });

    // Verify the user owns or has a booking on this trip
    const trip = await db.trip.findUnique({ where: { id: parsed.data.tripId } });
    if (!trip) return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    const isDriver = trip.driverId === user.id;
    const isPassenger = await db.booking.findFirst({
      where: { tripId: trip.id, passengerId: user.id, status: { in: ["CONFIRMED", "COMPLETED"] } },
    });
    if (!isDriver && !isPassenger) {
      return NextResponse.json({ error: "Not authorized to share this trip" }, { status: 403 });
    }

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + parsed.data.expiresInHours);

    const share = await db.tripShare.create({
      data: {
        tripId: trip.id,
        userId: user.id,
        audience: parsed.data.audience,
        expiresAt,
      },
    });

    return NextResponse.json({
      share,
      url: `/?view=track&token=${share.token}`,
    }, { status: 201 });
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error("[share POST]", err);
    return NextResponse.json({ error: "Failed to create share link" }, { status: 500 });
  }
}
