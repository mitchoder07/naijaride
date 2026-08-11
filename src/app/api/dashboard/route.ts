import { NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const user = await requireUser();

    const [myTrips, myBookings, balance, transactions] = await Promise.all([
      db.trip.findMany({
        where: { driverId: user.id },
        include: {
          bookings: { select: { id: true, status: true, seatsBooked: true } },
        },
        orderBy: { departureAt: "desc" },
      }),
      db.booking.findMany({
        where: { passengerId: user.id },
        include: {
          trip: {
            select: {
              id: true,
              originLabel: true,
              destinationLabel: true,
              departureAt: true,
              status: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      db.user
        .findUnique({ where: { id: user.id }, select: { walletBalance: true } })
        .then((u) => u?.walletBalance ?? 0),
      db.walletTransaction.count({ where: { userId: user.id } }),
    ]);

    const upcomingTripsAsDriver = myTrips.filter(
      (t) =>
        t.status === "OPEN" && new Date(t.departureAt).getTime() > Date.now(),
    );
    const upcomingBookings = myBookings.filter(
      (b) =>
        (b.status === "CONFIRMED" || b.status === "PENDING") &&
        new Date(b.trip.departureAt).getTime() > Date.now(),
    );

    const earnings = myBookings
      .filter(
        (b) =>
          b.status === "CONFIRMED" || b.status === "COMPLETED",
      )
      .reduce((sum, b) => sum + Math.round(b.fareTotal * 0.9) - b.commission, 0);

    const allActivity = [
      ...myTrips.map((t) => ({
        type: "trip" as const,
        id: t.id,
        title: `${t.originLabel} → ${t.destinationLabel}`,
        subtitle: `${t.seatsAvailable}/${t.seatsTotal} seats`,
        date: t.createdAt,
      })),
      ...myBookings.map((b) => ({
        type: "booking" as const,
        id: b.id,
        title: `${b.trip.originLabel} → ${b.trip.destinationLabel}`,
        subtitle: `${b.seatsBooked} seat(s) • ${b.status}`,
        date: b.createdAt,
      })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json({
      stats: {
        totalTrips: myTrips.length,
        upcomingTrips: upcomingTripsAsDriver.length,
        upcomingBookings: upcomingBookings.length,
        totalBookings: myBookings.length,
        walletBalance: balance,
        transactions,
        earnings,
      },
      upcomingTrips: upcomingTripsAsDriver,
      upcomingBookings,
      recentActivity: allActivity.slice(0, 8),
    });
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[dashboard GET]", err);
    return NextResponse.json(
      { error: "Failed to load dashboard" },
      { status: 500 },
    );
  }
}
