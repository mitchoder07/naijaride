import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { recalcTrustScore } from "@/lib/trust";

const schema = z.object({
  type: z.enum(["NIN", "DRIVERS_LICENSE", "VEHICLE_PLATE", "SELFIE", "PHONE", "EMAIL"]),
  reference: z.string().optional(),
  documentUrl: z.string().optional(),
});

export async function GET() {
  try {
    const user = await requireUser();
    const verifications = await db.verification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ verifications });
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Failed to load verifications" }, { status: 500 });
  }
}

/**
 * POST /api/safety/verifications
 * Submit a verification document. Status starts as PENDING.
 * For demo: PHONE and EMAIL auto-approve; others stay PENDING (admin reviews).
 */
export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid" }, { status: 400 });

    const autoApprove = parsed.data.type === "PHONE" || parsed.data.type === "EMAIL";
    const status = autoApprove ? "APPROVED" : "PENDING";

    // Upsert (one verification per type per user)
    const verification = await db.verification.upsert({
      where: { userId_type: { userId: user.id, type: parsed.data.type } },
      create: {
        userId: user.id,
        type: parsed.data.type,
        status: status as "PENDING" | "APPROVED",
        reference: parsed.data.reference ?? null,
        documentUrl: parsed.data.documentUrl ?? null,
        reviewedAt: autoApprove ? new Date() : null,
      },
      update: {
        status: status as "PENDING" | "APPROVED",
        reference: parsed.data.reference ?? null,
        documentUrl: parsed.data.documentUrl ?? null,
        reviewedAt: autoApprove ? new Date() : null,
        rejectionReason: null,
      },
    });

    // Recompute trust score + isVerified flag
    await recalcTrustScore(user.id);

    return NextResponse.json({ verification }, { status: 201 });
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error("[verifications POST]", err);
    return NextResponse.json({ error: "Failed to submit verification" }, { status: 500 });
  }
}
