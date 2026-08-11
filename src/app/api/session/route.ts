import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  const uid = (session?.user as { id?: string } | undefined)?.id;
  if (!uid) return NextResponse.json({ user: null });

  const user = await db.user.findUnique({
    where: { id: uid },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      role: true,
      avatarUrl: true,
      walletBalance: true,
      isDemo: true,
      createdAt: true,
    },
  });
  return NextResponse.json({ user });
}
