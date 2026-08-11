import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ userId: string }> },
) {
  try {
    const { userId } = await ctx.params;
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        role: true,
        createdAt: true,
      },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const tripsCount = await db.trip.count({
      where: { driverId: userId, status: "COMPLETED" },
    });

    const reviews = await db.review.findMany({
      where: { booking: { trip: { driverId: userId } } },
      select: { rating: true },
    });
    const avgRating =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

    const recentReviews = await db.review.findMany({
      where: { booking: { trip: { driverId: userId } } },
      include: {
        reviewer: { select: { id: true, name: true, avatarUrl: true } },
        booking: {
          select: {
            trip: { select: { originLabel: true, destinationLabel: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    return NextResponse.json({
      user,
      stats: {
        tripsCompleted: tripsCount,
        totalReviews: reviews.length,
        avgRating: Math.round(avgRating * 10) / 10,
      },
      recentReviews,
    });
  } catch (err) {
    console.error("[profile/[userId]]", err);
    return NextResponse.json(
      { error: "Failed to load profile" },
      { status: 500 },
    );
  }
}
