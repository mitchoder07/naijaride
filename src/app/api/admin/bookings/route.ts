import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/session";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const limit = Math.min(Number(url.searchParams.get("limit") ?? 50), 200);
    const bookings = await db.booking.findMany({
      include: {
        trip: { select: { id: true, originLabel: true, destinationLabel: true, departureAt: true } },
        passenger: { select: { id: true, name: true, avatarUrl: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return NextResponse.json({ bookings });
  } catch (err) {
    if (err instanceof Error && (err.message === "Unauthorized" || err.message === "Forbidden"))
      return NextResponse.json({ error: err.message }, { status: err.message === "Forbidden" ? 403 : 401 });
    console.error("[admin bookings]", err);
    return NextResponse.json({ error: "Failed to load bookings" }, { status: 500 });
  }
}
