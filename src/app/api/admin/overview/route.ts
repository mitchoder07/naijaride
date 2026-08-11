import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/session";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const [users, drivers, passengers, trips, bookings, confirmedBookings, totalCommission, totalGmv] =
      await Promise.all([
        db.user.count(),
        db.user.count({ where: { role: { in: ["DRIVER", "BOTH"] } } }),
        db.user.count({ where: { role: { in: ["PASSENGER", "BOTH"] } } }),
        db.trip.count(),
        db.booking.count(),
        db.booking.count({ where: { status: "CONFIRMED" } }),
        db.booking.aggregate({ _sum: { commission: true }, where: { status: { in: ["CONFIRMED", "COMPLETED"] } } }),
        db.booking.aggregate({ _sum: { fareTotal: true }, where: { status: { in: ["CONFIRMED", "COMPLETED"] } } }),
      ]);

    // Last 14 days of GMV
    const since = new Date();
    since.setDate(since.getDate() - 14);
    const recentBookings = await db.booking.findMany({
      where: { createdAt: { gte: since }, status: { in: ["CONFIRMED", "COMPLETED"] } },
      select: { fareTotal: true, commission: true, createdAt: true },
    });

    const gmvByDay: { date: string; gmv: number; commission: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const day = new Date();
      day.setHours(0, 0, 0, 0);
      day.setDate(day.getDate() - i);
      const dayStart = day.getTime();
      const dayEnd = dayStart + 24 * 60 * 60 * 1000;
      const dayBookings = recentBookings.filter((b) => {
        const t = new Date(b.createdAt).getTime();
        return t >= dayStart && t < dayEnd;
      });
      gmvByDay.push({
        date: day.toISOString().split("T")[0],
        gmv: dayBookings.reduce((s, b) => s + b.fareTotal, 0),
        commission: dayBookings.reduce((s, b) => s + b.commission, 0),
      });
    }

    // Top routes by trip count
    const topRoutesRaw = await db.trip.groupBy({
      by: ["originLabel", "destinationLabel"],
      _count: true,
      orderBy: { _count: { id: "desc" } },
      take: 5,
    });
    const topRoutes = topRoutesRaw.map((r) => ({
      route: `${r.originLabel} → ${r.destinationLabel}`,
      trips: r._count.id,
    }));

    return NextResponse.json({
      counts: {
        users,
        drivers,
        passengers,
        trips,
        bookings,
        confirmedBookings,
      },
      gmv: totalGmv._sum.fareTotal ?? 0,
      commission: totalCommission._sum.commission ?? 0,
      gmvByDay,
      topRoutes,
    });
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (err instanceof Error && err.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error("[admin overview]", err);
    return NextResponse.json(
      { error: "Failed to load admin overview" },
      { status: 500 },
    );
  }
}
