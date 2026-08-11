import { NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";

export async function GET(
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
    if (user.id !== booking.passengerId && user.id !== booking.trip.driverId) {
      return NextResponse.json(
        { error: "Not authorized to view this chat" },
        { status: 403 },
      );
    }

    const messages = await db.message.findMany({
      where: { bookingId: id },
      include: {
        sender: { select: { id: true, name: true, avatarUrl: true } },
      },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json({ messages });
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[messages GET]", err);
    return NextResponse.json(
      { error: "Failed to load messages" },
      { status: 500 },
    );
  }
}
