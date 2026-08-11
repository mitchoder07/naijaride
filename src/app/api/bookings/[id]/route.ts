import { NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();
    const { id } = await ctx.params;
    const booking = await db.booking.findUnique({
      where: { id },
      include: {
        trip: {
          include: {
            driver: {
              select: { id: true, name: true, avatarUrl: true, phone: true },
            },
          },
        },
        passenger: { select: { id: true, name: true, avatarUrl: true } },
        messages: {
          include: {
            sender: { select: { id: true, name: true, avatarUrl: true } },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }
    if (booking.passengerId !== user.id && booking.trip.driverId !== user.id) {
      return NextResponse.json(
        { error: "You don't have access to this booking" },
        { status: 403 },
      );
    }
    return NextResponse.json({
      booking,
      isPassenger: booking.passengerId === user.id,
      isDriver: booking.trip.driverId === user.id,
      counterpart:
        booking.passengerId === user.id
          ? booking.trip.driver
          : booking.passenger,
    });
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[bookings/[id]]", err);
    return NextResponse.json(
      { error: "Failed to load booking" },
      { status: 500 },
    );
  }
}
