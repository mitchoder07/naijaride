import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/session";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const limit = Math.min(Number(url.searchParams.get("limit") ?? 50), 200);
    const users = await db.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        role: true,
        isDemo: true,
        walletBalance: true,
        createdAt: true,
        _count: {
          select: {
            tripsAsDriver: true,
            bookings: true,
            reviewsGiven: true,
            reviewsReceived: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return NextResponse.json({ users });
  } catch (err) {
    if (err instanceof Error && (err.message === "Unauthorized" || err.message === "Forbidden"))
      return NextResponse.json({ error: err.message }, { status: err.message === "Forbidden" ? 403 : 401 });
    console.error("[admin users]", err);
    return NextResponse.json({ error: "Failed to load users" }, { status: 500 });
  }
}
