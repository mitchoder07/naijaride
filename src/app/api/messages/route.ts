import { NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { pusher } from "@/lib/pusher";

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const { bookingId, text } = body;

    const trimmed = (text ?? "").trim();
    if (!trimmed) {
      return NextResponse.json({ error: "Message required" }, { status: 400 });
    }

    // Save message to database
    const message = await db.message.create({
      data: { bookingId, senderId: user.id, text: trimmed },
      include: {
        sender: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    // Broadcast via Pusher to everyone in this booking's channel
    await pusher.trigger(`booking-${bookingId}`, "chat:message", { message });

    return NextResponse.json({ message }, { status: 201 });
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[messages POST]", err);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}