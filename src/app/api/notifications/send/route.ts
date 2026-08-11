import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";

// Enable push subscription (mock FCM-style). The user can opt in to
// browser notifications through this endpoint.
const schema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
  type: z.string().min(1),
  bookingId: z.string().optional(),
});

/**
 * POST /api/notifications/send
 * Triggers an in-app notification. The client subscribes to a Notification toast.
 * (In a production build, this would also call FCM/admin.messaging().)
 */
export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 },
      );
    }
    const notif = await db.notificationLog.create({
      data: {
        userId: user.id,
        title: parsed.data.title,
        body: parsed.data.body,
        type: parsed.data.type,
        bookingId: parsed.data.bookingId ?? null,
      },
    });

    // Mock FCM delivery — in production we'd send via admin.messaging().
    // The client should already be subscribed to local notifications via
    // Notification.requestPermission().

    return NextResponse.json({ notification: notif, ok: true }, { status: 201 });
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error("[notifications POST]", err);
    return NextResponse.json(
      { error: "Failed to send notification" },
      { status: 500 },
    );
  }
}
