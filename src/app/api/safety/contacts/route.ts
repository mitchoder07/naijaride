import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";

const schema = z.object({
  name: z.string().min(2, "Name required"),
  phone: z.string().min(7, "Valid phone required"),
  relationship: z.string().optional(),
});

export async function GET() {
  try {
    const user = await requireUser();
    const contacts = await db.emergencyContact.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ contacts });
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Failed to load contacts" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid" }, { status: 400 });
    const contact = await db.emergencyContact.create({
      data: { userId: user.id, name: parsed.data.name, phone: parsed.data.phone, relationship: parsed.data.relationship ?? null },
    });
    return NextResponse.json({ contact }, { status: 201 });
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error("[contacts POST]", err);
    return NextResponse.json({ error: "Failed to add contact" }, { status: 500 });
  }
}
