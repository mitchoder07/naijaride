import { NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const user = await requireUser();
    const notifications = await db.notificationLog.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    const unread = await db.notificationLog.count({
      where: { userId: user.id, read: false },
    });
    return NextResponse.json({ notifications, unread });
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error("[notifications GET]", err);
    return NextResponse.json(
      { error: "Failed to load notifications" },
      { status: 500 },
    );
  }
}

export async function PATCH() {
  try {
    const user = await requireUser();
    await db.notificationLog.updateMany({
      where: { userId: user.id, read: false },
      data: { read: true },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error("[notifications PATCH]", err);
    return NextResponse.json(
      { error: "Failed to mark notifications read" },
      { status: 500 },
    );
  }
}
