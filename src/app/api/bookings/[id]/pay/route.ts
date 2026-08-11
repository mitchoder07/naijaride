import { NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();
    const { id } = await ctx.params;

    const booking = await db.booking.findUnique({
      where: { id },
      include: { trip: true },
    });
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }
    if (booking.passengerId !== user.id) {
      return NextResponse.json(
        { error: "Only the passenger can pay for this booking" },
        { status: 403 },
      );
    }
    if (booking.status !== "PENDING") {
      return NextResponse.json(
        { error: "Booking is not pending payment" },
        { status: 400 },
      );
    }
    if (booking.trip.status !== "OPEN") {
      return NextResponse.json(
        { error: "Trip is no longer available" },
        { status: 400 },
      );
    }
    if (booking.trip.seatsAvailable < booking.seatsBooked) {
      return NextResponse.json(
        { error: "Not enough seats remaining" },
        { status: 400 },
      );
    }

    // Mock Paystack reference
    const paystackRef = `PS-mock-${Date.now()}`;

    // Determine driver's net earning (90% of fare)
    const driverNetEarning = Math.round(booking.fareTotal * 0.9) - booking.commission;

    // Confirm booking & decrement seats
    const [updatedBooking] = await db.$transaction([
      db.booking.update({
        where: { id },
        data: {
          status: "CONFIRMED",
          paystackRef,
        },
      }),
      db.trip.update({
        where: { id: booking.tripId },
        data: {
          seatsAvailable: { decrement: booking.seatsBooked },
          status:
            booking.trip.seatsAvailable - booking.seatsBooked <= 0
              ? "FULL"
              : "OPEN",
        },
      }),
      db.walletTransaction.create({
        data: {
          userId: booking.trip.driverId,
          amount: Math.round(booking.fareTotal * 0.9),
          signed: 1,
          type: "EARNING",
          bookingId: booking.id,
        },
      }),
      db.walletTransaction.create({
        data: {
          userId: booking.trip.driverId,
          amount: booking.commission,
          signed: -1,
          type: "COMMISSION",
          bookingId: booking.id,
        },
      }),
      db.user.update({
        where: { id: booking.trip.driverId },
        data: {
          walletBalance: { increment: driverNetEarning },
        },
      }),
      // Notify the driver of the confirmed booking
      db.notificationLog.create({
        data: {
          userId: booking.trip.driverId,
          title: "Booking confirmed",
          body: `Your trip from ${booking.trip.originLabel} to ${booking.trip.destinationLabel} has a new confirmed booking (${booking.seatsBooked} seat(s)).`,
          type: "BOOKING_CONFIRMED",
          bookingId: booking.id,
        },
      }),
      // Notify the passenger of confirmation
      db.notificationLog.create({
        data: {
          userId: booking.passengerId,
          title: "Payment confirmed",
          body: `Your seat${booking.seatsBooked > 1 ? "s" : ""} on ${booking.trip.originLabel} → ${booking.trip.destinationLabel} ${
            booking.seatsBooked > 1 ? "are" : "is"
          } confirmed. Reference ${paystackRef}.`,
          type: "BOOKING_CONFIRMED",
          bookingId: booking.id,
        },
      }),
    ]);

    return NextResponse.json({
      booking: updatedBooking,
      reference: paystackRef,
      success: true,
    });
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[bookings/[id]/pay]", err);
    return NextResponse.json(
      { error: "Payment failed" },
      { status: 500 },
    );
  }
}
