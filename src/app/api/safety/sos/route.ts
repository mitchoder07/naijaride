import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";

const schema = z.object({
  bookingId: z.string().optional(),
  tripId: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  message: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
    }

    const alert = await db.sosAlert.create({
      data: {
        userId: user.id,
        bookingId: parsed.data.bookingId ?? null,
        tripId: parsed.data.tripId ?? null,
        lat: parsed.data.lat ?? null,
        lng: parsed.data.lng ?? null,
        message: parsed.data.message ?? "I feel unsafe. Please check on me.",
        status: "PENDING",
      },
    });

    const contacts = await db.emergencyContact.findMany({ where: { userId: user.id } });
    const adminUsers = await db.user.findMany({ where: { role: "ADMIN" } });
    const mapsLink = parsed.data.lat && parsed.data.lng ? ` https://maps.google.com/?q=${parsed.data.lat},${parsed.data.lng}` : "";

    const notifs = [
      ...contacts.map((c) => db.notificationLog.create({
        data: {
          userId: user.id,
          title: `SOS sent to ${c.name}`,
          body: `We've alerted ${c.name} (${c.phone}) of your emergency.${mapsLink}`,
          type: "SOS_ALERT",
          bookingId: parsed.data.bookingId ?? null,
        },
      })),
      ...adminUsers.map((a) => db.notificationLog.create({
        data: {
          userId: a.id,
          title: "SOS alert received",
          body: `${user.name} triggered an SOS.${mapsLink} View alert #${alert.id.slice(-6)}.`,
          type: "SOS_ALERT",
          bookingId: parsed.data.bookingId ?? null,
        },
      })),
    ];

    if (notifs.length > 0) await db.$transaction(notifs);

    return NextResponse.json({ alert, contactsNotified: contacts.length, adminsNotified: adminUsers.length, ok: true }, { status: 201 });
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error("[sos POST]", err);
    return NextResponse.json({ error: "Failed to send SOS" }, { status: 500 });
  }
}
