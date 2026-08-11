import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { recalcTrustScore } from "@/lib/trust";

const schema = z.object({
  subjectId: z.string().min(1, "Subject required"),
  bookingId: z.string().optional(),
  type: z.enum([
    "DRIVER_DIDNT_SHOW",
    "RECKLESS_DRIVING",
    "HARASSMENT",
    "SUSPECTED_KIDNAPPING",
    "THEFT",
    "OFFLINE_MEETING_REQUEST",
    "FAKE_IDENTITY",
    "OTHER",
  ]),
  description: z.string().min(10, "Please describe what happened (at least 10 characters)"),
});

/**
 * POST /api/safety/incidents
 * File a safety incident report against another user.
 * SUSPECTED_KIDNAPPING auto-escalates to severity 5 (immediate admin review).
 */
export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid" }, { status: 400 });

    if (parsed.data.subjectId === user.id) {
      return NextResponse.json({ error: "Cannot report yourself" }, { status: 400 });
    }

    const severity =
      parsed.data.type === "SUSPECTED_KIDNAPPING" ? 5
      : parsed.data.type === "HARASSMENT" || parsed.data.type === "THEFT" ? 4
      : parsed.data.type === "RECKLESS_DRIVING" || parsed.data.type === "FAKE_IDENTITY" ? 3
      : 2;

    const incident = await db.safetyIncident.create({
      data: {
        reporterId: user.id,
        subjectId: parsed.data.subjectId,
        bookingId: parsed.data.bookingId ?? null,
        type: parsed.data.type,
        description: parsed.data.description,
        severity,
        status: "REPORTED",
      },
    });

    // Notify all admins (severity 5 = immediate escalation)
    const admins = await db.user.findMany({ where: { role: "ADMIN" } });
    if (admins.length > 0) {
      const subject = await db.user.findUnique({ where: { id: parsed.data.subjectId }, select: { name: true, email: true } });
      await db.$transaction(
        admins.map((a) =>
          db.notificationLog.create({
            data: {
              userId: a.id,
              title: severity === 5 ? "🚨 CRITICAL: Suspected kidnapping report" : `New safety report: ${parsed.data.type}`,
              body: `${user.name} reported ${subject?.name ?? subject?.email}. Severity: ${severity}/5. View in admin dashboard.`,
              type: "SAFETY_UPDATE",
            },
          }),
        ),
      );
    }

    // Recalc the subject's trust score (penalty applied)
    await recalcTrustScore(parsed.data.subjectId);

    return NextResponse.json({ incident }, { status: 201 });
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error("[incidents POST]", err);
    return NextResponse.json({ error: "Failed to file report" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const user = await requireUser();
    const incidents = await db.safetyIncident.findMany({
      where: { OR: [{ reporterId: user.id }, { subjectId: user.id }] },
      include: {
        reporter: { select: { id: true, name: true, avatarUrl: true } },
        subject: { select: { id: true, name: true, avatarUrl: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    return NextResponse.json({ incidents });
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Failed to load incidents" }, { status: 500 });
  }
}
