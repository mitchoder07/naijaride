import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await ctx.params;
    const trip = await db.trip.findUnique({
      where: { id },
      include: {
        driver: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            phone: true,
            createdAt: true,
          },
        },
        bookings: {
          include: {
            passenger: {
              select: { id: true, name: true, avatarUrl: true },
            },
          },
        },
      },
    });
    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    // Reviews live on bookings, so we fetch them via the booking relation.
    const reviews = await db.review.findMany({
      where: { booking: { tripId: id } },
      include: {
        reviewer: { select: { id: true, name: true, avatarUrl: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const user = await getCurrentUser();
    let existingBooking:
      | { id: string; status: string; tripId: string }
      | null = null;
    if (user) {
      existingBooking = await db.booking.findFirst({
        where: {
          tripId: id,
          passengerId: user.id,
          status: { in: ["PENDING", "CONFIRMED"] },
        },
        select: { id: true, status: true, tripId: true },
      });
    }
    return NextResponse.json({
      trip: { ...trip, reviews },
      existingBooking,
      viewerId: user?.id ?? null,
    });
  } catch (err) {
    console.error("[trips/[id]]", err);
    return NextResponse.json(
      { error: "Failed to load trip" },
      { status: 500 },
    );
  }
}
