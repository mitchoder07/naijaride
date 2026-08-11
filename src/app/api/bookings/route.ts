import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";

const createBookingSchema = z.object({
  tripId: z.string(),
  seatsBooked: z.number().int().min(1).max(4),
});

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const parsed = createBookingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 },
      );
    }

    const trip = await db.trip.findUnique({ where: { id: parsed.data.tripId } });
    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }
    if (trip.driverId === user.id) {
      return NextResponse.json(
        { error: "You can't book your own trip" },
        { status: 400 },
      );
    }
    if (trip.status !== "OPEN") {
      return NextResponse.json(
        { error: "Trip is not available for booking" },
        { status: 400 },
      );
    }
    if (parsed.data.seatsBooked > trip.seatsAvailable) {
      return NextResponse.json(
        { error: "Not enough seats available" },
        { status: 400 },
      );
    }

    const existing = await db.booking.findFirst({
      where: {
        tripId: trip.id,
        passengerId: user.id,
        status: { in: ["PENDING", "CONFIRMED"] },
      },
    });
    if (existing) {
      return NextResponse.json(
        { error: "You already have an active booking for this trip" },
        { status: 400 },
      );
    }

    const fareTotal = trip.pricePerSeat * parsed.data.seatsBooked;
    const commission = Math.round(fareTotal * 0.1);

    const booking = await db.booking.create({
      data: {
        tripId: trip.id,
        passengerId: user.id,
        seatsBooked: parsed.data.seatsBooked,
        fareTotal,
        commission,
        status: "PENDING",
      },
    });
    return NextResponse.json({ booking }, { status: 201 });
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[bookings POST]", err);
    return NextResponse.json(
      { error: "Failed to create booking" },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    const user = await requireUser();
    const bookings = await db.booking.findMany({
      where: { passengerId: user.id },
      include: {
        trip: {
          include: {
            driver: {
              select: { id: true, name: true, avatarUrl: true, phone: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ bookings });
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[bookings GET]", err);
    return NextResponse.json(
      { error: "Failed to load bookings" },
      { status: 500 },
    );
  }
}
