import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";

const reviewSchema = z.object({
  bookingId: z.string(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional(),
});

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const parsed = reviewSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 },
      );
    }

    const booking = await db.booking.findUnique({
      where: { id: parsed.data.bookingId },
      include: { trip: true },
    });
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }
    if (booking.passengerId !== user.id) {
      return NextResponse.json(
        { error: "Only the passenger can review this booking" },
        { status: 403 },
      );
    }
    if (booking.status !== "COMPLETED") {
      return NextResponse.json(
        { error: "You can only review completed trips" },
        { status: 400 },
      );
    }

    const existing = await db.review.findUnique({
      where: { bookingId_reviewerId: { bookingId: booking.id, reviewerId: user.id } },
    });
    if (existing) {
      return NextResponse.json(
        { error: "You have already reviewed this booking" },
        { status: 400 },
      );
    }

    const review = await db.review.create({
      data: {
        bookingId: booking.id,
        reviewerId: user.id,
        rating: parsed.data.rating,
        comment: parsed.data.comment ?? null,
      },
    });
    return NextResponse.json({ review }, { status: 201 });
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[reviews POST]", err);
    return NextResponse.json(
      { error: "Failed to submit review" },
      { status: 500 },
    );
  }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const bookingId = url.searchParams.get("bookingId");
    const userId = url.searchParams.get("userId");

    if (bookingId) {
      const reviews = await db.review.findMany({
        where: { bookingId },
        include: { reviewer: { select: { id: true, name: true, avatarUrl: true } } },
      });
      return NextResponse.json({ reviews });
    }

    if (userId) {
      const reviews = await db.review.findMany({
        where: { booking: { trip: { driverId: userId } } },
        include: {
          reviewer: { select: { id: true, name: true, avatarUrl: true } },
          booking: { select: { id: true, trip: { select: { originLabel: true, destinationLabel: true } } } },
        },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json({ reviews });
    }

    return NextResponse.json(
      { error: "Provide bookingId or userId" },
      { status: 400 },
    );
  } catch (err) {
    console.error("[reviews GET]", err);
    return NextResponse.json(
      { error: "Failed to load reviews" },
      { status: 500 },
    );
  }
}
