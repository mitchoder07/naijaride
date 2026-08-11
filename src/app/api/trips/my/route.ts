import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const trips = await db.trip.findMany({
      where: { driverId: user.id },
      include: {
        bookings: {
          include: {
            passenger: {
              select: { id: true, name: true, avatarUrl: true },
            },
          },
        },
      },
      orderBy: { departureAt: "desc" },
    });
    return NextResponse.json({ trips });
  } catch (err) {
    console.error("[trips/my]", err);
    return NextResponse.json(
      { error: "Failed to load your trips" },
      { status: 500 },
    );
  }
}
