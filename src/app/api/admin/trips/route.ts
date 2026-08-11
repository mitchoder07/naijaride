import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/session";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const status = url.searchParams.get("status") || undefined;
    const limit = Math.min(Number(url.searchParams.get("limit") ?? 50), 200);

    const trips = await db.trip.findMany({
      where: status ? { status: status as "OPEN" | "FULL" | "COMPLETED" | "CANCELLED" } : undefined,
      include: {
        driver: { select: { id: true, name: true, avatarUrl: true, email: true } },
        _count: { select: { bookings: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return NextResponse.json({ trips });
  } catch (err) {
    if (err instanceof Error && (err.message === "Unauthorized" || err.message === "Forbidden")) {
      return NextResponse.json({ error: err.message }, { status: err.message === "Forbidden" ? 403 : 401 });
    }
    console.error("[admin trips]", err);
    return NextResponse.json({ error: "Failed to load trips" }, { status: 500 });
  }
}
