import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";

const schema = z.object({
  blockedId: z.string().min(1, "User required"),
  reason: z.string().optional(),
});

export async function GET() {
  try {
    const user = await requireUser();
    const blocks = await db.block.findMany({
      where: { blockerId: user.id },
      include: { blocked: { select: { id: true, name: true, avatarUrl: true } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ blocks });
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Failed to load blocks" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid" }, { status: 400 });
    if (parsed.data.blockedId === user.id) return NextResponse.json({ error: "Cannot block yourself" }, { status: 400 });

    const block = await db.block.upsert({
      where: { blockerId_blockedId: { blockerId: user.id, blockedId: parsed.data.blockedId } },
      create: { blockerId: user.id, blockedId: parsed.data.blockedId, reason: parsed.data.reason ?? null },
      update: { reason: parsed.data.reason ?? null },
    });
    return NextResponse.json({ block }, { status: 201 });
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error("[blocks POST]", err);
    return NextResponse.json({ error: "Failed to block user" }, { status: 500 });
  }
}
